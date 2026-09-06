"use client";

import { FormEvent, useState } from "react";
import {
  fromDateTimeInputs,
  toDateInputValue,
  toTimeInputValue,
} from "@/lib/tick/format";

export interface EntryFormValue {
  tag: string;
  start: number;
  duration: number;
}

interface EntryFormProps {
  initial?: EntryFormValue;
  submitLabel: string;
  onSubmit: (value: EntryFormValue) => void;
  onCancel: () => void;
}

export function EntryForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: EntryFormProps) {
  const base = initial?.start ?? Date.now();
  const initialSeconds = initial?.duration ?? 0;
  const [tag, setTag] = useState(initial?.tag ?? "");
  const [date, setDate] = useState(() => toDateInputValue(base));
  const [time, setTime] = useState(() => toTimeInputValue(base));
  const [hours, setHours] = useState(() => String(Math.floor(initialSeconds / 3600)));
  const [minutes, setMinutes] = useState(() =>
    String(Math.floor((initialSeconds % 3600) / 60)),
  );

  const duration = (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60;
  const isValid = tag.trim().length > 0 && duration > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;

    onSubmit({
      tag: tag.trim(),
      start: fromDateTimeInputs(date, time),
      duration,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t border-line py-4 dark:border-line-dark">
      <label className={labelClass}>
        <span>task</span>
        <input
          autoFocus
          value={tag}
          onChange={(event) => setTag(event.target.value)}
          placeholder="what did you work on?"
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          <span>date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span>start</span>
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <div className="space-y-1.5">
        <span className="block font-mono text-[0.7rem] uppercase text-faint dark:text-faint-dark">
          duration
        </span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            aria-label="Hours"
            className={`${inputClass} w-16 tabular-nums`}
          />
          <span className="font-mono text-xs text-faint dark:text-faint-dark">h</span>
          <input
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
            aria-label="Minutes"
            className={`${inputClass} w-16 tabular-nums`}
          />
          <span className="font-mono text-xs text-faint dark:text-faint-dark">m</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!isValid}
          className="font-mono text-xs uppercase text-ink underline decoration-line underline-offset-4 disabled:text-faint dark:text-ink-dark dark:decoration-line-dark dark:disabled:text-faint-dark"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="font-mono text-xs uppercase text-faint underline decoration-line underline-offset-4 hover:text-ink dark:text-faint-dark dark:decoration-line-dark dark:hover:text-ink-dark"
        >
          cancel
        </button>
      </div>
    </form>
  );
}

const labelClass =
  "block space-y-1.5 font-mono text-[0.7rem] uppercase text-faint dark:text-faint-dark";

const inputClass =
  "h-9 w-full rounded border border-line bg-paper px-2.5 font-mono text-sm normal-case text-ink outline-none focus:border-ink dark:border-line-dark dark:bg-paper-dark dark:text-ink-dark dark:focus:border-ink-dark";
