"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { MyProfile, updateMyStatus } from "@/services/staffProfileApi";

const STATUS_META = {
  available: {
    label: "Available",
    dot: "bg-emerald-500",
    text: "text-emerald-400",
    ring: "ring-emerald-500/20",
    bg: "bg-emerald-500/10",
  },
  away: {
    label: "Away",
    dot: "bg-amber-500",
    text: "text-amber-400",
    ring: "ring-amber-500/20",
    bg: "bg-amber-500/10",
  },
  busy: {
    label: "Busy",
    dot: "bg-red-500",
    text: "text-red-400",
    ring: "ring-red-500/20",
    bg: "bg-red-500/10",
  },
  offline: {
    label: "Offline",
    dot: "bg-slate-500",
    text: "text-slate-400",
    ring: "ring-slate-500/20",
    bg: "bg-slate-800",
  },
} as const;

type Status = keyof typeof STATUS_META;

export function AvailabilityToggle({
  profile,
  onUpdated,
}: {
  profile: MyProfile;
  onUpdated: (profile: MyProfile) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleSelect(status: Status) {
    setOpen(false);
    if (status === profile.status) return;
    setSaving(true);
    try {
      const updated = await updateMyStatus(status);
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  }

  const current = STATUS_META[profile.status] ?? STATUS_META.offline;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 ring-1 ${current.bg} ${current.text} ${current.ring} hover:brightness-110`}
      >
        <span className={`h-2 w-2 rounded-full ${current.dot}`} />
        {current.label}
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-xl bg-slate-900 border border-slate-800 shadow-lg py-1 z-10">
          {(Object.keys(STATUS_META) as Status[]).map((status) => {
            const meta = STATUS_META[status];
            return (
              <button
                key={status}
                onClick={() => handleSelect(status)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                {meta.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
