export interface Course {
  id: string;
  name: string;
  credits: number;
  semester: string;
  status: "done" | "pending";
  grade: string | null;
  examDate: string | null;
  examiner: string | null;
}

export interface CourseFormValues {
  name: string;
  credits: string;
  semester: string;
  status: Course["status"];
  grade: string;
  examDate: string;
  examiner: string;
}

export interface CourseStats {
  totalCredits: number;
  completedCredits: number;
  pendingCredits: number;
  completedCourses: number;
  pendingCourses: number;
  averageGrade: number | null;
}

export const GRADE_MAP: Record<string, number> = {
  "sehr gut": 1,
  gut: 2,
  befriedigend: 3,
  genügend: 4,
};

export const GRADE_OPTIONS = [
  "sehr gut",
  "gut",
  "befriedigend",
  "genügend",
  "mit Erfolg teilgenommen",
] as const;
