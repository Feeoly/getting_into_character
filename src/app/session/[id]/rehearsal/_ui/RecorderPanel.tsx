"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { RehearsalSettings } from "../_lib/rehearsalTypes";
import {
  startRecording,
  stopRecording,
  type RecordingError,
  type RecordingKind,
  type StopRecordingResult,
} from "../_lib/recording";

type Status = "idle" | "requesting" | "recording" | "stopped" | "error";

type Props = {
  settings: RehearsalSettings;
  /** 父级持有的当前媒体流，用于监听屏幕共享被用户终止等 */
  liveStream: MediaStream | null;
  onLiveStreamChange: (stream: MediaStream | null) => void;
  onPlaybackChange: (playback: StopRecordingResult | null) => void;
  onRecordingEpochStart: (epochMs: number | null) => void;
};

function formatSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function toMessage(e: unknown): string {
  const err = e as Partial<RecordingError> | undefined;
  return err?.message ?? "操作失败。请刷新后重试。";
}

export function RecorderPanel({
  settings,
  liveStream,
  onLiveStreamChange,
  onPlaybackChange,
  onRecordingEpochStart,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<RecordingKind>("audio");
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [playback, setPlayback] = useState<StopRecordingResult | null>(null);

  const startedAtRef = useRef<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  const canStart = useMemo(() => status === "idle" || status === "stopped" || status === "error", [status]);
  const canStop = useMemo(() => status === "recording" || status === "requesting", [status]);

  const onStop = useCallback(async () => {
    setError(null);
    setStatus("requesting");
    try {
      const res = await stopRecording();
      onLiveStreamChange(null);
      onRecordingEpochStart(null);
      setPlayback(res);
      onPlaybackChange(res);
      setStatus("stopped");
    } catch (e) {
      onLiveStreamChange(null);
      onRecordingEpochStart(null);
      setStatus("error");
      setError(toMessage(e));
    }
  }, [onLiveStreamChange, onPlaybackChange, onRecordingEpochStart]);

  const onStart = useCallback(async () => {
    setError(null);
    setStatus("requesting");
    onPlaybackChange(null);
    setPlayback(null);
    try {
      const res = await startRecording({
        cameraEnabled: settings.cameraEnabled,
        screenShareEnabled: settings.screenShareEnabled,
      });
      setKind(res.kind);
      setMimeType(res.mimeType ?? null);
      onLiveStreamChange(res.stream);
      const now = Date.now();
      startedAtRef.current = now;
      onRecordingEpochStart(now);
      setElapsedSec(0);
      setStatus("recording");
    } catch (e) {
      onLiveStreamChange(null);
      onRecordingEpochStart(null);
      setStatus("error");
      setError(toMessage(e));
    }
  }, [
    onLiveStreamChange,
    onPlaybackChange,
    onRecordingEpochStart,
    settings.cameraEnabled,
    settings.screenShareEnabled,
  ]);

  useEffect(() => {
    if (status !== "recording" || !liveStream) return;
    const vts = liveStream.getVideoTracks();
    const onEnded = () => {
      void onStop();
    };
    vts.forEach((t) => t.addEventListener("ended", onEnded));
    return () => vts.forEach((t) => t.removeEventListener("ended", onEnded));
  }, [status, liveStream, onStop]);

  useEffect(() => {
    if (status !== "recording") return;
    const t = window.setInterval(() => {
      const startedAt = startedAtRef.current;
      if (!startedAt) return;
      setElapsedSec(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 250);
    return () => window.clearInterval(t);
  }, [status]);

  useEffect(() => {
    return () => {
      if (playback?.url) URL.revokeObjectURL(playback.url);
    };
  }, [playback?.url]);

  return (
    <div className="rounded-2xl border border-white/25 bg-black/45 px-5 py-4 text-white shadow-lg backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">录制</div>
          <div className="mt-1 text-sm text-white/80">
            {status === "recording" ? (
              <>
                录制中 · {formatSec(elapsedSec)}（
                {kind === "video"
                  ? settings.screenShareEnabled
                    ? "麦克风 + 屏幕"
                    : "麦克风 + 摄像头"
                  : "仅麦克风"}
                ）
              </>
            ) : status === "requesting" ? (
              <>处理中…</>
            ) : status === "stopped" ? (
              <>已停止，可回放本次内容</>
            ) : (
              <>点击开始后才会请求权限（麦克风；若开启摄像头或录屏会额外请求）</>
            )}
          </div>
          {mimeType ? (
            <div className="mt-1 text-xs text-white/60">格式：{mimeType}</div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!canStart}
            onClick={() => void onStart()}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm outline-none ring-offset-2 ring-offset-slate-900 transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
          >
            开始录制
          </button>
          <button
            type="button"
            disabled={!canStop}
            onClick={() => void onStop()}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/30 bg-white/10 px-6 text-sm font-semibold text-white outline-none ring-offset-2 ring-offset-slate-900 transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
          >
            结束录制
          </button>
        </div>
      </div>

      {error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}

      {playback ? (
        <div className="mt-4">
          {playback.kind === "video" ? (
            <video className="w-full rounded-lg" src={playback.url} controls playsInline />
          ) : (
            <audio className="w-full" src={playback.url} controls />
          )}
        </div>
      ) : null}
    </div>
  );
}

