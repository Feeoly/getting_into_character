---
phase: 01-trust-baseline
reviewed: 2026-04-10T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/app/page.tsx
  - src/app/session/new/page.tsx
  - src/app/session/[id]/page.tsx
  - src/app/_lib/db.ts
  - src/app/_lib/sessionTypes.ts
  - src/app/_lib/sessionRepo.ts
  - src/app/_ui/PrimaryButton.tsx
  - src/app/_ui/SessionActions.tsx
  - src/app/_ui/SessionMeta.tsx
  - src/app/_ui/SessionRow.tsx
findings:
  blocker: 0
  high: 2
  medium: 2
  low: 1
  total: 5
status: issues_found
---

## 概览

本次审查覆盖 Phase 01（trust-baseline）中与“本地优先会话创建/状态机/列表与详情页壳”相关的 UI 与仓储层实现。整体结构清晰，Repo 层用 Dexie transaction + Zod 校验能有效降低脏数据导致崩溃的风险；但仍存在少量会影响正确性/可维护性的点，建议尽快修复。

---

## High

### HI-01：`PrimaryButton` 使用 `React.ReactNode` 但未导入 React 类型（易在 TS 配置变动/严格模式下直接报错）

**证据：**
- `src/app/_ui/PrimaryButton.tsx:3-6`

**问题：**
- 组件 props 写了 `children: React.ReactNode`，但文件未 `import type React ...` 或 `import type { ReactNode } ...`。在多数 TS 配置下 `React` 命名空间并非全局，可能导致 `Cannot find namespace 'React'`。

**修复建议：**
- 改为显式导入类型，避免依赖隐式全局：

```tsx
import type { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
};
```

---

### HI-02：新建会话页 `onSubmit()` 未捕获异常，若底层抛错会导致用户无反馈

**证据：**
- `src/app/session/new/page.tsx:17-29`

**问题：**
- `try { ... } finally { setIsSubmitting(false) }` 没有 `catch`。当前 `createSession()` 按实现会吞掉 Dexie 错误并返回 `{ok:false}`，但一旦未来改动或运行时出现非预期异常（例如运行环境不支持 IndexedDB / Dexie 初始化异常），UI 不会展示错误信息，用户只能看到按钮结束加载但不知道发生了什么。

**修复建议：**
- 增加 `catch` 并设置可用的兜底提示（可复用 `storage_error` 的文案）：

```ts
    } catch {
      setError("操作失败。请刷新后重试；若仍失败，请检查浏览器存储权限或剩余空间。");
    } finally {
```

---

## Medium

### MD-01：时长展示对 `0` 的处理错误（0 秒会显示为 “—”）

**证据：**
- `src/app/_ui/SessionRow.tsx:34-35`
- `src/app/_ui/SessionMeta.tsx:27-28`

**问题：**
- 两处均使用 `session.durationSec ? ... : "—"`。当 `durationSec === 0`（例如快速开始/结束）时会被当成 falsy，显示为 “—”，与真实数据不一致。

**修复建议：**
- 改为显式判空判断：

```tsx
const dur =
  session.durationSec === undefined ? "—" : `${session.durationSec}s`;
```

---

### MD-02：`/session/[id]` 页面把 `params` 标注为 `Promise`，会误导维护者并使依赖项语义不清

**证据：**
- `src/app/session/[id]/page.tsx:11-16`
- `src/app/session/[id]/page.tsx:23-24`

**问题：**
- Next.js App Router 的 `params` 通常是同步对象（如 `{ id: string }`），这里声明为 `Promise<{id:string}>` 并 `await params`。运行时即便 `await` 一个普通对象也能工作，但类型标注与框架惯例不一致，容易造成后续误用（例如把它当成真正异步源、或在别处复制粘贴错误类型）。

**修复建议：**
- 将类型改为同步对象，并直接解构：

```ts
export default function SessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // ...
  const { id } = params;
```

---

## Low

### LO-01：`makeId()` 回退分支使用 `Math.random()`，唯一性/可预测性较差（虽为本地数据，仍建议统一改为更稳妥实现）

**证据：**
- `src/app/_lib/sessionRepo.ts:23-29`

**问题：**
- 当 `crypto.randomUUID` 不可用时使用 `${Date.now()}-${Math.random()...}`。这在极端情况下可能碰撞；同时不利于未来若把 id 暴露到 URL/导出文件时的健壮性预期。

**修复建议：**
- 优先使用 Web Crypto（若 `randomUUID` 不可用可用 `crypto.getRandomValues` 拼装），或引入轻量 id 库（如 `nanoid`）统一生成策略。

