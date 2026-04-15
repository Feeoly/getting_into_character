"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { RehearsalSettings } from "../_lib/rehearsalTypes";
import { review } from "../_lib/transcription/sttCopy";
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
  /** 排练页顶栏：仅横向按钮 + 回放区，无深色「录制」卡片 */
  inlineToolbar?: boolean;
  /** 与「开始/结束录制」同一行，通常放「设置」 */
  toolbarEnd?: ReactNode;
  /** 窄条布局（卡片模式） */
  compact?: boolean;
  sessionId: string;
  settings: RehearsalSettings;
  /** 父级持有的当前媒体流，用于监听屏幕共享被用户终止等 */
  liveStream: MediaStream | null;
  onLiveStreamChange: (stream: MediaStream | null) => void;
  onPlaybackChange: (playback: StopRecordingResult | null) => void;
  /** 录制中：epoch 与 takeId；结束/错误时为 null */
  onRecordingSessionChange: (s: { epochMs: number; takeId: string } | null) => void;
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

const reviewLinkFocus =
  "focus-visible:!shadow-[0_0_0_2px_rgb(255_255_255/0.35),0_0_0_4px_var(--color-ink)]";

/** 排练录后区：进入复盘（pageGradient 仅排练顶栏/内联回放区用） */
function PlaybackReviewLink({
  sessionId,
  takeId,
  variant = "darkSurface",
}: {
  sessionId: string;
  takeId: string;
  variant?: "darkSurface" | "pageGradient";
}) {
  const btn =
    variant === "pageGradient"
      ? `ui-btn ui-btn-page-header-gradient w-full min-w-[12rem] justify-center !no-underline hover:!no-underline ${reviewLinkFocus} px-5`
      : `ui-btn ui-btn-sm ui-btn-equal ui-btn-surface w-full justify-center !no-underline hover:!no-underline ${reviewLinkFocus} px-4`;
  return (
    <Link href={`/session/${sessionId}/review/${takeId}`} className={btn}>
      {review.openReview}
    </Link>
  );
}

export function RecorderPanel({
  inlineToolbar = false,
  toolbarEnd,
  compact = false,
  sessionId,
  settings,
  liveStream,
  onLiveStreamChange,
  onPlaybackChange,
  onRecordingSessionChange,
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
      onRecordingSessionChange(null);
      setPlayback(res);
      onPlaybackChange(res);
      setStatus("stopped");
    } catch (e) {
      onLiveStreamChange(null);
      onRecordingSessionChange(null);
      setStatus("error");
      setError(toMessage(e));
    }
  }, [onLiveStreamChange, onPlaybackChange, onRecordingSessionChange]);

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
      });
      setKind(res.kind);
      setMimeType(res.mimeType ?? null);
      onLiveStreamChange(res.stream);
      const now = Date.now();
      startedAtRef.current = now;
      onRecordingSessionChange({ epochMs: now, takeId: res.takeId });
      setElapsedSec(0);
      setStatus("recording");
    } catch (e) {
      onLiveStreamChange(null);
      onRecordingSessionChange(null);
      setStatus("error");
      setError(toMessage(e));
    }
  }, [
    onLiveStreamChange,
    onPlaybackChange,
    onRecordingSessionChange,
    settings.cameraEnabled,
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

  const shell = compact
    ? "rounded-xl bg-black/45 px-3 py-2.5 text-white shadow-lg backdrop-blur-md"
    : "rounded-2xl bg-black/45 px-5 py-4 text-white shadow-lg backdrop-blur-md";

  /** 顶栏：结束录制等与深色背景一致 */
  const btnInlineBar =
    "ui-btn ui-btn-equal ui-btn-surface px-4 focus-visible:!shadow-[0_0_0_2px_rgb(255_255_255/0.35),0_0_0_4px_var(--color-ink)]";
  /** 顶栏：开始录制 — 与首页「开始」同源渐变 */
  const btnInlineStart =
    "ui-btn ui-btn-equal ui-btn-page-header-gradient px-4 focus-visible:!shadow-[0_0_0_2px_rgb(255_255_255/0.35),0_0_0_4px_var(--color-ink)]";

  if (inlineToolbar) {
    return (
      <>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            disabled={!canStart}
            onClick={() => void onStart()}
            className={`${btnInlineStart} disabled:opacity-35`}
          >
            开始录制
          </button>
          <button type="button" disabled={!canStop} onClick={() => void onStop()} className={btnInlineBar}>
            结束录制
          </button>
          {toolbarEnd}
        </div>

        {status === "recording" || status === "requesting" ? (
          <div className="mt-1 max-w-sm text-right text-[11px] leading-snug text-white/85 drop-shadow-sm">
            {status === "recording" ? (
              <>
                录制中 · {formatSec(elapsedSec)}（{kind === "video" ? "麦+画面" : "仅麦"}）
              </>
            ) : (
              <>处理中…</>
            )}
            {mimeType && status === "recording" ? (
              <span className="mt-0.5 block text-[10px] text-white/60">格式：{mimeType}</span>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div className="mt-1 max-w-sm text-right text-[11px] text-red-200 drop-shadow-sm">{error}</div>
        ) : null}

        {playback ? (
          <div className="mt-2 w-full max-w-sm space-y-2 rounded-xl bg-black/40 px-3 py-2.5 text-white shadow-md backdrop-blur-md">
            {playback.kind === "video" ? (
              <video className="w-full rounded-lg" src={playback.url} controls playsInline />
            ) : (
              <audio className="w-full" src={playback.url} controls />
            )}
            <div className="space-y-2 rounded-lg bg-white/5 px-2 py-2 text-[11px] text-white/90">
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    const base = `gic-${sessionId.slice(0, 8)}-${playback.takeId.slice(0, 8)}`;
                    await saveRecordingBlob(playback.blob, base);
                  })();
                }}
                className="ui-btn ui-btn-sm ui-btn-surface w-full min-w-[12rem] px-5 focus-visible:!shadow-[0_0_0_2px_rgb(255_255_255/0.35),0_0_0_4px_var(--color-ink)]"
              >
                保存到本地
              </button>
              <PlaybackReviewLink
                sessionId={sessionId}
                takeId={playback.takeId}
                variant="pageGradient"
              />
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div className={shell}>
      <div
        className={
          compact
            ? "flex flex-col gap-2.5"
            : "flex flex-wrap items-center justify-between gap-3"
        }
      >
        <div className={compact ? "min-w-0" : ""}>
          <div className={compact ? "text-xs font-semibold" : "text-sm font-semibold"}>录制</div>
          <div className={compact ? "mt-0.5 text-[11px] leading-snug text-white/78" : "mt-1 text-sm text-white/80"}>
            {status === "recording" ? (
              <>
                录制中 · {formatSec(elapsedSec)}（
                {kind === "video" ? "麦+画面" : "仅麦"}
                ）
              </>
            ) : status === "requesting" ? (
              <>处理中…</>
            ) : status === "stopped" ? (
              <>已停止，可回放</>
            ) : (
              <>
                {compact
                  ? "开始后请求权限（麦；开摄像头则多请求画面）"
                  : "点击开始后才会请求权限（麦克风；若开启摄像头会同时请求画面）"}
              </>
            )}
          </div>
          {mimeType ? (
            <div
              className={
                compact ? "mt-0.5 text-[10px] text-white/55" : "mt-1 text-xs text-white/60"
              }
            >
              格式：{mimeType}
            </div>
          ) : null}
        </div>

        <div className={compact ? "flex w-full flex-col gap-2" : "flex flex-wrap gap-3"}>
          <button
            type="button"
            disabled={!canStart}
            onClick={() => void onStart()}
            className={
              compact
                ? "ui-btn ui-btn-sm ui-btn-equal ui-btn-surface w-full px-3 focus-visible:!shadow-[0_0_0_2px_rgb(255_255_255/0.35),0_0_0_4px_var(--color-ink)] disabled:opacity-35"
                : "ui-btn ui-btn-equal ui-btn-surface px-6 focus-visible:!shadow-[0_0_0_2px_rgb(255_255_255/0.35),0_0_0_4px_var(--color-ink)] disabled:opacity-35"
            }
          >
            开始录制
          </button>
          <button
            type="button"
            disabled={!canStop}
            onClick={() => void onStop()}
            className={
              compact
                ? "ui-btn ui-btn-sm ui-btn-equal ui-btn-surface w-full px-3 focus-visible:!shadow-[0_0_0_2px_rgb(255_255_255/0.35),0_0_0_4px_var(--color-ink)]"
                : "ui-btn ui-btn-equal ui-btn-surface px-6 focus-visible:!shadow-[0_0_0_2px_rgb(255_255_255/0.35),0_0_0_4px_var(--color-ink)]"
            }
          >
            结束录制
          </button>
        </div>
      </div>

      {error ? (
        <div className={compact ? "mt-2 text-[11px] text-red-300" : "mt-3 text-sm text-red-300"}>
          {error}
        </div>
      ) : null}

      {playback ? (
        <div className={compact ? "mt-3 space-y-2" : "mt-4 space-y-3"}>
          {playback.kind === "video" ? (
            <video className="w-full rounded-lg" src={playback.url} controls playsInline />
          ) : (
            <audio className="w-full" src={playback.url} controls />
          )}
          <div
            className={
              compact
                ? "space-y-2 rounded-lg bg-white/5 px-2 py-2 text-[11px] text-white/90"
                : "space-y-2 rounded-lg bg-white/5 px-3 py-3 text-sm text-white/90"
            }
          >
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  const base = `gic-${sessionId.slice(0, 8)}-${playback.takeId.slice(0, 8)}`;
                  await saveRecordingBlob(playback.blob, base);
                })();
              }}
              className={
                compact
                  ? "ui-btn ui-btn-sm ui-btn-surface w-full min-w-[12rem] px-5 focus-visible:!shadow-[0_0_0_2px_rgb(255_255_255/0.35),0_0_0_4px_var(--color-ink)]"
                  : "ui-btn ui-btn-sm ui-btn-surface w-full min-w-[14rem] px-6 focus-visible:!shadow-[0_0_0_2px_rgb(255_255_255/0.35),0_0_0_4px_var(--color-ink)]"
              }
            >
              保存到本地
            </button>
            <PlaybackReviewLink sessionId={sessionId} takeId={playback.takeId} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

