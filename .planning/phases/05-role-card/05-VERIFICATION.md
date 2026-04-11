---
phase: 05-role-card
type: verification
completed_at: "2026-04-11"
---

# Phase 05: 角色卡差异化 + 证据锚定建议 — Verification

## Automated Checks

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run build` ✅

## Requirement Coverage

- **ROLE-01**：会话详情 `RoleCardSection` 可选择预设气质、补充说明、触发物；保存后生成 `roleCardText` 并可进入朗读路由
- **ROLE-02**：`buildRoleCardText` 本地纯文本模板含 **状态描述 / 可执行表达指令 / 禁忌**；Dexie v6 + `SESSION_SCHEMA` 向后兼容；`sessionRepo.saveSessionRoleCard` / `markRoleReadAloudComplete`
- **ROLE-03**：`/session/[id]/role/read` 展示全文（`pre` + `whitespace-pre-wrap`）；可选 `speechSynthesis`；「我已完成朗读」写入时间戳并返回排练流程
- **D-06（软阻塞）**：存在 `roleCardText` 且未朗读时，从详情进入排练 `confirm` 后可仍进入；无卡时提示并引导至 `#role-card-section`
- **排练页摘要**：有 `roleTrigger` 时在排练页顶栏展示「当前角色」一行（预设标签 + 自定义 + 触发物）

## Manual Spot-Checks (Suggested)

1. 会话详情填写气质与触发物 → 保存 → 确认朗读页正文为三块标题结构
2. 保存后再次编辑并保存：若实现为清空朗读完成时间，应需重新「完成朗读」（与 repo 行为一致）
3. 未完成朗读时点「进入排练」→ 出现确认文案 → 取消留在详情 / 确定进入排练
4. 无角色卡时点「进入排练」→ 提示并滚动到角色区块
5. 朗读页点「我已完成朗读」→ 回到排练页；顶栏出现当前角色摘要（若已填触发物）
