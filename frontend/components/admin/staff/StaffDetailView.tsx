"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Power, UserCog } from "lucide-react";
import {
  StaffDetail,
  StaffCase,
  Staff,
  getStaffDetail,
  toggleHandoffStatus,
  reassignHandoff,
  listStaff,
} from "@/services/staffsApi";

const STATUS_COLORS: Record<string, string> = {
  waiting_confirmation: "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-600/10",
  waiting: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  assigned: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20",
  resolved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
};

export function StaffDetailView({ staffId }: { staffId: string }) {
  const [detail, setDetail] = useState<StaffDetail | null>(null);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [d, s] = await Promise.all([getStaffDetail(staffId), listStaff()]);
      setDetail(d);
      setAllStaff(s);
    } catch {
      setError("Couldn't load staff details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, [staffId]);

  if (loading)
    return <div className="p-8 text-zinc-500 text-sm">Loading...</div>;
  if (error || !detail)
    return <div className="p-8 text-red-500 text-sm">{error}</div>;

  return (
    <div className="mx-auto max-w-4xl p-6 flex flex-col gap-6">
      <div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold text-zinc-900">
            Name: {detail.name}
          </h1>
          <div className="text-md text-zinc-500 mt-1">
            <span className="text-lg font-semibold text-zinc-900">Email:</span>{" "}
            {detail.email}
          </div>
          <div>
            <span className="text-lg font-semibold text-zinc-900">
              Phone Number:
            </span>{" "}
            {detail.phone_number}
          </div>
          <div>
            <span className="text-lg font-semibold text-zinc-900 mr-4">
              Specialty:
            </span>
            <span className="inline-block text-md px-4  rounded-full font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20">
              {detail.specialty}
            </span>
          </div>
        </div>
        <span
          className={`text-xs px-3 py-1.5 rounded-full font-medium ${
            detail.is_available
              ? "text-emerald-50 bg-emerald-500 ring-1 ring-emerald-600/20"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {detail.is_available ? "Available" : "Unavailable"}
        </span>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-500 mb-3">
          {detail.cases.length === 0
            ? "No cases"
            : `${detail.cases.length} case${detail.cases.length > 1 ? "s" : ""}`}
        </h2>
        <div className="flex flex-col gap-3">
          {detail.cases.map((c) => (
            <CaseRow
              key={c.id}
              caseItem={c}
              allStaff={allStaff.filter((s) => s.id !== detail.id)}
              onChanged={load}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CaseRow({
  caseItem,
  allStaff,
  onChanged,
}: {
  caseItem: StaffCase;
  allStaff: Staff[];
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showReassign, setShowReassign] = useState(false);

  async function handleToggleStatus() {
    await toggleHandoffStatus(caseItem.id);
    onChanged();
  }

  async function handleReassign(staffId: string) {
    await reassignHandoff(caseItem.id, staffId);
    setShowReassign(false);
    onChanged();
  }

  return (
    <div className="bg-orange-300 border border-zinc-200 rounded-xl overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-zinc-900">
            {caseItem.reason}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            Customer: {caseItem.customer_contact}
          </div>
          <span
            className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[caseItem.status]}`}
          >
            {caseItem.status.replace("_", " ")}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowReassign((s) => !s)}
            className="flex items-center gap-1.5 bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-blue-700 transition"
          >
            <UserCog size={14} />
            Reassign
          </button>
          <button
            onClick={handleToggleStatus}
            className="flex items-center gap-1.5 bg-green-400 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-green-500 transition"
          >
            <Power size={14} />
            {caseItem.status === "resolved" ? "Reopen" : "Resolve"}
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-zinc-400 hover:text-zinc-700 p-1.5"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {showReassign && (
        <div className="border-t border-zinc-100 bg-gray-300 p-3 flex flex-wrap gap-2">
          {allStaff.map((s) => (
            <button
              key={s.id}
              onClick={() => handleReassign(s.id)}
              className="text-xs bg-white border border-zinc-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 hover:border-indigo-200 transition"
            >
              {s.name} <span className="text-zinc-400">({s.specialty})</span>
            </button>
          ))}
        </div>
      )}

      {expanded && (
        <div className="border-t border-zinc-100 bg-green-200/50 p-4 flex flex-col gap-2 max-h-80 overflow-y-auto">
          {caseItem.history.map((msg, i) => (
            <div
              key={i}
              className={`text-xs px-3 py-2 rounded-lg max-w-[85%]  ${
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
