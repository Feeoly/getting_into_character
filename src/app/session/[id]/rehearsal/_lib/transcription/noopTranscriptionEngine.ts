import type { TranscriptionEngine } from "./transcriptionEngine";

/** 零网络占位，用于联调 Dexie / UI */
export function createNoopTranscriptionEngine(): TranscriptionEngine {
  return {
    id: "noop",
    async *transcribe() {
      // 故意不产生片段：验证「无转写」空态
    },
  };
}
