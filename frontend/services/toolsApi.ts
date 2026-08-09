const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("admin_access_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters_schema: Record<string, unknown>;
  risk_tier: "safe" | "reversible" | "destructive";
  action_type: "update_user_field" | "write_user_memory" | "call_webhook";
  action_config: Record<string, unknown>;
  agent_name: string | null;
  is_active: boolean;
}

export async function listTools(): Promise<Tool[]> {
  const res = await fetch(`${API_URL}/admin/tools/get-tools`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load tools");
  return res.json();
}

export async function createTool(
  data: Omit<Tool, "id" | "is_active">,
): Promise<Tool> {
  const res = await fetch(`${API_URL}/admin/tools/create-tool`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create tool");
  return res.json();
}

export async function updateTool(
  id: string,
  data: Partial<Tool>,
): Promise<Tool> {
  const res = await fetch(`${API_URL}/admin/tools/update-tool/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update tool");
  return res.json();
}

export async function deleteTool(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/tools/delete-tool/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  console.log("status:", res.status);

  const text = await res.text();
  console.log("response:", text);

  if (!res.ok) {
    throw new Error(text);
  }
}
