"use client";

import { MyCase } from "@/services/staffProfileApi";
import { CaseCard } from "../CaseCard";
import { FILTER_TABS, ListFilter } from "../../../lib/case-constants";
import { X } from "lucide-react";

export function CaseListPanel({
  listFilter,
  setListFilter,
  counts,
  visibleCases,
  selectedId,
  onSelect,
  open,
  onClose,
}: {
  listFilter: ListFilter;
  setListFilter: (f: ListFilter) => void;
  counts: Record<ListFilter, number>;
  visibleCases: MyCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop — only shown on small screens when drawer is open */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      <div
        className={`
          w-80 shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col
          fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out
          lg:static lg:translate-x-0 lg:z-auto
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-2 lg:hidden">
          <span className="px-2 text-xs font-semibold text-white">Cases</span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex border-b border-slate-800 px-2">
          {FILTER_TABS.map((f) => (
            <button
              type="button"
              key={f.key}
              onClick={() => setListFilter(f.key)}
              className={`px-3 py-2.5 text-xs font-medium border-b-2 transition ${
                listFilter === f.key
                  ? "border-emerald-500 text-white"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {visibleCases.length === 0 ? (
            <div className="p-4 text-xs text-slate-500">No cases match.</div>
          ) : (
            visibleCases.map((c) => (
              <CaseCard
                key={c.id}
                caseItem={c}
                mode="compact"
                selected={selectedId === c.id}
                onClick={() => {
                  onSelect(c.id);
                  onClose();
                }}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
