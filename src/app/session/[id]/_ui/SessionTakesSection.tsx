"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listTakesForSession } from "../rehearsal/_lib/transcription/transcriptRepo";
import type { TranscriptionJobRow } from "../rehearsal/_lib/transcription/transcriptionTypes";
import {
  retryTranscriptionForTake,
  startTranscriptionRunner,
} from "../rehearsal/_lib/transcription/transcriptionRunner";
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

  if (total === 0) {
    return (
      <div className="rounded-lg border border-border/80 bg-white px-6 py-5">
        <div className="text-sm font-semibold text-ink">排练记录</div>
        <p className="mt-2 text-sm text-ink-muted">
          每次进入排练并保存的录音会出现在此，可分别转写与复盘；可多次排练，记录均保留。
        </p>
        <p className="mt-3 text-sm text-ink-subtle">暂无录音轮次。</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/80 bg-white px-6 py-5">
      <div className="text-sm font-semibold text-ink">排练记录</div>
      <p className="mt-1 text-sm text-ink-muted">
        每轮录音独立保留；下方从新到旧排列，可进入转写或复盘。
      </p>
      <ul className="mt-4 space-y-3">
        {takes.map((row, i) => {
          const n = total - i;
          const j = row.latestJob;
          return (
            <li
              key={row.takeId}
              className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card-tan/25 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="text-sm font-semibold text-ink">
                  第 {n} 轮 · {formatWhen(j.createdAt)}
                </div>
                <div className="mt-1 text-xs text-ink-muted">
                  <span className="font-medium text-ink-muted">{jobStatusLabel(j.status)}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {j.status === "failed" ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-link hover:underline"
                    onClick={() =>
                      void (async () => {
                        await retryTranscriptionForTake(sessionId, row.takeId);
                        setTick((x) => x + 1);
                      })()
                    }
                  >
                    {stt.inlineRetry}
                  </button>
                ) : null}
                {j.status === "succeeded" ? (
                  <>
                    <Link
                      href={`/session/${sessionId}/transcript/${row.takeId}`}
                      className="text-xs font-semibold text-ink-muted hover:underline"
                    >
                      查看转写
                    </Link>
                    <Link
                      href={`/session/${sessionId}/review/${row.takeId}`}
                      className="text-xs font-semibold text-link hover:underline"
                    >
                      {review.openReview}
                    </Link>
                  </>
                ) : null}
                {(j.status === "queued" || j.status === "processing") && (
                  <span className="text-xs text-ink-subtle">{stt.summaryLoading}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
