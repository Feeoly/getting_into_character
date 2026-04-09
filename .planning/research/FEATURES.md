# Feature Research

**Domain:** 面试排练 / 口语表达练习 / Mock Interview（聚焦：公务员结构化面试的“角色进入”练习）
**Researched:** 2026-04-09
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 场景/题目选择与开始练习 | 用户需要“练什么”与明确起点 | LOW | v1 可固定为“公务员结构化面试”，仍需要题目/主题入口 |
| 计时与练习流程（开始/结束/重录） | 练习需要可控节奏与可重复 | LOW | 包含倒计时/计时器、练习状态机 |
| 录音/录像（至少一种）与回放 | 复盘依赖可回看 | MEDIUM | Web 端权限/兼容性与文件体积管理是主要成本 |
| 自动转写（语音转文字） | 用户希望快速看到“我到底说了什么” | HIGH | 端侧转写更难；云端更易但与默认隐私冲突 |
| 基础表达指标 | 用户期望得到可量化反馈（语速、停顿） | MEDIUM | 语速/停顿可以先不依赖大模型，基于音频/VAD + 转写时间戳 |
| 练习记录与历史回看 | 用户希望看到进步轨迹 | LOW | 本地存储即可，后续再做同步/多端 |
| 文本化复盘与改进建议 | 用户希望“怎么改”而不只是记录 | MEDIUM | 先基于转写做结构化提示词与模板化建议，再逐步增强 |
| 隐私说明与数据控制（删除/导出） | 面试内容敏感，必须可控 | MEDIUM | 明确“本地处理/不上传”为默认；提供一键删除与导出转写/片段 |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| “角色卡”（状态 + 行为指令 + 禁忌）生成与朗读模式 | 快速进入角色，把紧张外包给角色，稳定输出 | MEDIUM | 可先规则/模板生成，再引入 AI；支持“一句话口令”快速唤起 |
| 停顿提醒 + 事件记录（卡顿阈值可配） | 直接对齐“临场卡壳”痛点，形成可复盘事件 | MEDIUM | 结合 VAD/静音检测；提示要“轻量不打断节奏” |
| 公务员结构化答题框架引导（如：是什么-为什么-怎么办 / 亮点-问题-对策） | 把“会说”变成“说得有结构”，更贴近评分标准 | MEDIUM | 提供题型模板、连接词建议、段落结构检查（基于转写） |
| 评分维度对齐的复盘面板（言语表达/综合分析/应变/仪态等） | 反馈更“像考官”，更可信、更可执行 | HIGH | 需要把评分要点映射为可观测信号；可先从言语表达与结构化开始 |
| 背景氛围（离线生成视频背景 + 用户上传） | 增强沉浸，降低真实考场的陌生感 | MEDIUM | 重点在简单可用：选背景、预览、性能与权限 |
| 可移动的“摄像头小窗”与构图辅助 | 提升仪态/目光与上镜表现 | MEDIUM | 轻量实现（拖拽/缩放）+ 简单的“视线提示”即可 |
| “绕过手动整理”的 AI 复盘对话框（基于转写/停顿事件） | 低摩擦复盘，把改进建议直接落到下一次练习 | MEDIUM | 强依赖提示词与约束：避免胡编、提供可练习的改写示例 |
| 本地优先 + 可选“上传一键开 AI”（显式同意） | 同时满足隐私与更强模型能力 | HIGH | 明确开关、分层存储、加密与保留策略；避免默认上传 |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| 默认云端存储全部录屏/音频 | “多端同步/不怕丢” | 与敏感内容场景强冲突；合规与信任成本高 | 默认本地；可选手动上传单次练习并加密/限期保留 |
| 多面试类型大而全（校招/英语/企业/雅思等） | 覆盖更多用户 | 稀释核心价值，内容/题库/评分体系膨胀 | 先把“公务员结构化面试”做深；后续新增类型走独立模块 |
| 实时“耳返式”长篇提示/代答 | 让用户当场更像会说 | 容易形成依赖，且不利于真实面试；也有作弊争议 | 练习后复盘 + 结构化模板 + 下次练习的“口令/提纲” |
| 多人实时旁听/教练端直播 | “更像真面试” | 实现与运营成本高，且隐私顾虑更强 | 提供“导出片段/转写”给可信的人异步点评 |
| 强社交化的公开排行榜/公开视频库 | 激励与曝光 | 面试内容不适合公开；易引发焦虑与比较 | 私密的进步曲线 + 个人里程碑（streak/徽章） |

## Feature Dependencies

```
[练习流程/状态机]
    └──requires──> [场景/题目入口]

[录音/录像 + 回放]
    └──requires──> [浏览器媒体权限/设备选择]

[自动转写]
    └──requires──> [录音音轨] 
           └──enhances──> [练习记录与历史回看]

[停顿提醒 + 事件记录]
    └──requires──> [音频静音检测(VAD) 或 转写时间戳]

[结构化答题框架检查/建议]
    └──requires──> [转写文本]

[AI 复盘对话框]
    └──requires──> [转写文本]
           └──enhances──> [停顿事件]（把“卡住点”变成复盘锚点）

[默认本地隐私]
    └──conflicts──> [默认云端保存所有音视频]
```

### Dependency Notes

- **[录音/录像 + 回放] requires [浏览器媒体权限/设备选择]:** Web 端录制必须先拿到麦克风/摄像头权限，并处理设备切换与失败回退。
- **[结构化答题框架检查/建议] requires [转写文本]:** 没有文本就无法做要点覆盖、结构层级、连接词与条理性诊断。
- **[默认本地隐私] conflicts [默认云端保存所有音视频]:** 默认上传会显著降低使用意愿（敏感场景），并引入合规/安全/成本负担。

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] 场景/题目入口（v1 固定公务员结构化）+ 练习流程（开始/结束/重录）— 能开始一次排练
- [ ] 角色卡（状态 + 指令 + 禁忌）生成 + 练习页展示 — 验证“进入角色”是否降低紧张与停顿
- [ ] 录制（至少音频；可选视频）+ 回放 — 支撑复盘闭环
- [ ] 自动转写（本地优先）+ 输出本次答题文本 — 让复盘可操作
- [ ] 停顿提醒 + 事件记录（阈值默认 5s 可配）— 直击核心痛点并可量化
- [ ] 练习后基于转写的改进建议与示例（AI 输入框）— 降低整理成本，推动下一次练习
- [ ] 本地保存/删除/导出 — 建立隐私默认值与信任

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] 公务员结构化评分维度面板（先覆盖：言语表达 + 结构化条理）— 当用户开始复盘“想要更像考官的指标”时加入
- [ ] 背景氛围（离线生成视频背景 + 上传）— 当用户频繁复练且需要更沉浸时加入
- [ ] 仪态相关提示（构图/目光/姿态的轻量指标）— 当视频录制稳定后再做
- [ ] 进步趋势与里程碑（停顿次数、语速区间、结构化得分）— 当数据量足够后提供

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] 可选云端同步（加密、显式选择性上传）— 等到用户明确提出多端需求且信任建立
- [ ] 模拟考官追问/压力面试（多轮对话）— 复杂度高，需先验证单轮排练价值
- [ ] 人类教练市场/撮合 — 运营与合规复杂，且与“角色自助排练”主线不一致

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| 角色卡生成与练习页展示 | HIGH | MEDIUM | P1 |
| 录制 + 回放 | HIGH | MEDIUM | P1 |
| 转写（本地优先） | HIGH | HIGH | P1 |
| 停顿提醒 + 事件记录 | HIGH | MEDIUM | P1 |
| 练习后 AI 复盘建议与示例 | HIGH | MEDIUM | P1 |
| 公务员结构化答题框架引导 | MEDIUM | MEDIUM | P2 |
| 评分维度面板（对齐考官） | MEDIUM | HIGH | P2 |
| 背景氛围/素材上传 | MEDIUM | MEDIUM | P2 |
| 可选云端同步（加密/选择性上传） | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Competitor A（Mockstars/Mock Interview 平台类） | Competitor B（Orai/Yoodli 演讲教练类） | Our Approach |
|---------|--------------|--------------|--------------|
| 录制+回放 | 通常支持（多为云端存储） | 支持（多为 App/云端） | Web 优先，默认本地保存 |
| 转写 | 常见 | 常见 | 本地优先；必要时提供“可选上传开 AI” |
| 表达指标（语速/口头禅/停顿） | 常见（部分含实时反馈） | 常见（强项，含实时/会议内提示） | 先把停顿事件做扎实，语速等做基础版 |
| 题库/场景 | 多面向岗位/公司，覆盖广 | 多为场景练习 | v1 深耕公务员结构化题型与框架 |
| “角色进入”机制 | 少见 | 少见 | 核心差异化：角色卡 + 口令 + 禁忌约束 |
| 隐私默认值 | 多为默认云端 | 多为默认云端 | 默认不上传 + 数据可控（删除/导出） |

## Sources

- Mockstars features 页（mock interview 平台特征）：`https://www.mockstars.app/features`
- Orai 产品介绍（演讲教练常见指标：语速/停顿/清晰度等）：`https://orai.com/product/`
- Yoodli use cases（实时提示、指标面板等）：`https://yoodli.ai/use-cases/online-meetings`
- Toastmasters 评估表（常见演讲评价维度：清晰度、语音多样性、眼神、手势等）：`https://ccdn.toastmasters.org/medias/files/department-documents/education-documents/evaluation-resources/english/8100e3-evaluation-resource-evaluator-speech.pdf`
- 公务员结构化面试评分要素示例（表达/分析/应变/仪态等）：`https://m.huatu.com/2026/0305/2852752.html`

---
*Feature research for: 面试排练/口语练习（公务员结构化面试：角色进入）*
*Researched: 2026-04-09*

