import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import Sidebar from "../components/Sidebar/Sidebar";
import ChatArea from "../components/Chat/ChatArea";

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const { username, conversations, setActiveSessionId, createConversation } =
    useApp();
  const navigate = useNavigate();

  // Redirect to login if no username
  useEffect(() => {
    if (!username) navigate("/");
  }, [username, navigate]);

  // Set active session
  useEffect(() => {
    if (sessionId) {
      setActiveSessionId(sessionId);
    } else if (conversations.length > 0) {
      navigate(`/chat/${conversations[0].id}`, { replace: true });
    } else {
      const id = createConversation();
      navigate(`/chat/${id}`, { replace: true });
    }
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!username) return null;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text-primary)" }}
    >
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {sessionId ? (
          <ChatArea sessionId={sessionId} />
        ) : (
          <div
            className="flex-1 flex items-center justify-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Select or create a conversation
          </div>
        )}
      </main>
    </div>
  );
}
