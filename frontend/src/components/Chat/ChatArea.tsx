import { useEffect, useRef } from "react";
import { useApp } from "../../contexts/AppContext";
import MessageBubble from "./MessageBubble";
import InputArea from "./InputArea";
import { useChat } from "../../hooks/useChat";
import logoImg from "../../assets/imgs/logo.png";

const SUGGESTIONS = [
  {
    category: "Stocks",
    color: "#5b6ef5",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <polyline points="22 12 18 12 15 19 9 5 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    question: "Analyze Apple Q4 2024 revenue",
  },
  {
    category: "Earnings",
    color: "#10b981",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    question: "Compare Tesla vs Ford financials",
  },
  {
    category: "Crypto",
    color: "#f59e0b",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    question: "Analyze Bitcoin's price action and on-chain metrics",
  },
  {
    category: "Markets",
    color: "#8b5cf6",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    question: "Analyze S&P 500 sector performance YTD",
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function ChatArea({ sessionId }: { sessionId: string }) {
  const { conversations, username } = useApp();
  const conv = conversations.find((c) => c.id === sessionId);
  const messages = conv?.messages ?? [];
  const bottomRef = useRef<HTMLDivElement>(null);
  const { sendMessage } = useChat();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isStreaming = messages.some((m) => m.isStreaming);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Welcome state */
          <div
            className="flex flex-col items-center justify-center h-full px-6 py-10"
            style={{ animation: "fadeUp 0.5s ease-out" }}
          >
            {/* Animated logo */}
            <div className="relative mb-7">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid rgba(91,110,245,0.22)",
                  animation: "glowPulse 3.5s ease-in-out infinite",
                }}
              >
                <img src={logoImg} alt="FinQ" className="w-full h-full object-cover" />
              </div>
              {/* Live dot */}
              <div
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full"
                style={{ background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full animate-ping absolute"
                  style={{ background: "rgba(16,185,129,0.6)", animationDuration: "2s" }}
                />
                <div className="w-2 h-2 rounded-full relative" style={{ background: "var(--emerald)" }} />
              </div>
            </div>

            <h2
              className="text-2xl font-bold text-center mb-2"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              {getGreeting()},{" "}
              <span style={{ color: "var(--primary-light)" }}>
                {username || "Analyst"}
              </span>
              .
            </h2>
            <p
              className="text-sm text-center mb-10 max-w-xs"
              style={{ color: "var(--text-muted)" }}
            >
              What would you like to analyze today?
            </p>

            {/* Suggestion cards */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.category}
                  onClick={() => sendMessage(sessionId, s.question)}
                  className="text-left p-4 rounded-xl transition-all"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = `${s.color}40`;
                    el.style.background = `${s.color}0a`;
                    el.style.boxShadow = `0 4px 18px ${s.color}14`;
                    el.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--border)";
                    el.style.background = "var(--surface-2)";
                    el.style.boxShadow = "none";
                    el.style.transform = "translateY(0)";
                  }}
                >
                  {/* Category badge */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${s.color}1a`,
                        color: s.color,
                      }}
                    >
                      {s.icon}
                    </div>
                    <span
                      className="font-semibold"
                      style={{
                        color: s.color,
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      {s.category}
                    </span>
                  </div>
                  <p
                    className="text-xs leading-relaxed"
                    style={{
                      color: "var(--text-secondary)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {s.question}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message thread */
          <div className="max-w-3xl mx-auto px-5 py-7 space-y-6">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <InputArea
        sessionId={sessionId}
        onSend={(q) => sendMessage(sessionId, q)}
        disabled={isStreaming}
      />
    </div>
  );
}
