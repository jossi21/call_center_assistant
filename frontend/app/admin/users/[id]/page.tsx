"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Power,
  Trash2,
  RotateCcw,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  UserDetail,
  getUserDetail,
  toggleUserActive,
  updateMemoryEntry,
  deleteMemoryEntry,
  resetUserMemory,
} from "@/services/usersApi";
import { Button } from "@/components/ui/button";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setUser(await getUserDetail(userId));
    } catch {
      setError("Couldn't load user details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userId) {
      queueMicrotask(() => {
        load();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleToggleActive() {
    await toggleUserActive(userId);
    load();
  }

  function startEdit(memoryId: string, currentValue: string) {
    setEditingMemoryId(memoryId);
    setEditValue(currentValue);
  }

  async function saveEdit(memoryId: string) {
    await updateMemoryEntry(memoryId, editValue);
    setEditingMemoryId(null);
    setEditValue("");
    load();
  }

  async function handleDeleteMemory(memoryId: string) {
    await deleteMemoryEntry(memoryId);
    load();
  }

  async function handleResetMemory() {
    await resetUserMemory(userId);
    load();
  }

  if (loading) {
    return <div className="p-6 text-slate-400 text-sm">Loading user...</div>;
  }

  if (error || !user) {
    return (
      <div className="p-8 text-red-400 text-sm bg-slate-950 m-6 rounded-xl border border-slate-800">
        {error || "User not found."}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6 p-3 sm:p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/admin/users")}
          className="flex items-center gap-2 text-md  bg-green-500 px-2 border rounded-lg"
        >
          <ArrowLeft size={16} />
          Back to Users
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 border-slate-800 bg-blue-500 text-slate-200 hover:bg-blue-600"
            onClick={handleToggleActive}
          >
            <Power size={14} />
            {user.is_active ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-lg font-semibold font-mono">
              {user.phone_number || "Unknown number"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Joined {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-2">
            {user.is_admin && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Admin
              </span>
            )}
            <span
              className={`text-xs px-2.5 py-1 rounded-full border ${
                user.is_active
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              {user.is_active ? "Active" : "Deactivated"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
          <div>
            <p className="text-xs text-slate-500">Language</p>
            <p className="text-sm text-white uppercase mt-1">
              {user.preferred_language}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Messages</p>
            <p className="text-sm text-white mt-1">
              {user.analytics.message_count}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Handoffs</p>
            <p className="text-sm text-white mt-1">
              {user.analytics.handoff_count}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Last Active</p>
            <p className="text-sm text-white mt-1">
              {user.analytics.last_active
                ? new Date(user.analytics.last_active).toLocaleString()
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Conversation History</h2>
        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
          {user.messages.length === 0 && (
            <p className="text-sm text-slate-500">No messages yet.</p>
          )}
          {user.messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-xl px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-emerald-600/20 text-emerald-100 border border-emerald-600/30"
                    : "bg-slate-800 text-slate-200 border border-slate-700"
                }`}
              >
                <p>{m.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-500 uppercase">
                    {m.channel_type}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(m.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Memory */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Memory</h2>
          {user.memory.length > 0 && (
            <button
              onClick={handleResetMemory}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300"
            >
              <RotateCcw size={13} />
              Reset all
            </button>
          )}
        </div>

        {user.memory.length === 0 ? (
          <p className="text-sm text-slate-500">No memory entries stored.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {user.memory.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 mb-1">{m.key}</p>
                  {editingMemoryId === m.id ? (
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  ) : (
                    <p className="text-sm text-white truncate">{m.value}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {editingMemoryId === m.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(m.id)}
                        className="p-1.5 rounded-md text-emerald-400 hover:bg-slate-800"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingMemoryId(null)}
                        className="p-1.5 rounded-md text-slate-400 hover:bg-slate-800"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(m.id, m.value)}
                        className="p-1.5 rounded-md text-slate-400 hover:bg-slate-800"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteMemory(m.id)}
                        className="p-1.5 rounded-md text-red-400 hover:bg-slate-800"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Audit Log</h2>
        {user.audit_log.length === 0 ? (
          <p className="text-sm text-slate-500">No audit entries.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {user.audit_log.map((a, i) => (
              <div
                key={i}
                className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white font-medium">
                    {a.action}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{a.result}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
