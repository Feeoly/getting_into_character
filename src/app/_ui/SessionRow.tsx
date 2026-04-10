import Link from "next/link";

import type { Session } from "../_lib/sessionTypes";
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

export function SessionRow({ session }: { session: Session }) {
  return (
    <Link
      href={`/session/${session.id}`}
      className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
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

      <div className="flex items-center gap-3">
        <div className="hidden text-xs text-slate-500 sm:block">
          时长：{session.durationSec ? `${session.durationSec}s` : "—"}
        </div>
        <StatusBadge status={session.status} />
      </div>
    </Link>
  );
}

