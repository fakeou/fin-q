export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  planningTasks?: string[];
  currentTask?: string;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
}

export type SSEEvent =
  | { type: "planning"; tasks: string[] }
  | { type: "task_start"; task: string }
  | { type: "task_done"; task: string }
  | { type: "tool_run"; tool: string }
  | { type: "done"; answer: string }
  | { type: "error"; message: string };
