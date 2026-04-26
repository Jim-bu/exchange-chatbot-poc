"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage as ChatMessageType } from "@/types/chat";
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

export default function ChatWidget() {
  const [messages, setMessages] = useState<ChatMessageType[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [clarifyCount, setClarifyCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function generateId() {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessageType = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    const result = classifyInput(trimmed);
    let responseText = buildResponseText(result);
    let newClarifyCount = clarifyCount;

    if (result.predictedCategory === "clarify") {
      newClarifyCount += 1;
      if (newClarifyCount >= 2) {
        responseText =
          "I'm having trouble understanding your request. Let me connect you with our support team who can help directly.";
        result.showSupportLink = true;
        result.predictedCategory = "immediate_escalation";
        newClarifyCount = 0;
      }
    } else {
      newClarifyCount = 0;
    }

    setClarifyCount(newClarifyCount);

    const assistantMessage: ChatMessageType = {
      id: generateId(),
      role: "assistant",
      content: responseText,
      showSupportLink: result.showSupportLink,
      requiredCaseInfo: result.requiredCaseInfo,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 bg-white">
        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-900">Exchange Support</p>
          <p className="text-xs text-gray-400">AI Assistant</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-white">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center mr-2 mt-1 shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
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

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 pt-2 pb-1">
        <p className="text-[11px] text-gray-400 mb-2">
          Describe your issue in 2+ words for the best answer.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2 pb-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-3 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-200 text-white rounded-xl transition-colors"
            aria-label="Send message"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
