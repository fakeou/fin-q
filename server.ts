import { resolve } from "path";

const PORT   = Number(process.env.PORT ?? 3001);
const PYTHON = resolve(".venv/bin/python");
const BRIDGE = resolve("dexter_bridge.py");

// In-memory session history: sessionId → [{role, content}]
const sessions = new Map<string, Array<{ role: string; content: string }>>();

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS });
}

Bun.serve({
  port: PORT,

  async fetch(req) {
    const url      = new URL(req.url);
    const path     = url.pathname;
    const method   = req.method;

    // Preflight
    if (method === "OPTIONS") return new Response(null, { headers: CORS });

    // ── GET /health ─────────────────────────────────────────────────────────
    if (method === "GET" && path === "/health") {
      return json({ status: "ok", model: process.env.MODEL_NAME ?? "default" });
    }

    // ── POST /api/chat → SSE stream ─────────────────────────────────────────
    if (method === "POST" && path === "/api/chat") {
      let sessionId: string, question: string;
      try {
        ({ sessionId, question } = await req.json());
      } catch {
        return json({ error: "Invalid JSON body" }, 400);
      }
      if (!sessionId || !question?.trim()) {
        return json({ error: "sessionId and question are required" }, 400);
      }

      const history = sessions.get(sessionId) ?? [];
      sessions.set(sessionId, [...history, { role: "user", content: question }]);

      const stream = new ReadableStream({
        async start(controller) {
          const enc  = new TextEncoder();
          const send = (data: string) =>
            controller.enqueue(enc.encode(`data: ${data}\n\n`));

          // Spawn Python bridge
          const proc = Bun.spawn([PYTHON, BRIDGE], {
            stdin:   "pipe",
            stdout:  "pipe",
            stderr:  "inherit",          // bridge errors → server console
            env:     { ...process.env },
          });

          // Write input to bridge stdin
          proc.stdin.write(JSON.stringify({ question, history }) + "\n");
          proc.stdin.end();

          // Keepalive: send SSE comment every 5s to prevent proxy/browser from closing idle connection
          let closed = false;
          const keepalive = setInterval(() => {
            if (!closed) controller.enqueue(enc.encode(": keepalive\n\n"));
          }, 5_000);

          const reader  = proc.stdout.getReader();
          const decoder = new TextDecoder();
          let buf             = "";
          let assistantAnswer = "";

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });

              // Process complete newline-delimited JSON lines
              const lines = buf.split("\n");
              buf = lines.pop() ?? "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                try {
                  const event = JSON.parse(trimmed);
                  send(trimmed);
                  if (event.type === "done" && event.answer) {
                    assistantAnswer = event.answer;
                  }
                } catch {
                  // Non-JSON line (pydantic warnings etc.) — skip silently
                }
              }
            }
          } finally {
            closed = true;
            clearInterval(keepalive);
            if (assistantAnswer) {
              const cur = sessions.get(sessionId) ?? [];
              sessions.set(sessionId, [
                ...cur,
                { role: "assistant", content: assistantAnswer },
              ]);
            }
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          ...CORS,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection":    "keep-alive",
        },
      });
    }

    // ── DELETE /api/session/:id ─────────────────────────────────────────────
    if (method === "DELETE" && path.startsWith("/api/session/")) {
      const sessionId = path.split("/").pop()!;
      sessions.delete(sessionId);
      return json({ ok: true });
    }

    return new Response("Not Found", { status: 404, headers: CORS });
  },
});

console.log(`
┌─────────────────────────────────────────────┐
│   Dexter Run — Bun Server                   │
│   http://localhost:${PORT}                      │
│   Model: ${(process.env.MODEL_NAME ?? "default").padEnd(32)}│
└─────────────────────────────────────────────┘
`);
