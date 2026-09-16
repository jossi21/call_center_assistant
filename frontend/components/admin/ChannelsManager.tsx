"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";
import {
  Channel,
  ChannelTypeDef,
  listChannels,
  listChannelTypes,
  updateChannel,
  createChannel,
  deleteChannel,
  toggleChannelActive,
} from "@/services/channelsApi";
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

type StatusFilter = "all" | "active" | "inactive";
type TimeFilter = "all" | "week" | "month" | "6months";

type ChannelFilters = {
  status: StatusFilter;
  time: TimeFilter;
  customFrom: string;
  customTo: string;
  showArchived: boolean;
};

type OpenFilter = "status" | "time" | "custom" | null;

export default function ChannelsManager() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingChannel, setDeletingChannel] = useState<Channel | null>(null);

  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState<ChannelFilters>({
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

  async function load() {
    setLoading(true);
    setError(null);

    try {
      setChannels(await listChannels());
    } catch {
      setError("Couldn't load channels.");
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

  async function handleToggle(channel: Channel) {
    try {
      setError(null);
      await toggleChannelActive(channel.id);
      await load();
    } catch {
      setError(
        `Couldn't ${channel.is_active ? "suspend" : "activate"} the channel.`,
      );
    }
  }

  async function handleDelete(channel: Channel) {
    try {
      setError(null);
      await deleteChannel(channel.id);
      setDeletingChannel(null);
      await load();
    } catch {
      setError("Couldn't delete the channel.");
    }
  }

  function updateFilters(patch: Partial<ChannelFilters>) {
    setFilters((prev) => ({
      ...prev,
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
    Boolean(filters.customFrom || filters.customTo) ||
    filters.showArchived;

  const filteredChannels = useMemo(() => {
    const query = search.trim().toLowerCase();

    return channels.filter((channel) => {
      const matchesSearch =
        !query ||
        [channel.display_name, channel.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (filters.status === "active" && !channel.is_active) {
        return false;
      }

      if (filters.status === "inactive" && channel.is_active) {
        return false;
      }

      /*
       * These fields are optional so the page works with the
       * current Channel type/API as well as APIs that expose
       * archive and timestamp information.
       */
      const channelWithMeta = channel as Channel & {
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
        channelWithMeta.is_archived === true ||
        channelWithMeta.archived === true ||
        Boolean(channelWithMeta.archived_at || channelWithMeta.archivedAt);

      if (!filters.showArchived && isArchived) {
        return false;
      }

      const dateValue =
        channelWithMeta.updated_at ||
        channelWithMeta.updatedAt ||
        channelWithMeta.created_at ||
        channelWithMeta.createdAt;

      const channelDate = dateValue ? new Date(dateValue) : null;

      /*
       * If the API doesn't provide a date, time filters
       * simply don't exclude the channel.
       */
      if (channelDate && !Number.isNaN(channelDate.getTime())) {
        if (filters.time !== "all") {
          const age = now - channelDate.getTime();

          const ranges: Record<Exclude<TimeFilter, "all">, number> = {
            week: 7 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000,
            "6months": 180 * 24 * 60 * 60 * 1000,
          };

          if (age > ranges[filters.time]) {
            return false;
          }
        }

        if (filters.customFrom) {
          const from = new Date(`${filters.customFrom}T00:00:00`);

          if (channelDate < from) {
            return false;
          }
        }

        if (filters.customTo) {
          const to = new Date(`${filters.customTo}T23:59:59.999`);

          if (channelDate > to) {
            return false;
          }
        }
      }

      return true;
    });
  }, [channels, search, filters, now]);

  const customLabel =
    filters.customFrom || filters.customTo
      ? getCustomDateLabel(filters.customFrom, filters.customTo)
      : "Select dates";

  const columns: Column<Channel>[] = [
    {
      key: "name",
      header: "Channel",
      cell: (channel: Channel) => (
        <div>
          <div className="text-sm font-semibold text-white">
            {channel.display_name}
          </div>

          <div className="text-xs text-slate-400">{channel.name}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (channel: Channel) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            channel.is_active
              ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
              : "bg-slate-800 text-slate-400 ring-1 ring-slate-700"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              channel.is_active ? "bg-emerald-500" : "bg-slate-500"
            }`}
          />

          {channel.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cell: (channel: Channel) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-800 hover:text-white">
              <MoreVertical size={16} />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="z-100 w-44 rounded-xl border-slate-800 bg-slate-900"
            >
              <DropdownMenuLabel className="text-slate-400">
                Actions
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
                onClick={() => setEditingChannel(channel)}
              >
                <Pencil size={14} />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-800 focus:text-white"
                onClick={() => handleToggle(channel)}
              >
                <Power size={14} />

                {channel.is_active ? "Suspend" : "Activate"}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-red-400 focus:bg-red-950 focus:text-red-300"
                onClick={() => setDeletingChannel(channel)}
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
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Channels
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Manage and configure your communication channels
                </p>
              </div>

              <Button
                onClick={() => setShowCreate(true)}
                className="h-10 gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-600"
              >
                <Plus size={15} />
                New Channel
              </Button>
            </div>

            {/* Filters */}
            <div className="mt-6">
              <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search channels..."
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
                {/* STATUS */}
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

                {/* TIME */}
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

                {/* CUSTOM DATE */}
                <div className="relative flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Custom
                  </span>

                  <button
                    type="button"
                    onClick={openCustomFilter}
                    className={`flex h-10 items-center justify-between gap-3 rounded-xl border px-3 text-sm outline-none transition ${
                      filters.customFrom || filters.customTo
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-[#123957] bg-[#061d31] text-white hover:border-[#1b4b6d] hover:bg-[#08253b]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Calendar
                        size={15}
                        className={
                          filters.customFrom || filters.customTo
                            ? "text-emerald-400"
                            : "text-slate-500"
                        }
                      />

                      <span className="max-w-32 truncate">{customLabel}</span>
                    </span>

                    <ChevronDown
                      size={15}
                      className={`text-slate-500 transition-transform ${
                        openFilter === "custom" ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {openFilter === "custom" && (
                    <div className="absolute left-0 top-12 z-100 w-72 rounded-xl border border-[#173a55] bg-[#061a2b] p-4 shadow-2xl">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-white">
                            Custom date range
                          </p>

                          <p className="mt-0.5 text-[11px] text-slate-500">
                            Select a start and end date
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setOpenFilter(null)}
                          className="text-slate-500 transition hover:text-white"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            From
                          </label>

                          <input
                            type="date"
                            value={customDraft.from}
                            onChange={(e) =>
                              setCustomDraft((prev) => ({
                                ...prev,
                                from: e.target.value,
                              }))
                            }
                            className="h-9 w-full rounded-lg border border-[#123957] bg-[#061d31] px-2.5 text-xs text-white outline-none transition focus:border-emerald-500/60"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            To
                          </label>

                          <input
                            type="date"
                            value={customDraft.to}
                            onChange={(e) =>
                              setCustomDraft((prev) => ({
                                ...prev,
                                to: e.target.value,
                              }))
                            }
                            className="h-9 w-full rounded-lg border border-[#123957] bg-[#061d31] px-2.5 text-xs text-white outline-none transition focus:border-emerald-500/60"
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={clearCustomFilter}
                          className="h-8 rounded-lg px-3 text-xs font-medium text-slate-400 transition hover:bg-[#08253b] hover:text-white"
                        >
                          Clear
                        </button>

                        <button
                          type="button"
                          onClick={applyCustomFilter}
                          className="h-8 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white transition hover:bg-emerald-600"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ARCHIVE */}
                <FilterField label="Archive">
                  <label className="flex h-10 cursor-pointer items-center gap-2.5 rounded-xl border border-[#123957] bg-[#061d31] px-3 text-sm text-slate-300 transition hover:border-[#1b4b6d] hover:bg-[#08253b]">
                    <input
                      type="checkbox"
                      checked={filters.showArchived}
                      onChange={(e) =>
                        updateFilters({
                          showArchived: e.target.checked,
                        })
                      }
                      className="h-3.5 w-3.5 rounded border-[#28506d] bg-[#061d31] text-emerald-500 accent-emerald-500"
                    />

                    <span className="whitespace-nowrap">Show archived</span>
                  </label>
                </FilterField>
              </FilterBar>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="border-t border-red-500/10 bg-red-500/5 px-5 py-3 text-sm text-red-400 sm:px-6 lg:px-7">
              {error}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="relative z-10 overflow-hidden rounded-2xl border border-[#173a55] bg-[#061d31] shadow-[0_0_40px_rgba(0,90,150,0.06)]">
          <Table<Channel>
            loading={loading}
            columns={columns}
            data={filteredChannels}
            keyExtractor={(channel) => channel.id}
            emptyMessage="No channels found."
          />

          {!loading && channels.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-[#123957] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-300">
                  {filteredChannels.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-300">
                  {channels.length}
                </span>{" "}
                channels
              </p>

              {(hasActiveFilters || search) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-left text-xs font-medium text-emerald-400 transition hover:text-emerald-300 sm:text-right"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Edit */}
        {editingChannel && (
          <ChannelFormModal
            initial={editingChannel}
            title={`Edit ${editingChannel.display_name}`}
            onClose={() => setEditingChannel(null)}
            onSubmit={async (data) => {
              try {
                setError(null);

                await updateChannel(editingChannel.id, data);

                setEditingChannel(null);
                await load();
              } catch {
                setError("Couldn't update the channel.");
                throw new Error("Couldn't update the channel.");
              }
            }}
          />
        )}

        {/* Create */}
        {showCreate && (
          <ChannelFormModal
            title="New Channel"
            onClose={() => setShowCreate(false)}
            onSubmit={async (data) => {
              try {
                setError(null);

                await createChannel(
                  data as {
                    name: string;
                    display_name: string;
                    config: Record<string, unknown>;
                  },
                );

                setShowCreate(false);
                await load();
              } catch {
                setError("Couldn't create the channel.");
                throw new Error("Couldn't create the channel.");
              }
            }}
          />
        )}

        {/* Delete */}
        {deletingChannel && (
          <DeleteModal
            onClose={() => setDeletingChannel(null)}
            onConfirm={() => handleDelete(deletingChannel)}
            title={`Delete ${deletingChannel.display_name}`}
            message={`Are you sure you want to permanently delete "${deletingChannel.display_name}"? This action cannot be undone.`}
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
        <div className="absolute left-0 top-12 z-100 min-w-42.5 rounded-xl border border-[#173a55] bg-[#061a2b] p-1.5 shadow-2xl">
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

  return "Select dates";
}

function formatDate(value: string) {
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

function ChannelFormModal({
  initial,
  title,
  onClose,
  onSubmit,
}: {
  initial?: Channel;
  title: string;
  onClose: () => void;
  onSubmit: (data: {
    name?: string;
    display_name: string;
    config: Record<string, unknown>;
  }) => Promise<void>;
}) {
  const [channelTypes, setChannelTypes] = useState<
    Record<string, ChannelTypeDef>
  >({});
  const [typesLoading, setTypesLoading] = useState(true);

  const [selectedType, setSelectedType] = useState(initial?.name || "");

  const [displayName, setDisplayName] = useState(initial?.display_name || "");

  const [configValues, setConfigValues] = useState<Record<string, string>>(
    (initial?.config as Record<string, string>) || {},
  );

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      try {
        setChannelTypes(await listChannelTypes());
      } catch {
        setError("Couldn't load channel types.");
      } finally {
        setTypesLoading(false);
      }
    });
  }, []);

  function handleTypeSelect(type: string) {
    setSelectedType(type);
    setDisplayName(channelTypes[type]?.display_name || "");
    setConfigValues({});
  }

  function handleFieldChange(key: string, value: string) {
    setConfigValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSave() {
    setError("");

    if (!selectedType) {
      setError("Select a channel type.");
      return;
    }

    if (!displayName.trim()) {
      setError("Display name is required.");
      return;
    }

    const typeDef = channelTypes[selectedType];

    const missing =
      typeDef?.fields.filter(
        (field) => field.required && !configValues[field.key],
      ) || [];

    if (missing.length > 0) {
      setError(
        `Missing required fields: ${missing
          .map((field) => field.label)
          .join(", ")}`,
      );
      return;
    }

    setSaving(true);

    try {
      if (initial) {
        await onSubmit({
          display_name: displayName,
          config: configValues,
        });
      } else {
        await onSubmit({
          name: selectedType,
          display_name: displayName,
          config: configValues,
        });
      }
    } catch {
      // Parent handles the error state.
    } finally {
      setSaving(false);
    }
  }

  const typeDef = selectedType ? channelTypes[selectedType] : null;

  return (
    <Modal onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        {error && <div className="text-sm text-red-400">{error}</div>}

        {typesLoading && (
          <div className="text-sm text-slate-400">Loading channel types...</div>
        )}

        {!typesLoading && !initial && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Channel Type
            </label>

            <select
              value={selectedType}
              onChange={(e) => handleTypeSelect(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select a channel...</option>

              {Object.entries(channelTypes).map(([key, def]) => (
                <option key={key} value={key}>
                  {def.display_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedType && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Display name
            </label>

            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        {typeDef?.fields.map((field) => (
          <div key={field.key}>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              {field.label}
              {field.required && " *"}
            </label>

            <input
              type={field.type}
              value={configValues[field.key] || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        ))}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="cursor-pointer bg-blue-400"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving || !selectedType}
            className="cursor-pointer bg-emerald-500 text-white hover:bg-emerald-600"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Modal({
  children,
  title,
  onClose,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
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

function DeleteModal({
  onClose,
  onConfirm,
  title,
  message,
}: {
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 transition hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-400">{message}</p>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
