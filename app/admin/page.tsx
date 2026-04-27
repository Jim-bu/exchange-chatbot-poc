"use client";

import { useState, useEffect, useCallback } from "react";

const FILES = [
  { key: "knowledge.json", label: "Knowledge Base" },
  { key: "ai_policy.json", label: "AI Policy" },
  { key: "specific_rules.json", label: "Specific Rules" },
  { key: "escalation_rules.json", label: "Escalation Rules" },
  { key: "ai_guidelines.json", label: "AI Guidelines" },
];

export default function AdminPage() {
  const [activeFile, setActiveFile] = useState(FILES[0].key);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async (file: string) => {
    setStatus("idle");
    setErrorMessage("");
    const res = await fetch(`/api/admin/data?file=${file}`);
    const data = await res.json();
    setContent(data.content);
  }, []);

  useEffect(() => {
    load(activeFile);
  }, [activeFile, load]);

  function switchTab(file: string) {
    setActiveFile(file);
    setStatus("idle");
  }

  async function handleSave() {
    setErrorMessage("");
    try {
      JSON.parse(content);
    } catch {
      setStatus("error");
      setErrorMessage("Invalid JSON — please fix the syntax before saving.");
      return;
    }

    setStatus("saving");
    const res = await fetch(`/api/admin/data?file=${activeFile}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("error");
      setErrorMessage("Save failed. Check server logs.");
    }
  }

  return (
    <div className="min-h-dvh bg-white text-gray-900 flex flex-col">
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="font-semibold text-base">Admin — AI Data Files</h1>
        <a href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          ← Back to chat
        </a>
      </header>

      <div className="flex border-b border-gray-200 px-6">
        {FILES.map((f) => (
          <button
            key={f.key}
            onClick={() => switchTab(f.key)}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeFile === f.key
                ? "border-black text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col p-6 gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 font-mono">{activeFile}</p>
          <div className="flex items-center gap-3">
            {status === "error" && (
              <p className="text-xs text-red-600">{errorMessage}</p>
            )}
            {status === "saved" && (
              <p className="text-xs text-green-600">Saved</p>
            )}
            <button
              onClick={handleSave}
              disabled={status === "saving"}
              className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {status === "saving" ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          className="flex-1 w-full font-mono text-xs bg-gray-50 border border-gray-200 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 min-h-[60vh]"
        />
      </div>
    </div>
  );
}
