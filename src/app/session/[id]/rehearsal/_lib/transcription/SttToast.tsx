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
      <div className="pointer-events-auto w-full max-w-md rounded-xl bg-black/80 px-4 py-3 text-white shadow-xl backdrop-blur-md">
        <div className="text-sm font-semibold">{stt.toastFailTitle}</div>
        <div className="mt-1 text-sm text-white/85">{stt.toastFailBody}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="ui-btn ui-btn-equal ui-btn-surface px-4 focus-visible:!shadow-[0_0_0_2px_rgb(255_255_255/0.35),0_0_0_4px_var(--color-ink)]"
            onClick={() => {
              void (async () => {
                if (failedTakeId) {
                  const ok = await retryTranscriptionForTake(sessionId, failedTakeId);
                  if (!ok) window.alert(stt.retryNoBlob);
                }
                setOpen(false);
              })();
            }}
          >
            {stt.toastRetry}
          </button>
          <button
            type="button"
            className="ui-btn ui-btn-equal ui-btn-surface px-4 focus-visible:!shadow-[0_0_0_2px_rgb(255_255_255/0.35),0_0_0_4px_var(--color-ink)]"
            onClick={() => setOpen(false)}
          >
            {stt.toastDismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
