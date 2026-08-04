export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  agent?: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  answer: string;
  agent: string;
}
