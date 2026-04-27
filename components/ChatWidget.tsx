"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChatMessage as ChatMessageType,
  AIResponse,
  EscalationInfo,
  ChatPhase,
} from "@/types/chat";
import ChatMessage from "./ChatMessage";
import { classifyInput, buildResponseText } from "@/lib/classifier";

const GREETING: ChatMessageType = {
  id: "greeting",
  role: "assistant",
  content:
    "Hi! I'm here to help with questions about the self-service currency exchange kiosk.\n\nFor the most accurate answer, please describe your issue in 2 or more words. If you need immediate support, you can also contact us directly.",
  showSupportLink: false,
  timestamp: new Date(),
};

const LEGAL_NOTICE =
  "📋 상담사 연결 안내\n\n고객응대근로자를 보호하기 위하여 「산업안전보건법」 제41조에 따라, 상담 중 폭언·욕설·성희롱 등 부적절한 행위 시 상담이 제한될 수 있습니다. 원활한 상담을 위해 정중한 언어 사용에 협조해 주시기 바랍니다.\n\n✅ Your request has been sent to our support team. An agent will follow up with you shortly.";

const COLLECTION_STEPS: Array<{
  field: keyof EscalationInfo;
  label: string;
  question: string;
  placeholder: string;
}> = [
  {
    field: "location",
    label: "Store location",
    question: "What is the store name or location where you used the kiosk?",
    placeholder: "e.g. Lotte Mart Jamsil, B1F",
  },
  {
    field: "currencyAndAmount",
    label: "Currency & amount",
    question: "What currency were you exchanging, and how much?\n(e.g. USD 200 / JPY 50,000)",
    placeholder: "e.g. USD 200",
  },
  {
    field: "problem",
    label: "Issue description",
    question: "Please describe the issue in more detail.",
    placeholder: "Describe what happened...",
  },
  {
    field: "photo",
    label: "Photo / screenshot",
    question: "Do you have a photo or screenshot?\nIf yes, describe it briefly. If not, type 'none'.",
    placeholder: "Describe your photo, or type 'none'",
  },
];

export default function ChatWidget() {
  const [messages, setMessages] = useState<ChatMessageType[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [clarifyCount, setClarifyCount] = useState(0);
  const [phase, setPhase] = useState<ChatPhase>("chat");
  const [collectionStep, setCollectionStep] = useState(0);
  const [escalationInfo, setEscalationInfo] = useState<Partial<EscalationInfo>>(
    {}
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function generateId() {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function addBotMessage(content: string) {
    setMessages((prev) => [
      ...prev,
      { id: generateId(), role: "assistant", content, timestamp: new Date() },
    ]);
  }

  function startCollection() {
    setPhase("collecting");
    setCollectionStep(0);
  }

  async function submitEscalation(info: EscalationInfo) {
    setPhase("submitting");
    setIsLoading(true);

    try {
      const res = await fetch("/api/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, info }),
      });

      if (!res.ok) throw new Error("webhook_failed");
      setPhase("connected");
      addBotMessage(LEGAL_NOTICE);
    } catch {
      setPhase("connected");
      addBotMessage(
        "✅ Your information has been recorded. Please contact our support team directly — we were unable to send the automatic notification this time."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCollectionInput(value: string) {
    const userMsg: ChatMessageType = {
      id: generateId(),
      role: "user",
      content: value,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const field = COLLECTION_STEPS[collectionStep].field;
    const newInfo = { ...escalationInfo, [field]: value };
    setEscalationInfo(newInfo);

    const isLastStep = collectionStep === COLLECTION_STEPS.length - 1;

    if (isLastStep) {
      await submitEscalation(newInfo as EscalationInfo);
    } else {
      setCollectionStep((s) => s + 1);
    }
  }

  async function callAI(
    history: ChatMessageType[],
    userText: string
  ): Promise<AIResponse | null> {
    const firstUserIdx = history.findIndex((m) => m.role === "user");
    const priorMessages =
      firstUserIdx >= 0
        ? history
            .slice(firstUserIdx)
            .map((m) => ({ role: m.role, content: m.content }))
        : [];
    const apiMessages = [...priorMessages, { role: "user", content: userText }];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    if (phase === "collecting") {
      await handleCollectionInput(trimmed);
      return;
    }

    if (phase !== "chat") return;

    const userMessage: ChatMessageType = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const aiResult = await callAI(messages, trimmed);

    let responseText: string;
    let newClarifyCount = clarifyCount;
    let shouldEscalate = false;

    if (aiResult) {
      responseText = aiResult.response;
      shouldEscalate = aiResult.action === "escalate";
      newClarifyCount = aiResult.action === "clarify" ? clarifyCount + 1 : 0;

      if (newClarifyCount >= 2) {
        responseText =
          "I'm having trouble understanding your request. Let me connect you with our support team.";
        shouldEscalate = true;
        newClarifyCount = 0;
      }
    } else {
      const result = classifyInput(trimmed);
      responseText = buildResponseText(result);
      shouldEscalate =
        result.predictedCategory === "immediate_escalation" ||
        result.showSupportLink;

      if (result.predictedCategory === "clarify") {
        newClarifyCount += 1;
        if (newClarifyCount >= 2) {
          responseText =
            "I'm having trouble understanding your request. Let me connect you with our support team.";
          shouldEscalate = true;
          newClarifyCount = 0;
        }
      } else {
        newClarifyCount = 0;
      }
    }

    setClarifyCount(newClarifyCount);

    const assistantMessage: ChatMessageType = {
      id: generateId(),
      role: "assistant",
      content: responseText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);

    if (shouldEscalate) {
      startCollection();
    }
  }

  const step = COLLECTION_STEPS[collectionStep];

  return (
    <div className="relative flex flex-col flex-1 overflow-hidden">
      {/* Safe-area top spacer */}
      <div className="shrink-0 bg-white" style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-white">
        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900">Exchange Support</p>
          <p className="text-xs text-gray-400">
            {phase === "connected" ? "Agent notified" : "AI Assistant"}
          </p>
        </div>
        {phase === "connected" && (
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-white">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && phase === "chat" && (
          <div className="flex justify-start mb-3">
            <div className="flex flex-col items-center gap-0.5 mr-2 mt-1 shrink-0">
              <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-[9px] font-semibold text-gray-400 tracking-wider">AI</span>
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 mt-1">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Normal chat input */}
      {phase === "chat" && (
        <div className="border-t border-gray-200 bg-white px-4 pt-2 pb-[max(12px,env(safe-area-inset-bottom))]">
          <p className="text-[11px] text-gray-400 mb-2">
            Describe your issue in 2+ words for the best answer.
          </p>
          <form onSubmit={handleSubmit} className="pb-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              disabled={isLoading}
              enterKeyHint="send"
              className="w-full px-4 py-3 text-[16px] leading-snug bg-gray-700 text-white placeholder:text-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              autoComplete="off"
            />
          </form>
        </div>
      )}

      {phase === "connected" && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          <p className="text-center text-xs text-gray-400">
            상담팀에 전달 완료 · 곧 연락드리겠습니다
          </p>
        </div>
      )}

      {/* ── Agent connection overlay ─────────────────────────── */}
      {(phase === "collecting" || phase === "submitting") && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          {/* Scrim */}
          <div className="flex-1 bg-black/40" />

          {/* Bottom sheet */}
          <div className="animate-slide-up bg-white rounded-t-[28px] px-5 pt-6 pb-[max(32px,env(safe-area-inset-bottom))] shadow-2xl">

            {/* Sheet handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

            {/* Agent header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">Connecting to Support</p>
                <p className="text-xs text-gray-400">Please provide a few details</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[11px] text-gray-400 font-medium">In progress</span>
              </div>
            </div>

            {/* Step progress bar */}
            <div className="flex gap-1.5 mb-1">
              {COLLECTION_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    i <= collectionStep ? "bg-gray-900" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mb-5 font-medium tracking-wide uppercase">
              Step {collectionStep + 1} of {COLLECTION_STEPS.length}
              {step && ` · ${step.label}`}
            </p>

            {/* Question */}
            <p className="text-[15px] font-semibold text-gray-900 mb-5 leading-snug whitespace-pre-line">
              {phase === "submitting"
                ? "Sending your information to the support team…"
                : step?.question}
            </p>

            {/* Input row */}
            {phase === "collecting" && (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  key={collectionStep}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={step?.placeholder}
                  autoFocus
                  enterKeyHint="send"
                  className="flex-1 px-4 py-3 text-[16px] leading-snug bg-gray-100 text-gray-900 placeholder:text-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-12 h-12 bg-gray-900 text-white rounded-xl flex items-center justify-center disabled:opacity-30 shrink-0 transition-opacity"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </form>
            )}

            {phase === "submitting" && (
              <div className="flex justify-center py-1">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
