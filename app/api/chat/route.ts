import OpenAI from "openai";
import {
  buildSystemPrompt,
  loadAiPolicy,
  lookupTemplate,
  lookupClarifyTemplate,
} from "@/lib/ai-context";

const client = new OpenAI();

interface ClassificationOutput {
  predicted_category: string;
  response_template_id: string | null;
  clarify_template_key: string | null;
  needs_human: boolean;
  show_support_link: boolean;
  required_case_info: string[];
}

export async function POST(request: Request) {
  const { messages } = await request.json();

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  const systemPrompt = buildSystemPrompt();
  const policy = loadAiPolicy();

  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: openaiMessages,
  });

  const rawText = completion.choices[0].message.content ?? "";

  let classification: ClassificationOutput;

  try {
    classification = JSON.parse(rawText);
  } catch {
    return Response.json(
      {
        response:
          "I'm having trouble processing your request. Please contact support directly.",
        action: "escalate",
        show_support_link: true,
        required_case_info: [],
      },
      { status: 200 }
    );
  }

  const isEscalation =
    classification.predicted_category === "immediate_escalation";
  const isClarify = classification.predicted_category === "clarify";

  const responseText =
    lookupClarifyTemplate(policy, classification.clarify_template_key) ??
    lookupTemplate(policy, classification.response_template_id) ??
    "I'm not able to answer that right now. Please contact our support team.";

  return Response.json({
    response: responseText,
    action: isEscalation ? "escalate" : isClarify ? "clarify" : "answer",
    show_support_link: classification.show_support_link,
    required_case_info: classification.required_case_info ?? [],
  });
}
