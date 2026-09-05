const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("app_access_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface Template {
  id: string;
  title: string;
  body: string;
  category: string | null;
  is_active: boolean;
}

export async function listTemplates(): Promise<Template[]> {
  const res = await fetch(`${API_URL}/admin/templates/get-templates`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load templates");
  return res.json();
}

export async function createTemplate(
  data: Omit<Template, "id" | "is_active">,
): Promise<Template> {
  const res = await fetch(`${API_URL}/admin/templates/create-template`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create template");
  return res.json();
}

export async function updateTemplate(
  id: string,
  data: Partial<Omit<Template, "id">>,
): Promise<Template> {
  const res = await fetch(`${API_URL}/admin/templates/update-template/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update template");
  return res.json();
}

export async function deleteTemplate(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/templates/delete-template/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete template");
}
