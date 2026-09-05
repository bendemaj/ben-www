import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { seedCourses } from "@/lib/uni/seed";
import { GRADE_OPTIONS, type Course } from "@/lib/uni/types";

type NeonSql = ReturnType<typeof neon>;

interface CourseRow {
  id: string;
  name: string;
  credits: string | number;
  semester: string;
  status: Course["status"];
  grade: string | null;
  exam_date: string | null;
  examiner: string | null;
}

let sqlClient: NeonSql | null = null;
let setupPromise: Promise<void> | null = null;
let seedPromise: Promise<void> | null = null;

export function isUniDatabaseConfigured() {
  return Boolean(getDatabaseUrl());
}

function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "";
}

function getSql() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  sqlClient ??= neon(databaseUrl);
  return sqlClient;
}

async function ensureDatabase() {
  setupPromise ??= createSchema();

  try {
    await setupPromise;
  } catch (error) {
    setupPromise = null;
    throw error;
  }
}

async function createSchema() {
  const sql = getSql();

  await sql`create extension if not exists pgcrypto`;
  await sql`
    create table if not exists uni_courses (
      id text primary key default gen_random_uuid()::text,
      name text not null,
      credits numeric(6, 2) not null,
      semester text not null,
      status text not null check (status in ('done', 'pending')),
      grade text,
      exam_date text,
      examiner text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await sql`
    create or replace function set_uni_courses_updated_at()
    returns trigger
    language plpgsql
    as $$
    begin
      new.updated_at = now();
      return new;
    end;
    $$
  `;
  await sql`drop trigger if exists uni_courses_set_updated_at on uni_courses`;
  await sql`
    create trigger uni_courses_set_updated_at
    before update on uni_courses
    for each row
    execute function set_uni_courses_updated_at()
  `;
}

async function seedIfEmpty() {
  seedPromise ??= (async () => {
    const sql = getSql();
    const rows = (await sql`select count(*)::int as count from uni_courses`) as Array<{
      count: number;
    }>;
    const count = Number(rows[0]?.count ?? 0);

    if (count > 0) return;

    for (const course of seedCourses) {
      await sql`
        insert into uni_courses (id, name, credits, semester, status, grade, exam_date, examiner)
        values (
          ${course.id},
          ${course.name},
          ${course.credits},
          ${course.semester},
          ${course.status},
          ${course.grade},
          ${course.examDate},
          ${course.examiner}
        )
        on conflict (id) do nothing
      `;
    }
  })();

  try {
    await seedPromise;
  } catch (error) {
    seedPromise = null;
    throw error;
  }
}

export async function listUniCourses() {
  await ensureDatabase();
  await seedIfEmpty();

  const rows = (await getSql()`
    select id, name, credits, semester, status, grade, exam_date, examiner
    from uni_courses
    order by semester asc, name asc
  `) as CourseRow[];

  return rows.map(fromCourseRow);
}

export async function saveUniCourse(course: Course) {
  await ensureDatabase();

  const rows = (await getSql()`
    insert into uni_courses (id, name, credits, semester, status, grade, exam_date, examiner)
    values (
      ${course.id || randomUUID()},
      ${course.name},
      ${course.credits},
      ${course.semester},
      ${course.status},
      ${course.grade},
      ${course.examDate},
      ${course.examiner}
    )
    on conflict (id) do update set
      name = excluded.name,
      credits = excluded.credits,
      semester = excluded.semester,
      status = excluded.status,
      grade = excluded.grade,
      exam_date = excluded.exam_date,
      examiner = excluded.examiner
    returning id, name, credits, semester, status, grade, exam_date, examiner
  `) as CourseRow[];

  return fromCourseRow(rows[0]);
}

export async function deleteUniCourse(courseId: string) {
  await ensureDatabase();
  await getSql()`delete from uni_courses where id = ${courseId}`;
}

export function parseCourseInput(input: unknown, fallbackId?: string): Course {
  if (!input || typeof input !== "object") {
    throw new Error("Course payload is missing.");
  }

  const payload = input as Record<string, unknown>;
  const name = cleanString(payload.name);
  const semester = cleanString(payload.semester).toUpperCase();
  const credits = Number(payload.credits);
  const status = payload.status === "done" ? "done" : "pending";
  const grade = cleanGrade(payload.grade);

  if (!name) throw new Error("Course name is required.");
  if (!semester) throw new Error("Semester is required.");
  if (!Number.isFinite(credits) || credits <= 0) {
    throw new Error("Credits must be a positive number.");
  }

  return {
    id: fallbackId || cleanString(payload.id) || randomUUID(),
    name,
    credits,
    semester,
    status,
    grade: status === "done" ? grade : null,
    examDate: cleanString(payload.examDate) || null,
    examiner: cleanString(payload.examiner) || null,
  };
}

function fromCourseRow(row: CourseRow): Course {
  return {
    id: row.id,
    name: row.name,
    credits: Number(row.credits),
    semester: row.semester,
    status: row.status,
    grade: row.grade,
    examDate: row.exam_date,
    examiner: row.examiner,
  };
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanGrade(value: unknown) {
  const grade = cleanString(value);
  return GRADE_OPTIONS.includes(grade as (typeof GRADE_OPTIONS)[number]) ? grade : null;
}
