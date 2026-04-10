# Phase 01: 信任基线（trust-baseline）- Research

**Researched:** 2026-04-10  
**Domain:** 本地优先会话骨架（Web app）  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

## Implementation Decisions

### 信息架构（入口/列表）
- **D-01:** Phase 1 首页采用**介绍/引导页**作为第一屏，再进入“新建会话”（而不是直接把新建置顶）。
- **D-02:** 历史会话列表展示字段：**场景**、**创建时间**、**状态（未开始/进行中/已结束）**。
- **D-03:** 历史列表预留两列（可先显示 `—` 或隐藏值）：**时长**（Phase 1 先占位，后续录制/练习后补齐）与**备注/名称**。

### 本地优先/隐私信任
- **D-04:** 隐私说明采用**贴近关键动作的内联提示**（例如“开始/新建”按钮附近），不做顶部常驻 banner、不做首次弹窗打断。

### 本地数据保存策略
- **D-05:** 默认**永久本地保留**会话记录；用户后续可手动删除（删除能力在 Phase 4 实现）。
- **D-06:** Phase 1 **不提供“一键清空所有历史”**入口（避免引入额外 UX/风险；未来如需要可在 Phase 4/设置页加入）。

### Claude's Discretion
- 引导页文案与布局密度（在不改变上述信息架构的前提下）
- 历史列表的默认排序（如按创建时间倒序）
- “备注/名称”的录入方式（创建时填写 vs 创建后编辑），以最少打断为准
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ENTR-01 | 用户能选择“公务员面试”并创建一场新的排练会话 | 定义 `Session` 数据模型 + 本地持久化（Dexie/IndexedDB）+ “创建会话”写入与列表刷新模式 |
| ENTR-02 | 用户能开始/结束/重录一次排练会话（状态清晰可见） | 定义状态机（not_started / in_progress / ended）+ 原子更新事务 + UI 状态呈现与可追溯字段（startedAt/endedAt） |
| ENTR-03 | 用户能查看历史排练会话列表并再次打开复盘 | 列表查询与排序策略 + 路由（`/session/[id]`）+ “只读复盘壳”页面骨架（Phase 1 不含转写/录制内容） |
| PRIV-02 | 应用提供隐私说明：默认本地处理，不上传内容（并在 UI 中可见） | UI-SPEC/CONTEXT 约束：隐私说明内联靠近主 CTA；同时建议做“可验证”的网络零依赖路径（禁用默认遥测/外链） |
</phase_requirements>

## Summary

Phase 1 的“信任基线”不是功能堆叠，而是让用户在**第一屏就能理解隐私承诺**，并且能在**断网/无账号**的前提下完成会话的创建、开始/结束、历史列表与再次打开（复盘壳）。这要求：数据模型先立稳、状态可见、写入/读取链路足够简单且可验证。

当前仓库还未初始化应用代码（未发现 `package.json` 等前端工程入口）[VERIFIED: repo scan]，因此研究重点放在：规划时应先落地“最小可迁移”的本地存储层与路由/页面骨架，并把隐私说明作为 UI 合同的一部分，而不是后贴的说明页。

**Primary recommendation:** Phase 1 以 **Next.js + TypeScript** 建立最小应用壳，使用 **IndexedDB（Dexie）** 存会话与状态，抽象 `SessionRepository` 以便后续迁移到 SQLite/OPFS；隐私文案严格按 UI 合同贴近主 CTA 展示。

## Project Constraints (from .cursor/rules/)

- **GSD 工作流约束**：除非用户明确要求绕过，否则不要直接修改仓库；应通过 GSD 工作流入口保持规划/执行产物同步。[VERIFIED: .cursor/rules/gsd.md]

## Standard Stack

> 说明：以下版本均以本机 `npm view` 结果为准。[VERIFIED: npm registry]

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.3 | 路由/构建/部署与应用骨架 | App Router 生态成熟，适合做离线优先的多页壳与渐进增强。[VERIFIED: npm registry] |
| React | 19.2.5 | UI 渲染 | 与 Next.js 配套的主流 UI 层。[VERIFIED: npm registry] |
| TypeScript | 6.0.2 | 类型安全 | 状态机 + 本地存储 + 路由数据能更稳定演进。[VERIFIED: npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Dexie | 4.4.2 | IndexedDB 封装（schema/事务/查询） | Phase 1 会话/状态本地持久化；后续可作为轻量存储或迁移桥梁。[VERIFIED: npm registry][CITED: dexie.org/docs/Tutorial/Hello-World] |
| Zod | 4.3.6 | 数据校验 | 写入本地 DB 前校验 `Session` 结构，降低未来升级/迁移的脏数据风险。[VERIFIED: npm registry] |
| Zustand | 5.0.12 | 轻量状态管理 | 用于 UI 级状态（当前会话、筛选、临时编辑字段），避免把持久化当作 UI 状态源。[VERIFIED: npm registry] |
| Tailwind CSS | 4.2.2 | 样式 | 与后续可能引入的 shadcn/ui 兼容；Phase 1 可先用简单 class 达成 UI-SPEC。[VERIFIED: npm registry] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dexie（IndexedDB） | `@sqlite.org/sqlite-wasm` + OPFS | 更强查询/结构化能力，但引入 COOP/COEP、Worker 与存储后端复杂度；对 Phase 1（仅会话列表）收益不明显。[ASSUMED] |
| Next.js | Vite + React Router | 若确认 v1 完全静态离线且不需要 Next 的路由/构建约定，可更轻；但项目栈推荐已倾向 Next（见 `.planning/research/STACK.md`）。[VERIFIED: repo docs] |

**Version verification (latest publish time):**
- next `16.2.3` modified `2026-04-10T08:51:26.487Z` [VERIFIED: npm registry]
- react `19.2.5` modified `2026-04-09T16:43:37.214Z` [VERIFIED: npm registry]
- tailwindcss `4.2.2` modified `2026-04-07T09:39:47.816Z` [VERIFIED: npm registry]
- dexie `4.4.2` modified `2026-03-31T12:09:01.577Z` [VERIFIED: npm registry]
- zustand `5.0.12` modified `2026-03-16T02:43:50.620Z` [VERIFIED: npm registry]
- zod `4.3.6` modified `2026-01-25T21:51:57.252Z` [VERIFIED: npm registry]

**Installation:**

```bash
npm install next react react-dom
npm install dexie zustand zod
npm install -D typescript tailwindcss
```

## Architecture Patterns

### Recommended Project Structure

基于 Next App Router 的常见结构（示例课程中 `/app`、`/app/lib`、`/app/ui` 的划分）[CITED: nextjs.org/learn/dashboard-app/getting-started]：

```
src/
├── app/
│   ├── page.tsx              # 引导/入口页（第一屏）
│   ├── session/
│   │   ├── new/page.tsx      # 新建会话
│   │   └── [id]/page.tsx     # 会话详情/复盘壳
│   ├── _lib/                 # 纯业务与数据层（不含 UI）
│   │   ├── db.ts             # Dexie 初始化
│   │   ├── sessionRepo.ts    # SessionRepository
│   │   └── types.ts          # Session 类型 + Zod schema
│   └── _ui/                  # 仅 UI 组件（列表行、状态徽标、空态）
├── public/
└── ...
```

### Pattern 1: 持久化与 UI 状态解耦
**What:** 把“会话真相来源”放在本地数据库层（Dexie），UI 只持有“当前选择/编辑中字段”等瞬态状态。  
**When to use:** 历史列表、状态切换、再次打开等需要一致性的地方。  
**Example (Dexie schema):** [CITED: dexie.org/docs/Tutorial/Hello-World]

```typescript
import Dexie, { type Table } from "dexie";

export type SessionStatus = "not_started" | "in_progress" | "ended";

export type Session = {
  id: string;
  scene: "civil_service";
  createdAt: number;
  status: SessionStatus;
  startedAt?: number;
  endedAt?: number;
  name?: string;
  durationSec?: number; // Phase 1 可空/占位
};

export class AppDB extends Dexie {
  sessions!: Table<Session, string>;

  constructor() {
    super("gic-db");
    this.version(1).stores({
      sessions: "id, createdAt, status, scene",
    });
  }
}
```

### Pattern 2: 会话状态机最小闭环（ENTR-02）
**What:** 状态仅允许：`not_started -> in_progress -> ended`；“重录”建议用“新建一次 attempt（新 session）”而不是回写覆盖历史。  
**When to use:** 用户对“我做过什么”敏感的信任场景（覆盖历史会削弱可追溯性）。  
**Notes:** “重录”语义在需求中未细化；若产品期望“同一条记录反复重录”，需要在计划中明确并补充字段（如 `attempt`）。[ASSUMED]

### Anti-Patterns to Avoid
- **把隐私说明做成首次弹窗或全局 banner**：与 D-04 冲突，且会抢占主 CTA 与增加打断。[VERIFIED: 01-CONTEXT.md]
- **把会话状态只放在内存 store**：刷新即丢失，无法满足断网/重开后的“状态清晰可见”。[ASSUMED]
- **“开始”即创建**：与 D-01（先引导再新建）与 ENTR-01（明确创建动作）容易混淆，规划时应拆成两个动作与两个页面/组件态。[ASSUMED]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB 读写/事务/索引 | 自己封装原生 IndexedDB callback API | Dexie | IndexedDB 细节多、浏览器实现差异与坑多；Dexie 提供事务与更友好的 schema/查询。[CITED: dexie.org/docs/Tutorial/Hello-World] |
| 数据结构校验与升级容错 | 靠“随便存 JSON” | Zod schema + 迁移策略 | Phase 1 写入的数据会成为后续 Phase 的负债；校验能降低升级成本。[ASSUMED] |

## Common Pitfalls

### Pitfall 1: “默认不上传”承诺被隐形网络请求破坏
**What goes wrong:** 页面加载/运行时出现第三方请求（字体、分析、错误上报），用户断网或抓包时发现“仍在联网”。  
**Why it happens:** 默认引入外链字体、analytics、error reporter；或 Next 默认行为/插件带来请求。  
**How to avoid:** Phase 1 规划里加入“网络零依赖验收项”：断网仍可创建/开始/结束/列表可见；同时避免引入第三方脚本与外链资源（字体先用 system-ui）。[ASSUMED][VERIFIED: 01-UI-SPEC.md(font system-ui)]
**Warning signs:** DevTools Network 出现 `google-analytics`、`sentry`、外链字体等。

### Pitfall 2: 状态更新时间不原子导致列表闪烁/错乱
**What goes wrong:** 点击“结束”后列表状态未更新或刷新后回退。  
**Why it happens:** 多处写入，或 UI 先乐观更新但持久化失败。  
**How to avoid:** 用单一 `SessionRepository`，把写入放在事务里；UI 从 DB re-fetch（或订阅）后渲染。[ASSUMED]

### Pitfall 3: “重录”语义不清导致数据模型返工
**What goes wrong:** 先做“覆盖旧记录”，后续想保留历史对比时无法恢复。  
**How to avoid:** 规划时明确：重录=创建新会话（推荐）；或引入 `attempt`/`parentId` 等字段。[ASSUMED]

## Environment Availability

Step 2.6: SKIPPED（本 Phase 研究层面不依赖外部服务；仅需 Node/npm，本机已可用：node `v22.22.0`、npm `11.11.0`）[VERIFIED: local environment]

## Security Domain

> 本项目的“安全/隐私”更多是**信任承诺的可验证性**：默认本地处理、不上传，以及对浏览器存储权限/空间等失败路径的清晰提示。[VERIFIED: REQUIREMENTS.md PRIV-02][VERIFIED: UI-SPEC copy]

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | Phase 1 无登录/鉴权。[VERIFIED: phase scope] |
| V3 Session Management | no | 非 web 登录 session；这里的“会话”是业务 session。[VERIFIED: REQUIREMENTS.md] |
| V4 Access Control | no | Phase 1 无多用户/权限域。[VERIFIED: phase scope] |
| V5 Input Validation | yes | 用 Zod 校验本地持久化的数据结构与 UI 输入（名称/备注等）。[VERIFIED: npm registry] |
| V6 Cryptography | no | Phase 1 不涉及加密/上传；若未来做可选云同步，再单独设计端到端加密。[VERIFIED: REQUIREMENTS.md SYNC-01(out of scope for v1)] |

### Known Threat Patterns for this phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| 意外外链请求（资源/遥测）导致隐私承诺破产 | Information Disclosure | 禁用第三方脚本/外链字体；断网验收；明确列出“本地-only”路径。[ASSUMED] |
| 本地存储异常（空间不足/权限）导致数据丢失引发不信任 | Denial of Service | 明确错误态文案与恢复路径（刷新/检查存储权限/空间）。[VERIFIED: UI-SPEC Error state] |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 直接用 localStorage 存复杂对象 | IndexedDB（Dexie）做结构化存储 | — | 更可靠的事务/索引与更低“数据债”风险。[ASSUMED] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Phase 1 采用 Dexie/IndexedDB 作为本地持久化层 | Standard Stack / Don’t Hand-Roll | 若决定直接上 SQLite/OPFS，需要重写存储层与部署要求 |
| A2 | “重录”推荐实现为“创建新 session（新 attempt）” | Architecture Patterns / Pitfalls | 若产品希望覆盖同一条记录，需要不同字段与 UI 交互 |
| A3 | 需要把“断网可用/无外链请求”作为信任验收项 | Common Pitfalls / Security Domain | 若不要求可验证，会更容易引入第三方依赖并削弱信任 |

## Open Questions

1. **“重录”在产品上到底意味着什么？**
   - What we know: 需求写了“开始/结束/重录”。[VERIFIED: REQUIREMENTS.md]
   - What's unclear: 是覆盖同一条，还是生成新的 attempt。
   - Recommendation: 规划阶段固定语义；若不确定，优先新建 attempt（保留历史）。

2. **Phase 1 是否需要“会话详情页”的最小骨架？**
   - What we know: ENTR-03 要“再次打开复盘”。[VERIFIED: REQUIREMENTS.md]
   - What's unclear: 复盘页壳是同一路由还是单独页面。
   - Recommendation: 先做 `/session/[id]` 的只读壳（展示场景/状态/时间 + 隐私说明），后续 Phase 填充录制/转写/事件。

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view ...`) — next/react/typescript/tailwindcss/dexie/zustand/zod/idb 版本与发布时间 [VERIFIED: npm registry]
- Next.js Learn（App Router 入门、项目结构）[CITED: https://nextjs.org/learn/dashboard-app/getting-started]
- Dexie 文档摘要（schema/事务/TS 支持）[CITED: https://dexie.org/docs/Tutorial/Hello-World]

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md`（项目推荐栈与取舍）[VERIFIED: repo docs]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH（版本来自 npm；结构来自官方 Next Learn）
- Architecture: MEDIUM（仓库未初始化，具体目录/实现仍需在 PLAN 中落地）
- Pitfalls: MEDIUM（结合隐私承诺与常见 Web 工程风险，但部分为假设）

**Research date:** 2026-04-10  
**Valid until:** 2026-05-10

