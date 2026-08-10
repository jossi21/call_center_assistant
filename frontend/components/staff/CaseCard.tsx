"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { MyCase, resolveCase } from "@/services/staffProfileApi";

export function CaseCard({
  caseItem,
  onResolved,
}: {
  caseItem: MyCase;
  onResolved: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [resolving, setResolving] = useState(false);

  async function handleResolve() {
    if (!confirm("Mark this case as resolved?")) return;
    setResolving(true);
    try {
      await resolveCase(caseItem.id);
      onResolved();
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-zinc-900">
            {caseItem.reason}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            Contact: {caseItem.user_contact}
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">
            Assigned {new Date(caseItem.assigned_at).toLocaleString()}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResolve}
            disabled={resolving}
            className="flex items-center gap-1.5 bg-emerald-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-emerald-600 transition disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            {resolving ? "Resolving..." : "Resolve"}
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-zinc-400 hover:text-zinc-700 p-1.5"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-100 bg-zinc-50 p-4 flex flex-col gap-2 max-h-80 overflow-y-auto">
          {caseItem.history.map((msg, i) => (
            <div
              key={i}
              className={`text-xs px-3 py-2 rounded-lg max-w-[85%] ${
                msg.role === "user"
                  ? "bg-white border border-zinc-200 self-start"
                  : "bg-indigo-50 text-indigo-900 self-end"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
