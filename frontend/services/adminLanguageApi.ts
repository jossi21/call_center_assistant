// services/adminLanguageApi.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("admin_access_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface Language {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export async function listLanguages(): Promise<Language[]> {
  const res = await fetch(`${API_URL}/admin/languages`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load languages");
  return res.json();
}

export async function createLanguage(data: {
  code: string;
  name: string;
}): Promise<Language> {
  const res = await fetch(`${API_URL}/admin/languages`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create language");
  return res.json();
}

export async function updateLanguage(
  id: string,
  data: { is_active?: boolean },
): Promise<Language> {
  const res = await fetch(`${API_URL}/admin/languages/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update language");
  return res.json();
}

export async function deleteLanguage(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/languages/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to deactivate language");
}
