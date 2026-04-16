"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  GONGWUYUAN_CATEGORY_OPTIONS,
  type GongwuyuanCollection,
  type GongwuyuanDocItem,
} from "@/app/_lib/gongwuyuanTypes";
import { GongwuyuanDocTabs } from "@/app/gongwuyuan/_ui/GongwuyuanDocTabs";
import { GwyGradientRing } from "@/app/gongwuyuan/_ui/GwyGradientRing";

/** 真题/关闭 FAB：主底、折角块、hover 滑入层；字色与动效保持原样 */
const GONGWUYUAN_FAB_BG =
  "linear-gradient(225deg, #92ff98 0%, #a5ebad 16.667%, #caccda 33.333%, #f1b4dc 50%, #ffb0b0 66.667%, #ffc097 83.333%, #fbdeb7 100%)";

type Step = "pick" | "read";

type PanelProps = {
  step: Step;
  onStepChange: (s: Step) => void;
  collection: GongwuyuanCollection | null;
  fullscreen: boolean;
  setFullscreen: (updater: (f: boolean) => boolean) => void;
  close: () => void;
  loadCollection: (c: GongwuyuanCollection) => void;
  loading: boolean;
  error: string | null;
  items: GongwuyuanDocItem[];
};

function GongwuyuanReaderPanel({
  step,
  onStepChange,
  collection,
  fullscreen,
  setFullscreen,
  close,
  loadCollection,
  loading,
  error,
  items,
}: PanelProps) {
  return (
    <>
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-soft-border px-3 py-3 sm:px-4">
        {step === "read" ? (
          <GwyGradientRing radius="pill" className="shrink-0" innerClassName="inline-flex">
            <button
              type="button"
              onClick={() => onStepChange("pick")}
              className="ui-btn ui-btn-sm shrink-0 !border-0 bg-surface px-3 !shadow-none hover:!bg-[#fce7f3]"
              aria-label="返回"
            >
              ←
            </button>
          </GwyGradientRing>
        ) : (
          <span className="invisible shrink-0 select-none px-3 text-sm" aria-hidden>
            ←
          </span>
        )}
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-ink sm:text-[15px]">
          {step === "pick"
            ? "选择真题类型"
            : (GONGWUYUAN_CATEGORY_OPTIONS.find((o) => o.id === collection)?.title ?? "阅读")}
        </h2>
        {step === "read" ? (
          <GwyGradientRing radius="pill" className="shrink-0" innerClassName="inline-flex">
            <button
              type="button"
              onClick={() => setFullscreen((f) => !f)}
              className="ui-btn ui-btn-sm shrink-0 !border-0 bg-surface px-3 !shadow-none hover:!bg-[#fce7f3]"
            >
              {fullscreen ? "分屏" : "全屏"}
            </button>
          </GwyGradientRing>
        ) : null}
        <GwyGradientRing radius="pill" className="shrink-0" innerClassName="inline-flex">
          <button
            type="button"
            onClick={close}
            className="ui-btn ui-btn-sm shrink-0 !border-0 bg-surface px-3 !shadow-none hover:!bg-[#fce7f3]"
          >
            退出
          </button>
        </GwyGradientRing>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4">
        {step === "pick" ? (
          <div className="flex flex-col gap-3">
            {GONGWUYUAN_CATEGORY_OPTIONS.map((opt) => (
              <GwyGradientRing
                key={opt.id}
                radius="card"
                className="w-full"
                innerClassName="flex w-full flex-col"
              >
                <button
                  type="button"
                  onClick={() => void loadCollection(opt.id)}
                  className="w-full rounded-[calc(var(--radius-card)-2px)] border-0 bg-page px-4 py-4 text-left text-ink transition-colors hover:!bg-[#fce7f3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <div className="font-semibold text-ink">{opt.title}</div>
                  <div className="mt-1 text-[13px] leading-snug text-ink-muted">{opt.hint}</div>
                </button>
              </GwyGradientRing>
            ))}
          </div>
        ) : loading ? (
          <GwyGradientRing radius="card" className="w-full" innerClassName="bg-page">
            <p className="p-4 text-sm text-ink-muted">加载中…</p>
          </GwyGradientRing>
        ) : error ? (
          <GwyGradientRing radius="card" className="w-full" innerClassName="bg-page">
            <p className="p-4 text-sm text-red-600">{error}</p>
          </GwyGradientRing>
        ) : (
          <GongwuyuanDocTabs
            key={collection ?? "none"}
            items={items}
            density="compact"
            gradientFrame
          />
        )}
      </div>
    </>
  );
}

/** 根布局包裹：分屏(1/4)时右侧占文档流挤压主区；全屏时为浮动层 */
export function GongwuyuanReaderLayout({ children }: { children: ReactNode }) {
  const [fabPortalReady, setFabPortalReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("pick");
  const [fullscreen, setFullscreen] = useState(false);
  const [collection, setCollection] = useState<GongwuyuanCollection | null>(null);
  const [items, setItems] = useState<GongwuyuanDocItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setStep("pick");
    setCollection(null);
    setItems([]);
    setError(null);
    setFullscreen(false);
  }, []);

  useEffect(() => {
    setFabPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const loadCollection = async (c: GongwuyuanCollection) => {
    setCollection(c);
    setStep("read");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gongwuyuan-docs?collection=${c}`);
      const data: { items?: GongwuyuanDocItem[]; error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error ?? "加载失败");
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const onStepChange = useCallback((s: Step) => {
    if (s === "pick") {
      setCollection(null);
      setItems([]);
      setError(null);
    }
    setStep(s);
  }, []);

  const quarterDocked = open && !fullscreen;
  const panelWidthClass = "w-[max(25vw,18rem)]";

  const fabPosition =
    fullscreen
      ? { left: "1.5rem", right: "auto" as const }
      : open && !fullscreen
        ? { right: "max(calc(25vw + 1.25rem), calc(18rem + 1.25rem))", left: "auto" as const }
        : { right: "1.5rem", left: "auto" as const };

  const panelProps: PanelProps = {
    step,
    onStepChange,
    collection,
    fullscreen,
    setFullscreen,
    close,
    loadCollection,
    loading,
    error,
    items,
  };

  const gongwuyuanFab = (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls="gongwuyuan-reader-panel"
      onClick={() => {
        if (open) close();
        else {
          setStep("pick");
          setFullscreen(false);
          setOpen(true);
        }
      }}
      style={{ ...fabPosition, background: GONGWUYUAN_FAB_BG }}
      className="group fixed bottom-6 z-40 flex touch-manipulation items-center overflow-hidden rounded-md px-6 py-3 font-medium shadow-md transition-[left,right] duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
    >
      <span
        className="absolute top-0 right-0 inline-block size-4 rounded transition-all duration-500 ease-in-out group-hover:-mt-4 group-hover:-mr-4"
        style={{ background: GONGWUYUAN_FAB_BG }}
        aria-hidden
      >
        <span className="absolute top-0 right-0 size-5 translate-x-1/2 -translate-y-1/2 rotate-45 bg-white" />
      </span>
      <span
        className="absolute bottom-0 left-0 inline-block size-4 rotate-180 rounded transition-all duration-500 ease-in-out group-hover:-mb-4 group-hover:-ml-4"
        style={{ background: GONGWUYUAN_FAB_BG }}
        aria-hidden
      >
        <span className="absolute top-0 right-0 size-5 translate-x-1/2 -translate-y-1/2 rotate-45 bg-white" />
      </span>
      <span
        className="absolute bottom-0 left-0 h-full w-full -translate-x-full rounded-md transition-all delay-200 duration-500 ease-in-out group-hover:translate-x-0"
        style={{ background: GONGWUYUAN_FAB_BG }}
        aria-hidden
      />
      <span className="relative w-full text-left text-white transition-colors duration-200 ease-in-out group-hover:text-white">
        {open ? "关闭" : "真题"}
      </span>
    </button>
  );

  return (
    <>
      <div className="flex min-h-svh w-full">
        <div className="min-h-svh min-w-0 flex-1">{children}</div>
        <aside
          id={quarterDocked ? "gongwuyuan-reader-panel" : undefined}
          aria-label="真题阅读"
          aria-hidden={!quarterDocked}
          className={`sticky top-0 flex h-svh shrink-0 flex-col self-start overflow-hidden bg-surface shadow-[-8px_0_24px_rgba(0,0,0,0.07)] transition-[width] duration-300 ease-out ${
            quarterDocked
              ? `relative z-[55] ${panelWidthClass}`
              : "pointer-events-none z-0 w-0"
          }`}
        >
          {quarterDocked ? (
            <>
              <div
                className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-[3px] bg-[linear-gradient(to_top,#fad0c4_0%,#ffd1ff_100%)]"
                aria-hidden
              />
              <div className="flex min-h-0 flex-1 flex-col pl-[3px]">
                <GongwuyuanReaderPanel {...panelProps} />
              </div>
            </>
          ) : null}
        </aside>
      </div>

      {open && fullscreen ? (
        <div
          id="gongwuyuan-reader-panel"
          role="dialog"
          aria-modal
          aria-label="真题阅读"
          className="fixed inset-0 z-[110] box-border bg-[linear-gradient(to_top,#fad0c4_0%,#ffd1ff_100%)] p-[2px]"
        >
          <div className="flex h-full min-h-0 flex-col bg-surface">
            <GongwuyuanReaderPanel {...panelProps} />
          </div>
        </div>
      ) : null}

      {fabPortalReady && typeof document !== "undefined"
        ? createPortal(gongwuyuanFab, document.body)
        : gongwuyuanFab}
    </>
  );
}
