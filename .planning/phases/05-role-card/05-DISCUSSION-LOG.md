# Phase 5: 角色卡差异化 + 朗读模式 - Discussion Log

> **Audit trail only.** Decisions are in `05-CONTEXT.md`.

**Date:** 2026-04-11  
**Phase:** 5 — 角色卡差异化 + 朗读模式  
**Mode:** 非交互式 TUI（会话内由编排器根据 ROADMAP / REQUIREMENTS / PROJECT 收敛灰色决策）；你可于 plan-phase 前修订 CONTEXT。  
**Areas covered:** 入口、生成方式、持久化、朗读流程、与排练/复盘的边界  

---

## 入口与排练动线

**Synthesis:** 角色输入与生成放在 **会话详情**（CONTEXT **D-01**），经 **朗读页** 再进 **排练**；新建会话保持轻量。

---

## 角色卡生成

**Synthesis:** **本地模板拼接**（**D-03**），不引入默认云端 LLM，保证离线与不破坏隐私默认值。

---

## 持久化

**Synthesis:** **Session 行扩展字段** 为主（**D-04**）；删除会话沿用现有级联。

---

## 朗读模式

**Synthesis:** 独立路由 **朗读页**（**D-05**），可选 `speechSynthesis`；对排练 **软阻塞**（**D-06**）。

---

## 复盘 AI

**Synthesis:** 本阶段 **不强制** 向 Phase 4 Chat 注入角色卡（**D-07**）；低成本可增强列入 discretion。

---

## Deferred Ideas

- 百炼生成角色卡、强制硬门禁录制、复盘双锚定 schema — 见 CONTEXT `<deferred>`。
