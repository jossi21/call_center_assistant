"use client";

import { Sidebar, NavItem } from "@/components/ui/SharedSidebar";

import {
  LayoutDashboard,
  ClipboardList,
  FolderKanban,
  Bell,
} from "lucide-react";

export default function StaffSidebar({
  casesBadge = 0,
  mentionsBadge = 0,
}: {
  casesBadge?: number;
  mentionsBadge?: number;
}) {
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
      badge: casesBadge,
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
      badge: mentionsBadge,
    },
  ];

  return (
    <Sidebar
      navItems={STAFF_NAV_ITEMS}
      userRole="staff"
      brandName="Staff"
      brandSubtitle="Dashboard"
      showProfileFooter={true}
    />
  );
}
