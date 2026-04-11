"use client";

import { HF_TRANSCRIPTION_ENGINE_ID, WHISPER_MODEL_ID } from "./hfWhisperEngine";
import type { TranscriptChunk } from "./transcriptionTypes";
import {
  enqueueTranscriptionJob,
  getJob,
  getLatestJobForTake,
  hasPendingJobForTake,
  listProcessingJobIds,
  markJobFailed,
  markJobProcessing,
  markJobSucceeded,
  supersedeActiveJobsForTake,
} from "./transcriptRepo";

/** STT-03：验收时可对照 — ① DevTools Network 中不应出现第三方「语音转写 SaaS」API；② 仅 HF 静态权重域名（如 cdn-lfs.huggingface.co）的 GET。 */
const MAX_BLOB_BYTES = 200 * 1024 * 1024;
const TARGET_RATE = 16_000;

const queue: string[] = [];
const queuedSet = new Set<string>();
const inFlightJobs = new Set<string>();
let draining = false;
let worker: Worker | null = null;

const JOB_TIMEOUT_MS = 15 * 60_000;

const DBG = "[transcription]";

function pushJobToQueue(jobId: string) {
  if (inFlightJobs.has(jobId)) return;
  if (queuedSet.has(jobId)) return;
  queuedSet.add(jobId);
  queue.push(jobId);
  console.log(`${DBG} queue push`, { jobId, depth: queue.length });
}

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

/**
 * 必须在任意展示转写状态的客户端页面挂载（含会话详情）：否则刷新后 processing 任务不会继续跑 Worker。
 */
export function startTranscriptionRunner(): void {
  if (typeof window === "undefined") return;
  void (async () => {
    const processingIds = await listProcessingJobIds();
    if (processingIds.length > 0) {
      console.log(`${DBG} resume processing jobs`, { count: processingIds.length, ids: processingIds });
    }
    for (const id of processingIds) pushJobToQueue(id);
    void drainQueue();
  })();
}

function ensureWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./transcriptionWorker.ts", import.meta.url), {
      type: "module",
    });
    worker.addEventListener("error", (e) => {
      console.error("[transcription] Worker error:", e.message);
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
  if (input.blob.size === 0) {
    console.log(`${DBG} skip enqueue: empty blob`, { takeId: input.takeId });
    return;
  }
  if (input.blob.size > MAX_BLOB_BYTES) {
    console.log(`${DBG} skip enqueue: blob too large`, { takeId: input.takeId, bytes: input.blob.size });
    return;
  }
  if (await hasPendingJobForTake(input.takeId)) {
    console.log(`${DBG} skip enqueue: pending job for take`, { takeId: input.takeId });
    return;
  }

  const jobId = await enqueueTranscriptionJob({
    sessionId: input.sessionId,
    takeId: input.takeId,
    blob: input.blob.slice(0, input.blob.size),
    mimeType: input.mimeType,
    duration_ms: input.duration_ms,
    engineId: HF_TRANSCRIPTION_ENGINE_ID,
    modelId: WHISPER_MODEL_ID,
  });
  console.log(`${DBG} enqueued after recording`, { jobId, takeId: input.takeId, bytes: input.blob.size });
  pushJobToQueue(jobId);
  void drainQueue();
}

/**
 * @returns 是否已成功重新入队（false：无可用录音 Blob等）
 */
export async function retryTranscriptionForTake(
  sessionId: string,
  takeId: string,
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  startTranscriptionRunner();
  console.log(`${DBG} retry: supersede active jobs`, { sessionId, takeId });
  await supersedeActiveJobsForTake(takeId);
  const prev = await getLatestJobForTake(sessionId, takeId);
  if (!prev || prev.audioBlob.size === 0) {
    console.log(`${DBG} retry: no blob from latest job`, {
      takeId,
      hasPrev: Boolean(prev),
      blobBytes: prev?.audioBlob.size ?? 0,
    });
    return false;
  }

  try {
    const jobId = await enqueueTranscriptionJob({
      sessionId,
      takeId,
      blob: prev.audioBlob.slice(0, prev.audioBlob.size),
      mimeType: prev.mimeType,
      duration_ms: prev.duration_ms,
      engineId: HF_TRANSCRIPTION_ENGINE_ID,
      modelId: WHISPER_MODEL_ID,
    });
    console.log(`${DBG} retry: new job enqueued`, { jobId, takeId, bytes: prev.audioBlob.size });
    pushJobToQueue(jobId);
    void drainQueue();
    return true;
  } catch (e) {
    console.warn(`${DBG} retry: enqueue failed`, e);
    return false;
  }
}

async function drainQueue() {
  if (draining) return;
  draining = true;
  try {
    while (queue.length > 0) {
      const jobId = queue.shift();
      if (jobId) {
        queuedSet.delete(jobId);
        await processJob(jobId);
      }
    }
  } finally {
    draining = false;
  }
}

async function processJob(jobId: string) {
  if (inFlightJobs.has(jobId)) {
    console.log(`${DBG} processJob skip: already in flight`, { jobId });
    return;
  }
  const job = await getJob(jobId);
  if (!job) {
    console.log(`${DBG} processJob skip: job missing`, { jobId });
    return;
  }
  if (job.status !== "queued" && job.status !== "processing") {
    console.log(`${DBG} processJob skip: status not runnable`, { jobId, status: job.status });
    return;
  }
  inFlightJobs.add(jobId);
  console.log(`${DBG} processJob start`, {
    jobId,
    takeId: job.takeId,
    status: job.status,
    blobBytes: job.audioBlob.size,
    mimeType: job.mimeType,
  });

  try {
    if (job.audioBlob.size > MAX_BLOB_BYTES) {
      console.warn(`${DBG} fail: blob too large`, { jobId, bytes: job.audioBlob.size });
      await markJobFailed(jobId, "blob_too_large", "录音文件过大，无法转写。");
      emitJobFailed({ jobId, sessionId: job.sessionId, takeId: job.takeId });
      return;
    }

    if (job.status === "queued") {
      await markJobProcessing(jobId);
      console.log(`${DBG} marked processing`, { jobId });
    }

    let samples: Float32Array;
    try {
      console.log(`${DBG} decode start`, { jobId });
      samples = await decodeBlobToMono16k(job.audioBlob);
      console.log(`${DBG} decode ok`, { jobId, samples: samples.length });
      if (samples.length === 0) {
        emitModelLoading(false);
        await markJobFailed(jobId, "empty_audio", "无有效音频数据。");
        emitJobFailed({ jobId, sessionId: job.sessionId, takeId: job.takeId });
        return;
      }
    } catch (e) {
      emitModelLoading(false);
      console.warn(`${DBG} decode error`, { jobId, err: e });
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
    let settled = false;

    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        w.removeEventListener("message", onMessage);
        w.removeEventListener("messageerror", onMsgErr);
        emitModelLoading(false);
        console.warn(`${DBG} worker timeout`, { jobId, ms: JOB_TIMEOUT_MS });
        reject(new Error("转写超时，请重试或检查网络与控制台错误。"));
      }, JOB_TIMEOUT_MS);

      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        fn();
      };

      const onMsgErr = () => {
        finish(() => {
          w.removeEventListener("message", onMessage);
          w.removeEventListener("messageerror", onMsgErr);
          emitModelLoading(false);
          console.warn(`${DBG} worker messageerror`, { jobId });
          reject(new Error("Worker 消息异常（可能为模型脚本加载失败）。"));
        });
      };

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
          console.log(`${DBG} worker model_loading`, { jobId });
        }
        if (m.type === "chunk") chunks.push(m.chunk);
        if (m.type === "done") {
          finish(() => {
            w.removeEventListener("message", onMessage);
            w.removeEventListener("messageerror", onMsgErr);
            emitModelLoading(false);
            console.log(`${DBG} worker done`, { jobId, chunkCount: chunks.length });
            resolve();
          });
        }
        if (m.type === "error") {
          finish(() => {
            w.removeEventListener("message", onMessage);
            w.removeEventListener("messageerror", onMsgErr);
            emitModelLoading(false);
            console.warn(`${DBG} worker error message`, { jobId, message: m.message });
            reject(new Error(m.message));
          });
        }
      };
      w.addEventListener("message", onMessage);
      w.addEventListener("messageerror", onMsgErr);
      const copy = new Float32Array(samples.length);
      copy.set(samples);
      console.log(`${DBG} post to worker`, { jobId, samples: copy.length });
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
    const liveOk = await getJob(jobId);
    if (!liveOk || liveOk.status !== "processing") {
      console.log(`${DBG} skip markJobSucceeded (job superseded or not processing)`, {
        jobId,
        status: liveOk?.status,
      });
      return;
    }
    await markJobSucceeded(jobId, chunks);
    console.log(`${DBG} succeeded`, { jobId, takeId: job.takeId, segments: chunks.length });
  } catch (e) {
    const liveFail = await getJob(jobId);
    if (!liveFail || liveFail.status !== "processing") {
      console.log(`${DBG} skip markJobFailed after error (job not processing)`, {
        jobId,
        status: liveFail?.status,
        err: e,
      });
      return;
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`${DBG} mark failed`, { jobId, message: msg });
    await markJobFailed(
      jobId,
      "worker_error",
      msg,
    );
    emitJobFailed({ jobId, sessionId: job.sessionId, takeId: job.takeId });
  } finally {
    inFlightJobs.delete(jobId);
    console.log(`${DBG} processJob end`, { jobId });
  }
}
