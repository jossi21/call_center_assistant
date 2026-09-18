"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@/hooks/useChat";
import MessageBubble from "@/components/MessageBubble";
import MarkdownContent from "@/components/MarkdownContent";
import { Mic, Square } from "lucide-react";

// Minimal typing for the Web Speech API — not in standard TS lib.dom yet.
interface SpeechRecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResult[];
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export default function ChatBot() {
  const {
    messages,
    chat,
    loading,
    resetChat,
    streamStage,
    streamingText,
    canStop,
    stopStreaming,
    copyMessage,
    editMessage,
    regenerateMessage,
    continueMessage,
    prefillValue,
    clearPrefill,
    markNextInputAsVoice,
  } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setVoiceSupported(!!getSpeechRecognition());
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    if (prefillValue && inputRef.current) {
      inputRef.current.value = prefillValue;
      inputRef.current.focus();
      clearPrefill();
    }
  }, [prefillValue, clearPrefill]);

  function sendCurrentInput() {
    const input = inputRef.current;
    if (input && input.value.trim()) {
      chat(input.value);
      input.value = "";
    }
  }

  function toggleRecording() {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionCtor = getSpeechRecognition();
    if (!SpeechRecognitionCtor) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US"; // TODO: wire to user's preferred_language once multi-language STT is added
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      if (inputRef.current) {
        inputRef.current.value = transcript;
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      markNextInputAsVoice();
      sendCurrentInput();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

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
          <MessageBubble
            key={msg.id ?? index}
            message={msg}
            isLast={index === messages.length - 1 && msg.role === "assistant"}
            onCopy={copyMessage}
            onEdit={editMessage}
            onRegenerate={regenerateMessage}
            onContinue={continueMessage}
          />
        ))}

        {streamStage && !streamingText && (
          <div className="flex justify-start">
            <div className="bg-white border border-zinc-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3 text-sm text-zinc-500 italic">
              {streamStage === "thinking" && "Thinking…"}
              {streamStage === "validating" && "Validating…"}
              {streamStage === "generating" && "Generating a response…"}
            </div>
          </div>
        )}

        {streamingText && (
          <div className="flex justify-start">
            <div className="bg-white border border-zinc-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3 text-sm text-zinc-900">
              <MarkdownContent content={streamingText} />
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-100 bg-white">
        {isRecording && (
          <div className="mb-2 px-2 flex items-center gap-2 text-xs text-indigo-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
            Listening…
          </div>
        )}
        <div className="flex gap-2">
          <input
            id="chat-input"
            ref={inputRef}
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
                sendCurrentInput();
              }
            }}
          />

          {voiceSupported && (
            <button
              onClick={toggleRecording}
              disabled={loading}
              title={isRecording ? "Stop recording" : "Speak"}
              className={`
                w-10
                h-10
                rounded-full
                flex
                items-center
                justify-center
                transition
                ${
                  isRecording
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }
              `}
            >
              {isRecording ? <Square size={14} /> : <Mic size={16} />}
            </button>
          )}

          {canStop ? (
            <button
              onClick={stopStreaming}
              title="Stop generating"
              className="
                w-10
                h-10
                rounded-full
                bg-zinc-800
                text-white
                flex
                items-center
                justify-center
                hover:bg-zinc-700
                transition
              "
            >
              <span className="w-3 h-3 bg-white rounded-[2px]" />
            </button>
          ) : (
            <button
              disabled={loading}
              onClick={sendCurrentInput}
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
          )}
        </div>
      </div>
    </div>
  );
}
