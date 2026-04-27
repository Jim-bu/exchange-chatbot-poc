import { NextRequest } from "next/server";

interface WebhookPayload {
  body: string;
  connectColor?: string;
  connectInfo?: Array<{ title: string; description: string }>;
}

export async function POST(request: NextRequest) {
  const { messages, info } = await request.json();

  const webhookUrl = process.env.AGENT_WEBHOOK_URL;
  if (!webhookUrl) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  const history: string = messages
    .map((m: { role: string; content: string }) => {
      const label = m.role === "user" ? "Customer" : "Bot";
      return `[${label}] ${m.content}`;
    })
    .join("\n\n");

  const timestamp = new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const payload: WebhookPayload = {
    body: `🔔 Customer Support Request — ${timestamp}`,
    connectColor: "#E8534F",
    connectInfo: [
      { title: "📍 Location", description: info.location },
      { title: "💱 Currency / Amount", description: info.currencyAndAmount },
      { title: "⚠️ Issue", description: info.problem },
      {
        title: "📸 Photo / Screenshot",
        description:
          info.photo && info.photo.toLowerCase() !== "none"
            ? info.photo
            : "None",
      },
      { title: "💬 Conversation History", description: history },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return Response.json({ error: "webhook_failed" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
