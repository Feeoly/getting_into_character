---
phase: 04
slug: review-export
status: approved
shadcn_initialized: false
preset: none
created: 2026-04-11
---

# Phase 04 — UI Design Contract（复盘闭环 + 导出/删除 + AI Chat）

> 视觉与交互契约。来源：`04-CONTEXT.md`、`REQUIREMENTS.md`（REVI-01～03、PRIV-01、PRIV-03）、`01-UI-SPEC.md`、`03-UI-SPEC.md`。

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none（与 Phase 01/03 一致） |
| Preset | not applicable |
| Component library | radix *（未来若引入 shadcn 时沿用）* |
| Icon library | lucide-react *（同上）* |
| Font | system-ui；Heading/Body 与01 一致 |

---

## Visual Hierarchy（Phase 4）

**复盘页 `/session/[id]/review/[takeId]`：**  
1. 页眉：Heading「复盘」+ 会话名/轮次次要信息（Label 色）+ 顶栏次要操作（返回会话、导出）。  
2. **主栏（桌面建议60% 宽）：** 媒体播放器（若该轮有音视频 Blob）→ 其下为**转写片段列表**（与03 全文页行式一致，但**可点击**驱动播放跳转）。  
3. **侧栏或次区块（40% 或主栏下方堆叠）：** **停顿事件列表**（时间范围 + 时长）→ **AI 复盘** Chat 区（消息流 + 输入 + 首次同意层）。  
**移动：** 垂直堆叠顺序：播放器 → 转写 → 停顿 → AI；`md` 以上可用 `lg` gap 两列 grid。

**焦点：** 复盘=「看得清说了什么 + 哪里卡了 + 可问 AI」；避免单屏信息超过3 个同级大标题抢视线。

---

## Spacing Scale

与 Phase 01/03 完全一致（`03-UI-SPEC.md` 表）。

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | 图标与文字、细分割条 |
| sm | 8px | 列表行距、紧凑栈 |
| md | 16px | 默认间距、卡片内块间距 |
| lg | 24px | 卡片 padding、复盘主区块间距 |
| xl | 32px | 列间距、页面边距 |
| 2xl | 48px | 大区块分隔 |
| 3xl | 64px | 页面级 |

**Exceptions：** 触摸目标 **≥44px**；Chat 输入框 `min-h` 与发送按钮同01 主按钮高度约定。

---

## Typography

与 Phase 01/03 一致。

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 14px | 600 | 1.5 |
| Heading | 20px | 600 | 1.2 |
| Display | 28px | 600 | 1.2 |

**Phase 4 补充：**  
- 转写片段时间戳：`tabular-nums`，Label。  
- Chat 用户气泡 /助手气泡：均 Body；助手引用块（转写摘录）用 **次要色** 左边框 4px Accent 或 `#E2E8F0` 背景，`padding: sm md`。  
- 停顿行：`start_ms`～`end_ms` 范围 Label + `duration` 次要 Body。

---

## Color

与 Phase 01/03 色板一致。

| Role | Value | Usage |
|------|-------|------|
| Dominant (60%) | #F8FAFC | 页面底、Chat 区外背景 |
| Secondary (30%) | #FFFFFF | 卡片、播放器容器、消息列表底 |
| Accent (10%) | #2563EB | 主链、选中片段左边条、发送主按钮、焦点环 |
| Destructive | #DC2626 | **删除**按钮文字/描边、危险确认标题强调（**禁止**整屏红底） |

**Accent reserved for：** 导出主链、跳转当前播放片段高亮、AI 发送、返回会话主链。  
**Destructive reserved for：** 「删除本轮」「删除整场会话」及确认对话框内主destructive 按钮。

---

## Copywriting Contract（zh-CN）

| Element | Copy |
|---------|------|
| Primary CTA（复盘页） | 返回会话 |
| Secondary CTA | 导出 Markdown / 导出 TXT（并列次要按钮或下拉） |
| Empty state heading（无媒体） | 本轮无可用回放文件 |
| Empty state body | 转写仍可查看；录音可能仅保存在本地其他轮次。 |
| Error state | 加载失败。请返回会话重试。 |
| Destructive confirmation（删会话） | **删除整场会话**：将永久删除本场次的排练设置、所有录音转写、停顿记录及 AI 草稿，且不可恢复。确定删除？ |
| Destructive confirmation（删单轮） | **删除本轮练习**：将删除该轮录音转写、停顿与相关 AI 草稿，不影响其他轮次。确定删除？ |
| AI consent（首次） | **使用 AI 复盘**：将把你的题目、答案与节选转写发送至你配置的服务端模型（不会上传原始录音文件）。继续即表示同意。 — 取消 / 同意并继续 |

---

## Phase 4 文案表（用户可见字符串）

| Key | zh-CN | 使用场景 |
|-----|-------|----------|
| `review.pageTitle` | 复盘 | 复盘页 Heading |
| `review.subtitleHint` | 以下为本地数据；导出与删除仅影响本机浏览器。 | 页眉下一行次要说明（可选） |
| `review.openReview` | 进入复盘 | 会话详情摘要卡、全文页链至 `/review/[takeId]` |
| `review.segmentJump` | 跳转播放 | 片段行可选 `aria-label`（有播放器时） |
| `review.pauseSectionTitle` | 停顿记录 | 侧栏标题 |
| `review.pauseRow` | {start}–{end} · 约 {duration} 秒 | 单行停顿 |
| `review.noPauses` | 本轮未记录长时间停顿 | 侧栏空 |
| `review.exportMd` | 导出 Markdown | 按钮 |
| `review.exportTxt` | 导出 TXT | 按钮 |
| `review.deleteTake` | 删除本轮 | Destructive outline |
| `review.deleteSession` | 删除整场会话 | 会话详情或复盘页危险区 |
| `ai.sectionTitle` | AI 复盘 | Chat 区标题 |
| `ai.disclosure` | 仅在你点击发送后上传文本上下文；录音不离开本机。 | Chat 区常驻小字 |
| `ai.inputPlaceholder` | 输入题目、答题要点或追问… | textarea |
| `ai.send` | 发送 | 主按钮 |
| `ai.loading` | 正在生成… | 助手占位 |
| `ai.error` | 请求失败，请检查网络或稍后重试。 | 内联错误 |
| `ai.consentRequired` | 请先阅读并同意上方说明后再使用 AI。 | 未同意时禁用发送 |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable |

---

## Screens & Components

### 1. 复盘页（主壳）

- **路由：** `/session/[id]/review/[takeId]`（D-01）。  
- **顶栏：** `Heading` + `review.subtitleHint`（14px #64748B 类）；右侧工具：`exportMd`、`exportTxt`（outline 或 text按钮，`gap: sm`）；`返回会话` Accent 文字链或次要实心按钮。  
- **删除本轮：**顶栏或页底 **危险区**（`border-t border-slate-200`，`padding-top: lg`），`deleteTake` Destructive outline，`min-h: 44px`。  
- **数据：** `sessionId`、`takeId` 合法；无会话404 壳与 Phase 1 一致。

### 2. 媒体播放器

- **条件：** 当 `transcriptionJobs` 该 `takeId` 存在 `audioBlob` 且 mime 可播（video/webm、audio/webm 等）时展示 `<video>` 或 `<audio>`，`rounded-lg`，`w-full`，原生 `controls`。  
- **Object URL：** 页面 `useEffect` 创建，`cleanup` revoke。  
- **与片段联动：** 点击某转写行 → `media.currentTime = start_ms / 1000`（clamp）；可选：播放中 `timeupdate` 高亮当前片段（Claude discretion，不破坏无播放器时的只读列表）。

### 3. 转写片段列表（可交互）

- **视觉：** 与 `03-UI-SPEC`全文列表一致（时间列 + 正文 + 行间细分割条规则）。  
- **交互：** 有播放器时整行 `cursor-pointer`，`hover:bg-slate-50`；**选中/播放中** 行左侧 **4px Accent** 竖条或 `bg-blue-50/50`。  
- **无播放器：** 列表只读，无 hover 强提示（与 03 对齐）。

### 4. 停顿列表

- **容器：** Secondary 表面，`padding: lg`，内部 `space-y: sm`。  
- **行：** `pauseRow`；可按 `start_ms` 升序；点击行若有播放器则 `currentTime = start_ms/1000`（与 REVI-01 一致）。  
- **空：** `noPauses` Body 次要色。

### 5. AI复盘 · Chat UI

- **布局：** 卡片 `min-h: 280px`，`max-h: 50vh`（桌面），内部 **可滚动** 消息区 +底部固定输入条（`padding: md`，`gap: sm`）。  
- **同意门闸：** 首次进入或 `localStorage` 未标记同意时：在输入区上方展示 **checkbox** 或 **横幅**「同意并继续」+ `consentRequired`；未同意则 `send` disabled。  
- **消息：** 用户右对齐浅灰底气泡；助手左对齐白底+左边框；**引用转写** 用缩进引用样式（REVI-03）。  
- **发送：** 主按钮 Accent；loading 时按钮 disabled + `ai.loading` 小行于助手侧。  
- **隐私：** `ai.disclosure` 永久小字在输入框上方（12px 或 Label 降级色）。

### 6. 导出- **行为：** 客户端组装字符串 →触发下载（与 `saveRecordingToDisk` 模式一致：`showSaveFilePicker` 优先，否则 `<a download>`）。  
- **文件名建议：** `gic-review-{sessionShort}-{takeShort}.md` / `.txt`。  
- **内容：** 以转写分段为主（D-04）；可选页眉一行会话名 + 日期（Claude discretion）。

### 7. 删除（PRIV-01）

- **入口：** 「删除本轮」在复盘页；「删除整场会话」在**会话详情**危险区（避免误触）。  
- **交互：** 必须 **二次确认**（`window.confirm` 或极简 Modal，与 03 重新转写策略一致）。  
- **成功后：** Toast 或内联「已删除」→ 跳转首页或会话列表；删会话后历史列表无该条。

### 8. 与全文转写页关系

- **全文页** `/transcript/[takeId]`：保留只读；增加主链或次链 **「进入复盘」** → `review.openReview`。  
- **不在此契约强制** 全文页重定向至复盘（避免破坏书签）；由 planner 二选一默认。

---

## Accessibility & Motion

- 播放器、可点击片段：`role="button"` 或原生 `<button>` 包裹时间+摘要（实现择一）。  
- Chat 输入：`label`  visually hidden 或 `aria-label`。  
- 尊重 `prefers-reduced-motion`：高亮动画可降级为无 transition。

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS（zh-CN 表 + 同意/删除明确）
- [x] Dimension 2 Visuals: PASS（层级、复盘布局、Chat 区）
- [x] Dimension 3 Color: PASS（Destructive 仅删与确认）
- [x] Dimension 4 Typography: PASS（与 01/03 对齐）
- [x] Dimension 5 Spacing: PASS（token 一致）
- [x] Dimension 6 Registry Safety: PASS（无新 registry）

**Approval:** approved（2026-04-11，orchestrator 按 workflow 自检；若后续 `gsd-ui-review` 有 FLAG 再修订）

---

*Phase: 04-review-export · UI-SPEC 与 CONTEXT D-01～D-05 对齐*
