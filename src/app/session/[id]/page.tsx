"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { deleteSessionCascade, getSessionById } from "../../_lib/sessionRepo";
import { getEffectiveRoleCardText, type Session } from "../../_lib/sessionTypes";
import { getLatestJobForSession } from "./rehearsal/_lib/transcription/transcriptRepo";
import type { TranscriptionJobRow } from "./rehearsal/_lib/transcription/transcriptionTypes";
import { BackToHomeLink } from "../../_ui/BackToHomeLink";
import { SessionMeta } from "../../_ui/SessionMeta";
import { role } from "./_lib/roleCopy";
import { RoleCardReadOnly } from "./_ui/RoleCardReadOnly";
import { SessionTakesSection } from "./_ui/SessionTakesSection";
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
  const [latestJob, setLatestJob] = useState<TranscriptionJobRow | null | undefined>(
    undefined,
  );

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
    const card = getEffectiveRoleCardText(session);
    if (!card) {
      window.alert(role.rehearsalNoCard);
      document.getElementById("role-card-readonly")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (card && !session.roleReadAloudCompletedAt) {
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
      const job = await getLatestJobForSession(id);
      if (cancelled) return;
      setLatestJob(job);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (notFound) return;
    const t = window.setInterval(() => {
      void (async () => {
        const job = await getLatestJobForSession(id);
        setLatestJob(job);
      })();
    }, 2000);
    return () => window.clearInterval(t);
  }, [id, notFound]);

  return (
    <main className="px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-3xl">
        <BackToHomeLink />
        <h1 className="mt-3 text-[22px] font-semibold leading-[1.25] text-slate-900">
          会话
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          先朗读角色卡，再进入排练；可多次录制，每轮在下方单独查看转写与复盘。
        </p>

        <div className="mt-8 space-y-6">
          {notFound ? (
            <div className="rounded-lg border border-slate-200 bg-white px-6 py-8">
              <div className="text-sm font-semibold text-slate-900">会话不存在</div>
              <div className="mt-2 text-sm text-slate-600">
                可能已被清理，或链接有误。
              </div>
            </div>
          ) : session ? (
            <>
              <SessionMeta session={session} latestJob={latestJob} />

              <RoleCardReadOnly session={session} sessionId={session.id} onSessionChange={setSession} />

              <SessionTakesSection sessionId={session.id} />

              <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-6 py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">排练</div>
                    <div className="mt-1 text-sm text-slate-600">
                      进入排练室开始新的录制；结束后录音与转写会出现在「排练记录」中。
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onEnterRehearsal}
                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm outline-none ring-offset-2 transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600"
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
      </div>
    </main>
  );
}
