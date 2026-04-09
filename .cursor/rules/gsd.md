<!-- gsd-project-start source:PROJECT.md -->
## Project

**Getting Into Character（面试角色排练）**

一个面向**公务员面试**的 Web 排练应用：在面试前给用户发一张“角色卡”，让用户以扮演角色的方式进行答题练习，降低紧张/焦虑对发挥的影响。应用提供面试场景背景、录屏与语音转写、卡顿提醒与记录，并在练习后基于转写内容给出复盘建议。

**Core Value:** 用户能在面试前**快速进入角色并稳定输出表达**（把表现归因到“角色”，而非“我本人”），从而更从容地完成结构化答题。

### Constraints

- **Platform**: Web 应用优先 — 覆盖面更广、进入门槛更低
- **Privacy**: 默认本地处理/不上传 — 降低用户心理负担
- **Background**: 支持离线生成视频背景 + 用户上传 — 兼顾氛围与可控性
<!-- gsd-project-end -->

<!-- gsd-stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.2.3 | Web App 框架（路由、构建、部署、SSR/CSR 混合） | 生态成熟、生产部署标准化；适合做“本地优先+可选云升级”的产品（后续可加可选 API/登录/付费），且对 PWA/静态资源/Worker 集成友好。 |
| React | 19.2.5 | UI 渲染与状态驱动 | 与 Next.js 主线兼容；适合做录制控制台（实时波形/字幕/时间线）的交互密集 UI。 |
| TypeScript | 5.x（latest） | 类型安全与复杂音视频/Worker 边界的可维护性 | 录制、转写、离线存储会引入较多异步与消息通道，TS 能显著降低回归风险。 |
| WebRTC Media Capture | Web 标准 | `getUserMedia()`/`getDisplayMedia()` 获取摄像头/麦克风/屏幕流 | 浏览器录屏/摄像头的事实标准；可本地处理，不必默认上传。 |
| MediaRecorder | Web 标准 | 录制落盘（最强兼容的“开箱录制”） | 在不追求逐帧控制时最省心；作为 WebCodecs 的兼容回退路径。 |
| WebCodecs | W3C WD（浏览器已大范围支持） | 更可控的编码/解码管线（逐帧/更好性能） | 当需要“边录边压缩/生成预览/抽帧/更稳定的时长与码率控制”时，比纯 MediaRecorder 更可控；减少对 ffmpeg.wasm 的依赖。 |
| OPFS（Origin Private File System） | Web 标准 | 高性能本地持久化（录制分片、模型文件、SQLite 文件） | 面向“本地优先隐私”的最佳存储面；比单纯 IndexedDB 更适合大文件/顺序写入。 |
| SQLite WASM（官方） | @sqlite.org/sqlite-wasm@3.51.2-build8 | 本地结构化存储（练习记录、停顿事件、转写段落、索引） | SQLite 官方 WASM + OPFS 是 WebSQL 的官方替代路径；能在本地做检索/分页/统计，且支持 Worker Promiser，避免主线程卡顿。 |
| Whisper（本地转写） | whisper.cpp@v1.8.4 | 中文语音转写（离线优先） | 可在浏览器用 WASM 跑 Whisper 系列模型，实现“默认不上传”；适合作为 v1 的本地 STT 方案，再提供可选云增强。 |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zustand | latest | 录制/转写/回放状态机与 UI 状态 | 录制状态较多（设备选择、权限、轨道、分片、字幕、错误恢复），用轻量 store 保持可控。 |
| Zod | latest | 配置与本地数据结构校验 | 本地 DB schema/导入导出/设置项（停顿阈值、语言、码率）需要严格校验，避免“脏数据”导致崩溃。 |
| @ffmpeg/ffmpeg | 12.15 | 浏览器端转码/封装（兜底工具） | 只在必须做复杂转封装/烧录字幕/格式兼容时用；优先用 WebCodecs 替代以降低体积与性能开销。 |
| shadcn/ui | v4（文档主线） | 组件基座（表单、对话框、Tabs、设置面板） | 快速搭建练习控制台、设置、历史列表；避免自己造一套可访问性组件。 |
| tailwindcss | 4.2.2 | 样式体系 | 快速迭代 UI；与 shadcn/ui 的 v4 体系一致（CSS-first 主题配置）。 |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | 4.1.4 | 单元测试/组件测试 | 录制与转写逻辑需大量纯函数/状态机测试；UI 行为可用浏览器模式补足。 |
| Playwright | latest | 端到端测试（权限弹窗/录制流程/导出） | 音视频权限、屏幕分享与回放路径更适合 E2E 验证。 |
## Installation
# Core
# Supporting
# Optional: heavy video processing (use sparingly)
# Dev dependencies
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| WebCodecs +（必要时）MediaRecorder 回退 | 以 MediaRecorder 为主、完全不碰 WebCodecs | 如果你要极致兼容/实现速度最快，且不需要逐帧控制与高性能压缩。 |
| SQLite WASM（官方 OPFS） | Dexie（IndexedDB）/localForage | 如果 v1 数据结构很简单、只做键值/列表且不需要 SQL 查询/全文索引。 |
| whisper.cpp（本地） | 云端 STT（如 OpenAI/阿里/讯飞/百度/火山等） | 如果要“更高准确率/更低端侧耗电/更快实时”，但会牺牲默认隐私；建议做“可选升级”。 |
| Next.js | Vite + React Router（纯前端） | 如果你确认 v1 完全离线、不需要任何服务端能力（即便只是可选升级）。 |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Web Speech API（SpeechRecognition）作为核心 STT | 浏览器支持不一致且多为“部分支持/默认禁用”；离线与中文体验不可控，容易在用户机器上直接不可用。 | whisper.cpp（本地 WASM）作为默认；再提供可选云 STT。 |
| WebSQL | 已被弃用并逐步移除；不可作为新项目基础。 | SQLite WASM + OPFS（官方路径）。 |
| 把 ffmpeg.wasm 当作默认视频管线 | 体积大、启动慢、对 SharedArrayBuffer/跨域隔离要求高；多数“录制+压缩+抽帧”可被 WebCodecs 覆盖。 | 优先 WebCodecs；仅在需要复杂转封装/烧录字幕时启用 ffmpeg.wasm。 |
## Stack Patterns by Variant
- 录制与转写默认走本地（WebRTC + whisper.cpp + OPFS/SQLite）
- 云端只作为“升级开关”（更准/更快/更省电），并明确告知上传范围
- 录制：MediaRecorder 优先
- 转写：提供“离线（小模型/低实时）”与“云端（高实时/高准确）”两档
- 背景渲染尽量用 Canvas/WebGL（再用 WebCodecs 编码输出）
- 不要一上来就做复杂编辑器；先满足“循环背景视频 + 轻量滤镜/字幕叠加”
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| next@16.2.3 | react@19.2.5 | Next 官方升级指引建议同步升级 react/react-dom；以同一主版本为准。 |
| @sqlite.org/sqlite-wasm@3.51.2-build8 | OPFS + SharedArrayBuffer | SQLite OPFS 后端需要 COOP/COEP（跨域隔离）以启用 SharedArrayBuffer。 |
| @ffmpeg/ffmpeg@12.15 | SharedArrayBuffer（多线程时） | 多线程 core 需要 COOP/COEP；否则只能用单线程或放弃。 |
## Sources
- Next.js 官方博客（Next.js 16.2 系列发布说明）：`https://nextjs.org/blog/next-16-2`
- npm dist-tags（Next.js/React/Tailwind 最新版本）：`https://registry.npmjs.org/next`，`https://registry.npmjs.org/react`，`https://registry.npmjs.org/tailwindcss`
- React 官方版本页：`https://react.dev/versions`
- WebCodecs 支持度（Can I use）：`https://caniuse.com/webcodecs`
- SpeechRecognition 支持度（Can I use）：`https://caniuse.com/speech-recognition`
- SQLite WASM + OPFS 官方说明（Chrome for Developers）：`https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system`
- @sqlite.org/sqlite-wasm（npm 安装与版本）：`https://www.npmjs.com/package/@sqlite.org/sqlite-wasm`
- whisper.cpp v1.8.4 release：`https://github.com/ggml-org/whisper.cpp/releases/tag/v1.8.4`
- ffmpeg.wasm v12.15 release：`https://github.com/ffmpegwasm/ffmpeg.wasm/releases/tag/v12.15`
<!-- gsd-stack-end -->

<!-- gsd-conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- gsd-conventions-end -->

<!-- gsd-architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- gsd-architecture-end -->

<!-- gsd-skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.cursor/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- gsd-skills-end -->

<!-- gsd-workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- gsd-workflow-end -->



<!-- gsd-profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- gsd-profile-end -->
