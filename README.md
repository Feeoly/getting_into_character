# 入戏（getting_into_character）

面向**公务员结构化面试**的 Web 排练应用：先领「角色卡」，再在可配置场景里**打板录制**练习；语音转写、停顿提示与复盘默认在**本机浏览器**完成，降低「被评判」带来的紧张感。产品名「入戏」强调用**角色距离**承接表达，而非硬扛真实自我。

## 功能概览

| 模块 | 说明 |
|------|------|
| **会话 / 角色卡** | 场景与气质、触发物 → 生成可朗读的 Markdown 角色卡；可选 **AI 增强**（服务端调用百炼，仅上传角色相关**文本**）。 |
| **朗读模式** | 朗读当前展示稿，完成后再进排练更顺。 |
| **排练** | 全屏场景背景（预置图/循环视频/上传图）；**麦克风** + 可选**摄像头**；本地录制与转写；可配置停顿阈值与温和提示。 |
| **复盘** | 查看转写、基于文本的 **AI 复盘**（百炼，需密钥）。 |

## 技术栈

- **框架**：Next.js（App Router）、React、TypeScript  
- **样式**：Tailwind CSS  
- **本地数据**：Dexie（IndexedDB）— 会话、录音元数据、转写任务等  
- **本地语音转写**：`@huggingface/transformers`（浏览器/Worker；可通过同源 `/api/hf` 代理访问模型仓库）  
- **可选云端 AI**：阿里云百炼 OpenAI 兼容 Chat（`BAILIAN_API_KEY`）— 角色卡增强、复盘对话  

## 环境要求

- **Node.js** ≥ 20  

## 快速开始

```bash
git clone <repo-url>
cd getting_into_character
npm install
```

复制环境变量模板并按需填写：

```bash
cp .env.example .env.local
# 编辑 .env.local，至少配置 BAILIAN_API_KEY（使用 AI 增强与复盘时必填）
```

启动开发服务器：

```bash
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `BAILIAN_API_KEY` | 使用 AI 时 | 百炼 API Key；未配置时相关接口返回 503。 |
| `BAILIAN_BASE_URL` | 否 | 默认 `https://coding.dashscope.aliyuncs.com/v1`。 |
| `BAILIAN_CHAT_MODEL` | 否 | 默认见 `.env.example`。 |
| `HF_HUB_UPSTREAM` / `HUGGINGFACE_HUB_ENDPOINT` | 否 | Hugging Face 镜像或端点，便于国内拉模型。 |
| `NEXT_PUBLIC_HF_HUB_DIRECT` | 否 | 设为 `1` 时 Worker 直连 Hub（默认走同源代理）。 |

本地也可不建文件，直接：`export BAILIAN_API_KEY=sk-... && npm run dev`。

## 常用脚本

| 命令 | 作用 |
|------|------|
| `npm run dev` | 开发模式 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 检查 |

## 隐私与数据

- **录音与转写**：默认仅在用户浏览器本地处理与存储，**不会默认上传**录音文件。  
- **调用百炼**：仅通过 Next.js **Route Handler** 在服务端带密钥请求；客户端发送的是**文本**（如角色卡草稿、转写摘录、复盘对话），具体范围以各页说明为准。  

## 仓库结构（简要）

```
src/app/           # 页面与路由（会话、排练、转写、复盘等）
src/app/api/       # 同源 API（百炼代理、HF 代理、角色增强等）
public/rehearsal/  # 预置排练背景等资源
```

更细的产品与阶段说明见仓库内 `.planning/`（若存在）。

---

*README 面向开发者；产品文案与流程以应用内界面为准。*
