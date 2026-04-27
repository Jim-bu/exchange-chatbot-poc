export type MessageRole = "user" | "assistant" | "system";

export type Category =
  | "direct_answer"
  | "guided_check"
  | "clarify"
  | "answer_then_escalate"
  | "immediate_escalation";

export type InputForm =
  | "single_word"
  | "short_phrase"
  | "sentence"
  | "detailed_multi_issue_message";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  isAgent?: boolean;
  showSupportLink?: boolean;
  requiredCaseInfo?: string[];
  timestamp: Date;
}

export interface ClassificationResult {
  originalInput: string;
  normalizedInput: string;
  language: string;
  inputForm: InputForm;
  containsMultipleIssues: boolean;
  containsTransactionRisk: boolean;
  dominantIntent: string | null;
  secondaryIntents: string[];
  predictedCategory: Category;
  confidence: number;
  topCandidates: { intent: string; score: number }[];
  decisionReason: string;
  responseTemplateId: string | null;
  clarifyTemplateKey: string | null;
  needsHuman: boolean;
  showSupportLink: boolean;
  requiredCaseInfo: string[];
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
}

export interface AIResponse {
  response: string;
  action: "answer" | "clarify" | "escalate";
  show_support_link: boolean;
  required_case_info: string[];
}

export interface EscalationInfo {
  location: string;
  currencyAndAmount: string;
  problem: string;
  photo: string;
}

export type ChatPhase =
  | "chat"
  | "collecting"
  | "submitting"
  | "waiting"
  | "handoff"
  | "closed";
