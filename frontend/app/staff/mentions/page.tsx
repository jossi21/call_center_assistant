"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MentionsPage } from "@/components/staff/mentions/MentionsPage";

export default function StaffMentionsPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const hasToken = !!localStorage.getItem("app_access_token");
      setLoggedIn(hasToken);
      setChecked(true);
      if (!hasToken) router.push("/login");
    });
  }, [router]);

  if (!checked || !loggedIn) return null;
  return <MentionsPage />;
}
