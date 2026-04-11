"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { BackToHomeLink } from "../../../../_ui/BackToHomeLink";
import { getSessionById, markRoleReadAloudComplete } from "../../../../_lib/sessionRepo";
import type { Session } from "../../../../_lib/sessionTypes";
import { role } from "../../_lib/roleCopy";

export default function RoleReadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const ttsSupported =
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof SpeechSynthesisUtterance !== "undefined";

  function onListen() {
    if (!session?.roleCardText || !ttsSupported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(session.roleCardText);
    u.lang = "zh-CN";
    utterRef.current = u;
    window.speechSynthesis.speak(u);
  }

  async function onComplete() {
    setBusy(true);
    try {
      const res = await markRoleReadAloudComplete(id);
      if (!res.ok) {
        window.alert(res.error.message);
        return;
      }
      router.push(`/session/${id}/rehearsal`);
    } finally {
      setBusy(false);
    }
  }

  if (notFound) {
    return (
      <main className="min-h-dvh bg-[#F8FAFC] px-6 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white px-6 py-8">
          <div className="text-sm font-semibold text-slate-900">会话不存在</div>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-blue-600">
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-dvh bg-[#F8FAFC] px-6 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-2xl text-sm text-slate-600">加载中…</div>
      </main>
    );
  }

  if (!session.roleCardText) {
    return (
      <main className="min-h-dvh bg-[#F8FAFC] px-6 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white px-6 py-8">
          <p className="text-sm text-slate-700">还没有角色卡。请返回会话详情生成并保存。</p>
          <Link
            href={`/session/${id}#role-card-section`}
            className="mt-4 inline-flex text-sm font-semibold text-blue-600"
          >
            {role.backToSession}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#F8FAFC] px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-semibold leading-[1.2] text-slate-900">
              {role.readPageTitle}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{role.readPageHint}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <BackToHomeLink />
            <Link
              href={`/session/${id}`}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              {role.backToSession}
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-slate-800">
            {session.roleCardText}
          </pre>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {ttsSupported ? (
            <button
              type="button"
              onClick={onListen}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              {role.listenOnce}
            </button>
          ) : (
            <p className="text-xs text-slate-500">{role.listenUnsupported}</p>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => void onComplete()}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {role.completeRead}
          </button>
        </div>
      </div>
    </main>
  );
}
