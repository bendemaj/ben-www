"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  compareSemesters,
  getCourseStats,
  getGradeDistribution,
  getSemesters,
} from "@/lib/uni/stats";
import { GRADE_OPTIONS, type Course, type CourseFormValues } from "@/lib/uni/types";

interface UniDashboardProps {
  initialCourses: Course[];
  isProtected?: boolean;
}

interface CoursesResponse {
  courses: Course[];
  writable: boolean;
  source: "neon" | "seed";
}

const LOCAL_STORAGE_KEY = "bend-uni-dashboard-courses";

const emptyForm: CourseFormValues = {
  name: "",
  credits: "",
  semester: "",
  status: "pending",
  grade: "",
  examDate: "",
  examiner: "",
};

export function UniDashboard({ initialCourses, isProtected = false }: UniDashboardProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isWritable, setIsWritable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<CourseFormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [semester, setSemester] = useState("all");
  const [status, setStatus] = useState<"all" | Course["status"]>("all");
  const [message, setMessage] = useState("Loading courses");

  useEffect(() => {
    let active = true;

    async function loadCourses() {
      try {
        const response = await fetch("/api/uni/courses", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("The course database did not respond.");
        }

        const data = (await response.json()) as CoursesResponse;
        const localCourses = readLocalCourses();

        if (!active) return;

        setCourses(data.writable ? data.courses : localCourses ?? data.courses);
        setIsWritable(data.writable);
        setMessage(data.writable ? "Synced with Neon" : "Local edits");
      } catch (error) {
        if (!active) return;

        setCourses(readLocalCourses() ?? initialCourses);
        setIsWritable(false);
        setMessage(error instanceof Error ? error.message : "Using local courses");
      } finally {
        if (active) {
          setIsLoaded(true);
        }
      }
    }

    void loadCourses();

    return () => {
      active = false;
    };
  }, [initialCourses]);

  useEffect(() => {
    if (!isLoaded || isWritable) return;
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(courses));
  }, [courses, isLoaded, isWritable]);

  const semesters = useMemo(() => getSemesters(courses), [courses]);
  const stats = useMemo(() => getCourseStats(courses), [courses]);
  const gradeDistribution = useMemo(() => getGradeDistribution(courses), [courses]);
  const editingCourse = useMemo(
    () => courses.find((course) => course.id === editingId) ?? null,
    [courses, editingId],
  );
  const completedPercent =
    stats.totalCredits > 0 ? Math.round((stats.completedCredits / stats.totalCredits) * 100) : 0;

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return courses
      .filter((course) => {
        const matchesSearch =
          !query ||
          course.name.toLowerCase().includes(query) ||
          course.semester.toLowerCase().includes(query) ||
          (course.examiner?.toLowerCase().includes(query) ?? false);
        const matchesSemester = semester === "all" || course.semester === semester;
        const matchesStatus = status === "all" || course.status === status;

        return matchesSearch && matchesSemester && matchesStatus;
      })
      .sort((a, b) => compareSemesters(a.semester, b.semester) || a.name.localeCompare(b.name));
  }, [courses, search, semester, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextCourse = buildCourse(form, editingId);
    if (!nextCourse) {
      setMessage("Name, semester, and positive ECTS are required");
      return;
    }

    setIsSaving(true);

    try {
      if (isWritable) {
        const endpoint = editingId ? `/api/uni/courses/${editingId}` : "/api/uni/courses";
        const response = await fetch(endpoint, {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextCourse),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error || "The course could not be saved.");
        }

        const data = (await response.json()) as { course: Course };
        upsertCourse(data.course);
        setMessage("Saved to Neon");
      } else {
        upsertCourse(nextCourse);
        setMessage("Saved locally");
      }

      resetForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The course could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(course: Course) {
    const confirmed = window.confirm(`Delete "${course.name}"?`);
    if (!confirmed) return;

    setIsSaving(true);

    try {
      if (isWritable) {
        const response = await fetch(`/api/uni/courses/${course.id}`, { method: "DELETE" });
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error || "The course could not be deleted.");
        }
      }

      setCourses((current) => current.filter((item) => item.id !== course.id));
      setMessage(isWritable ? "Deleted from Neon" : "Deleted locally");

      if (editingId === course.id) {
        resetForm();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The course could not be deleted.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/uni/logout", { method: "POST" });
    window.location.reload();
  }

  function upsertCourse(course: Course) {
    setCourses((current) => {
      const exists = current.some((item) => item.id === course.id);
      if (!exists) return [...current, course];
      return current.map((item) => (item.id === course.id ? course : item));
    });
  }

  function startEditing(course: Course) {
    setEditingId(course.id);
    setForm({
      name: course.name,
      credits: String(course.credits),
      semester: course.semester,
      status: course.status,
      grade: course.grade ?? "",
      examDate: course.examDate ?? "",
      examiner: course.examiner ?? "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <div className="app-wide relative left-1/2 w-[calc(100vw-2rem)] max-w-5xl -translate-x-1/2 space-y-8 text-[15px] text-muted dark:text-muted-dark sm:w-[calc(100vw-3rem)]">
      <header className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-line pb-5 dark:border-line-dark sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Link
              href="/apps"
              className="text-sm text-faint underline decoration-line underline-offset-4 hover:text-ink hover:decoration-current dark:text-faint-dark dark:decoration-line-dark dark:hover:text-ink-dark"
            >
              Apps
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-ink-dark">
                Uni Dashboard
              </h1>
              <p className="mt-1 max-w-2xl leading-6">
                Courses, grades, exams, and ECTS progress in one place.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded border border-line px-2 py-1 text-faint dark:border-line-dark dark:text-faint-dark">
              {isWritable ? "Neon" : "Local"}
            </span>
            <span>{isLoaded ? message : "Loading"}</span>
            {isProtected ? (
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="text-faint underline decoration-line underline-offset-4 hover:text-ink hover:decoration-current dark:text-faint-dark dark:decoration-line-dark dark:hover:text-ink-dark"
              >
                Lock
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Completed ECTS" value={formatNumber(stats.completedCredits)} />
        <Stat label="Pending ECTS" value={formatNumber(stats.pendingCredits)} />
        <Stat
          label="Average Grade"
          value={stats.averageGrade ? stats.averageGrade.toFixed(2) : "-"}
        />
        <Stat label="Courses" value={`${stats.completedCourses}/${courses.length}`} />
      </section>

      <section className="space-y-3 border-y border-line py-5 dark:border-line-dark">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-medium uppercase text-faint dark:text-faint-dark">
            Degree Progress
          </h2>
          <span className="font-mono text-sm text-ink dark:text-ink-dark">
            {completedPercent}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-line dark:bg-line-dark">
          <div
            className="h-full bg-ink transition-[width] duration-300 dark:bg-ink-dark"
            style={{ width: `${completedPercent}%` }}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SemesterList semesters={semesters} courses={courses} />
          <GradeDistribution data={gradeDistribution} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-4">
          <div className="grid gap-3 border-b border-line pb-4 dark:border-line-dark sm:grid-cols-[minmax(0,1fr)_150px_130px]">
            <label className="space-y-1">
              <span className="block text-sm text-faint dark:text-faint-dark">Search</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 w-full rounded border border-line bg-paper px-3 text-ink outline-none transition-colors focus:border-ink dark:border-line-dark dark:bg-paper-dark dark:text-ink-dark dark:focus:border-ink-dark"
                placeholder="Course, semester, examiner"
              />
            </label>
            <label className="space-y-1">
              <span className="block text-sm text-faint dark:text-faint-dark">Semester</span>
              <select
                value={semester}
                onChange={(event) => setSemester(event.target.value)}
                className="h-10 w-full rounded border border-line bg-paper px-3 text-ink outline-none focus:border-ink dark:border-line-dark dark:bg-paper-dark dark:text-ink-dark dark:focus:border-ink-dark"
              >
                <option value="all">All</option>
                {semesters.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="block text-sm text-faint dark:text-faint-dark">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as "all" | Course["status"])}
                className="h-10 w-full rounded border border-line bg-paper px-3 text-ink outline-none focus:border-ink dark:border-line-dark dark:bg-paper-dark dark:text-ink-dark dark:focus:border-ink-dark"
              >
                <option value="all">All</option>
                <option value="done">Done</option>
                <option value="pending">Pending</option>
              </select>
            </label>
          </div>

          <CourseList
            courses={filteredCourses}
            isSaving={isSaving}
            onEdit={startEditing}
          />
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 border border-line p-4 dark:border-line-dark"
        >
          <div>
            <h2 className="font-medium text-ink dark:text-ink-dark">
              {editingId ? "Edit Course" : "Add Course"}
            </h2>
            <p className="mt-1 text-sm text-faint dark:text-faint-dark">
              {editingId ? "Update the selected row." : "Add a course to the tracker."}
            </p>
          </div>

          <Field label="Course">
            <input
              required
              value={form.name}
              onChange={(event) => setFormField("name", event.target.value)}
              className={fieldClass}
              placeholder="101.679 VO Mathematik 1"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="ECTS">
              <input
                required
                min="0.1"
                step="0.1"
                type="number"
                value={form.credits}
                onChange={(event) => setFormField("credits", event.target.value)}
                className={fieldClass}
              />
            </Field>
            <Field label="Semester">
              <input
                required
                value={form.semester}
                onChange={(event) => setFormField("semester", event.target.value)}
                className={`${fieldClass} uppercase`}
                placeholder="2026W"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select
                value={form.status}
                onChange={(event) => setFormField("status", event.target.value)}
                className={fieldClass}
              >
                <option value="pending">Pending</option>
                <option value="done">Done</option>
              </select>
            </Field>
            <Field label="Grade">
              <select
                value={form.grade}
                onChange={(event) => setFormField("grade", event.target.value)}
                className={fieldClass}
                disabled={form.status === "pending"}
              >
                <option value="">No grade</option>
                {GRADE_OPTIONS.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Exam Date">
            <input
              value={form.examDate}
              onChange={(event) => setFormField("examDate", event.target.value)}
              className={fieldClass}
              placeholder="15.05.2025"
            />
          </Field>

          <Field label="Examiner">
            <input
              value={form.examiner}
              onChange={(event) => setFormField("examiner", event.target.value)}
              className={fieldClass}
              placeholder="Name"
            />
          </Field>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="h-10 flex-1 rounded bg-ink px-3 text-sm font-medium text-paper transition-opacity disabled:opacity-50 dark:bg-ink-dark dark:text-paper-dark"
            >
              {isSaving ? "Saving" : editingId ? "Save" : "Add"}
            </button>
            {editingId ? (
              <>
                <button
                  type="button"
                  onClick={resetForm}
                  className="h-10 rounded border border-line px-3 text-sm text-ink dark:border-line-dark dark:text-ink-dark"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving || !editingCourse}
                  onClick={() => {
                    if (editingCourse) void handleDelete(editingCourse);
                  }}
                  className="h-10 rounded border border-line px-3 text-sm text-faint disabled:opacity-50 dark:border-line-dark dark:text-faint-dark"
                >
                  Delete
                </button>
              </>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );

  function setFormField(field: keyof CourseFormValues, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "status" && value === "pending" ? { grade: "" } : {}),
    }));
  }
}

function CourseList({
  courses,
  isSaving,
  onEdit,
}: {
  courses: Course[];
  isSaving: boolean;
  onEdit: (course: Course) => void;
}) {
  if (courses.length === 0) {
    return (
      <p className="border border-line px-4 py-6 text-center text-faint dark:border-line-dark dark:text-faint-dark">
        No courses match the current filters.
      </p>
    );
  }

  return (
    <div className="overflow-hidden border border-line dark:border-line-dark">
      <div className="hidden min-w-full overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line text-faint dark:border-line-dark dark:text-faint-dark">
            <tr>
              <th className="px-3 py-3 font-medium">Course</th>
              <th className="px-3 py-3 font-medium">Semester</th>
              <th className="px-3 py-3 text-right font-medium">ECTS</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Grade</th>
              <th className="px-3 py-3 font-medium">Exam</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr
                key={course.id}
                className="border-b border-line last:border-b-0 dark:border-line-dark"
              >
                <td className="max-w-[360px] px-3 py-3">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => onEdit(course)}
                    className="text-left text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-current disabled:opacity-50 dark:text-ink-dark dark:decoration-line-dark"
                  >
                    {course.name}
                  </button>
                  {course.examiner ? (
                    <span className="mt-1 block truncate text-xs text-faint dark:text-faint-dark">
                      {course.examiner}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-3 font-mono">{course.semester}</td>
                <td className="px-3 py-3 text-right font-mono">{formatNumber(course.credits)}</td>
                <td className="px-3 py-3">
                  <StatusBadge status={course.status} />
                </td>
                <td className="px-3 py-3">{displayValue(course.grade)}</td>
                <td className="px-3 py-3">{displayValue(course.examDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line dark:divide-line-dark md:hidden">
        {courses.map((course) => (
          <li key={course.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => onEdit(course)}
                  className="text-left font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-current disabled:opacity-50 dark:text-ink-dark dark:decoration-line-dark"
                >
                  {course.name}
                </button>
                <p className="mt-1 text-sm text-faint dark:text-faint-dark">
                  {course.semester} · {formatNumber(course.credits)} ECTS
                </p>
              </div>
              <StatusBadge status={course.status} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Meta label="Grade" value={displayValue(course.grade)} />
              <Meta label="Exam" value={displayValue(course.examDate)} />
              <Meta label="Examiner" value={displayValue(course.examiner)} wide />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SemesterList({ semesters, courses }: { semesters: string[]; courses: Course[] }) {
  const latest = semesters.at(-1);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-ink dark:text-ink-dark">Semesters</h3>
      <div className="grid gap-2">
        {semesters.map((item) => {
          const semesterCourses = courses.filter((course) => course.semester === item);
          const doneCredits = semesterCourses
            .filter((course) => course.status === "done")
            .reduce((sum, course) => sum + course.credits, 0);
          const totalCredits = semesterCourses.reduce((sum, course) => sum + course.credits, 0);

          return (
            <div key={item} className="grid grid-cols-[64px_1fr_auto] items-center gap-3">
              <span className="font-mono text-sm text-ink dark:text-ink-dark">{item}</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-line dark:bg-line-dark">
                <div
                  className="h-full bg-ink dark:bg-ink-dark"
                  style={{ width: `${totalCredits > 0 ? (doneCredits / totalCredits) * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm text-faint dark:text-faint-dark">
                {item === latest ? "now" : formatNumber(doneCredits)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GradeDistribution({
  data,
}: {
  data: ReturnType<typeof getGradeDistribution>;
}) {
  const max = Math.max(...data.map((entry) => entry.count), 1);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-ink dark:text-ink-dark">Grades</h3>
      <div className="grid gap-2">
        {data.map((entry) => (
          <div key={entry.grade} className="grid grid-cols-[88px_1fr_24px] items-center gap-3">
            <span className="truncate text-sm text-faint dark:text-faint-dark">{entry.label}</span>
            <div className="h-1.5 overflow-hidden rounded-full bg-line dark:bg-line-dark">
              <div
                className="h-full bg-ink/70 dark:bg-ink-dark/70"
                style={{ width: `${(entry.count / max) * 100}%` }}
              />
            </div>
            <span className="text-right font-mono text-sm text-ink dark:text-ink-dark">
              {entry.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line px-4 py-3 dark:border-line-dark">
      <p className="text-sm text-faint dark:text-faint-dark">{label}</p>
      <p className="mt-2 font-mono text-xl text-ink dark:text-ink-dark">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block text-sm text-faint dark:text-faint-dark">{label}</span>
      {children}
    </label>
  );
}

function Meta({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <p className={wide ? "col-span-2" : ""}>
      <span className="block text-xs text-faint dark:text-faint-dark">{label}</span>
      <span className="text-ink dark:text-ink-dark">{value}</span>
    </p>
  );
}

function StatusBadge({ status }: { status: Course["status"] }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded px-2 text-xs font-medium ${
        status === "done"
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
      }`}
    >
      {status === "done" ? "Done" : "Pending"}
    </span>
  );
}

function buildCourse(form: CourseFormValues, editingId: string | null): Course | null {
  const name = form.name.trim();
  const semester = form.semester.trim().toUpperCase();
  const credits = Number(form.credits);

  if (!name || !semester || !Number.isFinite(credits) || credits <= 0) {
    return null;
  }

  return {
    id: editingId ?? crypto.randomUUID(),
    name,
    credits,
    semester,
    status: form.status,
    grade: form.status === "done" && form.grade ? form.grade : null,
    examDate: form.examDate.trim() || null,
    examiner: form.examiner.trim() || null,
  };
}

function readLocalCourses() {
  try {
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as Course[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function displayValue(value: string | null) {
  return value?.trim() || "-";
}

const fieldClass =
  "h-10 w-full rounded border border-line bg-paper px-3 text-ink outline-none transition-colors focus:border-ink disabled:cursor-not-allowed disabled:opacity-50 dark:border-line-dark dark:bg-paper-dark dark:text-ink-dark dark:focus:border-ink-dark";
