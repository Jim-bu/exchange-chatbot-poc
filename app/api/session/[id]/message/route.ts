import { addMessage } from "@/lib/session-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { role, content } = await request.json();
  const message = addMessage(id, { role, content, timestamp: Date.now() });
  if (!message) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json({ ok: true, message });
}
