# Phase 02: 排练页录制与停顿事件 MVP - Research

**Researched:** 2026-04-10  
**Domain:** Web 端本地优先录制（MediaRecorder/Web Audio）、场景背景、停顿检测与事件记录、设置抽屉  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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

### Deferred Ideas (OUT OF SCOPE)
- 停顿前后语音转写文本（依赖 STT）—— Phase 3
- 更强的 VAD / 多信号融合—— Phase 2 之后再增强
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCEN-01 | 排练页展示面试场景背景（离线视频背景） | 使用静态资源（预置图片/预置小循环视频）+ 设置里切换；视频仅轻量增强（避免默认重型管线）[ASSUMED] |
| SCEN-02 | 用户可上传背景素材并在排练页使用 | `input[type=file]` 读取图片、以 `URL.createObjectURL()` 用于即时预览；持久化走本地存储（Dexie/IndexedDB）[ASSUMED] |
| RECD-01 | 授权并录制麦克风音频（稳定可用） | 以 `getUserMedia({audio:true})` + `MediaRecorder` 为主线；分片 `start(timeslice)` 提升稳定性与崩溃恢复空间 [CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia] [CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start] |
| RECD-02 | 可选启用摄像头录制（按需权限） | 摄像头默认关闭、仅在用户开启后再 `getUserMedia({video:true})` 请求权限（渐进授权）[ASSUMED]；权限与安全上下文约束见 MDN [CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia] |
| RECD-03 | 可移动“录制画面/预览区域” | 预览 UI 用 Pointer Events/transform 实现拖拽；移动端缩成小卡片/可展开（避免遮挡）[ASSUMED] |
| RECD-04 | 可回放本次录制（至少音频） | 录制结束后将 chunks 合并为 `Blob`，用 `URL.createObjectURL(blob)` 绑定到 `<audio>/<video>` 播放 [CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API] |
| PAUS-01 | 检测长时间停顿并温和提示 | Web Audio `AudioContext` + `AnalyserNode` 获取时域/能量并平滑；阈值 5s；提示需“温和、不打断”[CITED: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext] [CITED: https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode] |
| PAUS-02 | 记录停顿事件（开始、持续、阈值） | 事件表本地存储（Dexie）；字段按 D-10；与录制起点的 `start_ms` 对齐用于回放跳转 [ASSUMED] |
| PAUS-03 | 设置里可配阈值并可关闭提示 | 设置抽屉保存（Dexie/IndexedDB）+ Zod 校验（避免脏配置）[VERIFIED: npm registry] |
| SETT-01 | 设置页提供阈值、提示开关、背景来源等 | 右上角入口打开抽屉/弹层；遵循 Phase 01 token（间距/字号/配色/44px 触控）[ASSUMED] |
</phase_requirements>

## Summary

Phase 02 的“最稳 MVP 路径”是：以 **MediaRecorder 为主的本地录制与回放**，以 **Web Audio 的能量阈值**做停顿检测，并把背景/阈值/提示开关/摄像头开关收口到**排练页设置抽屉**。关键在于：权限只在用户点击开始/开启摄像头时请求（渐进授权），录制用分片输出减少单 Blob 风险，所有资源（背景、录制、事件、设置）默认只落本地存储。

浏览器层面的“必知点”包括：`getUserMedia()` 仅在安全上下文可用、权限可能既不 resolve 也不 reject（用户忽略）[CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia]；`MediaRecorder.start(timeslice)` 可按分片触发 `dataavailable`，适合做稳态缓存与失败恢复 [CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start]；`MediaRecorder.isTypeSupported()` 用于 MIME/codec 特性探测，避免硬编码格式 [CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported]。

**Primary recommendation:** Phase 02 录制与停顿检测全部走浏览器标准（getUserMedia + MediaRecorder + Web Audio），数据存储复用现有 Dexie（会话/设置/事件/录制元数据），并以“分片写入 + 最小 UI 反馈”作为稳定性优先策略。

## Project Constraints (from .cursor/rules/)

- **必须通过 GSD 工作流推进改动**：不要绕过 GSD 直接改仓库（除非用户明确要求）。[VERIFIED: local file `.cursor/rules/gsd.md`]

## Standard Stack

### Core
| Library / API | Version | Purpose | Why Standard |
|---|---:|---|---|
| Next.js | 16.2.3 | App 框架 | 现有项目依赖已锁定 [VERIFIED: npm registry] |
| React / react-dom | 19.2.5 | UI | 现有项目依赖已锁定 [VERIFIED: npm registry] |
| TypeScript | 6.0.2 | 类型与边界 | 现有项目依赖已锁定 [VERIFIED: npm registry] |
| Dexie (IndexedDB) | 4.4.2 | 本地持久化 | 已用于会话仓库；可扩展记录设置/事件/录制元信息 [VERIFIED: npm registry] |
| Zod | 4.3.6 | 配置/数据校验 | 用于设置与 schema 防御脏数据 [VERIFIED: npm registry] |
| MediaDevices.getUserMedia | Web 标准 | 麦克风/摄像头采集 | Web 端事实标准 [CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia] |
| MediaRecorder | Web 标准 | 录制与分片输出 | 简化编码/封装；跨浏览器支持面较广 [CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start] [CITED: https://caniuse.com/mediarecorder] |
| Web Audio (AudioContext + AnalyserNode) | Web 标准 | 音量能量/平滑/可视化 | 适配 D-07 的“阈值 + 平滑”停顿检测 [CITED: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext] [CITED: https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode] |

### Supporting
| Library / API | Version | Purpose | When to Use |
|---|---:|---|---|
| `MediaRecorder.isTypeSupported()` | Web 标准 | 录制格式特性探测 | Safari/Chrome/Firefox 格式差异时必用 [CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported] |
| Object URL (`URL.createObjectURL`) | Web 标准 | 回放/预览 blob | 回放与背景上传即时预览（需记得 revoke）[ASSUMED] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|---|---|---|
| Dexie/IndexedDB 存大文件 | OPFS / SQLite WASM | 更适合大文件顺序写入与查询，但会增加 Phase 02 的引入成本与跨域隔离复杂度 [ASSUMED] |
| 能量阈值停顿检测 | VAD（语音活动检测） | 更准确但实现复杂、误报/漏报调参成本高；已被明确推迟到后续增强 [VERIFIED: local file `02-CONTEXT.md`] |

**Version verification:** `next@16.2.3`, `react@19.2.5`, `dexie@4.4.2`, `zod@4.3.6`, `tailwindcss@4.2.2` 均与当前 `package.json` 一致 [VERIFIED: npm registry]。

## Architecture Patterns

### Recommended Project Structure (Phase 02 增量建议)
```
src/app/session/[id]/
  page.tsx                 # 会话详情入口（已有/延续）
  rehearsal/               # 排练页（Phase 02）
    page.tsx               # 排练页路由（或复用现有 page）
    _ui/
      RecorderPanel.tsx    # 开始/结束/回放控制 + 状态
      PreviewDraggable.tsx # 摄像头预览窗（拖拽/移动端缩略）
      PauseToast.tsx       # 温和提示条幅（渐隐/不打断）
      SettingsDrawer.tsx   # 设置抽屉（阈值/开关/背景/摄像头）
    _lib/
      recording.ts         # getUserMedia + MediaRecorder 封装（分片/错误/清理）
      pauseDetector.ts     # AudioContext + AnalyserNode（能量/平滑/阈值/冷却）
      rehearsalRepo.ts     # Dexie：settings + events + recording meta
```

### Pattern 1: 录制控制器（“分片 + 特性探测 + 生命周期清理”）
**What:** 把 `getUserMedia`/`MediaRecorder` 与 UI 解耦，暴露明确状态（idle/requesting/recording/stopping/error）。  
**When to use:** RECD-01/02/04 全链路。  
**Example:**

```ts
// Source: MDN (MediaRecorder.start timeslice, ondataavailable)
// https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start
// https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API
const options =
  MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? { mimeType: "audio/webm;codecs=opus" }
    : undefined;

const recorder = new MediaRecorder(stream, options);
const chunks: BlobPart[] = [];
recorder.ondataavailable = (e) => chunks.push(e.data);
recorder.start(1000); // timeslice: 分片输出，便于持久化与恢复
```

### Pattern 2: 停顿检测（“能量阈值 + 平滑 + 冷却”）
**What:** 用 `AudioContext` 创建 `AnalyserNode`，循环采样能量；低于阈值持续超过 \(threshold\_ms\) 触发事件。  
**When to use:** PAUS-01/02/03。  
**Example:**

```ts
// Source: MDN (AudioContext / AnalyserNode)
// https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
// https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;
// 将麦克风 stream 接入 analyser，再用 getByteTimeDomainData 做简易能量估计 [ASSUMED]
```

### Anti-Patterns to Avoid
- **在页面加载时直接请求麦克风/摄像头权限**：违反 D-02 的渐进授权，且降低信任感 [VERIFIED: local file `02-CONTEXT.md`]。
- **一次录到一个超大 Blob**：更容易遇到内存峰值/崩溃/失败后无可恢复片段；优先分片输出 [CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start]。
- **不做 MIME 特性探测就硬编码 mimeType**：不同浏览器/设备可用的 container/codec 不一致；至少用 `isTypeSupported()` 做探测 [CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported]。

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| 录制编码与封装 | 手写 PCM/WAV 编码器作为主路径 | MediaRecorder | 省去编码细节与性能坑，且能用 timeslice 分片 [CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start] |
| 停顿检测输入采集 | 自己解析底层音频设备流 | Web Audio API | AnalyserNode 提供实时分析能力，且支持“不连接输出也工作”[CITED: https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode] |

## Common Pitfalls

### Pitfall 1: 非安全上下文导致 `getUserMedia()` 直接不可用
**What goes wrong:** `navigator.mediaDevices` 为 `undefined`，或者调用直接抛/拒绝。  
**Why it happens:** `getUserMedia()` 仅在 secure contexts 可用（HTTPS/localhost 等）。  
**How to avoid:** 开发环境用 `localhost`；部署用 HTTPS；UI 中把“权限不可用”错误转成可理解的文案。  
**Warning signs:** 设备列表为空、`TypeError`、`NotAllowedError`。  
**Source:** [CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia]

### Pitfall 2: 录制格式兼容性（尤其 Safari）
**What goes wrong:** `new MediaRecorder(stream,{mimeType})` 抛 `NotSupportedError`，或录完无法播放。  
**Why it happens:** 浏览器对 container/codec 支持不同；同一 MIME 字符串不一定跨浏览器通用。  
**How to avoid:** 运行时用 `MediaRecorder.isTypeSupported()` 选择可用类型；并以“实际 recorder.mimeType”为准写入元数据。  
**Source:** [CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported] [CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/mimeType]

### Pitfall 3: AudioContext 生命周期与用户手势
**What goes wrong:** 音频分析不工作或被挂起。  
**Why it happens:** 某些浏览器会在无用户手势时限制/挂起 AudioContext（实现差异）。  
**How to avoid:** 在“开始录制”点击后初始化或 `resume()`；复用单个 AudioContext。  
**Source:** [CITED: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext]

### Pitfall 4: Object URL 泄漏/占用
**What goes wrong:** 多次回放/切换背景后内存上涨。  
**How to avoid:** 不再需要时 `URL.revokeObjectURL()`；对录制分片/背景预览做清理 [ASSUMED]。

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---:|---|
| Node.js | Next dev/build | ✓ | v22.22.0 | — |
| npm | 依赖管理 | ✓ | 11.11.0 | — |

## Validation Architecture

跳过：`.planning/config.json` 中 `workflow.nyquist_validation` 为 `false` [VERIFIED: local file `.planning/config.json`]。

## Security Domain

> 本项目默认本地处理/不上传是“信任主张”，Phase 02 的安全重点是：权限最小化、输入校验、避免隐私泄漏到第三方资源。

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | no | 本阶段无登录/鉴权 [ASSUMED] |
| V3 Session Management | no | 本阶段无服务端 session [ASSUMED] |
| V4 Access Control | no | 本阶段无多用户/权限模型 [ASSUMED] |
| V5 Input Validation | yes | 设置/本地数据用 Zod 校验（阈值范围、枚举值、开关）[VERIFIED: npm registry] |
| V6 Cryptography | no | 本阶段不做加密/签名（不上传）[ASSUMED] |

### Known Threat Patterns for this phase
| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| 第三方资源泄漏（背景 URL 外链） | Information Disclosure | 预置资源本地打包；上传素材只用本地 object URL/本地存储，不自动请求外站 [ASSUMED] |
| 权限提示引发不信任 | Repudiation / Social | 渐进授权、明确录制状态指示与“本地不上传”文案 [VERIFIED: local file `02-CONTEXT.md`] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | 背景“离线视频背景”在 Phase 02 以预置小循环视频（静态资源）即可满足 | Phase Requirements / Summary | 若验收要求是“离线生成”而不是“离线播放”，将需要引入更重的视频生成管线 |
| A2 | 背景上传与回放主要用 object URL + IndexedDB 持久化即可 | Phase Requirements | iOS/Safari 对大 Blob 存储或回放有问题时需要改为分片/OPFS |
| A3 | 停顿检测的“能量估计”可用 AnalyserNode 时域数据做 MVP | Architecture / Pitfalls | 若误报过多，需引入更稳的特征（RMS/噪声门限自适应/冷却）或 VAD |

## Open Questions (RESOLVED)

1. **录制产物要不要“跟随会话”持久保存（跨刷新可回放），还是仅本次临时回放？（RESOLVED）**
   - Resolution: Phase 02 **只保证“本次录制结束后可回放本次内容”**（满足 RECD-04）。**跨刷新/重进可回放**作为后续增强（Phase 3+ 或独立优化），避免 Phase 02 被大 Blob/兼容性拖慢。
   - Plan link: `02-02-PLAN.md` 的验收以“本次回放”为硬门槛，不要求刷新后仍可播放。

2. **目标设备/浏览器最小矩阵（尤其 iOS Safari）（RESOLVED）**
   - Resolution: Phase 02 的最低支持矩阵以 **桌面 Chrome / Edge / Safari（macOS）** 为主；iOS Safari 作为“高风险但不阻塞”的验证项记录在风险与手动验证里。
   - Plan link: `02-02-PLAN.md` 默认采用 **MIME 探测 + 分片收集**，并加入“3–5 分钟稳定录制”的手动验证项；若 iOS 不稳定，作为后续兼容优化处理。

## Sources

### Primary (HIGH confidence)
- MDN `MediaDevices.getUserMedia()`（安全上下文/权限行为/异常）[CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia]
- MDN `MediaRecorder.start(timeslice)`（分片录制语义与事件顺序）[CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start]
- MDN “Using the MediaStream Recording API”（chunks→Blob→objectURL 回放模式）[CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API]
- MDN `MediaRecorder.isTypeSupported()` / `mimeType`（特性探测与实际类型读取）[CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported] [CITED: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/mimeType]
- MDN `AudioContext` / `AnalyserNode`（停顿检测所需的音频分析基础）[CITED: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext] [CITED: https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode]
- Can I use：MediaRecorder 支持度（Safari 14.1+、iOS 14.5+）[CITED: https://caniuse.com/mediarecorder]
- npm registry：next/react/dexie/zod/tailwindcss 当前版本核验 [VERIFIED: npm registry]

### Tertiary (LOW confidence)
- “Safari 具体支持哪些 mimeType/codec 字符串”的细粒度列表：本次未用官方来源完全核实（避免把 StackOverflow 当作事实）。需要在实现时用 `isTypeSupported()` 运行时探测兜底。 [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 依赖版本与仓库一致，且已做 npm 核验 [VERIFIED: npm registry]
- Architecture: MEDIUM — 录制/停顿检测的模式有官方文档支撑，但具体存储与 iOS 行为需落地验证
- Pitfalls: HIGH — 安全上下文、timeslice、特性探测、支持度均有官方引用

**Research date:** 2026-04-10  
**Valid until:** 2026-05-10

