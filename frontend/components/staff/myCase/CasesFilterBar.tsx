"use client";

import { Search } from "lucide-react";
import { FilterField } from "./FilterField";

export function CasesFilterBar({
  search,
  setSearch,
  customerFilter,
  setCustomerFilter,
  customers,
  channelFilter,
  setChannelFilter,
  channels,
  priorityFilter,
  setPriorityFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  onReset,
}: {
  search: string;
  setSearch: (v: string) => void;
  customerFilter: string;
  setCustomerFilter: (v: string) => void;
  customers: string[];
  channelFilter: string;
  setChannelFilter: (v: string) => void;
  channels: string[];
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="border-b border-slate-800 bg-slate-950 px-4 py-3 flex items-end gap-4">
      <FilterField label="Search" className="flex-1 min-w-0">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </FilterField>

      <div className="flex items-end gap-4 ml-auto shrink-0">
        <FilterField label="Customer">
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-300 min-w-35"
          >
            <option value="all">All Customers</option>
            {customers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Channel">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-300 min-w-35"
          >
            <option value="all">All Channels</option>
            {channels.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Priority">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-300 min-w-35"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </FilterField>

        <FilterField label="Date Range">
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-2.5 text-xs text-slate-300 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
            <span className="text-slate-600 text-xs">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-2.5 text-xs text-slate-300 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
        </FilterField>

        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-white border border-slate-800 rounded-lg px-3 py-2.5"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
