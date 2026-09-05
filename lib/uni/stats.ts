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
  const yearA = Number.parseInt(a.slice(0, 4), 10);
  const yearB = Number.parseInt(b.slice(0, 4), 10);
  if (yearA !== yearB) return yearA - yearB;
  return a.slice(4) === "S" ? -1 : 1;
}

export function getGradeDistribution(courses: Course[]): GradeDistributionEntry[] {
  return GRADE_DISTRIBUTION.map(({ grade, label }) => ({
    grade,
    label,
    count: courses.filter((course) => course.grade === grade).length,
  }));
}
