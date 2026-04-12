"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { BackToHomeLink } from "../../../../_ui/BackToHomeLink";
import { getSessionById, markRoleReadAloudComplete } from "../../../../_lib/sessionRepo";
import { getEffectiveRoleCardText, type Session } from "../../../../_lib/sessionTypes";
import { plainTextForRoleCardTts } from "../../../../_lib/plainTextForRoleCardTts";
import { role } from "../../_lib/roleCopy";
import { RoleCardMarkdown } from "../../_ui/RoleCardMarkdown";

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
    if (!session) return;
    const card = getEffectiveRoleCardText(session);
    if (!card || !ttsSupported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(plainTextForRoleCardTts(card));
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
      <main className="min-h-dvh bg-page px-6 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-2xl rounded-lg border border-border/80 bg-surface px-6 py-8">
          <div className="text-sm font-semibold text-ink">会话不存在</div>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-link">
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-dvh bg-page px-6 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-2xl text-sm text-ink-muted">加载中…</div>
      </main>
    );
  }

  if (!getEffectiveRoleCardText(session)) {
    return (
      <main className="min-h-dvh bg-page px-6 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-2xl rounded-lg border border-border/80 bg-surface px-6 py-8">
          <p className="text-sm text-ink-muted">还没有角色卡。请返回会话详情生成并保存。</p>
          <Link
            href={`/session/${id}#role-card-section`}
            className="mt-4 inline-flex text-sm font-semibold text-link"
          >
            {role.backToSession}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-page px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-semibold leading-[1.2] text-ink">
              {role.readPageTitle}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">{role.readPageHint}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <BackToHomeLink />
            <Link
              href={`/session/${id}`}
              className="text-sm font-semibold text-link hover:underline"
            >
              {role.backToSession}
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border/80 bg-surface p-5 shadow-soft-sm md:p-6">
          <RoleCardMarkdown
            markdown={getEffectiveRoleCardText(session) ?? ""}
            variant="read"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {ttsSupported ? (
            <button
              type="button"
              onClick={onListen}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-6 text-sm font-semibold text-ink shadow-sm hover:bg-accent-muted/40"
            >
              {role.listenOnce}
            </button>
          ) : (
            <p className="text-xs text-ink-subtle">{role.listenUnsupported}</p>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => void onComplete()}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover disabled:opacity-60"
          >
            {role.completeRead}
          </button>
        </div>
      </div>
    </main>
  );
}
