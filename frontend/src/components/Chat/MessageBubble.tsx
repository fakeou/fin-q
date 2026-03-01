import ReactMarkdown from "react-markdown";
import type { Message } from "../../types/api";
import logoImg from "../../assets/imgs/logo.png";

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end" style={{ animation: "fadeUp 0.3s ease-out" }}>
        <div
          className="max-w-[75%] px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed"
          style={{
            background: "linear-gradient(135deg, #3d4ef0 0%, #6b44e0 100%)",
            color: "#f0f4ff",
            boxShadow: "0 4px 18px rgba(91,110,245,0.28)",
            fontFamily: "var(--font-body)",
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex justify-start gap-3"
      style={{ animation: "fadeUp 0.3s ease-out" }}
    >
      {/* FinQ avatar */}
      <div
        className="w-7 h-7 rounded-xl flex-shrink-0 mt-0.5 overflow-hidden"
        style={{
          border: "1px solid rgba(91,110,245,0.28)",
          boxShadow: "0 0 8px rgba(91,110,245,0.14)",
        }}
      >
        <img src={logoImg} alt="FinQ" className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0 max-w-[90%] space-y-3">
        {/* ── Error ── */}
        {message.error && (
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{
              background: "rgba(248,113,113,0.06)",
              border: "1px solid rgba(248,113,113,0.2)",
            }}
          >
            <p
              className="text-xs font-semibold mb-1"
              style={{ color: "#f87171", fontFamily: "var(--font-mono)" }}
            >
              Error
            </p>
            <span
              style={{ color: "#fca5a5", fontFamily: "var(--font-body)" }}
            >
              {message.error}
            </span>
          </div>
        )}

        {!message.error && (
          <>
            {/* ── Planning card ── */}
            {message.planningTasks && message.planningTasks.length > 0 && (
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                }}
              >
                {/* Card header */}
                <div
                  className="flex items-center gap-2.5 px-4 py-2.5"
                  style={{
                    background: "var(--surface-3)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {message.isStreaming && !message.content ? (
                    <Spinner size={3} />
                  ) : (
                    <svg
                      className="w-3 h-3 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      style={{ color: "var(--emerald)" }}
                    >
                      <polyline
                        points="20 6 9 17 4 12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <span
                    className="text-[10px] font-semibold uppercase tracking-widest"
                    style={{
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {message.isStreaming && !message.content
                      ? "Analyzing…"
                      : "Analysis complete"}
                  </span>
                </div>

                {/* Steps */}
                <div className="px-4 py-3 space-y-2">
                  {message.planningTasks.map((task, i) => {
                    const isActive = message.currentTask === task;
                    const taskIdx =
                      message.planningTasks?.indexOf(
                        message.currentTask ?? ""
                      ) ?? -1;
                    const isDone =
                      !message.isStreaming ||
                      (message.isStreaming && !isActive && i < taskIdx);

                    return (
                      <div key={i} className="flex items-center gap-3">
                        {/* Step badge */}
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isActive
                              ? "rgba(91,110,245,0.18)"
                              : isDone && !message.isStreaming
                              ? "rgba(16,185,129,0.14)"
                              : "var(--surface-3)",
                            border: `1px solid ${
                              isActive
                                ? "rgba(91,110,245,0.38)"
                                : isDone && !message.isStreaming
                                ? "rgba(16,185,129,0.28)"
                                : "var(--border)"
                            }`,
                          }}
                        >
                          {isActive ? (
                            <Spinner size={2.5} />
                          ) : isDone && !message.isStreaming ? (
                            <svg
                              className="w-2.5 h-2.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                              style={{ color: "var(--emerald)" }}
                            >
                              <polyline
                                points="20 6 9 17 4 12"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : (
                            <span
                              style={{
                                fontSize: "9px",
                                color: "var(--text-muted)",
                                fontFamily: "var(--font-mono)",
                                fontWeight: 600,
                              }}
                            >
                              {i + 1}
                            </span>
                          )}
                        </div>

                        <span
                          className="text-xs"
                          style={{
                            color: isActive
                              ? "var(--text-primary)"
                              : isDone && !message.isStreaming
                              ? "var(--text-muted)"
                              : "var(--text-secondary)",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          {task}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Typing indicator (no content yet, no tasks) ── */}
            {message.isStreaming &&
              !message.content &&
              !message.planningTasks?.length && (
                <div
                  className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <TypingDots />
                </div>
              )}

            {/* ── Answer ── */}
            {message.content && (
              <div
                className="rounded-xl px-5 py-4"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="prose">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                {message.isStreaming && (
                  <span
                    className="inline-block w-[2px] h-[14px] ml-0.5 rounded-full align-middle animate-pulse"
                    style={{ background: "var(--primary-light)" }}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Spinner({ size }: { size: number }) {
  const s = `${size * 4}px`;
  return (
    <svg
      className="animate-spin flex-shrink-0"
      style={{ width: s, height: s, color: "var(--primary-light)" }}
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
  );
}

function TypingDots() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: "var(--text-muted)",
            display: "inline-block",
            animation: `dotsBounce 1.3s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </>
  );
}
