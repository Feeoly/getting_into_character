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
  retryNoBlob: "没有可用的本地录音，请进入排练重新录制后再试。",
} as const;

export function previewSnippet(text: string, max = 140): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

/** Phase 4 复盘页文案（04-UI-SPEC） */
export const review = {
  pageTitle: "复盘",
  subtitleHint: "以下为本地数据；导出与删除仅影响本机浏览器。",
  openReview: "进入复盘",
  segmentJump: "跳转播放",
  pauseSectionTitle: "停顿记录",
  pauseRow: "{start}–{end} · 约 {duration} 秒",
  noPauses: "本轮未记录长时间停顿",
  exportMd: "导出 Markdown",
  exportTxt: "导出 TXT",
  deleteTake: "删除本轮",
  deleteSession: "删除整场会话",
  dangerZone: "危险操作",
  backToSession: "返回会话",
  transcriptSection: "转写片段",
  confirmDeleteTake: "将永久删除本轮的录音转写、停顿记录等本地数据，且不可恢复。确定继续？",
  confirmDeleteSession: "将永久删除本场会话的全部本地数据（含所有轮次、转写、停顿等），且不可恢复。确定继续？",
  deleteTakeDone: "已删除本轮数据。",
  deleteSessionDone: "已删除会话。",
} as const;

export const ai = {
  sectionTitle: "AI 复盘",
  disclosure: "仅在你点击发送后上传文本上下文；录音不离开本机。",
  inputPlaceholder: "输入题目、答题要点或追问…",
  send: "发送",
  loading: "正在生成…",
  error: "请求失败，请检查网络或稍后重试。",
  consentRequired: "请先阅读并同意上方说明后再使用 AI。",
  consentLabel: "我已阅读并同意：仅将上方文本摘要发送至模型服务，不上传录音文件。",
  configError: "未配置 AI：请在服务端环境变量中设置 BAILIAN_BASE_URL 与 BAILIAN_API_KEY。",
} as const;
