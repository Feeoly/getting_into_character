# Phase 3：本地转写管线（可插拔引擎）- Research

**Researched:** 2026-04-11  
**Domain:** 浏览器端 WASM/ONNX 多语 ASR、Web Audio 解码、Dexie 持久化、Next.js 16 集成  
**Confidence:** MEDIUM（引擎与 API 以官方文档与 npm 为准；各浏览器对容器解码的差异需执行期矩阵验证）

<user_constraints>
## User Constraints（摘自 `03-CONTEXT.md`，规划必须遵守）

### Locked Decisions（实现决策）

**引擎与离线策略**

- **D-01：** 默认转写路径为**浏览器内离线**能力（**WASM 类多语 ASR**，Whisper 系能力为方向性参考）；**不得**将「静默走公网 API 的转写」作为默认或唯一路径。
- **D-02：** 抽象 **`TranscriptionEngine`（或等价）** 接口：输入为「与一次排练关联的音频引用/ Blob URL」、输出为「带时间片的文本流/最终结果」；便于后续换引擎而不改会话模型。
- **D-03：** 若未来增加「用户显式勾选的上传/云端引擎」，须**独立阶段/独立 REQ**，且不得回溯为 Phase 3 默认。

**触发与进度 UX**

- **D-04：** 用户**结束录制**后，对本次可用音频**自动入队转写**（后台或异步任务队列，不阻塞主线程交互底线由 planner 细化）。
- **D-05：** 提供**「重新转写」**（同一段音频再次跑引擎，覆盖或版本策略由 planner 定一种并写清）。
- **D-06：** 失败时：**非阻塞提示**（toast 或等价）+ **可重试**；不静默丢失败。
- **D-07：** 是否在设置中提供「关闭自动转写」以省资源：**Claude’s discretion**（若做，必须默认开启自动转写以符合「完成练习后系统能生成」的成功标准语义）。

**时间信息与与停顿对齐**

- **D-08：** 转写片段时间粒度：**句级或短分段**（目标 **≤10s 量级** 的可定位片；若引擎只给段落则合并为少段 + 近似时间边界，但须暴露 `start_ms`/`end_ms`）。
- **D-09：** 所有时间戳与 **Phase 2 `pauseEvents` 一致**：**相对同一次录制的起点**（与 `start_ms` 定义同源），便于 Phase 4 跳转与引用。

**存储与可见入口（Phase 3 最小 UI）**

- **D-10：** 使用 **Dexie 新表/新 version** 持久化：转写**分片/段落** + **任务状态**（排队中/进行中/成功/失败）+ 与 **`sessionId` 及排练轮次标识**（可与录制 Blob URL、mime、录制结束时间等关联键；具体键设计由 planner 定）。
- **D-11：** **会话详情页**（或已存在的会话主入口）展示：**最近一次（或列表中可选一次）排练转写摘要** + 链到**最小只读「全文转写」视图**；**不**在本阶段实现完整复盘布局（REVI-01 的完整体验属 Phase 4）。

**语言与方言边界**

- **D-12：** v1 支持**中文、英文、中英混合**；采用 **单一多语离线引擎路径**。**粤语等方言专链**不在 Phase 3。

### Claude's Discretion

- 具体 WASM 包体拆分/懒加载、Worker 布局、与 `MediaRecorder` 产出格式的解码路径
- 队列并发度、重试退避、磁盘占用提示
- 「关闭自动转写」开关是否出现及文案层级

### Deferred Ideas（OUT OF SCOPE）

- 公网或「用户显式同意」的云端转写提供商集成 — 非 Phase 3 默认路径
- 粤语等方言专模型 — v1 不做
- 完整复盘页、导出、删除全量 — Phase 4 / PRIV（见 ROADMAP）
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | 描述 | 研究如何支撑实现 |
|----|------|------------------|
| **STT-01** | 系统可将练习语音转写为文本并与会话关联保存 | `TranscriptionEngine` + Dexie 任务/分片表；排练 `StopRecordingResult` 绑定 `sessionId` + `takeId`；会话详情摘要入口 |
| **STT-02** | 转写文本包含基本时间信息（至少能定位到大致时间段/片段） | ASR `return_timestamps` / `chunks` → 归一化为 `start_ms`/`end_ms`（与 D-08、D-09 同源时间轴） |
| **STT-03** | 默认策略为本地处理/不上传（清晰说明且有可验证的行为约束） | 默认引擎在浏览器内 WASM/WebGPU 跑 ONNX；无默认远程 `fetch` 到第三方 STT；UI/隐私文案与网络面板验收项由 planner 写清 |
</phase_requirements>

## Summary（执行摘要）

Phase 3 的核心是：**在不上传的前提下**，把 Phase 2 已产出的 **MediaRecorder Blob** 异步送入**可替换的离线 ASR 引擎**，将结果以**与 `pauseEvents.start_ms` 同源的时间轴**写入 **Dexie**，并在**会话详情**提供摘要 + 只读全文。

技术选型上，**`@huggingface/transformers`（Transformers.js v4）+ Whisper 族 ONNX 模型**与 CONTEXT 的「WASM 多语、Whisper 系方向」一致：官方文档明确浏览器默认走 **ONNX Runtime + WASM CPU**，可选 **WebGPU**，并支持 **`dtype` 量化（WASM 默认 q8 等）**以降低带宽与内存压力 [CITED: https://huggingface.co/docs/transformers.js/main/en/index]。npm 上 **`@huggingface/transformers@4.0.1`** 为当前主线（2026-04-02 发布）**[VERIFIED: npm registry]**；旧包 **`@xenova/transformers@2.17.2`** 仍存但维护与体积均劣于新包（解压体积约 46MB vs 约 9.5MB）**[VERIFIED: npm registry `dist.unpackedSize`]**。

**Primary recommendation（给 planner 的一句话）：** 以 **`@huggingface/transformers` 的 `automatic-speech-recognition` pipeline + 量化多语 Whisper 模型** 为默认引擎实现 `TranscriptionEngine`，在 **Dedicated Worker** 中跑推理与解码；主线程负责入队、Dexie 写入与 UI；对 **WebM/Opus** 解码优先 **Web Audio（`decodeAudioData`）**，失败再评估 **ffmpeg.wasm** 兜底（重、慢，仅作最后手段）[CITED: `.cursor/rules/gsd.md` 嵌入 STACK 建议]。

## Project Constraints（来自 `.cursor/rules/gsd.md`）

以下为与本阶段相关的**可执行约束**（规划需对齐；若与 `03-CONTEXT.md` 冲突，以 **CONTEXT** 为准）：

- **隐私：** 默认本地处理、不上传（与 STT-03、D-01 一致）。
- **不推荐以 Web Speech API（SpeechRecognition）作为核心 STT：** 能力与支持度不可控，与「离线多语」目标冲突（规则内嵌 STACK 表）。
- **录制：** 当前代码以 **MediaRecorder** 为主路径（与 Phase 2 一致）；STACK 建议复杂转码优先评估 **WebCodecs**，**ffmpeg.wasm** 仅兜底。
- **GSD：** 大规模实现仍建议走 `/gsd-execute-phase` 等工作流，保持规划产物一致（规则「GSD Workflow Enforcement」）。

> **注意：** 嵌入 STACK 曾推荐 SQLite WASM；**本阶段 CONTEXT（D-10）锁定 Dexie**，本研究以 **Dexie 版本升级** 为存储方案。

## Standard Stack

### Core

| Library | Version（验证日） | 用途 | Why Standard |
|---------|-------------------|------|----------------|
| **dexie** | **4.4.2**（项目已锁定）**[VERIFIED: `package.json`]** | IndexedDB 抽象；任务与分片持久化 | 代码库已采用 `AppDB` 版本演进模式 |
| **@huggingface/transformers** | **4.0.1**（npm `time.modified` 2026-04-02）**[VERIFIED: npm registry]** | 浏览器内 ONNX ASR（Whisper 等） | 官方继任 Transformers.js；文档声明浏览器默认 WASM、可选 WebGPU [CITED: https://huggingface.co/docs/transformers.js/main/en/index] |
| **zod** | 4.3.6（项目已有）**[VERIFIED: `package.json`]** | 行数据校验（与 `rehearsalRepo` 模式一致） | 与现有排练/停顿 schema 一致 |

### Supporting（按需）

| Library | 用途 | When to Use |
|---------|------|-------------|
| **Web Audio API** | Blob → AudioBuffer → Float32Array @16kHz | 首选轻量解码路径 |
| **@ffmpeg/ffmpeg** | 容器/编解码兜底 | **仅当**目标浏览器无法解码录制 MIME 时 [CITED: `.cursor/rules/gsd.md`] |
| **wavefile**（或等价） | 若走文件头解析/PCM 工具链 | 主要在 Node/测试脚本；浏览器路径优先 Web Audio |

### Alternatives Considered（浏览器 WASM ASR：2～4 个现实选项）

| 方案 | 集成方式 | 包体 / 模型 | Worker 模型 | 多语 CN/EN/混合 | 备注 |
|------|----------|-------------|---------------|-----------------|------|
| **A. `@huggingface/transformers` + Whisper ONNX** | npm 依赖 + `import()` 懒加载 + Worker | npm 包约 **9.1MB** 解压（不含模型）；模型另从 Hub/自有 CDN 拉取，量化后常见 **数十～百余 MB 级**（视具体 checkpoint）**[VERIFIED: npm `dist.unpackedSize`；模型体积见各模型卡]** | **强烈推荐 Worker**：避免阻塞 UI；可配合 `OffscreenCanvas` 仅当需要图形类 pipeline 时使用 | **Whisper 多语**单路径可覆盖中英混合 [CITED: OpenAI Whisper 原始设计为多语；Transformers.js 文档示例使用 whisper 模型族] | **默认推荐**：与 D-01/D-02 契合、社区与文档活跃；需验证 **`return_timestamps`/`chunks`** 在目标版本上的行为 [MEDIUM: GitHub/社区讨论较多，见 Sources] |
| **B. whisper.cpp 官方 `examples/whisper.wasm`** | 自建 Emscripten 产物 + 静态资源部署；非单一 npm「开箱」 | WASM + `libmain.js` + worker；模型 **tiny/base/small** 等二进制需自管（README 给出量级）**[CITED: https://github.com/ggerganov/whisper.cpp/tree/master/examples/whisper.wasm]** | 自带 worker 线程文件 **`libmain.worker.js`** [CITED: 同上] | 多语同 Whisper | **控制力最强**、与产品 STACK 叙述一致；但 **Next 打包、资源路径、升级维护成本高**，适合作为 **第二引擎** 或后期优化 |
| **C. sherpa-onnx（WASM）** | 按官方文档 **自编译 WASM**；非纯 npm 即插即用 | 文档提供 **中英 / 中英粤** 等演示与 HF Space 链接 **（粤为 CONTEXT 明确 Phase 3 不做，仅说明能力边界）** **[CITED: https://k2-fsa.github.io/sherpa/onnx/wasm/index.html]** | 自建 worker 绑定 | **Paraformer / Zipformer** 对中文友好 [CITED: 官方 WASM 章节标题] | 适合 **强中文 ASR** 或可接受 **自建 WASM 发布管线** 的团队；与「Whisper 系方向参考」仍兼容为 **可插拔另一引擎** |
| **D. `@xenova/transformers`（旧包名）** | 与 A 相同 API 风格但包名旧 | 解压约 **46MB** **[VERIFIED: npm registry]** | 同 A | 同 A | **不推荐作新代码默认**：体积大、主线已迁移至 `@huggingface/transformers` [CITED: npm 包说明与 HF 文档示例使用新包名] |

**安装示例（仅规划参考）：**

```bash
npm install @huggingface/transformers
```

## Architecture Patterns

### 推荐目录结构（示意）

```
src/app/
├── _lib/
│   └── db.ts                    # AppDB version(n+1)：转写表
├── session/[id]/
│   ├── page.tsx                 # 会话详情：摘要 + 全文入口
│   └── rehearsal/
│       ├── page.tsx             # 录制结束 → enqueue（与 recordingEpoch 对齐）
│       ├── _lib/
│       │   ├── recording.ts     # StopRecordingResult 已有 blob/url/mime
│       │   └── transcription/ # 新建：engine 接口、队列、Dexie repo
│       └── _workers/            # 可选：next/static 或 public 旁路部署 worker 入口
```

### Pattern：`TranscriptionEngine`

**What：** 固定「输入音频引用 → 输出分片文本 + 时间」的边界，内部可换 ONNX/whisper.cpp/sherpa。  
**When：** 任何需要切换模型或厂商时，仅替换 engine 实现与资源加载。  
**Example（接口草图，非最终实现）：**

```typescript
// 新代码示意 — 与 CONTEXT D-02 对齐
export type TranscriptChunk = {
  start_ms: number;
  end_ms: number;
  text: string;
};

export type TranscriptionEngine = {
  /** 语言策略：v1 单一多语模型，参数可为 auto/zh/en */
  transcribe(input: { audioUrl: string; mimeType: string }): AsyncIterable<TranscriptChunk>;
};
```

### Anti-Patterns

- **在主线程加载大模型或跑整段长音频推理：** 易造成卡顿，违反 D-04「不阻塞交互」的精神。
- **把 Web Speech API 当默认引擎：** 与项目规则及离线默认路径冲突。
- **无版本迁移直接改 Dexie schema：** 须遵循现有 `version(n).stores({...})` 递增模式（见下节）。

## 音频管线：MediaRecorder Blobs → 引擎输入

### 现状（代码库）

- `StopRecordingResult` 含 **`blob` / `url` / `mimeType` / `kind`**，mime 由 `MediaRecorder` 决定，常见 **`audio/webm;codecs=opus`** 或 **Safari 的 `audio/mp4`** 等 **[VERIFIED: `recording.ts` 中 `pickBestMimeType` 候选列表]**。
- 排练页用 **`recordingEpochStartMs`** 与停顿检测对齐；停顿入库字段为 **`start_ms`（相对录制起点）** **[VERIFIED: `rehearsalTypes.ts` + `page.tsx` 逻辑]**。

### 推荐解码路径

1. **`fetch(blobUrl) → arrayBuffer → AudioContext.decodeAudioData`**（或 `webkitAudioContext`）：由浏览器原生解码器处理容器 **[CITED: MDN Web Audio；具体容器支持度因浏览器而异 — 需矩阵验证，标记为 MEDIUM]**。
2. **重采样为单声道 16kHz Float32Array：** Whisper 系通常期望 **16 kHz**（Transformers.js 文档示例明确）**[CITED: https://huggingface.co/docs/transformers.js/en/guides/node-audio-processing]**；浏览器内可用 **OfflineAudioContext** 或 AudioWorklet 链完成 **[ASSUMED: 实现细节需 prototype 验证]**。
3. **仅当 decode 失败或 MIME 不被支持：** 再引入 **ffmpeg.wasm** 转 WAV/PCM（注意 **COOP/COEP、SAB、体积**）**[CITED: `.cursor/rules/gsd.md` / ffmpeg.wasm release 说明]**。

### ffmpeg.wasm vs Web Audio

| 维度 | Web Audio | ffmpeg.wasm |
|------|-----------|-------------|
| 体积/首屏 | 低（浏览器内置） | 高 |
| 兼容性 | 依赖浏览器解码器 | 更强但集成重 |
| 线程 | 一般无需 SAB | 多线程常需隔离头 |

**结论：** **默认 Web Audio**；ffmpeg 为 **escape hatch**。

## Dexie Schema 草图（对齐 D-09 / Phase 2 停顿时间轴）

**时间轴约定：** 转写分片的 **`start_ms` / `end_ms`** 与 **`PauseEvent.start_ms`** 一样，均为 **「相对该次排练录制起点」的毫秒偏移**（与 Phase 2 D-10 一致）**[VERIFIED: `02-CONTEXT.md` D-10 + `rehearsalTypes.ts`]**。若引擎返回秒级 timestamp，在 engine 内统一 `* 1000` 并 clamp 到录音时长。

**排练轮次标识：** 每次 **成功 `stopRecording()`** 生成唯一 **`takeId`**（`crypto.randomUUID()`），写入任务行，便于同一会话多段排练与重转写。

### `AppDB.version(4)` 示例（表名可由 planner 微调）

```typescript
// 草图 — 规划用，非最终实现
this.version(4).stores({
  sessions: "id, createdAt, status, scene",
  rehearsalSettings: "sessionId, updatedAt",
  uploadedBackgrounds: "id, createdAt",
  pauseEvents: "id, sessionId, start_ms, createdAt",
  transcriptionJobs:
    "id, sessionId, takeId, status, createdAt, [sessionId+createdAt]",
  transcriptSegments:
    "id, jobId, sessionId, start_ms, [sessionId+start_ms]",
});
```

**`transcriptionJobs` 建议字段**

| 字段 | 说明 |
|------|------|
| `id` | UUID |
| `sessionId` | 会话 |
| `takeId` | 本轮排练/录制唯一 id |
| `status` | `queued` / `running` / `succeeded` / `failed`（与 D-10 一致） |
| `sourceBlob` | 可选：直接存 Blob（IndexedDB 可存）；或仅存 `blobKey` + 复用 `StopRecordingResult.url` 生命周期策略由 planner 定 |
| `mimeType`, `duration_ms` | 便于调试与 UI |
| `recordingEpochStartMs` | 可选：审计与回放对齐；**分片时间仍用相对 `0` 的 `start_ms`** |
| `errorCode`, `errorMessage`, `attempt` | 支持 D-06 重试 |
| `engineId`, `modelId` | 支持可插拔与复现 |

**`transcriptSegments` 建议字段**

| 字段 | 说明 |
|------|------|
| `id` | UUID |
| `jobId` | 外键 |
| `sessionId` | 冗余索引便于列表查询 |
| `idx` | 片段顺序 |
| `start_ms`, `end_ms` | D-08；目标 ≤10s 量级可再分段 |
| `text` | UTF-8 字符串 |

**「重新转写」与 D-05：** 二选一写死——**（推荐）** 新 `jobId` 覆盖同 `takeId` 的旧 segments；或保留 `job` 版本号字段。Planner 须在 PLAN 中择一并写迁移规则。

## 代码集成锚点（Integration Points）

| 位置 | 职责 |
|------|------|
| `src/app/session/[id]/rehearsal/_ui/RecorderPanel.tsx` | `onStop` 成功路径 **`stopRecording()` 之后**：触发 `enqueueTranscription(...)` **[VERIFIED: 约 55–64 行]** |
| `src/app/session/[id]/rehearsal/page.tsx` | 持有 **`recordingEpochStartMs`**、停顿入库；应在「录制成功结束」且拿到 **`playback`** 时传入 **`takeId`/会话 id** 与 epoch 对齐信息 **[VERIFIED: state 与 pause 逻辑]** |
| `src/app/_lib/db.ts` | **`AppDB` 新版本 stores** 注册转写相关表 **[VERIFIED: version(1)–(3) 模式]** |
| `src/app/session/[id]/page.tsx` | **会话详情**：当前为「Phase 1 壳」**[VERIFIED: 标题文案]**；此处挂载 **「转写摘要」+ 链到只读全文页/抽屉**（D-11） |
| 新建 `transcriptionQueue.ts` / `transcriptionRepo.ts` | 队列、重试、Dexie CRUD；与 `rehearsalRepo` 的 **Zod 容错**风格对齐 **[VERIFIED: `rehearsalRepo.ts` 模式]** |

## 风险（Risks）

### 1. iOS Safari

- **MediaRecorder MIME、解码、`decodeAudioData` 支持** 与桌面 Chrome 不一致，易出现「录得上但解不出」**[MEDIUM: 需真机清单验证；与 STATE.md「iOS Safari 覆盖 pending」一致]**。
- **内存峰值**：同机录制 + 大模型权重 + 解码缓冲，长练习可能 OOM。

### 2. 内存与性能

- Whisper 类模型量化后仍 **>100MB 级** 不罕见；须 **懒加载 + Cache Storage/IndexedDB 缓存策略**（Transformers.js 默认会缓存模型文件）**[ASSUMED: 缓存细节以运行时 `env` 配置为准，需读 HF 文档对应章节]**。

### 3. 首包与 FCP

- **切忌**把大 wasm/模型与首页关键路径绑死；使用 **`next/dynamic`** + **仅排练页或首次需要转写时**再 `import('@huggingface/transformers')`。

### 4. 多线程 ONNX Runtime

- **SIMD / threaded WASM** 可能依赖 **Cross-Origin Isolation（COOP/COEP）**；Next 需在 `next.config` 配响应头并评估与第三方脚本兼容性 **[MEDIUM: 见 ONNX Runtime Web 与 HF issue 讨论，Sources]**。

### 5. STT-03「可验证」

- Planner 应写清：**无默认远端 STT 请求**；验收可用 **DevTools Network** + **飞行模式** 断网仍完成转写（模型已缓存前提下）**[ASSUMED: 验收步骤由 planner 定义]**。

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 多格式音频解码器矩阵 | 自写 demuxer | Web Audio /（兜底）ffmpeg.wasm | 边界极大 |
| 训练/微调 ASR | 自训模型 | Hub 上现成 Whisper ONNX / 未来 sherpa 模型 | 非本阶段目标 |
| 手写 ONNX 推理 glue | 从零接 ORT | Transformers.js pipeline / 官方 wasm 示例 | 预处理与 tokenizer 已封装 |

## Common Pitfalls

### Pitfall：时间戳与停顿无法对齐

**现象：** 分片显示在错误回放位置。  
**根因：** 使用了「任务入队时间」或「墙钟时间」而非 **录制起点相对时间**。  
**避免：** 引擎输出统一减/映射到 **录制 `t=0`**，与 `pauseEvents` 一致（D-09）。

### Pitfall：Blob URL 提前 `revokeObjectURL`

**现象：** Worker `fetch(audioUrl)` 404。  
**根因：** 主线程在入队后立刻撤销 URL。  
**避免：** 在任务完成或 Blob 已写入 IndexedDB 前保持 URL 有效，或 **持久化 Blob** 后只用 `blob:` 内部引用。

### Pitfall：视频录制轨只转写了「混音轨」或漏轨

**现象：** 有画面无语音或相反。  
**根因：** `MediaRecorder` 轨道组合与解码只取了单轨。  
**避免：** 明确 Phase 3 v1 是否 **仅转写麦克风轨**（CONTEXT 未强制分离音视频轨转写；属 **planner 与产品需写清** 的边界）。

## Code Examples

### Transformers.js：浏览器默认 WASM + 可选 WebGPU

```javascript
// Source: https://huggingface.co/docs/transformers.js/main/en/index
import { pipeline } from '@huggingface/transformers';

const pipe = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', {
  device: 'webgpu',
});
```

（ASR 将 `task` 换为 `'automatic-speech-recognition'` 并换为多语 Whisper 模型 id；量化用文档 `dtype` 指南。）

### Node 文档中的 Whisper 输入格式（浏览器同理：Float32 @16kHz）

文档说明：Whisper 期望 **16000 Hz**，示例将 WAV 转为 **32-bit float** 样本再送入 pipeline **[CITED: https://huggingface.co/docs/transformers.js/en/guides/node-audio-processing]**。

## State of the Art

| 旧做法 | 当前做法 | 影响 |
|--------|----------|------|
| `@xenova/transformers` 单包名 | `@huggingface/transformers` v4 | 更小 npm 体积、统一维护 |
| 默认仅 WASM | WASM + 可选 WebGPU | 高端机可降延迟 |
| 云端 STT 默认 | 本地 ONNX 默认 | 符合 STT-03 |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 主流 Chromium 对 `audio/webm;codecs=opus` 的 `decodeAudioData` 可用 | 音频管线 | 需更早引入 ffmpeg 或服务端转码（违背默认本地） |
| A2 | 选定 Whisper 模型在中英混合面试场景下「可用」准确率 | WASM 选项 | 需更换更大模型或第二引擎（sherpa） |
| A3 | `return_timestamps` 在 v4 pipeline 上稳定返回可分片结构 | STT-02 | 需改为固定窗口切片 + 无字时间插值 |

## Open Questions (RESOLVED)

1. **v1 是否只转写麦克风音频而忽略屏幕共享视频轨中的系统声？**  
   - **已知：** 当前 `recording.ts` 将显示轨与麦克轨合并为单流 **[VERIFIED: `recording.ts`]**。  
   - **RESOLVED:** Phase 3 **转写对象 = 用户录制产出的单一混合 Blob**（与 `StopRecordingResult` 一致）；不单独抽取「仅麦克风轨」。见 `03-02-PLAN.md` context。

2. **模型分发：** 使用 Hugging Face CDN 还是自托管静态资源以满足「断网首次安装」？  
   - **RESOLVED:** **默认** 使用 Hugging Face **静态权重** CDN（HTTPS GET，非 STT API）；首次需联网缓存，之后可走本地 Cache。受限网络可通过 `env.localModelPath` / 自托管镜像（`03-02-PLAN.md` `user_setup`）。与 STT-03「默认不上传」一致。

## Environment Availability

**Step 2.6：** 本阶段主要依赖 **现代浏览器 API**（MediaRecorder、Web Audio、IndexedDB），无额外系统守护进程要求。构建机需 **Node + npm**（项目已有）。**真机浏览器矩阵**仍缺官方清单——与 `STATE.md` 一致，建议 planner 增加 **Wave 0 设备矩阵** 任务。

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Chromium / Safari / Firefox | WASM ASR + 解码 | 视用户环境 | — | 降级提示 / 仅保存录音不转写 |
| 足够磁盘与内存 | 模型缓存 | 视用户环境 | — | 更小量化模型 |

**Missing dependencies with no fallback：** 无（纯前端路径）。

## Validation Architecture

> **Skipped：** `.planning/config.json` 中 `workflow.nyquist_validation` 为 **false** **[VERIFIED: `config.json`]**。

## Security Domain（精简）

| ASVS 方向 | 是否相关 | 控制要点 |
|-----------|----------|----------|
| V5 输入验证 | 是 | Zod 校验任务与分片行；限制 `text` 最大长度防滥用 |
| V9 通信 | 低 | 默认无远端 STT；若配置 Hub 下载，仅 HTTPS + Subresource Integrity（若自托管） |
| 隐私 | 是 | STT-03：不默认上传音频；引擎日志不落敏感字段 |

## Sources

### Primary（HIGH）

- npm：`@huggingface/transformers`、`@xenova/transformers`、`dexie` 版本与包体积字段 **[VERIFIED: npm registry]**  
- Transformers.js 官方文档首页（WASM 默认、WebGPU、`dtype`）**[CITED: https://huggingface.co/docs/transformers.js/main/en/index]**  
- Transformers.js Node 音频教程（16kHz、Float32、pipeline 用法）**[CITED: https://huggingface.co/docs/transformers.js/en/guides/node-audio-processing]**  
- Transformers.js `pipeline` API 列表含 `automatic-speech-recognition` **[CITED: https://huggingface.co/docs/transformers.js/main/en/api/pipelines]**  
- whisper.cpp WASM 示例目录 **[CITED: https://github.com/ggerganov/whisper.cpp/tree/master/examples/whisper.wasm]**  
- sherpa-onnx 官方 WASM 文档 **[CITED: https://k2-fsa.github.io/sherpa/onnx/wasm/index.html]**  
- 工作区源码：`db.ts`、`recording.ts`、`rehearsalTypes.ts`、`RecorderPanel.tsx`、`session/[id]/page.tsx` **[VERIFIED: 仓库]**

### Secondary（MEDIUM）

- GitHub：`return_timestamps`、chunk 行为相关 issue/PR（实现前应用最小样例复测）  
- ONNX Runtime Web threaded WASM 与隔离头讨论（issue #161 等）

## Metadata

**Confidence breakdown**

- Standard stack：**MEDIUM-HIGH**（npm + 官方文档一致）  
- Architecture：**HIGH**（与现有代码模式一致）  
- Pitfalls：**MEDIUM**（浏览器解码与 iOS 需实测）

**Valid until：** 约 **30 天**（`@huggingface/transformers` 快速迭代，需锁定 planner 中的确切 minor）。

---

## 给 Planner 的默认路径（汇总）

1. **引擎：** `@huggingface/transformers` + **量化多语 Whisper**（`automatic-speech-recognition`）。  
2. **执行位置：** **Worker** + 主线程队列与 Dexie。  
3. **解码：** **Web Audio 优先**；失败再评估 ffmpeg.wasm。  
4. **存储：** Dexie **v4+** 两表：`transcriptionJobs` + `transcriptSegments`，时间字段与 **Phase 2 `pauseEvents.start_ms` 同源**。  
5. **UI：** `session/[id]/page.tsx` 增加摘要与全文只读入口；排练页静默入队（D-04）。

## RESEARCH COMPLETE
