import type { Session } from "../_lib/sessionTypes";
import { SESSION_SCENE_LABELS } from "../_lib/sessionTypes";
import type { TranscriptionJobRow } from "../session/[id]/rehearsal/_lib/transcription/transcriptionTypes";
import { PrimaryProgressBadge } from "./PrimaryProgressBadge";

function formatDate(ms: number) {
  return new Date(ms).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  session: Session;
  latestJob: TranscriptionJobRow | null | undefined;
};

export function SessionMeta({ session, latestJob }: Props) {
  const sceneLabel = SESSION_SCENE_LABELS[session.scene];

  return (
    <div className="rounded-[var(--radius-card)] bg-surface px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink">{sceneLabel}</div>
          <div className="mt-1 text-xs text-ink-muted">{formatDate(session.createdAt)}</div>
          <div className="mt-2 text-sm text-ink-muted">
            备注：{session.name ?? "—"}
          </div>
        </div>

        <div className="shrink-0">
          <PrimaryProgressBadge session={session} latestJob={latestJob} />
        </div>
      </div>
    </div>
  );
}
