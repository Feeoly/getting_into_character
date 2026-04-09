```markdown
# Architecture Research

**Domain:** Local-first 面试排练 Web 应用（录制/转写/复盘）
**Researched:** 2026-04-09
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                               Presentation                               │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  ┌──────────┐  │
│  │ 场景/角色卡页 │  │  排练录制页     │  │  复盘/建议页    │  │ 设置页   │  │
│  └──────┬───────┘  └───────┬────────┘  └───────┬────────┘  └────┬─────┘  │
│         │                  │                   │                │        │
├─────────┴──────────────────┴───────────────────┴────────────────┴────────┤
│                         Application / Domain Layer                        │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌──────────────────┐  ┌───────────────────────────┐ │
│  │ Session Orchestr│  │ MediaCapture     │  │ Review / Coaching          │ │
│  │ (状态机/流程)    │  │ (摄像头/屏幕/音频)│  │ (建议生成、导出、回放)       │ │
│  └───────┬────────┘  └────────┬─────────┘  └───────────┬───────────────┘ │
│          │                    │                         │                 │
├──────────┴────────────────────┴─────────────────────────┴─────────────────┤
│                         Processing (Workers)                               │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐   ┌────────────────────┐   ┌─────────────────────┐ │
│  │ Transcription     │   │ PauseDetector       │   │ VideoBackground      │ │
│  │ Worker (ASR)      │   │ Worker (阈值/事件)   │   │ Pipeline (本地素材)   │ │
│  └────────┬─────────┘   └─────────┬───────────┘   └──────────┬──────────┘ │
│           │                       │                          │            │
├───────────┴───────────────────────┴──────────────────────────┴────────────┤
│                          Data & Platform                                   │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────────┐  ┌───────────────────────────────┐ │
│  │ IndexedDB     │  │ File System    │  │ Service Worker (offline cache)│ │
│  │ (sessions/...)│  │ Access / Export│  │                               │ │
│  └──────────────┘  └────────────────┘  └───────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Presentation (Pages/Components) | 展示与交互；只做 UI 状态，不直接处理媒体/存储细节 | React/Next/Vite 任一；路由 + 组件库 |
| Session Orchestrator | “一次排练”的生命周期状态机：准备→录制→结束→复盘；统一事件流 | 纯 TS domain 模块 + 状态机（轻量实现或 xstate） |
| MediaCapture | 采集摄像头/麦克风/屏幕；录制为分段 blob；提供实时电平数据 | MediaDevices + MediaRecorder + WebAudio |
| Transcription Worker | 将音频片段转写为文本（本地优先）；输出带时间戳的片段 | Web Worker +（可插拔）ASR 引擎 |
| PauseDetector Worker | 基于音量/转写间隔检测停顿；生成提示与事件记录 | Web Worker（避免阻塞 UI） |
| Review/Coaching | 复盘：文本整理、停顿统计、示例建议、导出 | Domain service + UI 渲染 |
| IndexedDB Store | 本地持久化：session 元数据、转写、停顿事件、媒体索引 | Dexie/IDB 封装（表结构可迁移） |
| File Export | 允许用户导出 mp4/webm、json、txt 等（可选） | File System Access / 下载链接 |
| Service Worker | 离线可用：静态资源缓存、断网回退、后台同步（若未来需要） | Workbox/手写 SW |

## Recommended Project Structure

```
src/
├── app/                      # 路由/页面层（UI 组合）
│   ├── pages/                # scene、rehearsal、review、settings
│   └── components/           # 纯 UI 组件（无业务副作用）
├── domain/                   # 业务领域模型与用例（不依赖框架）
│   ├── session/              # session 状态机、事件、用例
│   ├── roleCard/             # 角色卡生成规则/模板（可替换为 AI）
│   ├── review/               # 复盘指标、建议生成（可插拔策略）
│   └── types/                # 领域类型（Session, Transcript, PauseEvent）
├── platform/                 # 与浏览器 API 的适配层
│   ├── media/                # MediaDevices/Recorder/WebAudio 封装
│   ├── storage/              # IndexedDB 封装 + schema/migrations
│   ├── workers/              # worker 启动与消息协议
│   ├── offline/              # service worker/缓存策略
│   └── export/               # 导出与文件访问
├── workers/                  # 具体 worker 实现（ASR、停顿检测）
│   ├── transcription.worker.ts
│   └── pauseDetector.worker.ts
├── shared/                   # 跨层通用：日志、错误、时间、校验
└── assets/                   # 背景素材/占位资源（可选）
```

### Structure Rationale

- **`domain/`**: 把“排练是什么、事件是什么、怎么复盘”固化为纯逻辑，便于未来替换 UI/ASR/AI 实现且不破坏数据。
- **`platform/`**: 把高波动、易出兼容性问题的浏览器能力隔离（媒体、存储、离线、导出），避免业务代码被 API 细节污染。
- **`workers/` + `platform/workers/`**: 重 CPU/重 IO 的处理（转写/检测）走 worker；主线程只负责渲染与交互，降低卡顿导致的“停顿误判”。

## Architectural Patterns

### Pattern 1: Local-first event log（会话事件日志）

**What:** 把一次排练的关键变化记录为 append-only 的事件流（开始/结束、片段写入、转写产出、停顿事件、提示展示等）。
**When to use:** 需要可复盘、可重算指标、可导出/分享（不含隐私内容时）时。
**Trade-offs:** 易审计/易演进；但需要事件版本化与少量重放逻辑。

**Example:**
```typescript
export type SessionEvent =
  | { type: "SESSION_STARTED"; at: number; sessionId: string }
  | { type: "MEDIA_CHUNK_SAVED"; at: number; sessionId: string; chunkId: string; ms: number }
  | { type: "TRANSCRIPT_APPENDED"; at: number; sessionId: string; segmentId: string; text: string; t0: number; t1: number }
  | { type: "PAUSE_DETECTED"; at: number; sessionId: string; ms: number; thresholdMs: number };
```

### Pattern 2: Pluggable engines（可插拔转写/建议引擎）

**What:** 用接口把“转写（ASR）”和“复盘建议（Coach）”抽象出来，默认走本地实现；必要时允许用户显式选择远端（非默认）。
**When to use:** 你的隐私默认值是“本地不上传”，但设备能力差异大（低端机/浏览器限制），需要降级路径。
**Trade-offs:** 接口设计要稳定；实现会多一层适配与错误处理，但能显著降低路线锁死风险。

**Example:**
```typescript
export interface TranscriptionEngine {
  transcribeChunk(input: { pcm: Float32Array; sampleRate: number }): Promise<{ text: string; t0: number; t1: number }>;
}

export interface CoachingEngine {
  suggest(input: { transcript: string; pauses: Array<{ ms: number }> }): Promise<{ tips: string[]; examples: string[] }>;
}
```

### Pattern 3: Worker message protocol（处理管线消息协议）

**What:** UI ↔ worker 通过明确的 message schema 通信，避免隐式共享状态；worker 输出只包含“可持久化结果”，不直接操作存储。
**When to use:** 转写/检测涉及流式输入，且需要稳定可测试。
**Trade-offs:** 初期写起来更“正规”；但对稳定性与可测性收益大。

## Data Flow

### Request Flow

```
[用户点击“开始排练”】【设置停顿阈值/场景/角色卡】
    ↓
[Session Orchestrator] → [MediaCapture.start] → [Worker pipeline start]
    ↓                         ↓                       ↓
[UI 更新录制状态]      [音频电平/媒体分段]      [转写片段/停顿事件]
    ↓                         ↓                       ↓
[写入 IndexedDB]  ←── [platform/storage]  ←── [domain 用例统一落库]
    ↓
[复盘页读取 session] → [domain/review 生成指标与建议] → [UI 渲染/导出]
```

### State Management

```
[SessionStore (domain)]
    ↓ (subscribe)
[Pages/Components] ←→ [UseCases] → [Reducers/Mutations] → [SessionStore]
```

### Key Data Flows

1. **录制与落盘（媒体）:** MediaRecorder 产生 chunk → `platform/media` 统一命名与时长 → IndexedDB 存索引 + Blob（或分离存储策略）→ 复盘页可回放/导出。
2. **转写（本地优先）:** AudioWorklet/ScriptProcessor 收集 PCM（或从录制音轨提取）→ 发给 `Transcription Worker` → 产出带时间戳的 transcript segment → append 到事件日志与 transcript 表。
3. **停顿检测与提示:** `PauseDetector Worker` 订阅音量/转写间隔 → 触发 `PAUSE_DETECTED` → UI 展示鼓励提示（不阻塞录制）→ 事件落盘用于统计。
4. **复盘建议（可插拔）:** 复盘页聚合 transcript + pause stats → `CoachingEngine.suggest` → 输出结构化建议与示例 → 本地保存（可清空）。

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | 纯前端 local-first 即可；重点在稳定录制、数据不丢、离线可用 |
| 1k-100k users | 若引入可选云端（非默认）：增加鉴权、配额、队列；本地仍为主 |
| 100k+ users | 将云端建议/素材分发独立成服务；客户端保持同一 domain 接口与降级路径 |

### Scaling Priorities

1. **First bottleneck:** 设备端性能/兼容（录制+转写导致掉帧/卡顿）→ worker 化、分段、降采样、可关闭实时转写。
2. **Second bottleneck:** 本地存储膨胀（视频 blob 占空间）→ 自动清理策略、导出后归档、提示用户存储占用。

## Anti-Patterns

### Anti-Pattern 1: UI 直接操控媒体与存储

**What people do:** 页面组件里直接调用 MediaRecorder、直接写 IndexedDB，逻辑分散。
**Why it's wrong:** 很难保证“开始/停止/异常”一致性；一旦崩溃就难追溯与修复。
**Do this instead:** 统一走 `Session Orchestrator` + 用例层；UI 只发意图与订阅状态。

### Anti-Pattern 2: 把“默认本地处理”做成口号但无落地接口

**What people do:** 先写死远端转写/建议，后面再补本地版本。
**Why it's wrong:** 一旦用户心智/数据结构依赖远端返回形态，后续本地化会变成重写。
**Do this instead:** 从第一天就定义 `TranscriptionEngine` / `CoachingEngine` 接口；默认实现必须是本地路径，可选远端是后加的实现。

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| （可选）远端建议/LLM | `CoachingEngine` 的一个实现 | 必须用户显式开启；上传内容提示与脱敏策略 |
| （可选）素材 CDN | 背景视频/图片下载 | 仍需离线缓存；避免阻塞排练流程 |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `app/*` ↔ `domain/*` | 函数调用 / store 订阅 | domain 不依赖 React/路由 |
| `domain/*` ↔ `platform/*` | 适配器接口 | 便于测试与替换实现 |
| `platform/*` ↔ `workers/*` | message protocol | schema 版本化，避免破坏旧数据 |

## Build Order Implications（推荐构建顺序）

1. **Domain 数据模型 + 本地存储 schema**：先把 `Session / Event / Transcript / PauseEvent` 定下来，保证后续功能都能落盘与复盘。
2. **Session Orchestrator（流程状态机）**：把“开始/停止/异常恢复”做对，再接媒体与 worker，避免越做越乱。
3. **MediaCapture + 分段录制/回放**：先实现“能稳定录到本地并回放”，这是用户信任的基础。
4. **PauseDetector（先基于音量/静音）**：不依赖转写就能上线，尽快验证“停顿提醒”是否真能缓解紧张。
5. **Transcription Pipeline（可降级）**：先实现“录后转写”再做“实时转写”；把性能与兼容问题关在 worker 里。
6. **Review 指标与导出**：停顿统计 + 转写文本整理 + 导出（txt/json），让复盘闭环成立。
7. **角色卡生成（规则版→可插拔 AI）**：先用可控模板/规则上线验证，再接更强的生成能力。
8. **CoachingEngine（本地优先、可选远端）**：把隐私默认值守住；若本地模型不成熟，先做“用户粘贴到 AI 输入框”的半自动工作流也可落在同一接口上。

## Sources

- 主要依据：项目约束与需求（`.planning/PROJECT.md`）+ Web 平台常见 local-first 媒体应用架构经验（未做外部文献检索，故为 MEDIUM）。

---
*Architecture research for: Local-first 面试排练 Web 应用*
*Researched: 2026-04-09*
```
