# Phase 1: 信任基线与会话骨架 - Context

**Gathered:** 2026-04-10  
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

### Claude's Discretion
- 引导页文案与布局密度（在不改变上述信息架构的前提下）
- 历史列表的默认排序（如按创建时间倒序）
- “备注/名称”的录入方式（创建时填写 vs 创建后编辑），以最少打断为准

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

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- （暂无：当前仓库还未初始化应用代码）

### Established Patterns
- （暂无）

### Integration Points
- （暂无）

</code_context>

<deferred>
## Deferred Ideas

- “一键清空所有历史/存储占用面板”——更适合与删除/导出一起在 Phase 4 统一完成。

</deferred>

---

*Phase: 01-trust-baseline*
*Context gathered: 2026-04-10*
