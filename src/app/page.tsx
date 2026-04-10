"use client";

import { useEffect, useState } from "react";

import { listSessions } from "./_lib/sessionRepo";
import type { Session } from "./_lib/sessionTypes";
import { EmptyState } from "./_ui/EmptyState";
import { PrimaryButton } from "./_ui/PrimaryButton";
import { SessionRow } from "./_ui/SessionRow";

export default function Home() {
  const [sessions, setSessions] = useState<Session[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const next = await listSessions();
        if (!cancelled) setSessions(next);
      } catch {
        if (!cancelled) setSessions([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-[28px] font-semibold leading-[1.2] text-slate-900">
          Getting Into Character
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-[1.5] text-slate-700">
          你在扮演角色，不是评价你本人。先把表达交给“角色”，再把紧张留在门外。
        </p>

        <div className="mt-6">
          <PrimaryButton href="/session/new">开始排练</PrimaryButton>
          <div className="mt-3 max-w-xl text-sm text-slate-600">
            内容默认保存在本地，不会上传。
          </div>
        </div>

        <section className="mt-10">
          <div className="text-[20px] font-semibold leading-[1.2] text-slate-900">
            历史会话
          </div>
          <div className="mt-4">
            {sessions === null ? (
              <div className="text-sm text-slate-600">加载中…</div>
            ) : sessions.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <SessionRow key={s.id} session={s} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

