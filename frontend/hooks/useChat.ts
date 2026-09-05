"use client";

import { useEffect, useRef, useState } from "react";
import { requestOtp, verifyOtp } from "@/services/authApi";
import { ChatMessage } from "@/types/chat";

type AuthStage = "awaiting_phone" | "awaiting_otp" | "authenticated";

const DEFAULT_MESSAGE: ChatMessage = {
  role: "assistant",
  content: "Hi! Please enter your phone number to get started.",
};

interface SessionState {
  stage: AuthStage;
  messages: ChatMessage[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface SSEHandlers {
  onStart?: (data: {
    stream_id: string;
    user_message_id: string | null;
  }) => void;
  onStage?: (stage: string) => void;
  onChunk?: (text: string) => void;
  onFinal?: (data: {
    answer: string;
    agent: string;
    interrupted?: boolean;
    message_id?: string;
  }) => void;
}

async function runSSEStream(url: string, body: unknown, handlers: SSEHandlers) {
  const token = localStorage.getItem("access_token");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      const lines = part.split("\n");
      const eventLine = lines.find((l) => l.startsWith("event:"));
      const dataLine = lines.find((l) => l.startsWith("data:"));
      if (!eventLine || !dataLine) continue;

      const eventType = eventLine.replace("event:", "").trim();
      const data = JSON.parse(dataLine.replace("data:", "").trim());

      if (eventType === "start") handlers.onStart?.(data);
      else if (eventType === "stage") handlers.onStage?.(data.stage);
      else if (eventType === "chunk") handlers.onChunk?.(data.text);
      else if (eventType === "final") handlers.onFinal?.(data);
    }
  }
}

export function useChat() {
  const [session, setSession] = useState<SessionState>({
    stage: "awaiting_phone",
    messages: [DEFAULT_MESSAGE],
  });
  const [loading, setLoading] = useState(false);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [streamStage, setStreamStage] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState<string>("");
  const [canStop, setCanStop] = useState(false);
  const [prefillValue, setPrefillValue] = useState<string | null>(null);

  const streamIdRef = useRef<string | null>(null);

  // Real-time polling: picks up out-of-band assistant messages —
  // most importantly, human staff replies sent via the staff dashboard
  // for web-channel handoffs, which never come back through the SSE stream.
  const pollAfterRef = useRef<string>(new Date().toISOString());
  const seenIdsRef = useRef<Set<string>>(new Set());

  const { stage, messages } = session;

  useEffect(() => {
    queueMicrotask(() => {
      const token = localStorage.getItem("access_token");
      const phone = localStorage.getItem("phone_number");

      if (token) {
        setSession({
          stage: "authenticated",
          messages: [
            {
              role: "assistant",
              content: `Welcome back, hey ${phone}! How can I help you today?`,
            },
          ],
        });
      }
    });
  }, []);

  // Poll for new assistant-role messages (AI or human staff) while authenticated.
  useEffect(() => {
    if (stage !== "authenticated") return;

    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(
          `${API_URL}/chat/messages?after=${encodeURIComponent(pollAfterRef.current)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!data.messages?.length) return;

        const fresh = data.messages.filter(
          (m: { id: string }) => !seenIdsRef.current.has(m.id),
        );
        if (fresh.length === 0) return;

        fresh.forEach((m: { id: string }) => seenIdsRef.current.add(m.id));
        pollAfterRef.current =
          data.messages[data.messages.length - 1].created_at;

        setSession((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            ...fresh.map((m: { id: string; content: string }) => ({
              role: "assistant" as const,
              content: m.content,
              id: m.id,
            })),
          ],
        }));
      } catch {
        // best-effort — a missed poll just gets caught by the next one
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [stage]);

  async function stopStreaming() {
    const streamId = streamIdRef.current;
    if (!streamId) return;

    const token = localStorage.getItem("access_token");
    try {
      await fetch(`${API_URL}/chat/stream/stop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stream_id: streamId }),
      });
    } catch {
      // Best-effort — if this fails, the stream will still finish naturally.
    }
    setCanStop(false);
  }

  function attachUserMessageId(userMessageId: string | null) {
    if (userMessageId === null) return;
    setSession((prev) => {
      const msgs = [...prev.messages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === "user" && msgs[i].id === undefined) {
          msgs[i] = { ...msgs[i], id: userMessageId };
          break;
        }
      }
      return { ...prev, messages: msgs };
    });
  }

  async function streamAuthenticatedMessage(text: string) {
    setStreamStage("thinking");
    setStreamingText("");
    setCanStop(false);
    streamIdRef.current = null;

    await runSSEStream(
      `${API_URL}/chat/stream`,
      { message: text },
      {
        onStart: (data) => {
          streamIdRef.current = data.stream_id;
          setCanStop(true);
          attachUserMessageId(data.user_message_id);
        },
        onStage: setStreamStage,
        onChunk: (text) => setStreamingText((prev) => prev + text),
        onFinal: (data) => {
          setStreamStage(null);
          setStreamingText("");
          setCanStop(false);
          streamIdRef.current = null;
          if (data.message_id) seenIdsRef.current.add(String(data.message_id));
          setSession((prev) => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                role: "assistant",
                content: data.answer,
                agent: data.agent,
                id: data.message_id,
                interrupted: data.interrupted,
              },
            ],
          }));
        },
      },
    );
  }

  async function regenerateMessage(messageId: string) {
    setStreamStage("thinking");
    setStreamingText("");
    setCanStop(false);
    streamIdRef.current = null;

    setSession((prev) => ({
      ...prev,
      messages: prev.messages.filter((m) => m.id !== messageId),
    }));

    await runSSEStream(
      `${API_URL}/chat/regenerate/stream`,
      { message_id: messageId },
      {
        onStart: (data) => {
          streamIdRef.current = data.stream_id;
          setCanStop(true);
        },
        onStage: setStreamStage,
        onChunk: (text) => setStreamingText((prev) => prev + text),
        onFinal: (data) => {
          setStreamStage(null);
          setStreamingText("");
          setCanStop(false);
          streamIdRef.current = null;
          if (data.message_id) seenIdsRef.current.add(String(data.message_id));
          setSession((prev) => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                role: "assistant",
                content: data.answer,
                agent: data.agent,
                id: data.message_id,
                interrupted: data.interrupted,
              },
            ],
          }));
        },
      },
    );
  }

  async function continueMessage(messageId: string) {
    setCanStop(false);
    streamIdRef.current = null;

    await runSSEStream(
      `${API_URL}/chat/continue/stream`,
      { message_id: messageId },
      {
        onStart: (data) => {
          streamIdRef.current = data.stream_id;
          setCanStop(true);
        },
        onChunk: (text) => {
          setSession((prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === messageId ? { ...m, content: m.content + text } : m,
            ),
          }));
        },
        onFinal: (data) => {
          setCanStop(false);
          streamIdRef.current = null;
          setSession((prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === messageId
                ? { ...m, content: data.answer, interrupted: data.interrupted }
                : m,
            ),
          }));
        },
      },
    );
  }

  function copyMessage(content: string) {
    navigator.clipboard?.writeText(content).catch(() => {});
  }

  async function editMessage(messageId: string, newContent: string) {
    const token = localStorage.getItem("access_token");
    await fetch(`${API_URL}/chat/edit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message_id: messageId, new_content: newContent }),
    });

    setSession((prev) => {
      const idx = prev.messages.findIndex((m) => m.id === messageId);
      if (idx === -1) return prev;
      return { ...prev, messages: prev.messages.slice(0, idx) };
    });

    await chat(newContent);
  }

  async function verifyAndProceed(phone: string, code: string) {
    const res = await verifyOtp(phone, code);
    localStorage.setItem("access_token", res.access_token);
    localStorage.setItem("phone_number", phone);
    setSession((prev) => ({
      stage: "authenticated",
      messages: [
        ...prev.messages,
        {
          role: "assistant",
          content: `Hey ${phone}! You're all set. How can I help you today?`,
        },
      ],
    }));
  }

  function clearPrefill() {
    setPrefillValue(null);
  }

  async function chat(text: string) {
    setSession((prev) => ({
      ...prev,
      messages: [...prev.messages, { role: "user", content: text }],
    }));
    setLoading(true);

    try {
      if (stage === "awaiting_phone") {
        let otpResponse;
        try {
          otpResponse = await requestOtp(text);
        } catch {
          setSession((prev) => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                role: "assistant",
                content:
                  "That doesn't look like a valid phone number. Please enter it as 09XXXXXXXX.",
              },
            ],
          }));
          return;
        }

        setPendingPhone(text);

        setSession((prev) => ({
          stage: "awaiting_otp",
          messages: [
            ...prev.messages,
            {
              role: "assistant",
              content: "I've sent a code to that number. Please enter it here.",
            },
          ],
        }));

        if (otpResponse.dev_code) {
          setPrefillValue(otpResponse.dev_code);
        }
        return;
      }

      if (stage === "awaiting_otp") {
        await verifyAndProceed(pendingPhone!, text);
        return;
      }

      await streamAuthenticatedMessage(text);
    } catch {
      setStreamStage(null);
      setStreamingText("");
      setCanStop(false);
      streamIdRef.current = null;
      setSession((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            role: "assistant",
            content:
              stage === "authenticated"
                ? "Something went wrong. Please try again."
                : "That didn't work — please try again.",
          },
        ],
      }));
    } finally {
      setLoading(false);
    }
  }

  function resetChat() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("phone_number");
    setPendingPhone(null);
    setStreamStage(null);
    setStreamingText("");
    setCanStop(false);
    setPrefillValue(null);
    streamIdRef.current = null;
    seenIdsRef.current = new Set();
    pollAfterRef.current = new Date().toISOString();
    setSession({
      stage: "awaiting_phone",
      messages: [DEFAULT_MESSAGE],
    });
  }

  return {
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
  };
}
