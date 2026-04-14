import type { Metadata } from "next";

import { loadGongwuyuanDocs } from "../../_lib/gongwuyuanDocs";
import { BackToHomeLink } from "../../_ui/BackToHomeLink";
import { GongwuyuanDocTabs } from "../_ui/GongwuyuanDocTabs";

export const metadata: Metadata = {
  title: "预测题（直白版）· 入戏",
  description: "河北省公务员面试预测 — 直白口语化整理（本地文档）",
};

export default function PredictExamsSimplePage() {
  const items = loadGongwuyuanDocs("predict_exams_simple");

  return (
    <main className="px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <BackToHomeLink />
        </div>
        <h1 className="mt-3 text-[22px] font-semibold leading-[1.2] text-ink md:text-[28px]">
          面试预测题（直白版）
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-ink-muted">
          口语化改写稿，路径 <code className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-[0.9em]">gongwuyuan/predict_exams_simple</code>。
        </p>
        <GongwuyuanDocTabs items={items} />
      </div>
    </main>
  );
}
