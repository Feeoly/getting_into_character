/** Phase 5 角色卡 UI 与模板标题（zh-CN） */

export const role = {
  sectionTitle: "角色与触发物",
  sectionHint: "进入排练前可先准备角色卡，并通过朗读模式巩固状态。",
  moodLabel: "角色状态",
  moodPlaceholder: "选择一种气质",
  moodCustomLabel: "补充说明（可选）",
  moodCustomPlaceholder:
    "比如：角色名叫陆沉舟，取自\"沉舟侧畔千帆过\"，自带一种历经风浪后的沉稳与静气。设定是个见过世面的女士，性格是话少、慢热、脸皮厚",
  triggerLabel: "触发物",
  triggerPlaceholder: "例如：一支笔，水杯",
  save: "保存并生成角色卡",
  savedHint: "已生成角色卡。下一步：点击下方「进入朗读模式」朗读一遍，再回本页进入排练。",
  goRead: "进入朗读模式",
  readAloudDone: "已完成朗读，可进入排练。",
  notSaved: "请先填写触发物与角色状态，并保存。",
  collapse: "收起",
  expand: "展开",
  readPageTitle: "朗读角色卡",
  readPageHint: "请大声朗读全文，把状态读进身体里。",
  backToSession: "返回会话",
  listenOnce: "听一遍",
  listenUnsupported: "当前浏览器不支持语音朗读。",
  completeRead: "我已完成朗读",
  rehearsalSoftBlock:
    "你已有角色卡但尚未完成朗读。建议先完成朗读再录制，更容易进入状态。确定仍要进入排练？",
  rehearsalNoCard: "请先在本页保存角色卡，再进入排练。",
  moodRequired: "请选择一种角色气质，或填写补充说明。",
  triggerRequired: "请填写触发物。",
  rehearsalBanner: "当前角色",
} as const;

export const roleSectionTitles = {
  state: "状态描述",
  actions: "可执行表达指令",
  taboos: "禁忌",
} as const;

export const ROLE_MOOD_PRESET_IDS = ["confident", "eloquent", "calm", "steady"] as const;
export type RoleMoodPresetId = (typeof ROLE_MOOD_PRESET_IDS)[number];

export const ROLE_MOOD_LABELS: Record<RoleMoodPresetId, string> = {
  confident: "自信",
  eloquent: "侃侃而谈",
  calm: "冷静",
  steady: "沉稳",
};

/** Phase 6：角色卡 AI 增强（百炼，仅文本） */
export const roleAi = {
  disclosure:
    "勾选同意后，可将当前角色卡相关文字发送到百炼（OpenAI 兼容接口）生成增强稿；录音仍在本地，不会上传。",
  consentLabel:
    "我同意仅向模型服务发送本页的角色卡与气质/触发物相关文字，不上传录音文件。",
  enhanceButton: "AI 增强角色卡",
  useLocal: "使用本地原版",
  useAi: "使用增强版",
  consentRequired: "请先勾选同意说明，再使用 AI 增强。",
  enhancing: "正在生成…",
  errorPrefix: "请求失败：",
} as const;
