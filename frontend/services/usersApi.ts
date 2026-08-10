const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("app_access_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface UserSummary {
  id: string;
  phone_number: string | null;
  preferred_language: string;
  is_admin: boolean;
  message_count: number;
  last_active: string | null;
  created_at: string;
}

export interface UserMessage {
  role: "user" | "assistant";
  content: string;
  channel_type: string;
  created_at: string;
}

export interface AuditEntry {
  action: string;
  payload: Record<string, unknown>;
  result: string;
  created_at: string;
}

export interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export interface UserDetail {
  id: string;
  phone_number: string | null;
  preferred_language: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  analytics: {
    message_count: number;
    handoff_count: number;
    last_active: string | null;
  };
  messages: UserMessage[];
  audit_log: AuditEntry[];
  memory: MemoryEntry[];
}

export async function listUsers(): Promise<UserSummary[]> {
  const res = await fetch(`${API_URL}/admin/users/get-users`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}

export async function getUserDetail(id: string): Promise<UserDetail> {
  const res = await fetch(`${API_URL}/admin/users/get-user/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load user details");
  return res.json();
}

export async function toggleUserActive(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/users/toggle-active/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to update user status");
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/users/delete-user/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete user");
}

export async function updateMemoryEntry(
  memoryId: string,
  value: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/admin/users/memory/${memoryId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ value }),
  });
  if (!res.ok) throw new Error("Failed to update memory entry");
}

export async function deleteMemoryEntry(memoryId: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/users/memory/${memoryId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete memory entry");
}

export async function resetUserMemory(userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/users/memory/reset/${userId}`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to reset memory");
}
