import { NextRequest } from "next/server";

// Session creation is now handled client-side via POST /api/session
// so that all session state lives in the single [[...path]] Lambda.
// This route only sends the webhook notification (currently disabled).

export async function POST(request: NextRequest) {
  const { messages, sessionId } = await request.json();

  const host = request.headers.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const agentUrl = `${protocol}://${host}/agent`;

  const transcript: string = messages
    .map((m: { role: string; content: string }) => {
      const label = m.role === "user" ? "Customer" : "Bot";
      return `[${label}] ${m.content}`;
    })
    .join("\n\n");

  // Webhook temporarily disabled — sessions appear directly in agent panel
  // const webhookUrl = process.env.AGENT_WEBHOOK_URL;
  // if (webhookUrl) {
  //   const timestamp = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  //   const payload = {
  //     body: `🔔 Customer Support Request — ${timestamp}`,
  //     connectColor: "#E8534F",
  //     connectInfo: [
  //       { title: "📍 Location", description: info.location },
  //       { title: "💱 Currency / Amount", description: info.currencyAndAmount },
  //       { title: "⚠️ Issue", description: info.problem },
  //       { title: "📸 Photo", description: info.photo?.toLowerCase() !== "no photo provided" ? info.photo : "None" },
  //       { title: "💬 Conversation", description: transcript },
  //       { title: "🖥️ Agent Panel", description: `${agentUrl}?session=${sessionId}` },
  //     ],
  //   };
  //   await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  // }

  void transcript; void agentUrl;
  return Response.json({ ok: true, sessionId });
}
