import { z } from "zod";

import { ROLE_MOOD_PRESET_IDS } from "../session/[id]/_lib/roleCopy";

export const SESSION_SCENE = z.literal("civil_service");
export type SessionScene = z.infer<typeof SESSION_SCENE>;

export const SESSION_STATUS = z.enum(["not_started", "in_progress", "ended"]);
export type SessionStatus = z.infer<typeof SESSION_STATUS>;

export const SESSION_ROLE_MOOD_PRESET_SCHEMA = z.enum(ROLE_MOOD_PRESET_IDS);
export type SessionRoleMoodPreset = z.infer<typeof SESSION_ROLE_MOOD_PRESET_SCHEMA>;

export const SESSION_SCHEMA = z.object({
  id: z.string().min(1),
  scene: SESSION_SCENE,
  createdAt: z.number().int().nonnegative(),
  status: SESSION_STATUS,
  startedAt: z.number().int().nonnegative().optional(),
  endedAt: z.number().int().nonnegative().optional(),
  name: z.string().trim().min(1).optional(),
  durationSec: z.number().int().nonnegative().optional(),
  /** Phase 5 角色卡（可选，旧数据无） */
  roleMoodPreset: SESSION_ROLE_MOOD_PRESET_SCHEMA.optional(),
  roleMoodCustom: z.string().trim().max(80).optional(),
  roleTrigger: z.string().trim().max(120).optional(),
  roleCardText: z.string().max(8000).optional(),
  roleCardUpdatedAt: z.number().int().nonnegative().optional(),
  roleReadAloudCompletedAt: z.number().int().nonnegative().optional(),
});

export type Session = z.infer<typeof SESSION_SCHEMA>;

export type SessionRepoErrorCode =
  | "storage_error"
  | "invalid_transition"
  | "not_found"
  | "validation_error";

export type SessionRepoError = {
  code: SessionRepoErrorCode;
  message: string;
};

export type RepoResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: SessionRepoError };

