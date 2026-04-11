"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { saveSessionRoleCard } from "../../../_lib/sessionRepo";
import type { Session, SessionRoleMoodPreset } from "../../../_lib/sessionTypes";
import {
  ROLE_MOOD_LABELS,
  ROLE_MOOD_PRESET_IDS,
  role,
} from "../_lib/roleCopy";

type Props = {
  sessionId: string;
  session: Session;
  onSaved: (s: Session) => void;
};

export function RoleCardSection({ sessionId, session, onSaved }: Props) {
  const [open, setOpen] = useState(true);
  const [preset, setPreset] = useState<SessionRoleMoodPreset | "">(
    session.roleMoodPreset ?? "",
  );
  const [custom, setCustom] = useState(session.roleMoodCustom ?? "");
  const [trigger, setTrigger] = useState(session.roleTrigger ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [highlightReadCta, setHighlightReadCta] = useState(false);
  const [scrollAfterCard, setScrollAfterCard] = useState(false);
  const nextActionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPreset(session.roleMoodPreset ?? "");
    setCustom(session.roleMoodCustom ?? "");
    setTrigger(session.roleTrigger ?? "");
  }, [
    session.roleMoodPreset,
    session.roleMoodCustom,
    session.roleTrigger,
    session.roleCardUpdatedAt,
  ]);

  const onSave = useCallback(async () => {
    setError(null);
    setHint(null);
    setSaving(true);
    try {
      const res = await saveSessionRoleCard(sessionId, {
        moodPreset: preset || undefined,
        moodCustom: custom.trim() || undefined,
        trigger: trigger.trim(),
      });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      onSaved(res.value);
      setHint(role.savedHint);
      setScrollAfterCard(true);
    } finally {
      setSaving(false);
    }
  }, [sessionId, preset, custom, trigger, onSaved]);

  useEffect(() => {
    if (!scrollAfterCard || !session.roleCardText) return;
    setScrollAfterCard(false);
    setHighlightReadCta(true);
    window.requestAnimationFrame(() => {
      nextActionsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, [scrollAfterCard, session.roleCardText]);

  useEffect(() => {
    if (!highlightReadCta) return;
    const t = window.setTimeout(() => setHighlightReadCta(false), 6000);
    return () => window.clearTimeout(t);
  }, [highlightReadCta]);

  const hasCard = Boolean(session.roleCardText);

  return (
    <div
      id="role-card-section"
      className="rounded-lg border border-slate-200 bg-white px-6 py-5"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div>
          <div className="text-sm font-semibold text-slate-900">{role.sectionTitle}</div>
          <div className="mt-1 text-sm text-slate-600">{role.sectionHint}</div>
        </div>
        <span className="shrink-0 text-sm font-semibold text-blue-600">
          {open ? role.collapse : role.expand}
        </span>
      </button>

      {open ? (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:min-w-0">
              <label className="block text-sm font-semibold text-slate-900">{role.moodLabel}</label>
              <select
                value={preset}
                onChange={(e) =>
                  setPreset((e.target.value || "") as SessionRoleMoodPreset | "")
                }
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <option value="">{role.moodPlaceholder}</option>
                {ROLE_MOOD_PRESET_IDS.map((id) => (
                  <option key={id} value={id}>
                    {ROLE_MOOD_LABELS[id]}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:min-w-0">
              <label className="block text-sm font-semibold text-slate-900">{role.triggerLabel}</label>
              <input
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder={role.triggerPlaceholder}
                maxLength={120}
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-900">
                {role.moodCustomLabel}
              </label>
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder={role.moodCustomPlaceholder}
                maxLength={80}
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              />
            </div>
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          {hint ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
              {hint}
            </div>
          ) : null}

          <div ref={nextActionsRef} className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => void onSave()}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm outline-none ring-offset-2 transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60"
            >
              {role.save}
            </button>
            {hasCard ? (
              <Link
                href={`/session/${sessionId}/role/read`}
                className={`inline-flex h-11 items-center justify-center rounded-lg border px-6 text-sm font-semibold shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  highlightReadCta
                    ? "border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-400 ring-offset-2"
                    : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                {role.goRead}
              </Link>
            ) : null}
          </div>

          {session.roleReadAloudCompletedAt ? (
            <p className="text-xs text-slate-500">{role.readAloudDone}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
