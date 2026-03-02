import { useState, KeyboardEvent, useRef, useEffect } from "react";

interface Props {
  sessionId: string;
  onSend: (question: string) => void;
  disabled: boolean;
}

export default function InputArea({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  function submit() {
    const q = value.trim();
    if (!q || disabled) return;
    setValue("");
    onSend(q);
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const hasValue = value.trim().length > 0;

  return (
    <div
      className="px-5 py-4"
      style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Input container */}
        <div
          className="rounded-2xl transition-all"
          style={{
            background: "var(--surface-2)",
            border: `1px solid ${
              focused ? "rgba(91,110,245,0.42)" : "var(--border)"
            }`,
            boxShadow: focused
              ? "0 0 0 3px rgba(91,110,245,0.08), 0 0 20px rgba(91,110,245,0.07)"
              : "none",
            transition: "all 0.2s ease",
          }}
        >
          {/* Status row */}
          <div className="flex items-center gap-2 px-4 pt-2.5 pb-0">
            {/* Status indicator */}
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{
                background: disabled ? "var(--amber)" : "var(--emerald)",
                boxShadow: disabled
                  ? "0 0 5px rgba(245,158,11,0.55)"
                  : "0 0 5px rgba(16,185,129,0.55)",
                transition: "all 0.3s ease",
              }}
            />
            <span
              className="text-[10px] font-medium"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
              }}
            >
              {disabled ? "analyzing market data…" : "FinQ"}
            </span>
          </div>

          {/* Textarea + send */}
          <div className="flex items-end gap-3 px-4 py-3">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKey}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={
                disabled
                  ? "FinQ is thinking…"
                  : "Ask about stocks, earnings, markets…"
              }
              disabled={disabled}
              rows={1}
              style={{
                flex: 1,
                background: "transparent",
                color: "var(--text-primary)",
                resize: "none",
                outline: "none",
                fontSize: "0.875rem",
                lineHeight: "1.6",
                minHeight: "24px",
                maxHeight: "160px",
                fontFamily: "var(--font-body)",
                opacity: disabled ? 0.45 : 1,
                caretColor: "var(--primary-light)",
              }}
            />

            {/* Send button */}
            <button
              onClick={submit}
              disabled={disabled || !hasValue}
              style={{
                flexShrink: 0,
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: disabled || !hasValue ? "default" : "pointer",
                background:
                  disabled || !hasValue
                    ? "var(--surface-3)"
                    : "linear-gradient(135deg, #3d4ef0 0%, #6b7df5 100%)",
                boxShadow:
                  disabled || !hasValue
                    ? "none"
                    : "0 4px 14px rgba(91,110,245,0.32)",
                transition: "all 0.2s ease",
                color:
                  disabled || !hasValue ? "var(--text-muted)" : "#fff",
              }}
              onMouseEnter={(e) => {
                if (!disabled && hasValue) {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 6px 22px rgba(91,110,245,0.48)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "scale(1.06)";
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled && hasValue) {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 4px 14px rgba(91,110,245,0.32)";
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                }
              }}
            >
              {disabled ? (
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-20"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-80"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Hint */}
        <p
          className="text-center mt-2 text-[10px]"
          style={{
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
          }}
        >
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
