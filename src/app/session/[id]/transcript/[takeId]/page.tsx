"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { AlertDialog } from "../../../../_ui/AlertDialog";
import { BackToHomeLink } from "../../../../_ui/BackToHomeLink";
import {
  ContextActionsWithDivider,
  PageHeaderGlobalRow,
} from "../../../../_ui/PageHeaderActions";
import { ConfirmDialog } from "../../../../_ui/ConfirmDialog";
import { getSessionById } from "../../../../_lib/sessionRepo";
import type { Session } from "../../../../_lib/sessionTypes";
import {
  getJob,
  getLatestJobForTake,
  hasPendingJobForTake,
  listSegmentsForTake,
} from "../../rehearsal/_lib/transcription/transcriptRepo";
import type { TranscriptSegmentRow } from "../../rehearsal/_lib/transcription/transcriptionTypes";
import { review, stt } from "../../rehearsal/_lib/transcription/sttCopy";
import {
  retryTranscriptionForTake,
  startTranscriptionRunner,
  subscribeTranscriptionJobFailed,
} from "../../rehearsal/_lib/transcription/transcriptionRunner";

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rs).padStart(2, "0")}`;
}

const takeIdSchema = z.string().uuid();

export default function TranscriptPage({
  params,
}: {
  params: Promise<{ id: string; takeId: string }>;
}) {
  const { id, takeId } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [badTake, setBadTake] = useState(false);
  const [segments, setSegments] = useState<TranscriptSegmentRow[]>([]);
  const [sttPending, setSttPending] = useState(false);
  const [tick, setTick] = useState(0);
  const [resultBanner, setResultBanner] = useState<
    null | { kind: "ok" } | { kind: "fail"; message: string }
  >(null);
  const prevSttPendingRef = useRef<boolean | null>(null);
  const retranscribeAwaitRef = useRef(false);
  const [retranscribeConfirmOpen, setRetranscribeConfirmOpen] = useState(false);
  const [alertPayload, setAlertPayload] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const takeOk = takeIdSchema.safeParse(takeId).success;

  useEffect(() => {
    startTranscriptionRunner();
  }, []);

  useEffect(() => {
    return subscribeTranscriptionJobFailed(({ jobId, sessionId: sid, takeId: tid }) => {
      if (sid !== id || tid !== takeId) return;
      // 仅在本页用户点了「重新转写」并入队后提示，避免误报其它后台任务
      if (!retranscribeAwaitRef.current) return;
      retranscribeAwaitRef.current = false;
      void (async () => {
        const job = await getJob(jobId);
        const message = job?.errorMessage?.trim() || stt.toastFailBody;
        setResultBanner({ kind: "fail", message });
      })();
    });
  }, [id, takeId]);

  useEffect(() => {
    if (resultBanner?.kind !== "ok") return;
    const t = window.setTimeout(() => setResultBanner(null), 4500);
    return () => window.clearTimeout(t);
  }, [resultBanner]);

  useEffect(() => {
    if (!takeOk) {
      setBadTake(true);
      return;
    }
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
  }, [id, takeOk]);

  useEffect(() => {
    if (!takeOk || notFound) return;
    let cancelled = false;
    (async () => {
      const [segs, pending] = await Promise.all([
        listSegmentsForTake(id, takeId),
        hasPendingJobForTake(takeId),
      ]);
      if (cancelled) return;

      const prevPending = prevSttPendingRef.current;
      prevSttPendingRef.current = pending;

      setSegments(segs);
      setSttPending(pending);

      if (
        prevPending === true &&
        pending === false &&
        retranscribeAwaitRef.current
      ) {
        retranscribeAwaitRef.current = false;
        const job = await getLatestJobForTake(id, takeId);
        if (cancelled) return;
        if (job?.status === "succeeded") {
          setResultBanner({ kind: "ok" });
        } else if (job?.status === "failed") {
          const message = job.errorMessage?.trim() || stt.toastFailBody;
          setResultBanner((b) => b ?? { kind: "fail", message });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, takeId, takeOk, notFound, tick]);

  useEffect(() => {
    if (!takeOk || notFound) return;
    const t = window.setInterval(() => setTick((x) => x + 1), 2000);
    return () => window.clearInterval(t);
  }, [takeOk, notFound]);

  function onRetranscribe() {
    setRetranscribeConfirmOpen(true);
  }

  function confirmRetranscribe() {
    void (async () => {
      const ok = await retryTranscriptionForTake(id, takeId);
      if (!ok) {
        setAlertPayload({ title: stt.toastFailTitle, description: stt.retryNoBlob });
        return;
      }
      retranscribeAwaitRef.current = true;
      setResultBanner(null);
      setSttPending(true);
      setTick((x) => x + 1);
    })();
  }

  if (badTake) {
    return (
      <main className="px-6 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-3xl rounded-[var(--radius-card)] bg-surface px-6 py-8">
          <div className="text-sm font-semibold text-ink">链接无效</div>
          <div className="mt-2 text-sm text-ink-muted">转写轮次标识不正确。</div>
          <div className="mt-4">
            <Link href="/" className="ui-btn ui-btn-sm inline-flex">
              返回首页
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="px-6 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-3xl rounded-[var(--radius-card)] bg-surface px-6 py-8">
          <div className="text-sm font-semibold text-ink">会话不存在</div>
          <Link href="/" className="ui-btn ui-btn-sm mt-4 inline-flex">
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1 space-y-3">
            <PageHeaderGlobalRow>
              <BackToHomeLink variant="toolbar" />
              <Link href={`/session/${id}`} className="ui-btn ui-btn-sm ui-btn-equal px-4">
                {review.backToSession}
              </Link>
            </PageHeaderGlobalRow>
            <h1 className="text-[20px] font-semibold leading-[1.2] text-ink">
              {stt.fullPageTitle}
            </h1>
            <p className="text-sm text-ink-subtle">{stt.fullPageHint}</p>
          </div>
          <div className="shrink-0 lg:max-w-[min(100%,28rem)] lg:pt-0.5">
            <ContextActionsWithDivider>
              <button type="button" onClick={onRetranscribe} className="ui-btn ui-btn-equal px-4">
                {stt.retranscribe}
              </button>
              <Link href={`/session/${id}/review/${takeId}`} className="ui-btn ui-btn-equal px-4">
                {review.openReview}
              </Link>
            </ContextActionsWithDivider>
          </div>
        </div>

        <div className="mt-6 rounded-[var(--radius-card)] bg-surface px-4 py-4 md:px-6 md:py-5">
          {sttPending ? (
            <div
              className="mb-4 rounded-lg border border-ink/15 bg-ink/[0.04] px-3 py-3 text-sm"
              role="status"
              aria-live="polite"
            >
              <div className="font-medium text-ink">{stt.retranscribeInProgress}</div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-ink/10">
                <div className="h-full w-2/5 animate-pulse rounded-full bg-ink/35" />
              </div>
            </div>
          ) : null}
          {resultBanner?.kind === "ok" ? (
            <div
              className="mb-4 rounded-lg border border-emerald-600/25 bg-emerald-600/10 px-3 py-3 text-sm text-ink"
              role="status"
              aria-live="polite"
            >
              {stt.retranscribeDoneOk}
            </div>
          ) : null}
          {resultBanner?.kind === "fail" ? (
            <div
              className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm"
              role="alert"
            >
              <div className="font-medium text-ink">{stt.toastFailTitle}</div>
              <div className="mt-1 text-ink-muted">{resultBanner.message}</div>
              <button
                type="button"
                className="ui-btn ui-btn-sm mt-3 px-3"
                onClick={() => setResultBanner(null)}
              >
                {stt.toastDismiss}
              </button>
            </div>
          ) : null}
          {!session ? (
            <div className="text-sm text-ink-muted">加载中…</div>
          ) : segments.length === 0 ? (
            <div className="text-sm text-ink-muted">{stt.emptyFull}</div>
          ) : (
            <ul className="space-y-2">
              {segments.map((s) => (
                <li key={s.id}>
                  <div className="flex gap-3">
                    <div
                      className="w-[4.5rem] shrink-0 pt-0.5 text-left text-sm font-semibold tabular-nums text-ink-subtle"
                    >
                      {fmt(s.start_ms)}
                    </div>
                    <div className="min-w-0 flex-1 text-sm leading-relaxed text-ink">
                      {s.text || "（无文本）"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={retranscribeConfirmOpen}
        title={stt.retranscribe}
        description={stt.confirmRetranscribe}
        cancelLabel={review.dialogCancel}
        confirmLabel={review.dialogConfirmOk}
        onClose={() => setRetranscribeConfirmOpen(false)}
        onConfirm={confirmRetranscribe}
      />

      <AlertDialog
        open={!!alertPayload}
        title={alertPayload?.title ?? ""}
        description={alertPayload?.description ?? ""}
        okLabel={review.dialogOk}
        onClose={() => setAlertPayload(null)}
      />
    </main>
  );
}
