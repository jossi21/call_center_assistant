"use client";

import { useState } from "react";
import { Copy, Check, Pencil, RotateCcw, PlayCircle } from "lucide-react";
import MarkdownContent from "@/components/MarkdownContent";
import { ChatMessage } from "@/types/chat";

interface Props {
  message: ChatMessage;
  isLast?: boolean;
  onCopy?: (content: string) => void;
  onEdit?: (id: string, newContent: string) => void;
  onRegenerate?: (id: string) => void;
  onContinue?: (id: string) => void;
}

export default function MessageBubble({
  message,
  isLast,
  onCopy,
  onEdit,
  onRegenerate,
  onContinue,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === "user";

  function handleCopy() {
    onCopy?.(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className={`group flex flex-col ${isUser ? "items-end" : "items-start"}`}
    >
      {!isUser && message.agent && (
        <span className="mb-1 text-xs font-semibold text-indigo-600">
          {message.agent}
        </span>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? "rounded-br-md bg-indigo-500 text-white"
            : "rounded-bl-md bg-white text-zinc-700 shadow-md"
        }`}
      >
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-white/30 bg-white/10 p-2 text-sm text-white outline-none placeholder:text-white/60"
            />
            <div className="flex justify-end gap-3 text-xs">
              <button
                onClick={() => {
                  setDraft(message.content);
                  setEditing(false);
                }}
                className="opacity-80 hover:opacity-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  if (message.id !== undefined && draft.trim()) {
                    onEdit?.(message.id, draft.trim());
                  }
                }}
                className="font-semibold opacity-90 hover:opacity-100"
              >
                Save &amp; resend
              </button>
            </div>
          </div>
        ) : isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MarkdownContent content={message.content} />
        )}
      </div>

      {!editing && (
        <div className="mt-1 flex gap-3 px-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={handleCopy}
            title="Copy"
            className="text-zinc-400 hover:text-zinc-600"
          >
            {copied ? (
              <Check size={14} className="text-emerald-500" />
            ) : (
              <Copy size={14} />
            )}
          </button>

          {isUser && message.id !== undefined && (
            <button
              onClick={() => {
                setDraft(message.content);
                setEditing(true);
              }}
              title="Edit"
              className="text-zinc-400 hover:text-zinc-600"
            >
              <Pencil size={14} />
            </button>
          )}

          {!isUser && message.interrupted && message.id !== undefined && (
            <button
              onClick={() => onContinue?.(message.id as string)}
              title="Continue where it left off"
              className="text-indigo-500 hover:text-indigo-700"
            >
              <PlayCircle size={14} />
            </button>
          )}

          {!isUser && isLast && message.id !== undefined && (
            <button
              onClick={() => onRegenerate?.(message.id as string)}
              title="Regenerate"
              className="text-zinc-400 hover:text-zinc-600"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
