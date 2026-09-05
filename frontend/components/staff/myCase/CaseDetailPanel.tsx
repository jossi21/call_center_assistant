"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, FileText, MessageSquare, MoreVertical } from "lucide-react";
import { MyCase } from "@/services/staffProfileApi";
import { TabButton } from "./TabButton";
import { ConversationThread } from "./ConversationThread";
import { ReplyBox } from "./ReplyBox";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  Tab,
  ReplyMode,
} from "../../../lib/case-constants";

export function CaseDetailPanel({
  selected,
  tab,
  setTab,
  replyMode,
  setReplyMode,
  replyText,
  setReplyText,
  sending,
  onSend,
  onResolve,
}: {
  selected: MyCase | null;
  tab: Tab;
  setTab: (t: Tab) => void;
  replyMode: ReplyMode;
  setReplyMode: (m: ReplyMode) => void;
  replyText: string;
  setReplyText: (v: string) => void;
  sending: boolean;
  onSend: () => void;
  onResolve: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!selected) {
    return (
      <div className="flex-1 flex flex-col bg-slate-900 min-w-0">
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          Select a case to view details.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-900 min-w-0">
      <div className="border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            STATUS_STYLES[selected.status] ?? "bg-slate-500/15 text-slate-400"
          }`}
        >
          {STATUS_LABELS[selected.status] ?? selected.status}
        </span>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="text-slate-500 hover:text-white transition"
          >
            <MoreVertical size={16} />
          </button>

          <div
            className={`absolute right-0 top-full mt-2 w-40 origin-top-right bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50 transition-all duration-150 ease-out ${
              menuOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onResolve();
              }}
              disabled={selected.status === "resolved"}
              className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-300 rounded-lg"
            >
              Resolve case
            </button>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-800 px-6">
        <TabButton
          icon={MessageSquare}
          label="Conversation"
          active={tab === "conversation"}
          onClick={() => setTab("conversation")}
        />
        <TabButton
          icon={FileText}
          label="Case Notes"
          active={tab === "notes"}
          onClick={() => setTab("notes")}
        />
        <TabButton
          icon={Activity}
          label="Activity"
          active={tab === "activity"}
          onClick={() => setTab("activity")}
        />
      </div>

      <div className="flex-1 min-h-0">
        {tab === "conversation" && (
          <div className="flex flex-col h-full min-h-0">
            <ConversationThread
              history={selected.history}
              userContact={selected.user_contact}
            />
            <ReplyBox
              replyMode={replyMode}
              setReplyMode={setReplyMode}
              replyText={replyText}
              setReplyText={setReplyText}
              sending={sending}
              onSend={onSend}
            />
          </div>
        )}
        {tab === "notes" && (
          <div className="p-6 text-sm text-slate-500 overflow-y-auto h-full">
            Case notes aren&apos;t available yet — coming in a future update.
          </div>
        )}
        {tab === "activity" && (
          <div className="p-6 text-sm text-slate-500 overflow-y-auto h-full">
            Activity timeline isn&apos;t available yet — coming in a future
            update.
          </div>
        )}
      </div>
    </div>
  );
}
