"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { saveRoleCardAiResult, setRoleCardPreferAi } from "../../../_lib/sessionRepo";
import { getEffectiveRoleCardText, type Session } from "../../../_lib/sessionTypes";
import { role, roleAi } from "../_lib/roleCopy";

const CONSENT_KEY = "gic-ai-role-consent-v1";

type Props = {
  session: Session;
  sessionId: string;
  onSessionChange?: (s: Session) => void;
};

export function RoleCardReadOnly({ session, sessionId, onSessionChange }: Props) {
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setConsent(typeof window !== "undefined" && localStorage.getItem(CONSENT_KEY) === "1");
    } catch {
      setConsent(false);
    }
  }, []);

  function persistConsent(v: boolean) {
    setConsent(v);
    try {
      if (v) localStorage.setItem(CONSENT_KEY, "1");
      else localStorage.removeItem(CONSENT_KEY);
    } catch {
      // ignore
    }
  }

  const effective = getEffectiveRoleCardText(session);
  const hasLocalDraft = Boolean(session.roleCardText?.trim());
  const hasAi = Boolean(session.roleCardAiText?.trim());

  async function onEnhance() {
    if (!consent) {
      setError(roleAi.consentRequired);
      return;
    }
    const draft = session.roleCardText ?? "";
    if (!draft.trim()) {
      setError("请先生成并保存本地角色卡。");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/role/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftText: draft,
          trigger: session.roleTrigger,
          moodCustom: session.roleMoodCustom,
          moodPreset: session.roleMoodPreset,
        }),
      });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : roleAi.errorPrefix + res.status;
        setError(msg.slice(0, 400));
        return;
      }
      const content =
        typeof data === "object" &&
        data !== null &&
        "content" in data &&
        typeof (data as { content: unknown }).content === "string"
          ? (data as { content: string }).content
          : "";
      if (!content.trim()) {
        setError("模型返回为空。");
        return;
      }
      const out = await saveRoleCardAiResult(sessionId, {
        roleCardAiText: content,
        roleCardPreferAi: true,
      });
      if (!out.ok) {
        setError(out.error.message);
        return;
      }
      onSessionChange?.(out.value);
    } catch {
      setError("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  async function onPreferAi(preferAi: boolean) {
    setError(null);
    const out = await setRoleCardPreferAi(sessionId, preferAi);
    if (!out.ok) {
      setError(out.error.message);
      return;
    }
    onSessionChange?.(out.value);
  }

  return (
    <div id="role-card-readonly" className="rounded-lg border border-slate-200 bg-white px-6 py-5">
      <div className="text-sm font-semibold text-slate-900">{role.sectionTitle}</div>
      <pre className="mt-3 max-h-[min(60vh,28rem)] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
        {effective ?? "—"}
      </pre>

      {hasLocalDraft ? (
        <div className="mt-4 space-y-3 rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3">
          <p className="text-xs leading-relaxed text-slate-600">{roleAi.disclosure}</p>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
              checked={consent}
              onChange={(e) => persistConsent(e.target.checked)}
            />
            <span>{roleAi.consentLabel}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading || !consent}
              onClick={() => void onEnhance()}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? roleAi.enhancing : roleAi.enhanceButton}
            </button>
            {hasAi ? (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void onPreferAi(false)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  {roleAi.useLocal}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void onPreferAi(true)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  {roleAi.useAi}
                </button>
              </>
            ) : null}
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/session/${sessionId}/role/read`}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          {role.goRead}
        </Link>
        {session.roleReadAloudCompletedAt ? (
          <span className="inline-flex items-center text-xs text-slate-500">{role.readAloudDone}</span>
        ) : null}
      </div>
    </div>
  );
}
