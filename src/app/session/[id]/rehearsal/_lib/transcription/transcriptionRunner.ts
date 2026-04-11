"use client";

import { HF_TRANSCRIPTION_ENGINE_ID, WHISPER_MODEL_ID } from "./hfWhisperEngine";
import type { TranscriptChunk } from "./transcriptionTypes";
import {
  enqueueTranscriptionJob,
  getJob,
  getLatestJobForTake,
  hasPendingJobForTake,
  markJobFailed,
  markJobProcessing,
  markJobSucceeded,
} from "./transcriptRepo";

/** STT-03：验收时可对照 — ① DevTools Network 中不应出现第三方「语音转写 SaaS」API；② 仅 HF 静态权重域名（如 cdn-lfs.huggingface.co）的 GET。 */
const MAX_BLOB_BYTES = 200 * 1024 * 1024;
const TARGET_RATE = 16_000;

const queue: string[] = [];
let draining = false;
let worker: Worker | null = null;

const modelLoading = new Set<(v: boolean) => void>();
const jobFailed = new Set<
  (p: { jobId: string; sessionId: string; takeId: string }) => void
>();

export function subscribeTranscriptionModelLoading(
  cb: (loading: boolean) => void,
): () => void {
  modelLoading.add(cb);
  return () => modelLoading.delete(cb);
}

export function subscribeTranscriptionJobFailed(
  cb: (p: { jobId: string; sessionId: string; takeId: string }) => void,
): () => void {
  jobFailed.add(cb);
  return () => jobFailed.delete(cb);
}

function emitModelLoading(v: boolean) {
  for (const cb of modelLoading) cb(v);
}

function emitJobFailed(p: {
  jobId: string;
  sessionId: string;
  takeId: string;
}) {
  for (const cb of jobFailed) cb(p);
}

export function startTranscriptionRunner(): void {
  if (typeof window === "undefined") return;
}

function ensureWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./transcriptionWorker.ts", import.meta.url), {
      type: "module",
    });
  }
  return worker;
}

function mixToMono(audioBuffer: AudioBuffer): AudioBuffer {
  if (audioBuffer.numberOfChannels === 1) return audioBuffer;
  const { sampleRate, length } = audioBuffer;
  const out = new AudioBuffer({ length, sampleRate, numberOfChannels: 1 });
  const dst = out.getChannelData(0);
  const n = audioBuffer.numberOfChannels;
  for (let c = 0; c < n; c++) {
    const ch = audioBuffer.getChannelData(c);
    for (let i = 0; i < length; i++) dst[i] += ch[i] / n;
  }
  return out;
}

export async function decodeBlobToMono16k(blob: Blob): Promise<Float32Array> {
  const ctx = new AudioContext();
  try {
    const ab = await blob.arrayBuffer();
    const decoded = await ctx.decodeAudioData(ab.slice(0));
    const mono = mixToMono(decoded);
    const offline = new OfflineAudioContext(
      1,
      Math.max(1, Math.ceil(mono.duration * TARGET_RATE)),
      TARGET_RATE,
    );
    const src = offline.createBufferSource();
    src.buffer = mono;
    src.connect(offline.destination);
    src.start(0);
    const rendered = await offline.startRendering();
    return rendered.getChannelData(0);
  } finally {
    await ctx.close();
  }
}

export type EnqueueAfterRecordingInput = {
  sessionId: string;
  takeId: string;
  blob: Blob;
  mimeType: string;
  duration_ms?: number;
};

export async function enqueueTranscriptionAfterRecording(
  input: EnqueueAfterRecordingInput,
): Promise<void> {
  if (typeof window === "undefined") return;
  startTranscriptionRunner();
  if (input.blob.size === 0) return;
  if (input.blob.size > MAX_BLOB_BYTES) return;
  if (await hasPendingJobForTake(input.takeId)) return;

  const jobId = await enqueueTranscriptionJob({
    sessionId: input.sessionId,
    takeId: input.takeId,
    blob: input.blob.slice(0, input.blob.size),
    mimeType: input.mimeType,
    duration_ms: input.duration_ms,
    engineId: HF_TRANSCRIPTION_ENGINE_ID,
    modelId: WHISPER_MODEL_ID,
  });
  queue.push(jobId);
  void drainQueue();
}

export async function retryTranscriptionForTake(
  sessionId: string,
  takeId: string,
): Promise<void> {
  if (typeof window === "undefined") return;
  const prev = await getLatestJobForTake(sessionId, takeId);
  if (!prev) return;
  if (await hasPendingJobForTake(takeId)) return;

  const jobId = await enqueueTranscriptionJob({
    sessionId,
    takeId,
    blob: prev.audioBlob.slice(0, prev.audioBlob.size),
    mimeType: prev.mimeType,
    duration_ms: prev.duration_ms,
    engineId: HF_TRANSCRIPTION_ENGINE_ID,
    modelId: WHISPER_MODEL_ID,
  });
  queue.push(jobId);
  void drainQueue();
}

async function drainQueue() {
  if (draining) return;
  draining = true;
  try {
    while (queue.length > 0) {
      const jobId = queue.shift();
      if (jobId) await processJob(jobId);
    }
  } finally {
    draining = false;
  }
}

async function processJob(jobId: string) {
  const job = await getJob(jobId);
  if (!job || job.status !== "queued") return;

  if (job.audioBlob.size > MAX_BLOB_BYTES) {
    await markJobFailed(jobId, "blob_too_large", "录音文件过大，无法转写。");
    emitJobFailed({ jobId, sessionId: job.sessionId, takeId: job.takeId });
    return;
  }

  await markJobProcessing(jobId);

  let samples: Float32Array;
  try {
    samples = await decodeBlobToMono16k(job.audioBlob);
  } catch (e) {
    emitModelLoading(false);
    await markJobFailed(
      jobId,
      "decode_error",
      e instanceof Error ? e.message : "音频解码失败",
    );
    emitJobFailed({ jobId, sessionId: job.sessionId, takeId: job.takeId });
    return;
  }

  const w = ensureWorker();
  const chunks: TranscriptChunk[] = [];
  let loadingEmitted = false;

  try {
    await new Promise<void>((resolve, reject) => {
      const onMessage = (ev: MessageEvent) => {
        const m = ev.data as
          | { type: "model_loading"; jobId: string }
          | {
              type: "chunk";
              jobId: string;
              chunk: TranscriptChunk;
            }
          | { type: "done"; jobId: string }
          | { type: "error"; jobId: string; message: string };
        if (!m || m.jobId !== jobId) return;
        if (m.type === "model_loading" && !loadingEmitted) {
          loadingEmitted = true;
          emitModelLoading(true);
        }
        if (m.type === "chunk") chunks.push(m.chunk);
        if (m.type === "done") {
          w.removeEventListener("message", onMessage);
          emitModelLoading(false);
          resolve();
        }
        if (m.type === "error") {
          w.removeEventListener("message", onMessage);
          emitModelLoading(false);
          reject(new Error(m.message));
        }
      };
      w.addEventListener("message", onMessage);
      const copy = new Float32Array(samples.length);
      copy.set(samples);
      w.postMessage(
        {
          type: "transcribe",
          jobId,
          samples: copy,
          sampleRate: TARGET_RATE,
        } as const,
        [copy.buffer],
      );
    });
    await markJobSucceeded(jobId, chunks);
  } catch (e) {
    await markJobFailed(
      jobId,
      "worker_error",
      e instanceof Error ? e.message : String(e),
    );
    emitJobFailed({ jobId, sessionId: job.sessionId, takeId: job.takeId });
  }
}
