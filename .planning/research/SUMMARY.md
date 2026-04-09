# Project Research Summary

**Project:** Getting Into Character（面试角色排练）
**Domain:** Local-first 面试排练 Web 应用（角色卡 + 浏览器录制 + 本地 STT/转写 + 停顿提示 + 复盘建议）
**Researched:** 2026-04-09
**Confidence:** MEDIUM

## Executive Summary

这是一个“敏感内容 + 紧张场景”的练习产品：用户需要在短时间内进入角色、稳定表达，并能在练习后快速复盘改进。专家路径通常是先把**练习闭环**做稳定（题目/角色卡 → 录制 → 回放/转写 → 停顿事件 → 复盘建议 → 历史记录），再逐步增强指标与 AI 辅助；在这个领域里，“录制稳定性、隐私信任、性能与兼容性”往往比“更花哨的 AI”更先决定留存。

研究建议采用 **local-first 默认本地处理** 的技术路线：录制基于 Web 标准（WebRTC Media Capture + MediaRecorder，必要时引入 WebCodecs 增强可控性），本地持久化优先 OPFS + SQLite WASM（或在早期用 IndexedDB 简化），重计算（转写/停顿检测）放到 Worker 里，并从一开始就把转写与复盘建议设计成**可插拔引擎**（默认本地，云端增强仅作为显式开关）。

关键风险主要来自：1）“本地隐私承诺”被任何在线识别/第三方 SDK/日志链路破坏；2）权限弹窗与录制可见性不佳导致强烈不安全感；3）iOS Safari 长录制崩溃/文件损坏；4）停顿检测误报引发更焦虑；5）录制+STT 性能抖动拖垮交互。缓解策略是把隐私与权限 UX 作为 Phase 1 的交付物，把录制与分段落盘、能力检测与降级作为 Phase 2 的硬指标，并用真实设备（尤其 iPhone）做“3–5 分钟稳定录制、断网可用、无内容外泄”的验证门槛。

## Key Findings

### Recommended Stack

（详见 `.planning/research/STACK.md`）建议以 Next.js + React + TypeScript 为主线，配合 local-first 的存储与媒体处理能力：录制走 Web 标准并保留回退路径，持久化优先 OPFS（大文件/顺序写入友好），结构化数据用 SQLite WASM（官方 OPFS 后端）以便做检索/统计；转写默认本地（whisper.cpp WASM）并把云端作为可选增强，而不是默认依赖。UI 侧可用 shadcn/ui + tailwind 快速搭建可访问的控制台与设置面板；状态层用轻量 store（如 Zustand）承载录制状态机与多模块协作。

**Core technologies:**
- Next.js（约 16.2）: Web App 框架（路由/构建/部署/SSR/CSR） — 生态成熟，适合从“纯本地 v1”平滑演进到“可选云端增强/登录/付费”的产品形态
- React（约 19.x）: UI 渲染与交互 — 适合录制控制台、字幕/时间线等交互密集界面
- TypeScript（5.x）: 类型安全 — 多异步、多边界（Worker/存储/媒体）场景能显著降低回归风险
- WebRTC Media Capture: 采集摄像头/麦克风/屏幕 — 浏览器媒体采集事实标准，支持本地处理
- MediaRecorder: 录制封装落盘 — 作为最省心的“开箱即用录制”与 WebCodecs 的兼容回退
- WebCodecs: 更可控的编解码 — 需要更稳的码率/时长控制、边录边压缩/抽帧/预览时启用，减少对 ffmpeg.wasm 的依赖
- OPFS: 本地文件系统存储 — 适合录制分片/大文件/模型文件
- SQLite WASM（官方 OPFS 后端）: 本地结构化存储 — 更适合做历史记录、事件索引、统计/分页/查询（注意 COOP/COEP 与 SharedArrayBuffer 约束）
- whisper.cpp（WASM）: 本地中文转写 — 默认不上传，符合隐私主张；后续再加可选云端增强

### Expected Features

（详见 `.planning/research/FEATURES.md`）用户对“练习可开始、可复盘、可量化”有明确预期；本项目的差异化核心在“角色进入”（角色卡 + 口令/禁忌）与“停顿事件作为复盘锚点”，并以“默认本地隐私”建立信任。MVP 应优先打通一次排练的闭环，再逐步补齐评分维度与沉浸背景等增强项。

**Must have (table stakes):**
- 场景/题目入口 + 练习流程（开始/结束/重录）— 用户需要明确练习起点与可重复性
- 录音/录像（至少一种）+ 回放 — 复盘闭环的基础
- 自动转写（语音转文字）— 快速看到“我到底说了什么”，支撑结构化复盘
- 基础表达指标（语速/停顿等）— 提供可量化反馈（停顿可先不依赖大模型）
- 练习记录与历史回看 — 形成进步轨迹
- 隐私说明 + 删除/导出 — 敏感内容场景必须“可控”

**Should have (competitive):**
- “角色卡”（状态 + 行为指令 + 禁忌）生成与朗读模式 — 核心差异化，降低紧张并稳定输出
- 停顿提醒 + 事件记录（阈值可配）— 直击“临场卡壳”痛点，形成可复盘事件
- 公务员结构化答题框架引导（模板/连接词/段落结构）— 对齐评分标准，提升条理性
- 复盘面板（对齐考官维度的可观测指标）— 提升反馈可信度（可从言语表达/结构化先做）
- AI 复盘对话框（基于转写/停顿事件）— 低摩擦复盘，输出可执行改进点与例句

**Defer (v2+):**
- 可选云端同步（加密、选择性上传）— 等到用户明确需求且信任建立后再做
- 模拟考官追问/压力面试（多轮对话）— 复杂度高，需先验证单轮排练价值
- 人类教练市场/撮合 — 运营与合规复杂，偏离“自助角色排练”主线

### Architecture Approach

（详见 `.planning/research/ARCHITECTURE.md`）推荐采用分层与边界清晰的 local-first 架构：UI 只负责展示与意图触发；`Session Orchestrator` 作为一次排练的状态机与事件总线；媒体采集、存储、导出、离线能力放在 `platform/` 适配层；转写与停顿检测放在 Worker 管线中，输出可持久化结果；用“事件日志（append-only）”让指标可重算、可导出、可演进；同时把转写/复盘建议抽象成可插拔引擎以保留“默认本地 + 可选云端”路线弹性。

**Major components:**
1. Session Orchestrator（domain）— 统一排练生命周期状态机（准备→录制→结束→复盘）与事件流
2. MediaCapture（platform）— 设备权限、采集与分段录制、实时电平/输入源信息
3. Processing Workers（workers）— Transcription Worker（ASR）与 PauseDetector Worker（停顿事件），避免阻塞主线程
4. Local Data Store（platform/storage）— session 元数据、事件日志、转写段落、停顿事件、媒体索引（可从 IndexedDB 起步，逐步演进到 OPFS/SQLite）
5. Review/Coaching（domain + app）— 统计指标、建议生成、导出（txt/json/媒体）

### Critical Pitfalls

（详见 `.planning/research/PITFALLS.md`）需要把“信任/稳定/兼容/性能”当作一等功能，提前用验证门槛锁住质量：

1. **“默认本地处理”被暗中打破** — 禁用/隔离任何可能采集内容的 SDK；把在线识别/云端增强做成显式开关并清晰告知数据去向；默认断网也能跑通核心流程
2. **权限弹窗与“被录制感”导致退出** — 渐进授权（点击开始才请求）、默认仅麦克风；常驻录制状态与“一键停止/丢弃/删除”路径；用微文案强化“本地不上传”
3. **iOS Safari 长录制崩溃/文件损坏** — 能力检测 + 降级（音频/文字模式）；分段录制与分段落盘；限制单段时长并支持中断恢复
4. **停顿检测误报/漏报，反而增加焦虑** — 多信号融合（VAD/能量/上下文）；默认轻提示、可关闭；阈值可调并做短时基线校准；停顿事件用于复盘而非“打断式纠错”
5. **录制 + STT 性能抖动拖垮体验** — STT/音频处理放 Worker/AudioWorklet；UI 更新节流；增量存储与资源释放；建立性能预算并用真机压测

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Trust baseline + session model（信任基线 + 会话数据模型）
**Rationale:** 研究一致指出“隐私默认值”和“流程状态机”是后续所有能力的地基；如果一开始数据流/日志/权限 UX 不可信，后面再强的 AI 也救不回来。  
**Delivers:** 题目/场景入口 → 会话开始/结束/重录的状态机；事件日志（append-only）与本地存储 schema；渐进授权与录制状态可见性；隐私承诺落地（无第三方内容采集）。  
**Addresses:** 练习流程、隐私说明/删除、历史记录骨架（FEATURES: table stakes）  
**Avoids:** “默认本地被打破”、权限焦虑（PITFALLS 1/2）

### Phase 2: Recording MVP + pause detection MVP（录制 MVP + 停顿事件 MVP）
**Rationale:** 录制与停顿提醒是 MVP 的核心可验证点；同时也是最容易在 iOS/Safari 与性能上踩坑的部分，必须在早期建立兼容性矩阵与降级路径。  
**Delivers:** 稳定的麦克风录制（可选摄像头）与分段落盘；回放；停顿检测（先基于音量/静音/VAD）+ 事件记录 + 温和提示；阈值设置（默认 5s）。  
**Uses:** MediaDevices/MediaRecorder（必要时 WebCodecs 回退/增强）、Worker 管线、增量存储（STACK/ARCH）。  
**Implements:** MediaCapture、PauseDetector Worker、Session Orchestrator 事件落库。  
**Avoids:** iOS 长录制崩溃、性能抖动、停顿误报增焦虑、编码不兼容（PITFALLS 3/4/5/6）

### Phase 3: Transcription pipeline（本地优先转写管线 + 可插拔引擎）
**Rationale:** 结构化复盘、AI 建议都依赖文本；但转写是高复杂度与高性能敏感点，需要先“录后转写”再逐步做到实时，并从架构上保留云端增强的显式开关。  
**Delivers:** Transcription Worker + 本地引擎（whisper.cpp WASM）接入；转写段落（含时间戳）落库；断网可用；能力检测/降级（无转写→仅录制/仅文字）。  
**Addresses:** 自动转写、复盘文本、结构化建议的基础数据（FEATURES: table stakes + dependencies）  
**Avoids:** 本地承诺被 Web Speech/在线识别破坏；主线程卡顿（PITFALLS 1/5）

### Phase 4: Review loop + export/delete（复盘闭环 + 导出/清理中心）
**Rationale:** 敏感内容场景的“可控性”必须可见；复盘闭环需要把停顿事件变成可操作锚点，并提供导出给外部教练的低风险路径。  
**Delivers:** 复盘页：停顿统计、跳转到对应片段、转写整理；导出（txt/json + 音频/媒体兜底策略）；隐私中心（一键清理、存储占用提示、保留策略）。  
**Implements:** Review/Coaching（domain）、Export/Privacy（platform）。  
**Avoids:** 导出不可用/格式不兼容、隐私不信任（PITFALLS 6/1）

### Phase 5: RoleCard + coaching contract（角色卡差异化 + 建议输出契约与护栏）
**Rationale:** “角色进入”是差异化价值，但必须建立可控的输出契约与证据锚点，避免 AI 像“判卷打分”造成焦虑或不可信。建议先规则/模板可控上线，再逐步引入更强生成。  
**Delivers:** 角色卡（状态+指令+禁忌）生成（规则版→可插拔 AI）；朗读/口令；复盘建议输出契约（可执行改进点 + 例句 + 练习动作，锚定转写片段与停顿事件）；安全/合规护栏。  
**Addresses:** 差异化能力与复盘质量（FEATURES: differentiators）  
**Avoids:** AI 建议不可信/过度依赖、停顿提示像批评（PITFALLS 7/4）

### Phase Ordering Rationale

- 先锁住 **数据模型/事件日志/隐私与权限 UX**，否则后续转写、导出、指标都会变成不可维护的补丁。
- 录制与停顿提醒要尽早在真实设备跑通（尤其 iOS Safari），并建立“分段落盘 + 降级路径”，避免 v1 在关键路径上不可用。
- 转写与 AI 建议均需 Worker 化与接口可插拔，既满足默认本地隐私，又为未来“显式开关的云端增强”保留余地。
- 复盘与导出/清理必须在 v1 形成闭环，才能支撑敏感内容场景下的信任与留存。

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** 浏览器录制在 iOS/Safari 的兼容性与编码容器策略（需要明确目标浏览器矩阵与测试门槛）
- **Phase 3:** whisper.cpp WASM 在目标设备上的性能预算、模型大小/加载策略、实时性与降采样方案
- **Phase 4:** 导出格式与跨设备播放兼容（WebM/MP4 等）以及“纯本地”前提下的可行兜底方案

Phases with standard patterns (skip research-phase):
- **Phase 1:** local-first 事件日志 + 状态机 + 渐进授权/录制可见性（成熟模式，更多是执行与验收）
- **Phase 5（规则版角色卡 + 输出契约）:** 先用模板/规则可控落地，属于产品与文案/约束设计为主的常规工作

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | 关键选型合理且有官方/社区来源，但版本与兼容细节仍需结合目标浏览器矩阵验证（尤其 COOP/COEP、WebCodecs、iOS MediaRecorder） |
| Features | MEDIUM | 依赖对该类产品的常识与竞品对照，方向清晰；但对“公务员结构化面试”用户验证仍待 v1 数据支持 |
| Architecture | MEDIUM | 结构化边界与构建顺序明确，属于成熟模式；具体落地仍需结合框架目录与存储实现细节 |
| Pitfalls | MEDIUM | 风险点覆盖全面且可操作，但部分 Safari/WebKit 细节属于“需真机复现”的经验型结论 |

**Overall confidence:** MEDIUM

### Gaps to Address

- **目标浏览器/设备矩阵未明确**: 需要在规划时锁定“必须支持的最低集合”（例如：桌面 Chrome/Edge + macOS Safari + iOS Safari），并据此定义录制/转写的降级策略与验收门槛。
- **本地 STT 资源预算不确定**: 需要基于目标设备做模型加载与推理的性能测试，确定“录后转写 vs 实时转写”的默认策略与开关。
- **存储层演进路径**: IndexedDB/OPFS/SQLite WASM 的取舍需要结合实现成本与 COOP/COEP 限制；建议先以“可迁移 schema + 事件日志”锁定数据形态，再逐步替换底层存储。

## Sources

### Primary (HIGH confidence)
- Next.js 官方博客（Next.js 16.2 系列发布说明）：`https://nextjs.org/blog/next-16-2`
- MDN MediaRecorder `mimeType` / `isTypeSupported`：`https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/mimeType`
- @sqlite.org/sqlite-wasm（npm 安装与版本）：`https://www.npmjs.com/package/@sqlite.org/sqlite-wasm`
- whisper.cpp v1.8.4 release：`https://github.com/ggml-org/whisper.cpp/releases/tag/v1.8.4`

### Secondary (MEDIUM confidence)
- SQLite WASM + OPFS 官方说明（Chrome for Developers）：`https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system`
- WebCodecs 支持度（Can I use）：`https://caniuse.com/webcodecs`
- SpeechRecognition 支持度（Can I use）：`https://caniuse.com/speech-recognition`
- WebKit Bug（MediaRecorder timeslice 长录制线索）：`https://bugs.webkit.org/show_bug.cgi?id=216076`

### Tertiary (LOW confidence)
- iOS Safari 长录制崩溃社区案例（需真机验证）：`https://stackoverflow.com/questions/69996824/long-mediarecorder-video-recordings-cause-ios-safari-to-crash`
- 公务员结构化面试评分要素示例：`https://m.huatu.com/2026/0305/2852752.html`

---
*Research completed: 2026-04-09*
*Ready for roadmap: yes*
