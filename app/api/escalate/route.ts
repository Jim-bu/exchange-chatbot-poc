import { NextRequest } from "next/server";

interface JandiPayload {
  body: string;
  connectColor?: string;
  connectInfo?: Array<{ title: string; description: string }>;
}

export async function POST(request: NextRequest) {
  const { messages, info } = await request.json();

  const webhookUrl = process.env.JANDI_WEBHOOK_URL;
  if (!webhookUrl) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  const history: string = messages
    .map((m: { role: string; content: string }) => {
      const label = m.role === "user" ? "고객" : "봇";
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

  const payload: JandiPayload = {
    body: `🔔 환전 키오스크 고객 상담 요청 — ${timestamp}`,
    connectColor: "#E8534F",
    connectInfo: [
      { title: "📍 위치 / 매장", description: info.location },
      { title: "💱 통화 / 금액", description: info.currencyAndAmount },
      { title: "⚠️ 문제 내용", description: info.problem },
      {
        title: "📸 사진 / 스크린샷",
        description:
          info.photo && info.photo.toLowerCase() !== "none"
            ? info.photo
            : "없음",
      },
      { title: "💬 전체 대화 내역", description: history },
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
