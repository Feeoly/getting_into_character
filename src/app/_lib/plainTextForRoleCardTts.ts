/**
 * 朗读 TTS：弱化 Markdown 标记，减少读屏读出星号、井号等。
 */
export function plainTextForRoleCardTts(markdown: string): string {
  let s = markdown.trim();
  if (!s) return "";
  s = s.replace(/```[\s\S]*?```/g, " ");
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/__([^_]+)__/g, "$1");
  s = s.replace(/\*([^*\n]+)\*/g, "$1");
  s = s.replace(/_([^_\n]+)_/g, "$1");
  s = s.replace(/^#{1,6}\s+/gm, "");
  s = s.replace(/^[-*+]\s+/gm, "");
  s = s.replace(/^\d+\.\s+/gm, "");
  s = s.replace(/^---+$/gm, "");
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  s = s.replace(/\s+/g, " ");
  return s.trim();
}
