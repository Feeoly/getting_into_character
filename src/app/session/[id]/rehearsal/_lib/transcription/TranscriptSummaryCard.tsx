"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  failStaleProcessingJobs,
  getLatestJobForSession,
  listSegmentsForTake,
} from "./transcriptRepo";
import type { TranscriptionJobRow } from "./transcriptionTypes";
import { previewSnippet, stt } from "./sttCopy";
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
    <div className="rounded-lg border border-slate-200 bg-white px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900">{stt.sectionTitle}</div>
        {job ? (
          <span className="inline-flex min-h-7 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700">
            {statusLabel(job.status)}
          </span>
        ) : null}
      </div>

      {!job ? (
        <div className="mt-3 space-y-1">
          <div className="text-sm font-semibold text-slate-800">{stt.emptyHeading}</div>
          <div className="text-sm text-slate-600">{stt.emptyBody}</div>
        </div>
      ) : job.status === "queued" || job.status === "processing" ? (
        <div className="mt-3 space-y-2">
          <div className="text-sm text-slate-600">{stt.summaryLoading}</div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-blue-600/40" />
          </div>
        </div>
      ) : job.status === "failed" ? (
        <div className="mt-3 space-y-2">
          <div className="text-sm text-slate-600">{stt.errorInline}</div>
          <button
            type="button"
            className="text-sm font-semibold text-blue-600 underline-offset-2 hover:underline"
            onClick={() => void retryTranscriptionForTake(sessionId, job.takeId)}
          >
            {stt.inlineRetry}
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {preview ? (
            <div className="text-sm text-slate-700">{preview}</div>
          ) : (
            <div className="text-sm text-slate-600">{stt.emptyHeading}</div>
          )}
          {takeIdForLink ? (
            <Link
              href={`/session/${sessionId}/transcript/${takeIdForLink}`}
              className="inline-flex text-sm font-semibold text-blue-600 underline-offset-2 hover:underline"
            >
              {stt.viewFull}
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
