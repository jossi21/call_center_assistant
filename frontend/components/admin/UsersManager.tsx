// components/admin/UsersManager.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  MoreVertical,
  Power,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
} from "lucide-react";
import { toggleUserActive, deleteUser } from "@/services/usersApi";
import { UserSummary, listUsers } from "@/services/usersApi";
import { Table, Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PAGE_SIZE = 7;

type RecencyFilter = "all" | "today" | "week" | "month" | "inactive";

const RECENCY_OPTIONS: { value: RecencyFilter; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Active today" },
  { value: "week", label: "Active this week" },
  { value: "month", label: "Active this month" },
  { value: "inactive", label: "No activity yet" },
];

function matchesRecency(user: UserSummary, filter: RecencyFilter): boolean {
  if (filter === "all") return true;
  if (filter === "inactive") return !user.last_active;
  if (!user.last_active) return false;

  const last = new Date(user.last_active).getTime();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  if (filter === "today") return now - last <= dayMs;
  if (filter === "week") return now - last <= dayMs * 7;
  if (filter === "month") return now - last <= dayMs * 30;
  return true;
}

export default function UsersManager() {
  const router = useRouter();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [deletingUser, setDeletingUser] = useState<UserSummary | null>(null);
  const [search, setSearch] = useState("");
  const [recency, setRecency] = useState<RecencyFilter>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listUsers());
    } catch {
      setError("Couldn't load users.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(u: UserSummary) {
    await toggleUserActive(u.id);
    load();
  }

  async function handleDelete(u: UserSummary) {
    await deleteUser(u.id);
    setDeletingUser(null);
    load();
  }

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, []);

  const filtered = users
    .filter((u) =>
      (u.phone_number || "").toLowerCase().includes(search.toLowerCase()),
    )
    .filter((u) => matchesRecency(u, recency));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleRecencyChange(value: RecencyFilter) {
    setRecency(value);
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setRecency("all");
    setPage(1);
  }

  const hasActiveFilters = search !== "" || recency !== "all";

  const columns: Column<UserSummary>[] = [
    {
      key: "phone_number",
      header: "Phone",
      cell: (u: UserSummary) => (
        <span className="text-sm text-white font-mono">
          {u.phone_number || "—"}
        </span>
      ),
    },
    {
      key: "preferred_language",
      header: "Language",
      cell: (u: UserSummary) => (
        <span className="text-xs text-slate-300 uppercase">
          {u.preferred_language}
        </span>
      ),
    },
    {
      key: "message_count",
      header: "Messages",
      cell: (u: UserSummary) => (
        <span className="text-xs text-slate-300">{u.message_count}</span>
      ),
    },
    {
      key: "last_active",
      header: "Last Active",
      cell: (u: UserSummary) => (
        <span className="text-xs text-slate-300">
          {u.last_active ? new Date(u.last_active).toLocaleString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cell: (u: UserSummary) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-slate-800 text-slate-400"
              >
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 rounded-xl bg-slate-900 border-slate-800"
            >
              <DropdownMenuLabel className="text-slate-400">
                Actions
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
                onClick={() => router.push(`/admin/users/${u.id}`)}
              >
                <Eye size={14} />
                View Details
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
                onClick={() => handleToggleActive(u)}
              >
                <Power size={14} />
                {u.is_admin ? "N/A" : "Suspend / Activate"}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-red-400 focus:bg-red-950 focus:text-red-300"
                onClick={() => setDeletingUser(u)}
              >
                <Trash2 size={14} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  if (error)
    return (
      <div className="p-8 text-red-400 text-sm bg-slate-950 m-6 rounded-xl border border-slate-800">
        {error}
      </div>
    );

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-3 p-3 sm:p-4 md:p-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            placeholder="Search by phone number..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={recency}
          onChange={(e) => handleRecencyChange(e.target.value as RecencyFilter)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {RECENCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex flex-col">
        <Table<UserSummary>
          title="Users"
          description={
            loading ? "Loading users..." : `Managing ${filtered.length} users.`
          }
          loading={loading}
          columns={columns}
          data={paginated}
          keyExtractor={(u: UserSummary) => u.id}
          emptyMessage="No users found."
          className={
            !loading && filtered.length > 0
              ? "rounded-b-none border-b-0"
              : undefined
          }
        />

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-b-[28px] px-6 py-4">
            <span className="text-xs text-slate-400">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 text-xs text-slate-300 border border-slate-800 rounded-lg px-3 py-1.5 disabled:opacity-40 hover:bg-slate-800"
              >
                <ChevronLeft size={14} />
                Prev
              </button>
              <span className="text-xs text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 text-xs text-slate-300 border border-slate-800 rounded-lg px-3 py-1.5 disabled:opacity-40 hover:bg-slate-800"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-white font-semibold mb-2">Delete this user?</h2>
            <p className="text-slate-400 text-sm mb-4">
              Are you sure you want to permanently delete &ldquo;
              {deletingUser.phone_number}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="text-sm text-slate-400 px-4 py-2 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingUser)}
                className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
