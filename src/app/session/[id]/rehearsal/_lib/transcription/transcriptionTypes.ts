import { z } from "zod";

/** 与 UI-SPEC / Dexie job 状态一致 */
export const TRANSCRIPTION_JOB_STATUS_SCHEMA = z.enum([
  "queued",
  "processing",
  "succeeded",
  "failed",
]);
export type TranscriptionJobStatus = z.infer<typeof TRANSCRIPTION_JOB_STATUS_SCHEMA>;

export const TRANSCRIPT_TEXT_MAX = 16_000;

export const TRANSCRIPTION_JOB_ROW_SCHEMA = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  takeId: z.string().min(1),
  status: TRANSCRIPTION_JOB_STATUS_SCHEMA,
  mimeType: z.string().min(1).max(256),
  duration_ms: z.number().int().nonnegative().optional(),
  attempt: z.number().int().nonnegative(),
  engineId: z.string().min(1),
  modelId: z.string().min(1),
  errorCode: z.string().max(64).optional(),
  errorMessage: z.string().max(2000).optional(),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  audioBlob: z.instanceof(Blob),
});

export type TranscriptionJobRow = z.infer<typeof TRANSCRIPTION_JOB_ROW_SCHEMA>;

export const TRANSCRIPT_SEGMENT_ROW_SCHEMA = z.object({
  id: z.string().min(1),
  jobId: z.string().min(1),
  sessionId: z.string().min(1),
  takeId: z.string().min(1),
  idx: z.number().int().nonnegative(),
  /**相对本轮录制起点，与 pauseEvents.start_ms 同源 */
  start_ms: z.number().int().nonnegative(),
  end_ms: z.number().int().nonnegative(),
  text: z.string().max(TRANSCRIPT_TEXT_MAX),
});

export type TranscriptSegmentRow = z.infer<typeof TRANSCRIPT_SEGMENT_ROW_SCHEMA>;

export type TranscriptChunk = {
  idx: number;
  start_ms: number;
  end_ms: number;
  text: string;
};
