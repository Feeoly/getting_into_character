import type { TranscriptChunk } from "./transcriptionTypes";

export type TranscriptionInput = {
  audioUrl: string;
  mimeType: string;
  duration_ms?: number;
};

/** 可插拔引擎：异步迭代分片（主线程或 Worker 实现） */
export type TranscriptionEngine = {
  readonly id: string;
  transcribe(input: TranscriptionInput): AsyncIterable<TranscriptChunk>;
};
