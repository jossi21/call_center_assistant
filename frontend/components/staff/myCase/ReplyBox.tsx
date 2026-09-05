"use client";

import { useRef } from "react";
import { Send } from "lucide-react";
import { ReplyMode } from "../../../lib/case-constants";

export function ReplyBox({
  replyMode,
  setReplyMode,
  replyText,
  setReplyText,
  sending,
  onSend,
}: {
  replyMode: ReplyMode;
  setReplyMode: (m: ReplyMode) => void;
  replyText: string;
  setReplyText: (v: string) => void;
  sending: boolean;
  onSend: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);

    // Automatically increase height
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (!sending && replyText.trim()) {
        onSend();

        // Reset height after sending
        if (textareaRef.current) {
          textareaRef.current.style.height = "44px";
        }
      }
    }
  };

  return (
    <div className="border-t border-slate-800 p-4">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={replyText}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={sending}
          rows={1}
          placeholder={
            replyMode === "reply"
              ? "Type a message..."
              : "Add an internal note..."
          }
          className="
    w-full
    min-h-11
    max-h-40
    resize-none
    overflow-y-hidden
    bg-slate-900
    border border-slate-800
    rounded-xl
    pl-4
    pr-14
    py-3
    text-sm
    leading-5
    text-white
    placeholder:text-slate-500
    focus:outline-none
    focus:border-emerald-500/50
    focus:ring-1
    focus:ring-emerald-500/30
    disabled:opacity-50
    transition-all
  "
        />

        <button
          type="button"
          onClick={onSend}
          disabled={sending || !replyText.trim()}
          className="
            absolute
            right-2
            bottom-2
            w-8
            h-8
            rounded-lg
            bg-emerald-500
            text-white
            flex
            items-center
            justify-center
            hover:bg-emerald-600
            disabled:opacity-40
            disabled:cursor-not-allowed
            transition-all
          "
          title="Send message"
        >
          <Send size={15} />
        </button>
      </div>

      <div className="flex items-center gap-4 mt-2 px-1">
        <button
          type="button"
          onClick={() => setReplyMode("reply")}
          className={`text-xs transition-colors ${
            replyMode === "reply"
              ? "text-emerald-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Reply
        </button>

        <button
          type="button"
          onClick={() => setReplyMode("note")}
          className={`text-xs transition-colors ${
            replyMode === "note"
              ? "text-emerald-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Internal note
        </button>
      </div>
    </div>
  );
}
