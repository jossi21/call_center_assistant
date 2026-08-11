const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("app_access_token");
  return { Authorization: `Bearer ${token}` };
}

export interface DailyStat {
  date: string;
  messages: number;
  new_users: number;
}

export interface Analytics {
  total_users: number;
  total_messages: number;
  agent_usage: { agent: string; count: number }[];
  tool_usage: { tool: string; count: number }[];
  avg_response_time_ms: number | null;
}

export async function getAnalytics(): Promise<Analytics> {
  const res = await fetch(`${API_URL}/admin/analytics/get-analytics`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load analytics");
  return res.json();
}

export async function getTimeseries(): Promise<DailyStat[]> {
  const res = await fetch(`${API_URL}/admin/analytics/get-timeseries`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load timeseries");
  return res.json();
}
