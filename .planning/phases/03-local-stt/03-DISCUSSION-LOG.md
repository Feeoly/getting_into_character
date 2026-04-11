# Phase 3: 本地转写管线（可插拔引擎）- Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in `03-CONTEXT.md`.

**Date:** 2026-04-11  
**Phase:** 3 — 本地转写管线（可插拔引擎）  
**Areas discussed:** 引擎与离线策略、触发与进度 UX、时间信息与对齐、存储与可见入口、语言范围

---

## 讨论范围选择

**User's choice:** 全选 — 引擎与离线策略、触发与进度 UX、时间信息与对齐、存储与可见入口；并**自由补充**：语音为中文、英文、中英混合。

---

## 语言与模型路径

| Option | Description | Selected |
|--------|-------------|----------|
| 单一多语离线路径 | 中英 + 中英混合共用一引擎；方言推迟 | ✓ |
| 中英分轨 | 两套管线维护成本高 | |
| 方言 v1 | 含粤语等 | |

**User's choice:** 中文、英文、混合中英 → 见 CONTEXT **D-12**（单一多语路径，方言不在 v1）。

---

## 引擎、触发、时间轴、存储/UI（合并确认）

| Option | Description | Selected |
|--------|-------------|----------|
| 拟锁定方案（见 CONTEXT D-01～D-11） | WASM 默认离线、自动入队 + 重转写、句/短段、Dexie + 会话摘要入口 | ✓ |
| 分项修改引擎 | 用户未选 | |
| 分项修改时间戳 | 用户未选 | |
| 分项修改存储/UI | 用户未选 | |

**User's choice:** **全部采纳** — 按 `03-CONTEXT.md` 写入。

---

## Claude's Discretion

- Worker/懒加载、是否提供「关闭自动转写」、重试退避等 — 见 CONTEXT **Claude's Discretion**。

## Deferred Ideas

（与 CONTEXT `<deferred>` 一致：云端默认、方言专链、完整复盘/导出/删全量。）
