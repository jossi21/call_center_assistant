"use client";

import { useEffect, useRef } from "react";
import { Bot, CheckCheck, Settings as SettingsIcon } from "lucide-react";
import { CaseMessage } from "@/services/staffProfileApi";
import { getInitials } from "../../../lib/case-constants";

export function ConversationThread({
  history,
  userContact,
}: {
  history: CaseMessage[];
  userContact: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {history.map((m, i) => {
        if (m.role === "system") {
          return (
            <div
              key={i}
              className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/5 rounded-xl px-4 py-3 text-xs self-center max-w-[85%] my-4"
            >
              <span className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                <SettingsIcon size={12} className="text-amber-400" />
              </span>
              <div>
                <span className="text-amber-400 font-medium">System</span>
                <p className="text-slate-300 mt-0.5">{m.content}</p>
              </div>
            </div>
          );
        }

        const isCustomer = m.role === "user";
        const prev = history[i - 1];
        const isSameGroupAsPrev = prev && prev.role === m.role;

        return (
          <div
            key={i}
            className={`flex items-end gap-2 max-w-[75%] ${
              isCustomer ? "self-start" : "self-end flex-row-reverse"
            } ${isSameGroupAsPrev ? "mt-0.5" : "mt-4"}`}
          >
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-semibold text-white ${
                isCustomer ? "bg-emerald-600" : "bg-indigo-600"
              } ${isSameGroupAsPrev ? "invisible" : ""}`}
            >
              {isCustomer ? getInitials(userContact) : <Bot size={14} />}
            </span>
            <div
              className={`px-4 py-2.5 rounded-xl text-sm ${
                isCustomer
                  ? "bg-slate-800 text-slate-100"
                  : "bg-emerald-600 text-white"
              }`}
            >
              {m.content}
              {/* NOTE: read-receipt tick is a static visual placeholder — no delivery/read state in the data model yet */}
              {!isCustomer && (
                <CheckCheck
                  size={12}
                  className="inline-block ml-1.5 -mb-0.5 opacity-70"
                />
              )}
            </div>
          </div>
        );
      })}
      <div ref={scrollRef} />
    </div>
  );
}
