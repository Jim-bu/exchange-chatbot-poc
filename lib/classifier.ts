import intentMappingData from "@/data/intent_mapping.json";
import { ClassificationResult, Category, InputForm } from "@/types/chat";
import { responseTemplates, clarifyTemplates } from "./templates";

const { intents, clarify_templates, high_risk_keywords } = intentMappingData;

function detectInputForm(input: string): InputForm {
  const words = input.trim().split(/\s+/);
  if (words.length === 1) return "single_word";
  if (words.length <= 5) return "short_phrase";
  if (words.length <= 20) return "sentence";
  return "detailed_multi_issue_message";
}

function normalizeInput(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

function containsHighRiskKeyword(normalized: string): boolean {
  return high_risk_keywords.some((kw) => normalized.includes(kw.toLowerCase()));
}

function scoreIntent(normalized: string, intent: (typeof intents)[0]): number {
  let score = 0;
  const keywordMatches = intent.keywords.filter((kw) =>
    normalized.includes(kw.toLowerCase())
  );
  score += keywordMatches.length * 0.3;

  const phraseMatches = intent.sample_phrases.filter((phrase) =>
    normalized.includes(phrase.toLowerCase())
  );
  score += phraseMatches.length * 0.5;

  // bonus for exact phrase match
  if (intent.sample_phrases.some((p) => p.toLowerCase() === normalized)) {
    score += 0.3;
  }

  return Math.min(score, 1.0);
}

function detectClarifyKey(normalized: string): string | null {
  if (/\bmoney\b/.test(normalized) && !/refund|missing|wrong|incorrect/.test(normalized)) return "money";
  if (/\bcard\b/.test(normalized) && !/charged|payment/.test(normalized)) return "card";
  if (/\brate\b/.test(normalized) && !/wrong|incorrect|less/.test(normalized)) return "rate";
  if (/\bmachine\b/.test(normalized) || /\bkiosk\b/.test(normalized)) return "machine";
  return null;
}

export function classifyInput(userInput: string): ClassificationResult {
  const normalized = normalizeInput(userInput);
  const inputForm = detectInputForm(userInput);
  const hasHighRisk = containsHighRiskKeyword(normalized);

  const scored = intents
    .map((intent) => ({ intent: intent.intent_id, score: scoreIntent(normalized, intent) }))
    .sort((a, b) => b.score - a.score);

  const topCandidates = scored.slice(0, 3).filter((c) => c.score > 0);
  const top1 = topCandidates[0];
  const top2 = topCandidates[1];

  const top1Score = top1?.score ?? 0;
  const margin = top2 ? top1Score - top2.score : top1Score;

  const matchedIntent = intents.find((i) => i.intent_id === top1?.intent);
  const containsTransactionRisk = hasHighRisk || matchedIntent?.risk_level === "high";

  let predictedCategory: Category;
  let dominantIntent: string | null = null;
  let responseTemplateId: string | null = null;
  let clarifyTemplateKey: string | null = null;
  let needsHuman = false;
  let showSupportLink = false;
  let requiredCaseInfo: string[] = [];
  let decisionReason = "";

  // Immediate escalation for high-risk
  if (containsTransactionRisk && matchedIntent?.category === "immediate_escalation") {
    predictedCategory = "immediate_escalation";
    dominantIntent = top1.intent;
    responseTemplateId = matchedIntent.response_template_id;
    needsHuman = true;
    showSupportLink = true;
    decisionReason = "High-risk intent detected. Routing to immediate escalation.";
    const tmpl = responseTemplates[responseTemplateId];
    requiredCaseInfo = tmpl?.requiredCaseInfo ?? [];
  }
  // High confidence clear match
  else if (top1Score >= 0.8 && margin >= 0.1 && matchedIntent) {
    predictedCategory = matchedIntent.category as Category;
    dominantIntent = top1.intent;
    responseTemplateId = matchedIntent.response_template_id;
    showSupportLink = responseTemplates[responseTemplateId]?.showSupportLink ?? false;
    needsHuman = predictedCategory === "immediate_escalation";
    decisionReason = "High confidence match. Routing directly.";
    requiredCaseInfo = responseTemplates[responseTemplateId]?.requiredCaseInfo ?? [];
  }
  // Medium confidence — clarify if ambiguous
  else if (top1Score >= 0.55) {
    if (inputForm === "single_word" || (margin < 0.1 && inputForm === "short_phrase")) {
      const clarifyKey = detectClarifyKey(normalized);
      predictedCategory = "clarify";
      clarifyTemplateKey = clarifyKey ?? "mixed_general_and_risk_case";
      decisionReason = "Medium confidence with ambiguous input. Asking clarifying question.";
    } else if (matchedIntent) {
      predictedCategory = matchedIntent.category as Category;
      dominantIntent = top1.intent;
      responseTemplateId = matchedIntent.response_template_id;
      showSupportLink = responseTemplates[responseTemplateId]?.showSupportLink ?? false;
      needsHuman = predictedCategory === "immediate_escalation";
      decisionReason = "Medium confidence full-sentence match.";
      requiredCaseInfo = responseTemplates[responseTemplateId]?.requiredCaseInfo ?? [];
    } else {
      predictedCategory = "clarify";
      clarifyTemplateKey = "mixed_general_and_risk_case";
      decisionReason = "Moderate confidence but no clear intent match. Clarifying.";
    }
  }
  // Low confidence fallback
  else {
    if (hasHighRisk) {
      predictedCategory = "immediate_escalation";
      responseTemplateId = "tmpl_escalate_human_agent_v1";
      needsHuman = true;
      showSupportLink = true;
      decisionReason = "Low confidence but high-risk keyword present. Escalating.";
    } else {
      const clarifyKey = detectClarifyKey(normalized);
      predictedCategory = "clarify";
      clarifyTemplateKey = clarifyKey ?? "mixed_general_and_risk_case";
      decisionReason = "Low confidence and no high-risk signal. Asking clarifying question.";
    }
  }

  const secondaryIntents = topCandidates
    .slice(1)
    .filter((c) => c.score > 0.3 && c.intent !== dominantIntent)
    .map((c) => c.intent);

  return {
    originalInput: userInput,
    normalizedInput: normalized,
    language: "en",
    inputForm,
    containsMultipleIssues: secondaryIntents.length > 0,
    containsTransactionRisk,
    dominantIntent,
    secondaryIntents,
    predictedCategory,
    confidence: top1Score,
    topCandidates: topCandidates.slice(0, 3),
    decisionReason,
    responseTemplateId,
    clarifyTemplateKey,
    needsHuman,
    showSupportLink,
    requiredCaseInfo,
  };
}

export function buildResponseText(result: ClassificationResult): string {
  if (result.predictedCategory === "clarify" && result.clarifyTemplateKey) {
    return (
      clarifyTemplates[result.clarifyTemplateKey] ??
      clarifyTemplates["mixed_general_and_risk_case"]
    );
  }

  if (result.responseTemplateId) {
    const tmpl = responseTemplates[result.responseTemplateId];
    if (tmpl) {
      let text = tmpl.body;
      if (result.requiredCaseInfo && result.requiredCaseInfo.length > 0) {
        text +=
          "\n\n**Please prepare the following:**\n" +
          result.requiredCaseInfo.map((item) => `• ${item}`).join("\n");
      }
      return text;
    }
  }

  return "I'm sorry, I wasn't able to understand your request. Please contact support for assistance.";
}
