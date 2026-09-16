// components/admin/UsersManager.tsx
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  Power,
  Trash2,
  X,
} from "lucide-react";

import {
  toggleUserActive,
  deleteUser,
  listUsers,
  UserSummary,
} from "@/services/usersApi";
import { Table, Column } from "@/components/ui/Table";
import { FilterBar, FilterField } from "@/components/ui/FilterBar";
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

type StatusFilter = "all" | "active" | "inactive";
type TimeFilter = "all" | "week" | "month" | "6months";

type UserFilters = {
  status: StatusFilter;
  time: TimeFilter;
  customFrom: string;
  customTo: string;
  showArchived: boolean;
};

type OpenFilter = "status" | "time" | "custom" | null;

export default function UsersManager() {
  const router = useRouter();

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [deletingUser, setDeletingUser] = useState<UserSummary | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<UserFilters>({
    status: "all",
    time: "all",
    customFrom: "",
    customTo: "",
    showArchived: false,
  });

  const [openFilter, setOpenFilter] = useState<OpenFilter>(null);

  const [customDraft, setCustomDraft] = useState({
    from: "",
    to: "",
  });

  const [now, setNow] = useState(() => Date.now());

  async function load(): Promise<void> {
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

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  async function handleToggleActive(user: UserSummary): Promise<void> {
    try {
      setError(null);
      await toggleUserActive(user.id);
      await load();
    } catch {
      setError("Couldn't update user status.");
    }
  }

  async function handleDelete(user: UserSummary): Promise<void> {
    try {
      setError(null);
      await deleteUser(user.id);
      setDeletingUser(null);
      await load();
    } catch {
      setError("Couldn't delete user.");
    }
  }

  function updateFilters(patch: Partial<UserFilters>) {
    setFilters((current) => ({
      ...current,
      ...patch,
    }));

    setPage(1);
  }

  function openCustomFilter() {
    setCustomDraft({
      from: filters.customFrom,
      to: filters.customTo,
    });

    setOpenFilter("custom");
  }

  function applyCustomFilter() {
    updateFilters({
      customFrom: customDraft.from,
      customTo: customDraft.to,
      time: "all",
    });

    setOpenFilter(null);
  }

  function clearCustomFilter() {
    setCustomDraft({
      from: "",
      to: "",
    });

    updateFilters({
      customFrom: "",
      customTo: "",
    });

    setOpenFilter(null);
  }

  function resetFilters() {
    setSearch("");

    setFilters({
      status: "all",
      time: "all",
      customFrom: "",
      customTo: "",
      showArchived: false,
    });

    setCustomDraft({
      from: "",
      to: "",
    });

    setOpenFilter(null);
    setPage(1);
  }

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.time !== "all" ||
    Boolean(filters.customFrom || filters.customTo) ||
    filters.showArchived;

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const userWithMeta = user as UserSummary & {
        is_active?: boolean;
        isActive?: boolean;
        is_archived?: boolean;
        archived?: boolean;
        archived_at?: string | null;
        archivedAt?: string | null;
        created_at?: string | null;
        createdAt?: string | null;
        updated_at?: string | null;
        updatedAt?: string | null;
      };

      const isArchived =
        userWithMeta.is_archived === true ||
        userWithMeta.archived === true ||
        Boolean(userWithMeta.archived_at || userWithMeta.archivedAt);

      if (isArchived && !filters.showArchived) {
        return false;
      }

      if (query) {
        const searchable = [user.phone_number, user.preferred_language]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(query)) {
          return false;
        }
      }

      /*
       * UserSummary in the current API does not expose a confirmed
       * is_active field in the original implementation.
       *
       * Therefore status filtering is only applied when the API
       * actually provides is_active / isActive.
       */
      const activeValue = userWithMeta.is_active ?? userWithMeta.isActive;

      if (
        filters.status === "active" &&
        activeValue !== undefined &&
        activeValue !== true
      ) {
        return false;
      }

      if (
        filters.status === "inactive" &&
        activeValue !== undefined &&
        activeValue !== false
      ) {
        return false;
      }

      const dateValue =
        userWithMeta.updated_at ||
        userWithMeta.updatedAt ||
        user.last_active ||
        userWithMeta.created_at ||
        userWithMeta.createdAt;

      const userDate = dateValue ? new Date(dateValue).getTime() : null;

      if (filters.time !== "all" && userDate) {
        const days =
          filters.time === "week" ? 7 : filters.time === "month" ? 30 : 180;

        const cutoff = now - days * 24 * 60 * 60 * 1000;

        if (userDate < cutoff) {
          return false;
        }
      }

      if ((filters.customFrom || filters.customTo) && userDate) {
        if (filters.customFrom) {
          const from = new Date(`${filters.customFrom}T00:00:00`).getTime();

          if (userDate < from) {
            return false;
          }
        }

        if (filters.customTo) {
          const to = new Date(`${filters.customTo}T23:59:59`).getTime();

          if (userDate > to) {
            return false;
          }
        }
      }

      return true;
    });
  }, [users, search, filters, now]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  const customLabel = getCustomDateLabel(filters.customFrom, filters.customTo);

  const columns: Column<UserSummary>[] = [
    {
      key: "phone_number",
      header: "Phone",
      cell: (user: UserSummary) => (
        <span className="font-mono text-sm text-white">
          {user.phone_number || "—"}
        </span>
      ),
    },
    {
      key: "preferred_language",
      header: "Language",
      cell: (user: UserSummary) => (
        <span className="text-xs uppercase text-slate-300">
          {user.preferred_language || "—"}
        </span>
      ),
    },
    {
      key: "message_count",
      header: "Messages",
      cell: (user: UserSummary) => (
        <span className="text-xs text-slate-300">{user.message_count}</span>
      ),
    },
    {
      key: "last_active",
      header: "Last Active",
      cell: (user: UserSummary) => (
        <span className="text-xs text-slate-300">
          {user.last_active ? new Date(user.last_active).toLocaleString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cell: (user: UserSummary) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer rounded-full text-slate-400 hover:bg-slate-800"
              >
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-44 rounded-xl border-slate-800 bg-slate-900"
            >
              <DropdownMenuLabel className="text-slate-400">
                Actions
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
                onClick={() => router.push(`/admin/users/${user.id}`)}
              >
                <Eye size={14} />
                View Details
              </DropdownMenuItem>

              <DropdownMenuItem
                disabled={user.is_admin}
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => handleToggleActive(user)}
              >
                <Power size={14} />
                {user.is_admin ? "N/A" : "Suspend / Activate"}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-red-400 focus:bg-red-950 focus:text-red-300"
                onClick={() => setDeletingUser(user)}
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

  return (
    <div className="min-h-full bg-[#020f1d] text-white">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-3 sm:p-4 md:p-5 lg:p-6">
        {/* Header + Filters */}
        <div className="relative z-30 overflow-visible rounded-2xl border border-[#12324d] bg-[#031526] shadow-[0_0_40px_rgba(0,90,150,0.08)]">
          <div className="p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Users
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Manage and monitor registered users
                </p>
              </div>
            </div>

            <div className="mt-6">
              <FilterBar
                searchValue={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search users by phone..."
                onReset={resetFilters}
                showReset={hasActiveFilters || Boolean(search)}
                leading={
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#123957] bg-[#061d31] text-slate-400 transition hover:border-[#1b4b6d] hover:bg-[#08253b] hover:text-white"
                  >
                    <ChevronLeft
                      size={18}
                      className="transition-transform group-hover:-translate-x-0.5"
                    />
                  </button>
                }
              >
                {/* Status */}
                <FilterDropdownButton
                  label="Status"
                  value={
                    filters.status === "all"
                      ? "All"
                      : filters.status === "active"
                        ? "Active"
                        : "Inactive"
                  }
                  active={filters.status !== "all"}
                  open={openFilter === "status"}
                  onClick={() =>
                    setOpenFilter(openFilter === "status" ? null : "status")
                  }
                >
                  <FilterOption
                    selected={filters.status === "all"}
                    onClick={() => {
                      updateFilters({
                        status: "all",
                      });
                      setOpenFilter(null);
                    }}
                  >
                    All
                  </FilterOption>

                  <FilterOption
                    selected={filters.status === "active"}
                    onClick={() => {
                      updateFilters({
                        status: "active",
                      });
                      setOpenFilter(null);
                    }}
                  >
                    Active
                  </FilterOption>

                  <FilterOption
                    selected={filters.status === "inactive"}
                    onClick={() => {
                      updateFilters({
                        status: "inactive",
                      });
                      setOpenFilter(null);
                    }}
                  >
                    Inactive
                  </FilterOption>
                </FilterDropdownButton>

                {/* Time */}
                <FilterDropdownButton
                  label="Time"
                  value={
                    filters.time === "all"
                      ? "All"
                      : filters.time === "week"
                        ? "Week"
                        : filters.time === "month"
                          ? "Month"
                          : "6 Months"
                  }
                  active={filters.time !== "all"}
                  open={openFilter === "time"}
                  onClick={() =>
                    setOpenFilter(openFilter === "time" ? null : "time")
                  }
                >
                  <FilterOption
                    selected={filters.time === "all"}
                    onClick={() => {
                      updateFilters({
                        time: "all",
                        customFrom: "",
                        customTo: "",
                      });
                      setOpenFilter(null);
                    }}
                  >
                    All
                  </FilterOption>

                  <FilterOption
                    selected={filters.time === "week"}
                    onClick={() => {
                      updateFilters({
                        time: "week",
                        customFrom: "",
                        customTo: "",
                      });
                      setOpenFilter(null);
                    }}
                  >
                    Week
                  </FilterOption>

                  <FilterOption
                    selected={filters.time === "month"}
                    onClick={() => {
                      updateFilters({
                        time: "month",
                        customFrom: "",
                        customTo: "",
                      });
                      setOpenFilter(null);
                    }}
                  >
                    Month
                  </FilterOption>

                  <FilterOption
                    selected={filters.time === "6months"}
                    onClick={() => {
                      updateFilters({
                        time: "6months",
                        customFrom: "",
                        customTo: "",
                      });
                      setOpenFilter(null);
                    }}
                  >
                    6 Months
                  </FilterOption>
                </FilterDropdownButton>

                {/* Custom Date */}
                <div className="relative flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Custom
                  </span>

                  <button
                    type="button"
                    onClick={openCustomFilter}
                    className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm outline-none transition ${
                      filters.customFrom || filters.customTo
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-[#123957] bg-[#061d31] text-slate-300 hover:border-[#1b4b6d] hover:bg-[#08253b] hover:text-white"
                    }`}
                  >
                    <Calendar size={15} />

                    <span>{customLabel || "Select dates"}</span>

                    {filters.customFrom || filters.customTo ? (
                      <X
                        size={14}
                        className="ml-1 text-slate-500 hover:text-white"
                        onClick={(event) => {
                          event.stopPropagation();
                          clearCustomFilter();
                        }}
                      />
                    ) : null}
                  </button>

                  {openFilter === "custom" && (
                    <div className="absolute left-0 top-12 z-[100] w-72 rounded-xl border border-[#173a55] bg-[#061a2b] p-4 shadow-2xl">
                      <div className="flex flex-col gap-4">
                        <FilterField label="From">
                          <input
                            type="date"
                            value={customDraft.from}
                            onChange={(event) =>
                              setCustomDraft((current) => ({
                                ...current,
                                from: event.target.value,
                              }))
                            }
                            className="h-10 w-full rounded-xl border border-[#123957] bg-[#061d31] px-3 text-sm text-white outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
                          />
                        </FilterField>

                        <FilterField label="To">
                          <input
                            type="date"
                            value={customDraft.to}
                            onChange={(event) =>
                              setCustomDraft((current) => ({
                                ...current,
                                to: event.target.value,
                              }))
                            }
                            className="h-10 w-full rounded-xl border border-[#123957] bg-[#061d31] px-3 text-sm text-white outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
                          />
                        </FilterField>

                        <div className="flex items-center justify-end gap-2 border-t border-[#123957] pt-3">
                          <button
                            type="button"
                            onClick={clearCustomFilter}
                            className="h-9 rounded-lg px-3 text-xs font-medium text-slate-400 transition hover:bg-[#08253b] hover:text-white"
                          >
                            Clear
                          </button>

                          <button
                            type="button"
                            onClick={applyCustomFilter}
                            className="h-9 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white transition hover:bg-emerald-600"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Archived */}
                <label className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-[#123957] bg-[#061d31] px-3 text-sm text-slate-300 transition hover:border-[#1b4b6d] hover:bg-[#08253b]">
                  <input
                    type="checkbox"
                    checked={filters.showArchived}
                    onChange={(event) =>
                      updateFilters({
                        showArchived: event.target.checked,
                      })
                    }
                    className="h-3.5 w-3.5 rounded border-slate-600 bg-[#061d31] text-emerald-500 focus:ring-emerald-500/20"
                  />

                  <span className="whitespace-nowrap">Show archived</span>
                </label>
              </FilterBar>
            </div>
          </div>

          {error && (
            <div className="border-t border-red-500/10 bg-red-500/5 px-5 py-3 text-sm text-red-400 sm:px-6 lg:px-7">
              {error}
            </div>
          )}
        </div>

        {/* Table + Pagination */}
        <div className="relative z-10 overflow-hidden rounded-2xl border border-[#173a55] bg-[#061d31] shadow-[0_0_40px_rgba(0,90,150,0.06)]">
          <Table<UserSummary>
            loading={loading}
            columns={columns}
            data={paginatedUsers}
            keyExtractor={(user: UserSummary) => user.id}
            emptyMessage="No users found."
            className={
              !loading && filteredUsers.length > 0
                ? "rounded-b-none border-b-0"
                : undefined
            }
          />

          {!loading && filteredUsers.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-[#123957] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-300">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>
                –
                <span className="font-semibold text-slate-300">
                  {Math.min(currentPage * PAGE_SIZE, filteredUsers.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-300">
                  {filteredUsers.length}
                </span>{" "}
                users
              </p>

              <div className="flex items-center gap-2">
                {(hasActiveFilters || search) && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mr-2 text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
                  >
                    Clear filters
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 rounded-lg border border-[#123957] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-[#08253b] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>

                <span className="min-w-[90px] text-center text-xs text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-[#123957] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-[#08253b] disabled:cursor-not-allowed disabled:opacity-40"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-2 font-semibold text-white">
                Delete this user?
              </h2>

              <p className="mb-4 text-sm text-slate-400">
                Are you sure you want to permanently delete &ldquo;
                {deletingUser.phone_number}&rdquo;? This action cannot be
                undone.
              </p>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeletingUser(null)}>
                  Cancel
                </Button>

                <Button
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={() => handleDelete(deletingUser)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterDropdownButton({
  label,
  value,
  active,
  open,
  onClick,
  children,
}: {
  label: string;
  value: string;
  active: boolean;
  open: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>

      <button
        type="button"
        onClick={onClick}
        className={`flex h-10 items-center justify-between gap-4 rounded-xl border px-3 text-sm outline-none transition ${
          active
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            : "border-[#123957] bg-[#061d31] text-white hover:border-[#1b4b6d] hover:bg-[#08253b]"
        }`}
      >
        <span>{value}</span>

        <ChevronDown
          size={15}
          className={`text-slate-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-[100] min-w-[170px] rounded-xl border border-[#173a55] bg-[#061a2b] p-1.5 shadow-2xl">
          {children}
        </div>
      )}
    </div>
  );
}

function FilterOption({
  children,
  selected,
  onClick,
}: {
  children: ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
        selected
          ? "bg-emerald-500/10 text-emerald-400"
          : "text-slate-300 hover:bg-[#08253b] hover:text-white"
      }`}
    >
      <span>{children}</span>

      {selected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
    </button>
  );
}

function getCustomDateLabel(from: string, to: string) {
  if (from && to) {
    return `${formatDate(from)} – ${formatDate(to)}`;
  }

  if (from) {
    return `From ${formatDate(from)}`;
  }

  if (to) {
    return `Until ${formatDate(to)}`;
  }

  return "";
}

function formatDate(value: string) {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
