"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listTakesForSession } from "../rehearsal/_lib/transcription/transcriptRepo";
import type { TranscriptionJobRow } from "../rehearsal/_lib/transcription/transcriptionTypes";
import { startTranscriptionRunner } from "../rehearsal/_lib/transcription/transcriptionRunner";
import { review, stt } from "../rehearsal/_lib/transcription/sttCopy";

function formatWhen(ms: number) {
  return new Date(ms).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function jobStatusLabel(status: TranscriptionJobRow["status"]): string {
  switch (status) {
    case "queued":
      return stt.jobQueued;
    case "processing":
      return stt.jobProcessing;
    case "succeeded":
      return stt.jobSucceeded;
    case "failed":
      return stt.jobFailed;
    default:
      return status;
  }
}

type Props = { sessionId: string };

export function SessionTakesSection({ sessionId }: Props) {
  const [takes, setTakes] = useState<{ takeId: string; latestJob: TranscriptionJobRow }[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    startTranscriptionRunner();
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setTick((x) => x + 1), 2000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const list = await listTakesForSession(sessionId);
      if (!cancelled) setTakes(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, tick]);

  const total = takes.length;

  /** 整块高度上限 580px，列表区单独滚动 */
  const shellClass =
    "flex min-h-0 max-h-[580px] flex-col rounded-[var(--radius-card)] bg-surface px-5 py-5 sm:px-6";

  if (total === 0) {
    return (
      <div className={shellClass}>
        <div className="shrink-0 text-sm font-semibold text-ink">排练记录</div>
        <p className="mt-2 text-sm text-ink-muted">
          每次进入排练并保存的录音会出现在此，可分别转写与复盘；可多次排练，记录均保留。
        </p>
        <p className="mt-3 text-sm text-ink-subtle">暂无录音轮次。</p>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className="shrink-0">
        <div className="text-sm font-semibold text-ink">排练记录</div>
        <p className="mt-1 text-sm text-ink-muted">
          每轮录音独立保留；从新到旧排列，可进入转写或复盘。
        </p>
      </div>
      <ul className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain pr-0.5 [-webkit-overflow-scrolling:touch]">
        {takes.map((row, i) => {
          const n = total - i;
          const j = row.latestJob;
          return (
            <li key={row.takeId} className="w-full">
              <div className="rehearsal-take-gradient-border px-4 py-4">
                <div className="text-sm font-semibold leading-snug text-ink">
                  第 {n} 轮 · {formatWhen(j.createdAt)}
                </div>
                <div className="mt-2 text-xs text-ink-muted">
                  <span className="font-medium">{jobStatusLabel(j.status)}</span>
                </div>
                <div className="mt-4 flex flex-row flex-wrap items-center gap-2 pt-3">
                  {j.status === "succeeded" ? (
                    <>
                      <Link
                        href={`/session/${sessionId}/transcript/${row.takeId}`}
                        className="ui-btn ui-btn-sm ui-btn-equal"
                      >
                        {stt.enterTranscript}
                      </Link>
                      <Link
                        href={`/session/${sessionId}/review/${row.takeId}`}
                        className="ui-btn ui-btn-sm ui-btn-equal"
                      >
                        {review.openReview}
                      </Link>
                    </>
                  ) : null}
                  {(j.status === "queued" || j.status === "processing") ? (
                    <>
                      <span className="text-xs text-ink-subtle">{stt.summaryLoading}</span>
                      <Link
                        href={`/session/${sessionId}/transcript/${row.takeId}`}
                        className="ui-btn ui-btn-sm ui-btn-equal"
                      >
                        {stt.enterTranscript}
                      </Link>
                      <Link
                        href={`/session/${sessionId}/review/${row.takeId}`}
                        className="ui-btn ui-btn-sm ui-btn-equal"
                      >
                        {review.openReview}
                      </Link>
                    </>
                  ) : null}
                  {j.status === "failed" ? (
                    <>
                      <Link
                        href={`/session/${sessionId}/transcript/${row.takeId}`}
                        className="ui-btn ui-btn-sm ui-btn-equal"
                      >
                        {stt.enterTranscript}
                      </Link>
                      <Link
                        href={`/session/${sessionId}/review/${row.takeId}`}
                        className="ui-btn ui-btn-sm ui-btn-equal"
                      >
                        {review.openReview}
                      </Link>
                    </>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
