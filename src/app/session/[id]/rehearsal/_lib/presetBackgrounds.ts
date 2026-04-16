/** 排练页监听：设置里再次点选当前预置视频时触发重播（单次播放模式） */
export const REHEARSAL_BG_VIDEO_REPLAY_EVENT = "gic-rehearsal-replay-bg";

/** 预置静态图（public/rehearsal/backgrounds/） */
export const PRESET_IMAGE_IDS = ["bg-1", "bg-2", "bg-3", "bg-4"] as const;
export type PresetImageId = (typeof PRESET_IMAGE_IDS)[number];

export const PRESET_IMAGE_LABEL: Record<PresetImageId, string> = {
  "bg-1": "公务员面试场景1",
  "bg-2": "公务员面试场景2",
  "bg-3": "公务员面试场景3",
  "bg-4": "公务员面试场景4",
};

const PRESET_IMAGE_PATH: Record<PresetImageId, string> = {
  "bg-1": "/rehearsal/backgrounds/bg-1.jpg",
  "bg-2": "/rehearsal/backgrounds/bg-2.png",
  /** 当前资源为 jpeg；若改为 bg-3.png 请同步改文件名与下列路径 */
  "bg-3": "/rehearsal/backgrounds/bg-3.jpeg",
  "bg-4": "/rehearsal/backgrounds/bg-4.jpeg",
};

export function isPresetImageId(id: string | undefined): id is PresetImageId {
  return id !== undefined && (PRESET_IMAGE_IDS as readonly string[]).includes(id);
}

export function presetImagePublicPath(presetId: string | undefined): string {
  if (isPresetImageId(presetId)) return PRESET_IMAGE_PATH[presetId];
  return PRESET_IMAGE_PATH["bg-1"];
}

/** 预置循环视频（public/rehearsal/backgrounds/） */
export const PRESET_VIDEO_IDS = ["bg-loop", "bg-loop-2", "bg-loop-3"] as const;
export type PresetVideoId = (typeof PRESET_VIDEO_IDS)[number];

export const PRESET_VIDEO_LABEL: Record<PresetVideoId, string> = {
  "bg-loop": "预置循环视频 1",
  "bg-loop-2": "预置循环视频 2",
  "bg-loop-3": "预置循环视频 3",
};

const PRESET_VIDEO_PATH: Record<PresetVideoId, string> = {
  "bg-loop": "/rehearsal/backgrounds/bg-loop.mp4",
  "bg-loop-2": "/rehearsal/backgrounds/bg-loop-2.mp4",
  "bg-loop-3": "/rehearsal/backgrounds/bg-loop-3.mp4",
};

export function isPresetVideoId(id: string | undefined): id is PresetVideoId {
  return id !== undefined && (PRESET_VIDEO_IDS as readonly string[]).includes(id);
}

export function presetVideoPublicPath(id: string | undefined): string {
  if (isPresetVideoId(id)) return PRESET_VIDEO_PATH[id];
  return PRESET_VIDEO_PATH["bg-loop"];
}
