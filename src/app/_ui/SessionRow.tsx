import Link from "next/link";

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

export function SessionRow({
  session,
  latestJob,
}: {
  session: Session;
  latestJob: TranscriptionJobRow | null;
}) {
  const sceneTitle = SESSION_SCENE_LABELS[session.scene];

  return (
    <Link
      href={`/session/${session.id}`}
      className="flex min-h-[6.25rem] min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] bg-surface px-5 py-5 transition-colors hover:bg-ink/[0.04] sm:min-h-[6.75rem]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 pr-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-ink">{sceneTitle}</span>
            {session.name ? (
              <span className="text-xs font-semibold text-ink-subtle">· {session.name}</span>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 self-start pt-px">
          <PrimaryProgressBadge session={session} latestJob={latestJob} />
        </div>
      </div>
      <div className="mt-auto pt-4 text-xs text-ink-muted">
        <time dateTime={new Date(session.createdAt).toISOString()}>{formatDate(session.createdAt)}</time>
      </div>
    </Link>
  );
}
