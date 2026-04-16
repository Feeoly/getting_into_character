"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  failStaleProcessingJobs,
  getLatestJobForSession,
  listSegmentsForTake,
} from "./transcriptRepo";
import type { TranscriptionJobRow } from "./transcriptionTypes";
import { previewSnippet, review, stt } from "./sttCopy";
import {
  retryTranscriptionForTake,
  startTranscriptionRunner,
} from "./transcriptionRunner";

type Props = { sessionId: string };

function statusLabel(status: TranscriptionJobRow["status"]): string {
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

export function TranscriptSummaryCard({ sessionId }: Props) {
  const [job, setJob] = useState<TranscriptionJobRow | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [tick, setTick] = useState(0);
  const [retryHint, setRetryHint] = useState<string | null>(null);

  useEffect(() => {
    startTranscriptionRunner();
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setTick((x) => x + 1), 2000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await failStaleProcessingJobs();
      const j = await getLatestJobForSession(sessionId);
      if (cancelled) return;
      setJob(j);
      if (!j) {
        setPreview("");
        return;
      }
      if (j.status === "succeeded") {
        const segs = await listSegmentsForTake(sessionId, j.takeId);
        if (cancelled) return;
        const full = segs.map((s) => s.text).join("");
        setPreview(previewSnippet(full));
      } else {
        setPreview("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, tick]);

  const takeIdForLink = job?.takeId;

  return (
    <div className="rounded-[var(--radius-card)] bg-surface px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="text-sm font-semibold text-ink">{stt.sectionTitle}</div>
        {job ? (
          <span className="inline-flex min-h-7 items-center rounded-full bg-page px-3 text-xs font-semibold text-ink-muted">
            {statusLabel(job.status)}
          </span>
        ) : null}
      </div>

      {!job ? (
        <div className="mt-3 space-y-1">
          <div className="text-sm font-semibold text-ink">{stt.emptyHeading}</div>
          <div className="text-sm text-ink-muted">{stt.emptyBody}</div>
        </div>
      ) : job.status === "queued" || job.status === "processing" ? (
        <div className="mt-3 space-y-2">
          <div className="text-sm text-ink-muted">{stt.summaryLoading}</div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-ink/10">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-ink/25" />
          </div>
        </div>
      ) : job.status === "failed" ? (
        <div className="mt-3 space-y-2">
          <div className="text-sm text-ink-muted">{stt.errorInline}</div>
          {retryHint ? (
            <div className="text-sm text-amber-800">{retryHint}</div>
          ) : null}
          <button
            type="button"
            className="ui-btn ui-btn-sm ui-btn-equal"
            onClick={() => {
              setRetryHint(null);
              void (async () => {
                const ok = await retryTranscriptionForTake(sessionId, job.takeId);
                if (!ok) setRetryHint(stt.retryNoBlob);
                setTick((x) => x + 1);
              })();
            }}
          >
            {stt.inlineRetry}
          </button>
          <Link
            href={`/session/${sessionId}/review/${job.takeId}`}
            className="ui-btn ui-btn-sm ui-btn-equal mt-2 inline-flex"
          >
            {review.openReview}
          </Link>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {preview ? (
            <div className="text-sm text-ink-muted">{preview}</div>
          ) : (
            <div className="text-sm text-ink-muted">{stt.emptyHeading}</div>
          )}
          {takeIdForLink ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <Link
                href={`/session/${sessionId}/transcript/${takeIdForLink}`}
                className="ui-btn ui-btn-sm ui-btn-equal inline-flex"
              >
                {stt.enterTranscript}
              </Link>
              <Link
                href={`/session/${sessionId}/review/${takeIdForLink}`}
                className="ui-btn ui-btn-sm ui-btn-equal inline-flex"
              >
                {review.openReview}
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
