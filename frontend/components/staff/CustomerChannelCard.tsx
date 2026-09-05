"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Pencil, Phone, MapPin, X } from "lucide-react";
import {
  CaseCustomer,
  getCaseCustomer,
  updateCaseCustomer,
} from "@/services/staffProfileApi";

function initials(text: string | null) {
  if (!text) return "?";
  const digits = text.replace(/\D/g, "");
  return digits.slice(-2) || text.slice(0, 2).toUpperCase();
}

export function CustomerChannelCard({ handoffId }: { handoffId: string }) {
  const [customer, setCustomer] = useState<CaseCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getCaseCustomer(handoffId);
      setCustomer(data);
      setName(data.name ?? "");
      setLocation(data.location ?? "");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
    setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoffId]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateCaseCustomer(handoffId, { name, location });
      await load();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="text-xs text-slate-500">Loading customer...</div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Customer & Channel</h2>
        {editing ? (
          <button
            onClick={() => setEditing(false)}
            className="text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-blue-400 hover:underline"
          >
            <Pencil size={12} />
            Edit
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-full bg-emerald-900 flex items-center justify-center text-sm font-semibold text-emerald-300 shrink-0">
          {initials(customer.phone)}
        </div>
        <div className="min-w-0">
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer name"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-sm text-white mb-1"
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white truncate">
                {customer.name || customer.phone || "Unknown"}
              </span>
              {customer.verified && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full ring-1 ring-emerald-500/20">
                  <CheckCircle2 size={10} />
                  Verified
                </span>
              )}
            </div>
          )}
          <div className="text-xs text-slate-500">
            Customer since{" "}
            {new Date(customer.member_since).toLocaleDateString(undefined, {
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <Phone size={13} className="text-slate-500" />
          {customer.phone || "No phone"}
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <MapPin size={13} className="text-slate-500" />
          {editing ? (
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="No location on file"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
            />
          ) : (
            customer.location || (
              <span className="text-slate-500">No location on file</span>
            )
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Channel</span>
          <span className="text-white capitalize">
            {customer.channel_type || "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Total conversations</span>
          <span className="text-white">{customer.total_conversations}</span>
        </div>
      </div>

      {editing && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 w-full bg-emerald-500 text-white rounded-lg py-2 text-xs font-medium hover:bg-emerald-600 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      )}
    </div>
  );
}
