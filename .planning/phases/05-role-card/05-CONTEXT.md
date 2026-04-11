# Phase 5: 角色卡差异化 + 朗读模式 - Context

**Gathered:** 2026-04-11  
**Status:** Ready for planning

<domain>
## Phase Boundary

用户在**进入排练录制前**，能基于 **ROLE-01** 输入或选择**角色状态**与**触发物**，获得符合 **ROLE-02** 的**角色卡文本**（状态描述 + 可执行表达指令 + 禁忌），并在 **ROLE-03** **朗读模式**中完成「大声读出角色卡」的引导后，再进入既有排练流程。本阶段**不**扩展新面试类型模板，**不**将 Phase 4 复盘 AI 重做一遍；「证据锚定」在 v1 上指角色卡与禁忌**可被执行、可复述**，与 PROJECT 主张一致，**不**在本阶段强制改造复盘 Chat 的契约（若低成本可在 plan 中列为可选增强）。

</domain>

<decisions>
## Implementation Decisions

### 入口与信息架构

- **D-01:** 角色输入与生成放在 **会话详情页** `/session/[id]`：在「进入排练」主链之前增加 **「角色与触发物」** 区块（可折叠但默认展开首访）。用户可 **保存** 生成结果并进入 **朗读模式**；从朗读模式结束后再进入 **`/session/[id]/rehearsal`**。不在新建会话页强制收集角色（避免创建摩擦），但会话详情在首次进入时应有明确引导。
- **D-02:** **ROLE-01 字段：**  
  - **角色状态**：预设枚举（如：自信/侃侃而谈/冷静/沉稳）+ **自定义短文本**（可选；与预设二选一或叠加由 planner 定一种简单策略，避免表单过长）。  
  - **触发物**：短文本（如「一支笔」）+ 可选预设。提交前校验：触发物非空或选用预设；状态至少一项。

### 角色卡生成（本地优先）
- **D-03:** **v1 不依赖云端 LLM 生成角色卡**：使用 **固定中文模板** + 用户输入拼接生成 `cardText`，保证**离线可用**、与 **PROJECT.md 默认本地**一致。模板须显式产出三块标题：**状态描述**、**可执行表达指令**（条列）、**禁忌**（ROLE-02）。
- **D-04:** 生成内容 **持久化到 IndexedDB**：优先在 **`sessions` 表扩展字段**（如 `roleMood`, `roleTrigger`, `roleCardText`, `roleCardUpdatedAt`, `roleReadAloudCompletedAt`）并 **Dexie 版本迁移**；若 planner 倾向独立表，须仍按 `sessionId` 唯一关联且删除会话时级联清理（与 PRIV-01 一致）。

### 朗读模式（ROLE-03）
- **D-05:** **独立路由** **`/session/[id]/role/read`**（或等价单屏流程）：全屏或沉浸式卡片展示 **完整 `roleCardText`**（纯文本，禁止 HTML 注入路径），底部主按钮 **「我已完成朗读」**；点击后写入 **`roleReadAloudCompletedAt`** 并跳转排练页。可选次要按钮：**「听一遍」** 使用浏览器 **`speechSynthesis`**（需检测不支持时隐藏或提示），**不**作为验收必要条件。
- **D-06:** **未完成朗读是否阻塞排练：** **软阻塞** — 从会话详情「进入排练」时，若已有角色卡但未完成朗读，**一次**确认对话框提示「建议先完成朗读再录制」；用户仍可 **坚持进入**（与「温和信任」产品调性一致）。若尚无角色卡，可引导先填写（不强制硬编码拦截，由 planner 定默认：无卡时主按钮为「去准备角色」）。

### 与 Phase 4 的边界
- **D-07:** 复盘页 AI Chat **不**在本阶段强制注入「当前角色卡」上下文；若实现成本极低（读取同 session 字段拼一行 system 附加上下文），列为 **Claude's Discretion** 增强项，**非**成功标准必要条件。

### Claude's Discretion

- 预设枚举具体文案与顺序、折叠/动画、朗读页视觉层级（与 01/03 UI token 对齐）  
- `speechSynthesis` 语音选择与语速  
- 无角色卡时的空状态与 CTA 文案  
- 是否在排练页顶部展示一行「当前角色」摘要  

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope & requirements
- `.planning/ROADMAP.md` — §Phase 5：目标、成功标准、Depends on Phase 4  
- `.planning/REQUIREMENTS.md` — **ROLE-01**, **ROLE-02**, **ROLE-03**

### Privacy & product
- `.planning/PROJECT.md` — 角色卡结构主张、默认本地  
- `.planning/phases/04-review-export/04-CONTEXT.md` — D-05/D-06 云端边界（本阶段角色卡生成不走云端）

### Code integration
- `src/app/_lib/db.ts` — Dexie 版本演进  
- `src/app/_lib/sessionTypes.ts` / `sessionRepo.ts` — Session 模型与更新  
- `src/app/session/[id]/page.tsx` — 会话详情、排练入口  
- `src/app/session/[id]/rehearsal/page.tsx` — 排练主流程  

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **会话详情布局**：已有 `SessionMeta`、`TranscriptSummaryCard`、`PrimaryButton` — 可嵌入角色表单与状态提示。  
- **客户端路由**：`next/navigation`、本地优先表单模式与 Phase 1/2 一致。  
- **文案**：可新增 `roleCopy.ts` 或扩展现有 copy模块（zh-CN）。

### Established Patterns
- Zod + Dexie；`"use client"` 页面；删除会话级联已含 `sessions` — 扩展字段需在 `deleteSessionCascade` 中无额外工作（同表）或补充子表删除。

### Integration Points
- 新建 `read` 子路由 under `session/[id]/role/`；从详情 `Link` 跳转；朗读完成 → `rehearsal`。

</code_context>

<specifics>
## Specific Ideas

- 讨论阶段未逐项弹窗交互；灰色地带按 **本地模板生成 + 软阻塞朗读 + 可选 TTS** 收敛，便于与 PROJECT 隐私主张一致。  
- 若你希望 **必须读完才能录** 或 **角色卡也必须走百炼生成**，在 `/gsd-plan-phase 5` 前直接改 CONTEXT 对应条目即可。  

</specifics>

<deferred>
## Deferred Ideas

- **百炼 / LLM 生成角色卡**（BYOK）— 可作为后续小版本或 Phase 6。  
- **多面试类型模板** — ROADMAP Out of Scope。  
- **复盘 AI 强制「角色 + 证据」双锚定输出 schema** — 本阶段不强制；P4 Chat 已满足基础 REVI-03。  

### Reviewed Todos

- （未跑 `todo match-phase 5`）  

</deferred>

---

*Phase: 05-role-card*  
*Context gathered: 2026-04-11*
