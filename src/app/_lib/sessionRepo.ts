import { buildRoleCardText } from "../session/[id]/_lib/buildRoleCardText";
import { db } from "./db";
import {
  SESSION_SCHEMA,
  type RepoResult,
  type Session,
  type SessionRepoError,
  type SessionScene,
  type SessionRoleMoodPreset,
} from "./sessionTypes";

export async function listSessions(): Promise<Session[]> {
  const rows = await db.sessions.orderBy("createdAt").reverse().toArray();
  const sessions: Session[] = [];

  for (const row of rows) {
    const parsed = SESSION_SCHEMA.safeParse(row);
    if (parsed.success) sessions.push(parsed.data);
  }

  return sessions;
}

function makeId(): string {
  const c: Crypto | undefined =
    typeof globalThis !== "undefined" ? (globalThis.crypto as Crypto) : undefined;

  if (c?.randomUUID) return c.randomUUID();

  if (c?.getRandomValues) {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
      .slice(6, 8)
      .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toStorageError(): SessionRepoError {
  return {
    code: "storage_error",
    message:
      "操作失败。请刷新后重试；若仍失败，请检查浏览器存储权限或剩余空间。",
  };
}

export type CreateSessionCompleteInput = {
  scene: SessionScene;
  name?: string;
  moodPreset?: SessionRoleMoodPreset;
  moodCustom?: string;
  trigger: string;
};

/** 新建会话页一次性写入：场景、备注、角色卡（气质+触发物） */
export async function createSessionComplete(
  input: CreateSessionCompleteInput,
): Promise<RepoResult<Session>> {
  const trigger = input.trigger.trim();
  const custom = input.moodCustom?.trim() ?? "";
  const hasMood = Boolean(input.moodPreset) || custom.length > 0;
  if (!hasMood) {
    return {
      ok: false,
      error: {
        code: "validation_error",
        message: "请选择角色气质，或填写补充说明。",
      },
    };
  }
  if (!trigger) {
    return {
      ok: false,
      error: { code: "validation_error", message: "请填写触发物。" },
    };
  }

  try {
    const now = Date.now();
    const roleCardText = buildRoleCardText({
      moodPreset: input.moodPreset,
      moodCustom: custom || undefined,
      trigger,
    });

    const session: Session = {
      id: makeId(),
      scene: input.scene,
      createdAt: now,
      ...(input.name?.trim() ? { name: input.name.trim() } : {}),
      roleMoodPreset: input.moodPreset,
      roleMoodCustom: custom || undefined,
      roleTrigger: trigger,
      roleCardText,
      roleCardUpdatedAt: now,
    };

    const out = SESSION_SCHEMA.safeParse(session);
    if (!out.success) return { ok: false, error: toStorageError() };

    await db.sessions.add(out.data);
    return { ok: true, value: out.data };
  } catch {
    return { ok: false, error: toStorageError() };
  }
}

export async function getSessionById(id: string): Promise<Session | null> {
  try {
    const row = await db.sessions.get(id);
    if (!row) return null;
    const parsed = SESSION_SCHEMA.safeParse(row);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** 写入 AI 增强稿；默认优先展示 AI；并清除朗读完成（需重新朗读当前展示稿） */
export async function saveRoleCardAiResult(
  sessionId: string,
  input: { roleCardAiText: string; roleCardPreferAi?: boolean },
): Promise<RepoResult<Session>> {
  try {
    const current = await db.sessions.get(sessionId);
    if (!current) {
      return { ok: false, error: { code: "not_found", message: "会话不存在。" } };
    }
    const parsed = SESSION_SCHEMA.safeParse(current);
    if (!parsed.success) return { ok: false, error: toStorageError() };

    const trimmed = input.roleCardAiText.trim();
    if (!trimmed) {
      return {
        ok: false,
        error: { code: "validation_error", message: "增强结果为空。" },
      };
    }

    const now = Date.now();
    const next: Session = {
      ...parsed.data,
      roleCardAiText: trimmed,
      roleCardAiUpdatedAt: now,
      roleCardPreferAi: input.roleCardPreferAi ?? true,
      roleReadAloudCompletedAt: undefined,
    };
    const out = SESSION_SCHEMA.safeParse(next);
    if (!out.success) return { ok: false, error: toStorageError() };

    await db.sessions.put(out.data);
    return { ok: true, value: out.data };
  } catch {
    return { ok: false, error: toStorageError() };
  }
}

/** 切换展示「本地原版 / 增强版」；清除朗读完成以免与展示稿不一致 */
export async function setRoleCardPreferAi(
  sessionId: string,
  preferAi: boolean,
): Promise<RepoResult<Session>> {
  try {
    const current = await db.sessions.get(sessionId);
    if (!current) {
      return { ok: false, error: { code: "not_found", message: "会话不存在。" } };
    }
    const parsed = SESSION_SCHEMA.safeParse(current);
    if (!parsed.success) return { ok: false, error: toStorageError() };

    const next: Session = {
      ...parsed.data,
      roleCardPreferAi: preferAi,
      roleReadAloudCompletedAt: undefined,
    };
    const out = SESSION_SCHEMA.safeParse(next);
    if (!out.success) return { ok: false, error: toStorageError() };

    await db.sessions.put(out.data);
    return { ok: true, value: out.data };
  } catch {
    return { ok: false, error: toStorageError() };
  }
}

export async function markRoleReadAloudComplete(sessionId: string): Promise<RepoResult<Session>> {
  try {
    const current = await db.sessions.get(sessionId);
    if (!current) {
      return { ok: false, error: { code: "not_found", message: "会话不存在。" } };
    }
    const parsed = SESSION_SCHEMA.safeParse(current);
    if (!parsed.success) return { ok: false, error: toStorageError() };

    const now = Date.now();
    const next: Session = {
      ...parsed.data,
      roleReadAloudCompletedAt: now,
    };
    const out = SESSION_SCHEMA.safeParse(next);
    if (!out.success) return { ok: false, error: toStorageError() };

    await db.sessions.put(out.data);
    return { ok: true, value: out.data };
  } catch {
    return { ok: false, error: toStorageError() };
  }
}

export async function deleteSessionCascade(sessionId: string): Promise<RepoResult<void>> {
  try {
    await db.transaction(
      "rw",
      [
        db.sessions,
        db.rehearsalSettings,
        db.uploadedBackgrounds,
        db.pauseEvents,
        db.transcriptionJobs,
        db.transcriptSegments,
      ],
      async () => {
        const settings = await db.rehearsalSettings.get(sessionId);
        if (settings?.uploadedBackgroundId) {
          await db.uploadedBackgrounds.delete(settings.uploadedBackgroundId);
        }
        await db.transcriptSegments.where("sessionId").equals(sessionId).delete();
        await db.transcriptionJobs.where("sessionId").equals(sessionId).delete();
        await db.pauseEvents.where("sessionId").equals(sessionId).delete();
        await db.rehearsalSettings.delete(sessionId);
        await db.sessions.delete(sessionId);
      },
    );
    return { ok: true, value: undefined };
  } catch {
    return { ok: false, error: toStorageError() };
  }
}

/** 用户在复盘页打开本轮成功转写后写入，用于主进度「已完成」判定 */
export async function acknowledgeSessionReview(
  sessionId: string,
  takeId: string,
): Promise<RepoResult<Session>> {
  try {
    const current = await db.sessions.get(sessionId);
    if (!current) {
      return { ok: false, error: { code: "not_found", message: "会话不存在。" } };
    }
    const parsed = SESSION_SCHEMA.safeParse(current);
    if (!parsed.success) return { ok: false, error: toStorageError() };

    const now = Date.now();
    const next: Session = {
      ...parsed.data,
      reviewAcknowledgedAt: now,
      reviewAcknowledgedTakeId: takeId,
    };
    const out = SESSION_SCHEMA.safeParse(next);
    if (!out.success) return { ok: false, error: toStorageError() };

    await db.sessions.put(out.data);
    return { ok: true, value: out.data };
  } catch {
    return { ok: false, error: toStorageError() };
  }
}
