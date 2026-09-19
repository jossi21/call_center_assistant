"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Pencil,
  Trash2,
  Power,
  Plus,
  X,
  MoreVertical,
  Eye,
  ChevronDown,
  ChevronLeft,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Tool,
  listTools,
  updateTool,
  createTool,
  deleteTool,
} from "@/services/toolsApi";
import { listAgents, createAgent, Agent } from "@/services/agentsApi";
import { Table, Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/button";
import { FilterBar, FilterField } from "@/components/ui/FilterBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const RISK_COLORS: Record<string, string> = {
  safe: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  reversible: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  destructive: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",
};

type StatusFilter = "all" | "active" | "inactive";
type TimeFilter = "all" | "week" | "month" | "6months";

type ToolFilters = {
  status: StatusFilter;
  time: TimeFilter;
  customFrom: string;
  customTo: string;
  showArchived: boolean;
};

type OpenFilter = "status" | "time" | "custom" | null;

type ToolWithMeta = Tool & {
  is_archived?: boolean;
  archived?: boolean;
  archived_at?: string | null;
  archivedAt?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
};

export default function ToolsManager() {
  const router = useRouter();

  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingTool, setDeletingTool] = useState<Tool | null>(null);

  const [now, setNow] = useState(() => Date.now());

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    time: "all",
    risk: "all",
    customFrom: "",
    customTo: "",
    showArchived: false,
  });

  const [openFilter, setOpenFilter] = useState<OpenFilter>(null);

  const [customDraft, setCustomDraft] = useState({
    from: "",
    to: "",
  });

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const data = await listTools();
      setTools(data);
    } catch {
      setError("Couldn't load tools.");
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

  function updateFilters(patch: Partial<ToolFilters>) {
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
    setFilters((current) => ({
      ...current,
      time: "all",
      customFrom: customDraft.from,
      customTo: customDraft.to,
    }));

    setOpenFilter(null);
  }

  function clearCustomFilter() {
    setCustomDraft({
      from: "",
      to: "",
    });

    setFilters((current) => ({
      ...current,
      time: "all",
      customFrom: "",
      customTo: "",
    }));

    setOpenFilter(null);
  }

  function resetFilters() {
    setSearch("");

    setFilters({
      status: "all",
      time: "all",
      risk: "all",
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
    search.trim() !== "" ||
    filters.status !== "all" ||
    filters.time !== "all" ||
    filters.customFrom !== "" ||
    filters.customTo !== "" ||
    filters.showArchived;

  function getToolDate(tool: ToolWithMeta): Date | null {
    const dateValue =
      tool.updated_at || tool.updatedAt || tool.created_at || tool.createdAt;

    if (!dateValue) return null;

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return null;

    return date;
  }

  function isArchived(tool: ToolWithMeta): boolean {
    return Boolean(tool.is_archived ?? tool.archived);
  }

  const filteredTools = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tools.filter((rawTool) => {
      const tool = rawTool as ToolWithMeta;

      const matchesSearch =
        !query ||
        [
          tool.name,
          tool.description,
          tool.agent_name,
          tool.risk_tier,
          tool.action_type,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      if (!matchesSearch) return false;

      const archived = isArchived(tool);

      if (!filters.showArchived && archived) {
        return false;
      }

      if (
        filters.showArchived &&
        !archived &&
        (filters.status !== "all" ||
          filters.time !== "all" ||
          filters.risk !== "all" ||
          filters.customFrom ||
          filters.customTo)
      ) {
        // Keep normal filtering active even when archived tools are shown.
      }

      // Status filter
      if (filters.status === "active" && !tool.is_active) {
        return false;
      }

      if (filters.status === "inactive" && tool.is_active) {
        return false;
      }

      // Risk filter
      if (
        filters.risk !== "all" &&
        String(tool.risk_tier || "").toLowerCase() !== filters.risk
      ) {
        return false;
      }

      // Time filter
      const toolDate = getToolDate(tool);

      if (filters.time !== "all") {
        if (!toolDate) return false;

        const diff = now - toolDate.getTime();
        const day = 24 * 60 * 60 * 1000;

        if (filters.time === "week" && diff > 7 * day) {
          return false;
        }

        if (filters.time === "month" && diff > 30 * day) {
          return false;
        }

        if (filters.time === "6months" && diff > 180 * day) {
          return false;
        }

        if (diff < 0) {
          return false;
        }
      }

      // Custom date filter
      if (filters.customFrom || filters.customTo) {
        if (!toolDate) return false;

        const toolTime = toolDate.getTime();

        if (filters.customFrom) {
          const from = new Date(`${filters.customFrom}T00:00:00`).getTime();

          if (toolTime < from) {
            return false;
          }
        }

        if (filters.customTo) {
          const to = new Date(`${filters.customTo}T23:59:59.999`).getTime();

          if (toolTime > to) {
            return false;
          }
        }
      }

      return true;
    });
  }, [tools, search, filters, now]);

  async function handleToggleActive(tool: Tool): Promise<void> {
    try {
      await updateTool(tool.id, {
        is_active: !tool.is_active,
      });

      await load();
    } catch {
      setError("Couldn't update tool status.");
    }
  }

  async function handleDelete(tool: Tool): Promise<void> {
    try {
      await deleteTool(tool.id);
      setDeletingTool(null);
      await load();
    } catch {
      setError("Couldn't delete tool.");
    }
  }

  const columns: Column<Tool>[] = [
    {
      key: "name",
      header: "Tool",
      cell: (tool: Tool) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-bold uppercase text-emerald-400">
            {tool.name.charAt(0)}
          </div>

          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">{tool.name}</div>

            <div className="max-w-xs truncate text-xs text-slate-400">
              {tool.description}
            </div>
          </div>
        </div>
      ),
    },

    {
      key: "agent",
      header: "Agent",
      cell: (tool: Tool) => (
        <span className="text-xs text-slate-400">
          {tool.agent_name || "All agents"}
        </span>
      ),
    },

    {
      key: "risk",
      header: "Risk",
      cell: (tool: Tool) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            RISK_COLORS[tool.risk_tier] ||
            "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20"
          }`}
        >
          {tool.risk_tier}
        </span>
      ),
    },

    {
      key: "status",
      header: "Status",
      cell: (tool: Tool) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            tool.is_active
              ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
              : "bg-slate-800 text-slate-400 ring-1 ring-slate-700"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              tool.is_active ? "bg-emerald-500" : "bg-slate-500"
            }`}
          />

          {tool.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },

    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cell: (tool: Tool) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-slate-400 hover:bg-slate-800"
                >
                  <MoreVertical size={16} />
                </Button>
              }
            />

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
                onClick={() => router.push(`/admin/tools/${tool.id}`)}
              >
                <Eye size={14} />
                View
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
                onClick={() => setEditingTool(tool)}
              >
                <Pencil size={14} />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
                onClick={() => handleToggleActive(tool)}
              >
                <Power size={14} />
                {tool.is_active ? "Suspend" : "Activate"}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-red-400 focus:bg-red-950 focus:text-red-300"
                onClick={() => setDeletingTool(tool)}
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
    <div className="mx-auto flex max-w-[1600px] flex-col gap-3 p-3 sm:p-4 md:p-5">
      {/* Header */}
      <div className="relative z-30 overflow-visible rounded-2xl border border-[#12324d] bg-[#031526] shadow-[0_0_40px_rgba(0,90,150,0.08)]">
        <div className="p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Tools
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Manage and configure your AI tools
              </p>
            </div>

            <Button
              onClick={() => setShowCreate(true)}
              className="h-10 gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-600"
            >
              <Plus size={15} />
              New Tool
            </Button>
          </div>

          <div className="mt-6">
            <FilterBar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search tools..."
              showReset={hasActiveFilters}
              onReset={resetFilters}
              leading={
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#123957] bg-[#061d31] text-slate-400 transition hover:border-[#1b4b6d] hover:bg-[#08253b] hover:text-white"
                >
                  <ChevronLeft size={18} />
                </button>
              }
            >
              {/* Status */}
              <FilterField label="Status">
                <FilterDropdownButton
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
                    active={filters.status === "all"}
                    onClick={() => {
                      updateFilters({ status: "all" });
                      setOpenFilter(null);
                    }}
                  >
                    All
                  </FilterOption>

                  <FilterOption
                    active={filters.status === "active"}
                    onClick={() => {
                      updateFilters({ status: "active" });
                      setOpenFilter(null);
                    }}
                  >
                    Active
                  </FilterOption>

                  <FilterOption
                    active={filters.status === "inactive"}
                    onClick={() => {
                      updateFilters({ status: "inactive" });
                      setOpenFilter(null);
                    }}
                  >
                    Inactive
                  </FilterOption>
                </FilterDropdownButton>
              </FilterField>

              {/* Risk filter */}
              <FilterField label="Risk">
                <select
                  value={filters.risk}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      risk: e.target.value,
                    }))
                  }
                  className="h-10 rounded-xl border border-[#123957] bg-[#061d31] px-3 text-sm text-white outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
                >
                  <option value="all">All</option>
                  <option value="safe">Safe</option>
                  <option value="reversible">Reversible</option>
                  <option value="destructive">Destructive</option>
                </select>
              </FilterField>

              {/* Time */}
              <FilterField label="Time">
                <FilterDropdownButton
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
                    active={filters.time === "all"}
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
                    active={filters.time === "week"}
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
                    active={filters.time === "month"}
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
                    active={filters.time === "6months"}
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
              </FilterField>

              {/* Custom date */}
              <FilterField label="Custom">
                <div className="relative">
                  <button
                    type="button"
                    onClick={openCustomFilter}
                    className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm transition ${
                      filters.customFrom || filters.customTo
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-[#123957] bg-[#061d31] text-slate-300 hover:border-[#1b4b6d] hover:bg-[#08253b] hover:text-white"
                    }`}
                  >
                    <Calendar size={14} />
                    <span>
                      {filters.customFrom || filters.customTo
                        ? getCustomDateLabel(
                            filters.customFrom,
                            filters.customTo,
                          )
                        : "Custom"}
                    </span>
                  </button>

                  {openFilter === "custom" && (
                    <div className="absolute right-0 top-12 z-100 w-72.5 rounded-xl border border-[#173a55] bg-[#061a2b] p-4 shadow-2xl">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            From
                          </span>

                          <input
                            type="date"
                            value={customDraft.from}
                            onChange={(e) =>
                              setCustomDraft((current) => ({
                                ...current,
                                from: e.target.value,
                              }))
                            }
                            className="h-10 w-full rounded-xl border border-[#123957] bg-[#061d31] px-3 text-sm text-white outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            To
                          </span>

                          <input
                            type="date"
                            value={customDraft.to}
                            onChange={(e) =>
                              setCustomDraft((current) => ({
                                ...current,
                                to: e.target.value,
                              }))
                            }
                            className="h-10 w-full rounded-xl border border-[#123957] bg-[#061d31] px-3 text-sm text-white outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={clearCustomFilter}
                            className="h-9 rounded-lg px-3 text-xs font-medium text-slate-400 transition hover:text-white"
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
              </FilterField>

              {/* Archive */}
              <FilterField label="Archive">
                <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#123957] bg-[#061d31] px-3 text-sm text-slate-300 transition hover:border-[#1b4b6d] hover:bg-[#08253b]">
                  <input
                    type="checkbox"
                    checked={filters.showArchived}
                    onChange={(e) =>
                      updateFilters({
                        showArchived: e.target.checked,
                      })
                    }
                    className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20"
                  />

                  <span>Show archived</span>
                </label>
              </FilterField>
            </FilterBar>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="relative z-10 overflow-hidden rounded-2xl border border-[#173a55] bg-[#061d31] shadow-[0_0_40px_rgba(0,90,150,0.06)]">
        <Table<Tool>
          loading={loading}
          columns={columns}
          data={filteredTools}
          keyExtractor={(tool: Tool) => tool.id}
          emptyMessage={
            search || hasActiveFilters
              ? "No tools match the selected filters."
              : "No tools found. Create your first tool to get started."
          }
        />

        {!loading && (
          <div className="flex flex-col gap-3 border-t border-[#173a55] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-300">
                {filteredTools.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-300">{tools.length}</span>{" "}
              tools
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit */}
      {editingTool && (
        <ToolFormModal
          initial={editingTool}
          title={`Edit ${editingTool.name}`}
          onClose={() => setEditingTool(null)}
          onSubmit={async (data) => {
            await updateTool(editingTool.id, data);
            setEditingTool(null);
            await load();
          }}
        />
      )}

      {/* Create */}
      {showCreate && (
        <ToolFormModal
          title="New Tool"
          onClose={() => setShowCreate(false)}
          onSubmit={async (data) => {
            await createTool(data as Omit<Tool, "id" | "is_active">);

            setShowCreate(false);
            await load();
          }}
        />
      )}

      {/* Delete */}
      {deletingTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#173a55] bg-[#061d31] p-6 shadow-2xl">
            <h2 className="mb-2 text-base font-semibold text-white">
              Delete this tool?
            </h2>

            <p className="mb-5 text-sm leading-6 text-slate-400">
              Are you sure you want to permanently delete &ldquo;
              {deletingTool.name}&rdquo;? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingTool(null)}
                className="h-9 rounded-lg px-4 text-sm text-slate-400 transition hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleDelete(deletingTool)}
                className="h-9 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700"
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

/* ---------- Filter helpers ---------- */

function FilterDropdownButton({
  value,
  active,
  open,
  onClick,
  children,
}: {
  value: string;
  active: boolean;
  open: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm outline-none transition ${
          active
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
            : "border-[#123957] bg-[#061d31] text-white hover:border-[#1b4b6d] hover:bg-[#08253b]"
        }`}
      >
        <span>{value}</span>

        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-100 min-w-42.5 rounded-xl border border-[#173a55] bg-[#061a2b] p-1.5 shadow-2xl">
          {children}
        </div>
      )}
    </div>
  );
}

function FilterOption({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition ${
        active
          ? "bg-emerald-500/10 text-emerald-400"
          : "text-slate-300 hover:bg-[#08253b] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function getCustomDateLabel(from: string, to: string) {
  if (from && to) {
    return `${formatDateShort(from)} – ${formatDateShort(to)}`;
  }

  if (from) {
    return `From ${formatDateShort(from)}`;
  }

  if (to) {
    return `Until ${formatDateShort(to)}`;
  }

  return "Custom";
}

function formatDateShort(value: string) {
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

// ---------- Shared types for the parameter + config builders ----------

interface ParamRow {
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
}

interface JsonSchemaProperty {
  type?: string;
  description?: string;
}

interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

interface ActionConfig {
  method?: string;
  url?: string;
  field?: string;
  memory_key?: string;
}

function schemaToRows(schema: JsonSchema | undefined): ParamRow[] {
  if (!schema?.properties) return [];

  const required: string[] = schema.required || [];

  return Object.entries(schema.properties).map(([name, def]) => ({
    name,
    type: (def.type as ParamRow["type"]) || "string",
    description: def.description || "",
    required: required.includes(name),
  }));
}

function rowsToSchema(rows: ParamRow[]): JsonSchema {
  const properties: Record<string, JsonSchemaProperty> = {};
  const required: string[] = [];

  for (const row of rows) {
    if (!row.name) continue;

    properties[row.name] = {
      type: row.type,
      description: row.description,
    };

    if (row.required) {
      required.push(row.name);
    }
  }

  return {
    type: "object",
    properties,
    required,
  };
}

function configToFields(
  actionType: string,
  config: ActionConfig | undefined,
): ActionConfig {
  config = config || {};

  if (actionType === "call_webhook") {
    return {
      method: config.method || "POST",
      url: config.url || "",
    };
  }

  if (actionType === "open_url") {
    return { url: config.url || "" };
  }

  if (actionType === "update_user_field") {
    return {
      field: config.field || "",
    };
  }

  if (actionType === "write_user_memory") {
    return {
      memory_key: config.memory_key || "",
    };
  }

  return {};
}

// ---------- Main form modal ----------

function ToolFormModal({
  initial,
  title,
  onClose,
  onSubmit,
}: {
  initial?: Tool;
  title: string;
  onClose: () => void;
  onSubmit: (data: Partial<Tool>) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");

  const [riskTier, setRiskTier] = useState<Tool["risk_tier"]>(
    initial?.risk_tier || "safe",
  );

  const [actionType, setActionType] = useState<Tool["action_type"]>(
    initial?.action_type || "call_webhook",
  );

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentName, setAgentName] = useState(initial?.agent_name || "");

  const [showCreateAgent, setShowCreateAgent] = useState(false);

  const [params, setParams] = useState<ParamRow[]>(
    initial ? schemaToRows(initial.parameters_schema as JsonSchema) : [],
  );

  const [webhookMethod, setWebhookMethod] = useState("POST");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [openUrl, setOpenUrl] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [memoryKey, setMemoryKey] = useState("");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      try {
        const list = await listAgents();
        setAgents(list.filter((a) => a.is_active));
      } catch {
        setAgents([]);
      }
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      const fields = configToFields(
        actionType,
        initial?.action_config as ActionConfig,
      );

      setWebhookMethod(fields.method || "POST");
      setWebhookUrl(fields.url || "");
      setOpenUrl(fields.url || "");
      setFieldName(fields.field || "");
      setMemoryKey(fields.memory_key || "");
    });
  }, [actionType, initial]);

  function addParam() {
    setParams([
      ...params,
      {
        name: "",
        type: "string",
        description: "",
        required: false,
      },
    ]);
  }

  function updateParam(index: number, patch: Partial<ParamRow>) {
    setParams(params.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function removeParam(index: number) {
    setParams(params.filter((_, i) => i !== index));
  }

  async function handleAgentCreated(agent: Agent) {
    setAgents((prev) => [...prev, agent]);
    setAgentName(agent.name);
    setShowCreateAgent(false);
  }

  async function handleSave() {
    setError("");

    if (!name.trim()) {
      setError("Tool name is required.");
      return;
    }

    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    if (!agentName.trim()) {
      setError("Please select an agent.");
      return;
    }

    if (params.some((p) => !p.name.trim())) {
      setError("Every parameter must have a name.");
      return;
    }

    let actionConfig: ActionConfig = {};

    if (actionType === "call_webhook") {
      actionConfig = {
        method: webhookMethod,
        url: webhookUrl,
      };
    }

    if (actionType === "open_url") {
      actionConfig = { url: openUrl };
    }

    if (actionType === "update_user_field") {
      actionConfig = {
        field: fieldName,
      };
    }

    if (actionType === "write_user_memory") {
      actionConfig = {
        memory_key: memoryKey,
      };
    }

    setSaving(true);

    try {
      await onSubmit({
        name,
        description,
        risk_tier: riskTier,
        action_type: actionType,
        agent_name: agentName || null,
        parameters_schema: rowsToSchema(params) as Record<string, unknown>,
        action_config: actionConfig as Record<string, unknown>,
      });

      setError("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title={title} maxWidth="max-w-2xl">
      <div className="flex flex-col gap-4">
        {error && <div className="text-sm text-red-400">{error}</div>}

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Name (slug)
          </label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!!initial}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Description (tells the AI when to use this)
          </label>

          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Agent (which agent uses this tool)
          </label>

          <select
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All agents</option>

            {agents.map((a) => (
              <option key={a.id} value={a.name}>
                {a.display_name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowCreateAgent(true)}
            className="mt-1 text-xs text-emerald-400 hover:underline"
          >
            Can&apos;t find your agent? + Create one
          </button>
        </div>

        {showCreateAgent && (
          <InlineAgentCreate
            onCancel={() => setShowCreateAgent(false)}
            onCreated={handleAgentCreated}
          />
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Risk Tier
          </label>

          <select
            value={riskTier}
            onChange={(e) => setRiskTier(e.target.value as Tool["risk_tier"])}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="safe">
              Safe — runs immediately, no confirmation
            </option>

            <option value="reversible">
              Reversible — asks the user to confirm first
            </option>

            <option value="destructive">
              Destructive — asks the user to confirm first
            </option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            What information does this tool need?
          </label>

          <div className="flex flex-col gap-2">
            {params.map((param, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 p-2"
              >
                <input
                  placeholder="Name"
                  value={param.name}
                  onChange={(e) =>
                    updateParam(i, {
                      name: e.target.value,
                    })
                  }
                  className="flex-1 rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <select
                  value={param.type}
                  onChange={(e) =>
                    updateParam(i, {
                      type: e.target.value as ParamRow["type"],
                    })
                  }
                  className="rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="string">Text</option>
                  <option value="number">Number</option>
                  <option value="boolean">Yes/No</option>
                </select>

                <input
                  placeholder="Description"
                  value={param.description}
                  onChange={(e) =>
                    updateParam(i, {
                      description: e.target.value,
                    })
                  }
                  className="flex-2 rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <label className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={param.required}
                    onChange={(e) =>
                      updateParam(i, {
                        required: e.target.checked,
                      })
                    }
                  />
                  Required
                </label>

                <button
                  type="button"
                  onClick={() => removeParam(i)}
                  className="text-slate-500 hover:text-red-400"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addParam}
              className="flex w-fit items-center gap-1 text-xs text-emerald-400 hover:underline"
            >
              <Plus size={12} />
              Add a piece of information
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            What should this tool actually do?
          </label>

          <select
            value={actionType}
            onChange={(e) =>
              setActionType(e.target.value as Tool["action_type"])
            }
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="call_webhook">Call a real API / website</option>
            <option value="open_url">
              Open a website in the user&apos;s browser
            </option>

            <option value="update_user_field">
              Update a user&apos;s account field
            </option>

            <option value="write_user_memory">
              Save a note about the user
            </option>
          </select>
        </div>

        {actionType === "call_webhook" && (
          <div className="flex gap-2">
            <select
              value={webhookMethod}
              onChange={(e) => setWebhookMethod(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>

            <input
              placeholder="https://example.com/api/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        {actionType === "open_url" && (
          <input
            placeholder="https://www.youtube.com"
            value={openUrl}
            onChange={(e) => setOpenUrl(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        )}

        {actionType === "update_user_field" && (
          <input
            placeholder="Field name (e.g. preferred_language)"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        )}

        {actionType === "write_user_memory" && (
          <input
            placeholder="Memory key (e.g. favorite_package)"
            value={memoryKey}
            onChange={(e) => setMemoryKey(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 transition hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm text-white transition hover:bg-emerald-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ---------- Inline agent creation ----------

function InlineAgentCreate({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (agent: Agent) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    display_name: "",
    description: "",
    system_prompt: "",
  });

  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    setSaving(true);

    try {
      const agent = await createAgent(form);
      onCreated(agent);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
      <span className="text-xs font-medium text-slate-300">New agent</span>

      <input
        placeholder="name (slug, e.g. billing)"
        value={form.name}
        onChange={(e) =>
          setForm({
            ...form,
            name: e.target.value,
          })
        }
        className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      <input
        placeholder="Display name (e.g. Billing)"
        value={form.display_name}
        onChange={(e) =>
          setForm({
            ...form,
            display_name: e.target.value,
          })
        }
        className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      <input
        placeholder="Description (when the router should use this agent)"
        value={form.description}
        onChange={(e) =>
          setForm({
            ...form,
            description: e.target.value,
          })
        }
        className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      <textarea
        placeholder="System prompt"
        value={form.system_prompt}
        onChange={(e) =>
          setForm({
            ...form,
            system_prompt: e.target.value,
          })
        }
        rows={3}
        className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1.5 font-mono text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-white"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleCreate}
          disabled={saving || !form.name}
          className="rounded bg-emerald-500 px-3 py-1.5 text-xs text-white transition hover:bg-emerald-600 disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create & Use"}
        </button>
      </div>
    </div>
  );
}

// ---------- Reusable Modal ----------

function Modal({
  children,
  title,
  onClose,
  maxWidth = "max-w-xl",
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl border border-[#173a55] bg-[#061d31] p-6 shadow-2xl`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 transition hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
