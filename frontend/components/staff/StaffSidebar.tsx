"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  User,
  Settings,
} from "lucide-react";
import { Sidebar, NavItem } from "@/components/ui/SharedSidebar";

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
  },
  {
    label: "Chatbot",
    icon: MessageSquare,
    href: "/",
    roles: ["admin", "staff"],
  },
  { label: "Profile", icon: User, href: "/staff/profile", roles: ["staff"] },
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
