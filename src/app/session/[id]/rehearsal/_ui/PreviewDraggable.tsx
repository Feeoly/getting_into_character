"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  liveStream?: MediaStream | null;
  playbackUrl?: string | null;
  mode: "live" | "playback";
};

type Pos = { x: number; y: number };

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function isMobile() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 640px)").matches;
}

export function PreviewDraggable({ liveStream, playbackUrl, mode }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const hasVideoTrack = useMemo(() => {
    if (mode === "playback") return Boolean(playbackUrl);
    return Boolean(liveStream?.getVideoTracks?.().length);
  }, [liveStream, playbackUrl, mode]);

  useEffect(() => {
    setCollapsed(isMobile());
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    if (mode !== "live") return;
    if (!liveStream) return;
    videoRef.current.srcObject = liveStream;
  }, [liveStream, mode]);

  useEffect(() => {
    if (!pos) return;
    const onResize = () => setPos((p) => (p ? { ...p } : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pos]);

  useEffect(() => {
    if (pos) return;
    if (typeof window === "undefined") return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const defaultW = collapsed ? 56 : 240;
    const defaultH = collapsed ? 56 : 160;
    setPos({
      x: Math.round((w - defaultW) / 2),
      y: Math.round(h - defaultH - 24),
    });
  }, [pos, collapsed]);

  function handlePointerDown(e: React.PointerEvent) {
    if (!pos) return;
    if (!rootRef.current) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = pos;

    const onMove = (ev: PointerEvent) => {
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      const nextX = startPos.x + (ev.clientX - startX);
      const nextY = startPos.y + (ev.clientY - startY);
      const maxX = window.innerWidth - rect.width - 8;
      const maxY = window.innerHeight - rect.height - 8;
      setPos({
        x: clamp(nextX, 8, Math.max(8, maxX)),
        y: clamp(nextY, 8, Math.max(8, maxY)),
      });
    };

    const onUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  if (!pos) return null;

  const size = collapsed ? { w: 56, h: 56 } : { w: 240, h: 160 };

  return (
    <div
      ref={rootRef}
      className={`fixed z-40 select-none ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        width: size.w,
        height: size.h,
      }}
      onPointerDown={handlePointerDown}
    >
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-white/30 bg-black/50 shadow-lg backdrop-blur">
        {collapsed ? (
          <button
            type="button"
            className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(false);
            }}
          >
            预览
          </button>
        ) : (
          <>
            {hasVideoTrack ? (
              mode === "playback" ? (
                <video
                  className="h-full w-full object-cover"
                  src={playbackUrl ?? undefined}
                  muted
                  playsInline
                />
              ) : (
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-semibold text-white/80">
                {mode === "live"
                  ? "暂无画面（设置里开启摄像头或录屏）"
                  : "无视频回放"}
              </div>
            )}

            <button
              type="button"
              className="absolute right-2 top-2 inline-flex h-9 items-center justify-center rounded-lg bg-white/90 px-3 text-xs font-semibold text-slate-900 outline-none ring-offset-2 transition hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                setCollapsed(true);
              }}
            >
              收起
            </button>
          </>
        )}
      </div>
    </div>
  );
}

