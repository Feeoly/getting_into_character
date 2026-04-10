---
phase: 02-mvp
plan: 02
subsystem: rehearsal
tags: [recording, mediarecorder, permissions, playback, draggable]
requires: [SCEN-01, SCEN-02, PAUS-03, SETT-01]
provides: [RECD-01, RECD-02, RECD-03, RECD-04]
affects:
  - src/app/session/[id]/rehearsal/_lib/recording.ts
  - src/app/session/[id]/rehearsal/_ui/RecorderPanel.tsx
  - src/app/session/[id]/rehearsal/_ui/PreviewDraggable.tsx
  - src/app/session/[id]/rehearsal/page.tsx
completed_at: "2026-04-10"
---

# Phase 02 Plan 02: 录制与回放 + 可拖拽预览窗 Summary

基于浏览器标准（`getUserMedia` + `MediaRecorder`）实现**至少音频的稳定录制与回放**；摄像头保持 **opt-in**（来自设置开关，且只在点击开始录制时请求权限）；提供**底部中间默认位置**的可拖拽预览窗，移动端默认可收起。

## What Shipped

- **录制控制器**（运行时 MIME 探测 + 分片收集 + 清理）：
  - `pickBestMimeType()`：基于 `MediaRecorder.isTypeSupported()` 选择可用 `mimeType`
  - `startRecording({ cameraEnabled })`：仅在调用时请求权限；默认仅音频；摄像头开关为 true 时请求音频+视频
  - `stopRecording()`：停止 recorder，合并 chunks→Blob，返回 object URL，并停止 tracks / 清理 URL
- **录制控制台**：开始/结束、计时、错误提示、录后回放（audio/video）
- **可拖拽预览窗**：
  - 默认底部中间
  - Pointer Events 拖拽 + 边界约束（避免拖出屏幕）
  - 移动端默认收起，可展开
- **排练页集成**：读取设置的 `cameraEnabled` 并驱动录制流程；拖拽行为不影响录制生命周期

## Verification

- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Commits

- `2a8b86b`：feat(02-mvp-02): add MediaRecorder recording controller
- `19f46db`：feat(02-mvp-02): add recorder panel and draggable preview
- `785194b`：Revert "feat(02-mvp-02): add recorder panel and draggable preview"
- `d8ecf4c`：Revert "Revert "feat(02-mvp-02): add recorder panel and draggable preview""

## Deviations from Plan

- **[Rule 1 - Bug] 处理一次误操作导致的提交历史噪音**
  - **Issue**: 误用 `revert` 回滚了 UI 变更
  - **Fix**: 通过 “revert revert” 恢复 Task 2 的预览窗与录制面板变更
  - **Impact**: 代码结果与计划一致；仅提交历史多了两条 revert 记录

## Known Stubs

- 无（录制/回放链路与预览窗已接通；停顿检测将在 Plan 03 实现）

## Self-Check: PENDING

## Self-Check: PASSED

- FOUND: `.planning/phases/02-mvp/02-02-SUMMARY.md`
- FOUND: commit `2a8b86b`
- FOUND: commit `19f46db`
- FOUND: commit `785194b`
- FOUND: commit `d8ecf4c`

