const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("app_access_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface MyProfile {
  id: string;
  name: string;
  email: string;
  specialty: string;
  is_available: boolean;
}

export interface CaseMessage {
  role: "user" | "assistant";
  content: string;
}

export interface MyCase {
  id: string;
  reason: string;
  status: string;
  user_contact: string;
  assigned_at: string;
  history: CaseMessage[];
}

export async function getMyProfile(): Promise<MyProfile> {
  const res = await fetch(`${API_URL}/staff/my-profile`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
}

export async function updateMyAvailability(
  isAvailable: boolean,
): Promise<MyProfile> {
  const res = await fetch(`${API_URL}/staff/update-my-availability`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ is_available: isAvailable }),
  });
  if (!res.ok) throw new Error("Failed to update availability");
  return res.json();
}

export async function listMyCases(): Promise<MyCase[]> {
  const res = await fetch(`${API_URL}/staff/get-my-cases`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load cases");
  return res.json();
}

export async function resolveCase(handoffId: string): Promise<void> {
  const res = await fetch(`${API_URL}/staff/my-cases/${handoffId}/resolve`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to resolve case");
}
