// components/admin/StaffDetailView.tsx
"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Power,
  UserCog,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  StaffDetail,
  StaffCase,
  Staff,
  getStaffDetail,
  toggleHandoffStatus,
  reassignHandoff,
  listStaff,
} from "@/services/staffsApi";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  waiting_confirmation: "bg-slate-800 text-slate-400 ring-1 ring-slate-700",
  waiting: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  assigned: "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
};

export function StaffDetailView({ staffId }: { staffId: string }) {
  const router = useRouter();
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Loading staff details...</div>
      </div>
    );
  if (error || !detail)
    return (
      <div className="p-8 text-red-400 text-sm bg-slate-950 m-6 rounded-xl border border-slate-800">
        {error || "Staff member not found"}
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl p-3 sm:p-4 md:p-5 flex flex-col gap-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition w-fit"
      >
        <ArrowLeft size={16} />
        Back to Staff
      </button>

      {/* Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xl font-bold">
                {detail.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">
                  {detail.name}
                </h1>
                <span className="text-sm text-slate-400">{detail.email}</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div>
                <span className="text-xs text-slate-500">Phone</span>
                <p className="text-sm text-white font-mono">
                  {detail.phone_number}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Specialty</span>
                <p className="text-sm">
                  <span className="inline-block text-xs px-3 py-1 rounded-full font-medium bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
                    {detail.specialty}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <span
            className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              detail.is_available
                ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                : "bg-slate-800 text-slate-400 ring-1 ring-slate-700"
            }`}
          >
            {detail.is_available ? "Available" : "Unavailable"}
          </span>
        </div>
      </div>

      {/* Cases */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-medium text-slate-400 mb-4">
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
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            {caseItem.reason}
          </div>
          <div className="text-xs text-slate-400 mt-1">
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
            className="flex items-center gap-1.5 bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-indigo-600 transition"
          >
            <UserCog size={14} />
            Reassign
          </button>
          <button
            onClick={handleToggleStatus}
            className={`flex items-center gap-1.5 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              caseItem.status === "resolved"
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-emerald-500 hover:bg-emerald-600"
            }`}
          >
            <Power size={14} />
            {caseItem.status === "resolved" ? "Reopen" : "Resolve"}
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-slate-400 hover:text-white p-1.5 transition"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {showReassign && (
        <div className="border-t border-slate-700 bg-slate-800/50 p-3 flex flex-wrap gap-2">
          {allStaff.map((s) => (
            <button
              key={s.id}
              onClick={() => handleReassign(s.id)}
              className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 hover:bg-slate-700 hover:border-slate-600 transition"
            >
              {s.name} <span className="text-slate-500">({s.specialty})</span>
            </button>
          ))}
        </div>
      )}

      {expanded && (
        <div className="border-t border-slate-700 bg-slate-800/30 p-4 flex flex-col gap-2 max-h-80 overflow-y-auto">
          {caseItem.history.map((msg, i) => (
            <div
              key={i}
              className={`text-xs px-3 py-2 rounded-lg max-w-[85%] ${
                msg.role === "user"
                  ? "bg-slate-700 text-slate-200 self-start"
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
