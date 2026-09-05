"use client";

import { Sidebar, NavItem } from "@/components/ui/SharedSidebar";

import {
  LayoutDashboard,
  ClipboardList,
  FolderKanban,
  Bell,
  MessagesSquare,
  Bot,
  BookOpen,
  User,
  Settings,
} from "lucide-react";

const STAFF_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/staff",
    roles: ["staff"],
  },
  {
    label: "My Cases",
    icon: ClipboardList,
    href: "/staff/cases",
    roles: ["staff"],
    badge: 5,
  },
  {
    label: "All Cases",
    icon: FolderKanban,
    href: "/staff/all-cases",
    roles: ["staff"],
  },
  {
    label: "Mentions",
    icon: Bell,
    href: "/staff/mentions",
    roles: ["staff"],
    badge: 2,
  },
  {
    label: "My Chats",
    icon: MessagesSquare,
    href: "/staff/chats",
    roles: ["staff"],
  },
  {
    label: "Chatbot Assistant",
    icon: Bot,
    href: "/staff/chatbot",
    roles: ["staff"],
  },
  {
    label: "Knowledge Base",
    icon: BookOpen,
    href: "/staff/knowledge-base",
    roles: ["staff"],
  },
  {
    label: "Profile",
    icon: User,
    href: "/staff/profile",
    roles: ["staff"],
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/staff/settings",
    roles: ["staff"],
  },
];

const getUserInfo = () => {
  const storedUser = localStorage.getItem("user_info");
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return {
        name: user.name || user.phone_number || "Staff User",
        email: user.email || user.phone_number || "staff@example.com",
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
  return { name: "Staff User", email: "staff@example.com" };
};

export default function StaffSidebar() {
  const userInfo = getUserInfo();

  return (
    <Sidebar
      navItems={STAFF_NAV_ITEMS}
      userRole="staff"
      userName={userInfo.name}
      userEmail={userInfo.email}
      brandName="Staff"
      brandSubtitle="Dashboard"
    />
  );
}
