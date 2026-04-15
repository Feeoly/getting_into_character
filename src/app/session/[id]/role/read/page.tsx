"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AlertDialog } from "../../../../_ui/AlertDialog";
import { BackToHomeLink } from "../../../../_ui/BackToHomeLink";
import {
  ContextActionsWithDivider,
  PageHeaderGlobalRow,
} from "../../../../_ui/PageHeaderActions";
import { getSessionById, markRoleReadAloudComplete } from "../../../../_lib/sessionRepo";
import { getEffectiveRoleCardText, type Session } from "../../../../_lib/sessionTypes";
import { plainTextForRoleCardTts } from "../../../../_lib/plainTextForRoleCardTts";
import { role } from "../../_lib/roleCopy";
import { review } from "../../rehearsal/_lib/transcription/sttCopy";
import { RoleCardMarkdown } from "../../_ui/RoleCardMarkdown";

export default function RoleReadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alertPayload, setAlertPayload] = useState<{
    title: string;
    description: string;
  } | null>(null);
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
        setAlertPayload({
          title: review.dialogErrorTitle,
          description: res.error.message,
        });
        return;
      }
      router.push(`/session/${id}/rehearsal`);
    } finally {
      setBusy(false);
    }
  }

  if (notFound) {
    return (
      <main className="min-h-dvh px-6 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-2xl rounded-[var(--radius-card)] bg-surface px-6 py-8">
          <div className="text-sm font-semibold text-ink">会话不存在</div>
          <Link href="/" className="ui-btn ui-btn-sm mt-4 inline-flex">
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-dvh px-6 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-2xl text-sm text-ink-muted">加载中…</div>
      </main>
    );
  }

  if (!getEffectiveRoleCardText(session)) {
    return (
      <main className="min-h-dvh px-6 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-2xl rounded-[var(--radius-card)] bg-surface px-6 py-8">
          <p className="text-sm text-ink-muted">还没有角色卡。请返回会话详情生成并保存。</p>
          <Link href={`/session/${id}#role-card-section`} className="ui-btn ui-btn-sm mt-4 inline-flex">
            {role.backToSession}
          </Link>
        </div>
      </main>
    );
  }

   return (
    <main className="flex h-dvh max-h-dvh flex-col overflow-hidden px-6 py-6 md:px-12 md:py-8">
      <AlertDialog
        open={!!alertPayload}
        title={alertPayload?.title ?? ""}
        description={alertPayload?.description ?? ""}
        okLabel={review.dialogOk}
        onClose={() => setAlertPayload(null)}
      />
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col">
        <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1 space-y-3">
            <PageHeaderGlobalRow>
              <BackToHomeLink variant="toolbar" />
            </PageHeaderGlobalRow>
            <h1 className="text-[20px] font-semibold leading-[1.2] text-ink">
              {role.readPageTitle}
            </h1>
          </div>
          <div className="shrink-0 lg:pt-0.5">
            <ContextActionsWithDivider>
              <Link href={`/session/${id}`} className="ui-btn ui-btn-sm ui-btn-equal px-4">
                {role.backToSession}
              </Link>
            </ContextActionsWithDivider>
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-[var(--radius-card)] bg-surface p-5 md:p-6">
          <RoleCardMarkdown
            markdown={getEffectiveRoleCardText(session) ?? ""}
            variant="read"
          />
        </div>

        <div className="shrink-0 border-t border-soft-border bg-page pt-4 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-wrap gap-3">
            {ttsSupported ? (
              <button type="button" onClick={onListen} className="ui-btn ui-btn-equal px-6">
                {role.listenOnce}
              </button>
            ) : (
              <p className="text-xs text-ink-subtle">{role.listenUnsupported}</p>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => void onComplete()}
              className="ui-btn ui-btn-equal px-6"
            >
              {role.completeRead}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
