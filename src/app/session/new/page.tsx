"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSessionComplete } from "../../_lib/sessionRepo";
import {
  SESSION_ROLE_MOOD_CUSTOM_MAX,
  type SessionScene,
} from "../../_lib/sessionTypes";
import { ELENA_ROLE_TEMPLATE } from "../_lib/roleTemplates";
import {
  ROLE_MOOD_LABELS,
  ROLE_MOOD_PRESET_IDS,
  role,
} from "../[id]/_lib/roleCopy";
import type { SessionRoleMoodPreset } from "../../_lib/sessionTypes";
import { BackToHomeLink } from "../../_ui/BackToHomeLink";

export default function NewSessionPage() {
  const router = useRouter();
  const [scene] = useState<SessionScene>("civil_service");
  const [name, setName] = useState("");
  const [preset, setPreset] = useState<SessionRoleMoodPreset | "">("");
  const [custom, setCustom] = useState("");
  const [trigger, setTrigger] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function applyElenaTemplate() {
    setPreset(ELENA_ROLE_TEMPLATE.moodPreset);
    setTrigger(ELENA_ROLE_TEMPLATE.trigger);
    setCustom(ELENA_ROLE_TEMPLATE.moodCustom);
  }

  async function onSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await createSessionComplete({
        scene,
        name: name.trim() || undefined,
        moodPreset: preset || undefined,
        moodCustom: custom.trim() || undefined,
        trigger: trigger.trim(),
      });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      router.push(`/session/${res.value.id}`);
    } catch {
      setError("操作失败。请刷新后重试；若仍失败，请检查浏览器存储权限或剩余空间。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-xl">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <BackToHomeLink />
        </div>
        <h1 className="mt-3 text-[20px] font-semibold leading-[1.2] text-ink">
          新建会话
        </h1>

        <div className="mt-6 space-y-6 rounded-2xl border border-border/80 bg-surface p-6 shadow-soft-sm">
          <div>
            <label className="block text-[14px] font-semibold leading-[1.5] text-ink">
              场景
            </label>
            <div className="mt-2 text-sm text-ink-muted">公务员面试</div>
          </div>

          <div>
            <label className="block text-[14px] font-semibold leading-[1.5] text-ink">
              备注（可选）
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="比如：第1次练习，自信角色版本"
              className="mt-2 h-11 w-full rounded-xl border border-border/90 bg-page px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>

          <div className="border-t border-border/60 pt-2">
            <div className="text-sm font-semibold text-ink">{role.sectionTitle}</div>
            <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border/80 bg-card-sage/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-ink-muted">角色模板 · 一键填入后可改</span>
              <button
                type="button"
                onClick={applyElenaTemplate}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-link shadow-soft-sm hover:bg-accent-muted"
              >
                填入 {ELENA_ROLE_TEMPLATE.label}
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:min-w-0">
                <label className="block text-sm font-semibold text-ink">{role.moodLabel}</label>
                <select
                  value={preset}
                  onChange={(e) =>
                    setPreset((e.target.value || "") as SessionRoleMoodPreset | "")
                  }
                  className="mt-2 h-11 w-full min-w-0 cursor-pointer appearance-none rounded-xl border border-border/90 bg-page pl-3 pr-10 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.6' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.125rem 1.125rem",
                    backgroundPosition: "right 0.65rem center",
                  }}
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
                <label className="block text-sm font-semibold text-ink">{role.triggerLabel}</label>
                <input
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  placeholder="例如：一支笔，水杯"
                  maxLength={120}
                  className="mt-2 h-11 w-full rounded-xl border border-border/90 bg-page px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-ink">
                  {role.moodCustomLabel}
                </label>
                <textarea
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder={role.moodCustomPlaceholder}
                  maxLength={SESSION_ROLE_MOOD_CUSTOM_MAX}
                  rows={6}
                  className="mt-2 w-full resize-y rounded-xl border border-border/90 bg-page px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
                />
              </div>
            </div>
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void onSubmit()}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-accent px-8 text-sm font-semibold text-white shadow-soft-sm outline-none ring-offset-2 ring-offset-page transition hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            >
              创建并进入
            </button>
            <span className="text-sm text-ink-muted">{isSubmitting ? "创建中…" : ""}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
