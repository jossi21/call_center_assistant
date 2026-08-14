"use client";

import { useState } from "react";
import {
  Bot,
  BarChart3,
  Languages,
  Toolbox,
  Webhook,
  Users,
  Users2,
  UserCircle,
  Database,
  MessageSquare,
  Settings,
  User,
} from "lucide-react";
import { Sidebar, NavItem } from "@/components/ui/SharedSidebar";

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Analytics", icon: BarChart3, href: "/admin/", roles: ["admin"] },
  { label: "Agents", icon: Bot, href: "/admin/agents", roles: ["admin"] },
  {
    label: "Languages",
    icon: Languages,
    href: "/admin/languages",
    roles: ["admin"],
  },
  { label: "Tools", icon: Toolbox, href: "/admin/tools", roles: ["admin"] },
  {
    label: "Channels",
    icon: Webhook,
    href: "/admin/channels",
    roles: ["admin"],
  },
  { label: "Admins", icon: Users, href: "/admin/admins", roles: ["admin"] },
  { label: "Staffs", icon: Users2, href: "/admin/staffs", roles: ["admin"] },
  { label: "Users", icon: UserCircle, href: "/admin/users", roles: ["admin"] },
  { label: "Memory", icon: Database, href: "/admin/memory", roles: ["admin"] },
  {
    label: "Chatbot",
    icon: MessageSquare,
    href: "/",
    roles: ["admin", "staff"],
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/admin/settings",
    roles: ["admin"],
  },
  { label: "Profile", icon: User, href: "/admin/profile", roles: ["admin"] },
];

const getUserInfo = () => {
  const storedUser = localStorage.getItem("user_info");
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return {
        name: user.name || user.phone_number || "Admin User",
        email: user.email || user.phone_number || "admin@example.com",
      };
    } catch {
      const phone = localStorage.getItem("phone_number");
      if (phone) {
        return { name: phone, email: phone };
      }
    }
  }
  const phone = localStorage.getItem("phone_number");
  if (phone) {
    return { name: phone, email: phone };
  }
  return { name: "Admin User", email: "admin@example.com" };
};

export default function AdminSidebar() {
  const userInfo = getUserInfo();

  return (
    <Sidebar
      navItems={ADMIN_NAV_ITEMS}
      userRole="admin"
      userName={userInfo.name}
      userEmail={userInfo.email}
      brandName="Admin"
      brandSubtitle="Control Panel"
    />
  );
}
