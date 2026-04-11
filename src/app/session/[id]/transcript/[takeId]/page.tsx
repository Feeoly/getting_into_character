"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { z } from "zod";

import { getSessionById } from "../../../../_lib/sessionRepo";
import type { Session } from "../../../../_lib/sessionTypes";
import { listSegmentsForTake } from "../../rehearsal/_lib/transcription/transcriptRepo";
import type { TranscriptSegmentRow } from "../../rehearsal/_lib/transcription/transcriptionTypes";
import { stt } from "../../rehearsal/_lib/transcription/sttCopy";
import {
  retryTranscriptionForTake,
  startTranscriptionRunner,
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
  const [tick, setTick] = useState(0);

  const takeOk = takeIdSchema.safeParse(takeId).success;

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
    if (!takeOk || notFound) return;
    let cancelled = false;
    (async () => {
      const segs = await listSegmentsForTake(id, takeId);
      if (cancelled) return;
      setSegments(segs);
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
    if (!session) return;
    if (!window.confirm(stt.confirmRetranscribe)) return;
    void (async () => {
      const ok = await retryTranscriptionForTake(session.id, takeId);
      if (!ok) window.alert(stt.retryNoBlob);
      setTick((x) => x + 1);
    })();
  }

  if (badTake) {
    return (
      <main className="px-6 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white px-6 py-8">
          <div className="text-sm font-semibold text-slate-900">链接无效</div>
          <div className="mt-2 text-sm text-slate-600">转写轮次标识不正确。</div>
          <div className="mt-4">
            <Link href="/" className="text-sm font-semibold text-blue-600">
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
        <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white px-6 py-8">
          <div className="text-sm font-semibold text-slate-900">会话不存在</div>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-blue-600">
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#F8FAFC] px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-semibold leading-[1.2] text-slate-900">
              {stt.fullPageTitle}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{stt.fullPageHint}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRetranscribe}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              {stt.retranscribe}
            </button>
            <Link
              href={`/session/${id}`}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              返回会话
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm md:px-6 md:py-5">
          {!session ? (
            <div className="text-sm text-slate-600">加载中…</div>
          ) : segments.length === 0 ? (
            <div className="text-sm text-slate-600">{stt.emptyFull}</div>
          ) : (
            <ul className="space-y-2">
              {segments.map((s, i) => (
                <li key={s.id}>
                  {i > 0 ? <div className="mb-2 h-1 w-full rounded-full bg-[#E2E8F0]" /> : null}
                  <div className="flex gap-3">
                    <div
                      className="w-[4.5rem] shrink-0 pt-0.5 text-left text-sm font-semibold tabular-nums text-slate-500"
                    >
                      {fmt(s.start_ms)}
                    </div>
                    <div className="min-w-0 flex-1 text-sm leading-relaxed text-slate-800">
                      {s.text || "（无文本）"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
