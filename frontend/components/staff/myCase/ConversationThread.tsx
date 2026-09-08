"use client";

import { useEffect, useRef } from "react";
import {
  Bot,
  CheckCheck,
  Headset,
  Settings as SettingsIcon,
} from "lucide-react";
import { CaseMessage } from "@/services/staffProfileApi";
import { getInitials } from "../../../lib/case-constants";
import MarkdownContent from "@/components/MarkdownContent";

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
    <div className="flex-1 overflow-y-auto p-6 flex flex-col [scrollbar-none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
        const isStaff = !isCustomer && !!m.is_staff;
        const prev = history[i - 1];
        const isSameGroupAsPrev =
          prev && prev.role === m.role && !!prev.is_staff === !!m.is_staff;

        return (
          <div
            key={i}
            className={`flex flex-col ${isCustomer ? "items-start" : "items-end"} ${
              isSameGroupAsPrev ? "mt-0.5" : "mt-4"
            }`}
          >
            {!isCustomer && !isSameGroupAsPrev && m.agent_name && (
              <span
                className={`mb-1 text-xs font-semibold px-1 ${
                  isStaff ? "text-blue-400" : "text-indigo-400"
                }`}
              >
                {m.agent_name}
              </span>
            )}

            <div
              className={`flex items-end gap-2 max-w-[75%] ${
                isCustomer ? "" : "flex-row-reverse"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-semibold text-white ${
                  isCustomer
                    ? "bg-emerald-600"
                    : isStaff
                      ? "bg-blue-600"
                      : "bg-indigo-600"
                } ${isSameGroupAsPrev ? "invisible" : ""}`}
              >
                {isCustomer ? (
                  getInitials(userContact)
                ) : isStaff ? (
                  <Headset size={14} />
                ) : (
                  <Bot size={14} />
                )}
              </span>

              <div
                className={`px-4 py-2.5 rounded-xl text-sm ${
                  isCustomer
                    ? "bg-slate-800 text-slate-100"
                    : "bg-emerald-600 text-white"
                }`}
              >
                <div className="flex items-end gap-1">
                  <div className="min-w-0">
                    {isCustomer ? (
                      m.content
                    ) : (
                      <MarkdownContent content={m.content} />
                    )}
                  </div>

                  {!isCustomer && (
                    <CheckCheck
                      size={12}
                      className="shrink-0 opacity-70 mb-0.5"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={scrollRef} />
    </div>
  );
}
