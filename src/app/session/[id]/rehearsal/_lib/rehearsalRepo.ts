import { db } from "../../../../_lib/db";
import {
  BACKGROUND_SOURCE_SCHEMA,
  makeDefaultRehearsalSettings,
  PAUSE_EVENT_SCHEMA,
  PAUSE_THRESHOLD_DEFAULT_MS,
  PAUSE_THRESHOLD_MAX_MS,
  PAUSE_THRESHOLD_MIN_MS,
  REHEARSAL_SETTINGS_SCHEMA,
  UPLOADED_BACKGROUND_MAX_BYTES,
  UPLOADED_BACKGROUND_SCHEMA,
  type PauseEvent,
  type RehearsalSettings,
  type UploadedBackground,
} from "./rehearsalTypes";

/** 同步「当前 id」与 id 列表，兼容仅有 uploadedBackgroundId 的旧数据 */
export function mergeUploadedBackgroundFields(s: RehearsalSettings): RehearsalSettings {
  const rawList = s.uploadedBackgroundIds;
  const listFromField =
    Array.isArray(rawList) && rawList.length > 0
      ? rawList.filter((x): x is string => typeof x === "string" && x.length > 0)
      : [];
  const ids = [...new Set(listFromField)];
  if (s.uploadedBackgroundId && !ids.includes(s.uploadedBackgroundId)) {
    ids.push(s.uploadedBackgroundId);
  }
  if (ids.length === 0) {
    return { ...s, uploadedBackgroundId: undefined, uploadedBackgroundIds: undefined };
  }
  let active = s.uploadedBackgroundId;
  if (!active || !ids.includes(active)) {
    active = ids[ids.length - 1]!;
  }
  return { ...s, uploadedBackgroundId: active, uploadedBackgroundIds: ids };
}

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

  const next = mergeUploadedBackgroundFields({
    ...base,
    ...input,
    sessionId: input.sessionId,
    pauseThresholdMs,
    pausePromptEnabled:
      typeof input.pausePromptEnabled === "boolean"
        ? input.pausePromptEnabled
        : base.pausePromptEnabled,
    presetVideoLoop:
      typeof input.presetVideoLoop === "boolean" ? input.presetVideoLoop : base.presetVideoLoop,
    backgroundSource,
    updatedAt: Date.now(),
  });

  const parsed = REHEARSAL_SETTINGS_SCHEMA.safeParse(next);
  return parsed.success ? mergeUploadedBackgroundFields(parsed.data) : base;
}

export async function getRehearsalSettings(
  sessionId: string,
): Promise<RehearsalSettings> {
  try {
    const row = await db.rehearsalSettings.get(sessionId);
    if (!row) return makeDefaultRehearsalSettings(sessionId);

    const parsed = REHEARSAL_SETTINGS_SCHEMA.safeParse(row);
    if (parsed.success) return mergeUploadedBackgroundFields(parsed.data);

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

export async function deleteUploadedBackground(id: string): Promise<void> {
  await db.uploadedBackgrounds.delete(id);
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

export type AddPauseEventInput = Omit<PauseEvent, "id" | "createdAt" | "takeId"> & {
  takeId: string;
};

export async function addPauseEvent(event: AddPauseEventInput): Promise<void> {
  const createdAt = Date.now();
  const id =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${event.sessionId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const row: PauseEvent = {
    ...event,
    id,
    start_ms: Math.max(0, Math.round(event.start_ms)),
    duration_ms: Math.max(0, Math.round(event.duration_ms)),
    threshold_ms: Math.max(0, Math.round(event.threshold_ms)),
    createdAt,
  };

  const parsed = PAUSE_EVENT_SCHEMA.safeParse(row);
  if (!parsed.success) return;

  await db.pauseEvents.put(parsed.data);
}

export async function listPauseEvents(sessionId: string): Promise<PauseEvent[]> {
  const rows = await db.pauseEvents.where("sessionId").equals(sessionId).sortBy("start_ms");
  const events: PauseEvent[] = [];
  for (const row of rows) {
    const parsed = PAUSE_EVENT_SCHEMA.safeParse(row);
    if (parsed.success) events.push(parsed.data);
  }
  return events;
}

/** 仅含绑定 takeId 的停顿；无 takeId 的历史行不会出现 */
export async function listPauseEventsForTake(
  sessionId: string,
  takeId: string,
): Promise<PauseEvent[]> {
  const rows = await db.pauseEvents
    .where("[sessionId+takeId]")
    .equals([sessionId, takeId])
    .sortBy("start_ms");
  const events: PauseEvent[] = [];
  for (const row of rows) {
    const parsed = PAUSE_EVENT_SCHEMA.safeParse(row);
    if (parsed.success) events.push(parsed.data);
  }
  return events;
}

