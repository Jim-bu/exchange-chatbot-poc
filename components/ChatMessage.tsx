"use client";

import { ChatMessage as ChatMessageType } from "@/types/chat";

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
  const isAgent = message.isAgent === true;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="flex flex-col items-center gap-0.5 mr-2 mt-1 shrink-0">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center ${
              isAgent ? "bg-blue-600" : "bg-black"
            }`}
          >
            {isAgent ? (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <span className={`text-[9px] font-semibold tracking-wider ${isAgent ? "text-blue-500" : "text-gray-400"}`}>
            {isAgent ? "Agent" : "AI"}
          </span>
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? "order-first" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-black text-white rounded-tr-sm"
              : isAgent
              ? "bg-blue-50 text-gray-900 rounded-tl-sm border border-blue-100"
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
      </div>
    </div>
  );
}
