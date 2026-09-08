"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MyCase,
  MyProfile,
  listMyCases,
  resolveCase,
  sendCaseReply,
  getMyProfile,
  getCaseMessages,
} from "@/services/staffProfileApi";
import { CasesHeader } from "./myCase/CasesHeader";
import { CasesFilterBar } from "./myCase/CasesFilterBar";
import { CaseListPanel } from "./myCase/CaseListPanel";
import { CaseDetailPanel } from "./myCase/CaseDetailPanel";
import { CaseDetailSidebar } from "./CaseDetailSidebar";
import { ListFilter, Tab, ReplyMode } from "../../lib/case-constants";
import { createCaseNote } from "@/services/staffProfileApi";

export function CasesWorkspace() {
  const [cases, setCases] = useState<MyCase[]>([]);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("conversation");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [listFilter, setListFilter] = useState<ListFilter>("all");
  const [search, setSearch] = useState("");
  const [caseListOpen, setCaseListOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Real-time polling for the currently open case's conversation.
  const pollAfterRef = useRef<string>(new Date().toISOString());
  const seenMessagesRef = useRef<Set<string>>(new Set());

  const customers = useMemo(
    () => Array.from(new Set(cases.map((c) => c.user_contact))).sort(),
    [cases],
  );
  const channels = useMemo(
    () => Array.from(new Set(cases.map((c) => c.channel_type))).sort(),
    [cases],
  );

  const visibleCases = useMemo(() => {
    let list = cases;
    if (listFilter === "waiting") {
      list = list.filter(
        (c) => c.status === "waiting" || c.status === "waiting_confirmation",
      );
    } else if (listFilter !== "all") {
      list = list.filter((c) => c.status === listFilter);
    }
    if (customerFilter !== "all")
      list = list.filter((c) => c.user_contact === customerFilter);
    if (channelFilter !== "all")
      list = list.filter((c) => c.channel_type === channelFilter);
    if (priorityFilter !== "all")
      list = list.filter((c) => c.priority === priorityFilter);
    if (dateFrom)
      list = list.filter((c) => new Date(c.created_at) >= new Date(dateFrom));
    if (dateTo)
      list = list.filter(
        (c) => new Date(c.created_at) <= new Date(dateTo + "T23:59:59"),
      );
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.reason.toLowerCase().includes(q) ||
          c.user_contact.toLowerCase().includes(q),
      );
    }
    return [...list].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [
    cases,
    listFilter,
    search,
    customerFilter,
    channelFilter,
    priorityFilter,
    dateFrom,
    dateTo,
  ]);

  // Initial load — shows the full-page "Loading cases..." state
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [data, profileData] = await Promise.all([
        listMyCases(),
        getMyProfile(),
      ]);
      setCases(data);
      setProfile(profileData);
      setSelectedId((prev) => prev ?? (data.length > 0 ? data[0].id : null));
    } catch {
      setError("Couldn't load cases.");
    } finally {
      setLoading(false);
    }
  }

  // Silent background refresh — used after sending a reply or resolving a case.
  // Does NOT touch `loading`, so the component tree stays mounted and doesn't
  // flash back to the loading screen / reset scroll position.
  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      const [data, profileData] = await Promise.all([
        listMyCases(),
        getMyProfile(),
      ]);
      setCases(data);
      setProfile(profileData);
      pollAfterRef.current = new Date().toISOString();
      // intentionally not touching selectedId here — keep whatever's selected
    } catch {
      setError("Couldn't refresh cases.");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, []);

  const counts = useMemo(
    () => ({
      all: cases.length,
      waiting: cases.filter(
        (c) => c.status === "waiting" || c.status === "waiting_confirmation",
      ).length,
      assigned: cases.filter((c) => c.status === "assigned").length,
      resolved: cases.filter((c) => c.status === "resolved").length,
    }),
    [cases],
  );

  const selected = cases.find((c) => c.id === selectedId) || null;

  // Poll for new messages on the currently selected case — picks up new
  // customer messages (webhook-delivered) without a full reload.
  useEffect(() => {
    if (!selected) return;
    pollAfterRef.current = new Date().toISOString();
    seenMessagesRef.current = new Set();

    const interval = setInterval(async () => {
      try {
        const newMsgs = await getCaseMessages(
          selected.id,
          pollAfterRef.current,
        );
        if (newMsgs.length === 0) return;

        const fresh = newMsgs.filter((m) => !seenMessagesRef.current.has(m.id));
        if (fresh.length === 0) return;

        fresh.forEach((m) => seenMessagesRef.current.add(m.id));
        pollAfterRef.current = newMsgs[newMsgs.length - 1].created_at;

        setCases((prev) =>
          prev.map((c) =>
            c.id === selected.id
              ? {
                  ...c,
                  history: [
                    ...c.history,
                    ...fresh.map((m) => ({
                      role: m.role as "user" | "assistant" | "system",
                      content: m.content,
                    })),
                  ],
                }
              : c,
          ),
        );
      } catch {
        // best-effort — a missed poll just gets caught by the next one
      }
    }, 4000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  async function handleSend() {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      await sendCaseReply(selected.id, replyText.trim());
      setReplyText("");
      await refresh();
    } finally {
      setSending(false);
    }
  }

  async function handleResolve() {
    if (!selected) return;
    if (!confirm("Mark this case as resolved?")) return;
    await resolveCase(selected.id);
    await refresh();
  }

  function selectCase(id: string) {
    setSelectedId(id);
    setTab("conversation");
    setCaseListOpen(false);
  }

  function resetFilters() {
    setCustomerFilter("all");
    setChannelFilter("all");
    setPriorityFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  }

  if (loading)
    return <div className="p-8 text-slate-400 text-sm">Loading cases...</div>;
  if (error) return <div className="p-8 text-red-400 text-sm">{error}</div>;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <CasesHeader onOpenCaseList={() => setCaseListOpen(true)} />

      <CasesFilterBar
        search={search}
        setSearch={setSearch}
        customerFilter={customerFilter}
        setCustomerFilter={setCustomerFilter}
        customers={customers}
        channelFilter={channelFilter}
        setChannelFilter={setChannelFilter}
        channels={channels}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        onReset={resetFilters}
      />

      <div className="flex flex-1 min-h-0">
        <CaseListPanel
          listFilter={listFilter}
          setListFilter={setListFilter}
          counts={counts}
          visibleCases={visibleCases}
          selectedId={selectedId}
          onSelect={selectCase}
          open={caseListOpen}
          onClose={() => setCaseListOpen(false)}
        />

        <CaseDetailPanel
          selected={selected}
          tab={tab}
          setTab={setTab}
          replyText={replyText}
          setReplyText={setReplyText}
          sending={sending}
          onSend={handleSend}
          onResolve={handleResolve}
          onAiPauseToggled={refresh}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        {selected && (
          <CaseDetailSidebar
            selected={selected}
            onInsertTemplate={(text) => setReplyText(text)}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
