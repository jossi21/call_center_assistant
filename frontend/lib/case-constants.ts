export type ListFilter = "all" | "waiting" | "assigned" | "resolved";
export type Tab = "conversation" | "notes" | "activity";
export type ReplyMode = "reply" | "note";

export const FILTER_TABS: { key: ListFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "waiting", label: "Pending" },
  { key: "assigned", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
];

export const STATUS_STYLES: Record<string, string> = {
  waiting: "bg-blue-500/15 text-blue-400",
  waiting_confirmation: "bg-blue-500/15 text-blue-400",
  assigned: "bg-amber-500/15 text-amber-400",
  resolved: "bg-emerald-500/15 text-emerald-400",
};

export const STATUS_LABELS: Record<string, string> = {
  waiting: "Pending",
  waiting_confirmation: "Pending",
  assigned: "In Progress",
  resolved: "Resolved",
};

export function getInitials(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "?";
  return trimmed.slice(-2).toUpperCase();
}

export function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
