"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  User,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles?: ("admin" | "staff")[];
  badge?: number;
  section?: string;
}

interface SidebarProps {
  navItems: NavItem[];
  userRole: "admin" | "staff";
  brandName?: string;
  brandSubtitle?: string;
  showBrand?: boolean;
  showProfileFooter?: boolean;
}

export function Sidebar({
  navItems,
  userRole,
  brandName = "Dashboard",
  brandSubtitle = "Control Panel",
  showBrand = true,
  showProfileFooter = true,
}: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Role-specific shared routes
  const profileHref =
    userRole === "admin" ? "/admin/profile" : "/staff/profile";

  const settingsHref =
    userRole === "admin" ? "/admin/settings" : "/staff/settings";

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole),
  );

  const itemsWithLabels = visibleItems.map((item, index) => {
    const previousSection =
      index > 0 ? visibleItems[index - 1].section : undefined;

    const showSectionLabel =
      !isCollapsed && !!item.section && item.section !== previousSection;

    return { item, showSectionLabel };
  });

  return (
    <aside
      className={`relative h-screen bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`absolute -right-3 ${
          showBrand ? "top-19" : "top-6"
        } w-6 h-6 rounded-full bg-amber-400 border border-slate-700 text-slate-400 hover:text-white hover:bg-amber-500 flex items-center justify-center transition-all duration-200 shadow-lg z-10`}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight size={14} color="white" />
        ) : (
          <ChevronLeft size={14} color="white" />
        )}
      </button>

      {/* Brand */}
      {showBrand && (
        <div
          className={`px-4 py-6 border-b border-slate-800 ${
            isCollapsed ? "flex justify-center" : ""
          }`}
        >
          <div
            className={`flex items-center gap-2.5 ${
              isCollapsed ? "justify-center" : ""
            }`}
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
      )}

      {/* Navigation */}
      <nav className="min-h-0 flex-1 px-3 py-6 flex flex-col gap-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {!isCollapsed && (
          <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 whitespace-nowrap">
            {userRole === "admin" ? "Admin Menu" : "Staff Menu"}
          </p>
        )}

        {itemsWithLabels.map(({ item, showSectionLabel }) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <div key={item.href}>
              {showSectionLabel && (
                <p className="px-3 mt-4 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {item.section}
                </p>
              )}

              <Link
                href={item.href}
                className={`
                  group relative px-3 py-2.5 rounded-lg text-sm
                  transition-all duration-200 flex items-center gap-3
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
                    <span className="flex-1 whitespace-nowrap">
                      {item.label}
                    </span>

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
            </div>
          );
        })}
      </nav>

      {/* Shared Profile & Settings */}
      {showProfileFooter && (
        <div className="p-3 border-t border-slate-800 shrink-0">
          <div className="flex flex-col gap-1">
            {/* Profile */}
            <Link
              href={profileHref}
              className={`
                group relative px-3 py-2.5 rounded-lg text-sm
                transition-all duration-200 flex items-center gap-3
                ${isCollapsed ? "justify-center" : ""}
                ${
                  pathname === profileHref
                    ? "bg-emerald-500/10 text-white font-medium"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }
              `}
              title={isCollapsed ? "Profile" : ""}
            >
              {pathname === profileHref && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
              )}

              <User
                size={18}
                className={`transition-colors shrink-0 ${
                  pathname === profileHref
                    ? "text-emerald-400"
                    : "text-slate-500 group-hover:text-slate-300"
                }`}
              />

              {!isCollapsed && (
                <span className="whitespace-nowrap">Profile</span>
              )}
            </Link>

            {/* Settings */}
            <Link
              href={settingsHref}
              className={`
                group relative px-3 py-2.5 rounded-lg text-sm
                transition-all duration-200 flex items-center gap-3
                ${isCollapsed ? "justify-center" : ""}
                ${
                  pathname === settingsHref
                    ? "bg-emerald-500/10 text-white font-medium"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }
              `}
              title={isCollapsed ? "Settings" : ""}
            >
              {pathname === settingsHref && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
              )}

              <Settings
                size={18}
                className={`transition-colors shrink-0 ${
                  pathname === settingsHref
                    ? "text-emerald-400"
                    : "text-slate-500 group-hover:text-slate-300"
                }`}
              />

              {!isCollapsed && (
                <span className="whitespace-nowrap">Settings</span>
              )}
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
