"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSession } from "../../_lib/sessionRepo";
import type { SessionScene } from "../../_lib/sessionTypes";
import { PrimaryButton } from "../../_ui/PrimaryButton";

export default function NewSessionPage() {
  const router = useRouter();
  const [scene] = useState<SessionScene>("civil_service");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await createSession({ scene, name: name.trim() || undefined });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      router.push(`/session/${res.value.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-xl">
        <h1 className="text-[20px] font-semibold leading-[1.2] text-slate-900">
          新建会话
        </h1>
        <p className="mt-3 text-sm text-slate-700">
          选择场景并创建一场新的排练会话。
        </p>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <label className="block text-[14px] font-semibold leading-[1.5] text-slate-900">
            场景
          </label>
          <div className="mt-2 text-sm text-slate-700">公务员面试</div>

          <label className="mt-6 block text-[14px] font-semibold leading-[1.5] text-slate-900">
            备注（可选）
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：第 1 次练习 / 自信版本"
            className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          />

          <div className="mt-4 text-sm text-slate-600">
            内容默认保存在本地，不会上传。
          </div>

          {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm outline-none ring-offset-2 transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60"
            >
              创建并进入
            </button>
            <span className="text-sm text-slate-600">
              {isSubmitting ? "创建中…" : ""}
            </span>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Phase 1：这里只创建会话与状态骨架；录制/转写将在后续阶段加入。
          </div>
        </div>

        <div className="mt-6">
          <PrimaryButton href="/">返回首页</PrimaryButton>
        </div>
      </div>
    </main>
  );
}

