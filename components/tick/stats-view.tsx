"use client";

import { useMemo } from "react";
import { formatDuration } from "@/lib/tick/format";
import type { TimeEntry } from "@/lib/tick/types";

interface StatsViewProps {
  entries: TimeEntry[];
}

export function StatsView({ entries }: StatsViewProps) {
  const { stats, grandTotal, todayTotal } = useMemo(() => {
    const totals = new Map<string, { total: number; count: number }>();
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    let grand = 0;
    let today = 0;

    for (const entry of entries) {
      const previous = totals.get(entry.tag) ?? { total: 0, count: 0 };
      totals.set(entry.tag, {
        total: previous.total + entry.duration,
        count: previous.count + 1,
      });
      grand += entry.duration;
      if (entry.start >= startOfToday) today += entry.duration;
    }

    const max = Math.max(1, ...Array.from(totals.values()).map((value) => value.total));
    const list = Array.from(totals.entries())
      .map(([tag, value]) => ({
        tag,
        total: value.total,
        count: value.count,
        share: value.total / max,
      }))
      .sort((a, b) => b.total - a.total);

    return { stats: list, grandTotal: grand, todayTotal: today };
  }, [entries]);

  if (entries.length === 0) {
    return (
      <p className="font-mono text-xs leading-relaxed text-faint dark:text-faint-dark">
        No data yet. Track some time and your stats will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-7">
      <section aria-label="Totals" className="grid grid-cols-2 gap-3">
        <Metric label="total" value={formatDuration(grandTotal)} />
        <Metric label="today" value={formatDuration(todayTotal)} />
      </section>

      <section aria-label="Time by task" className="space-y-4">
        <h2 className="font-mono text-[0.7rem] uppercase text-faint dark:text-faint-dark">
          by task
        </h2>
        <ul className="space-y-4">
          {stats.map((stat) => {
            const percent = grandTotal > 0 ? Math.round((stat.total / grandTotal) * 100) : 0;

            return (
              <li key={stat.tag} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm text-ink dark:text-ink-dark">{stat.tag}</span>
                  <span className="shrink-0 font-mono text-sm tabular-nums text-ink dark:text-ink-dark">
                    {formatDuration(stat.total)}
                  </span>
                </div>
                <div className="h-px bg-line dark:bg-line-dark">
                  <div
                    className="h-px bg-ink dark:bg-ink-dark"
                    style={{ width: `${Math.max(2, stat.share * 100)}%` }}
                  />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[0.7rem] tabular-nums text-faint dark:text-faint-dark">
                    {stat.count} {stat.count === 1 ? "session" : "sessions"}
                  </span>
                  <span className="font-mono text-[0.7rem] tabular-nums text-faint dark:text-faint-dark">
                    {percent}%
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <span className="font-mono text-[0.7rem] uppercase text-faint dark:text-faint-dark">
        {label}
      </span>
      <span className="block font-mono text-2xl tabular-nums tracking-tight text-ink dark:text-ink-dark">
        {value}
      </span>
    </div>
  );
}
