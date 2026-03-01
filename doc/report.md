# FinQ — 项目完成报告

> 生成时间：2026-03-01

---

## 项目概述

基于开源金融 Agent [Dexter](https://github.com/virattt/dexter) 构建的 AI 金融分析对话系统，命名为 **FinQ**。用户通过用户名登录后，可与 AI 进行多轮金融问答，分析美股财报、财务指标、市场趋势等。

---

## 与原始架构的偏差

原始 `architecture.md` 假设 Dexter 是 TypeScript 包，可直接 `import`。实际情况不同，最终架构如下：

| 项目 | 原计划 | 实际实现 |
|---|---|---|
| Dexter 语言 | TypeScript（npm 包）| **Python**（npm 包是 Python CLI 的薄层包装） |
| 集成方式 | 直接 `import Agent` | **Python 子进程**（`Bun.spawn` → `dexter_bridge.py`） |
| 会话记忆 | `InMemoryChatHistory`（Dexter 内置） | **Bun 服务端 Map**（注入历史文本前缀给每次调用） |
| LLM 后端 | OpenAI GPT-4o | **Gemini 2.5 Flash Lite**（OpenAI 兼容接口） |
| 应用名称 | Dexter | **FinQ** |

---

## 最终技术架构

```
用户浏览器 (React + Vite + Tailwind)
    │  fetch SSE  http://localhost:5173 → proxy → :3001
    ▼
server.ts (Bun.serve)                         :3001
    │  Bun.spawn(stdin pipe / stdout pipe)
    ▼
dexter_bridge.py (Python 子进程)
    │  patch show_progress → noop
    │  JSONLogger → stdout JSON Lines
    ▼
dexter.Agent (Python)
    │  langchain-openai → ChatOpenAI
    ▼
Gemini 2.5 Flash Lite
    + financialdatasets.ai (实时财务数据 API)
```

---

## 目录结构（最终）

```
dexter-run/                          ← 项目根（位于 .claude/skills/）
├── server.ts                        ← Bun HTTP Server，~150 行，单文件
├── dexter_bridge.py                 ← Python 子进程桥接，stdin→Dexter→stdout JSON Lines
├── .env                             ← API Keys（不提交）
├── .env.example                     ← 环境变量模板
├── .venv/                           ← Python 3.12 venv（uv 创建）
│   └── lib/python3.12/site-packages/dexter/
│       └── model.py                 ← 已修改：修复 import + 支持 MODEL_NAME/OPENAI_BASE_URL
├── test-dexter.py                   ← Dexter 独立验证脚本
├── test-proxy.py                    ← LLM API 连通性测试
├── list-models.py                   ← 枚举可用 Gemini 模型
├── doc/
│   ├── architecture.md              ← 原始架构文档
│   ├── checklist.md                 ← 实现检查清单
│   └── report.md                   ← 本文件
└── frontend/                        ← React 前端（位于 projects/agents-*/）
    ├── package.json
    ├── vite.config.ts               ← Vite dev proxy → :3001
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx                  ← react-router-dom 路由
        ├── index.css                ← Tailwind + prose 样式
        ├── types/api.ts             ← Message / Conversation / SSEEvent 类型
        ├── contexts/AppContext.tsx  ← 全部状态 + localStorage 持久化
        ├── hooks/useChat.ts         ← SSE 流读取 + 状态更新
        ├── pages/
        │   ├── LoginPage.tsx
        │   └── ChatPage.tsx
        └── components/
            ├── Sidebar/Sidebar.tsx  ← 对话列表、新建、删除、用户信息
            └── Chat/
                ├── ChatArea.tsx     ← 消息列表 + 欢迎页
                ├── MessageBubble.tsx← 用户/AI 气泡 + Planning 步骤 + Markdown
                └── InputArea.tsx   ← 自动伸缩输入框
```

---

## API 接口（实际）

```
GET  /health
  → { status: "ok", model: "models/gemini-2.5-flash-lite" }

POST /api/chat
  Body: { sessionId: string, question: string }
  → text/event-stream (SSE)

  SSE 事件流：
    data: {"type":"planning","tasks":["分析营收","..."]}\n\n
    data: {"type":"task_start","task":"..."}\n\n
    data: {"type":"tool_run","tool":"get_income_statements"}\n\n
    data: {"type":"task_done","task":"..."}\n\n
    data: {"type":"done","answer":"完整 Markdown 回复"}\n\n
    data: {"type":"error","message":"..."}\n\n

DELETE /api/session/:sessionId
  → { ok: true }
```

---

## 关键问题与解决方案

| 问题 | 解决方案 |
|---|---|
| Dexter 是 Python，不能直接 import | 通过 `Bun.spawn` 启动 Python 子进程，stdin/stdout 通信 |
| Dexter 用 Ink TUI，终端 spinner 污染 stdout | 在 import `dexter.agent` **之前**，将 `dexter.utils.ui.show_progress` patch 为 no-op |
| Python 中无跨调用对话记忆 | Bun server 维护 `Map<sessionId, messages[]>`，每次请求将历史注入为文本前缀 |
| `langchain.prompts` 模块已迁移 | 改为 `from langchain_core.prompts import ChatPromptTemplate` |
| Gemini 2.5 Flash 地区限制 | 改用 `models/gemini-2.5-flash-lite`（验证可用） |
| Pydantic 序列化警告输出到 stderr | server.ts 使用 `stderr: "inherit"`（不影响 stdout JSON Lines）|

---

## 已验证功能

- [x] `GET /health` 返回正常
- [x] `POST /api/chat` SSE 流式返回 planning / tool_run / done 事件
- [x] Dexter 调用 `financialdatasets.ai` 获取真实财务数据（Apple 2024 营收 $391B）
- [x] 多轮对话���史注入正常工作
- [x] 120 秒超时保护
- [x] 错误事件（API 429 等）正确传递给前端并展示
- [x] 前端 LoginPage / ChatPage 路由正常
- [x] 对话列表按日期分组，标题自动取第一条消息
- [x] 状态持久化到 localStorage（刷新不丢失）
- [x] Markdown 渲染（表格、代码块、列表）
- [x] Planning 步骤动画（spinner / 完成勾）
- [x] 输入框自动伸缩，Shift+Enter 换行

---

## 启动方式

```bash
# 终端 1：启动后端
cd /path/to/dexter-run
bun run server.ts

# 终端 2：启动前端
cd /path/to/frontend
bun run dev

# 访问
open http://localhost:5173
```

---

## 环境变量

```env
OPENAI_API_KEY=<Gemini API Key>
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
MODEL_NAME=models/gemini-2.5-flash-lite
FINANCIAL_DATASETS_API_KEY=<financialdatasets.ai key>
```

---

## 已知限制

- **Gemini 免费层每日限额 20 次**：超出后返回 429，前端会显示错误。付费 key 不受此限制。
- **会话在服务重启后丢失**：无数据库，历史仅存于 Bun 进程内存。
- **每次请求新建 Python 子进程**：冷启动约 2-3 秒（langchain 模块加载）。可通过进程池优化，但当前规模无需。
