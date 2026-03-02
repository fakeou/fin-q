#!/usr/bin/env python3
"""
Dexter Bridge: stdin (JSON) → Dexter Agent → stdout (JSON Lines)

Input  (single line on stdin):
  {"question": "...", "history": [{"role": "user", "content": "..."}, ...]}

Output (JSON Lines on stdout):
  {"type": "planning",  "tasks": ["...", "..."]}
  {"type": "task_start","task": "..."}
  {"type": "tool_run",  "tool": "get_income_statements"}
  {"type": "task_done", "task": "..."}
  {"type": "done",      "answer": "..."}
  {"type": "error",     "message": "..."}
"""
import sys
import json
from functools import wraps
from dotenv import load_dotenv
load_dotenv(override=True)


def emit(event_type: str, **kwargs):
    """Write one JSON event to stdout, flushed immediately."""
    print(json.dumps({"type": event_type, **kwargs}), flush=True)


# ── Patch show_progress BEFORE importing dexter.agent ─────────────────────
# show_progress is a decorator that wraps Agent methods with terminal spinners.
# We replace it with a no-op so stdout stays clean JSON Lines.
import dexter.utils.ui as _ui_mod

def _noop_progress(message: str, success_message: str = ""):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        return wrapper
    return decorator

_ui_mod.show_progress = _noop_progress

# ── Now safe to import Agent (gets the patched decorator) ─────────────────
from dexter.agent import Agent
from dexter.utils.logger import Logger


# ── Custom logger: emits structured JSON events ───────────────────────────
class JSONLogger(Logger):
    def __init__(self):
        self.log = []
        # ui is only used indirectly; provide a safe no-op object
        class _Noop:
            def __getattr__(self, _):
                return lambda *a, **k: None
        self.ui = _Noop()

    def _log(self, msg: str):
        pass  # suppress internal debug prints

    def log_task_list(self, tasks):
        emit("planning", tasks=[t.get("description", str(t)) for t in tasks])

    def log_task_start(self, task_desc: str):
        emit("task_start", task=task_desc)

    def log_task_done(self, task_desc: str):
        emit("task_done", task=task_desc)

    def log_tool_run(self, tool: str, result: str = ""):
        emit("tool_run", tool=tool)

    def log_summary(self, summary: str):
        pass  # final answer is emitted via emit("done") in __main__

    def log_header(self, msg: str):
        pass

    def log_risky(self, tool: str, input_str: str):
        pass


# ── Main ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    try:
        line = sys.stdin.readline().strip()
        if not line:
            emit("error", message="No input received on stdin")
            sys.exit(1)

        data = json.loads(line)
        question = data.get("question", "").strip()
        history  = data.get("history", [])   # [{ role, content }, ...]

        if not question:
            emit("error", message="Empty question")
            sys.exit(1)

        # Inject conversation history as a context prefix so Dexter has
        # multi-turn awareness (last 6 messages, assistant truncated to 500 chars)
        if history:
            ctx = []
            for msg in history[-6:]:
                role    = str(msg.get("role", "user")).upper()
                content = str(msg.get("content", ""))[:500]
                ctx.append(f"{role}: {content}")
            full_question = "Previous conversation:\n" + "\n".join(ctx) + \
                            "\n\nCurrent question: " + question
        else:
            full_question = question

        agent        = Agent()
        agent.logger = JSONLogger()

        answer = agent.run(full_question)
        emit("done", answer=answer)

    except json.JSONDecodeError as e:
        emit("error", message=f"Invalid JSON input: {e}")
        sys.exit(1)
    except Exception as e:
        emit("error", message=str(e))
        sys.exit(1)
