"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  ChatMessage as ChatMessageType,
  AIResponse,
  EscalationInfo,
  ChatPhase,
} from "@/types/chat";
import { detectLang, translations, Lang } from "@/lib/i18n";
import ChatMessage from "./ChatMessage";
import { classifyInput, buildResponseText } from "@/lib/classifier";

const STEP_FIELDS: Array<keyof EscalationInfo> = [
  "location",
  "currencyAndAmount",
  "problem",
  "photo",
];

function getSafeLang(): Lang {
  return typeof window === "undefined" ? "en" : detectLang();
}

function makeGreeting(lang: Lang): ChatMessageType {
  return {
    id: "greeting",
    role: "assistant",
    content: translations[lang].greeting,
    showSupportLink: false,
    timestamp: new Date(),
  };
}

function generateId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function ChatWidget() {
  const [lang] = useState<Lang>(getSafeLang);
  const [messages, setMessages] = useState<ChatMessageType[]>(() => [
    makeGreeting(getSafeLang()),
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [clarifyCount, setClarifyCount] = useState(0);
  const [phase, setPhase] = useState<ChatPhase>("chat");
  const [collectionStep, setCollectionStep] = useState(0);
  const [escalationInfo, setEscalationInfo] = useState<Partial<EscalationInfo>>({});
  const [sessionId] = useState<string>(generateSessionId);
  const [knownMsgIds, setKnownMsgIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);

  const t = translations[lang];
  const collectionSteps = STEP_FIELDS.map((field, i) => ({
    field,
    ...t.steps[i],
  }));
  const step = collectionSteps[collectionStep];

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll session for agent messages during waiting/handoff
  useEffect(() => {
    if (phase !== "waiting" && phase !== "handoff") return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        const session = data.session;

        if (session.status === "active" && phase === "waiting") {
          setPhase("handoff");
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: "assistant",
              isAgent: true,
              content: t.handoffAgentJoined,
              timestamp: new Date(),
            },
          ]);
        }

        if (session.status === "closed") {
          setPhase("closed");
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: "assistant",
              content: t.closedMessage,
              timestamp: new Date(),
            },
          ]);
        }

        // Append new agent messages
        const newMsgs = (session.messages as Array<{
          id: string;
          role: string;
          content: string;
          timestamp: number;
        }>).filter(
          (m) => m.role === "agent" && !knownMsgIds.has(m.id)
        );

        if (newMsgs.length > 0) {
          setKnownMsgIds((prev) => {
            const next = new Set(prev);
            newMsgs.forEach((m) => next.add(m.id));
            return next;
          });
          setMessages((prev) => [
            ...prev,
            ...newMsgs.map((m) => ({
              id: m.id,
              role: "assistant" as const,
              isAgent: true,
              content: m.content,
              timestamp: new Date(m.timestamp),
            })),
          ]);
        }
      } catch {
        // silent — keep polling
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [phase, sessionId, knownMsgIds, t]);

  function addBotMessage(content: string) {
    setMessages((prev) => [
      ...prev,
      { id: generateId(), role: "assistant", content, timestamp: new Date() },
    ]);
  }

  function startCollection() {
    setPhase("collecting");
    setCollectionStep(0);
    setPhotoPreview(null);
    setPhotoFileName(null);
  }

  async function submitEscalation(info: EscalationInfo) {
    setPhase("submitting");
    setIsLoading(true);

    try {
      const res = await fetch("/api/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, info, sessionId }),
      });

      if (!res.ok) throw new Error("escalate_failed");

      setPhase("waiting");
      addBotMessage(t.legalNotice);
      addBotMessage(t.waitingMessage);
    } catch {
      setPhase("closed");
      addBotMessage(t.errorFallback);
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

    const field = collectionSteps[collectionStep].field;
    const newInfo = { ...escalationInfo, [field]: value };
    setEscalationInfo(newInfo);

    if (collectionStep === collectionSteps.length - 1) {
      await submitEscalation(newInfo as EscalationInfo);
    } else {
      setCollectionStep((s) => s + 1);
    }
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handlePhotoSubmit() {
    const value = photoFileName
      ? `Photo provided (${photoFileName})`
      : "Photo provided";
    handleCollectionInput(value);
    setPhotoPreview(null);
    setPhotoFileName(null);
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
    const apiMessages = [
      ...priorMessages,
      { role: "user", content: userText },
    ];

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

  async function closeSession() {
    await fetch(`/api/session/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    setPhase("closed");
    setMessages((prev) => [
      ...prev,
      { id: generateId(), role: "assistant", content: t.closedMessage, timestamp: new Date() },
    ]);
  }

  async function sendHandoffMessage(text: string) {
    const userMsg: ChatMessageType = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    await fetch(`/api/session/${sessionId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "customer", content: text }),
    });
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    if (phase === "collecting") {
      await handleCollectionInput(trimmed);
      return;
    }

    if (phase === "handoff") {
      await sendHandoffMessage(trimmed);
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
      newClarifyCount =
        aiResult.action === "clarify" ? clarifyCount + 1 : 0;

      if (newClarifyCount >= 2) {
        responseText = t.clarifyFallback;
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
          responseText = t.clarifyFallback;
          shouldEscalate = true;
          newClarifyCount = 0;
        }
      } else {
        newClarifyCount = 0;
      }
    }

    setClarifyCount(newClarifyCount);

    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      },
    ]);
    setIsLoading(false);

    if (shouldEscalate) startCollection();
  }

  // ── Header subtitle ──────────────────────────────────────────
  const headerSub =
    phase === "handoff"
      ? t.headerSubHandoff
      : phase === "waiting"
      ? t.headerSubWaiting
      : phase === "closed"
      ? t.headerSubConnected
      : t.headerSubAI;

  return (
    <div className="relative flex flex-col flex-1 overflow-hidden">
      {/* Safe-area top spacer */}
      <div
        className="shrink-0 bg-white"
        style={{ height: "env(safe-area-inset-top)" }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-white">
        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900">{t.headerTitle}</p>
          <p className="text-xs text-gray-400">{headerSub}</p>
        </div>
        {(phase === "waiting") && (
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
        )}
        {(phase === "handoff") && (
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-white">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Waiting spinner */}
        {phase === "waiting" && (
          <div className="flex items-center gap-2 px-2 py-3 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            <span>Waiting for agent...</span>
          </div>
        )}

        {isLoading && phase === "chat" && (
          <div className="flex justify-start mb-3">
            <div className="flex flex-col items-center gap-0.5 mr-2 mt-1 shrink-0">
              <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
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

      {/* Chat input */}
      {phase === "chat" && (
        <div className="border-t border-gray-200 bg-white px-4 pt-2 pb-[max(12px,env(safe-area-inset-bottom))]">
          <p className="text-[11px] text-gray-400 mb-2">{t.inputHint}</p>
          <form onSubmit={handleSubmit} className="pb-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.inputPlaceholder}
              disabled={isLoading}
              enterKeyHint="send"
              className="w-full px-4 py-3 text-[16px] leading-snug bg-gray-700 text-white placeholder:text-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              autoComplete="off"
            />
          </form>
        </div>
      )}

      {/* Handoff input */}
      {phase === "handoff" && (
        <div className="border-t border-blue-100 bg-white px-4 pt-2 pb-[max(12px,env(safe-area-inset-bottom))]">
          <form onSubmit={handleSubmit} className="flex gap-2 pb-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.handoffInputPlaceholder}
              enterKeyHint="send"
              className="flex-1 px-4 py-3 text-[16px] leading-snug bg-blue-50 text-gray-900 placeholder:text-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-30 shrink-0 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </form>
          <button
            onClick={closeSession}
            className="w-full py-2 text-[11px] text-gray-400 hover:text-red-500 transition-colors"
          >
            {t.endSession}
          </button>
        </div>
      )}

      {/* Waiting / Closed footer */}
      {(phase === "waiting" || phase === "closed") && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 pb-[max(14px,env(safe-area-inset-bottom))] flex flex-col items-center gap-2">
          <p className="text-xs text-gray-400">
            {phase === "waiting" ? t.headerSubWaiting : t.connectedFooter}
          </p>
          {phase === "waiting" && (
            <button
              onClick={closeSession}
              className="text-[11px] text-gray-400 hover:text-red-500 transition-colors"
            >
              {t.endSession}
            </button>
          )}
        </div>
      )}

      {/* ── Agent connection overlay ─────────────────────────── */}
      {(phase === "collecting" || phase === "submitting") && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="flex-1 bg-black/40" />
          <div className="animate-slide-up bg-white rounded-t-[28px] px-5 pt-6 pb-[max(32px,env(safe-area-inset-bottom))] shadow-2xl">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">{t.connectingTitle}</p>
                <p className="text-xs text-gray-400">{t.connectingSubtitle}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[11px] text-gray-400 font-medium">{t.inProgress}</span>
              </div>
            </div>

            <div className="flex gap-1.5 mb-1">
              {collectionSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    i <= collectionStep ? "bg-gray-900" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mb-5 font-medium tracking-wide uppercase">
              {step && t.stepOf(collectionStep + 1, collectionSteps.length, step.label)}
            </p>

            <p className="text-[15px] font-semibold text-gray-900 mb-5 leading-snug whitespace-pre-line">
              {phase === "submitting" ? t.submitting : step?.question}
            </p>

            {/* Text input (steps 1–3) */}
            {phase === "collecting" && step?.field !== "photo" && (
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

            {/* Photo step (step 4) */}
            {phase === "collecting" && step?.field === "photo" && (
              <div className="space-y-3">
                {photoPreview ? (
                  <>
                    <div className="relative w-full h-44 rounded-2xl overflow-hidden">
                      <Image src={photoPreview} alt="preview" fill className="object-cover" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setPhotoPreview(null); setPhotoFileName(null); }}
                        className="flex-1 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl"
                      >
                        {t.photoRetake}
                      </button>
                      <button
                        onClick={handlePhotoSubmit}
                        className="flex-1 py-3 text-sm font-semibold text-white bg-gray-900 rounded-xl"
                      >
                        {t.photoSend}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex-1 flex flex-col items-center gap-2 py-4 bg-gray-100 rounded-2xl text-gray-700 active:bg-gray-200"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                        </svg>
                        <span className="text-sm font-medium">{t.photoTake}</span>
                      </button>
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        className="flex-1 flex flex-col items-center gap-2 py-4 bg-gray-100 rounded-2xl text-gray-700 active:bg-gray-200"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        <span className="text-sm font-medium">{t.photoUpload}</span>
                      </button>
                    </div>
                    <button
                      onClick={() => handleCollectionInput("No photo provided")}
                      className="w-full py-3 text-sm text-gray-400 font-medium"
                    >
                      {t.photoSkip}
                    </button>
                  </>
                )}
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} className="hidden" />
                <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
              </div>
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
