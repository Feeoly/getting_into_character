"use client";

import { useEffect, useState } from "react";

import { listSessions } from "./_lib/sessionRepo";
import type { Session } from "./_lib/sessionTypes";
import { EmptyState } from "./_ui/EmptyState";
import { PrimaryButton } from "./_ui/PrimaryButton";
import { SessionRow } from "./_ui/SessionRow";
import type { TranscriptionJobRow } from "./session/[id]/rehearsal/_lib/transcription/transcriptionTypes";
import {
  failStaleProcessingJobs,
  getLatestJobForSession,
} from "./session/[id]/rehearsal/_lib/transcription/transcriptRepo";

type HomeSessionRow = {
  session: Session;
  latestJob: TranscriptionJobRow | null;
};

export default function Home() {
  const [rows, setRows] = useState<HomeSessionRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const list = await listSessions();
        await failStaleProcessingJobs();
        const enriched: HomeSessionRow[] = await Promise.all(
          list.map(async (session) => {
            const job = await getLatestJobForSession(session.id);
            return { session, latestJob: job };
          }),
        );
        if (!cancelled) setRows(enriched);
      } catch {
        if (!cancelled) setRows([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0">
            <h1 className="text-[28px] font-semibold leading-[1.2] text-ink">入戏</h1>
            <p className="mt-4 max-w-2xl text-[16px] leading-[1.5] text-ink-muted">
              别去“面试”，去“演戏”
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-stretch sm:items-end">
            <PrimaryButton href="/session/new">开始</PrimaryButton>
            <div className="mt-3 max-w-[280px] text-sm text-ink-muted sm:text-right">
              内容默认保存在本地，不会上传云端
            </div>
          </div>
        </header>

        <div className="mt-8 flex flex-col gap-10 lg:mt-10 lg:flex-row lg:items-start lg:gap-12">
          <div className="min-w-0 flex-1 text-[15px] leading-[1.65] text-ink-muted">
            <section className="space-y-3 rounded-[var(--radius-card)] bg-surface p-5 mb-5">
              <h2 className="text-base font-semibold text-ink">背景</h2>
              <p>
                《The Rehearsal》第二季曾进行一项实验：让副飞行员化身“直言者”，正驾驶成为“倾听者”，以此打破沟通壁垒，规避空难风险
              </p>
              <p>
                入戏从中获得启发，通过心理学机制为你构建一个安全的“角色距离”
              </p>
            </section>
            <section className="space-y-3 rounded-[var(--radius-card)] bg-surface p-5">
              <h2 className="text-base font-semibold text-ink">前言</h2>
              <p>
                <span className="font-semibold text-ink">
                  当人们以“角色”身份行动时，便能暂时卸下社会身份的压力与焦虑，从而更勇敢地表达真实想法
                </span>
              </p>
              <p className="font-medium text-ink">我们不只是模拟面试，更是你带入角色后的心理脱敏实战</p>
              <ul className="list-inside list-disc space-y-2 pl-0.5 marker:text-ink-subtle">
                <li>
                  <span className="font-medium text-ink">领取剧本：</span>
                  输入你的面试场景与触发道具，生成专属角色卡
                </li>
                <li>
                  <span className="font-medium text-ink">进入片场：</span>
                  在动态真实的面试背景中，大声朗读角色宣言，快速带入角色
                </li>
                <li>
                  <span className="font-medium text-ink">打板开拍：</span>
                  请记住——表现好坏与真实的你无关，你只是在扮演另一个角色
                </li>
                <li>
                  <span className="font-medium text-ink">复盘总结：</span>
                  AI 提供角色贴合度、表达技巧相关的反馈
                </li>
              </ul>
            </section>
          </div>

          <div className="min-w-0 w-full shrink-0 lg:max-w-md xl:max-w-lg">
            <section>
              <div className="text-[20px] font-semibold leading-[1.2] text-ink">
                历史会话
              </div>
              <div className="mt-4">
                {rows === null ? (
                  <div className="text-sm text-ink-muted">加载中…</div>
                ) : rows.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    {rows.map(({ session, latestJob }) => (
                      <div key={session.id} className="contents min-w-0">
                        <SessionRow session={session} latestJob={latestJob} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

