"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Sun, Moon, ChevronDown, LogOut } from "lucide-react";

interface SharedHeaderProps {
  searchPlaceholder?: string;
  notificationCount?: number;
  userName: string;
  userRole: string;
}

export function SharedHeader({
  searchPlaceholder = "Search anything... (users, cases, tools, agents, etc.)",
  notificationCount = 0,
  userName,
  userRole,
}: SharedHeaderProps) {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem("app_access_token");
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("phone_number");
    localStorage.removeItem("user_info");
    router.push("/login");
    router.refresh();
  }

  const initial = userName?.charAt(0)?.toUpperCase() || "A";

  return (
    <header className="h-16 w-full shrink-0 bg-slate-950 border-b border-slate-800 flex items-center gap-6 px-5">
      <div className="flex-1 max-w-xl">
        <div className="flex items-center gap-2 h-9 rounded-lg bg-slate-900 border border-slate-800 px-3 text-slate-500 focus-within:border-slate-700">
          <Search size={15} className="shrink-0" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            Ctrl+K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <button
          title="Notifications"
          className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <Bell size={17} />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setIsDark((d) => !d)}
          title="Toggle theme"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 pl-1.5 pr-2 h-9 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 text-white text-xs font-semibold">
              {initial}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-medium text-white leading-tight">
                {userName}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight capitalize">
                {userRole}
              </p>
            </div>
            <ChevronDown size={14} className="text-slate-500" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 w-40 rounded-lg bg-slate-900 border border-slate-800 shadow-xl overflow-hidden py-1 z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/60 flex items-center gap-2"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
