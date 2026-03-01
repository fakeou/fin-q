import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import type { Conversation } from "../../types/api";
import logoImg from "../../assets/imgs/logo.png";

function groupByDate(convs: Conversation[]) {
  const now = Date.now();
  const today: Conversation[] = [];
  const yesterday: Conversation[] = [];
  const older: Conversation[] = [];
  for (const c of convs) {
    const age = now - c.createdAt;
    if (age < 86_400_000) today.push(c);
    else if (age < 172_800_000) yesterday.push(c);
    else older.push(c);
  }
  return { today, yesterday, older };
}

export default function Sidebar() {
  const { username, logout, conversations, createConversation, deleteConversation } =
    useApp();
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId?: string }>();

  function handleNew() {
    const id = createConversation();
    navigate(`/chat/${id}`);
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteConversation(id);
    if (sessionId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) navigate(`/chat/${remaining[0].id}`);
      else navigate("/chat");
    }
  }

  const { today, yesterday, older } = groupByDate(conversations);
  const avatarLetter = username?.charAt(0).toUpperCase() ?? "?";

  function ConvItem({ conv }: { conv: Conversation }) {
    const active = conv.id === sessionId;
    return (
      <div
        onClick={() => navigate(`/chat/${conv.id}`)}
        className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
        style={{
          background: active ? "rgba(91,110,245,0.1)" : "transparent",
          border: `1px solid ${active ? "rgba(91,110,245,0.22)" : "transparent"}`,
          color: active ? "var(--text-primary)" : "var(--text-muted)",
        }}
        onMouseEnter={(e) => {
          if (!active)
            (e.currentTarget as HTMLElement).style.background =
              "rgba(255,255,255,0.03)";
        }}
        onMouseLeave={(e) => {
          if (!active)
            (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        {/* Status dot */}
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background: active ? "var(--primary)" : "var(--text-muted)",
            opacity: active ? 1 : 0.35,
            boxShadow: active ? "0 0 4px rgba(91,110,245,0.6)" : "none",
          }}
        />
        <span
          className="flex-1 truncate text-xs"
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: active ? "500" : "400",
          }}
        >
          {conv.title || "New conversation"}
        </span>
        <button
          onClick={(e) => handleDelete(e, conv.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center flex-shrink-0 rounded text-xs"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "var(--red)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")
          }
        >
          ✕
        </button>
      </div>
    );
  }

  function Section({
    label,
    items,
  }: {
    label: string;
    items: Conversation[];
  }) {
    if (items.length === 0) return null;
    return (
      <div className="mb-5">
        <p
          className="px-3 mb-1.5 text-[9px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
        >
          {label}
        </p>
        <div className="space-y-0.5">
          {items.map((c) => (
            <ConvItem key={c.id} conv={c} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col"
      style={{
        background: "var(--surface-1)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* ── Logo + New chat ── */}
      <div className="px-4 pt-5 pb-4">
        {/* Logo row */}
        <div className="flex items-center gap-2.5 mb-5">
          <div
            className="w-8 h-8 rounded-xl flex-shrink-0 overflow-hidden"
            style={{ boxShadow: "0 0 14px rgba(91,110,245,0.38)" }}
          >
            <img src={logoImg} alt="FinQ" className="w-full h-full object-cover" />
          </div>

          <span
            className="font-bold text-base tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            FinQ
          </span>

          <div className="ml-auto">
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{
                background: "rgba(16,185,129,0.12)",
                color: "var(--emerald)",
                fontFamily: "var(--font-mono)",
                border: "1px solid rgba(16,185,129,0.2)",
                letterSpacing: "0.04em",
              }}
            >
              LIVE
            </span>
          </div>
        </div>

        {/* New analysis button */}
        <button
          onClick={handleNew}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{
            background: "transparent",
            border: "1px solid rgba(91,110,245,0.22)",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-body)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "rgba(91,110,245,0.08)";
            el.style.borderColor = "rgba(91,110,245,0.38)";
            el.style.color = "var(--text-primary)";
            el.style.boxShadow = "0 0 14px rgba(91,110,245,0.1)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "transparent";
            el.style.borderColor = "rgba(91,110,245,0.22)";
            el.style.color = "var(--text-secondary)";
            el.style.boxShadow = "none";
          }}
        >
          <div
            className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(91,110,245,0.15)" }}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              style={{ color: "var(--primary-light)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          New analysis
        </button>
      </div>

      {/* Divider */}
      <div
        className="mx-4 mb-3"
        style={{ height: "1px", background: "var(--border)" }}
      />

      {/* ── Conversation list ── */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div
              className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
              }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                style={{ color: "var(--text-muted)" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <p
              className="text-xs"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              No conversations yet
            </p>
          </div>
        )}
        <Section label="Today" items={today} />
        <Section label="Yesterday" items={yesterday} />
        <Section label="Earlier" items={older} />
      </div>

      {/* ── User section ── */}
      <div
        className="mx-3 mb-3 p-3 rounded-xl"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #5b6ef5 0%, #8b5cf6 100%)",
              fontFamily: "var(--font-display)",
              boxShadow: "0 0 8px rgba(91,110,245,0.25)",
            }}
          >
            {avatarLetter}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-semibold truncate"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.01em",
              }}
            >
              {username}
            </p>
            <p
              className="text-[10px]"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              analyst
            </p>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Logout"
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(248,113,113,0.1)";
              el.style.color = "var(--red)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "transparent";
              el.style.color = "var(--text-muted)";
            }}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
