---
phase: 02-mvp
plan: 03
subsystem: rehearsal
tags: [pause, web-audio, local-first, dexie]
requires: [SCEN-01, SCEN-02, RECD-01, RECD-02, RECD-03, RECD-04, PAUS-03, SETT-01]
provides: [PAUS-01, PAUS-02]
affects:
  - src/app/_lib/db.ts
  - src/app/session/[id]/rehearsal/_lib/rehearsalRepo.ts
  - src/app/session/[id]/rehearsal/_lib/rehearsalTypes.ts
  - src/app/session/[id]/rehearsal/_lib/pauseDetector.ts
  - src/app/session/[id]/rehearsal/_ui/PauseToast.tsx
  - src/app/session/[id]/rehearsal/_ui/RecorderPanel.tsx
  - src/app/session/[id]/rehearsal/page.tsx
completed_at: "2026-04-11"
---

# Phase 02 Plan 03: 停顿检测 + 温和提示 + 事件记录 Summary

在录制进行中，使用 Web Audio 能量阈值 + 平滑检测长时间静音停顿；按设置的阈值触发**温和提示**（可关闭），并把停顿事件以 D-10 字段持久化到本地（Dexie）。

## What Shipped

- **Dexie v3 schema**：新增 `pauseEvents` 表（索引 `id, sessionId, start_ms, createdAt`）
- **停顿事件仓库接口**：
  - `addPauseEvent()`：写入前做基础数值防御；`id=${sessionId}:${start_ms}` 避免重复
  - `listPauseEvents(sessionId)`：按 `start_ms` 升序返回
- **停顿检测器**：`createPauseDetector({ stream, thresholdMs, energyFloor, smoothingMs, cooldownMs, onPauseStart, onPauseEnd })`
  - rAF 采样 analyser 时域数据 → RMS → EMA 平滑
  - 只在录制中启动，停止录制即 stop + 关闭 AudioContext
  - cooldown 避免高频提示
- **温和提示条幅**：`PauseToast`（不抢焦点，不阻塞按钮，自动消失）
- **排练页集成**：
  - 阈值使用 `settings.pauseThresholdMs`
  - 提示开关使用 `settings.pausePromptEnabled`（关闭时不展示 toast，但仍记录事件且 `prompt_shown=false`）
  - 事件字段：`start_ms/duration_ms/threshold_ms/prompt_shown/session_status` 对齐 D-10，`start_ms` 相对录制起点

## Verification

- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Commits

- `d38b409`：feat(02-mvp-03): add pause events table and repo APIs
- `588ad15`：feat(02-mvp-03): add pause detection toast and event logging

## Deviations from Plan

- None（按计划实现；并确保不记录任何停顿前后文本/语义，符合 D-11 边界）。

## Known Stubs

- 当前未提供“停顿事件列表 UI”（本计划只要求事件记录与后续复盘可用的数据基础；复盘展示在后续 Phase 实现）。

## Self-Check: PENDING

## Self-Check: PASSED

- FOUND: `.planning/phases/02-mvp/02-03-SUMMARY.md`
- FOUND: commit `d38b409`
- FOUND: commit `588ad15`

