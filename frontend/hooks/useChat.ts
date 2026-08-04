"use client";

import { useEffect, useState } from "react";
import { sendMessage } from "@/services/chatApi";
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

export function useChat() {
  const [session, setSession] = useState<SessionState>({
    stage: "awaiting_phone",
    messages: [DEFAULT_MESSAGE],
  });
  const [loading, setLoading] = useState(false);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

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

  async function chat(text: string) {
    setSession((prev) => ({
      ...prev,
      messages: [...prev.messages, { role: "user", content: text }],
    }));
    setLoading(true);

    try {
      if (stage === "awaiting_phone") {
        try {
          await requestOtp(text);
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
        return;
      }

      if (stage === "awaiting_otp") {
        const res = await verifyOtp(pendingPhone!, text);
        localStorage.setItem("access_token", res.access_token);
        localStorage.setItem("phone_number", pendingPhone!);
        setSession((prev) => ({
          stage: "authenticated",
          messages: [
            ...prev.messages,
            {
              role: "assistant",
              content: `Hey ${pendingPhone}! You're all set. How can I help you today?`,
            },
          ],
        }));
        return;
      }

      const response = await sendMessage({ message: text });
      setSession((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            role: "assistant",
            content: response.answer,
            agent: response.agent,
          },
        ],
      }));
    } catch {
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
    setSession({
      stage: "awaiting_phone",
      messages: [DEFAULT_MESSAGE],
    });
  }

  return { messages, chat, loading, resetChat };
}
