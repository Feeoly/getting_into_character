import Link from "next/link";

import type { Session } from "../_lib/sessionTypes";
import { SESSION_SCENE_LABELS } from "../_lib/sessionTypes";
import { review } from "../session/[id]/rehearsal/_lib/transcription/sttCopy";
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
  reviewHref,
  latestJob,
}: {
  session: Session;
  reviewHref: string | null;
  latestJob: TranscriptionJobRow | null;
}) {
  const sceneTitle = SESSION_SCENE_LABELS[session.scene];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius-card)] bg-surface">
      <Link
        href={`/session/${session.id}`}
        className="flex min-w-0 flex-1 flex-col gap-3 px-4 py-3 transition hover:brightness-[1.02]"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-ink">{sceneTitle}</span>
            {session.name ? (
              <span className="text-xs font-semibold text-ink-subtle">· {session.name}</span>
            ) : null}
          </div>
          <div className="mt-1 text-xs text-ink-muted">{formatDate(session.createdAt)}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PrimaryProgressBadge session={session} latestJob={latestJob} />
        </div>
      </Link>
      {reviewHref ? (
        <div className="flex justify-center px-4 py-3">
          <Link href={reviewHref} className="ui-btn ui-btn-sm">
            {review.openReview}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
