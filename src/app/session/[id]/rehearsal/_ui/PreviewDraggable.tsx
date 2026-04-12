"use client";

import { createPortal } from "react-dom";
import { useLayoutEffect, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  liveStream?: MediaStream | null;
  playbackUrl?: string | null;
  mode: "live" | "playback";
};

type Pos = { x: number; y: number };

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** 用于 fixed 定位：优先 visualViewport，避免 innerHeight 大于实际可见区时把 PiP 放到视口外 */
function viewportBox(): { w: number; h: number; ox: number; oy: number } {
  if (typeof window === "undefined") {
    return { w: 800, h: 600, ox: 0, oy: 0 };
  }
  const vv = window.visualViewport;
  if (vv) {
    return { w: vv.width, h: vv.height, ox: vv.offsetLeft, oy: vv.offsetTop };
  }
  return {
    w: window.innerWidth,
    h: window.innerHeight,
    ox: 0,
    oy: 0,
  };
}

function clampPipPos(x: number, y: number, pipW: number, pipH: number): Pos {
  const margin = 8;
  const { w, h, ox, oy } = viewportBox();
  const minX = ox + margin;
  const minY = oy + margin;
  const maxX = ox + w - pipW - margin;
  const maxY = oy + h - pipH - margin;
  return {
    x: clamp(x, minX, Math.max(minX, maxX)),
    y: clamp(y, minY, Math.max(minY, maxY)),
  };
}

export function PreviewDraggable({ liveStream, playbackUrl, mode }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const showPip = useMemo(() => {
    if (mode === "live") return Boolean(liveStream);
    return Boolean(playbackUrl);
  }, [liveStream, mode, playbackUrl]);

  const hasLiveVideoTrack = useMemo(
    () => Boolean(liveStream?.getVideoTracks?.().length),
    [liveStream],
  );

  // 首帧与折叠切换：默认「左下角」，与右下角会话/录制面板错开；始终钳在 viewport 内
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const pipW = collapsed ? 72 : 280;
    const pipH = collapsed ? 72 : 168;
    const { h, ox, oy } = viewportBox();
    const margin = 8;
    setPos((p) => {
      if (!p) {
        return clampPipPos(
          Math.round(ox + margin),
          Math.round(oy + h - pipH - 24),
          pipW,
          pipH,
        );
      }
      return clampPipPos(p.x, p.y, pipW, pipH);
    });
  }, [collapsed]);

  // 实时画面：与 MediaRecorder 共用同一 MediaStream（停顿检测已在 page 侧用 clone，此处不再 clone，避免部分环境双轨异常）
  useLayoutEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (mode === "live" && liveStream) {
      v.srcObject = liveStream;
      void v.play().catch(() => {});
      return () => {
        v.srcObject = null;
      };
    }

    if (mode === "playback" && playbackUrl) {
      v.srcObject = null;
      v.src = playbackUrl;
      void v.play().catch(() => {});
      return () => {
        v.removeAttribute("src");
      };
    }

    v.srcObject = null;
    v.removeAttribute("src");
  }, [liveStream, mode, playbackUrl]);

  useEffect(() => {
    if (!pos) return;
    const pipW = collapsed ? 72 : 280;
    const pipH = collapsed ? 72 : 168;
    function reclamp() {
      setPos((p) => (p ? clampPipPos(p.x, p.y, pipW, pipH) : p));
    }
    window.addEventListener("resize", reclamp);
    window.visualViewport?.addEventListener("resize", reclamp);
    window.visualViewport?.addEventListener("scroll", reclamp);
    return () => {
      window.removeEventListener("resize", reclamp);
      window.visualViewport?.removeEventListener("resize", reclamp);
      window.visualViewport?.removeEventListener("scroll", reclamp);
    };
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

    const pipW = collapsed ? 72 : 280;
    const pipH = collapsed ? 72 : 168;

    const onMove = (ev: PointerEvent) => {
      if (!rootRef.current) return;
      const nextX = startPos.x + (ev.clientX - startX);
      const nextY = startPos.y + (ev.clientY - startY);
      setPos(clampPipPos(nextX, nextY, pipW, pipH));
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

  const pip = (
    <div
      ref={rootRef}
      data-rehearsal-pip="root"
      aria-label="排练实时画面预览（可拖拽）"
      className={`fixed z-[48] select-none ring-2 ring-white/40 ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
      }}
      onPointerDown={handlePointerDown}
    >
      <div
        data-rehearsal-pip="surface"
        className={`relative h-full w-full overflow-hidden bg-black/70 shadow-xl backdrop-blur-md ${
          collapsed ? "rounded-full" : "rounded-xl"
        }`}
      >
        {showPip ? (
          <>
            <video
              ref={videoRef}
              data-rehearsal-pip="video"
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              playsInline
            />
            {mode === "live" && liveStream && !hasLiveVideoTrack ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 px-2 text-center text-[11px] font-medium text-white/90">
                未检测到视频轨（仅麦克风）
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-semibold text-white/80">
            {mode === "live"
              ? "开始录制后显示预览"
              : "无视频回放"}
          </div>
        )}

        {collapsed && showPip ? (
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

        {!collapsed && showPip ? (
          <button
            type="button"
            className="ui-btn ui-btn-sm ui-btn-surface absolute right-1.5 top-1.5 z-10 px-2.5 focus-visible:!shadow-[0_0_0_2px_rgb(255_255_255/0.35),0_0_0_4px_var(--color-ink)]"
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

  if (typeof document === "undefined" || !document.body) return pip;

  return createPortal(pip, document.body);
}
