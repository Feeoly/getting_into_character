# Pitfalls Research

**Domain:** Web 公务员面试排练（角色卡 + 浏览器录制 + 本地 STT/转写 + 停顿提示 + 复盘建议）
**Researched:** 2026-04-09
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: “默认本地处理”被暗中打破（转写走云、日志/分析泄露）

**What goes wrong:**
产品口头承诺“本地处理/不上传”，但实际在某些路径把音频/文本发到了第三方（浏览器厂商云端识别、错误上报、分析 SDK、对象存储预签名、CDN 日志等）。用户一旦察觉会立刻失信，且面试内容具有强隐私性，影响留存与口碑。

**Why it happens:**
- 直接使用 Web Speech API 的在线识别实现“最快可用”，但其实现通常是把音频发送到厂商服务器（与“本地处理”冲突）。
- 引入通用分析/错误上报工具默认采集输入框内容、控制台日志、网络请求 body。
- “导出/分享”功能实现不当，把录制文件放到公共可访问 URL。

**How to avoid:**
- 明确两条管线并在 UI 中清晰表达：
  - **纯本地模式（默认）**：录音/转写/停顿检测全部本地运行；不加载任何会采集内容的第三方脚本；导出只在本地生成文件。
  - **可选云端增强模式（显式开关）**：展示供应商、数据去向、保留期限；默认关闭。
- 转写策略建议：优先实现 **本地 STT（WASM/本地模型）**；若短期必须使用 Web Speech，则：
  - 把它包装成“在线识别（可能上传音频到浏览器厂商）”并默认不启用。
  - 进入录制前进行能力检测与清晰提示。
- 工程约束：
  - 前端禁用/隔离任何可能采集内容的 SDK（或做到“内容字段永不采集”且可验证）。
  - 实施“内容分级”日志策略：默认不记录用户输入、转写全文、音频片段；只记录匿名化事件计数与耗时。

**Warning signs:**
- 录制/转写时出现未知域名网络请求，或错误上报里出现转写文本片段。
- 用户问“你们是不是把内容上传了？”、“为什么要联网才能转写？”。
- Safari/Firefox 上转写不可用时，产品悄悄回退到在线识别而不告知。

**Phase to address:**
Phase 1（隐私与信任基线 + 数据流设计）+ Phase 2（转写实现选型与能力检测）

---

### Pitfall 2: 权限弹窗与“被录制感”导致用户焦虑/退出（UX 信任崩）

**What goes wrong:**
首次进入排练就弹麦克风/摄像头/屏幕共享权限，用户在“敏感内容 + 紧张情绪”下更容易拒绝或直接离开；即使授权成功，界面缺少明确的录制指示与停止/撤销路径，形成强烈不安全感。

**Why it happens:**
- 技术实现习惯“页面加载即请求权限”，忽略了心理安全与渐进授权。
- 录制状态与数据落地（保存到哪里、能否一键删除）缺乏可见性。

**How to avoid:**
- **渐进授权**：用户点击“开始排练/开始录制”后再请求权限；拆分麦克风/摄像头/屏幕共享为可选项，默认仅麦克风。
- **强状态可见性**：
  - 顶部常驻“正在录制/未录制”指示（含时长、输入源）。
  - 明确“一键停止”“一键丢弃本次录制”“练习后自动删除/手动保留”的策略。
- **隐私微文案**：在开始前用一句话说明“默认本地保存、不上传”，并提供“查看隐私细则”。

**Warning signs:**
- 首次会话转化率低、授权拒绝率高、开始录制后快速停止/退出比例高。
- 用户反馈“感觉被监控”“不敢说”。

**Phase to address:**
Phase 1（核心流程与权限 UX）+ Phase 3（隐私中心/本地数据管理）

---

### Pitfall 3: 浏览器录制在 iOS Safari 崩溃/失真（长录制不可用）

**What goes wrong:**
在 iOS Safari（以及 iOS 上的其他内核浏览器）长时间录制出现崩溃、生成文件损坏、播放到一半失败，或内存爆炸导致页面被系统杀死。用户最需要“连续答题”的场景被破坏。

**Why it happens:**
- iOS 浏览器对 MediaRecorder/编码器/内存更敏感；长录制 Blob 累积导致内存压力。
- `MediaRecorder.start(timeslice)` 在部分 WebKit 版本存在长录制相关问题（使用 timeslice 分片也可能触发错误）。
- 默认码率在 Safari 上可能异常偏高导致文件巨大。

**How to avoid:**
- **能力检测 + 降级策略**：
  - 录制前探测 `MediaRecorder`、`isTypeSupported()`、可用 mimeType；不支持则只提供“音频录制 + 转写”，或仅“文字排练”。
  - iOS 设备默认降低码率（`audioBitsPerSecond`/`videoBitsPerSecond`），并限制单段最大时长（例如 3–5 分钟分段录制）。
- **分段保存**：不要把整段录制一直留在内存里；分段落盘（IndexedDB/File System Access）或分段导出。
- **失败可恢复**：录制中断时保留已完成分段，提示“已保存到本地，可继续下一段”。

**Warning signs:**
- iOS 上录制 60 秒后崩溃/回到桌面；录制文件明显比预期大；播放失败。
- 内存占用随录制线性增长，GC 频繁卡顿。

**Phase to address:**
Phase 2（录制 MVP + 兼容性矩阵）+ Phase 4（鲁棒性/恢复与分段存储）

---

### Pitfall 4: “停顿检测”误报/漏报，反而增加焦虑

**What goes wrong:**
停顿提醒在用户正常思考时频繁打断，或在用户真实卡住时没触发；提示语气不当（像“你不行了”）会显著提升焦虑，破坏“进入角色”的核心价值。

**Why it happens:**
- 仅用转写结果/音量阈值判断“停顿”，忽略噪声、设备 AGC、断句习惯、口头禅、呼吸等。
- 没有为不同节奏用户提供自适应或个性化阈值。

**How to avoid:**
- **多信号融合**：结合音频能量、VAD（语音活动检测）、最近 N 秒发声比例、以及“用户正在看题/滚动/键盘输入”等上下文。
- **提示策略**：
  - 默认轻提示（视觉而非声音），避免惊吓。
  - 提示文案强调“保持角色/继续推进”，不评价个人能力。
- **自适应阈值**：前 30–60 秒做基线校准；允许快速调节（5s 默认 + 2 档快捷）。
- **复盘透明**：把停顿事件当作“标记点”，允许用户一键跳转听/读当时片段（不强迫播放）。

**Warning signs:**
- 用户在提示后立刻停止练习、关闭页面；或反馈“越提示越紧张”。
- 停顿事件分布不合理（大量集中在换行/标点处）。

**Phase to address:**
Phase 2（停顿提醒 MVP）+ Phase 5（算法/体验调优）

---

### Pitfall 5: 录制 + STT 的性能抖动拖垮“稳定输出”

**What goes wrong:**
转写/保存/渲染在主线程抢占导致卡顿，反过来引发停顿与焦虑；长会话中 CPU 飙升、风扇起飞、移动端发热掉帧，用户体验直接崩。

**Why it happens:**
- 在主线程做重计算（解码、特征提取、模型推理、Blob 拼接、长列表渲染）。
- 录制事件/转写增量更新过于频繁（每 100ms 更新 UI）。
- 资源未释放（AudioContext、MediaStream track、Object URL、IndexedDB 事务）。

**How to avoid:**
- **线程与节流**：把 STT/音频处理放到 Worker/AudioWorklet；UI 只做 250–500ms 节流更新。
- **增量存储**：分段写入而不是内存累计；避免持有巨大 Blob。
- **资源回收**：停止时显式 `track.stop()`、关闭 `AudioContext`、`URL.revokeObjectURL()`，清理定时器与事件监听。
- **性能预算**：定义“录制时最大帧丢失/最大延迟/CPU 占用”并在开发阶段用真实设备压测。

**Warning signs:**
- 录制 2–3 分钟后 UI 逐渐卡；暂停/停止按钮延迟响应；移动端发热明显。

**Phase to address:**
Phase 2（实现时就要遵守线程/节流原则）+ Phase 5（性能预算与压测）

---

### Pitfall 6: 格式/编码选择错误导致“能录不能放/不能导出”

**What goes wrong:**
在某些浏览器录出来的文件无法播放、无法在系统播放器打开、或导出后用户无法提交给教练/保存；尤其是 WebM/Opus 与 MP4/H.264/AAC 的兼容差异。

**Why it happens:**
- 假设所有浏览器都支持同一 `mimeType`，未用 `MediaRecorder.isTypeSupported()` 探测。
- 只测试了桌面 Chrome，忽略 Safari/iOS 的容器与编码限制。

**How to avoid:**
- **显式 mimeType 探测与优先级**（按浏览器动态选择），并记录到会话元数据里。
- **导出策略**：
  - MVP 允许导出“音频 + 转写文本”两种，音频优先选择兼容性更高的格式路径。
  - 若必须转码，避免在主线程用超重 FFmpeg.wasm；优先 WebCodecs（可用时）或服务器端转码（但这与隐私策略冲突，需“可选云端增强”）。

**Warning signs:**
- 用户反馈“录了但打不开”“导出失败”；同一录制在不同设备表现不一致。

**Phase to address:**
Phase 2（录制实现 + 兼容性矩阵）+ Phase 4（导出/恢复策略）

---

### Pitfall 7: “AI 复盘建议”引发过度依赖或输出不可信（信任与伦理问题）

**What goes wrong:**
AI 给出武断的评价或不合规的模板化话术，用户把建议当权威，形成误导；或用户因“被评判”更焦虑。公务员面试语境对措辞与价值导向更敏感。

**Why it happens:**
- 没有把 AI 的角色定位为“教练辅助”而不是“裁判打分”。
- 缺乏可控的输出结构与安全边界（例如鼓励极端表达、编造政策）。

**How to avoid:**
- **输出契约**：建议以“可执行改进点 + 例句 + 练习动作”为主，避免“人格评判/打分/绝对化结论”。
- **引用依据**：把建议锚定到转写片段（“你在这里停顿/重复/缺少结论句”），减少幻觉式泛泛而谈。
- **安全/合规护栏**：提示“仅供练习，不替代官方标准/个人判断”；敏感内容做拒答或改写引导。

**Warning signs:**
- 用户反馈“像被批改”“越看越焦虑”；或 AI 经常给出空泛话术。

**Phase to address:**
Phase 3（复盘框架与输出契约）+ Phase 5（质量评估与护栏迭代）

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| 直接用 Web Speech API 当“本地转写” | 立刻有转写 | 与“本地处理”承诺冲突；浏览器支持不全；不可控 | 仅在显式标注“在线识别”且默认关闭时可接受 |
| 录制全程把 Blob 留内存里，结束再一次性保存 | 实现简单 | iOS/Safari 崩溃、OOM、停止按钮延迟 | 从不（录制必须分段/流式落盘） |
| 只测桌面 Chrome | 速度快 | iOS/Safari 录制/编码/权限路径大量问题 | 仅在“纯文字模式”阶段可短期接受 |
| 每次转写增量都立刻 setState/render | UI 看似实时 | 主线程抖动、掉帧、输入延迟 | 仅在极短文本 demo，可通过节流改掉 |
| 引入默认采集的分析/回放 SDK | 快速拿到埋点/回放 | 可能采集敏感内容，信任崩 | 本项目默认不应使用；需要严格审计才可 |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| STT（本地/云端混合） | 悄悄回退到云端识别 | 明确模式开关、能力检测、显式提示数据去向；默认纯本地 |
| AI 建议（LLM） | 把转写全文原样发送，且无最小化 | 只发送必要片段/摘要；本地先脱敏；提供“仅本地复盘”选项 |
| 上传背景素材 | 直接传到公共桶/可猜 URL | 默认本地；若上传需鉴权、短期 URL、可一键删除、清晰提示 |
| 错误上报/日志 | 把转写/用户输入当作 breadcrumb | 内容字段永不采集；本地调试日志与生产分离 |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 长录制不分段 | iOS 崩溃、内存飙升、停止慢 | 分段录制/分段存储；限制单段时长 | 移动端 1–3 分钟就可能出现 |
| STT 在主线程推理 | UI 卡顿、输入延迟、掉帧 | Worker/AudioWorklet；UI 节流 | 中端设备持续 30–60 秒后明显 |
| 频繁写 IndexedDB 大对象 | 写入阻塞、事务失败 | 小块写入、队列化、背压 | 长会话或低端机更明显 |
| React 渲染转写全文每次重排 | 滚动抖动、CPU 高 | 虚拟列表/分段渲染/节流 | 转写超过几千字后 |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| “本地保存”但实际存到可被任意脚本读取的存储（无隔离/无清理） | 同机其他站点/扩展风险、共享电脑泄露 | 明确存储位置；提供一键清理；默认会话结束后提示清理 |
| 导出文件命名包含敏感信息（姓名/单位/题目） | 导出即泄露 | 默认匿名命名；可选自定义但提示风险 |
| 云端增强模式未做最小权限/最小数据 | 数据外泄面扩大 | 数据最小化、短保留、加密传输、可撤销/可删除 |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| 一上来就权限轰炸（麦克风/摄像头/屏幕） | 焦虑、拒绝、流失 | 渐进授权；默认只麦克风；解释用途与本地处理 |
| 录制状态不明显/停止不可靠 | 不安全感、恐慌 | 常驻红点/计时；“停止并丢弃”一键可达；失败恢复 |
| 停顿提示像在批评 | 更紧张、退出 | 以“保持角色/继续推进”为导向的温和提示；可关闭 |
| 复盘像“判卷打分” | 受挫、抵触 | 以可执行动作/例句/结构化建议为主，避免人格评判 |

## "Looks Done But Isn't" Checklist

- [ ] **本地隐私承诺：** 常漏掉“转写是否联网/是否发到厂商云” — 验证：断网仍可完整工作（纯本地模式）
- [ ] **录制：** 常漏掉 iOS/Safari 长录制稳定性 — 验证：真实 iPhone 连续 3–5 分钟录制不崩且可回放/导出
- [ ] **停止/退出：** 常漏掉资源释放 — 验证：停止后麦克风指示灯熄灭、CPU 回落、内存不持续增长
- [ ] **导出：** 常漏掉跨设备可播放性 — 验证：导出文件在目标设备/常见播放器可打开（至少提供“音频+文本”兜底）

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| iOS 录制崩溃/中断 | MEDIUM | 自动保存已完成分段 → 重进后提示“继续下一段” → 提供仅音频模式 |
| 转写不可用（浏览器不支持/权限拒绝） | LOW | 自动降级到“仅录制/仅文字排练” → 提供兼容浏览器指引 |
| 用户对隐私不信任 | HIGH | 提供“本地模式可验证”说明（断网可用）→ 隐私中心一键清理 → 透明数据流展示 |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 默认本地被打破（云端转写/日志泄露） | Phase 1 + Phase 2 | 抓包无第三方内容请求；断网下纯本地可用；日志不含内容 |
| 权限与被录制焦虑 | Phase 1 + Phase 3 | 首次流程拒绝率下降；录制状态可见；一键丢弃可用 |
| iOS/Safari 长录制崩溃 | Phase 2 + Phase 4 | iPhone 真机 3–5 分钟稳定；失败可恢复且保留分段 |
| 停顿检测误报增焦虑 | Phase 2 + Phase 5 | 误报率下降；提示关闭率可控；用户主观焦虑反馈改善 |
| 性能抖动影响输出 | Phase 2 + Phase 5 | 录制时 FPS/输入延迟达标；CPU/内存曲线稳定 |
| 编码格式不兼容 | Phase 2 + Phase 4 | `isTypeSupported` 覆盖；导出在主流设备可播放（有兜底） |
| AI 复盘不可信/像打分 | Phase 3 + Phase 5 | 建议可追溯到转写片段；用户满意度提升；低幻觉率 |

## Sources

- `caniuse` Speech Recognition API 支持表（用于识别浏览器支持差异）：`https://caniuse.com/speech-recognition`（LOW→MEDIUM：需结合你们实际目标浏览器再验证）
- MDN MediaRecorder `mimeType` / `isTypeSupported`（用于格式探测策略）：`https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/mimeType`（MEDIUM）
- WebKit Bug：`MediaRecorder timeslice` 长录制相关问题（Safari/iOS 风险线索）：`https://bugs.webkit.org/show_bug.cgi?id=216076`（MEDIUM）
- 社区案例：iOS Safari 长录制崩溃与体积/内存问题（需用真机复现验证）：`https://stackoverflow.com/questions/69996824/long-mediarecorder-video-recordings-cause-ios-safari-to-crash`（LOW）

---
*Pitfalls research for: Web 面试排练（录制 + STT + 复盘）*
*Researched: 2026-04-09*
