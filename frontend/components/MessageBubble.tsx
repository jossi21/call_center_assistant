"use client";

import ReactMarkdown from "react-markdown";
import { ChatMessage } from "@/types/chat";

export default function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <div
      className={`flex flex-col ${
        message.role === "user" ? "items-end" : "items-start"
      }`}
    >
      {message.role === "assistant" && message.agent && (
        <span className="mb-1 text-xs font-semibold text-indigo-600">
          {message.agent}
        </span>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
          message.role === "user"
            ? "rounded-br-md bg-indigo-500 text-white"
            : "rounded-bl-md bg-white text-zinc-700 shadow-md"
        }`}
      >
        {message.role === "assistant" ? (
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="mb-3 text-xl font-bold text-zinc-900">
                  {children}
                </h1>
              ),

              h2: ({ children }) => (
                <h2 className="mb-2 mt-4 text-lg font-semibold text-zinc-900">
                  {children}
                </h2>
              ),

              h3: ({ children }) => (
                <h3 className="mb-2 mt-3 text-base font-semibold text-zinc-900">
                  {children}
                </h3>
              ),

              p: ({ children }) => (
                <p className="mb-3 leading-7 last:mb-0">{children}</p>
              ),

              ol: ({ children }) => (
                <ol className="mb-3 ml-6 list-decimal space-y-2">{children}</ol>
              ),

              ul: ({ children }) => (
                <ul className="mb-3 ml-6 list-disc space-y-2">{children}</ul>
              ),

              li: ({ children }) => <li className="leading-7">{children}</li>,

              strong: ({ children }) => (
                <strong className="font-semibold text-zinc-900">
                  {children}
                </strong>
              ),

              em: ({ children }) => <em className="italic">{children}</em>,

              code: ({ children }) => (
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-indigo-600">
                  {children}
                </code>
              ),

              pre: ({ children }) => (
                <pre className="my-3 overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-100">
                  {children}
                </pre>
              ),

              blockquote: ({ children }) => (
                <blockquote className="my-3 border-l-4 border-indigo-500 pl-4 italic text-zinc-600">
                  {children}
                </blockquote>
              ),

              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-indigo-600 underline hover:text-indigo-700"
                >
                  {children}
                </a>
              ),

              hr: () => <hr className="my-4 border-zinc-200" />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </div>
  );
}
