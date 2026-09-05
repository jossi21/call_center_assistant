import { ChatRequest, ChatResponse } from "@/types/chat";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function sendMessage(data: ChatRequest): Promise<ChatResponse> {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("phone_number");
    }
    throw new Error("Failed to send message");
  }

  return response.json();
}

export interface PolledMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export async function getChatMessages(
  after?: string,
): Promise<PolledMessage[]> {
  const token = localStorage.getItem("access_token");
  const params = after ? `?after=${encodeURIComponent(after)}` : "";
  const res = await fetch(`${API_URL}/chat/messages${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to poll messages");
  const data = await res.json();
  return data.messages;
}
