---
phase: 02-mvp
type: verification
completed_at: "2026-04-11"
---

# Phase 02: 排练页录制与停顿事件 MVP — Verification

## Automated Checks

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run build` ✅

## GSD Verifier Checks

- `verify plan-structure`（`02-01/02-02/02-03-PLAN.md`）✅
- `verify phase-completeness 02` ✅（3/3 summaries）
- `verify artifacts`（Plan 03）✅
- `verify key-links`（Plan 03）✅

## Requirement Coverage

- **SCEN-01/SCEN-02**：排练页支持预置背景（图片/离线循环视频）与上传图片切换；上传素材本地持久化
- **RECD-01..04**：点击开始才请求权限；至少音频稳定录制；摄像头 opt-in；录后可回放；拖拽预览窗不影响录制
- **PAUS-01/PAUS-02/PAUS-03**：停顿检测（阈值可配/可关提示）；温和 toast；停顿事件按 D-10 字段写入 Dexie
- **SETT-01**：设置抽屉提供阈值/提示开关/背景来源/摄像头开关

## Manual Spot-Checks (Suggested)

1. 进入任意会话详情 → 点击“进入排练”
2. 打开右上角“设置”：
   - 切换预置图片/预置视频
   - 上传一张图片并切换到“上传图片”
3. 点击“开始录制”：
   - 默认只请求麦克风权限
   - 若在设置开启摄像头，再次开始录制会请求摄像头权限
4. 录制中保持静音超过阈值：
   - 提示开关开启：出现温和提示条幅，随后自动消失
   - 提示开关关闭：不显示提示，但仍会记录停顿事件（`prompt_shown=false`）
5. 点击“结束录制”并回放本次内容（至少音频）

