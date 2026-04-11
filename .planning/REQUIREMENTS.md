# Requirements: Getting Into Character（面试角色排练）

**Defined:** 2026-04-09  
**Last requirement pass:** 2026-04-11（明确 RECD-03 录制中实时预览 + 可拖拽验收）  
**Core Value:** 用户能在面试前快速进入角色并稳定输出表达

## v1 Requirements

### Entry（入口/会话）

- [ ] **ENTR-01**: 用户能选择“公务员面试”并创建一场新的排练会话
- [ ] **ENTR-02**: 用户能开始/结束/重录一次排练会话（状态清晰可见）
- [ ] **ENTR-03**: 用户能查看历史排练会话列表并再次打开复盘

### RoleCard（角色卡）

- [ ] **ROLE-01**: 用户能输入/选择角色状态（如“自信/侃侃而谈/冷静”）与触发物（如“一支笔”）
- [ ] **ROLE-02**: 系统能生成“角色卡文本”，至少包含：状态描述、可执行表达指令、禁忌（避免自我否定等）
- [ ] **ROLE-03**: 系统提供“朗读模式”，引导用户大声读出角色卡以巩固进入角色

### Scene（场景背景）

- [x] **SCEN-01**: 排练页展示面试场景背景（支持使用离线生成的视频背景）
- [x] **SCEN-02**: 用户可上传自己的背景素材并在排练页使用

### Recording（录制）

- [x] **RECD-01**: 用户可授权并录制麦克风音频（至少音频录制稳定可用）
- [x] **RECD-02**: 用户可启用摄像头画面录制（可选项，权限按需请求）
- [ ] **RECD-03**: 排练页存在**可拖拽移动**的「录制预览区」：**自点击「开始录制」起至「结束录制」止**，当用户已启用摄像头或屏幕/窗口共享时，该区域须**持续显示与采集同源**的实时画面（不得仅在录制结束后才出现画面）；仅麦克风、无视频轨时可显示占位说明。拖拽改变位置**不得**中断录制或导致已采集内容丢失。
- [x] **RECD-04**: 用户可回放本次录制内容（至少音频可回放；若有视频则同步回放）

### STT（语音转写）

- [ ] **STT-01**: 系统可将练习语音转写为文本并与会话关联保存
- [ ] **STT-02**: 转写文本包含基本时间信息（至少能定位到大致时间段/片段）
- [ ] **STT-03**: 默认策略为本地处理/不上传（清晰说明且有可验证的行为约束）

### Pause（停顿提醒与记录）

- [x] **PAUS-01**: 系统能检测长时间停顿并在屏幕上温和提示“保持角色继续表达”
- [x] **PAUS-02**: 每次停顿事件会被记录（包含开始时间、持续时长、阈值）
- [x] **PAUS-03**: 用户可在设置中配置停顿阈值（默认 5 秒），并可关闭提示

### Review（复盘与建议）

- [ ] **REVI-01**: 复盘页展示：转写文本、停顿事件列表（可跳转到对应时刻/片段）
- [ ] **REVI-02**: 用户可在“AI 复盘输入框”里输入题目/答案/补充信息（可选），一键得到改进建议
- [ ] **REVI-03**: 建议输出至少包含：可执行改进点 + 示例句式/表达范例，并引用转写片段/停顿事件作为依据

### Privacy（隐私与可控）

- [ ] **PRIV-01**: 用户可一键删除单次会话的全部数据（录制/转写/事件/建议）
- [ ] **PRIV-02**: 应用提供隐私说明：默认本地处理，不上传内容（并在 UI 中可见）
- [ ] **PRIV-03**: 用户可导出本次答题文本（txt 或 markdown）用于外部复盘

### Settings（设置）

- [x] **SETT-01**: 设置页提供停顿阈值、提示开关、背景来源（离线/上传）等基础配置

## v2 Requirements

### Interview（更多面试类型）

- **INTR-01**: 支持更多面试类型模板（校招/企业结构化/英语面试）

### Coaching（进阶教练）

- **COCH-01**: 基于“公务员结构化面试评分维度”生成结构化评分面板（表达/逻辑/要点覆盖）
- **COCH-02**: 支持模拟追问（多轮压力面试）

### Sync（同步与多端）

- **SYNC-01**: 可选云端同步（端到端加密、选择性上传）

## Out of Scope

| Feature | Reason |
|---------|--------|
| 多类型大而全的面试库 | v1 聚焦公务员面试，先验证闭环价值 |
| 默认云端存全量音视频 | 与“默认本地处理/不上传”的信任主张冲突 |
| 社交排行榜/公开分享社区 | 隐私与偏航风险高，非核心价值 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENTR-01 | Phase 1 | Pending |
| ENTR-02 | Phase 1 | Pending |
| ENTR-03 | Phase 1 | Pending |
| ROLE-01 | Phase 5 | Pending |
| ROLE-02 | Phase 5 | Pending |
| ROLE-03 | Phase 5 | Pending |
| SCEN-01 | Phase 2 | Complete |
| SCEN-02 | Phase 2 | Complete |
| RECD-01 | Phase 2 | Complete |
| RECD-02 | Phase 2 | Complete |
| RECD-03 | Phase 2 | Open（2026-04-11 补充实时预览 + 拖拽验收口径） |
| RECD-04 | Phase 2 | Complete |
| STT-01 | Phase 3 | Pending |
| STT-02 | Phase 3 | Pending |
| STT-03 | Phase 3 | Pending |
| PAUS-01 | Phase 2 | Complete |
| PAUS-02 | Phase 2 | Complete |
| PAUS-03 | Phase 2 | Complete |
| REVI-01 | Phase 4 | Pending |
| REVI-02 | Phase 4 | Pending |
| REVI-03 | Phase 4 | Pending |
| PRIV-01 | Phase 4 | Pending |
| PRIV-02 | Phase 1 | Pending |
| PRIV-03 | Phase 4 | Pending |
| SETT-01 | Phase 2 | Complete |

**Coverage:**
- v1 requirements: 25 total（其中 RECD-03 已升级验收口径，待按新标准复验）
- Mapped to phases: 25
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-09*  
*Last updated: 2026-04-11 — RECD-03 明确「录制中实时预览 + 可拖拽」*
