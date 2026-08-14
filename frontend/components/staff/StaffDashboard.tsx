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
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    );
  if (error || !profile)
    return (
      <div className="p-8 text-red-400 text-sm bg-slate-950 m-6 rounded-xl border border-slate-800">
        {error || "Profile not found"}
      </div>
    );

  const activeCases = cases.filter((c) => c.status !== "resolved");
  const resolvedCases = cases.filter((c) => c.status === "resolved");

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-slate-400">
                  {profile.specialty} specialist
                </span>
              </div>
            </div>
            <AvailabilityToggle profile={profile} onUpdated={setProfile} />
          </div>
        </div>

        {/* Active Cases */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            {activeCases.length > 0 && (
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full">
                {activeCases.length}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {activeCases.length === 0 ? (
              <p className="text-sm text-white font-semibold text-center py-4">
                No active cases. Great job!
              </p>
            ) : (
              activeCases.map((c) => (
                <CaseCard key={c.id} caseItem={c} onResolved={load} />
              ))
            )}
          </div>
        </div>

        {/* Resolved Cases */}
        {resolvedCases.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-green-400">
                Resolved Cases
              </h2>
              <span className="text-xs bg-orange-400 text-white font-bold px-2.5 py-0.5 rounded-full">
                {resolvedCases.length}
              </span>
            </div>

            <div className="flex flex-col gap-3 opacity-70">
              {resolvedCases.map((c) => (
                <CaseCard key={c.id} caseItem={c} onResolved={load} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
