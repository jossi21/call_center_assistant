const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("app_access_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface Channel {
  id: string;
  name: string;
  display_name: string;
  config: Record<string, unknown>;
  is_active: boolean;
}

export interface ChannelTypeField {
  key: string;
  label: string;
  type: "text" | "password";
  required: boolean;
}

export interface ChannelTypeDef {
  display_name: string;
  fields: ChannelTypeField[];
}

export async function listChannelTypes(): Promise<
  Record<string, ChannelTypeDef>
> {
  const res = await fetch(`${API_URL}/admin/channels/channel-types`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load channel types");
  return res.json();
}

export async function listChannels(): Promise<Channel[]> {
  const res = await fetch(`${API_URL}/admin/channels/get-channels`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load channels");
  return res.json();
}

export async function createChannel(data: {
  name: string;
  display_name: string;
  config: Record<string, unknown>;
}): Promise<Channel> {
  const res = await fetch(`${API_URL}/admin/channels/create-channel`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create channel");
  return res.json();
}

export async function updateChannel(
  id: string,
  data: Partial<Pick<Channel, "display_name" | "config">>,
): Promise<Channel> {
  const res = await fetch(`${API_URL}/admin/channels/update-channel/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update channel");
  return res.json();
}

export async function toggleChannelActive(id: string): Promise<Channel> {
  const res = await fetch(`${API_URL}/admin/channels/toggle-active/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to toggle channel status");
  return res.json();
}

export async function deleteChannel(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/channels/delete-channel/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to deactivate channel");
}
