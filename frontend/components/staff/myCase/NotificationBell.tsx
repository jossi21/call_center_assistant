"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { MyCase } from "@/services/staffProfileApi";

export function NotificationBell({
  unresolvedCases,
  onSelectCase,
}: {
  unresolvedCases: MyCase[];
  onSelectCase: (id: string) => void;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const count = unresolvedCases.length;

  return (
    <div className="relative" ref={notifRef}>
      <button
        type="button"
        title={`${count} unresolved cases`}
        onClick={() => setNotifOpen((prev) => !prev)}
        className="relative text-slate-400 hover:text-white transition"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      <div
        className={`absolute right-0 top-full mt-2 w-80 origin-top-right bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 transition-all duration-200 ease-out ${
          notifOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">
            Notifications
          </span>
          <span className="text-xs text-slate-500">{count} unresolved</span>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {count === 0 ? (
            <div className="px-4 py-6 text-xs text-slate-500 text-center">
              No unresolved cases.
            </div>
          ) : (
            unresolvedCases.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => {
                  onSelectCase(c.id);
                  setNotifOpen(false);
                }}
                className="w-full text-left px-4 py-3 border-b border-slate-800 last:border-b-0 hover:bg-slate-800/60 transition"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm text-white font-medium truncate">
                    {c.reason}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${
                      c.status === "assigned"
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-blue-500/15 text-blue-400"
                    }`}
                  >
                    {c.status === "assigned" ? "In Progress" : "Pending"}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {c.user_contact}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
