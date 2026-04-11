"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { deleteSessionCascade, getSessionById } from "../../_lib/sessionRepo";
import type { Session } from "../../_lib/sessionTypes";
import { PrimaryButton } from "../../_ui/PrimaryButton";
import { SessionActions } from "../../_ui/SessionActions";
import { SessionMeta } from "../../_ui/SessionMeta";
import { role } from "./_lib/roleCopy";
import { RoleCardSection } from "./_ui/RoleCardSection";
import { TranscriptSummaryCard } from "./rehearsal/_lib/transcription/TranscriptSummaryCard";
import { review } from "./rehearsal/_lib/transcription/sttCopy";

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [notFound, setNotFound] = useState(false);

  function onDeleteSession() {
    if (!window.confirm(review.confirmDeleteSession)) return;
    void (async () => {
      const r = await deleteSessionCascade(id);
      if (!r.ok) {
        window.alert(r.error.message);
        return;
      }
      window.alert(review.deleteSessionDone);
      router.push("/");
    })();
  }

  function onEnterRehearsal() {
    if (!session) return;
    if (!session.roleCardText) {
      window.alert(role.rehearsalNoCard);
      document.getElementById("role-card-section")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (session.roleCardText && !session.roleReadAloudCompletedAt) {
      if (!window.confirm(role.rehearsalSoftBlock)) return;
    }
    router.push(`/session/${session.id}/rehearsal`);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const s = await getSessionById(id);
      if (cancelled) return;
      if (!s) {
        setNotFound(true);
        return;
      }
      setSession(s);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <main className="px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-[20px] font-semibold leading-[1.2] text-slate-900">
          会话详情（Phase 1 壳）
        </h1>

        <div className="mt-6 space-y-4">
          {notFound ? (
            <div className="rounded-lg border border-slate-200 bg-white px-6 py-8">
              <div className="text-sm font-semibold text-slate-900">会话不存在</div>
              <div className="mt-2 text-sm text-slate-600">
                可能已被清理，或链接有误。
              </div>
            </div>
          ) : session ? (
            <>
              <SessionMeta session={session} />
              <RoleCardSection sessionId={session.id} session={session} onSaved={setSession} />
              <TranscriptSummaryCard sessionId={session.id} />
              <SessionActions session={session} onUpdated={setSession} />
              <div className="rounded-lg border border-slate-200 bg-white px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">排练页</div>
                    <div className="mt-1 text-sm text-slate-600">
                      场景背景、录制与停顿提示都在这里进行。
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onEnterRehearsal}
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm outline-none ring-offset-2 transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    进入排练
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50/60 px-6 py-5">
                <div className="text-sm font-semibold text-red-900">{review.dangerZone}</div>
                <p className="mt-2 text-sm text-red-900/90">{review.deleteSession}</p>
                <button
                  type="button"
                  onClick={onDeleteSession}
                  className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg border border-red-400 bg-white px-4 text-sm font-semibold text-red-800 shadow-sm hover:bg-red-100"
                >
                  {review.deleteSession}
                </button>
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-600">加载中…</div>
          )}
        </div>

        <div className="mt-6">
          <PrimaryButton href="/">返回首页</PrimaryButton>
        </div>
      </div>
    </main>
  );
}
