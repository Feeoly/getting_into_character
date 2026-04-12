import { getEffectiveRoleCardText, type Session } from "./sessionTypes";
import type { TranscriptionJobRow } from "../session/[id]/rehearsal/_lib/transcription/transcriptionTypes";

/** 内容主进度（与场次状态独立） */
export type SessionPrimaryProgress =
  | "pending_role"
  | "pending_read"
  | "pending_rehearsal"
  | "pending_transcribe"
  | "pending_review"
  | "done";

const primaryLabel: Record<SessionPrimaryProgress, string> = {
  pending_role: "待角色卡",
  pending_read: "待朗读",
  pending_rehearsal: "待排练",
  pending_transcribe: "待转写",
  pending_review: "待复盘",
  done: "已完成",
};

const primaryClass: Record<SessionPrimaryProgress, string> = {
  pending_role: "bg-amber-50 text-amber-900",
  pending_read: "bg-amber-50 text-amber-900",
  pending_rehearsal: "bg-sky-50 text-sky-800",
  pending_transcribe: "bg-violet-50 text-violet-800",
  pending_review: "bg-indigo-50 text-indigo-800",
  done: "bg-emerald-50 text-emerald-800",
};

/**
 * 根据会话字段 + 该会话最新一条转写任务，解析主进度（列表徽章用）。
 * 无转写任务视为尚未产生录制 take。
 */
export function resolveSessionPrimaryProgress(
  session: Session,
  latestJob: TranscriptionJobRow | null,
): SessionPrimaryProgress {
  const hasCard = Boolean(getEffectiveRoleCardText(session)?.trim());
  if (!hasCard) return "pending_role";

  const hasTake = latestJob !== null;

  if (!hasTake) {
    if (!session.roleReadAloudCompletedAt) return "pending_read";
    return "pending_rehearsal";
  }

  if (latestJob.status !== "succeeded") return "pending_transcribe";

  const takeId = latestJob.takeId;
  if (session.reviewAcknowledgedTakeId !== takeId) return "pending_review";

  return "done";
}

export function primaryProgressLabel(kind: SessionPrimaryProgress): string {
  return primaryLabel[kind];
}

export function primaryProgressClassName(kind: SessionPrimaryProgress): string {
  return primaryClass[kind];
}
