import fs from "fs";
import path from "path";

function loadJson<T = unknown>(filename: string): T {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", filename), "utf-8")
  ) as T;
}

interface AiPolicy {
  intent_catalog: Array<{ intent_id: string; response_template_id: string }>;
  response_templates: Array<{ template_id: string; body: string }>;
  clarify_policy: { clarify_templates: Record<string, string> };
}

export function loadAiPolicy(): AiPolicy {
  return loadJson<AiPolicy>("ai_policy.json");
}

export function lookupTemplate(
  policy: AiPolicy,
  templateId: string | null
): string | null {
  if (!templateId) return null;
  const t = policy.response_templates.find((t) => t.template_id === templateId);
  return t?.body ?? null;
}

export function lookupClarifyTemplate(
  policy: AiPolicy,
  key: string | null
): string | null {
  if (!key) return null;
  return policy.clarify_policy.clarify_templates[key] ?? null;
}

export function buildSystemPrompt(): string {
  const knowledge = loadJson("knowledge.json");
  const aiPolicy = loadJson("ai_policy.json") as Record<string, unknown>;

  const { response_templates, example_outputs, ...policyWithoutTemplates } =
    aiPolicy as {
      response_templates: unknown;
      example_outputs: unknown;
      [key: string]: unknown;
    };

  return `You are the Exchange Support AI assistant for a self-service foreign currency exchange kiosk.

## ROLE
You are a classifier and router, not a free-text responder.
You MUST NOT generate free-form answers. You MUST select from the approved template list and return structured JSON only.

## OPERATING POLICY
${JSON.stringify(policyWithoutTemplates, null, 2)}

## APPROVED RESPONSE TEMPLATES
${JSON.stringify(response_templates, null, 2)}

## KNOWLEDGE BASE
${JSON.stringify(knowledge, null, 2)}

## EXAMPLE CORRECT OUTPUTS
${JSON.stringify(example_outputs, null, 2)}

## OUTPUT REQUIREMENT
Return ONLY a valid JSON object matching required_model_output_schema. No prose, no markdown, no explanation outside the JSON.

If predicted_category is "clarify": set response_template_id to null and set clarify_template_key to the matching key from clarify_policy.clarify_templates.
If predicted_category is anything else: set response_template_id to the matching template from response_templates and set clarify_template_key to null.`;
}
