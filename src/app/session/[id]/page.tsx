"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { deleteSessionCascade, getSessionById } from "../../_lib/sessionRepo";
import { getEffectiveRoleCardText, type Session } from "../../_lib/sessionTypes";
import { getLatestJobForSession } from "./rehearsal/_lib/transcription/transcriptRepo";
import type { TranscriptionJobRow } from "./rehearsal/_lib/transcription/transcriptionTypes";
import { BackToHomeLink } from "../../_ui/BackToHomeLink";
import { PageHeaderGlobalRow } from "../../_ui/PageHeaderActions";
import { AlertDialog } from "../../_ui/AlertDialog";
import { ConfirmDialog } from "../../_ui/ConfirmDialog";
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
  const [deleteSessionOpen, setDeleteSessionOpen] = useState(false);
  const [rehearsalSoftOpen, setRehearsalSoftOpen] = useState(false);
  const [alertPayload, setAlertPayload] = useState<{
    title: string;
    description: string;
    afterClose?: () => void;
  } | null>(null);

  function performDeleteSession() {
    void (async () => {
      const r = await deleteSessionCascade(id);
      if (!r.ok) {
        setAlertPayload({ title: review.dialogErrorTitle, description: r.error.message });
        return;
      }
      setAlertPayload({
        title: review.dialogAlertTitle,
        description: review.deleteSessionDone,
        afterClose: () => router.push("/"),
      });
    })();
  }

  function onEnterRehearsal() {
    if (!session) return;
    const card = getEffectiveRoleCardText(session);
    if (!card) {
      setAlertPayload({ title: review.dialogAlertTitle, description: role.rehearsalNoCard });
      document.getElementById("role-card-readonly")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (card && !session.roleReadAloudCompletedAt) {
      setRehearsalSoftOpen(true);
      return;
    }
    router.push(`/session/${session.id}/rehearsal`);
  }

  function confirmEnterRehearsalAnyway() {
    if (!session) return;
    setRehearsalSoftOpen(false);
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
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1 space-y-3">
            <PageHeaderGlobalRow className="w-full justify-between gap-2">
              <BackToHomeLink />
              {session ? (
                <button
                  type="button"
                  onClick={() => setDeleteSessionOpen(true)}
                  className="ui-btn ui-btn-sm shrink-0 px-4"
                >
                  {review.deleteSession}
                </button>
              ) : null}
            </PageHeaderGlobalRow>
            <h1 className="text-[22px] font-semibold leading-[1.25] text-ink">会话</h1>
            <p className="max-w-xl text-sm leading-snug text-ink-muted">
              先朗读角色卡，再打板录制，可多次打板录制，每轮打板记录都会被记录和复盘
            </p>
          </div>
        </div>

        <ConfirmDialog
          open={deleteSessionOpen}
          title={review.deleteSession}
          description={review.confirmDeleteSession}
          cancelLabel={review.dialogCancel}
          confirmLabel={review.dialogConfirmDelete}
          danger
          onClose={() => setDeleteSessionOpen(false)}
          onConfirm={performDeleteSession}
        />

        <ConfirmDialog
          open={rehearsalSoftOpen}
          title={review.dialogAlertTitle}
          description={role.rehearsalSoftBlock}
          cancelLabel={review.dialogCancel}
          confirmLabel={review.dialogConfirmEnterRehearsalAnyway}
          onClose={() => setRehearsalSoftOpen(false)}
          onConfirm={confirmEnterRehearsalAnyway}
        />

        <AlertDialog
          open={!!alertPayload}
          title={alertPayload?.title ?? ""}
          description={alertPayload?.description ?? ""}
          okLabel={review.dialogOk}
          onClose={() => {
            const next = alertPayload?.afterClose;
            setAlertPayload(null);
            next?.();
          }}
        />

        <div className="mt-8 space-y-6">
          {notFound ? (
            <div className="rounded-[var(--radius-card)] bg-surface px-6 py-8">
              <div className="text-sm font-semibold text-ink">会话不存在</div>
              <div className="mt-2 text-sm text-ink-muted">
                可能已被清理，或链接有误。
              </div>
            </div>
          ) : session ? (
            <>
              <SessionMeta session={session} latestJob={latestJob} />

              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
                <div className="min-w-0 w-full lg:basis-0 lg:flex-[3]">
                  <RoleCardReadOnly session={session} sessionId={session.id} onSessionChange={setSession} />
                </div>
                <div className="min-w-0 w-full lg:basis-0 lg:flex-[1]">
                  <SessionTakesSection sessionId={session.id} />
                </div>
              </div>

              <div className="rounded-[var(--radius-card)] bg-surface px-6 py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-ink">排练</div>
                    <div className="mt-1 text-sm text-ink-muted">
                      进入排练室开始新的录制；结束后录音与转写会出现在「排练记录」中。
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onEnterRehearsal}
                    className="ui-btn ui-btn-page-header-gradient shrink-0 px-6"
                  >
                    进入排练
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-ink-muted">加载中…</div>
          )}
        </div>
      </div>
    </main>
  );
}
