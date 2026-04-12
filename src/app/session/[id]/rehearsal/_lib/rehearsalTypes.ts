import { z } from "zod";

export const BACKGROUND_SOURCE_SCHEMA = z.enum([
  "preset_image",
  "preset_video",
  "upload_image",
]);
export type BackgroundSource = z.infer<typeof BACKGROUND_SOURCE_SCHEMA>;

export const PAUSE_THRESHOLD_MIN_MS = 1000;
export const PAUSE_THRESHOLD_MAX_MS = 30000;
export const PAUSE_THRESHOLD_DEFAULT_MS = 5000;

export const REHEARSAL_SETTINGS_SCHEMA = z.object({
  sessionId: z.string().min(1),
  pauseThresholdMs: z
    .number()
    .int()
    .min(PAUSE_THRESHOLD_MIN_MS)
    .max(PAUSE_THRESHOLD_MAX_MS),
  pausePromptEnabled: z.boolean(),
  backgroundSource: BACKGROUND_SOURCE_SCHEMA,
  presetId: z.string().min(1).optional(),
  uploadedBackgroundId: z.string().min(1).optional(),
  cameraEnabled: z.boolean(),
  updatedAt: z.number().int().nonnegative().optional(),
});

export type RehearsalSettings = z.infer<typeof REHEARSAL_SETTINGS_SCHEMA>;

export type RehearsalSettingsRow = RehearsalSettings;

export function makeDefaultRehearsalSettings(sessionId: string): RehearsalSettings {
  return {
    sessionId,
    pauseThresholdMs: PAUSE_THRESHOLD_DEFAULT_MS,
    pausePromptEnabled: true,
    backgroundSource: "preset_image",
    presetId: "bg-1",
    cameraEnabled: false,
    updatedAt: Date.now(),
  };
}

export const UPLOADED_BACKGROUND_MAX_BYTES = 10 * 1024 * 1024;

export const UPLOADED_BACKGROUND_SCHEMA = z.object({
  id: z.string().min(1),
  blob: z.instanceof(Blob),
  mimeType: z.string().min(1),
  filename: z.string().min(1).optional(),
  size: z.number().int().nonnegative(),
  createdAt: z.number().int().nonnegative(),
});

export type UploadedBackground = z.infer<typeof UPLOADED_BACKGROUND_SCHEMA>;

export type UploadedBackgroundRow = UploadedBackground;

export const PAUSE_EVENT_SCHEMA = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  /** Phase 4 起新事件必有；旧数据可能缺省，不参与按轮次复盘 */
  takeId: z.string().min(1).optional(),
  start_ms: z.number().int().nonnegative(),
  duration_ms: z.number().int().nonnegative(),
  threshold_ms: z.number().int().nonnegative(),
  prompt_shown: z.boolean(),
  /** 旧版会话状态已移除；新事件固定为 active */
  session_status: z.literal("active"),
  createdAt: z.number().int().nonnegative(),
});

export type PauseEvent = z.infer<typeof PAUSE_EVENT_SCHEMA>;

export type PauseEventRow = PauseEvent;

