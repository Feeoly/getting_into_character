# Phase 02 Plan Check（02-mvp）

**Phase:** 02 — 排练页录制与停顿事件 MVP  
**Plans checked:** 3（`02-01`,`02-02`,`02-03`）  
**Verdict:** **FLAG**

本报告为“重新校验”的最终版本；已移除旧的矛盾结论片段，仅保留与当前计划文件一致的检查结果。

## 结论摘要

- 三份计划均通过结构校验（任务字段齐全、frontmatter 完整）。
- ROADMAP Phase 02 requirements 在 plans 的 `requirements` 字段中 **100% 覆盖**。
- 依赖链与波次：`02-01 (wave1) → 02-02 (wave2) → 02-03 (wave3)`，无循环/无缺失引用。
- 需要两点小修订以降低执行/验收风险（见 “Warnings”）。

## Dimension 1: Requirement Coverage（需求覆盖）

ROADMAP Phase 02 requirements：`SCEN-01, SCEN-02, RECD-01, RECD-02, RECD-03, RECD-04, PAUS-01, PAUS-02, PAUS-03, SETT-01`

| Requirement | Covered by Plan(s) | Status |
|---|---:|---|
| SCEN-01 | 02-01 | Covered |
| SCEN-02 | 02-01 | Covered |
| RECD-01 | 02-02 | Covered |
| RECD-02 | 02-02 | Covered |
| RECD-03 | 02-02 | Covered |
| RECD-04 | 02-02 | Covered |
| PAUS-01 | 02-03 | Covered |
| PAUS-02 | 02-03 | Covered |
| PAUS-03 | 02-01 | Covered |
| SETT-01 | 02-01 | Covered |

**Result:** ✅ PASS

## Dimension 2: Task Completeness（任务完整性）

工具校验（plan-structure）：
- `02-01`: 2/2 tasks 含 `files/action/verify/done`
- `02-02`: 2/2 tasks 含 `files/action/verify/done`
- `02-03`: 2/2 tasks 含 `files/action/verify/done`

**Result:** ✅ PASS

## Dimension 3: Dependency Correctness（依赖与波次）

- `02-01`: `wave: 1`, `depends_on: []`
- `02-02`: `wave: 2`, `depends_on: ["02-01"]`
- `02-03`: `wave: 3`, `depends_on: ["02-01","02-02"]`

**Result:** ✅ PASS

## Dimension 4: Key Links Planned（关键连线）

must_haves.key_links 与 task action 对齐情况（抽查）：
- 会话详情 → 排练页路由（`02-01`）
- 排练页 → 设置抽屉 → 本地仓库（`02-01`）
- 录制面板 → recording 控制器；排练页 → 可拖拽预览窗（`02-02`）
- 排练页 → pauseDetector；排练页 → pauseEvents 写入/读取（`02-03`）

**Result:** ✅ PASS

## Dimension 5: Scope Sanity（范围/上下文预算）

| Plan | Tasks | files_modified(估) | Result |
|---|---:|---:|---|
| 02-01 | 2 | 9 | OK |
| 02-02 | 2 | 4 | OK |
| 02-03 | 2 | 5 | OK |

**Result:** ✅ PASS

## Dimension 6: Verification Derivation（must_haves 质量）

- `truths` 以用户可观察为主（权限时机、可回放、可拖拽、提示不打断、阈值可配）。
- `artifacts`/`key_links` 指向清晰。

**Result:** ✅ PASS

## Dimension 7: Context Compliance（对齐 02-CONTEXT.md）

Locked decisions 覆盖概览：
- **D-01/D-02**（摄像头 opt-in、点击开始才请求）：`02-01`/`02-02` 覆盖
- **D-03/D-04/D-12**（预置图片+1循环视频+上传；设置抽屉右上角入口）：`02-01` 覆盖
- **D-05/D-06**（预览窗默认底中；移动端缩略可展开）：`02-02` 覆盖
- **D-07..D-11**（能量阈值+平滑；默认5秒；温和提示；事件字段；不做 STT）：`02-03` 覆盖
Deferred ideas（STT/VAD 增强）未被纳入 Phase 02 计划。

**Result:** ✅ PASS

## Dimension 8: Nyquist Compliance

**SKIPPED**：`02-RESEARCH.md` “Validation Architecture” 标注 `workflow.nyquist_validation=false`。

## Dimension 9: Cross-Plan Data Contracts（跨计划数据契约）

- `pauseThresholdMs`/`pausePromptEnabled`：`02-01` 写入，`02-03` 读取使用（一致）
- `cameraEnabled`：`02-01` 写入，`02-02` 在 startRecording 时读取（一致）

**Result:** ✅ PASS

## Dimension 10: .cursor/rules/ Compliance

`.cursor/rules/gsd.md` 要求通过 GSD 工作流推进改动；当前为计划校验与产出文档，不涉及绕过执行。

**Result:** ✅ PASS

## Dimension 11: Research Resolution

`02-RESEARCH.md` 的 `## Open Questions` 标记为 **(RESOLVED)**。

**Result:** ✅ PASS

## Issues（为何 FLAG）

### Warnings（建议修订，不阻塞但会提高成功率）

**1) [execution_risk] Dexie schema/version 在 `02-01` 与 `02-03` 都会改 `src/app/_lib/db.ts`**
- 风险：并行/回滚时容易出现 schema 字符串合并遗漏或 version bump 不一致。
- 建议：在 `02-03` Task 1 的 action 中补充一句“最终 `db.ts` schema 字符串应包含 rehearsalSettings/uploadedBackgrounds/pauseEvents 三表，且 version 递增为 3（在 `02-01` 为 2 的前提下）”，把执行时的合并策略写死。

**2) [acceptance_risk] `SCEN-01` 文案含“离线生成的视频背景”，而本 phase 方案为“预置离线循环视频（可播放）+ 图片主路径”**
- 当前方案与 `02-CONTEXT.md` D-03 一致，但为避免验收歧义，建议在 `02-01` 的 objective 或 success_criteria 里保留/强化口径澄清：本 phase 的“离线视频背景”按“离线可播放的预置循环视频”实现；“生成视频”不在 Phase 02。

### Structured Issues（YAML）

```yaml
issues:
  - issue:
      plan: "02-03"
      dimension: "execution_risk"
      severity: "warning"
      description: "02-01 与 02-03 都修改 src/app/_lib/db.ts（Dexie schema/version）；需把最终 schema 合并与 version 递增策略写死以降低执行冲突"
      task: 1
      fix_hint: "在 02-03 Task 1 action 明确：最终 schema 必含 rehearsalSettings/uploadedBackgrounds/pauseEvents；若 02-01 bump 到 2，则 02-03 bump 到 3，并说明 schema 字符串合并方式"
  - issue:
      plan: "02-01"
      dimension: "verification_derivation"
      severity: "warning"
      description: "SCEN-01 含‘离线生成视频背景’字样，计划采用预置离线循环视频；虽与 D-03 一致，但建议在计划内明确口径避免验收争议"
      task: null
      fix_hint: "在 objective/success_criteria 明确：Phase 02 的离线视频背景=离线可播放的预置循环视频；视频生成能力不在本阶段"
```

## Recommendation

建议先做上述两处小修订后再进入执行（`/gsd-execute-phase 2`）。当前结论 **FLAG**（可执行，但建议先收敛风险与口径）。

