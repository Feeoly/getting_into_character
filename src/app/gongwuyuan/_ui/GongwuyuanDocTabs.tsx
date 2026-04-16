"use client";

import { Fragment, useState } from "react";

import type { GongwuyuanDocItem } from "../../_lib/gongwuyuanTypes";
import { RoleCardMarkdown } from "../../session/[id]/_ui/RoleCardMarkdown";
import { GwyGradientRing } from "./GwyGradientRing";

type Props = {
  items: GongwuyuanDocItem[];
  /** 抽屉内：更紧凑的 Tab 与间距 */
  density?: "default" | "compact";
  /** 真题悬浮面板内：区块与 Tab 使用渐变描边（与 GwyGradientRing 一致） */
  gradientFrame?: boolean;
};

export function GongwuyuanDocTabs({ items, density = "default", gradientFrame = false }: Props) {
  const [active, setActive] = useState(0);
  const compact = density === "compact";

  if (items.length === 0) {
    if (gradientFrame) {
      return (
        <GwyGradientRing radius="card" className="w-full" innerClassName="bg-page">
          <p className={`text-ink-muted ${compact ? "p-4 text-[14px]" : "p-5 text-[15px]"}`}>
            该目录下暂无 Markdown 文档。
          </p>
        </GwyGradientRing>
      );
    }
    return (
      <p
        className={`rounded-[var(--radius-card)] text-ink-muted ${
          compact ? "bg-page p-4 text-[14px]" : "bg-surface p-5 text-[15px]"
        }`}
      >
        该目录下暂无 Markdown 文档。
      </p>
    );
  }

  const safeIndex = Math.min(active, items.length - 1);
  const doc = items[safeIndex]!;
  /** 侧栏：全宽纵排；独立页：横向且限制胶囊最大宽度 */
  const tabBtnWidth = compact ? "w-full max-w-full" : "max-w-[min(100%,22rem)] shrink";

  return (
    <div className={compact ? "min-w-0 space-y-3" : "mt-6 min-w-0 space-y-4"}>
      <div
        className={
          compact
            ? "-mx-0.5 flex min-w-0 flex-col gap-1.5"
            : "-mx-0.5 flex min-w-0 gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible"
        }
        role="tablist"
        aria-label="文档切换"
      >
        {items.map((item, i) => {
          const selected = i === safeIndex;
          const tabBtn = (
            <button
              type="button"
              role="tab"
              aria-selected={selected}
              id={`gwy-tab-${item.id}`}
              aria-controls={`gwy-panel-${item.id}`}
              title={item.label}
              onClick={() => setActive(i)}
              className={
                gradientFrame
                  ? selected
                    ? `ui-btn ui-btn-sm min-w-0 w-full !justify-start !border-0 gap-0 bg-[#fdf2f8] px-2.5 text-left font-semibold text-ink !shadow-none hover:!bg-[#fce7f3] ${compact ? "text-[12px]" : "px-3"}`
                    : `ui-btn ui-btn-sm min-w-0 w-full !justify-start !border-0 gap-0 bg-page px-2.5 text-left text-ink !shadow-none hover:!bg-[#fce7f3] ${compact ? "text-[12px]" : "px-3"}`
                  : selected
                    ? `ui-btn ui-btn-sm ui-btn-on min-w-0 !justify-start gap-0 px-2.5 text-left ${compact ? "text-[12px]" : "px-3"} ${tabBtnWidth}`
                    : `ui-btn ui-btn-sm min-w-0 !justify-start gap-0 px-2.5 text-left ${compact ? "text-[12px]" : "px-3"} ${tabBtnWidth}`
              }
            >
              <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
            </button>
          );
          return gradientFrame ? (
            <GwyGradientRing
              key={item.id}
              radius="pill"
              className={`min-w-0 ${tabBtnWidth}`}
              innerClassName="flex w-full min-w-0"
            >
              {tabBtn}
            </GwyGradientRing>
          ) : (
            <Fragment key={item.id}>{tabBtn}</Fragment>
          );
        })}
      </div>

      <section
        role="tabpanel"
        id={`gwy-panel-${doc.id}`}
        aria-labelledby={`gwy-tab-${doc.id}`}
        className="min-w-0"
      >
        {gradientFrame ? (
          <GwyGradientRing radius="card" className="w-full min-w-0" innerClassName="min-w-0 bg-page">
            <div className="min-w-0 p-3 sm:p-4">
              <RoleCardMarkdown markdown={doc.content} variant="read" />
            </div>
          </GwyGradientRing>
        ) : (
          <RoleCardMarkdown markdown={doc.content} variant="read" />
        )}
      </section>
    </div>
  );
}
