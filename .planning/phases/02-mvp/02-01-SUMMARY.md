---
phase: 02-mvp
plan: 01
subsystem: rehearsal
tags: [scene, settings, local-first, dexie]
requires: []
provides: [SCEN-01, SCEN-02, PAUS-03, SETT-01]
affects:
  - src/app/_lib/db.ts
  - src/app/session/[id]/page.tsx
  - src/app/session/[id]/rehearsal/page.tsx
  - src/app/session/[id]/rehearsal/_lib/rehearsalTypes.ts
  - src/app/session/[id]/rehearsal/_lib/rehearsalRepo.ts
  - src/app/session/[id]/rehearsal/_ui/SettingsDrawer.tsx
  - public/rehearsal/backgrounds/bg-1.jpg
  - public/rehearsal/backgrounds/bg-2.jpg
  - public/rehearsal/backgrounds/bg-loop.mp4
completed_at: "2026-04-10"
---

# Phase 02 Plan 01: 排练页背景 + 设置抽屉 + 本地持久化 Summary

本地优先的排练页基座：**离线预置背景（图片/循环视频）+ 上传图片背景 + 设置抽屉（停顿阈值/提示开关/背景来源/摄像头 opt-in）**，全部落在 IndexedDB（Dexie）中。

## What Shipped

- **排练页路由**：`/session/[id]/rehearsal`，会话详情页新增“进入排练”入口。
- **背景渲染**：
  - 预置图片：`bg-1.jpg`/`bg-2.jpg`
  - 预置循环视频：`bg-loop.mp4`（静音循环，离线可用）
  - 上传图片：写入 IndexedDB，渲染时使用 object URL，并在切换/卸载时 revoke
- **设置抽屉**（右上角入口）：
  - 停顿阈值（默认 5s，存储为 ms）
  - 停顿提示开关
  - 背景来源切换（预置图片/预置视频/上传图片）
  - 摄像头开关（opt-in；仅保存设置，不触发权限请求）
- **本地持久化**：
  - Dexie v2：新增 `rehearsalSettings`、`uploadedBackgrounds`
  - Zod 校验与默认值回退（阈值范围 clamp，枚举防脏数据）

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Commits

- `98705df`：feat(02-mvp-01): add rehearsal settings repo and db tables
- `b3fd903`：feat(02-mvp-01): add rehearsal page with settings and offline backgrounds

## Deviations from Plan

- None（严格按计划实现）。  
  *注：预置循环视频素材使用从公开示例下载的本地 mp4 文件，以满足“离线可播放的预置循环视频背景”。*

## Known Stubs

- `src/app/session/[id]/rehearsal/page.tsx`：页面文案提示“录制与停顿提示将在后续任务上线”。这是 Plan 01 的范围界定（录制/停顿在 02-02/02-03 实现），不影响本计划验收目标。

## Self-Check: PENDING

## Self-Check: PASSED

- FOUND: `.planning/phases/02-mvp/02-01-SUMMARY.md`
- FOUND: commit `98705df`
- FOUND: commit `b3fd903`

