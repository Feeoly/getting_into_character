import { db } from "../../../../_lib/db";
import {
  BACKGROUND_SOURCE_SCHEMA,
  makeDefaultRehearsalSettings,
  PAUSE_THRESHOLD_DEFAULT_MS,
  PAUSE_THRESHOLD_MAX_MS,
  PAUSE_THRESHOLD_MIN_MS,
  REHEARSAL_SETTINGS_SCHEMA,
  UPLOADED_BACKGROUND_MAX_BYTES,
  UPLOADED_BACKGROUND_SCHEMA,
  type RehearsalSettings,
  type UploadedBackground,
} from "./rehearsalTypes";

function clampInt(n: number, min: number, max: number): number {
  const v = Math.round(n);
  return Math.max(min, Math.min(max, v));
}

function coerceSettings(
  input: Partial<RehearsalSettings> & { sessionId: string },
): RehearsalSettings {
  const base = makeDefaultRehearsalSettings(input.sessionId);

  const pauseThresholdMs =
    typeof input.pauseThresholdMs === "number"
      ? clampInt(input.pauseThresholdMs, PAUSE_THRESHOLD_MIN_MS, PAUSE_THRESHOLD_MAX_MS)
      : PAUSE_THRESHOLD_DEFAULT_MS;

  const backgroundSource = BACKGROUND_SOURCE_SCHEMA.safeParse(input.backgroundSource)
    .success
    ? (input.backgroundSource as RehearsalSettings["backgroundSource"])
    : base.backgroundSource;

  const next: RehearsalSettings = {
    ...base,
    ...input,
    pauseThresholdMs,
    pausePromptEnabled:
      typeof input.pausePromptEnabled === "boolean"
        ? input.pausePromptEnabled
        : base.pausePromptEnabled,
    backgroundSource,
    updatedAt: Date.now(),
  };

  const parsed = REHEARSAL_SETTINGS_SCHEMA.safeParse(next);
  return parsed.success ? parsed.data : base;
}

export async function getRehearsalSettings(
  sessionId: string,
): Promise<RehearsalSettings> {
  try {
    const row = await db.rehearsalSettings.get(sessionId);
    if (!row) return makeDefaultRehearsalSettings(sessionId);

    const parsed = REHEARSAL_SETTINGS_SCHEMA.safeParse(row);
    if (parsed.success) return parsed.data;

    return makeDefaultRehearsalSettings(sessionId);
  } catch {
    return makeDefaultRehearsalSettings(sessionId);
  }
}

export async function saveRehearsalSettings(settings: RehearsalSettings): Promise<void> {
  const coerced = coerceSettings(settings);
  await db.rehearsalSettings.put(coerced);
}

export async function saveUploadedBackground(input: {
  blob: Blob;
  filename?: string;
  mimeType?: string;
}): Promise<string> {
  const mimeType = input.mimeType ?? input.blob.type ?? "application/octet-stream";

  if (!mimeType.startsWith("image/")) {
    throw new Error("仅支持上传图片文件。");
  }

  const size = input.blob.size;
  if (size > UPLOADED_BACKGROUND_MAX_BYTES) {
    throw new Error("图片过大。请上传不超过 10MB 的图片。");
  }

  const id =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const row: UploadedBackground = {
    id,
    blob: input.blob,
    mimeType,
    filename: input.filename,
    size,
    createdAt: Date.now(),
  };

  const parsed = UPLOADED_BACKGROUND_SCHEMA.safeParse(row);
  if (!parsed.success) throw new Error("无法保存该图片。");

  await db.uploadedBackgrounds.put(parsed.data);
  return id;
}

export async function getUploadedBackground(id: string): Promise<UploadedBackground | null> {
  try {
    const row = await db.uploadedBackgrounds.get(id);
    if (!row) return null;

    const parsed = UPLOADED_BACKGROUND_SCHEMA.safeParse(row);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

