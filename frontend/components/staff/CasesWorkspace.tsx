"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MyCase,
  MyProfile,
  listMyCases,
  resolveCase,
  sendCaseReply,
  getMyProfile,
} from "@/services/staffProfileApi";
import { CasesHeader } from "./myCase/CasesHeader";
import { CasesFilterBar } from "./myCase/CasesFilterBar";
import { CaseListPanel } from "./myCase/CaseListPanel";
import { CaseDetailPanel } from "./myCase/CaseDetailPanel";
import { CaseDetailSidebar } from "./CaseDetailSidebar";
import { ListFilter, Tab, ReplyMode } from "../../lib/case-constants";

export function CasesWorkspace() {
  const [cases, setCases] = useState<MyCase[]>([]);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("conversation");
  const [replyMode, setReplyMode] = useState<ReplyMode>("reply");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [listFilter, setListFilter] = useState<ListFilter>("all");
  const [search, setSearch] = useState("");
  const [caseListOpen, setCaseListOpen] = useState(false);

  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

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

  // TODO: replace with a real-time feed from the socket connection later —
  // for now this is derived from the same `cases` list already loaded via listMyCases()
  const unresolvedCases = useMemo(
    () =>
      [...cases]
        .filter((c) => c.status === "waiting" || c.status === "assigned")
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
    [cases],
  );

  const selected = cases.find((c) => c.id === selectedId) || null;

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
    <div className="flex flex-col h-screen overflow-hidden">
      <CasesHeader
        unresolvedCases={unresolvedCases}
        onSelectCase={selectCase}
        profile={profile}
        onProfileUpdated={setProfile}
        onOpenCaseList={() => setCaseListOpen(true)}
      />

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
          replyMode={replyMode}
          setReplyMode={setReplyMode}
          replyText={replyText}
          setReplyText={setReplyText}
          sending={sending}
          onSend={handleSend}
          onResolve={handleResolve}
        />

        {selected && (
          <CaseDetailSidebar
            selected={selected}
            onInsertTemplate={(text) => setReplyText(text)}
          />
        )}
      </div>
    </div>
  );
}
