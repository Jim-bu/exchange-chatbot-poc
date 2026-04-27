"use client";

import { useEffect, useRef, useState } from "react";

interface HandoffMessage {
  id: string;
  role: "customer" | "agent";
  content: string;
  timestamp: number;
}

interface Session {
  id: string;
  createdAt: number;
  status: "waiting" | "active" | "closed";
  info: {
    location: string;
    currencyAndAmount: string;
    problem: string;
    photo: string;
  };
  transcript: string;
  messages: HandoffMessage[];
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function AgentPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedSession = sessions.find((s) => s.id === selected) ?? null;

  useEffect(() => {
    // Pre-select session from URL param
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session");
    if (sid) setSelected(sid);
  }, []);

  useEffect(() => {
    const poll = async () => {
      const res = await fetch("/api/session");
      if (!res.ok) return;
      const data: Session[] = await res.json();
      setSessions(data.sort((a, b) => b.createdAt - a.createdAt));
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedSession?.messages.length]);

  const joinSession = async (id: string) => {
    await fetch(`/api/session/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
  };

  const closeSession = async (id: string) => {
    if (!confirm("Close this session?")) return;
    await fetch(`/api/session/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || !selected || sending) return;
    setSending(true);
    await fetch(`/api/session/${selected}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "agent", content: input.trim() }),
    });
    setInput("");
    setSending(false);
  };

  const statusBadge = (status: Session["status"]) => {
    if (status === "waiting")
      return <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-700">Waiting</span>;
    if (status === "active")
      return <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-green-100 text-green-700">Active</span>;
    return <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-gray-100 text-gray-500">Closed</span>;
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-sm">
      {/* Sidebar */}
      <aside className="w-72 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100">
          <h1 className="font-semibold text-gray-800">Support Sessions</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">Agent Panel · auto-refreshes every 3s</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 && (
            <p className="text-gray-400 text-xs text-center mt-8 px-4">No sessions yet</p>
          )}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                selected === s.id ? "bg-blue-50 border-l-2 border-l-blue-500" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                {statusBadge(s.status)}
                <span className="text-[10px] text-gray-400">{timeAgo(s.createdAt)}</span>
              </div>
              <p className="text-xs font-medium text-gray-700 truncate">{s.info.location || "Unknown location"}</p>
              <p className="text-[11px] text-gray-500 truncate">{s.info.problem || "—"}</p>
            </button>
          ))}
        </div>
      </aside>

      {/* Main panel */}
      <main className="flex-1 flex flex-col">
        {!selectedSession ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a session to view
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{selectedSession.info.location || "Session"}</span>
                  {statusBadge(selectedSession.status)}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {selectedSession.info.currencyAndAmount} · {selectedSession.info.problem}
                </p>
              </div>
              <div className="flex gap-2">
                {selectedSession.status === "waiting" && (
                  <button
                    onClick={() => joinSession(selectedSession.id)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    Join Session
                  </button>
                )}
                {selectedSession.status === "active" && (
                  <button
                    onClick={() => closeSession(selectedSession.id)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                  >
                    Close Session
                  </button>
                )}
              </div>
            </div>

            {/* Info strip */}
            <div className="bg-gray-50 border-b border-gray-100 px-5 py-2 flex gap-4 text-[11px] text-gray-500">
              <span><strong className="text-gray-700">Location:</strong> {selectedSession.info.location}</span>
              <span><strong className="text-gray-700">Currency:</strong> {selectedSession.info.currencyAndAmount}</span>
              {selectedSession.info.photo && selectedSession.info.photo.toLowerCase() !== "no photo provided" && (
                <a href={selectedSession.info.photo} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  View Photo
                </a>
              )}
            </div>

            {/* Transcript */}
            {selectedSession.transcript && (
              <details className="bg-white border-b border-gray-100 px-5 py-2 text-[11px] text-gray-500 cursor-pointer">
                <summary className="font-medium text-gray-600">Pre-handoff transcript</summary>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-[10px] text-gray-500 max-h-40 overflow-y-auto">
                  {selectedSession.transcript}
                </pre>
              </details>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {selectedSession.messages.length === 0 && (
                <p className="text-gray-400 text-xs text-center mt-4">
                  {selectedSession.status === "waiting"
                    ? "Click \"Join Session\" to start chatting with the customer."
                    : "No messages yet."}
                </p>
              )}
              {selectedSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "agent" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "agent"
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "bg-gray-100 text-gray-900 rounded-tl-sm"
                    }`}
                  >
                    <p className="text-[10px] font-semibold mb-1 opacity-60">
                      {msg.role === "agent" ? "You (Agent)" : "Customer"}
                    </p>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {selectedSession.status === "active" && (
              <div className="bg-white border-t border-gray-200 px-4 py-3 flex gap-2">
                <input
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-400 transition-colors"
                  placeholder="Type a reply to the customer..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors"
                >
                  Send
                </button>
              </div>
            )}
            {selectedSession.status === "closed" && (
              <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 text-center text-xs text-gray-400">
                This session is closed.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
