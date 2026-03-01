import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import logoImg from "../assets/imgs/logo.png";

const TICKERS = [
  { label: "S&P 500", value: "+1.24%", positive: true },
  { label: "NASDAQ",  value: "+0.87%", positive: true },
  { label: "BTC",     value: "-0.34%", positive: false },
  { label: "Gold",    value: "+0.52%", positive: true },
];

export default function LoginPage() {
  const { setUsername, createConversation, username } = useApp();
  const navigate = useNavigate();
  const [input, setInput] = useState(username ?? "");
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const name = input.trim();
    if (!name) {
      setError("Please enter a username.");
      return;
    }
    setUsername(name);
    const id = createConversation();
    navigate(`/chat/${id}`);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* Dot-grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(91,110,245,0.14) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          animation: "fadeIn 2s ease-out",
        }}
      />

      {/* Ambient glow orbs */}
      <div
        className="absolute pointer-events-none rounded-full blur-3xl"
        style={{
          top: "18%",
          left: "22%",
          width: "440px",
          height: "440px",
          background:
            "radial-gradient(circle, rgba(91,110,245,0.12) 0%, transparent 68%)",
        }}
      />
      <div
        className="absolute pointer-events-none rounded-full blur-3xl"
        style={{
          bottom: "20%",
          right: "20%",
          width: "320px",
          height: "320px",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 68%)",
        }}
      />

      {/* Corner accent — top-left */}
      <div
        className="absolute top-0 left-0 pointer-events-none opacity-20"
        style={{
          width: "200px",
          height: "200px",
          background:
            "linear-gradient(135deg, rgba(91,110,245,0.4) 0%, transparent 60%)",
          clipPath: "polygon(0 0, 100% 0, 0 100%)",
        }}
      />
      {/* Corner accent — bottom-right */}
      <div
        className="absolute bottom-0 right-0 pointer-events-none opacity-20"
        style={{
          width: "200px",
          height: "200px",
          background:
            "linear-gradient(315deg, rgba(91,110,245,0.4) 0%, transparent 60%)",
          clipPath: "polygon(100% 100%, 0 100%, 100% 0)",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-sm px-5 flex flex-col items-center">

        {/* Brand */}
        <div className="mb-10 text-center fade-up-1">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 relative overflow-hidden">
            <div
              className="absolute inset-0 rounded-2xl animate-ping"
              style={{
                background: "rgba(91,110,245,0.18)",
                animationDuration: "2.8s",
              }}
            />
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                boxShadow: "0 0 32px rgba(91,110,245,0.4), 0 0 64px rgba(91,110,245,0.15)",
                animation: "glowPulse 3s ease-in-out infinite",
              }}
            />
            <img
              src={logoImg}
              alt="FinQ logo"
              className="relative w-full h-full object-cover rounded-2xl"
            />
          </div>

          <h1
            className="text-5xl font-extrabold tracking-tight mb-2"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}
          >
            <span className="gradient-text">FinQ</span>
          </h1>
          <p
            className="text-xs tracking-widest uppercase"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.16em",
            }}
          >
            AI-powered financial intelligence
          </p>
        </div>

        {/* Login card */}
        <div
          className="glass w-full rounded-2xl p-7 fade-up-2"
          style={{
            border: "1px solid var(--border)",
            boxShadow:
              "0 24px 48px rgba(0,0,0,0.45), 0 0 0 1px var(--border), 0 0 40px rgba(91,110,245,0.06)",
          }}
        >
          <h2
            className="text-base font-bold mb-1"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.01em",
            }}
          >
            Welcome back
          </h2>
          <p
            className="text-xs mb-6"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}
          >
            Enter your username to begin analyzing
          </p>

          <form onSubmit={handleSubmit}>
            <label
              className="block text-[10px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
            >
              Username
            </label>

            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError("");
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="e.g. alice"
              autoFocus
              style={{
                width: "100%",
                background: "var(--bg)",
                color: "var(--text-primary)",
                border: `1px solid ${focused ? "rgba(91,110,245,0.5)" : "var(--border)"}`,
                boxShadow: focused
                  ? "0 0 0 3px rgba(91,110,245,0.1), 0 0 16px rgba(91,110,245,0.08)"
                  : "none",
                borderRadius: "0.75rem",
                padding: "0.72rem 1rem",
                fontSize: "0.875rem",
                outline: "none",
                transition: "all 0.2s ease",
                fontFamily: "var(--font-body)",
                marginBottom: "1rem",
                display: "block",
              }}
            />

            {error && (
              <p
                className="text-xs mb-3"
                style={{ color: "var(--red)", fontFamily: "var(--font-mono)" }}
              >
                ⚠ {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 font-semibold text-sm text-white rounded-xl py-3 transition-all"
              style={{
                background: "linear-gradient(135deg, #3d4ef0 0%, #6b7df5 100%)",
                border: "none",
                boxShadow: "0 4px 18px rgba(91,110,245,0.32)",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-1px)";
                el.style.boxShadow = "0 8px 28px rgba(91,110,245,0.48)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "0 4px 18px rgba(91,110,245,0.32)";
              }}
            >
              Enter FinQ
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
            </button>
          </form>
        </div>

        {/* Ticker chips */}
        <div className="mt-8 flex items-center gap-2 flex-wrap justify-center fade-up-3">
          {TICKERS.map((t) => (
            <div
              key={t.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>{t.label}</span>
              <span
                style={{
                  color: t.positive ? "var(--emerald)" : "var(--red)",
                  fontWeight: 500,
                }}
              >
                {t.value}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p
          className="mt-7 text-[10px] text-center fade-up-4"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}
        >
          Powered by Gemini 2.5
        </p>
      </div>
    </div>
  );
}
