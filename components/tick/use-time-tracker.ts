"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RunningTimer, TimeEntry } from "@/lib/tick/types";

const RUNNING_KEY = "tick.running.v1";
const ENTRIES_KEY = "tick.entries.v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useTimeTracker() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [running, setRunning] = useState<RunningTimer | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isDatabaseBacked, setIsDatabaseBacked] = useState(false);
  const [syncMessage, setSyncMessage] = useState("Loading entries.");
  const [now, setNow] = useState(() => Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runningRef = useRef<RunningTimer | null>(null);
  runningRef.current = running;

  useEffect(() => {
    setRunning(safeParse<RunningTimer | null>(localStorage.getItem(RUNNING_KEY), null));
    let cancelled = false;

    async function loadEntries() {
      try {
        const response = await fetch("/api/tick/time-entries", { cache: "no-store" });

        if (response.status === 503) {
          setEntries(readLocalEntries());
          setIsDatabaseBacked(false);
          setSyncMessage("Saved in this browser.");
          return;
        }

        const payload = (await response.json()) as {
          entries?: TimeEntry[];
          error?: string;
        };

        if (!response.ok) throw new Error(payload.error ?? "Could not load entries.");

        if (!cancelled) {
          setEntries(payload.entries ?? []);
          setIsDatabaseBacked(true);
          setSyncMessage("Saved to Neon.");
        }
      } catch (error) {
        if (!cancelled) {
          setEntries(readLocalEntries());
          setIsDatabaseBacked(false);
          setSyncMessage(error instanceof Error ? error.message : "Saved in this browser.");
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    void loadEntries();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (running) localStorage.setItem(RUNNING_KEY, JSON.stringify(running));
    else localStorage.removeItem(RUNNING_KEY);
  }, [running]);

  useEffect(() => {
    if (!hydrated || isDatabaseBacked) return;
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  }, [entries, hydrated, isDatabaseBacked]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    setNow(Date.now());
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const start = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    setRunning({ tag: trimmed, start: Date.now() });
  }, []);

  const stop = useCallback(async () => {
    const current = runningRef.current;
    if (!current) return;

    const end = Date.now();
    const duration = Math.max(1, Math.round((end - current.start) / 1000));
    const entry: TimeEntry = {
      id: crypto.randomUUID(),
      tag: current.tag,
      start: current.start,
      end,
      duration,
    };

    setEntries((previous) => [entry, ...previous]);
    setRunning(null);

    if (!isDatabaseBacked) return;

    try {
      const saved = await persistEntry("/api/tick/time-entries", entry);
      setEntries((previous) => previous.map((item) => (item.id === entry.id ? saved : item)));
      setSyncMessage("Saved to Neon.");
    } catch (error) {
      setEntries((previous) => previous.filter((item) => item.id !== entry.id));
      setRunning(current);
      setSyncMessage(error instanceof Error ? error.message : "Could not save entry.");
    }
  }, [isDatabaseBacked]);

  const addManualEntry = useCallback(
    async (input: { tag: string; start: number; duration: number }) => {
      const tag = input.tag.trim();
      const duration = Math.max(1, Math.round(input.duration));
      if (!tag) return;

      const entry: TimeEntry = {
        id: crypto.randomUUID(),
        tag,
        start: input.start,
        end: input.start + duration * 1000,
        duration,
      };

      setEntries((previous) => [entry, ...previous].sort(newestFirst));

      if (!isDatabaseBacked) return;

      try {
        const saved = await persistEntry("/api/tick/time-entries", entry);
        setEntries((previous) =>
          previous.map((item) => (item.id === entry.id ? saved : item)).sort(newestFirst),
        );
        setSyncMessage("Saved to Neon.");
      } catch (error) {
        setEntries((previous) => previous.filter((item) => item.id !== entry.id));
        setSyncMessage(error instanceof Error ? error.message : "Could not save entry.");
      }
    },
    [isDatabaseBacked],
  );

  const updateEntry = useCallback(
    async (id: string, patch: { tag: string; start: number; duration: number }) => {
      const tag = patch.tag.trim();
      const duration = Math.max(1, Math.round(patch.duration));
      if (!tag) return;

      const previous = entries;
      const updated = previous
        .map((entry) =>
          entry.id === id
            ? { ...entry, tag, start: patch.start, end: patch.start + duration * 1000, duration }
            : entry,
        )
        .sort(newestFirst);
      const entry = updated.find((item) => item.id === id);

      setEntries(updated);

      if (!isDatabaseBacked || !entry) return;

      try {
        const saved = await persistEntry(`/api/tick/time-entries/${id}`, entry, "PUT");
        setEntries((current) =>
          current.map((item) => (item.id === id ? saved : item)).sort(newestFirst),
        );
        setSyncMessage("Saved to Neon.");
      } catch (error) {
        setEntries(previous);
        setSyncMessage(error instanceof Error ? error.message : "Could not update entry.");
      }
    },
    [entries, isDatabaseBacked],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const previous = entries;
      setEntries((current) => current.filter((entry) => entry.id !== id));

      if (!isDatabaseBacked) return;

      try {
        const response = await fetch(`/api/tick/time-entries/${id}`, { method: "DELETE" });
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) throw new Error(payload?.error ?? "Could not delete entry.");
        setSyncMessage("Saved to Neon.");
      } catch (error) {
        setEntries(previous);
        setSyncMessage(error instanceof Error ? error.message : "Could not delete entry.");
      }
    },
    [entries, isDatabaseBacked],
  );

  const elapsed = running ? Math.max(0, Math.floor((now - running.start) / 1000)) : 0;

  return {
    hydrated,
    entries,
    running,
    elapsed,
    isDatabaseBacked,
    syncMessage,
    start,
    stop,
    addManualEntry,
    updateEntry,
    deleteEntry,
  };
}

async function persistEntry(path: string, entry: TimeEntry, method = "POST") {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  const payload = (await response.json()) as { entry?: TimeEntry; error?: string };

  if (!response.ok || !payload.entry) {
    throw new Error(payload.error ?? "Could not save entry.");
  }

  return payload.entry;
}

function readLocalEntries() {
  return safeParse<TimeEntry[]>(localStorage.getItem(ENTRIES_KEY), []).sort(newestFirst);
}

function newestFirst(a: TimeEntry, b: TimeEntry) {
  return b.start - a.start;
}
