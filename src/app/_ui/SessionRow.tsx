import Link from "next/link";

import type { Session } from "../_lib/sessionTypes";
import { review } from "../session/[id]/rehearsal/_lib/transcription/sttCopy";
import { StatusBadge } from "./StatusBadge";

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
}: {
  session: Session;
  reviewHref: string | null;
}) {
  const duration =
    session.durationSec === undefined ? "—" : `${session.durationSec}s`;

  return (
    <div className="flex items-stretch gap-2 rounded-lg border border-slate-200 bg-white sm:gap-3">
      <Link
        href={`/session/${session.id}`}
        className="flex min-w-0 flex-1 items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">公务员面试</span>
            {session.name ? (
              <span className="text-xs font-semibold text-slate-500">· {session.name}</span>
            ) : null}
          </div>
          <div className="mt-1 text-xs text-slate-600">{formatDate(session.createdAt)}</div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-xs text-slate-500 sm:block">
            时长：{duration}
          </div>
          <StatusBadge status={session.status} />
        </div>
      </Link>
      {reviewHref ? (
        <Link
          href={reviewHref}
          className="inline-flex shrink-0 items-center justify-center self-center border-l border-slate-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 sm:px-4"
        >
          {review.openReview}
        </Link>
      ) : null}
    </div>
  );
}

