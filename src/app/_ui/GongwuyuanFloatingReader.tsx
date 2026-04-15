"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  GONGWUYUAN_CATEGORY_OPTIONS,
  type GongwuyuanCollection,
  type GongwuyuanDocItem,
} from "@/app/_lib/gongwuyuanTypes";
import { GongwuyuanDocTabs } from "@/app/gongwuyuan/_ui/GongwuyuanDocTabs";

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
          <button
            type="button"
            onClick={() => onStepChange("pick")}
            className="ui-btn ui-btn-sm shrink-0 px-3"
            aria-label="返回"
          >
            ←
          </button>
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
          <button
            type="button"
            onClick={() => setFullscreen((f) => !f)}
            className="ui-btn ui-btn-sm shrink-0 px-3"
          >
            {fullscreen ? "分屏" : "全屏"}
          </button>
        ) : null}
        <button type="button" onClick={close} className="ui-btn ui-btn-sm shrink-0 px-3">
          退出
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4">
        {step === "pick" ? (
          <div className="flex flex-col gap-3">
            {GONGWUYUAN_CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => void loadCollection(opt.id)}
                className="rounded-[var(--radius-card)] border-2 border-ink bg-page px-4 py-4 text-left transition-colors hover:bg-ink/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <div className="font-semibold text-ink">{opt.title}</div>
                <div className="mt-1 text-[13px] leading-snug text-ink-muted">{opt.hint}</div>
              </button>
            ))}
          </div>
        ) : loading ? (
          <p className="text-sm text-ink-muted">加载中…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <GongwuyuanDocTabs key={collection ?? "none"} items={items} density="compact" />
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
      style={fabPosition}
      className="ui-btn ui-btn-sm ui-btn-on fixed bottom-6 z-40 min-h-11 px-4 shadow-[4px_4px_0_0_var(--color-ink)] transition-[left,right] duration-300 ease-out"
    >
      {open ? "关闭" : "真题"}
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
          className={`sticky top-0 flex h-svh shrink-0 flex-col self-start overflow-hidden bg-surface shadow-[-8px_0_24px_rgba(0,0,0,0.07)] transition-[width,border-color] duration-300 ease-out ${
            quarterDocked
              ? `z-[55] border-l-2 border-ink ${panelWidthClass}`
              : "z-0 w-0 border-l-0 border-transparent pointer-events-none"
          }`}
        >
          {quarterDocked ? (
            <div className={`flex h-full min-h-0 flex-col ${panelWidthClass}`}>
              <GongwuyuanReaderPanel {...panelProps} />
            </div>
          ) : null}
        </aside>
      </div>

      {open && fullscreen ? (
        <div
          id="gongwuyuan-reader-panel"
          role="dialog"
          aria-modal
          aria-label="真题阅读"
          className="fixed inset-0 z-[110] flex flex-col border-ink bg-surface"
        >
          <GongwuyuanReaderPanel {...panelProps} />
        </div>
      ) : null}

      {fabPortalReady && typeof document !== "undefined"
        ? createPortal(gongwuyuanFab, document.body)
        : gongwuyuanFab}
    </>
  );
}
