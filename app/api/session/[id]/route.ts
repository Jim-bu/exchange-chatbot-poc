import { getSession, updateStatus } from "@/lib/session-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getSession(id);
  if (!session) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json({ session });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await request.json();
  const ok = updateStatus(id, status);
  if (!ok) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
