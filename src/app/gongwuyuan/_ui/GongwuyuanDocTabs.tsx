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

  return (
    <div className={compact ? "space-y-3" : "mt-6 space-y-4"}>
      <div
        className="-mx-0.5 flex gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible"
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
              onClick={() => setActive(i)}
              className={
                selected
                  ? `ui-btn ui-btn-sm ui-btn-on shrink-0 px-2.5 ${compact ? "text-[12px]" : "px-3"}`
                  : `ui-btn ui-btn-sm shrink-0 px-2.5 ${compact ? "text-[12px]" : "px-3"}`
              }
            >
              {item.label}
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
