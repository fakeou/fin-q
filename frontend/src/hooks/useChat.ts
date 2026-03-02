import { useCallback, useRef } from "react";
import { useApp } from "../contexts/AppContext";
import type { SSEEvent } from "../types/api";

const API_BASE = "";

export function useChat() {
  const {
    addUserMessage,
    startAssistantMessage,
    updateAssistantMessage,
  } = useApp();

  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (sessionId: string, question: string) => {
      addUserMessage(sessionId, question);
      const msgId = startAssistantMessage(sessionId);

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, question }),
          signal: ac.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        // Accumulate streamed content for partial updates
        let contentAccum = "";
        let planningTasks: string[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            let event: SSEEvent;
            try {
              event = JSON.parse(raw);
            } catch {
              continue;
            }

            if (event.type === "planning") {
              planningTasks = event.tasks;
              updateAssistantMessage(sessionId, msgId, { planningTasks });
            } else if (event.type === "task_start") {
              updateAssistantMessage(sessionId, msgId, {
                currentTask: event.task,
              });
            } else if (event.type === "task_done") {
              updateAssistantMessage(sessionId, msgId, { currentTask: undefined });
            } else if (event.type === "done") {
              contentAccum = event.answer;
              updateAssistantMessage(sessionId, msgId, {
                content: contentAccum,
                isStreaming: false,
                currentTask: undefined,
              });
            } else if (event.type === "error") {
              updateAssistantMessage(sessionId, msgId, {
                content: "",
                error: event.message,
                isStreaming: false,
              });
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        updateAssistantMessage(sessionId, msgId, {
          content: "",
          error: err instanceof Error ? err.message : "Unknown error",
          isStreaming: false,
        });
      }
    },
    [addUserMessage, startAssistantMessage, updateAssistantMessage]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { sendMessage, abort };
}
