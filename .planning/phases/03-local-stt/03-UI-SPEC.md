---
phase: 03
slug: local-stt
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-11
---

# Phase 03 — UI Design Contract（本地转写管线）

> 视觉与交互契约；与 Phase 01 设计系统一致。来源：`03-CONTEXT.md`、`03-RESEARCH.md`、`REQUIREMENTS.md`（STT-01～03）、`01-UI-SPEC.md`。

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none（与 Phase 01 一致：`package.json` 无 shadcn；无 `components.json`） |
| Preset | not applicable |
| Component library | radix *（未来若引入 shadcn 时沿用 Phase 01 约定）* |
| Icon library | lucide-react *（同上）* |
| Font | system-ui（fallback stack）；首选 Inter 延后统一加载 |

---

## Visual Hierarchy（Phase 3）

**会话详情页：** 排练/会话主信息块优先 → **转写摘要卡片**（次级白底容器）→ 其他 Phase 1/2 已有模块。  
**全文转写（只读）：** 页眉标题 + 可选轻量说明 → **按时间排序的片段列表**（主阅读区）→ 底部或顶栏次要操作（如「重新转写」若展示）。  
**焦点：** 摘要内 1 行状态 + 2～3 行摘抄；**不**用大号倒计时或红色脉冲制造紧迫感。

---

## Spacing Scale

与 Phase 01 完全一致（`01-UI-SPEC.md`）。

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | 图标与文字间距、行内 padding |
| sm | 8px | 紧凑组件间距 |
| md | 16px | 默认元素间距 |
| lg | 24px | 区块 padding |
| xl | 32px | 布局间隙 |
| 2xl | 48px | 大区块分隔 |
| 3xl | 64px | 页面级间距 |

**Exceptions：** 触摸目标高度仍通过 padding 保证 **≥44px**（非 spacing token 替代）。

---

## Typography

与 Phase 01 完全一致。

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 14px | 600 | 1.5 |
| Heading | 20px | 600 | 1.2 |
| Display | 28px | 600 | 1.2 |

**Phase 3 补充：** 时间戳列使用 **Label** 样式（14px / 600），`tabular-nums` 数字等宽（CSS）；片段正文用 **Body**。

---

## Color

与 Phase 01 色板与 60/30/10 分工一致。

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #F8FAFC | 应用背景、默认表面 |
| Secondary (30%) | #FFFFFF | 卡片、列表行、转写摘要容器、片段行背景 |
| Accent (10%) | #2563EB | 主链、进行中点缀、焦点环 |
| Destructive | #DC2626 | 仅破坏性操作与严重错误强调（本阶段以 toast 内「重试」旁的错误色点缀为限，避免整屏红） |

**Accent reserved for：** 主 CTA/主文字链（如「查看全文转写」）；当前选中的排练轮次或 Tab；键盘焦点环；任务状态 **进行中** 的小号图标或左侧 3px 条（禁止大块铺色）；toast 内「重试」按钮可用 outline/ghost + accent 边框。

**Destructive：** 不用于「转写失败」整卡背景；失败态以中性表面 + 文案 + 可选小图标为主，**#DC2626** 仅用于需要用户警惕的短标签或图标（若与 Phase 4 删除对齐时再扩展）。

---

## Copywriting Contract（zh-CN）

| Element | Copy |
|---------|------|
| Primary CTA | 查看全文转写 |
| Empty state heading | 暂无转写 |
| Empty state body | 结束录制后将自动在本地生成转写。若刚结束录制，请稍候；仍无结果可尝试「重新转写」。 |
| Error state（持久/内联区） | 转写未成功。可点击下方重试，或返回会话稍后查看。 |
| Destructive confirmation | **重新转写（覆盖策略）：** 将用当前音频重新生成转写并**替换**已有全文与摘要。确定继续？ — 取消 / 继续转写  *（若 planner 采用版本保留策略而非覆盖，则本确认不出现，仅 toast 失败重试）* |

---

## Phase 3 文案表（用户可见字符串）

| Key | zh-CN | 使用场景 |
|-----|-------|----------|
| `stt.sectionTitle` | 转写 | 会话详情摘要卡片标题 |
| `stt.summaryLoading` | 正在生成转写… | 任务 queued / processing 且尚无片段 |
| `stt.summaryPreview` | {snippet} | 摘要正文（截断至约 120～160 字，省略号） |
| `stt.viewFull` | 查看全文转写 | 进入只读全文页的主链/按钮 |
| `stt.jobQueued` | 排队中 | 任务状态徽标 |
| `stt.jobProcessing` | 转写中 | 任务状态徽标 |
| `stt.jobSucceeded` | 已完成 | 任务状态徽标 |
| `stt.jobFailed` | 失败 | 任务状态徽标 |
| `stt.timestampFormat` | {mm}:{ss} | 列表左侧 `start_ms` 相对录制起点展示（同一轮 `take` 内 0 起算） |
| `stt.segmentFallback` | （无文本） | 某片段 text 为空占位 |
| `stt.fullPageTitle` | 全文转写 | 只读页标题 |
| `stt.fullPageHint` | 以下为本地生成的文本，默认不会上传。 | 只读页可选一行说明（次要 Body 色 #64748B 类中性灰，仍属 secondary 文字层级） |
| `stt.emptyFull` | 该轮排练尚无转写段落。 | 全文页无 segments |
| `stt.retranscribe` | 重新转写 | 可选次要按钮（outline） |
| `stt.initModel` | 正在准备离线识别… | WASM/模型首次加载，非模态条 |
| `stt.initModelSub` | 首次使用可能需数十秒，可离开本页，完成后在会话中查看。 | 副文案，降低焦虑 |
| `stt.toastFailTitle` | 转写失败 | Toast 标题 |
| `stt.toastFailBody` | 本地识别未成功，录音仍保留。 | Toast 正文 |
| `stt.toastRetry` | 重试 | Toast 操作 |
| `stt.toastDismiss` | 关闭 | Toast 关闭 |
| `stt.inlineRetry` | 重试转写 | 摘要区内联次要按钮（与 toast 二选一或并存由实现定，至少一条重试路径） |

**注：** 英文 UI 不在本阶段范围；引擎 log 不落用户可见串之外的新品牌名。

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable |

---

## Screens & Components

### 1. 会话详情页 · 转写摘要卡片

- **布局：** Secondary 表面卡片，`padding: lg`，内部 `md` 垂直栈。首行：Heading「转写」+ 右侧状态徽标（Label 字号）。次区：Body 摘要或 `summaryLoading`。末行：主链「查看全文转写」（Accent 文字按钮样式，非实心大块）。
- **数据：** 绑定「最近一次成功转写」或当前选中排练轮次（若 D-11 实现轮次选择器则展示 Label + select；最小实现可为仅最近一轮）。
- **交互：** 点击「查看全文转写」→ 导航至只读全文路由或同级抽屉（实现任选，须深链可书签/刷新可恢复会话维度）。
- **状态：** `queued` / `processing` → 显示 `summaryLoading` + 非确定性细进度条（indeterminate，`h-1`，Accent 低透明度填充），**禁止**百分比假精确。`succeeded` → 摘抄 + `viewFull`。`failed` → `Error state` 文案 + `inlineRetry`。

### 2. 全文转写（只读）

- **布局：** 顶栏 `Heading` + 可选 `fullPageHint`（14px 次要色）。主体为片段列表：每行 **左侧** 时间戳列（固定宽 `72px`～`88px`，`tabular-nums`）+ **右侧** Body 文本，`padding-y: sm`，行间分隔 `1px` #E2E8F0（中性边，非 accent）。
- **时间：** 仅展示 **`start_ms` 相对本轮录制起点**（与 `pauseEvents.start_ms` 同源，见 D-09）；格式 `mm:ss`，不足补零。
- **交互：** 只读，无可编辑字段；可选未来 Phase 4 跳转回放，本阶段 **不**要求点击片段跳转播放器（若实现保留为 enhancement，不得破坏只读契约）。
- **空：** `emptyFull`。

### 3. 片段列表行（组件级）

- **结构：** `[时间] [text]`；`idx` 顺序升序。
- **过长文本：** 默认全展；若单条超 500 字可折叠「展开」*（Claude discretion，优先全展以降低交互噪音）*。

### 4. 任务状态徽标（queued / processing / succeeded / failed）

- **视觉：** Pill 或圆角标签，高度 ≥28px，`padding-x: md`。`queued`：中性灰描边 + 灰字。`processing`：Accent 左边条或左侧小圆点动画（**opacity 0.4→1 缓动 1.2s**，禁止旋转 loader 占半屏）。`succeeded`：中性绿灰可选 *（默认仍用中性深字 + 「已完成」避免新色 token）*。`failed`：Destructive 仅用于文字/图标，背景仍为白。
- **映射（实现枚举 ↔ 文案）：** `queued` → 排队中；`processing` → 转写中；`succeeded` → 已完成；`failed` → 失败。

### 5. 非阻塞失败 Toast + 重试

- **位置：** 视口一角（与 Phase 1/2 全局 toast 策略对齐；默认右下角或底部居中 **择一与现有一致**）。
- **行为：** `duration` ≥ 6s 或可手动关闭；**不**阻塞路由与点击。主操作「重试」触发同 `takeId` 重新入队（D-06）。
- **样式：** 白底 + 轻阴影，`md` padding；标题 Label weight，正文 Body。

### 6. 「重新转写」（可选控件，D-05）

- **位置：** 会话摘要卡片底部次要区，或全文页顶栏右侧 **outline** 按钮。
- **可见性：** 至少在一处可达；若音频仍可用则启用，否则 disabled + `title` 提示原因（短句 zh）。
- **确认：** 若产品策略为覆盖（见 Copywriting Destructive），弹出浏览器 `confirm` 或项目内极简 Modal（与 Phase 1 无 Modal 时可暂用 `confirm`，executor 与 checker 记录技术债）。

### 7. WASM / 模型初始化（轻量、低焦虑）

- **表现：** 排练页或首次触发引擎处：**一条** 顶部或底部 **非模态** 细条（`min-h: 40px`，Dominant 背景 + 左侧小静态图标 + `initModel` + `initModelSub`），**禁止**全屏 blocking spinner。
- **进度：** 无具体百分比时仅用 copy + 可选 indeterminate 条（同摘要卡片约定）。

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
