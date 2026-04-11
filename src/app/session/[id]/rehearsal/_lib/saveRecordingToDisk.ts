/** 浏览器无法静默写入任意路径；通过「另存为」或下载让用户落盘 */

type SaveFilePickerOptions = {
  suggestedName?: string;
  types?: Array<{ description?: string; accept: Record<string, string[]> }>;
};

function getSaveFilePicker(): ((opts?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>) | undefined {
  return (globalThis as unknown as { showSaveFilePicker?: (o?: SaveFilePickerOptions) => Promise<FileSystemFileHandle> })
    .showSaveFilePicker;
}

function extFromMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("webm")) return "webm";
  if (m.includes("mp4")) return "mp4";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("wav")) return "wav";
  return "webm";
}

function acceptForPicker(mime: string, ext: string): Record<string, string[]> {
  const type = mime && mime !== "application/octet-stream" ? mime : `video/${ext}`;
  return { [type]: [`.${ext}`] };
}

export type SaveRecordingResult =
  | { ok: true; via: "picker" | "download" }
  | { ok: false; reason: "cancelled" };

/**
 * 优先 File System Access API「另存为」（可选文件夹）；否则 <a download> 进默认下载目录。
 */
export async function saveRecordingBlob(blob: Blob, suggestedBaseName: string): Promise<SaveRecordingResult> {
  if (typeof window === "undefined") {
    return { ok: false, reason: "cancelled" };
  }

  const ext = extFromMime(blob.type);
  const safeBase =
    suggestedBaseName.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 120) || "rehearsal";
  const suggestedName = `${safeBase}.${ext}`;

  const picker = getSaveFilePicker();
  if (typeof picker === "function") {
    try {
      const handle = await picker({
        suggestedName,
        types: [
          {
            description: "录制文件",
            accept: acceptForPicker(blob.type, ext),
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { ok: true, via: "picker" };
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return { ok: false, reason: "cancelled" };
      }
      if (e instanceof Error && e.name === "AbortError") {
        return { ok: false, reason: "cancelled" };
      }
    }
  }

  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = suggestedName;
  a.rel = "noopener";
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return { ok: true, via: "download" };
}
