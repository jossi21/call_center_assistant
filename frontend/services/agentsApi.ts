const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("app_access_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface Agent {
  id: string;
  name: string;
  display_name: string;
  description: string;
  system_prompt: string;
  is_active: boolean;
}

export async function listAgents(): Promise<Agent[]> {
  const res = await fetch(`${API_URL}/admin/agents/get-agents`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load agents");
  return res.json();
}

export async function createAgent(data: {
  name: string;
  display_name: string;
  description: string;
  system_prompt: string;
}): Promise<Agent> {
  const res = await fetch(`${API_URL}/admin/agents/create-agent`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create agent");
  return res.json();
}

export async function updateAgent(
  id: string,
  data: Partial<
    Pick<Agent, "display_name" | "description" | "system_prompt" | "is_active">
  >,
): Promise<Agent> {
  const res = await fetch(`${API_URL}/admin/agents/update-agent/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update agent");
  return res.json();
}

export async function deleteAgent(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/agents/delete-agent/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete agent");
}

export async function getAgent(id: string): Promise<Agent> {
  const res = await fetch(`${API_URL}/admin/agents/get-agent/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load agent");
  return res.json();
}
