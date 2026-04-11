/// <reference lib="webworker" />

import { env, pipeline } from "@huggingface/transformers";

import { WHISPER_MODEL_ID } from "./hfWhisperEngine";

type MainToWorker = {
  type: "transcribe";
  jobId: string;
  samples: Float32Array;
  sampleRate: number;
};

type WorkerToMain =
  | { type: "model_loading"; jobId: string }
  | {
      type: "chunk";
      jobId: string;
      chunk: { idx: number; start_ms: number; end_ms: number; text: string };
    }
  | { type: "done"; jobId: string }
  | { type: "error"; jobId: string; message: string };

declare const self: DedicatedWorkerGlobalScope;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipePromise: any = null;

async function getTranscriber() {
  if (!pipePromise) {
    env.useBrowserCache = true;
    env.allowLocalModels = false;
    pipePromise = pipeline("automatic-speech-recognition", WHISPER_MODEL_ID, {
      dtype: "q8",
    });
  }
  return pipePromise;
}

function post(o: WorkerToMain) {
  self.postMessage(o);
}

self.onmessage = async (ev: MessageEvent<MainToWorker>) => {
  const data = ev.data;
  if (data?.type !== "transcribe") return;
  const { jobId, samples, sampleRate } = data;
  if (sampleRate !== 16_000) {
    post({
      type: "error",
      jobId,
      message: `sampleRate 须为 16000，当前 ${sampleRate}`,
    });
    return;
  }
  try {
    post({ type: "model_loading", jobId });
    const transcriber = await getTranscriber();
    const output = (await transcriber(samples, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
      task: "transcribe",
    })) as {
      text?: string;
      chunks?: Array<{ timestamp?: [number, number | null]; text?: string }>;
    };

    const durMs = Math.round((samples.length / 16_000) * 1000);
    const rawChunks = output.chunks;

    if (rawChunks && rawChunks.length > 0) {
      rawChunks.forEach((c, idx) => {
        const ts = c.timestamp;
        const t0 = Array.isArray(ts) ? ts[0] : 0;
        const t1 = Array.isArray(ts) && ts.length > 1 ? ts[1] : null;
        const start_ms = Math.max(0, Math.round((t0 ?? 0) * 1000));
        let end_ms =
          t1 != null && !Number.isNaN(t1)
            ? Math.round(t1 * 1000)
            : Math.min(durMs, start_ms + 10_000);
        if (end_ms < start_ms) end_ms = start_ms;
        post({
          type: "chunk",
          jobId,
          chunk: {
            idx,
            start_ms,
            end_ms,
            text: String(c.text ?? "").trim(),
          },
        });
      });
    } else if (output.text?.trim()) {
      post({
        type: "chunk",
        jobId,
        chunk: { idx: 0, start_ms: 0, end_ms: durMs, text: output.text.trim() },
      });
    }

    post({ type: "done", jobId });
  } catch (e) {
    post({
      type: "error",
      jobId,
      message: e instanceof Error ? e.message : String(e),
    });
  }
};
