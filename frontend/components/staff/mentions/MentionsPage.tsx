"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  StaffNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/services/staffProfileApi";

type FilterTab = "all" | "unread" | "assigned";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function MentionsPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<StaffNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("all");

  async function load() {
    setLoading(true);
    try {
      setNotifs(await getNotifications());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, []);

  const counts = useMemo(
    () => ({
      all: notifs.length,
      unread: notifs.filter((n) => !n.is_read).length,
      assigned: notifs.filter((n) => n.type === "assignment").length,
    }),
    [notifs],
  );

  const visible = useMemo(() => {
    if (tab === "unread") return notifs.filter((n) => !n.is_read);
    if (tab === "assigned")
      return notifs.filter((n) => n.type === "assignment");
    return notifs;
  }, [notifs, tab]);

  async function handleClick(n: StaffNotification) {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      setNotifs((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
      );
    }
    if (n.handoff_id) {
      router.push(`/staff/cases?case=${n.handoff_id}`);
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  if (loading)
    return <div className="p-8 text-slate-400 text-sm">Loading...</div>;

  return (
    <div className="mx-auto max-w-4xl p-3 sm:p-4 md:p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Mentions</h1>
        <button
          onClick={handleMarkAllRead}
          className="text-sm text-slate-300 border border-slate-800 rounded-lg px-3 py-1.5 hover:bg-slate-800 transition"
        >
          Mark all as read
        </button>
      </div>

      <div className="flex gap-6 border-b border-slate-800">
        {(
          [
            { key: "all", label: "All", count: counts.all },
            { key: "unread", label: "Unread", count: counts.unread },
            {
              key: "assigned",
              label: "Assigned to Me",
              count: counts.assigned,
            },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-2 text-sm font-medium border-b-2 transition ${
              tab === t.key
                ? "border-emerald-500 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {visible.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-10">
            No notifications here.
          </div>
        ) : (
          visible.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`flex items-start gap-3 text-left p-4 rounded-xl border transition ${
                n.is_read
                  ? "bg-slate-900 border-slate-800"
                  : "bg-slate-900 border-purple-500/30"
              } hover:bg-slate-800`}
            >
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 ${
                  n.type === "assignment" ? "bg-purple-600" : "bg-blue-600"
                }`}
              >
                {n.type === "assignment" ? "AI" : initials(n.actor_name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-white">
                  <span className="font-medium">{n.actor_name}</span> mentioned
                  you
                </div>
                {n.excerpt && (
                  <div className="text-xs text-slate-400 truncate mt-0.5">
                    {n.excerpt}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-slate-500">
                  {timeAgo(n.created_at)}
                </span>
                {!n.is_read && (
                  <span className="text-[10px] font-medium bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-full">
                    Unread
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
