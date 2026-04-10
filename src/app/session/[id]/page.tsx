"use client";

import { use, useEffect, useState } from "react";

import { getSessionById } from "../../_lib/sessionRepo";
import type { Session } from "../../_lib/sessionTypes";
import { PrimaryButton } from "../../_ui/PrimaryButton";
import { SessionActions } from "../../_ui/SessionActions";
import { SessionMeta } from "../../_ui/SessionMeta";

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const s = await getSessionById(id);
      if (cancelled) return;
      if (!s) {
        setNotFound(true);
        return;
      }
      setSession(s);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <main className="px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-[20px] font-semibold leading-[1.2] text-slate-900">
          会话详情（Phase 1 壳）
        </h1>

        <div className="mt-6 space-y-4">
          {notFound ? (
            <div className="rounded-lg border border-slate-200 bg-white px-6 py-8">
              <div className="text-sm font-semibold text-slate-900">会话不存在</div>
              <div className="mt-2 text-sm text-slate-600">
                可能已被清理，或链接有误。
              </div>
            </div>
          ) : session ? (
            <>
              <SessionMeta session={session} />
              <SessionActions session={session} onUpdated={setSession} />
            </>
          ) : (
            <div className="text-sm text-slate-600">加载中…</div>
          )}
        </div>

        <div className="mt-6">
          <PrimaryButton href="/">返回首页</PrimaryButton>
        </div>
      </div>
    </main>
  );
}

