# Dexter Run — 项目架构文档

## 定位

基于开源项目 [Dexter](https://github.com/virattt/dexter) 的金融分析对话系统。用户输入用户名进入，与 Dexter AI Agent 对话，分析美股、加密货币等金融标的。无持久化存储，会话记忆由 Dexter 内置的 `InMemoryChatHistory` 管理。

---

## 架构概览

```
用户浏览器
    │  HTTP POST + SSE
    ▼
server.ts（Bun 原生 HTTP Server）     :3001
    │  直接 import，函数调用
    ▼
Dexter Agent（TypeScript）
    │  InMemoryChatHistory（按 sessionId 隔离，进程内存）
    └─ 工具调用：Yahoo Finance、Tavily 搜索、等
```

**三个关键简化：**
- 无 Express — 使用 `Bun.serve()` 原生 HTTP，单文件
- 无数据库 — 会话历史存进程内存（`Map<sessionId, InMemoryChatHistory>`），重启清空
- 无 Python — Dexter 本身是 TypeScript，直接 import

---

## 目录结构

```
dexter-run/
├── doc/
│   ├── architecture.md        # 本文件
│   └── checklist.md           # 实现步骤检查清单
├── frontend/                  # React + Vite + Tailwind（Phase 3）
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── types/api.ts
│       ├── services/
│       │   ├── api.ts          # fetch 封装
│       │   └── sse.ts          # EventSource 封装
│       ├── contexts/AppContext.tsx   # username + sessionId
│       ├── hooks/
│       │   └── useChat.ts      # 发消息 + SSE 接收
│       ├── components/
│       │   ├── Sidebar/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── UserInfo.tsx
│       │   │   └── NewChatButton.tsx
│       │   └── Chat/
│       │       ├── ChatArea.tsx
│       │       ├── MessageList.tsx
│       │       ├── MessageBubble.tsx
│       │       ├── StreamingMessage.tsx
│       │       └── InputArea.tsx
│       └── pages/
│           ├── LoginPage.tsx
│           └── ChatPage.tsx
├── server.ts                  # Bun HTTP Server（Phase 2，单文件）
├── package.json               # 仅 Bun 项目配置
├── .env                       # API Keys（本地，不提交）
└── .env.example
```

---

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 运行时 | Bun | 同时运行 server.ts 和安装依赖 |
| 后端 | Bun 原生 HTTP（`Bun.serve()`） | 单文件，无框架 |
| AI Agent | Dexter（`dexter-agent` npm 包） | 直接 import |
| 会话记忆 | `InMemoryChatHistory`（Dexter 内置） | 进程内存，无 DB |
| 实时通信 | SSE（Server-Sent Events） | Bun 原生支持流式响应 |
| 前端 | React 18 + TypeScript + Vite + Tailwind | |
| 前端 Markdown | react-markdown | 渲染 Dexter 回复 |

---

## server.ts 核心逻辑

```typescript
import { Agent } from 'dexter-agent/src/agent/agent.js'
import { InMemoryChatHistory } from 'dexter-agent/src/utils/in-memory-chat-history.js'

// 按 sessionId 隔离的会话记忆
const sessions = new Map<string, InMemoryChatHistory>()

Bun.serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url)

    // POST /api/chat — 发起对话，返回 SSE 流
    if (req.method === 'POST' && url.pathname === '/api/chat') {
      const { sessionId, question } = await req.json()

      // 获取或创建该 session 的记忆实例
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, new InMemoryChatHistory())
      }
      const chatHistory = sessions.get(sessionId)!

      const agent = new Agent({ chatHistory })

      // 返回 SSE 流
      return new Response(
        new ReadableStream({
          async start(controller) {
            for await (const event of agent.run(question)) {
              const data = `data: ${JSON.stringify(event)}\n\n`
              controller.enqueue(new TextEncoder().encode(data))
            }
            controller.close()
          }
        }),
        { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } }
      )
    }

    // DELETE /api/session/:id — 清除会话记忆（新建对话）
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/session/')) {
      const sessionId = url.pathname.split('/').pop()!
      sessions.delete(sessionId)
      return Response.json({ ok: true })
    }

    return new Response('Not Found', { status: 404 })
  }
})
```

---

## API 设计

```
POST /api/chat
  Body:     { sessionId: string, question: string }
  Response: text/event-stream（SSE，直接流式返回 Dexter 事件）

  SSE 事件格式（Dexter 原生事件，直接透传）：
    data: {"type":"tool_start","tool":"yahoo_finance",...}
    data: {"type":"tool_end",...}
    data: {"type":"thinking","content":"..."}
    data: {"type":"answer_start"}
    data: {"type":"answer_delta","delta":"苹果Q4营收"}
    data: {"type":"done","answer":"完整回复"}

DELETE /api/session/:sessionId
  Response: { ok: true }
  用途：新建对话时清除 InMemoryChatHistory

GET /health
  Response: { status: "ok" }
```

---

## 前端页面设计

### LoginPage `/`
居中卡片，输入用户名（≥2字），保存 `username` + 新建 `sessionId`（crypto.randomUUID）到 localStorage，跳转 `/chat`

### ChatPage `/chat`
```
┌────────────────┬──────────────────────────────────┐
│  Sidebar       │  ChatArea                         │
│  w-64          │  flex-1                           │
│                │                                   │
│  👤 alice      │  MessageList（可滚动）             │
│                │   用户消息（右对齐蓝色气泡）         │
│  [+ 新建对话]  │   🔍 调用工具：Yahoo Finance...    │
│                │   💭 思考中...                     │
│                │   Dexter 回复（流式，Markdown）▋   │
└────────────────┴──────────────────────────────────┘
                  [ 输入您的问题...          发送→ ]
```

---

## 关键设计决策

| 问题 | 决策 |
|---|---|
| 为何不前端直连 Dexter | Dexter 是 Node.js 模块，API Key 不能暴露浏览器 |
| 为何用 Bun.serve 而非 Express | Dexter 本身用 Bun，原生 SSE 流式响应，零依赖 |
| 会话隔离 | `Map<sessionId, InMemoryChatHistory>`，每个 sessionId 独立上下文 |
| 新建对话 | 前端生成新 uuid 作为 sessionId，调 DELETE 清除旧 session |
| CORS | server.ts 直接在响应头设置，允许 localhost:5173（Vite dev） |
| Dexter 事件类型 | `tool_start` `tool_end` `thinking` `answer_start` `answer_delta` `done` |
