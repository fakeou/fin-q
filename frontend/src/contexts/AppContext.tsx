import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { Conversation, Message } from "../types/api";

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface AppContextValue {
  username: string | null;
  setUsername: (name: string) => void;
  logout: () => void;
  conversations: Conversation[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  getMessages: (sessionId: string) => Message[];
  addUserMessage: (sessionId: string, content: string) => string;
  startAssistantMessage: (sessionId: string) => string;
  updateAssistantMessage: (
    sessionId: string,
    msgId: string,
    patch: Partial<Message>
  ) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "finq_state";

function loadState(): { username: string | null; conversations: Conversation[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { username: null, conversations: [] };
}

function saveState(state: { username: string | null; conversations: Conversation[] }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const initial = loadState();
  const [username, setUsernameState] = useState<string | null>(initial.username);
  const [conversations, setConversations] = useState<Conversation[]>(
    initial.conversations
  );
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const persist = useCallback(
    (nextConvs: Conversation[], nextUser: string | null) => {
      saveState({ username: nextUser, conversations: nextConvs });
    },
    []
  );

  const setUsername = useCallback(
    (name: string) => {
      setUsernameState(name);
      persist(conversations, name);
    },
    [conversations, persist]
  );

  const logout = useCallback(() => {
    setUsernameState(null);
    setConversations([]);
    setActiveSessionId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const createConversation = useCallback(() => {
    const id = genId();
    const conv: Conversation = {
      id,
      title: "New conversation",
      createdAt: Date.now(),
      messages: [],
    };
    setConversations((prev) => {
      const next = [conv, ...prev];
      persist(next, username);
      return next;
    });
    return id;
  }, [username, persist]);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        persist(next, username);
        return next;
      });
      if (activeSessionId === id) setActiveSessionId(null);
    },
    [username, activeSessionId, persist]
  );

  const getMessages = useCallback(
    (sessionId: string) => {
      return conversations.find((c) => c.id === sessionId)?.messages ?? [];
    },
    [conversations]
  );

  const addUserMessage = useCallback(
    (sessionId: string, content: string) => {
      const msgId = genId();
      setConversations((prev) => {
        const next = prev.map((c) => {
          if (c.id !== sessionId) return c;
          const messages = [
            ...c.messages,
            { id: msgId, role: "user" as const, content },
          ];
          // Auto-title from first user message
          const title =
            c.messages.length === 0 ? content.slice(0, 40) : c.title;
          return { ...c, title, messages };
        });
        persist(next, username);
        return next;
      });
      return msgId;
    },
    [username, persist]
  );

  const startAssistantMessage = useCallback(
    (sessionId: string) => {
      const msgId = genId();
      setConversations((prev) => {
        const next = prev.map((c) => {
          if (c.id !== sessionId) return c;
          return {
            ...c,
            messages: [
              ...c.messages,
              {
                id: msgId,
                role: "assistant" as const,
                content: "",
                isStreaming: true,
                planningTasks: [],
              },
            ],
          };
        });
        // Don't persist streaming state
        return next;
      });
      return msgId;
    },
    []
  );

  const updateAssistantMessage = useCallback(
    (sessionId: string, msgId: string, patch: Partial<Message>) => {
      setConversations((prev) => {
        const next = prev.map((c) => {
          if (c.id !== sessionId) return c;
          const messages = c.messages.map((m) =>
            m.id === msgId ? { ...m, ...patch } : m
          );
          return { ...c, messages };
        });
        // Persist only when streaming is done
        if (patch.isStreaming === false) persist(next, username);
        return next;
      });
    },
    [username, persist]
  );

  return (
    <AppContext.Provider
      value={{
        username,
        setUsername,
        logout,
        conversations,
        activeSessionId,
        setActiveSessionId,
        createConversation,
        deleteConversation,
        getMessages,
        addUserMessage,
        startAssistantMessage,
        updateAssistantMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
