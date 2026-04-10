# Phase 2: 排练页录制与停顿事件 MVP - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in `02-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-10  
**Phase:** 02-排练页录制与停顿事件 MVP  
**Areas discussed:** 录制范围/权限、背景素材、预览窗拖拽、停顿检测与记录、设置抽屉

---

## 录制范围与默认值

| Option | Description | Selected |
|--------|-------------|----------|
| A. 默认仅麦克风音频 | 权限更轻、先把闭环做稳 |  |
| B. 默认音频 + 摄像头可选开启 | 更符合可移动预览窗 | ✓ |
| C. 默认音频 + 摄像头直接开启 | 首用摩擦更高 |  |

**权限时机：**
| Option | Description | Selected |
|--------|-------------|----------|
| 点击“开始录制”才请求 | 渐进授权（推荐） | ✓ |
| 进入排练页就请求 | 更打断 |  |
| 先检测页再请求 | 多一步解释 |  |

---

## 背景素材（离线/上传）

用户补充偏好：**既支持图片也支持视频**，并希望预设 2-3 个离线图片。

| Option | Description | Selected |
|--------|-------------|----------|
| A. 先做静态图片背景（预置 + 上传） | 最稳 |  |
| B. 图片（预置+上传）+ 预置 1 个小视频循环 | 兼顾稳与动效 | ✓ |
| C. 以视频为主（预置+上传视频） | 风险更高 |  |

---

## 可拖拽预览窗

- 默认位置：**底部中间**（用户给出具体偏好）
- 移动端：默认缩小（小卡片/小圆点）可展开（选项 A）

---

## 停顿检测与记录

**VAD 解释**：VAD = Voice Activity Detection（语音活动检测）。

| Option | Description | Selected |
|--------|-------------|----------|
| 能量阈值 + 平滑 | MVP 最快闭环 | ✓ |
| VAD | 更准但更复杂 |  |
| 混合 | 范围更大 |  |

**阈值默认：** 5 秒（且可在设置中调整/关闭提示）

**提示风格：**
| Option | Description | Selected |
|--------|-------------|----------|
| 温和提示（渐隐，不打断） | 符合减压目标 | ✓ |
| 强提示（弹窗） | 更焦虑 |  |
| 默认不提示只记录 | 少即时鼓励 |  |

**事件字段（用户想要）：**
- 选中：`duration_ms`、`prompt_shown`、`session_status`
- 追加：希望能记录“停顿前后语音转成的文字”（该项依赖 STT，Phase 3 再做）
- 追加同意：Phase 2 直接补齐 `start_ms` 与 `threshold_ms`

