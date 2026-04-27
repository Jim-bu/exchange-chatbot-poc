import { NextRequest } from "next/server";
import {
  createSession,
  getSession,
  listSessions,
  addMessage,
  updateStatus,
} from "@/lib/session-store";

// Single route file = single Lambda on Vercel.
// All session state lives here so the in-memory store is shared across every
// request: create (POST /api/session), list (GET /api/session),
// get (GET /api/session/[id]), update (PATCH /api/session/[id]),
// message (POST /api/session/[id]/message).

type Params = { params: Promise<{ path?: string[] }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { path } = await params;

  if (!path || path.length === 0) {
    // GET /api/session → list all
    return Response.json(listSessions());
  }

  // GET /api/session/[id]
  const session = getSession(path[0]);
  if (!session) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ session });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { path } = await params;

  // POST /api/session → create
  if (!path || path.length === 0) {
    const { id, info, messages } = await req.json();
    const transcript: string = (messages ?? [])
      .map((m: { role: string; content: string }) =>
        `[${m.role === "user" ? "Customer" : "Bot"}] ${m.content}`
      )
      .join("\n\n");
    const session = createSession({
      id,
      createdAt: Date.now(),
      status: "waiting",
      info,
      transcript,
    });
    return Response.json({ ok: true, session });
  }

  // POST /api/session/[id]/message → add message
  if (path.length === 2 && path[1] === "message") {
    const { role, content } = await req.json();
    const message = addMessage(path[0], { role, content, timestamp: Date.now() });
    if (!message) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ ok: true, message });
  }

  return Response.json({ error: "not_found" }, { status: 404 });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { path } = await params;
  if (!path || path.length !== 1) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const { status } = await req.json();
  const ok = updateStatus(path[0], status);
  if (!ok) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ ok: true });
}
