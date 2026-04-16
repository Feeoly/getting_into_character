"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { AlertDialog } from "../../../../_ui/AlertDialog";
import { BackToHomeLink } from "../../../../_ui/BackToHomeLink";
import {
  ContextActionsWithDivider,
  PageHeaderGlobalRow,
} from "../../../../_ui/PageHeaderActions";
import { ConfirmDialog } from "../../../../_ui/ConfirmDialog";
import { acknowledgeSessionReview, getSessionById } from "../../../../_lib/sessionRepo";
import type { Session } from "../../../../_lib/sessionTypes";
import { listPauseEventsForTake } from "../../rehearsal/_lib/rehearsalRepo";
import type { PauseEvent } from "../../rehearsal/_lib/rehearsalTypes";
import {
  deleteTakeData,
  getLatestJobForTake,
  hasPendingJobForTake,
  listSegmentsForTake,
} from "../../rehearsal/_lib/transcription/transcriptRepo";
import type { TranscriptSegmentRow } from "../../rehearsal/_lib/transcription/transcriptionTypes";
import { review, stt } from "../../rehearsal/_lib/transcription/sttCopy";
import { startTranscriptionRunner } from "../../rehearsal/_lib/transcription/transcriptionRunner";
import { downloadTextFile } from "./_lib/downloadText";
import { ReviewChat } from "./_ui/ReviewChat";

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rs).padStart(2, "0")}`;
}

function pauseLabel(e: PauseEvent): string {
  const start = fmt(e.start_ms);
  const end = fmt(e.start_ms + e.duration_ms);
  const dur = Math.max(1, Math.round(e.duration_ms / 1000));
  return review.pauseRow.replace("{start}", start).replace("{end}", end).replace("{duration}", String(dur));
}

const takeIdSchema = z.string().uuid();

function buildMarkdown(session: Session | null, segments: TranscriptSegmentRow[], pauses: PauseEvent[]): string {
  const title = session?.name ?? "打板录制会话";
  const lines: string[] = [`# ${title}`, "", "## 转写", ""];
  for (const s of segments) {
    lines.push(`- **${fmt(s.start_ms)}** ${s.text || "（无文本）"}`);
  }
  lines.push("", "## 停顿", "");
  if (pauses.length === 0) lines.push(review.noPauses);
  else for (const p of pauses) lines.push(`- ${pauseLabel(p)}`);
  return lines.join("\n");
}

function buildTxt(session: Session | null, segments: TranscriptSegmentRow[], pauses: PauseEvent[]): string {
  const title = session?.name ?? "打板录制会话";
  const lines: string[] = [`${title}`, "", "— 转写 —", ""];
  for (const s of segments) {
    lines.push(`${fmt(s.start_ms)}\t${s.text || "（无文本）"}`);
  }
  lines.push("", "— 停顿 —", "");
  if (pauses.length === 0) lines.push(review.noPauses);
  else for (const p of pauses) lines.push(pauseLabel(p));
  return lines.join("\n");
}

function buildExcerpt(segments: TranscriptSegmentRow[], pauses: PauseEvent[], maxChars: number): string {
  const parts: string[] = [];
  for (const s of segments) {
    parts.push(`[${fmt(s.start_ms)}] ${s.text || ""}`);
  }
  for (const p of pauses) {
    parts.push(`(停顿 ${pauseLabel(p)})`);
  }
  const t = parts.join("\n");
  return t.length <= maxChars ? t : `${t.slice(0, maxChars)}…`;
}

export default function ReviewPage({
  params,
}: {
  params: Promise<{ id: string; takeId: string }>;
}) {
  const { id, takeId } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [badTake, setBadTake] = useState(false);
  const [segments, setSegments] = useState<TranscriptSegmentRow[]>([]);
  const [pauses, setPauses] = useState<PauseEvent[]>([]);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaKind, setMediaKind] = useState<"audio" | "video" | null>(null);
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const [activeSegId, setActiveSegId] = useState<string | null>(null);
  const [deleteTakeOpen, setDeleteTakeOpen] = useState(false);
  const [alertPayload, setAlertPayload] = useState<{
    title: string;
    description: string;
    afterClose?: () => void;
  } | null>(null);
  const [sttPending, setSttPending] = useState(false);
  const [tick, setTick] = useState(0);
  /** 避免轮询 tick 时反复 create/revoke ObjectURL，导致 video 不断从 0 缓冲 */
  const mediaJobKeyRef = useRef<string | null>(null);

  const takeOk = takeIdSchema.safeParse(takeId).success;

  const transcriptExcerpt = useMemo(
    () => buildExcerpt(segments, pauses, 12_000),
    [segments, pauses],
  );
  const pausesExcerpt = useMemo(
    () =>
      pauses.length === 0
        ? "（本轮无停顿记录）"
        : pauses.map((p) => pauseLabel(p)).join("\n"),
    [pauses],
  );

  useEffect(() => {
    startTranscriptionRunner();
  }, []);

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
    mediaJobKeyRef.current = null;
  }, [id, takeId]);

  useEffect(() => {
    if (!takeOk || notFound) return;
    const t = window.setInterval(() => setTick((x) => x + 1), 2000);
    return () => window.clearInterval(t);
  }, [takeOk, notFound]);

  useEffect(() => {
    if (!takeOk || notFound) return;
    let cancelled = false;
    (async () => {
      const [segs, ps, job, pending] = await Promise.all([
        listSegmentsForTake(id, takeId),
        listPauseEventsForTake(id, takeId),
        getLatestJobForTake(id, takeId),
        hasPendingJobForTake(takeId),
      ]);
      if (cancelled) return;
      setSegments(segs);
      setPauses(ps);
      setSttPending(pending);
      if (job?.audioBlob && job.audioBlob.size > 0) {
        const mime = job.mimeType.toLowerCase();
        const k = mime.startsWith("video/") ? "video" : "audio";
        const mediaKey = `${job.id}:${job.audioBlob.size}`;
        if (mediaJobKeyRef.current !== mediaKey) {
          mediaJobKeyRef.current = mediaKey;
          setMediaKind(k);
          const url = URL.createObjectURL(job.audioBlob);
          setMediaUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        }
      } else {
        mediaJobKeyRef.current = null;
        setMediaKind(null);
        setMediaUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      }

      if (job?.status === "succeeded") {
        const ack = await acknowledgeSessionReview(id, takeId);
        if (!cancelled && ack.ok) setSession(ack.value);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, takeId, takeOk, notFound, tick]);

  useEffect(() => {
    return () => {
      setMediaUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  function seekTo(ms: number) {
    const el = mediaRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, ms / 1000);
    void el.play().catch(() => {});
  }

  function performDeleteTake() {
    void (async () => {
      try {
        await deleteTakeData(id, takeId);
        setAlertPayload({
          title: review.dialogAlertTitle,
          description: review.deleteTakeDone,
          afterClose: () => router.push(`/session/${id}`),
        });
      } catch {
        setAlertPayload({
          title: review.dialogErrorTitle,
          description: review.deleteTakeError,
        });
      }
    })();
  }

  if (badTake) {
    return (
      <main className="min-h-dvh px-6 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-3xl rounded-[var(--radius-card)] bg-surface px-6 py-8">
          <div className="text-sm font-semibold text-ink">链接无效</div>
          <div className="mt-2 text-sm text-ink-muted">复盘轮次标识不正确。</div>
          <Link href="/" className="ui-btn ui-btn-sm mt-4 inline-flex">
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-dvh px-6 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-3xl rounded-[var(--radius-card)] bg-surface px-6 py-8">
          <div className="text-sm font-semibold text-ink">会话不存在</div>
          <Link href="/" className="ui-btn ui-btn-sm mt-4 inline-flex">
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  const suggestedBase = `gic-review-${id.slice(0, 8)}-${takeId.slice(0, 8)}`;

  return (
    <main className="min-h-dvh px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 pb-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1 space-y-3">
            <PageHeaderGlobalRow>
              <BackToHomeLink variant="toolbar" />
              <Link href={`/session/${id}`} className="ui-btn ui-btn-sm ui-btn-equal px-4">
                {review.backToSession}
              </Link>
            </PageHeaderGlobalRow>
            <h1 className="text-[20px] font-semibold leading-[1.2] text-ink">{review.pageTitle}</h1>
          </div>
          <div className="shrink-0 lg:max-w-[min(100%,24rem)] lg:pt-0.5">
            <ContextActionsWithDivider>
              <button
                type="button"
                onClick={() => setDeleteTakeOpen(true)}
                className="ui-btn ui-btn-sm ui-btn-equal px-4"
              >
                {review.deleteTake}
              </button>
            </ContextActionsWithDivider>
          </div>
        </header>

        <ConfirmDialog
          open={deleteTakeOpen}
          title={review.deleteTake}
          description={review.confirmDeleteTake}
          cancelLabel={review.dialogCancel}
          confirmLabel={review.dialogConfirmDelete}
          danger
          onClose={() => setDeleteTakeOpen(false)}
          onConfirm={performDeleteTake}
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

        {!session ? (
          <div className="mt-6 text-sm text-ink-muted">加载中…</div>
        ) : (
          <div className="mt-6 flex flex-col gap-6 lg:flex-row">
            <div className="min-w-0 flex-1 space-y-4">
              {mediaUrl && mediaKind === "video" ? (
                /* 固定 16:9 占位，避免 metadata/首帧加载后高度突变导致 CLS */
                <div className="relative w-full overflow-hidden rounded-2xl bg-black aspect-video">
                  <video
                    ref={(el) => {
                      mediaRef.current = el;
                    }}
                    className="h-full w-full object-contain"
                    src={mediaUrl}
                    controls
                    playsInline
                    preload="metadata"
                    onTimeUpdate={(e) => {
                      const t = e.currentTarget.currentTime * 1000;
                      const cur = segments.find((s) => t >= s.start_ms && t < s.end_ms);
                      setActiveSegId(cur?.id ?? null);
                    }}
                  />
                </div>
              ) : null}
              {mediaUrl && mediaKind === "audio" ? (
                <audio
                  ref={(el) => {
                    mediaRef.current = el;
                  }}
                  className="w-full"
                  src={mediaUrl}
                  controls
                  onTimeUpdate={(e) => {
                    const t = e.currentTarget.currentTime * 1000;
                    const cur = segments.find((s) => t >= s.start_ms && t < s.end_ms);
                    setActiveSegId(cur?.id ?? null);
                  }}
                />
              ) : null}

              <div className="rounded-[var(--radius-card)] bg-surface px-4 py-4 md:px-6 md:py-5">
                <h2 className="text-sm font-semibold text-ink">{review.transcriptSection}</h2>
                {sttPending ? (
                  <div
                    className="mt-3 rounded-lg border border-ink/15 bg-ink/[0.04] px-3 py-3 text-sm"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="font-medium text-ink">{stt.summaryLoading}</div>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-ink/10">
                      <div className="h-full w-2/5 animate-pulse rounded-full bg-ink/35" />
                    </div>
                  </div>
                ) : null}
                {segments.length === 0 ? (
                  sttPending ? null : (
                    <p className="mt-3 text-sm text-ink-muted">{stt.emptyFull}</p>
                  )
                ) : (
                  <ul className="mt-3 space-y-2">
                    {segments.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => seekTo(s.start_ms)}
                          disabled={!mediaUrl}
                          aria-label={mediaUrl ? review.segmentJump : undefined}
                          className={`flex w-full gap-3 rounded-xl text-left ${
                            mediaUrl ? "cursor-pointer hover:bg-ink/5" : ""
                          } ${activeSegId === s.id ? "bg-ink/8" : ""}`}
                        >
                          <div className="w-[4.5rem] shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-ink-subtle">
                            {fmt(s.start_ms)}
                          </div>
                          <div className="min-w-0 flex-1 text-sm leading-relaxed text-ink">
                            {s.text || "（无文本）"}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <aside className="w-full shrink-0 space-y-4 lg:w-[min(100%,400px)] xl:w-[min(100%,440px)]">
              <div className="rounded-[var(--radius-card)] bg-page px-4 py-4">
                <h2 className="text-sm font-semibold text-ink">{review.pauseSectionTitle}</h2>
                {pauses.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-muted">{review.noPauses}</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {pauses.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => seekTo(p.start_ms)}
                          disabled={!mediaUrl}
                          className={`w-full rounded-xl px-2 py-2 text-left text-sm text-ink ${
                            mediaUrl ? "hover:bg-ink/5" : ""
                          }`}
                        >
                          {pauseLabel(p)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-[var(--radius-card)] bg-page px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      void downloadTextFile(
                        buildMarkdown(session, segments, pauses),
                        suggestedBase,
                        "md",
                      )
                    }
                    className="ui-btn ui-btn-sm px-3"
                  >
                    {review.exportMd}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void downloadTextFile(buildTxt(session, segments, pauses), suggestedBase, "txt")
                    }
                    className="ui-btn ui-btn-sm px-3"
                  >
                    {review.exportTxt}
                  </button>
                </div>
              </div>

              <ReviewChat transcriptExcerpt={transcriptExcerpt} pausesExcerpt={pausesExcerpt} />
            </aside>
          </div>
        )}

      </div>
    </main>
  );
}
