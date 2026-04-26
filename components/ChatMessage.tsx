"use client";

import { ChatMessage as ChatMessageType } from "@/types/chat";
import SupportButton from "./SupportButton";

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />");
}

interface Props {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center mr-2 mt-1 shrink-0">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? "order-first" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-black text-white rounded-tr-sm"
              : "bg-gray-100 text-gray-900 rounded-tl-sm"
          }`}
        >
          <p
            className="prose prose-sm max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0"
            dangerouslySetInnerHTML={{
              __html: `<p>${formatMarkdown(message.content)}</p>`,
            }}
          />
        </div>
        {!isUser && message.showSupportLink && <SupportButton />}
      </div>
    </div>
  );
}
