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
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
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

