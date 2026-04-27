import OpenAI from "openai";
import {
  buildSystemPrompt,
  loadAiPolicy,
  lookupTemplate,
  lookupClarifyTemplate,
} from "@/lib/ai-context";

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

  const client = new OpenAI();
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

  const isClarify = classification.predicted_category === "clarify";

  // Escalation: explicit category, OR AI flagged needs_human, OR answer_then_escalate
  // (answer_then_escalate templates already tell the user to contact support — we should
  //  collect their info so a human can actually follow up)
  const isEscalation =
    classification.predicted_category === "immediate_escalation" ||
    classification.predicted_category === "answer_then_escalate" ||
    classification.needs_human === true;

  const clarifyText = lookupClarifyTemplate(policy, classification.clarify_template_key);
  const templateText = lookupTemplate(policy, classification.response_template_id);

  // If no template was resolved and it's not a clarify, we have an unhandled case —
  // always escalate rather than silently dropping to a generic non-actionable message.
  const noTemplateResolved = !clarifyText && !templateText && !isClarify;

  const responseText =
    clarifyText ??
    templateText ??
    "I'm having trouble understanding your request. Let me connect you with our support team.";

  const shouldEscalate = isEscalation || noTemplateResolved;

  return Response.json({
    response: responseText,
    action: shouldEscalate ? "escalate" : isClarify ? "clarify" : "answer",
    show_support_link: classification.show_support_link || shouldEscalate,
    required_case_info: classification.required_case_info ?? [],
  });
}
