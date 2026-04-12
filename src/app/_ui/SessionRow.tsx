import Link from "next/link";

import type { Session } from "../_lib/sessionTypes";
import { SESSION_SCENE_LABELS } from "../_lib/sessionTypes";
import { review } from "../session/[id]/rehearsal/_lib/transcription/sttCopy";
import type { TranscriptionJobRow } from "../session/[id]/rehearsal/_lib/transcription/transcriptionTypes";
import { PrimaryProgressBadge } from "./PrimaryProgressBadge";

const CARD_TONES = [
  "bg-card-peach/50",
  "bg-card-lavender/45",
  "bg-card-sage/50",
  "bg-card-tan/45",
] as const;

function cardToneClass(sessionId: string): string {
  let n = 0;
  for (let i = 0; i < sessionId.length; i++) n += sessionId.charCodeAt(i);
  return CARD_TONES[n % CARD_TONES.length] ?? CARD_TONES[0];
}

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

  const tone = cardToneClass(session.id);

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/70 shadow-soft-sm ${tone}`}
    >
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
        <Link
          href={reviewHref}
          className="border-t border-border/80 bg-surface/90 px-4 py-2.5 text-center text-xs font-semibold text-link hover:bg-accent-muted"
        >
          {review.openReview}
        </Link>
      ) : null}
    </div>
  );
}
