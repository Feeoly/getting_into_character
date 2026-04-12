"use client";

import Link from "next/link";
import { useState } from "react";

import { saveRoleCardAiResult, setRoleCardPreferAi } from "../../../_lib/sessionRepo";
import { getEffectiveRoleCardText, type Session } from "../../../_lib/sessionTypes";
import { role, roleAi } from "../_lib/roleCopy";
import { RoleCardMarkdown } from "./RoleCardMarkdown";

type Props = {
  session: Session;
  sessionId: string;
  onSessionChange?: (s: Session) => void;
};

export function RoleCardReadOnly({ session, sessionId, onSessionChange }: Props) {
  const effective = getEffectiveRoleCardText(session);
  const hasLocalDraft = Boolean(session.roleCardText?.trim());
  const hasAiCard = Boolean(session.roleCardAiText?.trim());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onEnhance() {
    setError(null);
    const draft = session.roleCardText?.trim() ?? "";
    if (!draft) return;

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
            : `${res.status}`;
        setError(roleAi.errorPrefix + msg);
        return;
      }
      const content =
        typeof data === "object" &&
        data !== null &&
        "content" in data &&
        typeof (data as { content: unknown }).content === "string"
          ? (data as { content: string }).content.trim()
          : "";
      if (!content) {
        setError(roleAi.errorPrefix + "空内容");
        return;
      }
      const r = await saveRoleCardAiResult(sessionId, { roleCardAiText: content });
      if (!r.ok) {
        setError(r.error.message);
        return;
      }
      onSessionChange?.(r.value);
    } catch {
      setError(roleAi.errorPrefix + "网络异常");
    } finally {
      setLoading(false);
    }
  }

  async function onPreferAi(preferAi: boolean) {
    setError(null);
    const r = await setRoleCardPreferAi(sessionId, preferAi);
    if (!r.ok) {
      setError(r.error.message);
      return;
    }
    onSessionChange?.(r.value);
  }

  const showingAi =
    hasAiCard && session.roleCardPreferAi !== false;

  return (
    <div
      id="role-card-readonly"
      className="rounded-[var(--radius-card)] bg-surface px-6 py-5"
    >
      <div className="text-sm font-semibold text-ink">{role.sectionTitle}</div>
      <div className="mt-3 overflow-hidden rounded-2xl">
        <RoleCardMarkdown markdown={effective ?? ""} variant="compact" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link href={`/session/${sessionId}/role/read`} className="ui-btn px-6">
          {role.goRead}
        </Link>

        {hasLocalDraft ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => void onEnhance()}
            className="ui-btn px-6 disabled:opacity-45"
          >
            {loading ? roleAi.enhancing : roleAi.enhanceButton}
          </button>
        ) : null}

        {hasAiCard ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void onPreferAi(false)}
              className={`ui-btn ui-btn-sm px-4 ${!showingAi ? "ui-btn-on" : ""}`}
            >
              {roleAi.useLocal}
            </button>
            <button
              type="button"
              onClick={() => void onPreferAi(true)}
              className={`ui-btn ui-btn-sm px-4 ${showingAi ? "ui-btn-on" : ""}`}
            >
              {roleAi.useAi}
            </button>
          </div>
        ) : null}

        {session.roleReadAloudCompletedAt ? (
          <span className="inline-flex items-center text-xs text-ink-subtle">{role.readAloudDone}</span>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
