# Phase 3: 本地转写管线（可插拔引擎）- Context

**Gathered:** 2026-04-11  
**Status:** Ready for planning

<domain>
## Phase Boundary

将练习语音**转写为带时间信息的文本**，与**会话（及排练产出）关联并本地持久化**；引擎**可插拔**；**默认不上传**、且存在**不依赖公网转写**的默认路径（满足 STT-03 与断网成功标准）。本阶段**不**实现完整复盘页（REVI-*）、一键删全量（PRIV-01）、导出（PRIV-03）——属 Phase 4+。

**语言范围（用户锁定）：** 语音可能为**中文、英文、中英混合**；v1 采用**单一多语识别路径**（非「中/英两条互斥管线」）。**方言（如粤语）**明确不在 Phase 3 范围。

</domain>

<decisions>
## Implementation Decisions

### 引擎与离线策略
- **D-01:** 默认转写路径为**浏览器内离线**能力（**WASM 类多语 ASR**，Whisper 系能力为方向性参考）；**不得**将「静默走公网 API 的转写」作为默认或唯一路径。
- **D-02:** 抽象 **`TranscriptionEngine`（或等价）** 接口：输入为「与一次排练关联的音频引用/ Blob URL」、输出为「带时间片的文本流/最终结果」；便于后续换引擎而不改会话模型。
- **D-03:** 若未来增加「用户显式勾选的上传/云端引擎」，须**独立阶段/独立 REQ**，且不得回溯为 Phase 3 默认。

### 触发与进度 UX
- **D-04:** 用户**结束录制**后，对本次可用音频**自动入队转写**（后台或异步任务队列，不阻塞主线程交互底线由 planner 细化）。
- **D-05:** 提供**「重新转写」**（同一段音频再次跑引擎，覆盖或版本策略由 planner 定一种并写清）。
- **D-06:** 失败时：**非阻塞提示**（toast 或等价）+ **可重试**；不静默丢失败。
- **D-07:** 是否在设置中提供「关闭自动转写」以省资源：**Claude’s discretion**（若做，必须默认开启自动转写以符合「完成练习后系统能生成」的成功标准语义）。

### 时间信息与与停顿对齐
- **D-08:** 转写片段时间粒度：**句级或短分段**（目标 **≤10s 量级** 的可定位片；若引擎只给段落则合并为少段 + 近似时间边界，但须暴露 `start_ms`/`end_ms`）。
- **D-09:** 所有时间戳与 **Phase 2 `pauseEvents` 一致**：**相对同一次录制的起点**（与 `start_ms` 定义同源），便于 Phase 4 跳转与引用。

### 存储与可见入口（Phase 3 最小 UI）
- **D-10:** 使用 **Dexie 新表/新 version** 持久化：转写**分片/段落** + **任务状态**（排队中/进行中/成功/失败）+ 与 **`sessionId` 及排练轮次标识**（可与录制 Blob URL、mime、录制结束时间等关联键；具体键设计由 planner 定）。
- **D-11:** **会话详情页**（或已存在的会话主入口）展示：**最近一次（或列表中可选一次）排练转写摘要** + 链到**最小只读「全文转写」视图**；**不**在本阶段实现完整复盘布局（REVI-01 的完整体验属 Phase 4）。

### 语言与方言边界
- **D-12:** v1 支持**中文、英文、中英混合**；采用 **单一多语离线引擎路径**。**粤语等方言专链**不在 Phase 3。

### Claude's Discretion
- 具体 WASM 包体拆分/懒加载、Worker 布局、与 `MediaRecorder` 产出格式的解码路径
- 队列并发度、重试退避、磁盘占用提示
- 「关闭自动转写」开关是否出现及文案层级

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope & requirements
- `.planning/ROADMAP.md` — §Phase 3：目标、成功标准、Depends on Phase 2
- `.planning/REQUIREMENTS.md` — **STT-01**, **STT-02**, **STT-03**

### Privacy & product constraints
- `.planning/PROJECT.md` — 默认本地处理、不上传

### Prior phase constraints (recording & pause timeline)
- `.planning/phases/02-mvp/02-CONTEXT.md` — 停顿事件字段 **D-10**；**D-11** 停顿前后转写文本推迟至 STT（本阶段承接时间对齐，不承诺停顿语义前后句级拼接）

### Code integration (read before schema work)
- `src/app/_lib/db.ts` — Dexie `AppDB` 版本演进模式
- `src/app/_lib/sessionRepo.ts` — 会话读写
- `src/app/session/[id]/rehearsal/_lib/rehearsalRepo.ts` — 排练侧持久化模式
- `src/app/session/[id]/rehearsal/_lib/rehearsalTypes.ts` — `PauseEventRow` 等字段惯例

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Dexie `AppDB`（`src/app/_lib/db.ts`）**：以新版本 stores 增加 `transcripts` / `transcriptionJobs`（名称由 planner 最终定）与索引。
- **会话与排练数据流**：`sessionRepo`、`rehearsalRepo`、排练页录制结束已有 `StopRecordingResult`（含 `blob`/`url`/`mimeType`/`kind`）— 转写任务入参宜绑定该次产物。

### Established Patterns
- Zod schema + repo 容错与默认回退（排练设置、停顿事件已采用）。
- 本地优先：无服务端假设。

### Integration Points
- **排练页**：结束录制成功后 enqueue 转写（与现有 `playback` / `liveStream` 清理时序协调）。
- **会话详情路由**（`src/app/session/[id]/` 下现有布局）：挂载摘要与只读全文入口。

</code_context>

<specifics>
## Specific Ideas

- 用户明确要求：**中文、英文、中英混合** 均需可用；采用**单一多语模型**策略以降低维护成本。
- 用户确认：**整体采纳** discuss-phase 上拟定的引擎/触发/时间轴/存储与可见入口方案。

</specifics>

<deferred>
## Deferred Ideas

- 公网或「用户显式同意」的云端转写提供商集成 — 非 Phase 3 默认路径
- 粤语等方言专模型 — v1 不做
- 完整复盘页、导出、删除全量 — Phase 4 / PRIV（见 ROADMAP）

</deferred>

---

*Phase: 03-local-stt*  
*Context gathered: 2026-04-11*
