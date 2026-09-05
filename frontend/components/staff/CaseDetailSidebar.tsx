"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Radio,
  ChevronRight,
  Tag,
  Plus,
  Sparkles,
  RefreshCw,
  CreditCard,
  RotateCcw,
  MessageCircleWarning,
  Wallet,
  HandHeart,
  FileText,
} from "lucide-react";
import {
  MyCase,
  suggestCaseReply,
  getReplyTemplates,
  ReplyTemplate,
  getCaseCustomer,
  updateCaseCustomer,
  CaseCustomer,
} from "@/services/staffProfileApi";

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-slate-400",
  medium: "bg-amber-400",
  high: "bg-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  waiting: "Pending",
  waiting_confirmation: "Pending",
  assigned: "In Progress",
  resolved: "Resolved",
};

const CATEGORY_ICONS: Record<string, typeof CreditCard> = {
  billing: CreditCard,
  refund: RotateCcw,
  apology: HandHeart,
  payment: Wallet,
  greeting: MessageCircleWarning,
};

function iconForCategory(category: string | null) {
  if (!category) return FileText;
  return CATEGORY_ICONS[category.toLowerCase()] ?? FileText;
}

function getInitials(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "?";
  return trimmed.slice(-2).toUpperCase();
}

export function CaseDetailSidebar({
  selected,
  onInsertTemplate,
}: {
  selected: MyCase;
  onInsertTemplate: (text: string) => void;
}) {
  const [customer, setCustomer] = useState<CaseCustomer | null>(null);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);

  const [aiDraft, setAiDraft] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  async function loadCustomer() {
    setCustomerLoading(true);
    try {
      const data = await getCaseCustomer(selected.id);
      setCustomer(data);
      setNameInput(data.name ?? "");
      setLocationInput(data.location ?? "");
    } catch {
      setCustomer(null);
    } finally {
      setCustomerLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadCustomer();
    });
    setEditingCustomer(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.id]);

  async function handleSaveCustomer() {
    setSavingCustomer(true);
    try {
      await updateCaseCustomer(selected.id, {
        name: nameInput,
        location: locationInput,
      });
      await loadCustomer();
      setEditingCustomer(false);
    } finally {
      setSavingCustomer(false);
    }
  }

  async function generateSuggestion() {
    setAiLoading(true);
    setAiError(null);
    try {
      const suggestion = await suggestCaseReply(selected.id);
      setAiDraft(suggestion);
    } catch {
      setAiError("Couldn't generate a suggestion.");
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    setAiDraft("");
    setAiError(null);
  }, [selected.id]);

  useEffect(() => {
    queueMicrotask(async () => {
      try {
        const data = await getReplyTemplates();
        setTemplates(data);
      } catch {
        // silently leave templates empty — not a critical failure for this panel
      } finally {
        setTemplatesLoading(false);
      }
    });
  }, []);

  return (
    <div className="w-80 shrink-0 border-l border-slate-800 bg-slate-950 overflow-y-auto flex flex-col gap-4 p-4">
      {/* Customer & Channel */}
      <div className="border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-white">
            Customer &amp; Channel
          </h3>
          {editingCustomer ? (
            <button
              onClick={() => setEditingCustomer(false)}
              className="text-xs text-slate-500 hover:text-white transition"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => setEditingCustomer(true)}
              className="text-xs text-slate-500 hover:text-white transition"
            >
              Edit
            </button>
          )}
        </div>

        {customerLoading ? (
          <div className="text-xs text-slate-500">Loading...</div>
        ) : !customer ? (
          <div className="text-xs text-slate-500">
            Couldn&apos;t load customer info.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-semibold text-white shrink-0">
                {getInitials(customer.phone ?? selected.user_contact)}
              </div>
              <div className="min-w-0">
                {editingCustomer ? (
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Customer name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-sm text-white mb-1"
                  />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-white truncate">
                      {customer.name || customer.phone || "Unknown"}
                    </span>
                    {customer.verified && (
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 shrink-0">
                        <CheckCircle2 size={11} />
                        Verified
                      </span>
                    )}
                  </div>
                )}
                <div className="text-xs text-slate-500">
                  Customer since{" "}
                  {new Date(customer.member_since).toLocaleDateString(
                    undefined,
                    {
                      month: "short",
                      year: "numeric",
                    },
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-mono">
                <Phone size={12} className="text-slate-500 shrink-0" />
                {customer.phone || "No phone"}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={12} className="text-slate-600 shrink-0" />
                No email
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin size={12} className="text-slate-500 shrink-0" />
                {editingCustomer ? (
                  <input
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="No location on file"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                  />
                ) : (
                  customer.location || (
                    <span className="text-slate-600">Location unknown</span>
                  )
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Radio size={12} className="text-slate-500 shrink-0" />
                {customer.channel_type || selected.channel_type}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-xs">
              <span className="text-slate-500">Total conversations</span>
              <span className="text-white">{customer.total_conversations}</span>
            </div>

            {editingCustomer ? (
              <button
                onClick={handleSaveCustomer}
                disabled={savingCustomer}
                className="mt-4 w-full bg-emerald-500 text-white rounded-lg py-1.5 text-xs font-medium hover:bg-emerald-600 transition disabled:opacity-50"
              >
                {savingCustomer ? "Saving..." : "Save"}
              </button>
            ) : (
              <button className="mt-4 w-full flex items-center justify-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition">
                View full profile
                <ChevronRight size={12} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Case Details */}
      <div className="border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-white">Case Details</h3>
          <button className="text-xs text-slate-500 hover:text-white transition">
            Edit
          </button>
        </div>

        <dl className="flex flex-col gap-2.5 text-xs">
          {/* NOTE: placeholder — no category field, using reason as a stand-in */}
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Category</dt>
            <dd className="text-white truncate max-w-[150px]">
              {selected.reason}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Priority</dt>
            <dd className="flex items-center gap-1.5 text-white capitalize">
              <span
                className={`w-2 h-2 rounded-full ${
                  PRIORITY_DOT[selected.priority] ?? "bg-slate-400"
                }`}
              />
              {selected.priority}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Status</dt>
            <dd className="text-white">
              {STATUS_LABELS[selected.status] ?? selected.status}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Source</dt>
            <dd className="text-white capitalize">{selected.channel_type}</dd>
          </div>
        </dl>

        {/* NOTE: placeholder — no tags field on MyCase, "add" is non-functional */}
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="text-slate-500 text-xs mb-2">Tags</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] bg-purple-500/15 text-purple-300 px-2 py-1 rounded-md">
              <Tag size={10} />
              {selected.channel_type}
            </span>
            <button
              title="Add tag (not wired up yet)"
              className="flex items-center justify-center w-6 h-6 rounded-md border border-slate-800 text-slate-500 hover:text-white hover:border-slate-700 transition"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <div className="border border-purple-500/30 rounded-2xl p-4 bg-purple-500/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <Sparkles size={13} className="text-purple-400" />
            AI Assistant
          </h3>
          <span className="text-[10px] text-purple-300">Recommended Reply</span>
        </div>

        {aiError && (
          <div className="text-[11px] text-red-400 mb-2">{aiError}</div>
        )}

        {!aiDraft && !aiLoading ? (
          <button
            onClick={generateSuggestion}
            className="w-full border border-purple-500/40 text-purple-300 rounded-lg py-2 text-xs font-medium hover:bg-purple-500/10 transition"
          >
            Generate Suggestion
          </button>
        ) : (
          <>
            <textarea
              value={aiLoading ? "Generating..." : aiDraft}
              onChange={(e) => setAiDraft(e.target.value)}
              disabled={aiLoading}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-60"
            />

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => onInsertTemplate(aiDraft)}
                disabled={aiLoading || !aiDraft}
                className="flex-1 bg-emerald-500 text-white rounded-lg py-1.5 text-xs font-medium hover:bg-emerald-600 transition disabled:opacity-50"
              >
                Use Reply
              </button>
              <button
                onClick={generateSuggestion}
                disabled={aiLoading}
                title="Regenerate"
                className="border border-slate-700 text-slate-300 rounded-lg p-1.5 hover:bg-slate-800 transition disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={aiLoading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Quick Templates */}
      <div className="border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-white">Quick Templates</h3>
        </div>

        {templatesLoading ? (
          <div className="text-xs text-slate-500">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="text-xs text-slate-500">
            No templates yet — an admin can add some.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {templates.map((t) => {
              const Icon = iconForCategory(t.category);
              return (
                <button
                  key={t.id}
                  onClick={() => onInsertTemplate(t.body)}
                  title={t.body}
                  className="flex items-center gap-1.5 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
                >
                  <Icon size={13} className="shrink-0 text-slate-500" />
                  <span className="truncate">{t.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
