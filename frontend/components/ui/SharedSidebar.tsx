"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  User,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles?: ("admin" | "staff")[];
  badge?: number;
}

interface SidebarProps {
  navItems: NavItem[];
  userRole: "admin" | "staff";
  userName: string;
  userEmail: string;
  brandName?: string;
  brandSubtitle?: string;
}

export function Sidebar({
  navItems,
  userRole,
  userName,
  userEmail,
  brandName = "Dashboard",
  brandSubtitle = "Control Panel",
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  async function handleLogout() {
    try {
      localStorage.removeItem("app_access_token");
      localStorage.removeItem("admin_access_token");
      localStorage.removeItem("phone_number");
      localStorage.removeItem("user_info");
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      router.push("/login");
    }
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside
      className={`relative min-h-screen bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-64"}`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-19 w-6 h-6 rounded-full bg-amber-400 border border-slate-700 text-slate-400 hover:text-white hover:bg-amber-500 flex items-center justify-center transition-all duration-200 shadow-lg z-10"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight size={14} color="white" />
        ) : (
          <ChevronLeft size={14} color="white" />
        )}
      </button>

      {/* Brand */}
      <div
        className={`px-4 py-6 border-b border-slate-800 ${isCollapsed ? "flex justify-center" : ""}`}
      >
        <div
          className={`flex items-center gap-2.5 ${isCollapsed ? "justify-center" : ""}`}
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
            <Sparkles size={20} className="text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <span className="text-lg font-semibold text-white tracking-tight">
                {brandName}
              </span>
              <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                {brandSubtitle}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 flex flex-col gap-1 overflow-hidden">
        {!isCollapsed && (
          <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 whitespace-nowrap">
            {userRole === "admin" ? "Admin Menu" : "Staff Menu"}
          </p>
        )}
        {navItems.map((item) => {
          if (item.roles && !item.roles.includes(userRole)) {
            return null;
          }

          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group relative px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3
                ${isCollapsed ? "justify-center" : ""}
                ${
                  active
                    ? "bg-emerald-500/10 text-white font-medium"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }
              `}
              title={isCollapsed ? item.label : ""}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
              )}

              <Icon
                size={18}
                className={`transition-colors shrink-0 ${
                  active
                    ? "text-emerald-400"
                    : "text-slate-500 group-hover:text-slate-300"
                }`}
              />
              {!isCollapsed && (
                <>
                  <span className="flex-1 whitespace-nowrap">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </>
              )}

              {active && (
                <div className="absolute inset-0 rounded-lg bg-emerald-500/5 -z-10" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-slate-800">
        {!isCollapsed ? (
          <>
            <div className="px-3 py-2.5 rounded-lg bg-slate-800/50 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center ring-2 ring-emerald-500/10 shrink-0">
                  <User size={14} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 flex items-center gap-3 transition-all duration-200 group"
            >
              <LogOut
                size={18}
                className="text-slate-500 group-hover:text-slate-300 transition-colors shrink-0"
              />
              Logout
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center ring-2 ring-emerald-500/10">
                <User size={14} className="text-emerald-400" />
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex justify-center px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200 group"
              title="Logout"
            >
              <LogOut
                size={18}
                className="text-slate-500 group-hover:text-slate-300 transition-colors"
              />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
