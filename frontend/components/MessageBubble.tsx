"use client";

import ReactMarkdown from "react-markdown";
import { ChatMessage } from "@/types/chat";

export default function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <div
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`
          max-w-[85%]
          px-4
          py-2.5
          text-sm
          rounded-2xl
          ${
            message.role === "user"
              ? "bg-indigo-500 text-white rounded-br-md"
              : "bg-white shadow-md rounded-bl-md text-zinc-700"
          }
        `}
      >
        {message.role === "assistant" ? (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        ) : (
          message.content
        )}
      </div>
    </div>
  );
}
