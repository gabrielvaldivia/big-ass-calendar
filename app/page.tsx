"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { YearCalendar, AllDayEvent } from "@/components/year-calendar";
import {
  ChevronLeft,
  ChevronRight,
  Unlink,
  Plus,
  RefreshCcw,
  Settings,
  X,
} from "lucide-react";

type CalendarListItem = {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
  accountEmail?: string;
  accessRole?: string;
};
type LinkedAccount = {
  accountId: string;
  email?: string;
  status?: number;
  error?: string;
};

function isoDateOnlyFromDate(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [events, setEvents] = useState<AllDayEvent[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [calendars, setCalendars] = useState<CalendarListItem[]>([]);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] =
    useState<boolean>(false);
  const [calendarColors, setCalendarColors] = useState<Record<string, string>>(
    {}
  );
  const [hiddenEventIds, setHiddenEventIds] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState<boolean>(false);
  const [showDaysOfWeek, setShowDaysOfWeek] = useState<boolean>(true);
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [createTitle, setCreateTitle] = useState<string>("");
  const [createStartDate, setCreateStartDate] = useState<string>("");
  const [createHasEndDate, setCreateHasEndDate] = useState<boolean>(false);
  const [createEndDate, setCreateEndDate] = useState<string>("");
  const [createCalendarId, setCreateCalendarId] = useState<string>("");
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string>("");
  const createDateFromDayClick = useRef<string | null>(null);
  const preferencesLoaded = useRef<boolean>(false);
  const writableCalendars = useMemo(() => {
    const canWrite = new Set(["owner", "writer"]);
    return calendars.filter((c) =>
      c.accessRole ? canWrite.has(c.accessRole) : false
    );
  }, [calendars]);
  const writableAccountsWithCalendars = useMemo(() => {
    const writableSet = new Set(writableCalendars.map((c) => c.id));
    if (accounts.length > 0) {
      return accounts
        .map((acc) => ({
          accountId: acc.accountId,
          email: acc.email || "Other",
          list: writableCalendars.filter((c) =>
            c.id.startsWith(`${acc.accountId}|`)
          ),
        }))
        .filter((group) => group.list.length > 0);
    }
    // Fallback grouping if accounts not provided
    const map = new Map<string, CalendarListItem[]>();
    const emailByAcc = new Map<string, string>();
    for (const c of writableCalendars) {
      const accId = c.id.includes("|") ? c.id.split("|")[0] : "";
      const email = c.accountEmail || "Other";
      emailByAcc.set(accId, email);
      const key = accId || email;
      const arr = map.get(key) ?? [];
      arr.push(c);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([key, list]) => ({
      accountId: key,
      email: emailByAcc.get(key) || "Other",
      list,
    }));
  }, [writableCalendars, accounts]);
  const accountsWithCalendars = useMemo(() => {
    if (accounts.length > 0) {
      return accounts.map((acc) => ({
        accountId: acc.accountId,
        email: acc.email || "Other",
        list: calendars.filter((c) => c.id.startsWith(`${acc.accountId}|`)),
      }));
    }
    // Fallback grouping if accounts not provided
    const map = new Map<string, CalendarListItem[]>();
    const emailByAcc = new Map<string, string>();
    for (const c of calendars) {
      const accId = c.id.includes("|") ? c.id.split("|")[0] : "";
      const email = c.accountEmail || "Other";
      emailByAcc.set(accId, email);
      const key = accId || email;
      const arr = map.get(key) ?? [];
      arr.push(c);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([key, list]) => ({
      accountId: key,
      email: emailByAcc.get(key) || "Other",
      list,
    }));
  }, [accounts, calendars]);
  const calendarNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of calendars) {
      map[c.id] = c.summary;
    }
    return map;
  }, [calendars]);
  const calendarAccounts = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of calendars) {
      if (c.accountEmail) map[c.id] = c.accountEmail;
    }
    return map;
  }, [calendars]);

  // Load preferences from server when authenticated
  useEffect(() => {
    if (status === "authenticated" && !preferencesLoaded.current) {
      preferencesLoaded.current = true;
      fetch("/api/preferences")
        .then((res) => res.json())
        .then((data) => {
          if (data.selectedCalendarIds !== undefined) {
            setSelectedCalendarIds(data.selectedCalendarIds);
          }
          if (data.hiddenEventIds !== undefined) {
            setHiddenEventIds(data.hiddenEventIds);
          }
          if (data.showDaysOfWeek !== undefined) {
            setShowDaysOfWeek(data.showDaysOfWeek);
          }
          if (data.showHidden !== undefined) {
            setShowHidden(data.showHidden);
          }
          if (data.calendarColors !== undefined) {
            setCalendarColors(data.calendarColors);
          }
        })
        .catch((err) => {
          console.error("Failed to load preferences:", err);
          preferencesLoaded.current = false;
        });
    } else if (status !== "authenticated") {
      preferencesLoaded.current = false;
    }
  }, [status]);
  // Load showHidden from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("showHidden");
      if (stored !== null) {
        setShowHidden(stored === "true");
      }
    } catch {}
  }, []);
  // Persist showHidden
  useEffect(() => {
    try {
      localStorage.setItem("showHidden", JSON.stringify(showHidden));
    } catch {}
  }, [showHidden]);

  const visibleEvents = useMemo(() => {
    if (showHidden) return events;
    return events.filter((e) => !hiddenEventIds.includes(e.id));
  }, [events, hiddenEventIds, showHidden]);

  useEffect(() => {
    if (status !== "authenticated") {
      setEvents([]);
      return;
    }
    const controller = new AbortController();
    const qs = `/api/events?year=${year}${
      selectedCalendarIds.length
        ? `&calendarIds=${encodeURIComponent(selectedCalendarIds.join(","))}`
        : ""
    }`;
    fetch(qs, { cache: "no-store", signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (!controller.signal.aborted) {
          setEvents(data.events || []);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setEvents([]);
        }
      });
    return () => controller.abort();
  }, [status, year, selectedCalendarIds]);

  useEffect(() => {
    if (status !== "authenticated") {
      setCalendars([]);
      setSelectedCalendarIds([]);
      // Don't remove selectedCalendarIds from localStorage when signing out
      // so they persist when user signs back in
      return;
    }
    fetch(`/api/calendars`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list = (data.calendars || []) as CalendarListItem[];
        const accs = (data.accounts || []) as LinkedAccount[];
        setCalendars(list);
        if (Array.isArray(accs) && accs.length > 0) {
          setAccounts(accs);
        } else {
          // derive unique accounts from calendars
          const uniq = Array.from(
            new Map(
              list
                .map((c) => ({
                  accountId: c.id.includes("|") ? c.id.split("|")[0] : "",
                  email: c.accountEmail,
                }))
                .filter((x) => x.accountId)
                .map((x) => [x.accountId, x])
            ).values()
          );
          setAccounts(uniq);
        }
        // Handle calendar selection: filter invalid, add new account calendars
        const allIds = list.map((c) => c.id);
        const url =
          typeof window !== "undefined" ? new URL(window.location.href) : null;
        const isLinkingReturn =
          !!url && url.searchParams.get("linkingAccount") === "1";

        if (isLinkingReturn) {
          // Linking return: add calendars from new accounts
          let beforeIds: string[] = [];
          try {
            beforeIds =
              JSON.parse(localStorage.getItem("preLinkAccountIds") || "[]") ||
              [];
          } catch {}
          const beforeSet = new Set(beforeIds);
          const currentAccountIds = Array.from(
            new Set(
              list
                .map((c) => (c.id.includes("|") ? c.id.split("|")[0] : ""))
                .filter(Boolean)
            )
          );
          const newAccountIdSet = new Set(
            currentAccountIds.filter((id) => !beforeSet.has(id))
          );
          const currentFiltered = selectedCalendarIds.filter((id) =>
            allIds.includes(id)
          );
          const toAdd = list
            .filter((c) => {
              const accId = c.id.includes("|") ? c.id.split("|")[0] : "";
              return accId && newAccountIdSet.has(accId);
            })
            .map((c) => c.id);
          const merged = Array.from(new Set([...currentFiltered, ...toAdd]));
          setSelectedCalendarIds(merged);
          // Cleanup
          try {
            localStorage.removeItem("preLinkAccountIds");
          } catch {}
          if (url) {
            url.searchParams.delete("linkingAccount");
            history.replaceState({}, "", url.toString());
          }
        } else {
          // Normal load: filter invalid calendars and add new account calendars
          const validCurrent = selectedCalendarIds.filter((id) =>
            allIds.includes(id)
          );

          // Check for new accounts
          const currentAccIds = new Set(
            validCurrent
              .map((id) => (id.includes("|") ? id.split("|")[0] : ""))
              .filter(Boolean)
          );
          const allAccIds = Array.from(
            new Set(
              list
                .map((c) => (c.id.includes("|") ? c.id.split("|")[0] : ""))
                .filter(Boolean)
            )
          );
          const newAccIds = allAccIds.filter((id) => !currentAccIds.has(id));

          if (preferencesLoaded.current) {
            // Preferences loaded - filter invalid and add new accounts
            if (newAccIds.length > 0) {
              const toAdd = list
                .filter((c) => {
                  const accId = c.id.includes("|") ? c.id.split("|")[0] : "";
                  return accId && newAccIds.includes(accId);
                })
                .map((c) => c.id);
              const merged = Array.from(new Set([...validCurrent, ...toAdd]));
              if (
                merged.length !== selectedCalendarIds.length ||
                !merged.every((id) => selectedCalendarIds.includes(id))
              ) {
                setSelectedCalendarIds(merged);
              }
            } else {
              // Just filter invalid calendars
              if (
                validCurrent.length !== selectedCalendarIds.length ||
                !validCurrent.every((id) => selectedCalendarIds.includes(id))
              ) {
                setSelectedCalendarIds(validCurrent);
              }
            }
          } else {
            // Preferences not loaded yet - first time user, auto-select all
            setSelectedCalendarIds(allIds);
          }
        }

        // Update calendar colors (merge with existing, add defaults for new calendars)
        const next: Record<string, string> = { ...calendarColors };
        for (const c of list) {
          if (!next[c.id]) {
            next[c.id] = c.backgroundColor || "#cbd5e1";
          }
        }
        if (JSON.stringify(next) !== JSON.stringify(calendarColors)) {
          setCalendarColors(next);
        }
      })
      .catch(() => {
        setCalendars([]);
        setSelectedCalendarIds([]);
        setCalendarColors({});
      });
  }, [status]);

  useEffect(() => {
    if (!createOpen) {
      // Clear date when dialog closes so it doesn't persist
      setCreateStartDate("");
      createDateFromDayClick.current = null;
      return;
    }
    setCreateError("");
    setCreateTitle("");
    setCreateHasEndDate(false);
    setCreateEndDate("");
    // Use date from day click if available, otherwise use default
    if (createDateFromDayClick.current) {
      setCreateStartDate(createDateFromDayClick.current);
      createDateFromDayClick.current = null;
    } else {
      const now = new Date();
      const defaultDate =
        now.getFullYear() === year ? now : new Date(year, 0, 1);
      setCreateStartDate(isoDateOnlyFromDate(defaultDate));
    }
    // Prefer a writable primary calendar; else first writable; else first overall.
    const primaryWritable = writableCalendars.find((c) => c.primary)?.id;
    const firstWritable = writableCalendars[0]?.id;
    const firstAny = calendars[0]?.id;
    setCreateCalendarId(primaryWritable || firstWritable || firstAny || "");
  }, [createOpen, calendars, writableCalendars, year]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && createOpen && !createSubmitting) {
        setCreateOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [createOpen, createSubmitting]);

  // Persist preferences to server whenever they change
  useEffect(() => {
    if (status === "authenticated" && preferencesLoaded.current) {
      // Debounce API calls to avoid too many requests
      const timeoutId = setTimeout(() => {
        fetch("/api/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedCalendarIds,
            hiddenEventIds,
            showDaysOfWeek,
            showHidden,
            calendarColors,
          }),
        }).catch((err) => {
          console.error("Failed to save preferences:", err);
        });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [
    status,
    selectedCalendarIds,
    hiddenEventIds,
    showDaysOfWeek,
    showHidden,
    calendarColors,
  ]);

  const onPrev = () => setYear((y) => y - 1);
  const onNext = () => setYear((y) => y + 1);
  const onRefresh = async () => {
    if (status !== "authenticated") {
      setEvents([]);
      return;
    }
    try {
      setIsRefreshing(true);
      // 1) Reload calendars from all linked accounts
      const calendarsRes = await fetch(`/api/calendars`, { cache: "no-store" });
      const calendarsData = await calendarsRes.json();
      const newCalendars = (calendarsData.calendars || []) as {
        id: string;
        summary: string;
        primary?: boolean;
        backgroundColor?: string;
        accountEmail?: string;
      }[];
      setCalendars(newCalendars);
      // Keep existing selection; don't auto-select new calendars
      const allIds = newCalendars.map((c) => c.id);
      const mergedSelected = selectedCalendarIds.filter((id) =>
        allIds.includes(id)
      );
      setSelectedCalendarIds(mergedSelected);
      // Merge default colors for any new calendars
      const nextColors: Record<string, string> = { ...calendarColors };
      for (const c of newCalendars) {
        if (!nextColors[c.id])
          nextColors[c.id] = c.backgroundColor || "#cbd5e1";
      }
      setCalendarColors(nextColors);
      // 2) Reload events for the current year using the merged selection
      const qs = `/api/events?year=${year}${
        mergedSelected.length
          ? `&calendarIds=${encodeURIComponent(mergedSelected.join(","))}`
          : ""
      }`;
      const eventsRes = await fetch(qs, { cache: "no-store" });
      const eventsData = await eventsRes.json();
      setEvents(eventsData.events || []);
    } catch {
      // keep existing events on failure
    } finally {
      setIsRefreshing(false);
    }
  };
  const disconnectAccount = async (accountId: string) => {
    try {
      await fetch("/api/accounts/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      await onRefresh();
    } catch {
      // ignore
    }
  };

  const onCreateEvent = async () => {
    if (status !== "authenticated") return;
    setCreateError("");
    if (!createTitle.trim()) {
      setCreateError("Title is required.");
      return;
    }
    if (!createStartDate) {
      setCreateError("Date is required.");
      return;
    }
    if (!createCalendarId) {
      setCreateError("Calendar is required.");
      return;
    }
    if (createHasEndDate && createEndDate && createEndDate < createStartDate) {
      setCreateError("End date must be on/after start date.");
      return;
    }
    try {
      setCreateSubmitting(true);
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createTitle.trim(),
          startDate: createStartDate,
          endDate: createHasEndDate
            ? createEndDate || createStartDate
            : undefined,
          calendarId: createCalendarId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError((data && data.error) || "Failed to create event.");
        return;
      }
      setCreateOpen(false);
      await onRefresh();
    } catch {
      setCreateError("Failed to create event.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="grid grid-cols-3 items-center p-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
            disabled={status !== "authenticated"}
            className="text-2xl p-2 hover:bg-transparent"
          >
            ☰
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-transparent"
            onClick={onPrev}
            aria-label="Previous year"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="font-semibold text-lg min-w-[5ch] text-center leading-none">
            {year}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-transparent"
            onClick={onNext}
            aria-label="Next year"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            className="gap-2 rounded-full justify-center"
            onClick={() => setCreateOpen(true)}
            disabled={status !== "authenticated"}
            aria-label="Create event"
            title={
              status === "authenticated"
                ? "Create event"
                : "Sign in to create events"
            }
          >
            <Plus className="h-4 w-4" />
            <span>Create event</span>
          </Button>
        </div>
      </div>
      {createOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/60 z-40"
            onClick={() => {
              if (!createSubmitting) {
                setCreateOpen(false);
              }
            }}
            aria-hidden
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            role="dialog"
            aria-label="Create event"
          >
            <div
              className="w-full max-w-md rounded-md border bg-card shadow-lg pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <div className="font-semibold">Create event</div>
                <button
                  className="text-muted-foreground hover:text-foreground flex-shrink-0 ml-2"
                  onClick={() =>
                    createSubmitting ? null : setCreateOpen(false)
                  }
                  aria-label="Close"
                  disabled={createSubmitting}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-4 pt-2 pb-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Title</label>
                  <input
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="Event title"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    disabled={createSubmitting}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Date</label>
                  <input
                    type="date"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={createStartDate}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCreateStartDate(v);
                      if (
                        createHasEndDate &&
                        createEndDate &&
                        v &&
                        createEndDate < v
                      ) {
                        setCreateEndDate(v);
                      }
                    }}
                    disabled={createSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={createHasEndDate}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setCreateHasEndDate(on);
                        if (on && !createEndDate)
                          setCreateEndDate(createStartDate);
                        if (!on) setCreateEndDate("");
                      }}
                      disabled={createSubmitting}
                    />
                    <span className="font-medium">Add end date</span>
                  </label>
                  {createHasEndDate && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">End date</label>
                      <input
                        type="date"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={createEndDate}
                        min={createStartDate || undefined}
                        onChange={(e) => setCreateEndDate(e.target.value)}
                        disabled={createSubmitting}
                      />
                      <div className="text-xs text-muted-foreground">
                        End date is inclusive (we’ll convert it correctly for
                        Google Calendar).
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Calendar</label>
                  <Select
                    value={createCalendarId}
                    onValueChange={setCreateCalendarId}
                    disabled={createSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a calendar" />
                    </SelectTrigger>
                    <SelectContent>
                      {writableCalendars.length > 0
                        ? writableAccountsWithCalendars.map(
                            ({ accountId, email, list }) => (
                              <SelectGroup key={accountId || email}>
                                <SelectLabel>
                                  {email && email.length
                                    ? email
                                    : accountId || "Account"}
                                </SelectLabel>
                                {list.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.summary}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            )
                          )
                        : calendars.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {(c.accountEmail ? `${c.accountEmail} — ` : "") +
                                c.summary}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                  {writableCalendars.length === 0 && calendars.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      No writable calendars found; creating may fail on
                      read-only calendars.
                    </div>
                  )}
                </div>
                {createError && (
                  <div className="text-sm text-destructive">{createError}</div>
                )}
              </div>
              <div className="p-4 border-t flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  disabled={createSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={onCreateEvent}
                  disabled={createSubmitting || status !== "authenticated"}
                >
                  {createSubmitting ? "Creating…" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/60 z-40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] bg-card border-r shadow-lg flex flex-col"
            role="dialog"
            aria-label="Menu"
          >
            <div className="p-3 border-b flex items-center justify-between relative">
              <div className="font-semibold">Calendars</div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-foreground flex items-center justify-center"
                  aria-label="Refresh events"
                  title={isRefreshing ? "Refreshing…" : "Refresh events"}
                  onClick={onRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
                {status === "authenticated" && (
                  <div className="relative flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-foreground flex items-center justify-center"
                      aria-label="Settings"
                      title="Settings"
                      onClick={() =>
                        setSettingsDropdownOpen(!settingsDropdownOpen)
                      }
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    {settingsDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setSettingsDropdownOpen(false)}
                          aria-hidden
                        />
                        <div className="absolute right-0 top-full mt-1 w-56 bg-card border rounded-md shadow-lg z-20 p-2 space-y-2">
                          <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent p-2 rounded">
                            <input
                              type="checkbox"
                              className="accent-foreground"
                              checked={showDaysOfWeek}
                              onChange={(e) =>
                                setShowDaysOfWeek(e.target.checked)
                              }
                            />
                            <span>Show days of week</span>
                          </label>
                          {hiddenEventIds.length > 0 && (
                            <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent p-2 rounded">
                              <input
                                type="checkbox"
                                className="accent-foreground"
                                checked={showHidden}
                                onChange={(e) =>
                                  setShowHidden(e.target.checked)
                                }
                              />
                              <span>Show hidden events</span>
                            </label>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-auto p-2 space-y-1">
              {status === "authenticated" ? (
                accountsWithCalendars.map(({ accountId, email, list }) => (
                  <div key={accountId || email} className="space-y-1">
                    <div className="px-2 pt-3 pb-1 flex items-center justify-between">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {email && email.length ? email : accountId || "Account"}
                      </div>
                      {true && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-foreground"
                          aria-label={`Disconnect ${email}`}
                          title={`Disconnect ${email}`}
                          onClick={() => {
                            disconnectAccount(accountId);
                          }}
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {list.map((c) => {
                      const checked = selectedCalendarIds.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          className="flex items-center gap-2 text-sm p-2 rounded hover:bg-accent"
                        >
                          <input
                            type="checkbox"
                            className="accent-foreground"
                            checked={checked}
                            onChange={(e) => {
                              setSelectedCalendarIds((prev) =>
                                e.target.checked
                                  ? [...prev, c.id]
                                  : prev.filter((id) => id !== c.id)
                              );
                            }}
                          />
                          <span className="truncate flex-1">{c.summary}</span>
                          {c.primary && (
                            <span className="text-[10px] text-muted-foreground">
                              primary
                            </span>
                          )}
                          <input
                            type="color"
                            value={calendarColors[c.id] || "#cbd5e1"}
                            onChange={(e) => {
                              const next = {
                                ...calendarColors,
                                [c.id]: e.target.value,
                              };
                              setCalendarColors(next);
                              try {
                                localStorage.setItem(
                                  "calendarColors",
                                  JSON.stringify(next)
                                );
                              } catch {}
                            }}
                            className="h-5 w-5 rounded border p-0"
                            aria-label={`Color for ${c.summary}`}
                            title={`Color for ${c.summary}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground p-2">
                  Sign in to manage calendars.
                </div>
              )}
              {status === "authenticated" && calendars.length === 0 && (
                <div className="text-sm text-muted-foreground p-2">
                  No calendars
                </div>
              )}
              {status === "authenticated" && (
                <div className="px-2 py-3">
                  <Button
                    variant="outline"
                    className="w-full justify-center gap-2 rounded-full"
                    onClick={() => {
                      // Persist existing accountIds so we can auto-add the new account's calendars after linking
                      try {
                        const existing = Array.from(
                          new Set(accounts.map((a) => a.accountId))
                        ).filter(Boolean);
                        localStorage.setItem(
                          "preLinkAccountIds",
                          JSON.stringify(existing)
                        );
                      } catch {}
                      import("next-auth/react").then(({ signIn }) => {
                        const href = window.location.href;
                        const hasQuery = href.includes("?");
                        const callbackUrl = `${href}${
                          hasQuery ? "&" : "?"
                        }linkingAccount=1`;
                        signIn("google", { callbackUrl });
                      });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Google account</span>
                  </Button>
                </div>
              )}
            </div>
            <div className="p-3 border-t">
              {status === "authenticated" ? (
                <Button
                  className="w-full justify-center gap-2 rounded-full"
                  variant="outline"
                  onClick={() => {
                    setSidebarOpen(false);
                    signOut();
                  }}
                >
                  Sign out
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => {
                    setSidebarOpen(false);
                    signIn("google");
                  }}
                >
                  Sign in with Google
                </Button>
              )}
            </div>
          </aside>
        </>
      )}
      <div className="flex-1 min-h-0">
        <YearCalendar
          year={year}
          events={visibleEvents}
          signedIn={status === "authenticated"}
          calendarColors={calendarColors}
          calendarNames={calendarNames}
          calendarAccounts={calendarAccounts}
          writableCalendars={writableCalendars}
          writableAccountsWithCalendars={writableAccountsWithCalendars}
          showDaysOfWeek={showDaysOfWeek}
          onDayClick={(dateKey) => {
            if (status === "authenticated") {
              createDateFromDayClick.current = dateKey;
              setCreateOpen(true);
            }
          }}
          onUpdateEvent={async (event) => {
            try {
              await fetch("/api/events", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: event.id,
                  title: event.title,
                  calendarId: event.calendarId,
                  startDate: event.startDate,
                  endDate: event.endDate,
                }),
              });
            } catch {}
            await onRefresh();
          }}
          onDeleteEvent={async (id) => {
            try {
              await fetch("/api/events", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
              });
            } catch {}
            await onRefresh();
          }}
          onHideEvent={(id) => {
            setHiddenEventIds((prev) =>
              prev.includes(id) ? prev : [...prev, id]
            );
          }}
        />
      </div>
    </div>
  );
}
