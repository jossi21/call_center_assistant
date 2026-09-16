"use client";

import { Search as SearchIcon, X } from "lucide-react";
import type { ReactNode } from "react";

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  onReset,
  showReset = false,
  leading,
  children,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  onReset?: () => void;
  showReset?: boolean;
  leading?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
      {leading}

      <FilterField label="Search" className="flex-1 min-w-50">
        <div className="relative">
          <SearchIcon
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-xl border border-[#123957] bg-[#061d31] pl-10 pr-9 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
          />

          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-slate-500 transition hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </FilterField>

      {children}

      {showReset && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="h-10 shrink-0 rounded-xl border border-[#123957] bg-[#061d31] px-4 text-sm font-medium text-slate-300 transition hover:border-[#1b4b6d] hover:bg-[#08253b] hover:text-white"
        >
          Reset
        </button>
      )}
    </div>
  );
}

export function FilterField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>

      {children}
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-xl border border-[#123957] bg-[#061d31] px-3 text-sm text-white outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
    >
      {children}
    </select>
  );
}
