"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    queueMicrotask(() => {
      router.replace("/admin/agents");
    });
  }, [router]);

  return null;
}
