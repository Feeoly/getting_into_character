---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Ready to plan
last_updated: "2026-04-10T14:33:33.275Z"
progress:
  total_phases: 5
  completed_phases: 1
  total_plans: 2
  completed_plans: 2
  percent: 100
---

## Project Reference

- **Name**: Getting Into Character（面试角色排练）
- **Core Value**: 用户能在面试前快速进入角色并稳定输出表达
- **Constraints**:
  - Web 优先
  - 默认本地处理/不上传
  - 支持离线视频背景 + 用户上传

## Current Position

Phase: 2
Plan: Not started

- **Current phase**: 0 (Roadmap created, not started)
- **Current plan**: -
- **Status**: Not started
- **Progress**: \[--------------------] 0%

## Phase Tracking

| Phase | Name | Status | Notes |
|------:|------|--------|-------|
| 1 | 信任基线与会话骨架 | Not started | 本地优先数据流 + 权限/状态可见性 + 会话创建/历史 |
| 2 | 排练页录制与停顿事件 MVP | Not started | 背景 + 录制回放 + 停顿提醒/记录 + 设置 |
| 3 | 本地转写管线（可插拔引擎） | Not started | 转写文本 + 时间信息 + 默认不上传 |
| 4 | 复盘闭环 + 导出/删除 | Not started | 复盘页跳转锚点 + AI 建议 + 导出/清理 |
| 5 | 角色卡差异化 + 证据锚定建议 | Not started | 角色卡生成 + 朗读模式 |

## Performance Metrics (Lightweight)

- **Local-first trust checks**: pending
- **Recording stability gate (3–5 min)**: pending
- **iOS Safari coverage**: pending
- **Offline flow**: pending

## Accumulated Context

### Decisions (active)

- v1 聚焦公务员面试
- 角色卡包含“状态 + 指令 + 禁忌”
- 默认本地处理录屏/音频/转写，不上传
- 停顿阈值可配置，默认 5 秒
- 背景支持离线生成视频 + 上传

### Risks / Watchouts

- 隐私承诺被在线识别/第三方链路破坏
- 权限弹窗与录制可见性不足引发不安全感
- iOS Safari 长录制稳定性与文件损坏
- 停顿检测误报造成更焦虑
- 录制 + 转写的性能抖动拖垮交互

### TODO (product)

- 明确“必须支持”的设备/浏览器最小矩阵（尤其 iOS Safari）
- 定义“断网也能跑通”的验收路径（含转写的默认策略）

## Session Continuity

- **Next command**: `/gsd-plan-phase 1`
- **Notes for next session**:
  - Phase 1 把“权限/状态可见性 + 本地存储/事件模型 + 隐私文案可见”当成验收门槛

### Session

- **Stopped at**: Phase 1 UI-SPEC approved
- **Resume file**: `.planning/phases/01-trust-baseline/01-UI-SPEC.md`
