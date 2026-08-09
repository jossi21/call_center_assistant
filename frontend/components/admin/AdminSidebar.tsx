// components/admin/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  MessageSquare,
  Languages,
  Users,
  Users2,
  Database,
  BarChart3,
  Settings,
  User,
  LogOut,
  Sparkles,
  Toolbox,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Agents", icon: Bot, href: "/admin/agents" },
  { label: "Languages", icon: Languages, href: "/admin/languages" },
  { label: "Tools", icon: Toolbox, href: "/admin/tools" },
  { label: "Admins", icon: Users, href: "/admin/admins" },
  { label: "Staffs", icon: Users2, href: "/admin/staffs" },
  { label: "Memory", icon: Database, href: "/admin/memory" },
  { label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
  { label: "Chatbot", icon: MessageSquare, href: "/" },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
  { label: "Profile", icon: User, href: "/admin/profile" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("admin_access_token");
    router.push("/admin");
    router.refresh();
  }

  return (
    <aside className="w-64 min-h-screen bg-zinc-900 text-zinc-100 flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <span className="text-lg font-semibold text-white tracking-tight">
              Admin
            </span>
            <p className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">
              Control Panel
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 flex flex-col gap-1">
        <p className="px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Main Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group relative px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3
                ${
                  active
                    ? "bg-indigo-500/10 text-white font-medium"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }
              `}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50" />
              )}

              <Icon
                size={18}
                className={`transition-colors ${
                  active
                    ? "text-indigo-400"
                    : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              />
              <span>{item.label}</span>

              {active && (
                <div className="absolute inset-0 rounded-lg bg-indigo-500/5 -z-10" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-zinc-800">
        <div className="px-3 py-2.5 rounded-lg bg-zinc-800/50 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center ring-2 ring-indigo-500/10">
              <User size={14} className="text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                Admin User
              </p>
              <p className="text-xs text-zinc-500 truncate">
                admin@example.com
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 flex items-center gap-3 transition-all duration-200 group"
        >
          <LogOut
            size={18}
            className="text-zinc-500 group-hover:text-zinc-300 transition-colors"
          />
          Logout
        </button>
      </div>
    </aside>
  );
}
