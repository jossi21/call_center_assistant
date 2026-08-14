"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  MessageSquare,
  MoreVertical,
  Eye,
  Check,
  X,
} from "lucide-react";
import { listMyCases, MyCase, resolveCase } from "@/services/staffProfileApi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_COLORS: Record<string, string> = {
  waiting_confirmation:
    "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  assigned: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  waiting_confirmation: Clock,
  assigned: AlertCircle,
  resolved: CheckCircle2,
};

type StatusFilter = "all" | "waiting_confirmation" | "assigned" | "resolved";

export default function MyCasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<MyCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listMyCases();
      setCases(data);
    } catch {
      setError("Couldn't load your cases.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, []);

  async function handleResolve(caseId: string) {
    if (!confirm("Mark this case as resolved?")) return;
    setResolvingId(caseId);
    try {
      await resolveCase(caseId);
      await load();
    } catch {
      setError("Failed to resolve case.");
    } finally {
      setResolvingId(null);
    }
  }

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user_contact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCases = filteredCases.filter((c) => c.status !== "resolved");
  const resolvedCases = filteredCases.filter((c) => c.status === "resolved");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Loading your cases...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-400 text-sm bg-slate-950 m-6 rounded-xl border border-slate-800">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-3 sm:p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Cases</h1>
          <p className="text-sm text-slate-400 mt-1">
            {cases.length === 0
              ? "No cases assigned"
              : `${cases.length} case${cases.length > 1 ? "s" : ""} assigned to you`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1.5 rounded-full">
            {activeCases.length} active
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            placeholder="Search by reason or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Status</option>
          <option value="waiting_confirmation">Waiting Confirmation</option>
          <option value="assigned">Assigned</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Active Cases */}
      {activeCases.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-slate-400 mb-3">
            Active Cases ({activeCases.length})
          </h2>
          <div className="flex flex-col gap-3">
            {activeCases.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                caseItem={caseItem}
                onResolve={handleResolve}
                resolvingId={resolvingId}
                expanded={expandedCase === caseItem.id}
                onToggleExpand={() =>
                  setExpandedCase(
                    expandedCase === caseItem.id ? null : caseItem.id,
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Resolved Cases */}
      {resolvedCases.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-400 mb-3">
            Resolved Cases ({resolvedCases.length})
          </h2>
          <div className="flex flex-col gap-3 opacity-60">
            {resolvedCases.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                caseItem={caseItem}
                onResolve={handleResolve}
                resolvingId={resolvingId}
                expanded={expandedCase === caseItem.id}
                onToggleExpand={() =>
                  setExpandedCase(
                    expandedCase === caseItem.id ? null : caseItem.id,
                  )
                }
                resolved
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredCases.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <MessageSquare size={24} className="text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            No cases found
          </h3>
          <p className="text-sm text-slate-400">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "You don't have any cases assigned yet"}
          </p>
        </div>
      )}
    </div>
  );
}

function CaseCard({
  caseItem,
  onResolve,
  resolvingId,
  expanded,
  onToggleExpand,
  resolved = false,
}: {
  caseItem: MyCase;
  onResolve: (id: string) => void;
  resolvingId: string | null;
  expanded: boolean;
  onToggleExpand: () => void;
  resolved?: boolean;
}) {
  const StatusIcon = STATUS_ICONS[caseItem.status] || AlertCircle;

  return (
    <Card
      className={`bg-slate-900 border-slate-800 overflow-hidden ${resolved ? "opacity-70" : ""}`}
    >
      <CardContent className="p-0">
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[caseItem.status]}`}
              >
                <StatusIcon size={12} />
                {caseItem.status.replace("_", " ")}
              </span>
            </div>
            <div className="text-sm font-semibold text-white truncate">
              {caseItem.reason}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <User size={12} />
                {caseItem.user_contact}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {new Date(caseItem.assigned_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!resolved && (
              <Button
                size="sm"
                onClick={() => onResolve(caseItem.id)}
                disabled={resolvingId === caseItem.id}
                className="bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <Check size={14} className="mr-1" />
                {resolvingId === caseItem.id ? "Resolving..." : "Resolve"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleExpand}
              className="h-8 w-8 rounded-full hover:bg-slate-800 text-slate-400"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-slate-800 bg-slate-950/50 p-4">
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {caseItem.history.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-2">
                  No conversation history
                </p>
              ) : (
                caseItem.history.map((msg, i) => (
                  <div
                    key={i}
                    className={`text-xs px-3 py-2 rounded-lg max-w-[85%] ${
                      msg.role === "user"
                        ? "bg-slate-800 text-slate-200 self-start border border-slate-700"
                        : "bg-indigo-500/20 text-indigo-200 self-end"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
