"use client";

import { useState } from "react";
import Link from "next/link";
import { StatsView } from "@/components/tick/stats-view";
import { TimerView } from "@/components/tick/timer-view";
import { useTimeTracker } from "@/components/tick/use-time-tracker";

type Tab = "track" | "stats";

export function TickApp({ isProtected = false }: { isProtected?: boolean }) {
  const [tab, setTab] = useState<Tab>("track");
  const {
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
  } = useTimeTracker();

  async function handleLogout() {
    await fetch("/api/tick/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="mx-auto max-w-md space-y-8 font-mono text-sm text-muted dark:text-muted-dark">
      <header className="space-y-5 border-b border-line pb-5 dark:border-line-dark">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <Link
              href="/apps"
              className="text-xs text-faint underline decoration-line underline-offset-4 hover:text-ink hover:decoration-current dark:text-faint-dark dark:decoration-line-dark dark:hover:text-ink-dark"
            >
              apps
            </Link>
            <h1 className="text-base font-medium text-ink dark:text-ink-dark">tick</h1>
            <span
              aria-hidden
              className={`inline-block size-1.5 rounded-full ${
                running ? "animate-pulse bg-ink dark:bg-ink-dark" : "bg-line dark:bg-line-dark"
              }`}
            />
          </div>

          <nav className="flex items-center gap-4" aria-label="Views">
            <TabButton active={tab === "track"} onClick={() => setTab("track")}>
              track
            </TabButton>
            <TabButton active={tab === "stats"} onClick={() => setTab("stats")}>
              stats
            </TabButton>
          </nav>
        </div>

        <p className="text-xs leading-relaxed text-faint dark:text-faint-dark">
          {isDatabaseBacked ? syncMessage : "Saved in this browser."}
          {isProtected ? (
            <>
              {" "}
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="underline decoration-line underline-offset-4 hover:text-ink hover:decoration-current dark:decoration-line-dark dark:hover:text-ink-dark"
              >
                lock
              </button>
            </>
          ) : null}
        </p>
      </header>

      {!hydrated ? (
        <p className="text-xs text-faint dark:text-faint-dark">loading...</p>
      ) : tab === "track" ? (
        <TimerView
          entries={entries}
          running={running}
          elapsed={elapsed}
          onStart={start}
          onStop={stop}
          onAddManual={addManualEntry}
          onUpdate={updateEntry}
          onDelete={deleteEntry}
        />
      ) : (
        <StatsView entries={entries} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`font-mono text-xs lowercase transition-colors ${
        active
          ? "text-ink underline underline-offset-4 dark:text-ink-dark"
          : "text-faint hover:text-ink dark:text-faint-dark dark:hover:text-ink-dark"
      }`}
    >
      {children}
    </button>
  );
}
