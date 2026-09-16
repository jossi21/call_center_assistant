"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";

import {
  Staff,
  listStaff,
  updateStaff,
  toggleStaffActive,
  createStaff,
  deleteStaff,
} from "@/services/staffsApi";
import { Table, Column } from "@/components/ui/Table";
import {
  FilterBar,
  FilterField,
  FilterSelect,
} from "@/components/ui/FilterBar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StaffFormModal } from "./staff/staffFormModal";
import { DeleteStaffModal } from "./staff/DeleteStaffModal";

type StatusFilter = "all" | "active" | "inactive";
type TimeFilter = "all" | "week" | "month" | "6months";

type StaffFilters = {
  status: StatusFilter;
  time: TimeFilter;
  customFrom: string;
  customTo: string;
  showArchived: boolean;
};

type OpenFilter = "status" | "time" | "custom" | null;

export default function StaffManager() {
  const router = useRouter();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState<StaffFilters>({
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

  const [showCreate, setShowCreate] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);

  const [now, setNow] = useState(() => Date.now());

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      setStaff(await listStaff());
    } catch {
      setError("Couldn't load staff.");
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

  async function handleToggle(member: Staff): Promise<void> {
    try {
      setError(null);
      await toggleStaffActive(member.id, !member.is_available);
      await load();
    } catch {
      setError("Couldn't update staff availability.");
    }
  }

  async function handleDelete(member: Staff): Promise<void> {
    try {
      setError(null);
      await deleteStaff(member.id);
      setDeletingStaff(null);
      await load();
    } catch {
      setError("Couldn't delete staff member.");
    }
  }

  function updateFilters(patch: Partial<StaffFilters>) {
    setFilters((current) => ({
      ...current,
      ...patch,
    }));
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
  }

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.time !== "all" ||
    Boolean(filters.customFrom || filters.customTo) ||
    filters.showArchived;

  const filteredStaff = useMemo(() => {
    const currentTime = now;

    return staff.filter((member) => {
      const staffWithMeta = member as Staff & {
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
        staffWithMeta.is_archived === true ||
        staffWithMeta.archived === true ||
        Boolean(staffWithMeta.archived_at || staffWithMeta.archivedAt);

      if (isArchived && !filters.showArchived) {
        return false;
      }

      const query = search.trim().toLowerCase();

      if (query) {
        const searchable = [
          member.name,
          member.email,
          member.phone_number,
          member.specialty,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(query)) {
          return false;
        }
      }

      if (filters.status === "active" && !member.is_available) {
        return false;
      }

      if (filters.status === "inactive" && member.is_available) {
        return false;
      }

      const dateValue =
        staffWithMeta.updated_at ||
        staffWithMeta.updatedAt ||
        staffWithMeta.created_at ||
        staffWithMeta.createdAt;

      const staffDate = dateValue ? new Date(dateValue).getTime() : null;

      if (filters.time !== "all" && staffDate) {
        const days =
          filters.time === "week" ? 7 : filters.time === "month" ? 30 : 180;

        const cutoff = currentTime - days * 24 * 60 * 60 * 1000;

        if (staffDate < cutoff) {
          return false;
        }
      }

      if ((filters.customFrom || filters.customTo) && staffDate) {
        if (filters.customFrom) {
          const from = new Date(`${filters.customFrom}T00:00:00`).getTime();

          if (staffDate < from) {
            return false;
          }
        }

        if (filters.customTo) {
          const to = new Date(`${filters.customTo}T23:59:59`).getTime();

          if (staffDate > to) {
            return false;
          }
        }
      }

      return true;
    });
  }, [staff, search, filters, now]);

  const customLabel = getCustomDateLabel(filters.customFrom, filters.customTo);

  const columns: Column<Staff>[] = [
    {
      key: "name",
      header: "Name",
      cell: (member: Staff) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-bold uppercase text-emerald-400">
            {member.name.charAt(0)}
          </div>

          <span className="text-sm font-semibold text-white">
            {member.name}
          </span>
        </div>
      ),
    },
    {
      key: "phone_number",
      header: "Phone",
      cell: (member: Staff) => (
        <span className="font-mono text-xs text-slate-400">
          {member.phone_number || "—"}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (member: Staff) => (
        <span className="text-xs text-slate-400">{member.email}</span>
      ),
    },
    {
      key: "specialty",
      header: "Specialty",
      cell: (member: Staff) => (
        <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/20">
          {member.specialty}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (member: Staff) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            member.is_available
              ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
              : "bg-slate-800 text-slate-400 ring-1 ring-slate-700"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              member.is_available ? "bg-emerald-500" : "bg-slate-500"
            }`}
          />

          {member.is_available ? "Available" : "Unavailable"}
        </span>
      ),
    },
    {
      key: "case_status",
      header: "Case Status",
      cell: (member: Staff) =>
        member.active_case_count > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            On Case ({member.active_case_count})
          </span>
        ) : (
          <span className="text-xs text-slate-500">Free</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cell: (member: Staff) => (
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
                onClick={() => router.push(`/admin/staffs/${member.id}`)}
              >
                <Eye size={14} />
                View Details
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
                onClick={() => setEditingStaff(member)}
              >
                <Pencil size={14} />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
                onClick={() => handleToggle(member)}
              >
                <Power size={14} />

                {member.is_available ? "Mark Unavailable" : "Mark Available"}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-red-400 focus:bg-red-950 focus:text-red-300"
                onClick={() => setDeletingStaff(member)}
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
                  Staff
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Manage and configure staff members
                </p>
              </div>

              <Button
                onClick={() => setShowCreate(true)}
                className="h-10 w-fit cursor-pointer gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white hover:bg-emerald-600"
              >
                <Plus size={15} />
                New Staff Member
              </Button>
            </div>

            <div className="mt-6">
              <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search staff..."
                onReset={() => {
                  setSearch("");
                  resetFilters();
                }}
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
                        ? "Available"
                        : "Unavailable"
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
                      updateFilters({ status: "all" });
                      setOpenFilter(null);
                    }}
                  >
                    All
                  </FilterOption>

                  <FilterOption
                    selected={filters.status === "active"}
                    onClick={() => {
                      updateFilters({ status: "active" });
                      setOpenFilter(null);
                    }}
                  >
                    Available
                  </FilterOption>

                  <FilterOption
                    selected={filters.status === "inactive"}
                    onClick={() => {
                      updateFilters({ status: "inactive" });
                      setOpenFilter(null);
                    }}
                  >
                    Unavailable
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

        {/* Table */}
        <div className="relative z-10 overflow-hidden rounded-2xl border border-[#173a55] bg-[#061d31] shadow-[0_0_40px_rgba(0,90,150,0.06)]">
          <Table<Staff>
            loading={loading}
            columns={columns}
            data={filteredStaff}
            keyExtractor={(member: Staff) => member.id}
            emptyMessage="No staff members found."
          />

          {!loading && staff.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-[#123957] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-300">
                  {filteredStaff.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-300">
                  {staff.length}
                </span>{" "}
                staff members
              </p>

              {(hasActiveFilters || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    resetFilters();
                  }}
                  className="text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Edit */}
        {editingStaff && (
          <StaffFormModal
            initial={editingStaff}
            title={`Edit ${editingStaff.email}`}
            onClose={() => setEditingStaff(null)}
            onSubmit={async (data) => {
              await updateStaff(editingStaff.id, {
                name: data.name,
                email: data.email,
                specialty: data.specialty,
              });

              setEditingStaff(null);
              await load();
            }}
          />
        )}

        {/* Create */}
        {showCreate && (
          <StaffFormModal
            title="New Staff Member"
            onClose={() => setShowCreate(false)}
            onSubmit={async (data) => {
              await createStaff({
                phone_number: data.phone_number!,
                name: data.name,
                email: data.email,
                specialty: data.specialty,
              });

              setShowCreate(false);
              await load();
            }}
          />
        )}

        {/* Delete */}
        {deletingStaff && (
          <DeleteStaffModal
            staff={deletingStaff}
            onClose={() => setDeletingStaff(null)}
            onConfirm={() => handleDelete(deletingStaff)}
          />
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
