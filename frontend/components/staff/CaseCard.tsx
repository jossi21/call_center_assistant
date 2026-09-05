"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { MyCase, resolveCase } from "@/services/staffProfileApi";

const STATUS_BADGE: Record<string, string> = {
  waiting: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  assigned: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  waiting_confirmation:
    "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20",
};
const STATUS_LABEL: Record<string, string> = {
  waiting: "Pending",
  assigned: "In Progress",
  resolved: "Resolved",
  waiting_confirmation: "Waiting Confirmation",
};

function initials(text: string) {
  return text.replace(/\D/g, "").slice(-2) || text.slice(0, 2).toUpperCase();
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function CaseCard({
  caseItem,
  onResolved,
  mode = "expanded",
  selected = false,
  onClick,
}: {
  caseItem: MyCase;
  onResolved?: () => void;
  mode?: "compact" | "expanded";
  selected?: boolean;
  onClick?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [resolving, setResolving] = useState(false);

  async function handleResolve(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Mark this case as resolved?")) return;
    setResolving(true);
    try {
      await resolveCase(caseItem.id);
      onResolved?.();
    } finally {
      setResolving(false);
    }
  }

  if (mode === "compact") {
    const badge =
      STATUS_BADGE[caseItem.status] ||
      "bg-slate-800 text-slate-400 ring-1 ring-slate-700";
    const label = STATUS_LABEL[caseItem.status] || caseItem.status;
    const lastMsg =
      caseItem.history[caseItem.history.length - 1]?.content ?? caseItem.reason;

    return (
      <button
        onClick={onClick}
        className={`w-full text-left p-4 border-b border-slate-900 transition flex gap-3 ${
          selected
            ? "bg-slate-900 border-l-2 border-l-emerald-500"
            : "hover:bg-slate-900/50"
        }`}
      >
        <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-300 shrink-0">
          {initials(caseItem.user_contact)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-white truncate">
              {caseItem.reason}
            </span>
            <span className="text-xs text-slate-500 shrink-0">
              {timeAgo(caseItem.created_at)}
            </span>
          </div>
          <div className="text-xs text-slate-500 truncate mt-0.5">
            {lastMsg}
          </div>
          <span
            className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${badge}`}
          >
            {label}
          </span>
        </div>
      </button>
    );
  }

  // expanded mode — original card, for a future full-list page
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white">
            {caseItem.reason}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Contact: {caseItem.user_contact}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {caseItem.assigned_at
              ? `Assigned ${new Date(caseItem.assigned_at).toLocaleString()}`
              : "Not yet assigned"}
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
            className="text-slate-400 hover:text-white p-1.5 transition"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-800 bg-slate-950/50 p-4 flex flex-col gap-2 max-h-80 overflow-y-auto">
          {caseItem.history.map((msg, i) => (
            <div
              key={i}
              className={`text-xs px-3 py-2 rounded-lg max-w-[85%] ${
                msg.role === "user"
                  ? "bg-slate-800 border border-slate-700 text-slate-200 self-start"
                  : "bg-indigo-500/20 text-indigo-200 self-end"
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
