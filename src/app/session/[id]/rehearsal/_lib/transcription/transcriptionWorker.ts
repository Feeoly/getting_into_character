/// <reference lib="webworker" />

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

// transformers 的 web 入口在模块求值时会读 window；Dedicated Worker 无 window
void (function polyfillWindowForHfInWorker() {
  const gt = globalThis as unknown as Record<string, unknown>;
  if (typeof gt.window === "undefined") {
    gt.window = globalThis;
  }
})();

const DBG = "[transcription:worker]";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipePromise: Promise<any> | null = null;

async function getTranscriber() {
  if (!pipePromise) {
    const { env, pipeline } = await import("@huggingface/transformers");
    env.useBrowserCache = true;
    env.allowLocalModels = false;
    // Worker 直连 huggingface.co 易 Failed to fetch（网络/扩展等）；改走同源 /api/hf 代理
    const origin =
      typeof self !== "undefined" && typeof self.location?.origin === "string"
        ? self.location.origin
        : "";
    const directHub =
      typeof process !== "undefined" && process.env?.NEXT_PUBLIC_HF_HUB_DIRECT === "1";
    if (origin && !directHub) {
      env.remoteHost = `${origin}/api/hf/`;
    }
    // 不强制 q8：部分环境下量化配置会导致 pipeline 卡住或失败，交给库默认选型
    pipePromise = pipeline("automatic-speech-recognition", WHISPER_MODEL_ID);
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
  console.log(`${DBG} transcribe`, { jobId, samples: samples.length, sampleRate });
  if (sampleRate !== 16_000) {
    post({
      type: "error",
      jobId,
      message: `sampleRate 须为 16000，当前 ${sampleRate}`,
    });
    return;
  }
  if (samples.length === 0) {
    post({ type: "error", jobId, message: "音频长度为 0，无法转写。" });
    return;
  }
  try {
    post({ type: "model_loading", jobId });
    console.log(`${DBG} load pipeline / model`, { jobId, modelId: WHISPER_MODEL_ID });
    const transcriber = await getTranscriber();
    console.log(`${DBG} pipeline ready, infer`, { jobId });
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

    console.log(`${DBG} infer done`, {
      jobId,
      rawChunks: rawChunks?.length ?? 0,
      fallbackText: Boolean(output.text?.trim()),
    });
    post({ type: "done", jobId });
  } catch (e) {
    pipePromise = null;
    console.warn(`${DBG} error`, { jobId, err: e });
    post({
      type: "error",
      jobId,
      message: e instanceof Error ? e.message : String(e),
    });
  }
};
