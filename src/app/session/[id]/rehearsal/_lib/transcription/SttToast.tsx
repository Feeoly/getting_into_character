"use client";

import { useEffect, useState } from "react";

import { stt } from "./sttCopy";
import { retryTranscriptionForTake, subscribeTranscriptionJobFailed } from "./transcriptionRunner";

type Props = { sessionId: string };

export function SttToast({ sessionId }: Props) {
  const [open, setOpen] = useState(false);
  const [failedTakeId, setFailedTakeId] = useState<string | null>(null);

  useEffect(() => {
    return subscribeTranscriptionJobFailed(({ takeId }) => {
      setFailedTakeId(takeId);
      setOpen(true);
    });
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-6">
      <div className="pointer-events-auto w-full max-w-md rounded-xl border border-white/25 bg-black/80 px-4 py-3 text-white shadow-xl backdrop-blur-md">
        <div className="text-sm font-semibold">{stt.toastFailTitle}</div>
        <div className="mt-1 text-sm text-white/85">{stt.toastFailBody}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={() => {
              if (failedTakeId) void retryTranscriptionForTake(sessionId, failedTakeId);
              setOpen(false);
            }}
          >
            {stt.toastRetry}
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15"
            onClick={() => setOpen(false)}
          >
            {stt.toastDismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
