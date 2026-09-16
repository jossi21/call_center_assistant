"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  Bot,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  CreditCard,
  Eye,
  Headphones,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  Settings,
  Trash2,
  Users,
  Wrench,
  X,
} from "lucide-react";
import {
  Agent,
  listAgents,
  updateAgent,
  createAgent,
  deleteAgent,
} from "@/services/agentsApi";
import { Table, Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/ui/FilterBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type StatusFilter = "all" | "active" | "inactive";

type TimeFilter = "all" | "week" | "month" | "6months";

type AgentFilters = {
  status: StatusFilter;
  time: TimeFilter;
  customFrom: string;
  customTo: string;
  showArchived: boolean;
};

type OpenFilter = "status" | "time" | "custom" | null;

export default function AgentsManager() {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState<AgentFilters>({
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

  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const data = await listAgents();
      setAgents(data);
    } catch {
      setError("Couldn't load agents. You may not have admin access.");
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

  async function handleToggleActive(agent: Agent): Promise<void> {
    try {
      await updateAgent(agent.id, {
        is_active: !agent.is_active,
      });

      await load();
    } catch {
      setError("Failed to update agent status.");
    }
  }

  async function handleDelete(agent: Agent): Promise<void> {
    try {
      await deleteAgent(agent.id);

      setDeletingAgent(null);

      await load();
    } catch {
      setError("Failed to delete agent.");
    }
  }

  function updateFilters(updates: Partial<AgentFilters>): void {
    setFilters((previous) => ({
      ...previous,
      ...updates,
    }));
  }

  function openCustomFilter(): void {
    setCustomDraft({
      from: filters.customFrom,
      to: filters.customTo,
    });

    setOpenFilter(openFilter === "custom" ? null : "custom");
  }

  function applyCustomFilter(): void {
    updateFilters({
      time: "all",
      customFrom: customDraft.from,
      customTo: customDraft.to,
    });

    setOpenFilter(null);
  }

  function clearCustomFilter(): void {
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

  function resetFilters(): void {
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
  }

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.time !== "all" ||
    Boolean(filters.customFrom) ||
    Boolean(filters.customTo) ||
    filters.showArchived;

  const filteredAgents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return agents.filter((agent) => {
      const matchesSearch =
        !query ||
        agent.display_name?.toLowerCase().includes(query) ||
        agent.name?.toLowerCase().includes(query) ||
        agent.description?.toLowerCase().includes(query);

      if (!matchesSearch) {
        return false;
      }
      const extendedAgent = agent as Agent & {
        is_archived?: boolean;
        archived?: boolean;
        archived_at?: string | Date | null;
        archivedAt?: string | Date | null;
      };

      const isArchived =
        extendedAgent.is_archived === true ||
        extendedAgent.archived === true ||
        Boolean(extendedAgent.archived_at ?? extendedAgent.archivedAt);
      if (!filters.showArchived && isArchived) {
        return false;
      }

      if (filters.status === "active" && agent.is_active !== true) {
        return false;
      }

      if (filters.status === "inactive" && agent.is_active !== false) {
        return false;
      }

      if (filters.time !== "all") {
        const date =
          getAgentDate(agent, "updated") ?? getAgentDate(agent, "created");

        if (!date) {
          return false;
        }
        const difference = now - date.getTime();

        const week = 7 * 24 * 60 * 60 * 1000;

        const month = 30 * 24 * 60 * 60 * 1000;

        const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;

        if (filters.time === "week" && difference > week) {
          return false;
        }

        if (filters.time === "month" && difference > month) {
          return false;
        }

        if (filters.time === "6months" && difference > sixMonths) {
          return false;
        }
      }

      if (filters.customFrom || filters.customTo) {
        const date =
          getAgentDate(agent, "updated") ?? getAgentDate(agent, "created");

        if (!date) {
          return false;
        }

        const agentTime = date.getTime();

        if (filters.customFrom) {
          const from = new Date(`${filters.customFrom}T00:00:00`).getTime();

          if (agentTime < from) {
            return false;
          }
        }

        if (filters.customTo) {
          const to = new Date(`${filters.customTo}T23:59:59`).getTime();

          if (agentTime > to) {
            return false;
          }
        }
      }

      return true;
    });
  }, [agents, search, filters, now]);

  const columns: Column<Agent>[] = [
    {
      key: "name",
      header: "Name",

      cell: (agent: Agent) => {
        const iconConfig = getAgentIcon(agent);

        return (
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconConfig.bg} ${iconConfig.text}`}
            >
              <iconConfig.icon size={19} strokeWidth={2} />
            </div>

            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white">
                {agent.display_name}
              </span>

              <span className="mt-0.5 block truncate text-xs text-slate-500">
                {agent.name}
              </span>
            </div>
          </div>
        );
      },
    },

    {
      key: "description",
      header: "Description",

      cell: (agent: Agent) => (
        <span
          title={agent.description || ""}
          className="block max-w-90 truncate text-sm text-slate-300"
        >
          {agent.description || "No description provided"}
        </span>
      ),
    },

    {
      key: "status",
      header: "Status",

      cell: (agent: Agent) => {
        if (agent.is_active) {
          return (
            <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.7)]" />
              Active
            </span>
          );
        }

        return (
          <span className="inline-flex items-center gap-2 rounded-lg bg-slate-500/10 px-3 py-2 text-xs font-semibold text-slate-400 ring-1 ring-inset ring-slate-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            Inactive
          </span>
        );
      },
    },

    {
      key: "tools",
      header: "Tools",

      cell: (agent: Agent) => {
        const toolCount = getToolCount(agent);

        return (
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Wrench size={15} className="text-slate-500" />

            <span>{toolCount}</span>
          </div>
        );
      },
    },

    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",

      cell: (agent: Agent) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                  <MoreVertical size={18} />
                </Button>
              }
            />

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-48 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl"
            >
              <DropdownMenuLabel className="px-3 py-2 text-xs font-medium text-slate-500">
                Agent Actions
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                onClick={() => {
                  router.push(`/admin/agents/${agent.id}`);
                }}
                className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
              >
                <Eye size={15} />
                View details
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  setEditingAgent(agent);
                }}
                className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
              >
                <Pencil size={15} />
                Edit agent
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  handleToggleActive(agent);
                }}
                className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
              >
                <Power size={15} />

                {agent.is_active ? "Suspend agent" : "Activate agent"}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                onClick={() => {
                  setDeletingAgent(agent);
                }}
                className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-red-400 focus:bg-red-950/40 focus:text-red-300"
              >
                <Trash2 size={15} />
                Delete agent
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const statusLabel =
    filters.status === "active"
      ? "Active"
      : filters.status === "inactive"
        ? "Inactive"
        : "All";

  const timeLabel =
    filters.time === "week"
      ? "Week"
      : filters.time === "month"
        ? "Month"
        : filters.time === "6months"
          ? "6 Months"
          : "All";

  const customLabel = getCustomDateLabel(filters.customFrom, filters.customTo);
  return (
    <div className="min-h-full bg-[#020f1d] text-white">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-3 sm:p-4 md:p-5 lg:p-6">
        <div className="relative z-30 overflow-visible rounded-2xl border border-[#12324d] bg-[#031526] shadow-[0_0_40px_rgba(0,90,150,0.08)]">
          <div className="p-5 sm:p-6 lg:p-7">
            {/* HEADER */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[26px]">
                  AI Agents
                </h1>

                <p className="mt-2 text-sm text-slate-400">
                  Manage and configure your AI agents
                </p>
              </div>

              <Button
                type="button"
                onClick={() => setShowCreate(true)}
                className="h-10 w-full gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(16,185,129,0.12)] transition hover:bg-emerald-600 sm:w-auto"
              >
                <Plus size={17} />
                Create Agent
              </Button>
            </div>

            {/* FILTERS */}
            <div className="mt-6">
              <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search agents..."
                onReset={resetFilters}
                showReset={hasActiveFilters || Boolean(search)}
                leading={
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="group flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[#123957] bg-[#061d31] px-3 text-sm font-medium text-slate-300 transition hover:border-[#1b4b6d] hover:bg-[#08253b] hover:text-white"
                  >
                    <ChevronLeft
                      size={17}
                      className="transition-transform group-hover:-translate-x-0.5"
                    />
                  </button>
                }
              >
                {/* STATUS */}
                <FilterDropdownButton
                  value={statusLabel}
                  active={filters.status !== "all"}
                  open={openFilter === "status"}
                  onClick={() =>
                    setOpenFilter(openFilter === "status" ? null : "status")
                  }
                >
                  <FilterOption
                    label="All"
                    selected={filters.status === "all"}
                    onClick={() => {
                      updateFilters({
                        status: "all",
                      });
                      setOpenFilter(null);
                    }}
                  />

                  <FilterOption
                    label="Active"
                    selected={filters.status === "active"}
                    onClick={() => {
                      updateFilters({
                        status: "active",
                      });
                      setOpenFilter(null);
                    }}
                  />

                  <FilterOption
                    label="Inactive"
                    selected={filters.status === "inactive"}
                    onClick={() => {
                      updateFilters({
                        status: "inactive",
                      });
                      setOpenFilter(null);
                    }}
                  />
                </FilterDropdownButton>

                {/* TIME */}
                <FilterDropdownButton
                  value={timeLabel}
                  active={filters.time !== "all"}
                  open={openFilter === "time"}
                  onClick={() =>
                    setOpenFilter(openFilter === "time" ? null : "time")
                  }
                >
                  <FilterOption
                    label="All"
                    selected={filters.time === "all"}
                    onClick={() => {
                      updateFilters({
                        time: "all",
                      });
                      setOpenFilter(null);
                    }}
                  />

                  <FilterOption
                    label="Week"
                    selected={filters.time === "week"}
                    onClick={() => {
                      updateFilters({
                        time: "week",
                        customFrom: "",
                        customTo: "",
                      });
                      setOpenFilter(null);
                    }}
                  />

                  <FilterOption
                    label="Month"
                    selected={filters.time === "month"}
                    onClick={() => {
                      updateFilters({
                        time: "month",
                        customFrom: "",
                        customTo: "",
                      });
                      setOpenFilter(null);
                    }}
                  />

                  <FilterOption
                    label="6 Months"
                    selected={filters.time === "6months"}
                    onClick={() => {
                      updateFilters({
                        time: "6months",
                        customFrom: "",
                        customTo: "",
                      });
                      setOpenFilter(null);
                    }}
                  />
                </FilterDropdownButton>

                {/* CUSTOM DATE */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={openCustomFilter}
                    className={`flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition ${
                      filters.customFrom || filters.customTo
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-[#123957] bg-[#061d31] text-slate-300 hover:border-[#1b4b6d] hover:bg-[#08253b] hover:text-white"
                    }`}
                  >
                    <Calendar size={15} />

                    <span>{customLabel}</span>

                    <ChevronDown
                      size={14}
                      className={`transition-transform ${
                        openFilter === "custom" ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {openFilter === "custom" && (
                    <div className="absolute right-0 top-12 z-40 w-72.5 rounded-xl border border-[#173a55] bg-[#061a2b] p-4 shadow-2xl">
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-white">
                          Custom date range
                        </p>

                        <p className="mt-1 text-[11px] text-slate-500">
                          Filter agents by their created or updated date.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="mb-1.5 block text-[11px] font-medium text-slate-400">
                            From
                          </label>

                          <input
                            type="date"
                            value={customDraft.from}
                            onChange={(e) =>
                              setCustomDraft((previous) => ({
                                ...previous,
                                from: e.target.value,
                              }))
                            }
                            className="h-9 w-full rounded-lg border border-[#23435a] bg-[#041a2b] px-3 text-xs text-white outline-none focus:border-emerald-500/60"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-[11px] font-medium text-slate-400">
                            To
                          </label>

                          <input
                            type="date"
                            value={customDraft.to}
                            onChange={(e) =>
                              setCustomDraft((previous) => ({
                                ...previous,
                                to: e.target.value,
                              }))
                            }
                            className="h-9 w-full rounded-lg border border-[#23435a] bg-[#041a2b] px-3 text-xs text-white outline-none focus:border-emerald-500/60"
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end gap-2 border-t border-[#17354e] pt-3">
                        <button
                          type="button"
                          onClick={clearCustomFilter}
                          className="rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-[#0b2941] hover:text-white"
                        >
                          Clear
                        </button>

                        <button
                          type="button"
                          onClick={applyCustomFilter}
                          className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ARCHIVE */}
                <label className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-[#123957] bg-[#061d31] px-3 text-sm font-medium text-slate-300 transition hover:border-[#1b4b6d] hover:bg-[#08253b] hover:text-white">
                  <input
                    type="checkbox"
                    checked={filters.showArchived}
                    onChange={(e) =>
                      updateFilters({
                        showArchived: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-[#23435a] bg-[#041a2b] text-emerald-500 accent-emerald-500 focus:ring-emerald-500/30"
                  />

                  <span>Archive</span>
                </label>
              </FilterBar>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mx-5 mb-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400 sm:mx-6">
              {error}
            </div>
          )}
        </div>

        <div className="relative z-10 overflow-hidden rounded-2xl border border-[#173a55] bg-[#061d31] shadow-[0_0_40px_rgba(0,90,150,0.06)]">
          <Table<Agent>
            loading={loading}
            columns={columns}
            data={filteredAgents}
            keyExtractor={(agent: Agent) => agent.id}
            emptyMessage={
              search || hasActiveFilters
                ? "No agents match your current search or filter."
                : "No agents found. Create your first agent to get started."
            }
          />

          {/* FOOTER */}
          {!loading && agents.length > 0 && (
            <div className="border-t border-[#123957] px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-medium text-slate-300">
                    {filteredAgents.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-slate-300">
                    {agents.length}
                  </span>{" "}
                  agents
                </p>

                {hasActiveFilters || search ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="w-fit text-xs text-emerald-400 transition hover:text-emerald-300"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {editingAgent && (
        <EditAgentModal
          agent={editingAgent}
          onClose={() => setEditingAgent(null)}
          onSaved={() => {
            setEditingAgent(null);
            load();
          }}
        />
      )}

      {showCreate && (
        <CreateAgentModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      {deletingAgent && (
        <DeleteModal
          onClose={() => setDeletingAgent(null)}
          onConfirm={() => handleDelete(deletingAgent)}
          title={`Delete ${deletingAgent.display_name}`}
          message={`Are you sure you want to permanently delete "${deletingAgent.display_name}"? This action cannot be undone.`}
        />
      )}
    </div>
  );
}

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
        className={`flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition ${
          active
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
            : "border-[#123957] bg-[#061d31] text-slate-300 hover:border-[#1b4b6d] hover:bg-[#08253b] hover:text-white"
        }`}
      >
        <span>{value}</span>

        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-40 min-w-42.5 rounded-xl border border-[#173a55] bg-[#061a2b] p-1.5 shadow-2xl">
          {children}
        </div>
      )}
    </div>
  );
}

function FilterOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium transition ${
        selected
          ? "bg-emerald-500/10 text-emerald-400"
          : "text-slate-300 hover:bg-[#0b2941] hover:text-white"
      }`}
    >
      <span>{label}</span>

      {selected && <Check size={15} />}
    </button>
  );
}

function getAgentDate(agent: Agent, field: "created" | "updated"): Date | null {
  const extendedAgent = agent as Agent & {
    created_at?: string | Date | null;
    createdAt?: string | Date | null;
    updated_at?: string | Date | null;
    updatedAt?: string | Date | null;
  };

  const value =
    field === "created"
      ? (extendedAgent.created_at ?? extendedAgent.createdAt)
      : (extendedAgent.updated_at ?? extendedAgent.updatedAt);

  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getCustomDateLabel(from: string, to: string): string {
  if (!from && !to) {
    return "Custom";
  }

  const formatDate = (value: string) => {
    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  if (from && to) {
    return `${formatDate(from)} – ${formatDate(to)}`;
  }

  if (from) {
    return `From ${formatDate(from)}`;
  }

  return `Until ${formatDate(to)}`;
}

function getAgentIcon(agent: Agent) {
  const name = `${agent.name ?? ""} ${agent.display_name ?? ""}`.toLowerCase();

  if (name.includes("support")) {
    return {
      icon: Headphones,
      bg: "bg-emerald-500/15",
      text: "text-emerald-400",
    };
  }

  if (name.includes("sales")) {
    return {
      icon: Users,
      bg: "bg-purple-500/15",
      text: "text-purple-400",
    };
  }

  if (name.includes("hr") || name.includes("human")) {
    return {
      icon: Users,
      bg: "bg-blue-500/15",
      text: "text-blue-400",
    };
  }

  if (
    name.includes("billing") ||
    name.includes("payment") ||
    name.includes("finance")
  ) {
    return {
      icon: CreditCard,
      bg: "bg-pink-500/15",
      text: "text-pink-400",
    };
  }

  if (name.includes("technical") || name.includes("tech")) {
    return {
      icon: Wrench,
      bg: "bg-indigo-500/15",
      text: "text-indigo-400",
    };
  }

  if (name.includes("system") || name.includes("admin")) {
    return {
      icon: Settings,
      bg: "bg-cyan-500/15",
      text: "text-cyan-400",
    };
  }

  return {
    icon: Bot,
    bg: "bg-blue-500/15",
    text: "text-blue-400",
  };
}

/* ======================================================================== */
/* TOOL COUNT                                                               */
/* ======================================================================== */

function getToolCount(agent: Agent): number {
  const agentWithTools = agent as Agent & {
    tools?: unknown[];
    tool_count?: number;
    tools_count?: number;
  };

  if (typeof agentWithTools.tool_count === "number") {
    return agentWithTools.tool_count;
  }

  if (typeof agentWithTools.tools_count === "number") {
    return agentWithTools.tools_count;
  }

  if (Array.isArray(agentWithTools.tools)) {
    return agentWithTools.tools.length;
  }

  return 0;
}

function EditAgentModal({
  agent,
  onClose,
  onSaved,
}: {
  agent: Agent;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [prompt, setPrompt] = useState(agent.system_prompt ?? "");

  const [description, setDescription] = useState(agent.description ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(): Promise<void> {
    setSaving(true);
    setError(null);

    try {
      await updateAgent(agent.id, {
        system_prompt: prompt,
        description,
      });

      onSaved();
    } catch {
      setError("Failed to save agent changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title={`Edit ${agent.display_name}`}>
      <div className="flex flex-col gap-5">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-400">
            Description
          </label>

          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-[#173a55] bg-[#041a2b] px-3 py-3 text-sm text-white outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-400">
            System Prompt
          </label>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={18}
            className="w-full resize-none rounded-xl border border-[#173a55] bg-[#041a2b] px-3 py-3 font-mono text-sm leading-6 text-white outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border-[#23435a] bg-transparent text-slate-300 hover:bg-[#0a2539] hover:text-white"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-emerald-500 px-5 text-white hover:bg-emerald-600"
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CreateAgentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    display_name: "",
    description: "",
    system_prompt: "",
  });

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function handleCreate(): Promise<void> {
    if (!form.name.trim() || !form.display_name.trim()) {
      setError("Name and Display Name are required.");

      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createAgent(form);

      onCreated();
    } catch {
      setError("Failed to create agent.");
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  return (
    <Modal onClose={onClose} title="Create Agent">
      <div className="flex flex-col gap-5">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <FormInput
          label="Name"
          placeholder="e.g. billing"
          value={form.name}
          onChange={(value) => updateField("name", value)}
        />

        <FormInput
          label="Display Name"
          placeholder="e.g. Billing Agent"
          value={form.display_name}
          onChange={(value) => updateField("display_name", value)}
        />

        <FormInput
          label="Description"
          placeholder="When the router should use this agent"
          value={form.description}
          onChange={(value) => updateField("description", value)}
        />

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-400">
            System Prompt
          </label>

          <textarea
            placeholder="Enter the system prompt for this agent"
            value={form.system_prompt}
            onChange={(e) => updateField("system_prompt", e.target.value)}
            rows={14}
            className="w-full resize-none rounded-xl border border-[#173a55] bg-[#041a2b] px-3 py-3 font-mono text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border-[#23435a] bg-transparent text-slate-300 hover:bg-[#0a2539] hover:text-white"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleCreate}
            disabled={saving || !form.name.trim() || !form.display_name.trim()}
            className="rounded-xl bg-emerald-500 px-5 text-white hover:bg-emerald-600"
          >
            {saving ? "Creating..." : "Create Agent"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function FormInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-slate-400">
        {label}
      </label>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#173a55] bg-[#041a2b] px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
      />
    </div>
  );
}

function Modal({
  children,
  title,
  onClose,
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#173a55] bg-[#031526] shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-[#17354e] px-6 py-5">
          <h2 className="text-lg font-semibold text-white">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#0a2941] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function DeleteModal({
  onClose,
  onConfirm,
  title,
  message,
}: {
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
}) {
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    setDeleting(true);

    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[#173a55] bg-[#031526] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-semibold text-white">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#0a2941] hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        <p className="mb-6 text-sm leading-6 text-slate-400">{message}</p>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleting}
            className="rounded-xl border-[#23435a] bg-transparent text-slate-300 hover:bg-[#0a2539] hover:text-white"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={deleting}
            onClick={confirmDelete}
            className="rounded-xl bg-red-600 text-white hover:bg-red-700"
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
