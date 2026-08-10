const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("app_access_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface Staff {
  id: string;
  user_id: string;
  phone_number: string | null;
  name: string;
  email: string;
  specialty: string;
  is_available: boolean;
  active_case_count: number;
}

export interface CaseMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StaffCase {
  id: string;
  reason: string;
  status: string;
  customer_contact: string;
  created_at: string;
  assigned_at: string | null;
  resolved_at: string | null;
  history: CaseMessage[];
}

export interface StaffDetail extends Staff {
  cases: StaffCase[];
}

export async function listStaff(): Promise<Staff[]> {
  const res = await fetch(`${API_URL}/admin/staffs/get-staffs`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load staff");
  return res.json();
}

export async function getStaffDetail(id: string): Promise<StaffDetail> {
  const res = await fetch(`${API_URL}/admin/staffs/get-staff/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load staff details");
  return res.json();
}

export async function createStaff(data: {
  phone_number: string;
  name: string;
  email: string;
  specialty: string;
}): Promise<Staff> {
  const res = await fetch(`${API_URL}/admin/staffs/create-staff`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create staff member");
  return res.json();
}

export async function updateStaff(
  id: string,
  data: { name?: string; email?: string; specialty?: string },
): Promise<Staff> {
  const res = await fetch(`${API_URL}/admin/staffs/update-staff/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update staff member");
  return res.json();
}

export async function toggleStaffActive(
  id: string,
  isAvailable: boolean,
): Promise<Staff> {
  const res = await fetch(`${API_URL}/admin/staffs/toggle-active/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ is_available: isAvailable }),
  });
  if (!res.ok) throw new Error("Failed to update availability");
  return res.json();
}

export async function deleteStaff(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/staffs/delete-staff/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete staff member");
}

export async function toggleHandoffStatus(handoffId: string): Promise<void> {
  const res = await fetch(
    `${API_URL}/admin/handoffs/toggle-status/${handoffId}`,
    {
      method: "PATCH",
      headers: authHeaders(),
    },
  );
  if (!res.ok) throw new Error("Failed to update case status");
}

export async function reassignHandoff(
  handoffId: string,
  staffId: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/admin/handoffs/reassign/${handoffId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ staff_id: staffId }),
  });
  if (!res.ok) throw new Error("Failed to reassign case");
}
