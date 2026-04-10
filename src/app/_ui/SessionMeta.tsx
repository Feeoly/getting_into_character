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

export function SessionMeta({ session }: { session: Session }) {
  const duration =
    session.durationSec === undefined ? "—" : `${session.durationSec}s`;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-6 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">公务员面试</div>
          <div className="mt-1 text-xs text-slate-600">{formatDate(session.createdAt)}</div>
          {session.name ? (
            <div className="mt-2 text-sm text-slate-700">备注：{session.name}</div>
          ) : (
            <div className="mt-2 text-sm text-slate-500">备注：—</div>
          )}
          <div className="mt-2 text-sm text-slate-500">
            时长：{duration}
          </div>
        </div>

        <StatusBadge status={session.status} />
      </div>
    </div>
  );
}

