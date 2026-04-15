"use client";

import { useState } from "react";

import type { GongwuyuanDocItem } from "../../_lib/gongwuyuanTypes";
import { RoleCardMarkdown } from "../../session/[id]/_ui/RoleCardMarkdown";

type Props = {
  items: GongwuyuanDocItem[];
  /** 抽屉内：更紧凑的 Tab 与间距 */
  density?: "default" | "compact";
};

export function GongwuyuanDocTabs({ items, density = "default" }: Props) {
  const [active, setActive] = useState(0);
  const compact = density === "compact";

  if (items.length === 0) {
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
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`gwy-tab-${item.id}`}
              aria-controls={`gwy-panel-${item.id}`}
              title={item.label}
              onClick={() => setActive(i)}
              className={
                selected
                  ? `ui-btn ui-btn-sm ui-btn-on min-w-0 !justify-start gap-0 px-2.5 text-left ${compact ? "text-[12px]" : "px-3"} ${tabBtnWidth}`
                  : `ui-btn ui-btn-sm min-w-0 !justify-start gap-0 px-2.5 text-left ${compact ? "text-[12px]" : "px-3"} ${tabBtnWidth}`
              }
            >
              <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
            </button>
          );
        })}
      </div>

      <section
        role="tabpanel"
        id={`gwy-panel-${doc.id}`}
        aria-labelledby={`gwy-tab-${doc.id}`}
        className="min-w-0"
      >
        <RoleCardMarkdown markdown={doc.content} variant="read" />
      </section>
    </div>
  );
}
