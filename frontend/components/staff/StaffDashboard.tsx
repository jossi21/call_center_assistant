"use client";

import { useEffect, useState } from "react";
import {
  getMyProfile,
  listMyCases,
  MyProfile,
  MyCase,
} from "@/services/staffProfileApi";
import { AvailabilityToggle } from "./AvailabilityToggle";
import { CaseCard } from "./CaseCard";

export function StaffDashboard() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [cases, setCases] = useState<MyCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [profileData, casesData] = await Promise.all([
        getMyProfile(),
        listMyCases(),
      ]);
      setProfile(profileData);
      setCases(casesData);
    } catch {
      setError(
        "Couldn't load your dashboard. You may not be registered as staff.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, []);

  if (loading)
    return <div className="p-8 text-zinc-500 text-sm">Loading...</div>;
  if (error || !profile)
    return <div className="p-8 text-red-500 text-sm">{error}</div>;

  const activeCases = cases.filter((c) => c.status !== "resolved");
  const resolvedCases = cases.filter((c) => c.status === "resolved");

  return (
    <div className="min-h-screen bg-gray-700">
      <div className="max-w-3xl mx-auto p-8 bg-gray-300 border border-zinc-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">
              {profile.name}
            </h1>
            <span className="text-xs text-zinc-500">
              {profile.specialty} specialist
            </span>
          </div>
          <AvailabilityToggle profile={profile} onUpdated={setProfile} />
        </div>

        <h2 className="text-lg font-medium text-white mb-3 bg-orange-400 inline-block text-md px-4  rounded-full ring-1 ring-indigo-600/20">
          {activeCases.length === 0
            ? "No active cases"
            : `${activeCases.length} active case${activeCases.length > 1 ? "s" : ""}`}
        </h2>

        <div className="flex flex-col gap-3 mb-8">
          {activeCases.map((c) => (
            <CaseCard key={c.id} caseItem={c} onResolved={load} />
          ))}
        </div>

        {resolvedCases.length > 0 && (
          <>
            <div className="">
              <h2 className="text-lg font-medium text-white mb-3 bg-green-700 inline-block text-md px-4  rounded-full ring-1 ring-indigo-600/20">
                Resolved ({resolvedCases.length})
              </h2>
            </div>
            <div className="flex flex-col gap-3 opacity-70">
              {resolvedCases.map((c) => (
                <CaseCard key={c.id} caseItem={c} onResolved={load} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
