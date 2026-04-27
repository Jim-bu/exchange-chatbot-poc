import { NextRequest } from "next/server";
import { createSession } from "@/lib/session-store";

interface WebhookPayload {
  body: string;
  connectColor?: string;
  connectInfo?: Array<{ title: string; description: string }>;
}

export async function POST(request: NextRequest) {
  const { messages, info, sessionId } = await request.json();

  const host = request.headers.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const agentUrl = `${protocol}://${host}/agent`;

  const transcript: string = messages
    .map((m: { role: string; content: string }) => {
      const label = m.role === "user" ? "Customer" : "Bot";
      return `[${label}] ${m.content}`;
    })
    .join("\n\n");

  // Create session for live handoff
  const sid =
    sessionId ??
    `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  createSession({ id: sid, createdAt: Date.now(), status: "waiting", info, transcript });

  // Webhook temporarily disabled — session is created above and visible directly in the agent panel
  // const webhookUrl = process.env.AGENT_WEBHOOK_URL;
  // if (webhookUrl) {
  //   const timestamp = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  //   const payload: WebhookPayload = {
  //     body: `🔔 Customer Support Request — ${timestamp}`,
  //     connectColor: "#E8534F",
  //     connectInfo: [
  //       { title: "📍 Location", description: info.location },
  //       { title: "💱 Currency / Amount", description: info.currencyAndAmount },
  //       { title: "⚠️ Issue", description: info.problem },
  //       { title: "📸 Photo / Screenshot", description: info.photo && info.photo.toLowerCase() !== "no photo provided" ? info.photo : "None" },
  //       { title: "💬 Conversation History", description: transcript },
  //       { title: "🖥️ Agent Panel", description: `${agentUrl}?session=${sid}` },
  //     ],
  //   };
  //   await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  // }

  return Response.json({ ok: true, sessionId: sid });
}
