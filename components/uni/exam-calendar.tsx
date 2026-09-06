"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseExamDate } from "@/lib/uni/stats";
import type { Course } from "@/lib/uni/types";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function ExamCalendar({ courses, isSaving, onEdit }: {
  courses: Course[];
  isSaving: boolean;
  onEdit: (course: Course) => void;
}) {
  const exams = useMemo(() => courses.flatMap((course) => {
    const date = parseExamDate(course.examDate);
    return date ? [{ course, date }] : [];
  }).sort((a, b) => a.date.getTime() - b.date.getTime()), [courses]);
  const [chosenMonth, setChosenMonth] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const month = chosenMonth ?? monthKey(exams.at(-1)?.date ?? new Date());
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(year, monthNumber - 1, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(year, monthNumber, 0).getDate();
  const monthExams = exams.filter((exam) => monthKey(exam.date) === month);
  const visibleExams = monthExams.filter((exam) => selectedDay === null || exam.date.getDate() === selectedDay);
  const today = new Date();
  const missingDates = courses.length - exams.length;
  const firstYear = Math.min(exams[0]?.date.getFullYear() ?? year, today.getFullYear(), year) - 5;
  const lastYear = Math.max(exams.at(-1)?.date.getFullYear() ?? year, today.getFullYear(), year) + 5;

  function changeMonth(value: string) {
    if (!/^\d{4}-\d{2}$/.test(value)) return;
    setChosenMonth(value);
    setSelectedDay(null);
  }

  function moveMonth(offset: number) {
    changeMonth(monthKey(new Date(year, monthNumber - 1 + offset, 1)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          <button type="button" aria-label="Previous month" title="Previous month" onClick={() => moveMonth(-1)} className={navigationClass}>
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <select aria-label="Exam month" value={monthNumber} onChange={(event) => changeMonth(monthKey(new Date(year, Number(event.target.value) - 1, 1)))} className={`${selectClass} w-24`}>
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index} value={index + 1}>{new Date(2026, index, 1).toLocaleDateString("en-GB", { month: "short" })}</option>
            ))}
          </select>
          <select aria-label="Exam year" value={year} onChange={(event) => changeMonth(monthKey(new Date(Number(event.target.value), monthNumber - 1, 1)))} className={`${selectClass} w-20`}>
            {Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button type="button" aria-label="Next month" title="Next month" onClick={() => moveMonth(1)} className={navigationClass}>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
        <button type="button" onClick={() => changeMonth(monthKey(today))}
          className="h-10 text-sm text-ink underline underline-offset-4 dark:text-ink-dark">Today</button>
      </div>
      <h3 aria-live="polite" className="font-medium text-ink dark:text-ink-dark">
        {first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        <span className="ml-2 text-sm font-normal text-faint dark:text-faint-dark">{monthExams.length} exams</span>
      </h3>
      <div className="grid grid-cols-7 gap-px overflow-hidden border border-line bg-line dark:border-line-dark dark:bg-line-dark">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="bg-paper py-2 text-center text-xs dark:bg-paper-dark">{day}</div>
        ))}
        {Array.from({ length: 42 }, (_, index) => {
          const day = index - offset + 1;
          const inMonth = day > 0 && day <= days;
          const dayExams = inMonth ? monthExams.filter((exam) => exam.date.getDate() === day) : [];
          const isToday = inMonth && monthKey(today) === month && today.getDate() === day;
          return inMonth ? (
            <button key={index} type="button" aria-pressed={selectedDay === day}
              aria-label={`${day} ${first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}, ${dayExams.length} exams`}
              onClick={() => setSelectedDay(selectedDay === day ? null : day)}
              className={`flex h-16 min-w-0 flex-col items-center justify-center gap-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-[-2px] sm:h-20 ${selectedDay === day ? "bg-ink text-paper dark:bg-ink-dark dark:text-paper-dark" : "bg-paper text-ink hover:bg-line/50 dark:bg-paper-dark dark:text-ink-dark dark:hover:bg-line-dark/50"}`}>
              <span className={`font-mono ${isToday ? "underline underline-offset-4" : ""}`}>{day}</span>
              <span className="flex h-3 items-center gap-1" aria-hidden="true">
                {dayExams.slice(0, 3).map(({ course }) => (
                  <span key={course.id} className={`h-1.5 w-1.5 rounded-full ${course.status === "done" ? "bg-emerald-600 dark:bg-emerald-400" : "bg-amber-600 dark:bg-amber-400"}`} />
                ))}
              </span>
            </button>
          ) : <div key={index} className="h-16 bg-paper/60 dark:bg-paper-dark/60 sm:h-20" />;
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-faint dark:text-faint-dark">
        <span>{selectedDay === null ? "Exams this month" : `Exams on ${selectedDay} ${first.toLocaleDateString("en-GB", { month: "short" })}`}</span>
        {selectedDay !== null && <button type="button" onClick={() => setSelectedDay(null)} className="underline underline-offset-4">All days</button>}
      </div>
      {visibleExams.length ? (
        <ul className="divide-y divide-line border-y border-line dark:divide-line-dark dark:border-line-dark">
          {visibleExams.map(({ course, date }) => (
            <li key={course.id} className="flex items-start gap-3 py-3">
              <time className="w-14 shrink-0 pt-0.5 font-mono text-sm" dateTime={`${month}-${String(date.getDate()).padStart(2, "0")}`}>
                {date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
              </time>
              <div className="min-w-0">
                <button type="button" disabled={isSaving} onClick={() => onEdit(course)}
                  className="break-words text-left text-sm text-ink underline decoration-line underline-offset-4 disabled:opacity-50 dark:text-ink-dark dark:decoration-line-dark">{course.name}</button>
                <p className="mt-1 text-sm text-faint dark:text-faint-dark">
                  {course.status === "done" ? "Done" : "Pending"} · {course.credits} ECTS · {course.grade || "-"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="py-5 text-center text-sm text-faint dark:text-faint-dark">No exams {selectedDay === null ? "this month" : "on this day"}.</p>}
      {missingDates > 0 && <p className="text-sm text-faint dark:text-faint-dark">{missingDates} {missingDates === 1 ? "course without a valid exam date" : "courses without a valid exam date"}</p>}
    </div>
  );
}

const navigationClass = "flex h-11 w-11 shrink-0 items-center justify-center rounded text-ink transition-colors hover:bg-line/50 focus-visible:outline-2 dark:text-ink-dark dark:hover:bg-line-dark/50";
const selectClass = "h-11 min-w-0 rounded border border-line bg-paper px-2 text-sm text-ink focus-visible:outline-2 dark:border-line-dark dark:bg-paper-dark dark:text-ink-dark";
