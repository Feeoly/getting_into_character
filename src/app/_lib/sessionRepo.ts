import { db } from "./db";
import {
  SESSION_SCHEMA,
  type RepoResult,
  type Session,
  type SessionRepoError,
  type SessionScene,
  type SessionStatus,
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
    // RFC4122 v4
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
      .slice(6, 8)
      .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isValidTransition(prev: SessionStatus, next: SessionStatus): boolean {
  if (prev === next) return true;
  if (prev === "not_started" && next === "in_progress") return true;
  if (prev === "in_progress" && next === "ended") return true;
  return false;
}

function toStorageError(): SessionRepoError {
  return {
    code: "storage_error",
    message:
      "操作失败。请刷新后重试；若仍失败，请检查浏览器存储权限或剩余空间。",
  };
}

export async function createSession(input?: {
  scene?: SessionScene;
  name?: string;
}): Promise<RepoResult<Session>> {
  try {
    const now = Date.now();
    const session: Session = {
      id: makeId(),
      scene: input?.scene ?? "civil_service",
      createdAt: now,
      status: "not_started",
      ...(input?.name ? { name: input.name } : {}),
    };

    await db.sessions.add(session);

    return { ok: true, value: session };
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

export async function updateSessionStatus(
  id: string,
  nextStatus: SessionStatus,
): Promise<RepoResult<Session>> {
  try {
    const result = await db.transaction("rw", db.sessions, async () => {
      const current = await db.sessions.get(id);
      if (!current) {
        return {
          ok: false as const,
          error: {
            code: "not_found" as const,
            message: "会话不存在。",
          },
        };
      }

      const parsed = SESSION_SCHEMA.safeParse(current);
      if (!parsed.success) {
        return { ok: false as const, error: toStorageError() };
      }

      const session = parsed.data;
      if (!isValidTransition(session.status, nextStatus)) {
        return {
          ok: false as const,
          error: {
            code: "invalid_transition" as const,
            message: "当前状态不支持该操作。",
          },
        };
      }

      if (session.status === nextStatus) {
        return { ok: true as const, value: session };
      }

      const now = Date.now();
      const next: Session = {
        ...session,
        status: nextStatus,
        ...(nextStatus === "in_progress"
          ? { startedAt: session.startedAt ?? now }
          : {}),
        ...(nextStatus === "ended"
          ? { endedAt: session.endedAt ?? now }
          : {}),
      };

      if (next.status === "ended" && next.startedAt && next.endedAt) {
        const durationSec = Math.max(
          0,
          Math.round((next.endedAt - next.startedAt) / 1000),
        );
        next.durationSec = durationSec;
      }

      await db.sessions.put(next);
      return { ok: true as const, value: next };
    });

    return result;
  } catch {
    return { ok: false, error: toStorageError() };
  }
}

