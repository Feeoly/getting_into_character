---
phase: 01-trust-baseline
plan: 01-03
status: complete
created: 2026-04-11
---

# Summary — Phase 01 Plan 01-03

## What was built

- `BackToHomeLink`：`variant` 支持浅色页与排练页深色顶栏（`01-CONTEXT` D-08、D-10）
- 会话详情、新建会话：首屏顶栏「返回首页」，移除底部 `PrimaryButton` 式返回
- 复盘 / 全文转写：顶栏增加「返回首页」；「返回会话」改为 outline，与导出/重转写同级
- 排练：顶栏「返回首页」+「返回会话」；`notFound` 卡片内增加回根链
- 朗读角色卡：顶栏并列「返回首页」与「返回会话」

## Key files

### Created

- `src/app/_ui/BackToHomeLink.tsx`

### Updated

- `src/app/session/[id]/page.tsx`
- `src/app/session/new/page.tsx`
- `src/app/session/[id]/review/[takeId]/page.tsx`
- `src/app/session/[id]/transcript/[takeId]/page.tsx`
- `src/app/session/[id]/rehearsal/page.tsx`
- `src/app/session/[id]/role/read/page.tsx`

## Checks

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run build` ✅

## Notes / Deviations

- 无。短错误态仍沿用既有 `Link`；排练 `notFound` 按 D-11 增量补齐。
