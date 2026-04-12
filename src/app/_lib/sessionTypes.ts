import { z } from "zod";

import { ROLE_MOOD_PRESET_IDS } from "../session/[id]/_lib/roleCopy";

export const SESSION_SCENE = z.literal("civil_service");
export type SessionScene = z.infer<typeof SESSION_SCENE>;

export const SESSION_SCENE_LABELS: Record<SessionScene, string> = {
  civil_service: "公务员面试",
};

export const SESSION_ROLE_MOOD_PRESET_SCHEMA = z.enum(ROLE_MOOD_PRESET_IDS);
export type SessionRoleMoodPreset = z.infer<typeof SESSION_ROLE_MOOD_PRESET_SCHEMA>;

/** 补充说明最大长度（支持长模板与自定义角色小传） */
export const SESSION_ROLE_MOOD_CUSTOM_MAX = 2000;

export const SESSION_SCHEMA = z.object({
  id: z.string().min(1),
  scene: SESSION_SCENE,
  createdAt: z.number().int().nonnegative(),
  name: z.string().trim().min(1).optional(),
  roleMoodPreset: SESSION_ROLE_MOOD_PRESET_SCHEMA.optional(),
  roleMoodCustom: z.string().trim().max(SESSION_ROLE_MOOD_CUSTOM_MAX).optional(),
  roleTrigger: z.string().trim().max(120).optional(),
  roleCardText: z.string().max(8000).optional(),
  /** 百炼增强稿；与 roleCardText 并存 */
  roleCardAiText: z.string().max(8000).optional(),
  roleCardAiUpdatedAt: z.number().int().nonnegative().optional(),
  /** 未定义或 true：有 AI 稿时优先展示 AI；false：始终展示本地 roleCardText */
  roleCardPreferAi: z.boolean().optional(),
  roleCardUpdatedAt: z.number().int().nonnegative().optional(),
  roleReadAloudCompletedAt: z.number().int().nonnegative().optional(),
  reviewAcknowledgedAt: z.number().int().nonnegative().optional(),
  reviewAcknowledgedTakeId: z.string().min(1).optional(),
});

export type Session = z.infer<typeof SESSION_SCHEMA>;

/** 详情/朗读统一「展示稿」：优先 AI（可关）否则本地 */
export function getEffectiveRoleCardText(session: Session): string | undefined {
  const local = session.roleCardText?.trim();
  const ai = session.roleCardAiText?.trim();

  if (session.roleCardPreferAi === false) {
    return local || undefined;
  }

  if (ai) return ai;
  return local || undefined;
}

export type SessionRepoErrorCode =
  | "storage_error"
  | "not_found"
  | "validation_error";

export type SessionRepoError = {
  code: SessionRepoErrorCode;
  message: string;
};

export type RepoResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: SessionRepoError };
