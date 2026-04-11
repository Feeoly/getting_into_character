/** 文本导出：优先 File System Access API，否则触发下载 */

type SaveOpts = {
  suggestedName?: string;
  types?: Array<{ description?: string; accept: Record<string, string[]> }>;
};

function getSaveFilePicker():
  | ((opts?: SaveOpts) => Promise<FileSystemFileHandle>)
  | undefined {
  return (
    globalThis as unknown as {
      showSaveFilePicker?: (o?: SaveOpts) => Promise<FileSystemFileHandle>;
    }
  ).showSaveFilePicker;
}

export type DownloadTextResult =
  | { ok: true; via: "picker" | "download" }
  | { ok: false; reason: "cancelled" };

export async function downloadTextFile(
  text: string,
  suggestedBaseName: string,
  ext: "md" | "txt",
): Promise<DownloadTextResult> {
  if (typeof window === "undefined") {
    return { ok: false, reason: "cancelled" };
  }

  const safeBase =
    suggestedBaseName.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 120) || "export";
  const suggestedName = `${safeBase}.${ext}`;
  const mime = ext === "md" ? "text/markdown" : "text/plain";

  const picker = getSaveFilePicker();
  if (typeof picker === "function") {
    try {
      const handle = await picker({
        suggestedName,
        types: [{ description: ext === "md" ? "Markdown" : "文本", accept: { [mime]: [`.${ext}`] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(new Blob([text], { type: `${mime};charset=utf-8` }));
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
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
  a.href = url;
  a.download = suggestedName;
  a.rel = "noopener";
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return { ok: true, via: "download" };
}
