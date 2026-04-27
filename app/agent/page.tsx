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
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  return `${Math.floor(diff / 3600)}시간 전`;
}

function statusBadge(status: Session["status"]) {
  if (status === "waiting")
    return <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-700">대기중</span>;
  if (status === "active")
    return <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-green-100 text-green-700">응대중</span>;
  return <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-gray-100 text-gray-500">종료</span>;
}

export default function AgentPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedSession = sessions.find((s) => s.id === selected) ?? null;

  useEffect(() => {
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
    if (!confirm("이 상담을 종료하시겠습니까?")) return;
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

  const hasPhoto =
    selectedSession?.info.photo &&
    selectedSession.info.photo.toLowerCase() !== "no photo provided" &&
    selectedSession.info.photo.toLowerCase() !== "photo provided";

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-sm">
      {/* Sidebar */}
      <aside className="w-72 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100">
          <h1 className="font-semibold text-gray-800">고객 상담 세션</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">상담사 패널 · 3초마다 자동 갱신</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 && (
            <p className="text-gray-400 text-xs text-center mt-8 px-4">접수된 세션이 없습니다</p>
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
              <p className="text-xs font-medium text-gray-700 truncate">{s.info.location || "위치 미입력"}</p>
              <p className="text-[11px] text-gray-500 truncate">{s.info.problem || "—"}</p>
            </button>
          ))}
        </div>
      </aside>

      {/* Main panel */}
      <main className="flex-1 flex flex-col min-w-0">
        {!selectedSession ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            좌측에서 세션을 선택하세요
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                {statusBadge(selectedSession.status)}
                <span className="font-semibold text-gray-800">
                  {selectedSession.info.location || "세션"}
                </span>
              </div>
              <div className="flex gap-2">
                {selectedSession.status === "waiting" && (
                  <button
                    onClick={() => joinSession(selectedSession.id)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                  >
                    상담 참여
                  </button>
                )}
                {selectedSession.status === "active" && (
                  <button
                    onClick={() => closeSession(selectedSession.id)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    상담 종료
                  </button>
                )}
              </div>
            </div>

            {/* Customer info card */}
            <div className="bg-white border-b border-gray-100 px-5 py-4 shrink-0">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">고객 접수 정보</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">매장 위치</p>
                  <p className="text-sm text-gray-800 font-medium">{selectedSession.info.location || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">환전 통화 / 금액</p>
                  <p className="text-sm text-gray-800 font-medium">{selectedSession.info.currencyAndAmount || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-400 mb-0.5">문의 내용</p>
                  <p className="text-sm text-gray-800">{selectedSession.info.problem || "—"}</p>
                </div>
                {hasPhoto && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-gray-400 mb-0.5">첨부 사진</p>
                    <a
                      href={selectedSession.info.photo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline underline-offset-2"
                    >
                      사진 보기
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Transcript (collapsible) */}
            {selectedSession.transcript && (
              <details className="bg-gray-50 border-b border-gray-100 px-5 py-2.5 shrink-0 cursor-pointer group">
                <summary className="text-[11px] font-medium text-gray-500 list-none select-none flex items-center gap-1">
                  <span className="group-open:rotate-90 transition-transform inline-block text-[10px]">▶</span>
                  상담 이전 대화 내역
                </summary>
                <pre className="mt-2.5 whitespace-pre-wrap text-[11px] text-gray-500 leading-relaxed max-h-44 overflow-y-auto">
                  {selectedSession.transcript}
                </pre>
              </details>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {selectedSession.messages.length === 0 && (
                <p className="text-gray-400 text-xs text-center mt-6">
                  {selectedSession.status === "waiting"
                    ? "상담 참여 버튼을 눌러 고객과 대화를 시작하세요."
                    : "아직 메시지가 없습니다."}
                </p>
              )}
              {selectedSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "agent" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "agent"
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "bg-gray-100 text-gray-900 rounded-tl-sm"
                    }`}
                  >
                    <p className="text-[10px] font-semibold mb-1 opacity-60">
                      {msg.role === "agent" ? "나 (상담사)" : "고객"}
                    </p>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {selectedSession.status === "active" && (
              <div className="bg-white border-t border-gray-200 px-4 py-3 flex gap-2 shrink-0">
                <input
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors"
                  placeholder="고객에게 답변 입력..."
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
                  전송
                </button>
              </div>
            )}
            {selectedSession.status === "closed" && (
              <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 text-center text-xs text-gray-400 shrink-0">
                종료된 상담 세션입니다.
              </div>
            )}
            {selectedSession.status === "waiting" && (
              <div className="bg-amber-50 border-t border-amber-100 px-4 py-3 text-center text-xs text-amber-600 shrink-0">
                고객이 상담사 연결을 기다리고 있습니다. 상담 참여 버튼을 눌러주세요.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
