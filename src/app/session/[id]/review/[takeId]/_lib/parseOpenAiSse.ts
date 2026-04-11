/** 解析 OpenAI 兼容 chat/completions 流式 SSE 单行，返回增量文本；[DONE] 返回 null 表示结束帧 */

export function deltaFromSseDataLine(line: string): string | null | "__done__" {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;
  const payload = trimmed.slice(5).trim();
  if (payload === "[DONE]") return "__done__";
  try {
    const j = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: unknown } }>;
    };
    const c = j?.choices?.[0]?.delta?.content;
    if (c === undefined || c === null) return "";
    return typeof c === "string" ? c : "";
  } catch {
    return null;
  }
}
