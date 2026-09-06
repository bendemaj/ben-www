import { randomUUID } from "node:crypto";
import { getTickSql } from "@/lib/tick/db";
import type { TimeEntry } from "@/lib/tick/types";

interface TimeEntryRow {
  id: string;
  tag: string;
  start_ms: string | number;
  end_ms: string | number;
  duration_seconds: string | number;
}

export interface TimeEntryInput {
  id?: string;
  tag: string;
  start: number;
  duration: number;
}

let setupPromise: Promise<void> | null = null;

async function ensureTimeEntriesTable() {
  setupPromise ??= (async () => {
    const sql = getTickSql();

    await sql`
      create table if not exists tick_time_entries (
        id text primary key,
        tag text not null,
        start_ms bigint not null,
        end_ms bigint not null,
        duration_seconds integer not null check (duration_seconds > 0),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `;
    await sql`
      create index if not exists tick_time_entries_start_ms_idx
      on tick_time_entries (start_ms desc)
    `;
  })();

  try {
    await setupPromise;
  } catch (error) {
    setupPromise = null;
    throw error;
  }
}

export function validateTimeEntryInput(input: unknown): TimeEntryInput {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid entry payload.");
  }

  const value = input as Partial<TimeEntryInput>;
  const tag = typeof value.tag === "string" ? value.tag.trim() : "";
  const start = Number(value.start);
  const duration = Math.max(1, Math.round(Number(value.duration)));

  if (!tag) throw new Error("Task is required.");
  if (!Number.isFinite(start)) throw new Error("Start time is invalid.");
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Duration is invalid.");
  }

  return {
    id: typeof value.id === "string" && value.id.trim() ? value.id.trim() : randomUUID(),
    tag,
    start,
    duration,
  };
}

export async function listTimeEntries() {
  await ensureTimeEntriesTable();

  const rows = (await getTickSql()`
    select id, tag, start_ms, end_ms, duration_seconds
    from tick_time_entries
    order by start_ms desc
  `) as TimeEntryRow[];

  return rows.map(toTimeEntry);
}

export async function createTimeEntry(input: TimeEntryInput) {
  await ensureTimeEntriesTable();

  const end = input.start + input.duration * 1000;
  const rows = (await getTickSql()`
    insert into tick_time_entries (id, tag, start_ms, end_ms, duration_seconds)
    values (${input.id ?? randomUUID()}, ${input.tag}, ${input.start}, ${end}, ${input.duration})
    returning id, tag, start_ms, end_ms, duration_seconds
  `) as TimeEntryRow[];

  return toTimeEntry(rows[0]);
}

export async function updateTimeEntry(id: string, input: TimeEntryInput) {
  await ensureTimeEntriesTable();

  const end = input.start + input.duration * 1000;
  const rows = (await getTickSql()`
    update tick_time_entries
    set tag = ${input.tag},
        start_ms = ${input.start},
        end_ms = ${end},
        duration_seconds = ${input.duration},
        updated_at = now()
    where id = ${id}
    returning id, tag, start_ms, end_ms, duration_seconds
  `) as TimeEntryRow[];

  return rows[0] ? toTimeEntry(rows[0]) : null;
}

export async function deleteTimeEntry(id: string) {
  await ensureTimeEntriesTable();
  await getTickSql()`delete from tick_time_entries where id = ${id}`;
}

function toTimeEntry(row: TimeEntryRow): TimeEntry {
  return {
    id: row.id,
    tag: row.tag,
    start: Number(row.start_ms),
    end: Number(row.end_ms),
    duration: Number(row.duration_seconds),
  };
}
