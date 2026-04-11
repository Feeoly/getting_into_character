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
import { saveRecordingBlob } from "../_lib/saveRecordingToDisk";

type Status = "idle" | "requesting" | "recording" | "stopped" | "error";

type Props = {
  sessionId: string;
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
  sessionId,
  settings,
  liveStream,
  onLiveStreamChange,
  onPlaybackChange,
  onRecordingEpochStart,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [saveHint, setSaveHint] = useState<string | null>(null);
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
    setPlayback((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
    onPlaybackChange(null);
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
            className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm outline-none ring-offset-2 ring-offset-slate-900 transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-35"
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
        <div className="mt-4 space-y-3">
          {playback.kind === "video" ? (
            <video className="w-full rounded-lg" src={playback.url} controls playsInline />
          ) : (
            <audio className="w-full" src={playback.url} controls />
          )}
          <div className="rounded-lg border border-white/20 bg-white/5 px-3 py-3 text-sm text-white/90">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSaveHint(null);
                  void (async () => {
                    const base = `gic-${sessionId.slice(0, 8)}-${playback.takeId.slice(0, 8)}`;
                    const r = await saveRecordingBlob(playback.blob, base);
                    if (!r.ok) {
                      if (r.reason === "cancelled") setSaveHint("已取消保存。");
                      return;
                    }
                    setSaveHint(
                      r.via === "picker"
                        ? "已写入您选择的位置。可在资源管理器 / 访达中打开该文件夹查看。"
                        : "已触发下载，通常在系统「下载」文件夹中；可在浏览器下载记录里打开所在文件夹。",
                    );
                  })();
                }}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-white/35 bg-white/10 px-4 text-sm font-semibold text-white outline-none ring-offset-2 ring-offset-slate-900 transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
              >
                保存到本地…
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/65">
              网页不能静默写入磁盘，也无法在保存后显示完整系统路径。支持「另存为」的浏览器（如 Chrome）
              可选任意文件夹；否则会下载到默认下载目录。
            </p>
            {saveHint ? <p className="mt-2 text-xs text-emerald-200/95">{saveHint}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

