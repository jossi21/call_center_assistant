"use client";

import { useEffect, useState } from "react";
import { Search, X, Eye } from "lucide-react";
import { listAllCases, AllCasesRow } from "@/services/staffProfileApi";
import { listChannelTypes, ChannelTypeDef } from "@/services/channelsApi";
import { Table, Column } from "@/components/ui/Table";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "waiting_confirmation", label: "Waiting Confirmation" },
  { value: "waiting", label: "Pending" },
  { value: "assigned", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-800 text-slate-400 ring-1 ring-slate-700",
  medium: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  high: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",
};

const STATUS_COLORS: Record<string, string> = {
  waiting_confirmation:
    "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20",
  waiting: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  assigned: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  cancelled: "bg-slate-800 text-slate-400 ring-1 ring-slate-700",
};

const STATUS_LABELS: Record<string, string> = {
  waiting_confirmation: "Waiting Confirmation",
  waiting: "Pending",
  assigned: "In Progress",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

export function AllCasesTable() {
  const [rows, setRows] = useState<AllCasesRow[]>([]);
  const [total, setTotal] = useState(0);
  const [channelTypes, setChannelTypes] = useState<
    Record<string, ChannelTypeDef>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customer, setCustomer] = useState("");
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listAllCases({
        customer: customer || undefined,
        channel: channel !== "all" ? channel : undefined,
        status: status !== "all" ? status : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
      });
      setRows(data.cases);
      setTotal(data.total);
    } catch {
      setError("Couldn't load cases.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(async () => {
      setChannelTypes(await listChannelTypes());
      await load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, status, dateFrom, dateTo, page]);

  function handleSearch() {
    setPage(1);
    load();
  }

  function clearFilters() {
    setCustomer("");
    setChannel("all");
    setStatus("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const hasActiveFilters =
    customer !== "" ||
    channel !== "all" ||
    status !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns: Column<AllCasesRow>[] = [
    {
      key: "id",
      header: "Case ID",
      cell: (c) => (
        <span className="text-sm font-mono text-white">
          #{c.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (c) => <span className="text-sm text-slate-200">{c.customer}</span>,
    },
    {
      key: "channel_type",
      header: "Channel",
      cell: (c) => (
        <span className="text-xs text-slate-300 capitalize">
          {channelTypes[c.channel_type]?.display_name || c.channel_type}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (c) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            STATUS_COLORS[c.status] ||
            "bg-slate-800 text-slate-400 ring-1 ring-slate-700"
          }`}
        >
          {STATUS_LABELS[c.status] || c.status}
        </span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      cell: (c) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
            PRIORITY_COLORS[c.priority]
          }`}
        >
          {c.priority}
        </span>
      ),
    },
    {
      key: "assigned_to",
      header: "Assigned To",
      cell: (c) => (
        <span className="text-sm text-slate-300">{c.assigned_to}</span>
      ),
    },
    {
      key: "updated_at",
      header: "Updated",
      cell: (c) => (
        <span className="text-xs text-slate-400">
          {new Date(c.updated_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cell: (c) => (
        <div className="flex justify-end">
          <button
            onClick={() => window.open(`/staff/cases?case=${c.id}`, "_blank")}
            className="h-8 w-8 rounded-full hover:bg-slate-800 text-slate-400 inline-flex items-center justify-center"
            title="View case"
          >
            <Eye size={14} />
          </button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="p-8 text-red-400 text-sm bg-slate-950 m-6 rounded-xl border border-slate-800">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-3 p-3 sm:p-4 md:p-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            placeholder="Search by customer..."
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {customer && (
            <button
              onClick={() => {
                setCustomer("");
                setPage(1);
                load();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={channel}
          onChange={(e) => {
            setChannel(e.target.value);
            setPage(1);
          }}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Channels</option>
          <option value="web">Web Chat</option>
          {Object.entries(channelTypes).map(([key, def]) => (
            <option key={key} value={key}>
              {def.display_name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

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
        <Table<AllCasesRow>
          title="All Cases"
          description={
            loading
              ? "Loading cases..."
              : `${total} case${total === 1 ? "" : "s"} found.`
          }
          loading={loading}
          columns={columns}
          data={rows}
          keyExtractor={(c) => c.id}
          emptyMessage="No cases found."
          className={
            !loading && rows.length > 0
              ? "rounded-b-none border-b-0"
              : undefined
          }
        />

        {!loading && rows.length > 0 && (
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-b-[28px] px-6 py-4">
            <span className="text-xs text-slate-400">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-xs text-slate-300 border border-slate-800 rounded-lg px-3 py-1.5 disabled:opacity-40 hover:bg-slate-800"
              >
                Prev
              </button>
              <span className="text-xs text-slate-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-xs text-slate-300 border border-slate-800 rounded-lg px-3 py-1.5 disabled:opacity-40 hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
