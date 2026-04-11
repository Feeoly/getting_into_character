/** Phase 3 UI-SPEC 可见文案（zh-CN） */
export const stt = {
  sectionTitle: "转写",
  summaryLoading: "正在生成转写…",
  viewFull: "查看全文转写",
  jobQueued: "排队中",
  jobProcessing: "转写中",
  jobSucceeded: "已完成",
  jobFailed: "失败",
  fullPageTitle: "全文转写",
  fullPageHint: "以下为本地生成的文本，默认不会上传。",
  emptyFull: "该轮排练尚无转写段落。",
  retranscribe: "重新转写",
  initModel: "正在准备离线识别…",
  initModelSub: "首次使用可能需数十秒，可离开本页，完成后在会话中查看。",
  toastFailTitle: "转写失败",
  toastFailBody: "本地识别未成功，录音仍保留。",
  toastRetry: "重试转写",
  toastDismiss: "知道了",
  inlineRetry: "重试转写",
  errorInline: "转写未成功。可点击下方重试，或返回会话稍后查看。",
  emptyHeading: "暂无转写",
  emptyBody:
    "结束录制后将自动在本地生成转写。若刚结束录制，请稍候；仍无结果可尝试「重新转写」。",
  confirmRetranscribe:
    "将用当前音频重新生成转写并替换已有全文与摘要。确定继续？",
} as const;

export function previewSnippet(text: string, max = 140): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}
