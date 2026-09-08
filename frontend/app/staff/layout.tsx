"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StaffSidebar from "@/components/staff/StaffSidebar";
import { StaffHeader } from "@/components/staff/StaffHeader";
import {
  MyProfile,
  StaffNotification,
  getMyProfile,
  listMyCases,
  getNotifications,
} from "@/services/staffProfileApi";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [casesBadge, setCasesBadge] = useState(0);
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);

  async function loadShellData() {
    try {
      const [profileData, cases, notifs] = await Promise.all([
        getMyProfile(),
        listMyCases(),
        getNotifications(),
      ]);
      setProfile(profileData);
      setCasesBadge(
        cases.filter((c) => c.status === "waiting" || c.status === "assigned")
          .length,
      );
      setNotifications(notifs);
    } catch {
      // best-effort — header/sidebar just show zero counts if this fails
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      const hasToken = !!localStorage.getItem("app_access_token");
      setLoggedIn(hasToken);
      setChecked(true);
      if (!hasToken) {
        router.push("/login");
        return;
      }
      loadShellData();
    });
  }, [router]);

  if (!checked || !loggedIn) return null;

  const mentionsBadge = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex h-screen overflow-hidden">
      <StaffSidebar casesBadge={casesBadge} mentionsBadge={mentionsBadge} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <StaffHeader
          profile={profile}
          onProfileUpdated={setProfile}
          notifications={notifications}
          onNotificationsChanged={loadShellData}
        />
        <main className="flex-1 overflow-hidden bg-slate-900">{children}</main>
      </div>
    </div>
  );
}
