const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("app_access_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export type StaffStatus = "available" | "away" | "busy" | "offline";

export interface MyProfile {
  id: string;
  name: string;
  email: string;
  specialty: string;
  is_available: boolean;
  status: StaffStatus;
}

export interface CaseMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface MyCase {
  id: string;
  reason: string;
  status: string;
  priority: "low" | "medium" | "high";
  channel_type: string;
  user_contact: string;
  created_at: string;
  assigned_at: string | null;
  resolved_at: string | null;
  ai_paused: boolean; // NEW
  history: CaseMessage[];
}

export interface CasesOverTimePoint {
  date: string;
  created: number;
  resolved: number;
}

export interface PerformanceStats {
  resolved: number;
  total_cases: number;
  messages_sent: number;
  resolution_rate: number;
  avg_response_seconds: number;
}

export interface DashboardStats {
  active_cases: number;
  pending: number;
  in_progress: number;
  resolved_today: number;
  avg_response_seconds: number;
  cases_over_time: CasesOverTimePoint[];
  status_distribution: {
    pending: number;
    in_progress: number;
    resolved: number;
    waiting_confirmation: number;
  };
  total_cases: number;
  performance: PerformanceStats;
}

export interface CaseCustomer {
  id: string;
  name: string | null;
  location: string | null;
  phone: string | null;
  channel_type: string | null;
  verified: boolean;
  member_since: string;
  total_conversations: number;
}

export async function updateAiPause(
  handoffId: string,
  paused: boolean,
): Promise<void> {
  const res = await fetch(`${API_URL}/staff/my-cases/${handoffId}/ai-pause`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ paused }),
  });
  if (!res.ok) throw new Error("Failed to update AI pause state");
}

export interface ReplyTemplate {
  id: string;
  title: string;
  body: string;
  category: string | null;
  is_active: boolean;
}

export interface PolledMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
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

export async function updateMyStatus(status: StaffStatus): Promise<MyProfile> {
  const res = await fetch(`${API_URL}/staff/update-my-status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
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

export async function sendCaseReply(
  handoffId: string,
  message: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/staff/my-cases/${handoffId}/reply`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error("Failed to send reply");
}

export async function getDashboardStats(
  chartRange: "week" | "month" = "week",
  perfPeriod: "today" | "week" | "month" | "all" = "today",
): Promise<DashboardStats> {
  const params = new URLSearchParams({
    chart_range: chartRange,
    perf_period: perfPeriod,
  });
  const res = await fetch(`${API_URL}/staff/dashboard-stats?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load dashboard stats");
  return res.json();
}

export async function updateCasePriority(
  handoffId: string,
  priority: "low" | "medium" | "high",
): Promise<void> {
  const res = await fetch(`${API_URL}/staff/my-cases/${handoffId}/priority`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ priority }),
  });
  if (!res.ok) throw new Error("Failed to update priority");
}

export async function getCaseCustomer(
  handoffId: string,
): Promise<CaseCustomer> {
  const res = await fetch(`${API_URL}/staff/my-cases/${handoffId}/customer`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load customer info");
  return res.json();
}

export async function updateCaseCustomer(
  handoffId: string,
  body: { name?: string; location?: string },
): Promise<void> {
  const res = await fetch(`${API_URL}/staff/my-cases/${handoffId}/customer`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update customer info");
}

export async function getReplyTemplates(): Promise<ReplyTemplate[]> {
  const res = await fetch(`${API_URL}/staff/templates`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load templates");
  return res.json();
}

export async function suggestCaseReply(handoffId: string): Promise<string> {
  const res = await fetch(
    `${API_URL}/staff/my-cases/${handoffId}/suggest-reply`,
    {
      method: "POST",
      headers: authHeaders(),
    },
  );
  if (!res.ok) throw new Error("Failed to generate suggested reply");
  const data = await res.json();
  return data.suggested_reply;
}

export async function getCaseMessages(
  handoffId: string,
  after?: string,
): Promise<PolledMessage[]> {
  const params = after ? `?after=${encodeURIComponent(after)}` : "";
  const res = await fetch(
    `${API_URL}/staff/my-cases/${handoffId}/messages${params}`,
    { headers: authHeaders() },
  );
  if (!res.ok) throw new Error("Failed to load new messages");
  const data = await res.json();
  return data.messages;
}

export interface AllCasesRow {
  id: string;
  customer: string;
  channel_type: string;
  status: string;
  priority: "low" | "medium" | "high";
  assigned_to: string;
  updated_at: string;
}

export interface AllCasesResponse {
  cases: AllCasesRow[];
  total: number;
  page: number;
  page_size: number;
}

export async function listAllCases(params: {
  customer?: string;
  channel?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}): Promise<AllCasesResponse> {
  const query = new URLSearchParams();
  if (params.customer) query.set("customer", params.customer);
  if (params.channel) query.set("channel", params.channel);
  if (params.status) query.set("status", params.status);
  if (params.date_from) query.set("date_from", params.date_from);
  if (params.date_to) query.set("date_to", params.date_to);
  if (params.page) query.set("page", String(params.page));

  const res = await fetch(`${API_URL}/staff/all-cases?${query}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load all cases");
  return res.json();
}
