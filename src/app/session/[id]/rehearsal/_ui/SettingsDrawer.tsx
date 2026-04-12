"use client";

import { useEffect, useMemo, useState } from "react";

import type { BackgroundSource, RehearsalSettings } from "../_lib/rehearsalTypes";

type Props = {
  open: boolean;
  settings: RehearsalSettings;
  uploadedBackgroundAvailable: boolean;
  onClose: () => void;
  onChange: (next: RehearsalSettings) => void;
  onUploadImage: (file: File) => Promise<void>;
  error?: string | null;
};

function secondsFromMs(ms: number): number {
  return Math.round(ms / 1000);
}

function msFromSeconds(sec: number): number {
  return Math.max(1000, Math.min(30000, Math.round(sec) * 1000));
}

export function SettingsDrawer({
  open,
  settings,
  uploadedBackgroundAvailable,
  onClose,
  onChange,
  onUploadImage,
  error,
}: Props) {
  const thresholdSec = useMemo(
    () => secondsFromMs(settings.pauseThresholdMs),
    [settings.pauseThresholdMs],
  );

  const [uploadBusy, setUploadBusy] = useState(false);

  useEffect(() => {
    if (!open) setUploadBusy(false);
  }, [open]);

  if (!open) return null;

  async function handleUpload(file: File | null) {
    if (!file) return;
    setUploadBusy(true);
    try {
      await onUploadImage(file);
    } finally {
      setUploadBusy(false);
    }
  }

  function setBackgroundSource(source: BackgroundSource) {
    if (source === "preset_image") {
      onChange({
        ...settings,
        backgroundSource: source,
        presetId: settings.presetId?.startsWith("bg-") ? settings.presetId : "bg-1",
        uploadedBackgroundId: undefined,
      });
      return;
    }

    if (source === "preset_video") {
      onChange({
        ...settings,
        backgroundSource: source,
        presetId: "bg-loop",
        uploadedBackgroundId: undefined,
      });
      return;
    }

    onChange({
      ...settings,
      backgroundSource: source,
      presetId: undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="关闭设置"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 h-full w-[min(420px,92vw)] overflow-auto bg-page p-6">
        <div className="flex items-center justify-between">
          <div className="text-[20px] font-semibold leading-[1.2] text-ink">
            设置
          </div>
          <button type="button" onClick={onClose} className="ui-btn px-4">
            关闭
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <section className="rounded-2xl bg-page p-4">
            <div className="text-sm font-semibold text-ink">停顿提示</div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div className="text-sm text-ink-muted">提示开关</div>
              <button
                type="button"
                onClick={() =>
                  onChange({ ...settings, pausePromptEnabled: !settings.pausePromptEnabled })
                }
                className={`ui-btn px-4 ${settings.pausePromptEnabled ? "ui-btn-on" : ""}`}
              >
                {settings.pausePromptEnabled ? "已开启" : "已关闭"}
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline justify-between">
                <div className="text-sm text-ink-muted">停顿阈值</div>
                <div className="text-sm font-semibold text-ink">{thresholdSec}s</div>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={thresholdSec}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    pauseThresholdMs: msFromSeconds(Number(e.target.value)),
                  })
                }
                className="mt-3 w-full"
              />
              <div className="mt-2 text-sm text-ink-muted">
                建议 5–10 秒。提示会温和出现，不会打断操作。
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-page p-4">
            <div className="text-sm font-semibold text-ink">场景背景</div>
            <div className="mt-3 space-y-3">
              <label className="flex items-center gap-3 text-sm text-ink">
                <input
                  type="radio"
                  name="bg"
                  checked={settings.backgroundSource === "preset_image"}
                  onChange={() => setBackgroundSource("preset_image")}
                />
                预置图片
              </label>

              {settings.backgroundSource === "preset_image" ? (
                <div className="ml-6 flex flex-wrap gap-2">
                  {(["bg-1", "bg-2"] as const).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onChange({ ...settings, presetId: id })}
                      className={`ui-btn px-4 ${settings.presetId === id ? "ui-btn-on" : ""}`}
                    >
                      {id.toUpperCase()}
                    </button>
                  ))}
                </div>
              ) : null}

              <label className="flex items-center gap-3 text-sm text-ink">
                <input
                  type="radio"
                  name="bg"
                  checked={settings.backgroundSource === "preset_video"}
                  onChange={() => setBackgroundSource("preset_video")}
                />
                预置循环视频（离线）
              </label>

              <label className="flex items-center gap-3 text-sm text-ink">
                <input
                  type="radio"
                  name="bg"
                  checked={settings.backgroundSource === "upload_image"}
                  onChange={() => setBackgroundSource("upload_image")}
                />
                上传图片
              </label>

              {settings.backgroundSource === "upload_image" ? (
                <div className="ml-6">
                  <div className="text-sm text-ink-muted">
                    {uploadedBackgroundAvailable
                      ? "已保存一张上传背景（本地）。"
                      : "还没有上传背景。"}
                  </div>
                  <div className="mt-3">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadBusy}
                      onChange={(e) => void handleUpload(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-ink file:mr-3 file:rounded-full file:border-2 file:border-ink file:bg-page file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-ink/5"
                    />
                    {uploadBusy ? (
                      <div className="mt-2 text-sm text-ink-muted">正在保存…</div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl bg-page p-4">
            <div className="text-sm font-semibold text-ink">画面来源</div>
            <div className="mt-2 text-sm text-ink-muted">
              默认仅录麦克风。需要看到自己时，可开启摄像头。
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="text-sm text-ink-muted">摄像头</div>
              <button
                type="button"
                onClick={() =>
                  onChange({ ...settings, cameraEnabled: !settings.cameraEnabled })
                }
                className={`ui-btn px-4 ${settings.cameraEnabled ? "ui-btn-on" : ""}`}
              >
                {settings.cameraEnabled ? "已开启" : "关闭"}
              </button>
            </div>

            <div className="mt-3 text-sm text-ink-muted">
              点击「开始录制」后才会请求权限：先麦克风，若已开启摄像头会同时请求画面。
            </div>
          </section>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </div>
      </aside>
    </div>
  );
}

