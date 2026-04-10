import { z } from "zod";

export const SESSION_SCENE = z.literal("civil_service");
export type SessionScene = z.infer<typeof SESSION_SCENE>;

export const SESSION_STATUS = z.enum(["not_started", "in_progress", "ended"]);
export type SessionStatus = z.infer<typeof SESSION_STATUS>;

export const SESSION_SCHEMA = z.object({
  id: z.string().min(1),
  scene: SESSION_SCENE,
  createdAt: z.number().int().nonnegative(),
  status: SESSION_STATUS,
  startedAt: z.number().int().nonnegative().optional(),
  endedAt: z.number().int().nonnegative().optional(),
  name: z.string().trim().min(1).optional(),
  durationSec: z.number().int().nonnegative().optional(),
});

export type Session = z.infer<typeof SESSION_SCHEMA>;

export type SessionRepoErrorCode =
  | "storage_error"
  | "invalid_transition"
  | "not_found";

export type SessionRepoError = {
  code: SessionRepoErrorCode;
  message: string;
};

export type RepoResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: SessionRepoError };

