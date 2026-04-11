"use client";

import { useState } from "react";

import type { Session, SessionStatus } from "../_lib/sessionTypes";
import { updateSessionStatus } from "../_lib/sessionRepo";

function nextActions(status: SessionStatus) {
  return {
    canStart: status === "not_started",
    canEnd: status === "in_progress",
  };
}

/** 会话开始/结束（顶栏与「返回首页」并列；重录请从首页「新建会话」） */
export function SessionActions({
  session,
  onUpdated,
}: {
  session: Session;
  onUpdated: (next: Session) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "start" | "end">(null);
  const { canStart, canEnd } = nextActions(session.status);

  async function onStart() {
    setError(null);
    setBusy("start");
    try {
      const res = await updateSessionStatus(session.id, "in_progress");
      if (!res.ok) return setError(res.error.message);
      onUpdated(res.value);
    } finally {
      setBusy(null);
    }
  }

  async function onEnd() {
    setError(null);
    setBusy("end");
    try {
      const res = await updateSessionStatus(session.id, "ended");
      if (!res.ok) return setError(res.error.message);
      onUpdated(res.value);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canStart || busy !== null}
          onClick={onStart}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm outline-none ring-offset-2 transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60"
        >
          开始
        </button>
        <button
          type="button"
          disabled={!canEnd || busy !== null}
          onClick={onEnd}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none ring-offset-2 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60"
        >
          结束
        </button>
        {busy ? <span className="text-sm text-slate-500">处理中…</span> : null}
      </div>
      {error ? <div className="mt-1 text-sm text-red-600">{error}</div> : null}
    </div>
  );
}
