import type { Metadata } from "next";

import { loadGongwuyuanDocs } from "../../_lib/gongwuyuanDocs";
import { BackToHomeLink } from "../../_ui/BackToHomeLink";
import { GongwuyuanDocTabs } from "../_ui/GongwuyuanDocTabs";

export const metadata: Metadata = {
  title: "历史真题 · 入戏",
  description: "河北省公务员面试历史题目与解析（本地文档）",
};

export default function HistoryExamsPage() {
  const items = loadGongwuyuanDocs("history_exams");

  return (
    <main className="px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <BackToHomeLink />
        </div>
        <h1 className="mt-3 text-[22px] font-semibold leading-[1.2] text-ink md:text-[28px]">
          历史面试题
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-ink-muted">
          真题与解析来自仓库内 <code className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-[0.9em]">gongwuyuan/history_exams</code>，可按标签切换文档。
        </p>
        <GongwuyuanDocTabs items={items} />
      </div>
    </main>
  );
}
