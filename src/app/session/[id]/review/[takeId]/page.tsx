"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { BackToHomeLink } from "../../../../_ui/BackToHomeLink";
import { getSessionById } from "../../../../_lib/sessionRepo";
import type { Session } from "../../../../_lib/sessionTypes";
import { listPauseEventsForTake } from "../../rehearsal/_lib/rehearsalRepo";
import type { PauseEvent } from "../../rehearsal/_lib/rehearsalTypes";
import {
  deleteTakeData,
  getLatestJobForTake,
  listSegmentsForTake,
} from "../../rehearsal/_lib/transcription/transcriptRepo";
import type { TranscriptSegmentRow } from "../../rehearsal/_lib/transcription/transcriptionTypes";
import { review, stt } from "../../rehearsal/_lib/transcription/sttCopy";
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
  const title = session?.name ?? "排练会话";
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
  const title = session?.name ?? "排练会话";
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
      const [segs, ps, job] = await Promise.all([
        listSegmentsForTake(id, takeId),
        listPauseEventsForTake(id, takeId),
        getLatestJobForTake(id, takeId),
      ]);
      if (cancelled) return;
      setSegments(segs);
      setPauses(ps);
      if (job?.audioBlob && job.audioBlob.size > 0) {
        const mime = job.mimeType.toLowerCase();
        const k = mime.startsWith("video/") ? "video" : "audio";
        setMediaKind(k);
        const url = URL.createObjectURL(job.audioBlob);
        setMediaUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } else {
        setMediaKind(null);
        setMediaUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, takeId, takeOk, notFound]);

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

  function onDeleteTake() {
    if (!window.confirm(review.confirmDeleteTake)) return;
    void (async () => {
      try {
        await deleteTakeData(id, takeId);
        window.alert(review.deleteTakeDone);
        router.push(`/session/${id}`);
      } catch {
        window.alert("删除失败，请重试。");
      }
    })();
  }

  if (badTake) {
    return (
      <main className="min-h-dvh bg-[#F8FAFC] px-6 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white px-6 py-8">
          <div className="text-sm font-semibold text-slate-900">链接无效</div>
          <div className="mt-2 text-sm text-slate-600">复盘轮次标识不正确。</div>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-blue-600">
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-dvh bg-[#F8FAFC] px-6 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white px-6 py-8">
          <div className="text-sm font-semibold text-slate-900">会话不存在</div>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-blue-600">
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  const suggestedBase = `gic-review-${id.slice(0, 8)}-${takeId.slice(0, 8)}`;

  return (
    <main className="min-h-dvh bg-[#F8FAFC] px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-[20px] font-semibold leading-[1.2] text-slate-900">{review.pageTitle}</h1>
            <p className="mt-1 text-sm text-slate-500">{review.subtitleHint}</p>
            <p className="mt-1 text-xs text-slate-500">{stt.fullPageHint}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BackToHomeLink />
            <button
              type="button"
              onClick={() =>
                void downloadTextFile(buildMarkdown(session, segments, pauses), suggestedBase, "md")
              }
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              {review.exportMd}
            </button>
            <button
              type="button"
              onClick={() =>
                void downloadTextFile(buildTxt(session, segments, pauses), suggestedBase, "txt")
              }
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              {review.exportTxt}
            </button>
            <Link
              href={`/session/${id}`}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              {review.backToSession}
            </Link>
          </div>
        </header>

        {!session ? (
          <div className="mt-6 text-sm text-slate-600">加载中…</div>
        ) : (
          <div className="mt-6 flex flex-col gap-6 lg:flex-row">
            <div className="min-w-0 flex-1 space-y-4">
              {mediaUrl && mediaKind === "video" ? (
                <video
                  ref={(el) => {
                    mediaRef.current = el;
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-black"
                  src={mediaUrl}
                  controls
                  playsInline
                  onTimeUpdate={(e) => {
                    const t = e.currentTarget.currentTime * 1000;
                    const cur = segments.find((s) => t >= s.start_ms && t < s.end_ms);
                    setActiveSegId(cur?.id ?? null);
                  }}
                />
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

              <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm md:px-6 md:py-5">
                <h2 className="text-sm font-semibold text-slate-900">{review.transcriptSection}</h2>
                {segments.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-600">{stt.emptyFull}</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {segments.map((s, i) => (
                      <li key={s.id}>
                        {i > 0 ? <div className="mb-2 h-1 w-full rounded-full bg-[#E2E8F0]" /> : null}
                        <button
                          type="button"
                          onClick={() => seekTo(s.start_ms)}
                          disabled={!mediaUrl}
                          aria-label={mediaUrl ? review.segmentJump : undefined}
                          className={`flex w-full gap-3 rounded-md text-left ${
                            mediaUrl ? "cursor-pointer hover:bg-slate-50" : ""
                          } ${activeSegId === s.id ? "bg-blue-50/60" : ""}`}
                        >
                          <div className="w-[4.5rem] shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-slate-500">
                            {fmt(s.start_ms)}
                          </div>
                          <div className="min-w-0 flex-1 text-sm leading-relaxed text-slate-800">
                            {s.text || "（无文本）"}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <aside className="w-full shrink-0 space-y-4 lg:w-[340px]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">{review.pauseSectionTitle}</h2>
                {pauses.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-600">{review.noPauses}</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {pauses.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => seekTo(p.start_ms)}
                          disabled={!mediaUrl}
                          className={`w-full rounded-md px-2 py-2 text-left text-sm text-slate-800 ${
                            mediaUrl ? "hover:bg-white" : ""
                          }`}
                        >
                          {pauseLabel(p)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <ReviewChat transcriptExcerpt={transcriptExcerpt} pausesExcerpt={pausesExcerpt} />
            </aside>
          </div>
        )}

        {session ? (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-sm font-semibold text-slate-900">{review.dangerZone}</p>
            <button
              type="button"
              onClick={onDeleteTake}
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50"
            >
              {review.deleteTake}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
