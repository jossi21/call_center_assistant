const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("app_access_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface StatWithDelta {
  value: number;
  delta_pct: number;
}

export interface TrendPoint {
  date: string;
  messages: number;
  conversations: number;
  human_handoff: number;
}

export interface RecentCaseRow {
  id: string;
  reason: string;
  status: string;
  assigned_to: string;
  created_at: string;
}

export interface ConversationOutcome {
  total: number;
  ai_resolved: number;
  human_handoff: number;
  pending: number;
  closed: number;
}

export interface TopAgentRow {
  agent: string;
  count: number;
  pct: number;
}

export interface TopToolRow {
  tool: string;
  count: number;
  pct: number;
}

export interface RecentActivityItem {
  type: "message" | "assignment" | "tool";
  detail: string;
  created_at: string;
}

export interface AdminDashboardData {
  total_users: StatWithDelta;
  total_conversations: StatWithDelta;
  total_messages: StatWithDelta;
  ai_resolution_rate: StatWithDelta;
  human_handoff_rate: StatWithDelta;
  avg_response_seconds: StatWithDelta;
  trend: TrendPoint[];
  outcome: ConversationOutcome;
  top_agents: TopAgentRow[];
  top_tools: TopToolRow[];
  recent_activity: RecentActivityItem[];
  recent_cases: RecentCaseRow[];
}

export async function getAdminDashboard(
  dateFrom: string,
  dateTo: string,
): Promise<AdminDashboardData> {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
  const res = await fetch(`${API_URL}/admin/analytics/dashboard?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load dashboard data");
  return res.json();
}
