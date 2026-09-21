export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  agent?: string;
  id?: string;
  interrupted?: boolean;
  is_staff?: boolean;
  structured?: { type: string; url?: string; [key: string]: unknown } | null;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  answer: string;
  agent: string;
}
