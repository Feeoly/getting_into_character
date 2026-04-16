"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  isPresetImageId,
  isPresetVideoId,
  PRESET_IMAGE_IDS,
  PRESET_IMAGE_LABEL,
  PRESET_VIDEO_IDS,
  PRESET_VIDEO_LABEL,
  REHEARSAL_BG_VIDEO_REPLAY_EVENT,
} from "../_lib/presetBackgrounds";
import { getUploadedBackground } from "../_lib/rehearsalRepo";
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

function orderedUploadIds(s: RehearsalSettings): string[] {
  if (s.uploadedBackgroundIds?.length) return [...s.uploadedBackgroundIds];
  if (s.uploadedBackgroundId) return [s.uploadedBackgroundId];
  return [];
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
  const [uploadPreviews, setUploadPreviews] = useState<
    { id: string; url: string; label: string }[]
  >([]);
  const uploadBlobUrlsRef = useRef<string[]>([]);

  const uploadIdsKey = useMemo(() => JSON.stringify(orderedUploadIds(settings)), [settings]);

  useEffect(() => {
    if (!open) setUploadBusy(false);
  }, [open]);

  useEffect(() => {
    for (const u of uploadBlobUrlsRef.current) URL.revokeObjectURL(u);
    uploadBlobUrlsRef.current = [];
    setUploadPreviews([]);

    if (!open || settings.backgroundSource !== "upload_image") return;

    const ids = orderedUploadIds(settings);
    if (ids.length === 0) return;

    let cancelled = false;
    void (async () => {
      const rows: { id: string; url: string; label: string }[] = [];
      const urls: string[] = [];
      for (const bid of ids) {
        const row = await getUploadedBackground(bid);
        if (!row || cancelled) continue;
        const url = URL.createObjectURL(row.blob);
        urls.push(url);
        rows.push({
          id: bid,
          url,
          label: row.filename?.trim() || `图片 ${rows.length + 1}`,
        });
      }
      if (cancelled) {
        for (const u of urls) URL.revokeObjectURL(u);
        return;
      }
      uploadBlobUrlsRef.current = urls;
      setUploadPreviews(rows);
    })();

    return () => {
      cancelled = true;
      for (const u of uploadBlobUrlsRef.current) URL.revokeObjectURL(u);
      uploadBlobUrlsRef.current = [];
    };
    // uploadIdsKey 已含上传 id 列表；不依赖整份 settings，避免改阈值等时重复解码图片
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, settings.backgroundSource, uploadIdsKey]);

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
        presetId: isPresetImageId(settings.presetId) ? settings.presetId : "bg-1",
      });
      return;
    }

    if (source === "preset_video") {
      const vid = settings.presetId;
      onChange({
        ...settings,
        backgroundSource: source,
        presetId: isPresetVideoId(vid) ? vid : "bg-loop",
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
    <div className="fixed inset-0 z-[80]">
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
                  {PRESET_IMAGE_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      title={PRESET_IMAGE_LABEL[id]}
                      onClick={() => onChange({ ...settings, presetId: id })}
                      className={`ui-btn ui-btn-sm min-w-0 !justify-start gap-0 px-3 text-left max-w-[min(100%,14rem)] ${settings.presetId === id ? "ui-btn-on" : ""}`}
                    >
                      <span className="min-w-0 flex-1 truncate">{PRESET_IMAGE_LABEL[id]}</span>
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
                预置视频（离线）
              </label>

              {settings.backgroundSource === "preset_video" ? (
                <div className="ml-6 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {PRESET_VIDEO_IDS.map((id) => (
                      <button
                        key={id}
                        type="button"
                        title={PRESET_VIDEO_LABEL[id]}
                        onClick={() => {
                          if (
                            settings.backgroundSource === "preset_video" &&
                            settings.presetId === id &&
                            !settings.presetVideoLoop
                          ) {
                            window.dispatchEvent(new CustomEvent(REHEARSAL_BG_VIDEO_REPLAY_EVENT));
                            return;
                          }
                          onChange({
                            ...settings,
                            backgroundSource: "preset_video",
                            presetId: id,
                          });
                        }}
                        className={`ui-btn ui-btn-sm min-w-0 !justify-start gap-0 px-3 text-left max-w-[min(100%,14rem)] ${settings.presetId === id ? "ui-btn-on" : ""}`}
                      >
                        <span className="min-w-0 flex-1 truncate">{PRESET_VIDEO_LABEL[id]}</span>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2 text-sm text-ink">
                    <div className="text-xs font-medium text-ink-muted">播放方式</div>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="presetVideoLoop"
                        checked={settings.presetVideoLoop}
                        onChange={() => onChange({ ...settings, presetVideoLoop: true })}
                      />
                      循环播放
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="presetVideoLoop"
                        checked={!settings.presetVideoLoop}
                        onChange={() => onChange({ ...settings, presetVideoLoop: false })}
                      />
                      单次播放
                    </label>
                  </div>
                </div>
              ) : null}

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
                      ? "多张图会保留在本地；点击下方缩略图可切换当前背景，新上传会加入列表。"
                      : "还没有上传背景。"}
                  </div>
                  {uploadPreviews.length > 0 ? (
                    <div className="mt-3">
                      <div className="text-xs font-medium text-ink-muted">已上传（点击选用）</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {uploadPreviews.map((p) => {
                          const active = settings.uploadedBackgroundId === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              title={p.label}
                              onClick={() =>
                                onChange({
                                  ...settings,
                                  backgroundSource: "upload_image",
                                  uploadedBackgroundId: p.id,
                                })
                              }
                              className={`rounded-xl p-0.5 ring-2 transition-shadow ${
                                active ? "ring-ink shadow-md" : "ring-transparent hover:ring-ink/25"
                              }`}
                            >
                              <img
                                src={p.url}
                                alt=""
                                className="h-16 w-16 rounded-lg object-cover"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
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
              默认仅录麦克风。需要看到自己时，可开启摄像头
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
          </section>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </div>
      </aside>
    </div>
  );
}

