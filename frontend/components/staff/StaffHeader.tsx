"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, User as UserIcon } from "lucide-react";
import {
  MyProfile,
  StaffNotification,
  getNotifications,
  markNotificationRead,
} from "@/services/staffProfileApi";
import { AvailabilityToggle } from "./AvailabilityToggle";

const PAGE_TITLES: Record<string, string> = {
  "/staff": "Dashboard",
  "/staff/cases": "My Cases",
  "/staff/all-cases": "All Cases",
  "/staff/mentions": "Mentions",
  "/staff/chats": "My Chats",
  "/staff/chatbot": "Chatbot Assistant",
  "/staff/knowledge-base": "Knowledge Base",
  "/staff/profile": "Profile",
  "/staff/settings": "Settings",
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function StaffHeader({
  profile,
  onProfileUpdated,
  notifications,
  onNotificationsChanged,
}: {
  profile: MyProfile | null;
  onProfileUpdated: (p: MyProfile) => void;
  notifications: StaffNotification[];
  onNotificationsChanged: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const title = PAGE_TITLES[pathname] ?? "Staff Dashboard";
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const recent = notifications.slice(0, 6);

  async function handleNotificationClick(n: StaffNotification) {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      onNotificationsChanged();
    }
    setBellOpen(false);
    if (n.handoff_id) {
      router.push(`/staff/cases?case=${n.handoff_id}`);
    } else {
      router.push("/staff/mentions");
    }
  }

  function handleLogout() {
    localStorage.removeItem("app_access_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("phone_number");
    localStorage.removeItem("user_info");
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="border-b border-slate-800 bg-slate-950 px-4 sm:px-6 py-3 flex items-center justify-between">
      <h1 className="text-sm font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen((o) => !o)}
            className="relative text-slate-400 hover:text-white transition"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <div
            className={`absolute right-0 top-full mt-2 w-72 origin-top-right bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 transition-all duration-150 ease-out ${
              bellOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
            }`}
          >
            <div className="px-3 py-2.5 border-b border-slate-800 text-xs font-semibold text-slate-300">
              Notifications
            </div>
            <div className="max-h-80 overflow-y-auto">
              {recent.length === 0 ? (
                <div className="px-3 py-6 text-xs text-slate-500 text-center">
                  Nothing yet.
                </div>
              ) : (
                recent.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left px-3 py-2.5 border-b border-slate-800/60 hover:bg-slate-800 transition ${
                      n.is_read ? "" : "bg-slate-800/40"
                    }`}
                  >
                    <div className="text-xs text-slate-200">
                      <span className="font-medium">{n.actor_name}</span>{" "}
                      mentioned you
                    </div>
                    {n.excerpt && (
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {n.excerpt}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-600 mt-1">
                      {timeAgo(n.created_at)} ago
                    </div>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => {
                setBellOpen(false);
                router.push("/staff/mentions");
              }}
              className="w-full text-center px-3 py-2 text-xs text-blue-400 hover:text-blue-300 transition"
            >
              View all
            </button>
          </div>
        </div>

        {profile && (
          <AvailabilityToggle profile={profile} onUpdated={onProfileUpdated} />
        )}

        {profile && (
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center ring-1 ring-emerald-500/20 shrink-0">
              <UserIcon size={13} className="text-emerald-400" />
            </div>
            <span className="text-sm text-slate-200 truncate max-w-[120px]">
              {profile.name}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          title="Logout"
          className="text-slate-400 hover:text-white transition"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
