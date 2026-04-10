"use client";

import Image from "next/image";
import { use, useEffect, useMemo, useRef, useState } from "react";

import { getSessionById } from "../../../_lib/sessionRepo";
import type { Session } from "../../../_lib/sessionTypes";
import { PrimaryButton } from "../../../_ui/PrimaryButton";
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
    };
  }, []);

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
    <main className="relative min-h-dvh">
      <div className="absolute inset-0">
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
          <>
            {background.src.startsWith("blob:") ? (
              <img className="h-full w-full object-cover" src={background.src} alt="" />
            ) : (
              <Image
                className="object-cover"
                src={background.src}
                alt=""
                fill
                sizes="100vw"
                priority
              />
            )}
          </>
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative px-6 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[20px] font-semibold leading-[1.2] text-white">
                排练
              </h1>
              <div className="mt-2 text-sm text-white/80">
                内容默认保存在本地，不会上传。
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-white/90 px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none ring-offset-2 transition hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              设置
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {notFound ? (
              <div className="rounded-lg border border-slate-200 bg-white px-6 py-8">
                <div className="text-sm font-semibold text-slate-900">会话不存在</div>
                <div className="mt-2 text-sm text-slate-600">
                  可能已被清理，或链接有误。
                </div>
              </div>
            ) : session && settings ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-white/30 bg-white/90 px-6 py-5 backdrop-blur">
                  <div className="text-sm font-semibold text-slate-900">
                    {session.name ? `会话：${session.name}` : "会话已加载"}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    你可以先调好背景与设置，再开始录制。
                  </div>

                  {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
                </div>

                <RecorderPanel
                  settings={settings}
                  onLiveStreamChange={setLiveStream}
                  onPlaybackChange={setPlayback}
                />
              </div>
            ) : (
              <div className="text-sm text-white/80">加载中…</div>
            )}
          </div>

          <div className="mt-6">
            <PrimaryButton href={`/session/${id}`}>返回会话</PrimaryButton>
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
    </main>
  );
}

