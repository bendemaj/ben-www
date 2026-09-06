"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  dayLabel,
  formatClock,
  formatDuration,
  formatTimeOfDay,
} from "@/lib/tick/format";
import type { RunningTimer, TimeEntry } from "@/lib/tick/types";
import { EntryForm, type EntryFormValue } from "@/components/tick/entry-form";

interface TimerViewProps {
  entries: TimeEntry[];
  running: RunningTimer | null;
  elapsed: number;
  onStart: (tag: string) => void;
  onStop: () => void;
  onAddManual: (value: EntryFormValue) => void;
  onUpdate: (id: string, value: EntryFormValue) => void;
  onDelete: (id: string) => void;
}

export function TimerView({
  entries,
  running,
  elapsed,
  onStart,
  onStop,
  onAddManual,
  onUpdate,
  onDelete,
}: TimerViewProps) {
  const [tag, setTag] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, TimeEntry[]>();

    for (const entry of entries) {
      const label = dayLabel(entry.start);
      const list = map.get(label);
      if (list) list.push(entry);
      else map.set(label, [entry]);
    }

    return Array.from(map.entries());
  }, [entries]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (running) {
      onStop();
      return;
    }

    if (!tag.trim()) return;
    onStart(tag);
    setTag("");
  }

  return (
    <div className="space-y-7">
      <section aria-label="Timer">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2">
            <span aria-hidden className="select-none font-mono text-faint dark:text-faint-dark">
              {">"}
            </span>
            <input
              value={running ? running.tag : tag}
              onChange={(event) => setTag(event.target.value)}
              disabled={Boolean(running)}
              placeholder="what are you working on?"
              aria-label="Task tag"
              className="w-full bg-transparent font-mono text-sm text-ink outline-none placeholder:text-faint disabled:opacity-100 dark:text-ink-dark dark:placeholder:text-faint-dark"
            />
          </div>

          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3 dark:border-line-dark">
            <span
              className={`font-mono text-4xl tabular-nums tracking-tight ${
                running ? "text-ink dark:text-ink-dark" : "text-faint/60 dark:text-faint-dark/60"
              }`}
            >
              {formatClock(elapsed)}
            </span>
            <button
              type="submit"
              disabled={!running && !tag.trim()}
              className="font-mono text-xs uppercase text-ink transition-opacity disabled:cursor-not-allowed disabled:text-faint hover:opacity-70 dark:text-ink-dark dark:disabled:text-faint-dark"
            >
              {running ? "stop" : "start"}
            </button>
          </div>
        </form>

        {adding ? (
          <EntryForm
            submitLabel="add"
            onSubmit={(value) => {
              onAddManual(value);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setAdding(true);
            }}
            className="mt-3 font-mono text-[0.7rem] uppercase text-faint underline decoration-line underline-offset-4 hover:text-ink dark:text-faint-dark dark:decoration-line-dark dark:hover:text-ink-dark"
          >
            add manually
          </button>
        )}
      </section>

      <section aria-label="Logged entries" className="space-y-5">
        {entries.length === 0 ? (
          <p className="font-mono text-xs leading-relaxed text-faint dark:text-faint-dark">
            No entries yet. Type a task above and press start.
          </p>
        ) : (
          groups.map(([label, list]) => {
            const total = list.reduce((sum, entry) => sum + entry.duration, 0);

            return (
              <div key={label} className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-mono text-[0.7rem] uppercase text-faint dark:text-faint-dark">
                    {label}
                  </h2>
                  <span className="font-mono text-[0.7rem] tabular-nums text-faint dark:text-faint-dark">
                    {formatDuration(total)}
                  </span>
                </div>
                <ul>
                  {list.map((entry) =>
                    editingId === entry.id ? (
                      <li key={entry.id}>
                        <EntryForm
                          initial={{
                            tag: entry.tag,
                            start: entry.start,
                            duration: entry.duration,
                          }}
                          submitLabel="save"
                          onSubmit={(value) => {
                            onUpdate(entry.id, value);
                            setEditingId(null);
                          }}
                          onCancel={() => setEditingId(null)}
                        />
                      </li>
                    ) : (
                      <li
                        key={entry.id}
                        className="group flex items-baseline justify-between gap-3 border-t border-line/80 py-2 dark:border-line-dark"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setAdding(false);
                            setEditingId(entry.id);
                          }}
                          className="flex min-w-0 flex-1 items-baseline gap-3 text-left"
                          aria-label={`Edit ${entry.tag} entry`}
                        >
                          <span className="truncate text-sm text-ink group-hover:underline group-hover:underline-offset-4 dark:text-ink-dark">
                            {entry.tag}
                          </span>
                          <span className="shrink-0 font-mono text-[0.7rem] tabular-nums text-faint dark:text-faint-dark">
                            {formatTimeOfDay(entry.start)}
                          </span>
                        </button>
                        <div className="flex shrink-0 items-baseline gap-3">
                          <span className="font-mono text-sm tabular-nums text-ink dark:text-ink-dark">
                            {formatDuration(entry.duration)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDelete(entry.id)}
                            aria-label={`Delete ${entry.tag} entry`}
                            className="font-mono text-xs text-faint opacity-70 transition-opacity hover:text-ink focus:opacity-100 group-hover:opacity-100 dark:text-faint-dark dark:hover:text-ink-dark sm:opacity-0"
                          >
                            x
                          </button>
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
