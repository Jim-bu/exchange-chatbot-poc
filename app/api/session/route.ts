import { createSession, listSessions } from "@/lib/session-store";

export async function GET() {
  return Response.json({ sessions: listSessions() });
}

export async function POST(request: Request) {
  const { id, info, transcript } = await request.json();
  const session = createSession({
    id,
    createdAt: Date.now(),
    status: "waiting",
    info,
    transcript,
  });
  return Response.json({ ok: true, session });
}
