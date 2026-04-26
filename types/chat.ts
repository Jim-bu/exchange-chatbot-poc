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
