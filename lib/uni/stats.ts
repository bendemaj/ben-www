import { GRADE_MAP, type Course, type CourseStats } from "@/lib/uni/types";

export interface GradeDistributionEntry {
  grade: string;
  label: string;
  count: number;
}

const GRADE_DISTRIBUTION: { grade: string; label: string }[] = [
  { grade: "sehr gut", label: "Sehr gut" },
  { grade: "gut", label: "Gut" },
  { grade: "befriedigend", label: "Befriedigend" },
  { grade: "genügend", label: "Genügend" },
  { grade: "mit Erfolg teilgenommen", label: "Mit Erfolg" },
];

export function getCourseStats(courses: Course[]): CourseStats {
  const completed = courses.filter((course) => course.status === "done");
  const pending = courses.filter((course) => course.status === "pending");
  const completedCredits = completed.reduce((sum, course) => sum + course.credits, 0);
  const pendingCredits = pending.reduce((sum, course) => sum + course.credits, 0);
  const graded = completed.filter((course) => course.grade && GRADE_MAP[course.grade]);
  const gradedCredits = graded.reduce((sum, course) => sum + course.credits, 0);
  const weightedGrade = graded.reduce(
    (sum, course) => sum + GRADE_MAP[course.grade!] * course.credits,
    0,
  );

  return {
    totalCredits: completedCredits + pendingCredits,
    completedCredits,
    pendingCredits,
    completedCourses: completed.length,
    pendingCourses: pending.length,
    averageGrade: gradedCredits > 0 ? weightedGrade / gradedCredits : null,
  };
}

export function getSemesters(courses: Course[]) {
  return Array.from(new Set(courses.map((course) => course.semester))).sort(compareSemesters);
}

export function compareSemesters(a: string, b: string) {
  if (a === b) return 0;
  const yearA = Number.parseInt(a.slice(0, 4), 10);
  const yearB = Number.parseInt(b.slice(0, 4), 10);
  if (yearA !== yearB) return yearA - yearB;
  return a.slice(4) === "S" ? -1 : 1;
}

export type CourseSortKey = "semester" | "name" | "credits" | "status" | "grade" | "examDate";

// Parse calendar dates explicitly so imported day.month.year dates never shift time zones.
export function parseExamDate(value: string | null): Date | null {
  if (!value) return null;
  const european = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value.trim());
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!european && !iso) return null;
  const [year, month, day] = european
    ? [Number(european[3]), Number(european[2]), Number(european[1])]
    : [Number(iso![1]), Number(iso![2]), Number(iso![3])];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date : null;
}

export function sortCourses(courses: Course[], key: CourseSortKey, direction: "asc" | "desc") {
  return [...courses].sort((a, b) => {
    const value = (course: Course): string | number | null => {
      if (key === "grade") return course.grade ? GRADE_MAP[course.grade] ?? (course.grade === "mit Erfolg teilgenommen" ? 5 : null) : null;
      if (key === "examDate") return parseExamDate(course.examDate)?.getTime() ?? null;
      return course[key];
    };
    const left = value(a);
    const right = value(b);
    if (left === null && right !== null) return 1;
    if (right === null && left !== null) return -1;
    const comparison = left === null || right === null ? 0
      : key === "semester" ? compareSemesters(String(left), String(right))
      : typeof left === "number" && typeof right === "number" ? left - right
      : String(left).localeCompare(String(right));
    return comparison * (direction === "asc" ? 1 : -1) || a.name.localeCompare(b.name);
  });
}

export function getGradeDistribution(courses: Course[]): GradeDistributionEntry[] {
  return GRADE_DISTRIBUTION.map(({ grade, label }) => ({
    grade,
    label,
    count: courses.filter((course) => course.grade === grade).length,
  }));
}
