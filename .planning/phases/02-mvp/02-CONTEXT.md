# Phase 2: 排练页录制与停顿事件 MVP - Context

**Gathered:** 2026-04-10  
**Status:** Ready for planning

<domain>
## Phase Boundary

在排练页完成“背景 + 录制回放 + 停顿提示/记录 + 基础设置”的 MVP：默认本地处理，不上传。重点是**稳定录制（至少音频）**、**温和停顿提示**、**可复盘的停顿事件**、以及**背景素材（图片为主 + 预置1个小视频循环）**与**设置抽屉**。不做 STT（语音转文字）与基于文字的停顿前后上下文（属于 Phase 3）。

</domain>

<decisions>
## Implementation Decisions

### 录制范围与默认值
- **D-01:** 默认录制：**音频 + 摄像头可选开启（opt-in）**。摄像头默认关闭，用户显式开启后再请求权限。
- **D-02:** 录制权限请求时机：点击“开始录制”才请求（渐进授权）。

### 背景素材（预置 + 上传）
- **D-03:** Phase 2 背景支持：**预置 2-3 张离线图片 + 用户上传图片 + 预置 1 个小视频循环**（视频不作为主路径）。
- **D-04:** 背景选择入口：放在排练页的设置抽屉中（见下文设置页）。

### 可拖拽预览窗（摄像头/录制预览）
- **D-05:** 预览窗默认位置：**底部中间**。
- **D-06:** 移动端策略：默认缩成小卡片/小圆点，可展开（避免遮挡主内容）。

### 停顿检测与提示
- **D-07:** 停顿检测主信号：**麦克风音量能量阈值 + 平滑**（先做 MVP；VAD 作为未来增强）。
- **D-08:** 停顿阈值默认 **5 秒**；用户可在设置里调整并可关闭提示。
- **D-09:** 提示风格：**温和提示（小条幅/渐隐），不打断操作**。

### 停顿事件记录（Phase 2 必做）
- **D-10:** 每次停顿事件至少记录字段：
  - `start_ms`：开始时间（相对录制起点）
  - `duration_ms`：持续时长
  - `threshold_ms`：当时阈值
  - `prompt_shown`：是否展示提示
  - `session_status`：当时会话状态（not_started / in_progress / ended）
- **D-11:** “停顿前后语音转写文本”暂不做（依赖 STT，推迟到 Phase 3）；Phase 2 只保证事件可用于回放跳转与统计。

### 设置（抽屉/弹层）
- **D-12:** 设置放在排练页右上角入口，打开**抽屉/弹层**，包含：
  - 停顿阈值（默认 5s）
  - 停顿提示开关
  - 背景来源选择（预置图片/预置视频/上传图片）
  - 摄像头开关（opt-in）

### Claude's Discretion
- 录制格式与分段策略（在满足回放与稳定性的前提下）
- 预览窗拖拽边界/吸附策略（不影响录制）
- 停顿提示出现频率与冷却时间（避免“越提示越焦虑”）

</decisions>

<specifics>
## Specific Ideas

- 背景优先“可用且稳”：图片是主路径，视频仅作为轻量增强（1 个小循环）。
- 停顿提示要像“鼓励提醒”，而不是“批改纠错”。

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & acceptance
- `.planning/ROADMAP.md` §Phase 2 — 目标与成功标准（录制稳定、预览窗可拖、停顿提示/记录、阈值可配）
- `.planning/REQUIREMENTS.md` — Phase 2 覆盖项：SCEN-01、SCEN-02、RECD-01..04、PAUS-01..03、SETT-01

### Existing decisions
- `.planning/PROJECT.md` — 默认本地处理/不上传约束
- `.planning/STATE.md` — 风险提示（iOS Safari、性能抖动、停顿误报）

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/_lib/sessionRepo.ts`: 已有本地会话与状态更新，可作为“排练页与会话绑定”的数据入口
- `src/app/_ui/*`: 现有按钮/徽标/列表行风格可复用到排练页控制台与设置抽屉

### Established Patterns
- Tailwind + token 化的 spacing/typography（见 `01-UI-SPEC.md`），适合作为 Phase 2 的基础一致性约束

### Integration Points
- `/session/[id]`：建议把“排练页”挂在会话详情中（Phase 2 规划时定路由/组件拆分）

</code_context>

<deferred>
## Deferred Ideas

- 停顿前后语音转写文本（依赖 STT）—— Phase 3
- 更强的 VAD / 多信号融合—— Phase 2 之后再增强

</deferred>

---

*Phase: 02-mvp*
*Context gathered: 2026-04-10*
