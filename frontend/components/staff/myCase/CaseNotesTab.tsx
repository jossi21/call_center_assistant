"use client";

import { useEffect, useState } from "react";
import {
  CaseNote,
  getCaseNotes,
  createCaseNote,
} from "@/services/staffProfileApi";

export function CaseNotesTab({ handoffId }: { handoffId: string }) {
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setNotes(await getCaseNotes(handoffId));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoffId]);

  async function handleAdd() {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await createCaseNote(handoffId, draft.trim());
      setDraft("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
        {loading ? (
          <div className="text-sm text-slate-500">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="text-sm text-slate-500">No internal notes yet.</div>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              className="bg-slate-800/60 border border-slate-800 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-300">
                  {n.author_name}
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">
                {n.content}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-800 p-4 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a note — use @Name to notify a teammate..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !draft.trim()}
          className="bg-emerald-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-emerald-600 transition"
        >
          {saving ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
}
