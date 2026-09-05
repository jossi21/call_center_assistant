"use client";

import { MessageSquare } from "lucide-react";

export function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof MessageSquare;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition ${
        active
          ? "border-emerald-500 text-white"
          : "border-transparent text-slate-500 hover:text-slate-300"
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
