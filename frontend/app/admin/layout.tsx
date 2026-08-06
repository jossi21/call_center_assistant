"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checked, setChecked] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    queueMicrotask(() => {
      setLoggedIn(!!localStorage.getItem("admin_access_token"));
      setChecked(true);
    });
  }, []);

  if (!checked) return null;

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <AdminLogin onLogin={() => setLoggedIn(true)} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-100 text-zinc-900">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto bg-mist-500">{children}</main>
    </div>
  );
}
