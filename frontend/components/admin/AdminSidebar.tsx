"use client";

import {
  LayoutDashboard,
  BarChart3,
  Bot,
  Languages,
  Wrench,
  Webhook,
  Users2,
  UserCircle,
  Database,
  MessageSquare,
  FileText,
  BookOpen,
  FileBarChart2,
  Bell,
  Plug,
  ScrollText,
  DatabaseBackup,
  Brain,
  Shield,
  Palette,
  SlidersHorizontal,
} from "lucide-react";
import { Sidebar, NavItem } from "@/components/ui/SharedSidebar";

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
    roles: ["admin"],
  },
  { label: "Agents", icon: Bot, href: "/admin/agents", roles: ["admin"] },
  {
    label: "Languages",
    icon: Languages,
    href: "/admin/languages",
    roles: ["admin"],
  },
  { label: "Tools", icon: Wrench, href: "/admin/tools", roles: ["admin"] },
  {
    label: "Channels",
    icon: Webhook,
    href: "/admin/channels",
    roles: ["admin"],
  },
  {
    label: "Templates",
    icon: FileText,
    href: "/admin/templates",
    roles: ["admin"],
  },
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
    label: "Knowledge Base",
    icon: BookOpen,
    href: "/admin/knowledge-base",
    roles: ["admin"],
  },
  {
    label: "Reports",
    icon: FileBarChart2,
    href: "/admin/reports",
    roles: ["admin"],
  },
  {
    label: "Notifications",
    icon: Bell,
    href: "/admin/notifications",
    roles: ["admin"],
    section: "System Management",
    badge: 3,
  },
  {
    label: "Integrations",
    icon: Plug,
    href: "/admin/integrations",
    roles: ["admin"],
    section: "System Management",
  },
  {
    label: "Logs",
    icon: ScrollText,
    href: "/admin/logs",
    roles: ["admin"],
    section: "System Management",
  },
  {
    label: "Backup & Restore",
    icon: DatabaseBackup,
    href: "/admin/backup",
    roles: ["admin"],
    section: "System Management",
  },

  {
    label: "AI Behavior",
    icon: Brain,
    href: "/admin/ai-behavior",
    roles: ["admin"],
    section: "AI & Security",
  },
  {
    label: "Security",
    icon: Shield,
    href: "/admin/security",
    roles: ["admin"],
    section: "AI & Security",
  },
  {
    label: "Branding",
    icon: Palette,
    href: "/admin/branding",
    roles: ["admin"],
    section: "AI & Security",
  },
  {
    label: "System Settings",
    icon: SlidersHorizontal,
    href: "/admin/system-settings",
    roles: ["admin"],
    section: "AI & Security",
  },
];

export default function AdminSidebar() {
  return (
    <Sidebar
      navItems={ADMIN_NAV_ITEMS}
      userRole="admin"
      brandName="AI Call Center"
      brandSubtitle="Admin Control Panel"
      showProfileFooter={true}
    />
  );
}
