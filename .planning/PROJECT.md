# Getting Into Character（面试角色排练）

## What This Is

一个面向**公务员面试**的 Web 排练应用：在面试前给用户发一张“角色卡”，让用户以扮演角色的方式进行答题练习，降低紧张/焦虑对发挥的影响。应用提供面试场景背景、录屏与语音转写、卡顿提醒与记录，并在练习后基于转写内容给出复盘建议。

## Core Value

用户能在面试前**快速进入角色并稳定输出表达**（把表现归因到“角色”，而非“我本人”），从而更从容地完成结构化答题。

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 用户能选择/输入面试场景（v1 固定为“公务员面试”）并开始一次排练
- [ ] 用户能输入期望角色（如“侃侃而谈/自信/冷静”）与触发物（如“一支笔”），并生成可朗读的角色卡（包含状态、行为指令与禁忌）
- [ ] 排练页面展示面试场景背景（支持离线生成的视频背景，也支持用户上传背景素材）
- [ ] 排练页面提供可移动的录屏/摄像头区域，用户能开始/结束一次练习录制
- [ ] 练习过程支持语音转文字，并生成本次答题文本
- [ ] 当用户出现长时间停顿时给出屏幕提示以鼓励维持角色，且停顿事件会被记录
- [ ] 停顿阈值可配置（默认 5 秒）
- [ ] 练习后用户可在 AI 输入框里“绕过手动整理”，基于答题文本获得改进建议与示例
- [ ] 默认隐私策略：所有录屏/音频/转写在本地处理与保存（不上传）

### Out of Scope

- 多面试类型（校招/英语/企业面试等）——先把公务员面试做深做稳
- 原生移动端 App —— v1 先 Web 优先
- 多人协作/教练端实时旁听 —— 非核心价值，复杂度高

## Context

灵感来自《The Rehearsal》与航空沟通的“角色脚本”机制：通过把表达行为外包给角色，降低权威/后果带来的沟通阻滞。这里将该机制迁移到面试场景，重点解决临场紧张导致的停顿与表达失常。

## Constraints

- **Platform**: Web 应用优先 — 覆盖面更广、进入门槛更低
- **Privacy**: 默认本地处理/不上传 — 降低用户心理负担
- **Background**: 支持离线生成视频背景 + 用户上传 — 兼顾氛围与可控性

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| v1 聚焦公务员面试 | 先把一个典型场景打磨到可用、可验证 | — Pending |
| 角色卡包含“状态 + 指令 + 禁忌” | 仅“状态”不够具体，加入可执行行为能更快进入角色 | — Pending |
| 默认本地处理录屏/音频/转写 | 面试内容敏感；隐私默认值影响留存与使用意愿 | — Pending |
| 停顿阈值可配置，默认 5s | 不同用户节奏不同；需要可调且能记录用于复盘 | — Pending |
| 背景支持离线生成视频 + 上传 | 氛围增强沉浸，同时允许用户自定义/复用素材 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-09 after initialization*
