// In-memory session store for POC.
// Works within a single process (local dev, single warm serverless instance).
// For production: replace with Vercel KV, Upstash Redis, or similar persistent store.

export interface HandoffMessage {
  id: string;
  role: "customer" | "agent";
  content: string;
  timestamp: number;
}

export interface Session {
  id: string;
  createdAt: number;
  status: "waiting" | "active" | "closed";
  info: {
    location: string;
    currencyAndAmount: string;
    problem: string;
    photo: string;
  };
  transcript: string;
  messages: HandoffMessage[];
}

const store = new Map<string, Session>();

export function createSession(data: Omit<Session, "messages">): Session {
  const session: Session = { ...data, messages: [] };
  store.set(session.id, session);
  return session;
}

export function getSession(id: string): Session | undefined {
  return store.get(id);
}

export function listSessions(): Session[] {
  return Array.from(store.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function addMessage(
  id: string,
  msg: Omit<HandoffMessage, "id">
): HandoffMessage | null {
  const session = store.get(id);
  if (!session) return null;
  const message: HandoffMessage = {
    id: `hm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ...msg,
  };
  session.messages.push(message);
  return message;
}

export function updateStatus(
  id: string,
  status: Session["status"]
): boolean {
  const session = store.get(id);
  if (!session) return false;
  session.status = status;
  return true;
}
