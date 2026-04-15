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
    <div className="rounded-[var(--radius-card)] bg-surface px-4 py-2.5">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-x-2 text-xs text-ink-muted">
          <span className="shrink-0 text-sm font-semibold text-ink">{sceneLabel}</span>
          <span className="shrink-0 text-ink-subtle" aria-hidden>
            ·
          </span>
          <time
            className="shrink-0 whitespace-nowrap"
            dateTime={new Date(session.createdAt).toISOString()}
          >
            {formatDate(session.createdAt)}
          </time>
          <span className="shrink-0 text-ink-subtle" aria-hidden>
            ·
          </span>
          <span className="min-w-0 truncate">
            备注：{session.name ?? "—"}
          </span>
        </div>

        <div className="shrink-0">
          <PrimaryProgressBadge session={session} latestJob={latestJob} />
        </div>
      </div>
    </div>
  );
}
