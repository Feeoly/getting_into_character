# Phase 6：会话详情页角色卡 AI 优化以增强角色感 — 调研

**调研日期：** 2026-04-12  
**领域：** Next.js App Router 服务端路由 + 百炼 OpenAI 兼容 Chat + 客户端 IndexedDB 会话模型  
**置信度：** **中**（代码与配置已对照仓库验证；产品层「同意 key 是否共用」为推理建议，已标注）

<user_constraints>
## 用户约束（来源说明）

`.planning/phases/06-ai/` 下**尚无** `06-CONTEXT.md`。以下约束来自 **Roadmap Phase 6**、**05-CONTEXT.md**、**REQUIREMENTS.md（ROLE-01～03）** 及本题任务描述，规划阶段应与之对齐。

### 锁定决策（继承 / 本题明确）

- Phase 5 已完成：**本地模板角色卡 + 朗读流程**；Phase 6 **Depends on Phase 5**。[VERIFIED: `.planning/ROADMAP.md`]
- 05-CONTEXT **延期**：「百炼 / LLM 生成角色卡（BYOK）」放到 **Phase 6**。[VERIFIED: `.planning/phases/05-role-card/05-CONTEXT.md` §Deferred]
- 会话详情路径：`/session/[id]`；可选 **云端 LLM（百炼）** 对角色卡文本做 **润色/增强**，提升「角色感」可感知度。[VERIFIED: 本题 + `src/app/session/[id]/page.tsx` 挂载 `RoleCardReadOnly`]
- **隐私默认**：需 **明示同意**；**仅上传文本**；**不上传音频**；与既有 `/api/review/chat` 技术栈一致（`BAILIAN_API_KEY` / `BAILIAN_BASE_URL` / `BAILIAN_CHAT_MODEL`）。[VERIFIED: `src/app/api/review/chat/route.ts`；本题]

### Claude's Discretion（规划可裁量）

- 「AI 增强」按钮的精确布局、折叠区块、loading 动效、是否展示「与本地版 diff」等 UI 细节。
- 同意状态用 **独立 localStorage key** 还是与复盘 **共用**（见下文 §5 建议）。
- 增强结果是 **默认覆盖展示** 还是 **双版本切换** 的交互细节（数据层建议见 §4）。

### 延期 / 范围外（勿纳入 Phase 6）

- 05-CONTEXT：**多面试类型模板**、**复盘 AI 强制双锚定 schema** — 仍属延期/非本阶段核心。[VERIFIED: `05-CONTEXT.md` §Deferred]
- 默认云端存全量音视频、社交分享等 — 与产品信任主张冲突，见 REQUIREMENTS Out of Scope。[VERIFIED: `.planning/REQUIREMENTS.md`]

### 来自 `.cursor/rules/gsd.md` 的项目级约束（摘要）

- Web 优先；**默认本地处理/不上传** 为核心信任主张；云端宜为「可选升级」并明确上传范围。[VERIFIED: `.cursor/rules/gsd.md` 内嵌 PROJECT/STACK 摘要]
</user_constraints>

<phase_requirements>
## 阶段需求映射（ROLE-01～03）

| ID | 描述（摘要） | 与 Phase 6 的关系 |
|----|--------------|-------------------|
| ROLE-01 | 用户能输入/选择角色状态与触发物 | AI 请求可把 `roleMoodPreset` / `roleMoodCustom` / `roleTrigger` 作为 **附加上下文**（仍只发文本），帮助模型理解人物设定。[VERIFIED: `sessionTypes.ts` 字段] |
| ROLE-02 | 角色卡文本至少含：状态描述、可执行表达指令、禁忌 | **Prompt 与验收** 必须强制模型输出 **三块标题** 与 05 文案一致：`roleSectionTitles`（状态描述 / 可执行表达指令 / 禁忌）。[VERIFIED: `src/app/session/[id]/_lib/roleCopy.ts`] |
| ROLE-03 | 朗读模式巩固进入状态 | **朗读页与 TTS** 必须使用「用户最终选定的展示文本」（见 §7）；若存在本地/增强两版，需定义 `effectiveRoleCardText(session)`，避免朗读与详情展示不一致。[VERIFIED: `role/read/page.tsx` 使用 `session.roleCardText`] |
</phase_requirements>

---

## 1. 范围与成功标准（可验证）

**范围（In）**

- 在 `/session/[id]` 的角色卡区域（`RoleCardReadOnly` 或相邻区块）提供 **可选**「AI 增强 / 润色」能力：用户勾选同意后，将 **当前角色卡相关纯文本**（及可选的结构化上下文字段）POST 到服务端，由百炼返回增强稿。[VERIFIED: 现有 UI 锚点 `RoleCardReadOnly.tsx`；路由模式同 `ReviewChat` → `/api/review/chat`]
- 无 Key 时行为与复盘一致：HTTP **503** + 明确中文错误，不发起外呼。[VERIFIED: `route.ts` L44–52]

**范围（Out）**

- 不上传录音、不传转写全文（除非产品明确要求把转写拼进角色增强——**默认不应**，与「角色卡」最小上传面一致）。[本题锁定 + ASSUMED]
- 不替代 Phase 5 **离线本地生成**主路径；断网或无同意时功能静默/禁用即可。[VERIFIED: 05-CONTEXT D-03]

**可验证成功标准（建议写入 Phase 6 计划验收）**

1. **同意门闸**：未勾选同意前，增强按钮或请求入口不可用；勾选后持久化（刷新仍在），且文案明确「仅发送文字到百炼、不上传音频」。[VERIFIED: 复盘 `ReviewChat.tsx` 模式可复刻]
2. **无 Key**：未配置 `BAILIAN_API_KEY` 时，UI 展示与 `503` JSON `error` 一致或可理解的提示（可与 `sttCopy.ai.configError` 对齐风格）。[VERIFIED: `route.ts`；`sttCopy.ts` 有 `configError` 文案]
3. **ROLE-02 结构**：模型返回（或解析后）正文包含三个 `【…】` 区块，标题与 `roleSectionTitles` 一致。[VERIFIED: 标题常量出处 `roleCopy.ts`]
4. **朗读一致**：`/session/[id]/role/read` 朗读的字符串与详情页展示的「最终稿」一致。[VERIFIED: 朗读页绑定 `session.roleCardText`]
5. **失败降级**：网络/502 时保留本地稿，不损坏 IndexedDB 中已有会话；可选「重试」。[VERIFIED: API 502 分支 `route.ts` L116–117、120–125]

**代码现状备注（供规划注意）**：[VERIFIED: `buildRoleCardText.ts`]

- 当前 `buildRoleCardText` **仅拼接「状态描述」一节**；ROLE-02 要求的「可执行表达指令」「禁忌」若尚未在别处于保存前拼接进 `roleCardText`，则 Phase 6 的「对齐 ROLE-02」更依赖 **模型输出补齐三块** 或 Phase 5 补全模板。**规划时需二选一或组合**，避免验收口径漂移。

---

## 2. 与 Phase 5 本地模板的边界（fallback、何时显示 AI 按钮）

| 场景 | 行为建议 |
|------|-----------|
| 无 `roleCardText`（空会话） | **不展示** AI 增强主按钮，或置灰并提示先完成角色输入/保存（与 `page.tsx` 进入排练校验一致）。[VERIFIED: `page.tsx` L45–48] |
| 有本地 `roleCardText` | 展示「AI 增强（可选）」；默认展示 **本地稿**；增强成功后按 §4 策略切换「展示稿」。 |
| 用户拒绝同意 | 仅隐藏/禁用云端能力；本地生成、编辑、朗读 **不受影响**。[VERIFIED: 05-CONTEXT 本地优先] |
| 503 / 502 / 超时 | **Fallback** 始终回到本地 `roleCardText`（及可选「上次成功增强稿」缓存，若采用双字段模型）。[ASSUMED: UX 标准实践] |
| 重新「保存并生成」本地角色卡 | 规划需定义：**是否清空** AI 增强字段/标记，避免旧增强稿与新输入参数不一致。[ASSUMED: 需计划在 `sessionRepo` 写入路径统一策略] |

---

## 3. API 设计选项（复用 `review/chat` vs 新 route `/api/role/enhance`）与理由

**选项 A — 复用 `POST /api/review/chat`**

- **做法**：扩展 `bodySchema`（例如 `intent: "review" | "role_enhance"`）或在 `messages` 中塞入用户构造的 system message。
- **优点**：单一路由、共享 `fetch` 与流式解析逻辑。
- **缺点**：当前实现 **硬编码** 复盘教练 `systemParts`（公务员面试复盘、转写摘录约束等），与角色卡润色 **领域不同**；扩展后 `route.ts` 分支膨胀、测试矩阵交叉。[VERIFIED: `route.ts` L81–93]
- **结论**：**不推荐**作为主方案，除非接受对 `route.ts` 做明显的「多模式路由」重构并统一限额。

**选项 B — 新建 `POST /api/role/enhance`（推荐）**

- **做法**：复制 **百炼调用骨架**（Key 检测、503、`BAILIAN_*` 环境变量、`fetch` 错误处理、可选 `stream: false` 一次性 JSON），请求体用 Zod 校验：`draftText`（≤8000，与 `SESSION_SCHEMA` 对齐）、可选 `moodPreset`/`moodCustom`/`trigger` 元数据 **字符串化片段**，**禁止**音频字段。
- **优点**：契约清晰、与复盘解耦、便于独立限额与日志；前端可用 **非流式** 简化（角色卡为短文本，一次性返回即可）。[VERIFIED: 现有 `stream: false` 分支 `route.ts` L140–155]
- **缺点**：少量代码重复；可通过私有模块 `@/app/api/_lib/bailianChat.ts` 抽 `callBailianChat({ system, user, stream })` 消除。[ASSUMED: 工程折中]

**主推荐：** **选项 B** + 抽取共享百炼客户端 helper，避免两套漂移。[置信度：中 — 基于当前 `route.ts` 结构验证 + 常见 Clean URL 实践]

---

## 4. 数据模型：`roleCardAiText` / 时间戳 / 是否覆盖 `roleCardText`

**当前模型**：[VERIFIED: `sessionTypes.ts`]

- 已有：`roleCardText`、`roleCardUpdatedAt`、`roleReadAloudCompletedAt`、`roleMood*` 等。

| 方案 | 字段示例 | 优点 | 缺点 |
|------|-----------|------|------|
| **A. 覆盖 `roleCardText`** | 仅更新 `roleCardText` + `roleCardUpdatedAt` | 实现最简单；朗读/排练 **零改** | **丢失本地模板稿**；难以「一键恢复本地」；与「本地优先 + 可选云」叙事弱一致 |
| **B. 并存：本地底稿 + AI 稿** | `roleCardText`（本地/模板）、`roleCardAiText`、`roleCardAiUpdatedAt` | 可对比、可回滚、删除会话仍一次 `sessions` 记录级联 [VERIFIED: 05-CONTEXT D-04 同表扩展思路] | 需定义 **哪一字段参与排练横幅/朗读**；UI 多一步「采用」 |
| **C. 单字段 + 修订类型** | `roleCardText` + `roleCardRevision: "local" \| "ai"` + `roleCardLocalSnapshot` | 显式「当前选用」 | `roleCardLocalSnapshot` **冗余** 或与 `roleMood*` 重建逻辑重复 |

**推荐：方案 B（并存）+ 明确「展示稿」解析函数**

- 持久化：`roleCardAiText?`、`roleCardAiUpdatedAt?`（命名可微调，保持 Zod + Dexie 迁移一致）。
- 交互：默认展示 **AI 稿若存在且用户未选回本地**；提供「使用本地原版 / 使用增强版」切换（可用简单 boolean `roleCardPreferAi` 或枚举）。
- **朗读**：`role/read` 与 `speechSynthesis` 读取 **展示稿**（与详情一致），避免用户以为读的是本地稿实为增强稿。[VERIFIED: 朗读页当前读 `roleCardText` — 实现时必改为 effective 文本或写入前同步]

**Dexie**：`SESSION_SCHEMA` 与 `db.ts` 需 **版本迁移**（当前仅 `version(1)`）。[VERIFIED: `db.ts`]

---

## 5. 隐私与同意：对齐 ReviewChat 勾选、文案、503 无 Key

**复盘既有模式**：[VERIFIED: `ReviewChat.tsx`]

- `localStorage` key：`gic-ai-review-consent-v1`；勾选后才允许 `fetch`；披露 `ai.disclosure`；`ai.consentLabel` 明确仅文字上传。[VERIFIED: `sttCopy.ts` `ai.*`]

**Phase 6 建议**

- **UI 结构对齐**：同款的 `disclosure` 短说明 + checkbox + `consentRequired` 提示 + 未同意时禁用按钮。[VERIFIED: 组件结构可复用]
- **文案**：在 `sttCopy.ts` 或 `roleCopy.ts` 增加 `roleAi.*`，明确对象从「转写摘要」改为「**角色卡文本与角色设定相关文字**」，仍强调 **不上传录音**。[ASSUMED: 文案需产品审一句]
- **503**：直接展示服务端返回的 `error` 字符串（与复盘一致），并在设置页或首次失败时提示配置 `.env.local`。[VERIFIED: `route.ts` 503 文案；`sttCopy.ai.configError`]

**同意 key 是否共用**

- **共用** `gic-ai-review-consent-v1`：用户点一次同意覆盖复盘与角色卡 —— **实现省**，但法律/产品语义上「同意范围」需把角色卡纳入同一段 `consentLabel`（否则不合规风险）。[ASSUMED]
- **独立** `gic-ai-role-consent-v1`：**推荐默认值** —— 用户意图分离清晰；勾选文案可与复盘同结构但范围写明「角色卡与设定」。[ASSUMED: 产品选择]

---

## 6. Prompt 设计要点（三块结构：状态描述、可执行指令、禁忌 — 对齐 ROLE-02）

**输入建议**（全部文本，短）：

- `draftText`：当前 `roleCardText`（可能仅含状态段 —— 见 §1 备注）。
- 可选：`roleTrigger`、`roleMoodCustom`、预设气质中文标签（由 `ROLE_MOOD_LABELS` 映射）。[VERIFIED: `sessionTypes.ts`、`roleCopy.ts`]

**系统指令要点（写作约束）**

1. **输出语言**：中文。
2. **结构硬性要求**：必须输出三节，节标题 **逐字** 使用：`【状态描述】`、`【可执行表达指令】`、`【禁忌】`（与 `roleSectionTitles` 一致）。[VERIFIED: `roleCopy.ts`]
3. **角色域**：公务员结构化面试前的「入戏」角色卡；加强 **可感知角色感**（身体感、视角、说话节奏、与考官/场景关系），避免写成「答题技巧清单」跑题。[ASSUMED: 产品调性]
4. **禁忌段**：必须包含「避免自我否定、避免灾难化归因」等 05-CONTEXT 与 ROLE-02 精神；**不**输出侮辱性、医疗诊断、绝对化「必过」承诺。[ASSUMED: 安全与合规基线]
5. **忠实度**：在用户给定设定内发挥；不编造用户未提供的具体人名/经历；若信息不足，先简短假设并标注「可替换」类提示（可选）。[ASSUMED]
6. **长度**：建议模型输出总长度上限与 `roleCardText` Zod **8000** 对齐，避免入库校验失败。[VERIFIED: `SESSION_SCHEMA` `roleCardText.max(8000)` — 若 AI 入 `roleCardAiText` 也应 `max(8000)`]

---

## 7. 风险：token 限制、失败降级、朗读模式仍用最终选定文本

| 风险 | 说明 | 缓解 |
|------|------|------|
| **请求体限额** | `review/chat` 对整包 JSON 有 `MAX_BODY_CHARS = 32000`、单条 `content` 16k 等。[VERIFIED: `route.ts` L23、L6–7、L73–76] | 新 route 沿用同级或更严（角色卡更短）；服务端裁剪 + 400 明确「过长」。 |
| **502 / 网络** | `fetch` 抛错或 `!res.ok`。[VERIFIED: `route.ts` L116–125] | 前端 catch：toast/inline error；**不写入**部分结果；保留编辑权。 |
| **流式复杂度** | 复盘用 SSE 增量。[VERIFIED: `ReviewChat.tsx`] | 角色卡增强建议 **`stream: false`** 一次 `content` JSON，降低前端状态机风险。[VERIFIED: `route.ts` 已支持非流式] |
| **朗读与详情不一致** | 朗读页绑定 `roleCardText`。[VERIFIED: `role/read/page.tsx`] | 引入 **单一来源**：`getEffectiveRoleCardText(session)`；保存「采用增强版」时要么 **同步更新** `roleCardText`，要么 **改朗读页**读 effective（推荐后者 + 并存字段）。 |
| **`roleReadAloudCompletedAt` 语义** | 用户读完本地后又改 AI 稿 | 规划选择：**改稿后清除朗读完成戳**（强制重新朗读）或 **仅提示** —— 与软阻塞策略一致需产品拍板。[ASSUMED] |

---

## 8. Nyquist Validation Architecture（简短）

- `.planning/config.json` 中 `workflow.nyquist_validation` 为 **false**。[VERIFIED: `.planning/config.json` L19]
- **结论**：本阶段 **不要求** 按 Nyquist 表格补全自动化测试门闸；验收以 **手工 UAT**（§1 成功标准）为主。若后续打开 Nyquist，可为 `buildRoleCardText` / `getEffectiveRoleCardText` 与 API Zod 解析补 Vitest。[VERIFIED: config；STACK 提及 Vitest]

---

## Sources（本仓库内验证）

| 文件 | 用途 |
|------|------|
| `src/app/api/review/chat/route.ts` | 百炼调用、503、限额、流式/非流式 |
| `src/app/session/[id]/review/[takeId]/_ui/ReviewChat.tsx` | 同意门闸与 SSE 消费模式 |
| `src/app/session/[id]/rehearsal/_lib/transcription/sttCopy.ts` | `ai.*` 披露与同意文案 |
| `src/app/_lib/sessionTypes.ts` | Session 字段与 `roleCardText` 上限 |
| `src/app/session/[id]/_ui/RoleCardReadOnly.tsx` | 详情页角色卡展示入口 |
| `src/app/session/[id]/_lib/buildRoleCardText.ts` / `roleCopy.ts` | 当前本地生成与三节标题常量 |
| `.planning/phases/05-role-card/05-CONTEXT.md` | Phase 5/6 边界与延期项 |
| `.planning/config.json` | Nyquist 开关 |

## Assumptions Log（需在讨论/规划阶段确认）

| # | 假设 | 风险若错误 |
|---|------|------------|
| A1 | 角色卡 AI 使用 **独立** consent localStorage key | 若产品要求「一键同意所有云能力」则需改共用与文案 |
| A2 | 增强采用 **非流式** 即可满足体验 | 若产品强需求流式展示，则需复用 SSE 解析路径 |
| A3 | 不上传转写全文作为默认 | 若希望「结合最近一轮答题风格」润色角色，则需扩大披露与同意范围 |

## RESEARCH COMPLETE
