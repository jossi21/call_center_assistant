"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import MessageBubble from "@/components/MessageBubble";

export default function ChatBot() {
  const { messages, chat, loading, resetChat } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  return (
    <div className="fixed bottom-6 right-6 w-95 h-160 bg-white rounded-[28px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-zinc-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-base">
              🤖
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-zinc-900">
              Support Assistant
            </span>
            <span className="text-xs text-zinc-400">
              Usually replies instantly
            </span>
          </div>
        </div>

        <button
          onClick={resetChat}
          title="Reset conversation"
          className="
            w-8
            h-8
            flex
            items-center
            justify-center
            rounded-full
            text-zinc-400
            hover:bg-zinc-100
            hover:text-zinc-600
            transition
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-zinc-50/50">
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-zinc-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce [animation-delay:-0.3s]" />
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-100 bg-white">
        <div className="flex gap-2">
          <input
            id="chat-input"
            placeholder="Ask something..."
            className="
              flex-1
              border
              border-zinc-200
              rounded-full
              px-4
              py-2.5
              text-sm
              outline-none
              text-zinc-900
            "
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const value = e.currentTarget.value;
                if (value.trim()) {
                  chat(value);
                  e.currentTarget.value = "";
                }
              }
            }}
          />

          <button
            disabled={loading}
            onClick={() => {
              const input = document.getElementById(
                "chat-input",
              ) as HTMLInputElement;
              if (input.value.trim()) {
                chat(input.value);
                input.value = "";
              }
            }}
            className="
              w-10
              h-10
              rounded-full
              bg-indigo-500
              text-white
            "
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
