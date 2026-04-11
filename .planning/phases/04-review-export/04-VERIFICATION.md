# Phase 4 Verification

**Date:** 2026-04-11

## Automated

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run build` — pass

## Manual / UAT notes

1. **pauseEvents.takeId：** 新录制产生的停顿行含 `takeId`，与当轮 `transcriptionJobs.takeId` 一致；**无 takeId 的历史停顿**不会出现在 `listPauseEventsForTake` 中（预期行为）。
2. **复盘页：** `/session/[id]/review/[takeId]` — 转写、停顿、媒体 seek、导出 md/txt、删本轮。
3. **会话详情：** 危险区「删除整场会话」级联清空本地相关表。
4. **AI：** 未配置 `BAILIAN_*` 时 POST `/api/review/chat` 返回 503 JSON；配置后非流式 `chat/completions`；同意门闸与 `localStorage`。
5. **百炼 Base URL：** 须包含 OpenAI 兼容路径前缀（如控制台所示）；代码在 `${BASE}/chat/completions` 发起请求。
