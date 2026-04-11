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

export function PreviewDraggable({ liveStream, playbackUrl, mode }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);
  /** 仅用户手动收起；不在窄屏默认收起（否则 Cursor 内置预览宽度易 <640px，且收起时未挂载 video 会导致 srcObject 从未绑定） */
  const [collapsed, setCollapsed] = useState(false);

  const hasVideoTrack = useMemo(() => {
    if (mode === "playback") return Boolean(playbackUrl);
    return Boolean(liveStream?.getVideoTracks?.().length);
  }, [liveStream, playbackUrl, mode]);

  // 始终在有 ref 时绑定 live 流并尝试播放（收起态也挂载 video，避免漏绑）
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (mode === "live" && liveStream) {
      v.srcObject = liveStream;
      void v.play().catch(() => {
        /* 部分环境需用户手势后才可 play，开始录制已算手势 */
      });
      return;
    }

    if (mode === "playback" && playbackUrl) {
      v.srcObject = null;
      v.src = playbackUrl;
      void v.play().catch(() => {});
      return;
    }

    v.srcObject = null;
    v.removeAttribute("src");
  }, [liveStream, mode, playbackUrl, collapsed]);

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
    const defaultW = collapsed ? 72 : 280;
    const defaultH = collapsed ? 72 : 168;
    setPos({
      x: Math.round((w - defaultW) / 2),
      y: Math.round(h - defaultH - 24),
    });
  }, [pos, collapsed]);

  function handlePointerDown(e: React.PointerEvent) {
    if (!pos) return;
    if (!rootRef.current) return;
    const target = e.target as HTMLElement;
    if (target.closest("button") && target.closest("button") !== e.currentTarget) {
      return;
    }
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

  const size = collapsed ? { w: 72, h: 72 } : { w: 280, h: 168 };

  return (
    <div
      ref={rootRef}
      className={`fixed z-[45] select-none ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        width: size.w,
        height: size.h,
      }}
      onPointerDown={handlePointerDown}
    >
      <div
        className={`relative h-full w-full overflow-hidden border border-white/30 bg-black/60 shadow-xl backdrop-blur-md ${
          collapsed ? "rounded-full" : "rounded-xl"
        }`}
      >
        {hasVideoTrack ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            playsInline
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-semibold text-white/80">
            {mode === "live"
              ? "暂无画面（设置里开启摄像头或录屏）"
              : "无视频回放"}
          </div>
        )}

        {collapsed && hasVideoTrack ? (
          <button
            type="button"
            className="absolute inset-0 z-10 flex items-end justify-center rounded-full bg-gradient-to-t from-black/70 via-black/20 to-transparent pb-1.5 text-[10px] font-semibold text-white/95"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(false);
            }}
          >
            展开
          </button>
        ) : null}

        {!collapsed && hasVideoTrack ? (
          <button
            type="button"
            className="absolute right-1.5 top-1.5 z-10 inline-flex h-8 items-center justify-center rounded-lg bg-white/90 px-2.5 text-xs font-semibold text-slate-900 outline-none ring-offset-2 transition hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-600"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(true);
            }}
          >
            收起
          </button>
        ) : null}
      </div>
    </div>
  );
}
