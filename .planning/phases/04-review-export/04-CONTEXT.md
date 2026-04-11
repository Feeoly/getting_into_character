# Phase 4: 复盘闭环 + 导出/删除 - Context

**Gathered:** 2026-04-11  
**Status:** Ready for planning

<domain>
## Phase Boundary

用户可基于**转写与停顿**在同一视图内复盘（含可选媒体跳转），可**导出**答题/转写文本，可**删除**敏感数据；AI 复盘建议按下文边界实现。范围以 ROADMAP Phase 4 与 REVI-* / PRIV-* 为准，不扩展到 Phase 5 角色卡差异化。

</domain>

<decisions>
## Implementation Decisions

### 复盘入口与路由
- **D-01:** 使用**独立路由** **`/session/[id]/review/[takeId]`** 作为复盘主界面（播放器 + 转写 + 停顿同屏等在此聚合）。现有 **`/session/[id]/transcript/[takeId]`** 可保留为「全文转写」入口或通过链接/重定向汇入复盘页（具体由 planner 定一种，避免双维护两套完整布局）。

### 停顿与轮次（take）
- **D-02:** 在 **`pauseEvents` 中增加 `takeId`**，写入排练页停顿逻辑时绑定**当前这轮录制**的 `takeId`（与 `StopRecordingResult.takeId` 同源）。需要 **Dexie 版本迁移**（新索引/字段），保证多轮同会话复盘时停顿列表不与其它轮混淆。与 Phase 3 **D-09**（时间相对录制起点）一致，**时间轴仍用 `start_ms`/`duration_ms` 相对该轮起点**。

### 删除范围（PRIV-01）
- **D-03:** **同时支持**  
  - **删除整场会话**：级联删除该 `sessionId` 下会话行、排练设置、上传背景、**所有** `pauseEvents`、**所有** `transcriptionJobs` / `transcriptSegments`、以及 Phase 4 将引入的**建议/草稿**等扩展表（若有）。  
  - **删除单轮 take**：仅删除该 `takeId` 对应的转写 job/segments、**该 takeId 的** `pauseEvents`，**不**删除会话本身与其它轮数据（除非 planner 定义「最后一轮删除后是否空会话」策略，默认保留会话壳）。

### 导出（PRIV-03）
- **D-04:** Phase 4导出内容以**转写分段文本**为主（**txt 与 markdown** 两种格式即可）。**不**强制在 MVP 导出中附带停顿事件表（若实现成本低可列为 Claude discretion增强项）。

### AI 复盘（REVI-02 / REVI-03）
- **D-05:** 用户确认**可以使用类 Chat 的云端能力**生成建议。须与 **PROJECT.md 默认本地**一致：**录音/转写默认仍本地存储**；**仅在用户主动触发「生成建议」且通过明确同意/配置**时，将**题目、答案（用户输入）、节选转写/停顿引用**发往选定模型服务。不得静默上传全文录音。输出须包含 **可执行改进点 + 示例句式**，并**引用转写片段或停顿事件**作为依据（结构可由 planner 定 schema/UI）。具体对接方式（BYOK、服务端代理、模型选型）由 **plan-phase / RESEARCH** 细化。

### AI 复盘 · 技术栈与百炼 Coding Plan（BYOK）
- **D-06:** 复盘侧采用 **Chat UI**（消息列表 + 输入区 + 可选流式输出），与 `04-UI-SPEC` §5 一致。模型接入由用户提供 **百炼（Bailian）Coding Plan** 的 **Base URL** 与 **API Key**（BYOK），应用**不**把 Key 下发到浏览器。
- **推荐栈（与现有 Next 16 一致）：**
  - **前端：** React Client Component；自绘消息气泡与滚动区（无需额外 Chat框架即可满足契约）；若需流式，助手侧用 **`fetch` + `ReadableStream`**（或 EventSource，视百炼响应格式）增量更新最后一条助手消息。
  - **服务端：** Next.js **App Router Route Handler**（例如 `src/app/api/review/chat/route.ts`）作为**唯一**出站调用点：`Authorization: Bearer <API_KEY>`，请求体为 **OpenAI 兼容**的 `chat/completions` 形态（`messages: [{role, content}, …]`）。具体 path（常见为兼容模式下的 `/chat/completions`）**以百炼控制台对 Coding Plan 给出的 OpenAI 兼容文档为准**。
  - **环境变量（命名建议，实现时可微调）：** `BAILIAN_BASE_URL`（或 `OPENAI_COMPAT_BASE_URL`，含协议与版本前缀、**无**末尾多余斜杠冲突由实现统一 trim）、`BAILIAN_API_KEY`；可选 `BAILIAN_CHAT_MODEL`（模型 ID 字符串，与控制台可用模型一致）。本地开发写入 **`.env.local`**（勿提交仓库）。
- **边界：** 发往百炼的 payload **仅为** D-05 允许的文本上下文（题目、作答、转写/停顿摘录）；**不**上传音频 Blob、不附带录音文件 URL。

### Claude's Discretion
- 复盘页布局（左右分栏 vs 上下）、播放器控件与无障碍细节  
- 单 take 删除后会话详情/首页列表的展示与空状态  
- 导出 md 的标题层级与是否带会话元数据行  
- 若导出附带停顿表为低成本附加，可纳入首版或 4.x 小版本  

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope & requirements
- `.planning/ROADMAP.md` — §Phase 4：目标、成功标准、Depends on Phase 3  
- `.planning/REQUIREMENTS.md` — **REVI-01**, **REVI-02**, **REVI-03**, **PRIV-01**, **PRIV-03**

### Privacy & product
- `.planning/PROJECT.md` — 默认本地处理、不上传；与 D-05 云端建议的触发边界  

### Prior phase constraints
- `.planning/phases/03-local-stt/03-CONTEXT.md` — 转写存储、时间轴与停顿对齐（D-08/D-09）  
- `.planning/phases/02-mvp/02-CONTEXT.md` — 停顿事件字段与排练设置（若与 Phase 2 文档不一致，以代码 `rehearsalTypes.ts` 为准）

### Code integration

- `src/app/_lib/db.ts` — Dexie版本演进  
- `src/app/session/[id]/rehearsal/page.tsx` — `recordingEpochStartMs`、`addPauseEvent`、takeId 来源  
- `src/app/session/[id]/rehearsal/_lib/rehearsalTypes.ts` — `PauseEvent` / `PAUSE_EVENT_SCHEMA`  
- `src/app/session/[id]/rehearsal/_lib/rehearsalRepo.ts` — `addPauseEvent`、`listPauseEvents`  
- `src/app/session/[id]/rehearsal/_lib/transcription/transcriptRepo.ts` — segments / jobs 按 session、take  
- `src/app/session/[id]/transcript/[takeId]/page.tsx` — 现有全文转写入口  
- `src/app/_lib/sessionRepo.ts` — 会话删除扩展点  

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **全文转写页**：`listSegmentsForTake`、`fmt` 时间格式、重试转写逻辑可复用或迁入复盘子组件  
- **`saveRecordingToDisk.ts`**：导出文件的用户落盘模式可参考（导出转写为文本下载）  
- **`TranscriptSummaryCard`**：会话详情入口可增链至 `/review/[takeId]`  

### Established Patterns
- Zod + Dexie repo；客户端 `"use client"` 页面  
- 本地优先：删除/导出均在浏览器完成，无服务端强依赖（AI 若走 API 则为例外路径）  

### Integration Points
- 排练页：`stopRecording` 后已有 `takeId`；停顿结束写库时需传入当前轮 `takeId`（需在状态中保存「当前录制 takeId」，或在 `onPauseEnd` 闭包内可读）  
- 新路由 `review/[takeId]` 与 `session/[id]` 布局一致  

</code_context>

<specifics>
## Specific Ideas

- 用户口头确认 AI 侧「可以用 Chat」类能力 →落地为 D-05 显式同意下的云端生成，不与默认本地隐私冲突。  
- 用户指定 **百炼 Coding Plan**，自行提供 **Base URL + API Key** → 落地为 **D-06** 服务端代理 + BYOK 环境变量。  

</specifics>

<deferred>
## Deferred Ideas

- Phase 5：角色卡差异化、朗读模式等 — 不在 Phase 4 讨论范围。  
- 导出内容扩展：完整停顿 CSV、连同媒体一并打包 — 未列入 D-04 MVP。  

### Reviewed Todos (not folded)
- （`todo match-phase 4` 无匹配项）  

</deferred>

---

*Phase: 04-review-export*  
*Context gathered: 2026-04-11*
