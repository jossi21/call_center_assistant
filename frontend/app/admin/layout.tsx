"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { SharedHeader } from "@/components/ui/SharedHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Admin User");

  useEffect(() => {
    queueMicrotask(() => {
      const hasToken = !!localStorage.getItem("app_access_token");
      setLoggedIn(hasToken);
      setChecked(true);
      if (!hasToken) {
        router.push("/login");
        return;
      }
      const storedUser = localStorage.getItem("user_info");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setUserName(user.name || user.phone_number || "Admin User");
        } catch {
          // keep default
        }
      }
    });
  }, [router]);

  if (!checked || !loggedIn) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SharedHeader
          userName={userName}
          userRole="Administrator"
          notificationCount={3}
        />
        <main className="flex-1 overflow-y-auto bg-slate-900">{children}</main>
      </div>
    </div>
  );
}
