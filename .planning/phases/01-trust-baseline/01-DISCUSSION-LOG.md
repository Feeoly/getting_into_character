# Phase 1: 信任基线与会话骨架 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in `01-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-10  
**Phase:** 01-信任基线与会话骨架  
**Areas discussed:** 信息架构（首页/历史/详情）, 本地优先/隐私信任 UX, 本地数据保存策略

---

## 信息架构（首页/历史/详情）

| Option | Description | Selected |
|--------|-------------|----------|
| A. 以“新建排练”为主 + 下方历史列表 | 默认路径最短，开门见山 |  |
| B. 以“继续上次”为主（若存在）+ 新建按钮 | 强调连续性 |  |
| C. 先是介绍页/引导页，再进入新建 | 先解释“角色扮演/隐私本地”，再进入会话 | ✓ |

**历史列表字段（多选）：**
- 选中：场景、创建时间、状态、时长（Phase 1 可占位）、备注/名称（需要尽量不打断）

---

## 本地优先/隐私信任 UX

| Option | Description | Selected |
|--------|-------------|----------|
| A. 顶部常驻一行提示（可收起） | 强信任信号但占空间 |  |
| B. 仅在关键按钮附近显示（如“开始排练”旁） | 更克制，避免干扰 | ✓ |
| C. 首次进入弹窗确认一次 | 明确但打断流程 |  |

---

## 本地数据保存策略

| Option | Description | Selected |
|--------|-------------|----------|
| A. 默认永久保留（用户手动删除） | 最简单、符合练习记录心智 | ✓ |
| B. 只保留最近 N 次（可配置） | 省空间但可能误删 |  |
| C. 只保留最近 X 天（可配置） | 临时练习心智，不利长期进步 |  |

**一键清空所有历史：** 本阶段不做。

---

## Claude's Discretion

- 引导页文案与布局密度
- 历史列表默认排序
- “备注/名称”录入方式（创建时 vs 创建后）
