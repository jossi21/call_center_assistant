export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  agent?: string;
  id?: string;
  interrupted?: boolean;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  answer: string;
  agent: string;
}
