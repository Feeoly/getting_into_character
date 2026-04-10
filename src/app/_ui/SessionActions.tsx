"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Session, SessionStatus } from "../_lib/sessionTypes";
import { createSession, updateSessionStatus } from "../_lib/sessionRepo";

function nextActions(status: SessionStatus) {
  return {
    canStart: status === "not_started",
    canEnd: status === "in_progress",
  };
}

export function SessionActions({
  session,
  onUpdated,
}: {
  session: Session;
  onUpdated: (next: Session) => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "start" | "end" | "rerecord">(null);
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

  async function onRerecord() {
    setError(null);
    setBusy("rerecord");
    try {
      const res = await createSession({
        scene: session.scene,
        name: session.name,
      });
      if (!res.ok) return setError(res.error.message);
      router.push(`/session/${res.value.id}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-6 py-5">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!canStart || busy !== null}
          onClick={onStart}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm outline-none ring-offset-2 transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60"
        >
          开始
        </button>
        <button
          type="button"
          disabled={!canEnd || busy !== null}
          onClick={onEnd}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-900 outline-none ring-offset-2 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60"
        >
          结束
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={onRerecord}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-900 outline-none ring-offset-2 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60"
        >
          重录（新会话）
        </button>
      </div>

      <div className="mt-4 text-sm text-slate-600">
        内容默认保存在本地，不会上传。
      </div>

      {busy ? (
        <div className="mt-2 text-sm text-slate-600">处理中…</div>
      ) : null}
      {error ? <div className="mt-2 text-sm text-red-600">{error}</div> : null}
    </div>
  );
}

