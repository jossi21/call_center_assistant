"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StaffSidebar from "@/components/staff/StaffSidebar";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const hasToken = !!localStorage.getItem("app_access_token");
      setLoggedIn(hasToken);
      setChecked(true);
      if (!hasToken) {
        router.push("/login");
      }
    });
  }, [router]);

  if (!checked || !loggedIn) return null;

  return (
    <div className="flex min-h-screen">
      <StaffSidebar />
      <main className="flex-1 overflow-y-auto bg-slate-900">{children}</main>
    </div>
  );
}
