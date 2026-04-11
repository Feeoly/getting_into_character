# Phase 1: 信任基线与会话骨架 - Context

**Gathered:** 2026-04-11（导航决策增补）  
**Status:** Ready for planning

<domain>
## Phase Boundary

在“默认本地处理、不上传”的前提下，完成会话创建/管理骨架与状态可见性：提供引导入口、会话列表与基础状态（未开始/进行中/已结束），并在 UI 中清晰呈现隐私说明。**不实现录制/转写/复盘**（这些属于后续 Phase）。

</domain>

<decisions>
## Implementation Decisions

### 信息架构（入口/列表）
- **D-01:** Phase 1 首页采用**介绍/引导页**作为第一屏，再进入“新建会话”（而不是直接把新建置顶）。
- **D-02:** 历史会话列表展示字段：**场景**、**创建时间**、**状态（未开始/进行中/已结束）**。
- **D-03:** 历史列表预留两列（可先显示 `—` 或隐藏值）：**时长**（Phase 1 先占位，后续录制/练习后补齐）与**备注/名称**。

### 本地优先/隐私信任
- **D-04:** 隐私说明采用**贴近关键动作的内联提示**（例如“开始/新建”按钮附近），不做顶部常驻 banner、不做首次弹窗打断。

### 本地数据保存策略
- **D-05:** 默认**永久本地保留**会话记录；用户后续可手动删除（删除能力在 Phase 4 实现）。
- **D-06:** Phase 1 **不提供“一键清空所有历史”**入口（避免引入额外 UX/风险；未来如需要可在 Phase 4/设置页加入）。

### 全站导航层级与用语（跨路由一致）
- **D-07 信息层级：** **`/` = 首页**（引导 + 历史列表）；**`/session/[id]` = 会话详情**（单场排练的“枢纽”）；其下为子流程：**排练** `/rehearsal`、**复盘** `/review/[takeId]`、**全文转写** `/transcript/[takeId]`、**角色朗读** `/role/read`、**新建会话** `/session/new`。下游实现与文案不得把「历史列表」与「首页」混为不同根目标——返回应用根统一指向 `/`。
- **D-08 「返回首页」：** 统一文案 **`返回首页`**，目标 **`/`**。凡 **非首页**、且非极简错误占位页以外的常规内容页，必须在 **首屏可见的页面顶部信息区**（标题上方一行或标题行内左侧/同行）提供至少一处该链；**不得**把「返回首页」作为离开页面的 **唯一** 入口放在长内容之后的页面最底（避免必须滚过危险区/长卡片才看得到）。底部可保留次要文字链或移除与顶部重复的大按钮，以顶部为准。
- **D-09 「返回会话」：** 从 **任一会话的子路由** 回到该场会话的详情页时，统一文案 **`返回会话`**，目标 **`/session/{id}`**（与 `review.backToSession` 等现有 copy 对齐）。子路由包括：排练、复盘、全文转写、角色朗读等。
- **D-10 视觉权重：** 「返回首页」「返回会话」默认使用 **次要文字链**（或同级 outline按钮），主色实心按钮保留给 **当前页首要任务**（如「进入排练」「导出」）。新建会话页、会话详情页底部若已有顶部「返回首页」，则底部 **PrimaryButton 式** 的「返回首页」为可选重复，实现时可移除或改为文字链以免抢主操作。
- **D-11 错误/空态：** 会话不存在、无效 `takeId`、缺少角色卡等 **短页错误态** 可仅在卡片内保留「返回首页」；若上下文中仍有合法 `sessionId`，可增加「返回会话」链（与 D-09 一致）。

### Claude's Discretion
- 引导页文案与布局密度（在不改变上述信息架构的前提下）
- 历史列表的默认排序（如按创建时间倒序）
- “备注/名称”的录入方式（创建时填写 vs 创建后编辑），以最少打断为准
- 顶部导航行的具体排版（左对齐「← 返回首页」 vs 标题同行右侧）、是否引入未来全局顶栏/面包屑

</decisions>

<specifics>
## Specific Ideas

- 引导页的核心要点应围绕“**你在扮演角色，不是评价你本人**”与“**默认本地处理，不上传**”，减少紧张与不安全感。

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & acceptance
- `.planning/ROADMAP.md` §Phase 1 — 目标与成功标准（状态可见/断网可用/隐私说明可见）
- `.planning/REQUIREMENTS.md` — Phase 1 覆盖项：ENTR-01、ENTR-02、ENTR-03、PRIV-02

### Project constraints
- `.planning/PROJECT.md` — Core Value 与“默认本地处理/不上传”等约束
- `.planning/STATE.md` — 当前阶段与风险提醒

### 导航与 UI 文案（实现时对齐）
- `src/app/session/[id]/rehearsal/_lib/transcription/sttCopy.ts` — `review.backToSession` 等与复盘/转写相关 copy

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/_ui/PrimaryButton.tsx` — 首页/返回类链；按 D-10 应对「返回首页」降级为文字链时可复用或并列新增轻量 `Link` 样式

### Established Patterns
- 子页已有「返回会话」：`src/app/session/[id]/rehearsal/page.tsx`、复盘 header `review.backToSession`、`transcript/[takeId]/page.tsx` 等
- 会话详情与新建会话底部仍有 `PrimaryButton`式「返回首页」：`src/app/session/[id]/page.tsx`、`src/app/session/new/page.tsx`

### Integration Points
- Next.js App Router：`src/app/page.tsx`（首页）、`src/app/session/**` — 导航改动需跨路由统一 D-07～D-11

</code_context>

<deferred>
## Deferred Ideas

- “一键清空所有历史/存储占用面板”——更适合与删除/导出一起在 Phase 4 统一完成。

</deferred>

---

*Phase: 01-trust-baseline*
*Context gathered: 2026-04-11*
