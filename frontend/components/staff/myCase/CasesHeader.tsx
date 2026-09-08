"use client";

import { Menu } from "lucide-react";

export function CasesHeader({
  onOpenCaseList,
}: {
  onOpenCaseList: () => void;
}) {
  return (
    <div className="border-b border-slate-800 bg-slate-950 px-4 py-2 flex items-center lg:hidden">
      <button
        type="button"
        onClick={onOpenCaseList}
        className="text-slate-400 hover:text-white transition flex items-center gap-2 text-sm"
      >
        <Menu size={18} />
        Cases
      </button>
    </div>
  );
}
