"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";

import { getSessionById } from "../../../_lib/sessionRepo";
import type { Session } from "../../../_lib/sessionTypes";
import {
  getRehearsalSettings,
  getUploadedBackground,
  saveRehearsalSettings,
  saveUploadedBackground,
} from "./_lib/rehearsalRepo";
import type { RehearsalSettings } from "./_lib/rehearsalTypes";
import type { StopRecordingResult } from "./_lib/recording";
import { SettingsDrawer } from "./_ui/SettingsDrawer";
import { PreviewDraggable } from "./_ui/PreviewDraggable";
import { RecorderPanel } from "./_ui/RecorderPanel";
import { PauseToast } from "./_ui/PauseToast";
import { createPauseDetector } from "./_lib/pauseDetector";
import { addPauseEvent } from "./_lib/rehearsalRepo";

function bgImageSrc(presetId: string | undefined): string {
  if (presetId === "bg-2") return "/rehearsal/backgrounds/bg-2.jpg";
  return "/rehearsal/backgrounds/bg-1.jpg";
}

export default function RehearsalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [settings, setSettings] = useState<RehearsalSettings | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [playback, setPlayback] = useState<StopRecordingResult | null>(null);
  const [recordingEpochStartMs, setRecordingEpochStartMs] = useState<number | null>(null);

  const [toastText, setToastText] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const currentPausePromptShownRef = useRef(false);
  const currentPauseStartEpochRef = useRef<number | null>(null);

  const [uploadedBgUrl, setUploadedBgUrl] = useState<string | null>(null);
  const uploadedBgUrlRef = useRef<string | null>(null);

  const uploadedBackgroundAvailable = Boolean(settings?.uploadedBackgroundId);

  const background = useMemo(() => {
    if (!settings) return { kind: "image" as const, src: "/rehearsal/backgrounds/bg-1.jpg" };

    if (settings.backgroundSource === "preset_video") {
      return { kind: "video" as const, src: "/rehearsal/backgrounds/bg-loop.mp4" };
    }

    if (settings.backgroundSource === "upload_image" && uploadedBgUrl) {
      return { kind: "image" as const, src: uploadedBgUrl };
    }

    return { kind: "image" as const, src: bgImageSrc(settings.presetId) };
  }, [settings, uploadedBgUrl]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setNotFound(false);
    setSession(null);
    setSettings(null);

    (async () => {
      const s = await getSessionById(id);
      if (cancelled) return;
      if (!s) {
        setNotFound(true);
        return;
      }
      setSession(s);

      const st = await getRehearsalSettings(id);
      if (cancelled) return;
      setSettings(st);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (uploadedBgUrlRef.current) URL.revokeObjectURL(uploadedBgUrlRef.current);
      uploadedBgUrlRef.current = null;
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!settings) return;
    if (!liveStream) return;
    if (recordingEpochStartMs === null) return;

    // 与 <video srcObject=同一流> 并行时，部分浏览器 WebAudio 会导致画面黑屏；分析用 clone
    let streamForDetector: MediaStream = liveStream;
    try {
      streamForDetector = liveStream.clone();
    } catch {
      // 极少数环境不支持 clone，退回原流
    }

    const detector = createPauseDetector({
      stream: streamForDetector,
      thresholdMs: settings.pauseThresholdMs,
      energyFloor: 0.02,
      smoothingMs: 400,
      cooldownMs: 2000,
      onPauseStart: (pauseStartEpochMs) => {
        currentPauseStartEpochRef.current = pauseStartEpochMs;
        const promptShown = Boolean(settings.pausePromptEnabled);
        currentPausePromptShownRef.current = promptShown;

        if (!promptShown) return;
        setToastText("保持角色继续表达");
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => setToastText(null), 2000);
      },
      onPauseEnd: async (pauseEndEpochMs) => {
        const pauseStartEpochMs = currentPauseStartEpochRef.current;
        if (!pauseStartEpochMs) return;
        const start_ms = Math.max(0, pauseStartEpochMs - recordingEpochStartMs);
        const duration_ms = Math.max(0, pauseEndEpochMs - pauseStartEpochMs);

        try {
          await addPauseEvent({
            sessionId: id,
            start_ms,
            duration_ms,
            threshold_ms: settings.pauseThresholdMs,
            prompt_shown: currentPausePromptShownRef.current,
            session_status: session?.status ?? "not_started",
          });
        } catch {
          // 忽略写入失败（不影响录制）
        } finally {
          currentPauseStartEpochRef.current = null;
        }
      },
    });

    return () => {
      detector.stop();
      if (streamForDetector !== liveStream) {
        for (const t of streamForDetector.getTracks()) {
          try {
            t.stop();
          } catch {
            // ignore
          }
        }
      }
    };
  }, [
    id,
    liveStream,
    recordingEpochStartMs,
    settings?.pauseThresholdMs,
    settings?.pausePromptEnabled,
    session?.status,
    settings,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadUploadedBackground() {
      if (!settings?.uploadedBackgroundId) {
        if (uploadedBgUrlRef.current) URL.revokeObjectURL(uploadedBgUrlRef.current);
        uploadedBgUrlRef.current = null;
        setUploadedBgUrl(null);
        return;
      }

      const row = await getUploadedBackground(settings.uploadedBackgroundId);
      if (cancelled) return;
      if (!row) return;

      const nextUrl = URL.createObjectURL(row.blob);
      if (uploadedBgUrlRef.current) URL.revokeObjectURL(uploadedBgUrlRef.current);
      uploadedBgUrlRef.current = nextUrl;
      setUploadedBgUrl(nextUrl);
    }

    void loadUploadedBackground();
    return () => {
      cancelled = true;
    };
  }, [settings?.uploadedBackgroundId]);

  async function persist(next: RehearsalSettings) {
    setError(null);
    setSettings(next);
    try {
      await saveRehearsalSettings(next);
    } catch {
      setError("操作失败。请刷新后重试；若仍失败，请检查浏览器存储权限或剩余空间。");
    }
  }

  async function onUploadImage(file: File) {
    if (!settings) return;
    setError(null);
    try {
      const id = await saveUploadedBackground({
        blob: file,
        filename: file.name,
        mimeType: file.type,
      });
      await persist({
        ...settings,
        backgroundSource: "upload_image",
        uploadedBackgroundId: id,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "上传失败。请重试。";
      setError(message);
    }
  }

  return (
    <main className="relative min-h-dvh text-white">
      {/* 全屏沉浸背景（fixed 避免与 flex 子项高度互相影响导致不铺满） */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {background.kind === "video" ? (
          <video
            className="h-full w-full object-cover"
            src={background.src}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            className="h-full w-full object-cover"
            src={background.src}
            alt=""
            decoding="async"
            fetchPriority="high"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-black/65" />
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col px-4 pb-6 pt-4 md:px-8 md:pb-8 md:pt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-semibold leading-[1.2] tracking-tight drop-shadow-sm">
              排练
            </h1>
            <div className="mt-1 max-w-md text-sm text-white/85 drop-shadow-sm">
              内容默认保存在本地，不会上传。背景铺满全屏，预览在底部中间。
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <Link
              href={`/session/${id}`}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white/40 bg-white/10 px-4 text-sm font-semibold text-white shadow-sm outline-none ring-offset-2 ring-offset-slate-900 backdrop-blur transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
            >
              返回会话
            </Link>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-white/90 px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none ring-offset-2 ring-offset-slate-900 transition hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              设置
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-1 flex-col justify-end">
          <div className="mx-auto w-full max-w-3xl space-y-4">
            {notFound ? (
              <div className="rounded-2xl border border-white/20 bg-white/95 px-6 py-8 text-slate-900 shadow-xl backdrop-blur">
                <div className="text-sm font-semibold">会话不存在</div>
                <div className="mt-2 text-sm text-slate-600">
                  可能已被清理，或链接有误。
                </div>
              </div>
            ) : session && settings ? (
              <>
                <div className="rounded-2xl border border-white/25 bg-black/40 px-5 py-4 shadow-lg backdrop-blur-md">
                  <div className="text-sm font-semibold">
                    {session.name ? `会话：${session.name}` : "会话已加载"}
                  </div>
                  <div className="mt-1 text-sm text-white/80">
                    先打开「设置」选好背景；需要画面时再开启摄像头或录屏。
                  </div>
                  {error ? <div className="mt-2 text-sm text-red-300">{error}</div> : null}
                </div>

                <RecorderPanel
                  settings={settings}
                  liveStream={liveStream}
                  onLiveStreamChange={setLiveStream}
                  onPlaybackChange={setPlayback}
                  onRecordingEpochStart={setRecordingEpochStartMs}
                />
              </>
            ) : (
              <div className="text-sm text-white/85 drop-shadow-sm">加载中…</div>
            )}
          </div>
        </div>
      </div>

      {settings ? (
        <SettingsDrawer
          open={drawerOpen}
          settings={settings}
          uploadedBackgroundAvailable={uploadedBackgroundAvailable}
          onClose={() => setDrawerOpen(false)}
          onChange={(next) => void persist(next)}
          onUploadImage={onUploadImage}
          error={error}
        />
      ) : null}

      <PreviewDraggable
        mode={playback ? "playback" : "live"}
        liveStream={liveStream}
        playbackUrl={playback?.kind === "video" ? playback.url : null}
      />

      <PauseToast text={toastText} />
    </main>
  );
}

