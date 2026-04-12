## Phases

- [x] **Phase 1: 信任基线与会话骨架** - 本地优先的数据流、权限/状态可见性、会话创建与历史列表
- [ ] **Phase 2: 排练页录制与停顿事件 MVP** - 背景 + 录制回放 + 停顿提醒/记录 + 基础设置
- [x] **Phase 3: 本地转写管线（可插拔引擎）** - 录后转写为文本并带时间信息，默认不上传
- [x] **Phase 4: 复盘闭环 + 导出/删除** - 复盘页可基于文本/停顿快速复盘，支持导出与一键清理
- [x] **Phase 5: 角色卡差异化 + 证据锚定建议** - 角色进入（生成+朗读）；证据锚定以可执行角色卡为主（复盘 AI 见 Phase 4）
- [ ] **Phase 6: 会话详情页角色卡 AI 优化以增强角色感** - AI 润色/增强呈现，让「角色感」更可感知

## Phase Details

### Phase 1: 信任基线与会话骨架
**Goal**: 用户可以在“默认不上传”的前提下创建/管理排练会话，并且全程状态清晰可见
**Depends on**: Nothing (first phase)
**Requirements**: ENTR-01, ENTR-02, ENTR-03, PRIV-02
**Success Criteria** (what must be TRUE):
  1. 用户能创建一场“公务员面试”排练会话，并看到明确的会话状态（未开始/进行中/已结束等）
  2. 用户能开始/结束/重录一次会话，且每一步都能在界面上确认当前是否在“录制/练习中”
  3. 用户能在历史会话列表里看到并重新打开过去的会话（即使断网也可用）
  4. 应用在 UI 中清晰展示“默认本地处理、不上传内容”的隐私说明
**Plans**: 3 plans
Plans:
- [x] 01-01-PLAN.md — 初始化应用骨架 + 首页引导（内联隐私说明）+ 历史会话区域（只读）
- [x] 01-02-PLAN.md — 新建会话 + 会话状态机（开始/结束/重录）+ 会话详情/复盘壳
- [x] 01-03-PLAN.md — 全站导航（D-07～D-11）：首屏「返回首页」、次要化「返回会话」、BackToHomeLink
**UI hint**: yes

### Phase 2: 排练页录制与停顿事件 MVP
**Goal**: 用户能在排练页稳定录制（至少音频），并获得温和的停顿提示与可复盘的停顿事件
**Depends on**: Phase 1
**Requirements**: SCEN-01, SCEN-02, RECD-01, RECD-02, RECD-03, RECD-04, PAUS-01, PAUS-02, PAUS-03, SETT-01
**Success Criteria** (what must be TRUE):
  1. 用户进入排练页后能看到场景背景，并可在“离线视频背景/上传素材”之间切换使用
  2. 用户可授权并完成一次稳定的麦克风录制；若启用摄像头，也能录到可回放的画面
  3. 排练页存在可拖拽移动的录制预览区域，并且拖拽行为不影响录制的进行
  4. 用户结束录制后能回放本次内容（至少音频；有视频则同步回放）
  5. 当用户长时间停顿时，界面会出现温和提示；停顿事件会被记录且包含阈值信息；用户可在设置里调整阈值/关闭提示
**Plans**: 3 plans
Plans:
- [x] 02-01-PLAN.md — 排练页背景（预置/上传）+ 设置抽屉（阈值/开关/摄像头）+ 本地持久化
- [x] 02-02-PLAN.md — 录制与回放（至少音频）+ 摄像头 opt-in + 可拖拽预览窗
- [x] 02-03-PLAN.md — 停顿检测（能量阈值+平滑）+ 温和提示 + 停顿事件记录（字段对齐 D-10）
**UI hint**: yes

### Phase 3: 本地转写管线（可插拔引擎）
**Goal**: 用户的练习语音可转写为带时间信息的文本，并与会话关联保存，且默认不上传
**Depends on**: Phase 2
**Requirements**: STT-01, STT-02, STT-03
**Success Criteria** (what must be TRUE):
  1. 用户完成一次练习后，系统能为该会话生成转写文本并在复盘/会话中可见
  2. 转写文本包含基本时间信息，用户能定位到大致时间段/片段（用于跳转与引用）
  3. 在断网情况下，核心流程仍可运行，且转写默认不上传（用户可通过可观察行为验证：无上传依赖、无“必须联网才能转写”的路径）
**Plans**: 3 plans
Plans:
- [x] 03-01-PLAN.md — Dexie 转写表 + Zod + transcriptRepo + TranscriptionEngine + noop 占位
- [x] 03-02-PLAN.md — Worker + HF Whisper ONNX 管线 + 录制结束入队 + takeId + 替换策略落地
- [x] 03-03-PLAN.md — 会话摘要卡片 + 全文只读路由 + Toast/重试/初始化条（UI-SPEC）
**UI hint**: yes

### Phase 4: 复盘闭环 + 导出/删除
**Goal**: 用户可以基于转写与停顿事件快速复盘，并能导出/清理自己的敏感数据
**Depends on**: Phase 3
**Requirements**: REVI-01, REVI-02, REVI-03, PRIV-01, PRIV-03
**Success Criteria** (what must be TRUE):
  1. 复盘页展示转写文本与停顿事件列表，并支持跳转到对应时刻/片段进行查看/回放
  2. 用户可在 AI 复盘输入框补充题目/答案信息，一键得到改进建议
  3. 建议输出至少包含：可执行改进点 + 示例句式/表达范例，并能引用转写片段/停顿事件作为依据
  4. 用户可一键删除单次会话的全部数据（录制/转写/事件/建议），删除后在历史列表与复盘页均不可再访问
  5. 用户可导出本次答题文本为 txt 或 markdown，用于外部复盘
**Plans**: 3 plans
Plans:
- [x] 04-01-PLAN.md — Dexie pause `takeId` +录制起始 takeId + `listPauseEventsForTake`
- [x] 04-02-PLAN.md — `/review/[takeId]` 复盘页（转写/停顿/媒体 seek）+ 导航入口
- [x] 04-03-PLAN.md — 导出/级联删除 + 百炼 Chat API + ReviewChat（同意门闸）
**UI hint**: yes

### Phase 5: 角色卡差异化 + 证据锚定建议
**Goal**: 用户能通过角色卡快速进入“可执行的表达角色”，并通过朗读模式巩固进入状态
**Depends on**: Phase 4
**Requirements**: ROLE-01, ROLE-02, ROLE-03
**Success Criteria** (what must be TRUE):
  1. 用户能输入/选择角色状态与触发物，并在开始练习前看到明确的输入结果
  2. 系统生成可朗读的角色卡文本，至少包含：状态描述、可执行表达指令、禁忌
  3. 系统提供朗读模式，引导用户大声读出角色卡，并在结束朗读后返回练习流程继续使用该角色
**Plans**: 2 plans
Plans:
- [x] 05-01-PLAN.md — Dexie v6 + Session 角色字段 + buildRoleCardText + sessionRepo
- [x] 05-02-PLAN.md — 详情页 RoleCardSection + /role/read 朗读 + 排练软阻塞
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 信任基线与会话骨架 | 3/3 | Complete | 2026-04-11 |
| 2. 排练页录制与停顿事件 MVP | 0/0 | Not started | - |
| 3. 本地转写管线（可插拔引擎） | 3/3 | Complete | 2026-04-11 |
| 4. 复盘闭环 + 导出/删除 | 3/3 | Complete | 2026-04-11 |
| 5. 角色卡差异化 + 证据锚定建议 | 2/2 | Complete | 2026-04-11 |
| 6. 会话详情页角色卡 AI 优化以增强角色感 | 0/2 | Ready to execute | - |


### Phase 6: 会话详情页角色卡 AI 优化以增强角色感

**Goal:** 用户在会话详情页可在**明示同意**后，将当前角色卡相关**文本**发往百炼做**润色/增强**，使「角色感」更可感知；本地底稿可保留并与增强稿切换；朗读页与详情展示**同一套「展示稿」**逻辑。
**Requirements**: ROLE-01, ROLE-02, ROLE-03
**Depends on:** Phase 5
**Success Criteria** (what must be TRUE):
  1. 未勾选同意前，不能使用 AI 增强；同意文案明确仅发送角色相关文字、不上传录音。
  2. 未配置 `BAILIAN_API_KEY` 时，行为与复盘一致（503 / 可理解提示）。
  3. 增强结果（或解析后）正文包含与 `roleCopy` 一致的三节标题：**状态描述**、**可执行表达指令**、**禁忌**。
  4. `/session/[id]/role/read` 朗读与详情区展示的「展示稿」一致（`getEffectiveRoleCardText`）。
  5. 失败时保留本地稿，IndexedDB 不因请求失败而损坏。
**Plans:** 2 plans

Plans:
- [ ] 06-01-PLAN.md — Session 扩展 + `getEffectiveRoleCardText` + 共享百炼 helper + `POST /api/role/enhance`
- [ ] 06-02-PLAN.md — `sessionRepo` 写入 AI 稿/偏好；`RoleCardReadOnly` 同意门闸与增强；朗读页用 effective 文本
