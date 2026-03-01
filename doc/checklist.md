# FinQ — 实现步骤检查清单

实现顺序：**Phase 1（跑通 Dexter）→ Phase 2（Bun 转发）→ Phase 3（前端）→ Phase 4（联调）**

> ⚠️ **架构说明**：Dexter 实际为 Python 包（非 TypeScript），采用 Python 子进程桥接方案。详见 `doc/report.md`。

---

## Phase 1：跑通 Dexter ✅

> 目标：在命令行验证 Dexter 能正常接收问题、调用工具、返回回复

### 1.1 安装 Dexter
- [x] 确认 Bun 已安装（`~/.bun/bin/bun`）
- [x] 在 `dexter-run/` 下初始化项目，安装 `dexter-agent` npm 包
- [x] 发现 npm 包为 Python CLI 包装 → 改用 `uv` 创建 Python 3.12 venv，安装 Dexter Python 包
- [x] 确认包结构：`.venv/lib/python3.12/site-packages/dexter/`

### 1.2 配置环境变量
- [x] 创建 `.env.example` 模板
- [x] 创建 `.env`（`OPENAI_API_KEY` / `OPENAI_BASE_URL` / `MODEL_NAME` / `FINANCIAL_DATASETS_API_KEY`）
- [x] `.env` 已加入 `.gitignore`

### 1.3 修复 Dexter Python 包
- [x] 修复 `dexter/model.py`：`from langchain.prompts` → `from langchain_core.prompts`
- [x] 添加 `MODEL_NAME` / `OPENAI_BASE_URL` 环境变量支持
- [x] 配置 Gemini 2.5 Flash Lite（`models/gemini-2.5-flash-lite`，地区可用）

### 1.4 验证程序化调用
- [x] 创建 `test-dexter.py` 验证脚本
- [x] 创建 `test-proxy.py` LLM 连通性测试
- [x] 创建 `list-models.py` 枚举可用模型
- [x] 端到端验证：Apple 营收查询返回真实财务数据（$391B）

### 1.5 验证多轮对话
- [x] 通过历史文本前缀注入方式实现跨调用��下文传递
- [x] 验证第二轮问题可引用第一轮上下文

---

## Phase 2：Bun HTTP Server 转发 ✅

> 目标：`server.ts` 通过 HTTP+SSE 将 Dexter Python 子进程暴露给前端

### 2.1 Python Bridge（dexter_bridge.py）
- [x] 创建 `dexter_bridge.py`：stdin 读取 JSON → 调用 Dexter → stdout 输出 JSON Lines
- [x] 在 import `dexter.agent` 前 patch `show_progress` 为 no-op（防止 spinner 污染 stdout）
- [x] 实现 `JSONLogger`：将 Dexter 日志方法转为结构化 SSE 事件
- [x] 独立测试：`echo '{"question":"...","history":[]}' | .venv/bin/python dexter_bridge.py`

### 2.2 基础 server.ts
- [x] 创建 `server.ts`，实现 `Bun.serve()`
- [x] 添加 CORS 响应头（允许所有来源，支持开发环境）
- [x] 实现 `GET /health` → `{ status: "ok", model: "..." }`
- [x] 测试：`curl http://localhost:3001/health`

### 2.3 POST /api/chat（SSE 流）
- [x] 解析 body：`{ sessionId, question }`
- [x] 按 sessionId 维护 `Map<string, messages[]>` 会话历史
- [x] `Bun.spawn` 启动 Python bridge 子进程（stdin pipe / stdout pipe）
- [x] 读取 stdout JSON Lines，转发为 SSE `data: ...\n\n`
- [x] 流结束时保存 assistant 回复到会话历史
- [x] curl 测试通过，能看到 planning / tool_run / done 事件

### 2.4 DELETE /api/session/:id
- [x] 实现 session 清除，测试通过

### 2.5 错误处理
- [x] Dexter 异常通过 `{"type":"error","message":"..."}` 传递给前端
- [x] 120 秒超时保护（`setTimeout` + `proc.kill()`）
- [x] 非 JSON 行（pydantic 警告等）静默跳过

### 2.6 完整端到端验证
- [x] 多轮对话（同一 sessionId）历史注入正常
- [x] 新建对话（DELETE session）后上下文清空

---

## Phase 3：前端实现 ✅

> 目标：React 页面，用户名登录 → 对话界面 → 实时流式展示回复

### 3.1 项目初始化
- [x] 创建 `frontend/` 目录，手动搭建 Vite + React + TypeScript 配置
- [x] 安装依赖：react-router-dom、react-markdown、tailwindcss、postcss、autoprefixer
- [x] 配置 Tailwind（`tailwind.config.js` + `postcss.config.js` + `src/index.css`）
- [x] Vite dev proxy：`/api` → `http://localhost:3001`
- [x] `bun run build` 零错误通过

### 3.2 类型定义与 Hook
- [x] 创建 `src/types/api.ts`（Message、Conversation、SSEEvent 类型）
- [x] 创建 `src/hooks/useChat.ts`：发消息 + SSE 流读取 + 状态更新

### 3.3 AppContext（全局状态）
- [x] `username`（localStorage 持久化）
- [x] `conversations`（含消息列表，localStorage 持久化）
- [x] `activeSessionId`
- [x] 对话 CRUD：`createConversation` / `deleteConversation`
- [x] 消息操作：`addUserMessage` / `startAssistantMessage` / `updateAssistantMessage`
- [x] 对话标题自动取第一条用户消息前 40 字

### 3.4 LoginPage
- [x] 居中卡片，FinQ 品牌 + 图标
- [x] 用户名输入，回车提交
- [x] 登录后跳转 `/chat/:id`
- [x] 微妙网格背景，靛紫色主题

### 3.5 Sidebar 组件
- [x] FinQ Logo + 新建对话按钮
- [x] 对话列表按 Today / Yesterday / Earlier 分组
- [x] 悬停显示删除按钮
- [x] 激活对话高亮（靛紫色边框）
- [x] 用户头像（渐变色）+ 用户名 + 退出按钮

### 3.6 Chat 组件
- [x] `ChatArea`：欢迎页（含建议问题按钮）+ 消息列表 + 自动滚动
- [x] `MessageBubble`：用户气泡（靛紫）/ AI 气泡（深色卡片）
- [x] Planning 步骤卡片：spinner（进行中）/ 圆圈（待执行）/ ✓（完成）
- [x] 流式思考动画（三点跳动）
- [x] Markdown 渲染（表格、代码块、列表、加粗）
- [x] 错误状态（红色边框卡片）
- [x] `InputArea`：自动伸缩 textarea，Enter 发送，Shift+Enter 换行

### 3.7 ChatPage
- [x] Sidebar + ChatArea 左右布局
- [x] 未登录时重定向 `/`

### 3.8 路由配置
- [x] `/` → LoginPage
- [x] `/chat` → ChatPage
- [x] `/chat/:sessionId` → ChatPage（指定会话）

### 3.9 UI 设计
- [x] 品牌更名：Dexter → **FinQ**
- [x] 统一深色主题：`#0d0f14` 底色 + `#161b26` 卡片
- [x] 主色调：靛紫色（indigo-600）
- [x] 精细 prose 样式（表格斑马纹、代码块、引用块）

---

## Phase 4：联调验证 ✅

### 冒烟测试
- [x] 访问 `localhost:5173`，看到 FinQ 登录页
- [x] 输入用户名，进入 `/chat/:id`
- [x] 刷新后用户名和对话历史保留（localStorage）
- [x] 发送问题，看到 Planning 步骤 + AI 回复
- [x] 消息完成后，输入框恢复可用

### 功能验证
- [x] 多轮对话：历史注入，上下文连贯
- [x] 新建对话：上下文清空
- [x] Markdown：表格/列表正确渲染
- [x] 错误处理：Dexter 报错（API 429 等）前端显示红色错误提示
- [x] 对话标题：自动生成，侧边栏截断显示

---

## 启动命令速查

```bash
# 启动后端（dexter-run 目录）
bun run server.ts            # 或 ~/.bun/bin/bun run server.ts

# 启动前端（frontend 目录）
bun run dev

# 访问
open http://localhost:5173
```

## curl 测试速查

```bash
# 健康检查
curl http://localhost:3001/health

# 发送消息（流式）
curl -s -N -X POST http://localhost:3001/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"s1","question":"Analyze Apple revenue 2024"}'

# 清除会话
curl -X DELETE http://localhost:3001/api/session/s1
```

## 环境变量

```env
OPENAI_API_KEY=<Gemini API Key>
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
MODEL_NAME=models/gemini-2.5-flash-lite
FINANCIAL_DATASETS_API_KEY=<financialdatasets.ai key>
```
