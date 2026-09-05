import { NextResponse } from "next/server";
import { hasUniDashboardSession } from "@/lib/uni/auth";
import {
  isUniDatabaseConfigured,
  listUniCourses,
  parseCourseInput,
  saveUniCourse,
} from "@/lib/uni/db";
import { seedCourses } from "@/lib/uni/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasUniDashboardSession())) {
    return unauthorized();
  }

  if (!isUniDatabaseConfigured()) {
    return NextResponse.json({
      courses: seedCourses,
      writable: false,
      source: "seed",
    });
  }

  try {
    const courses = await listUniCourses();

    return NextResponse.json({
      courses,
      writable: true,
      source: "neon",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Courses could not be loaded."),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await hasUniDashboardSession())) {
    return unauthorized();
  }

  if (!isUniDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 503 },
    );
  }

  try {
    const payload = await request.json();
    const course = parseCourseInput(payload);
    const savedCourse = await saveUniCourse(course);

    return NextResponse.json({ course: savedCourse });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Course could not be saved."),
      },
      { status: 400 },
    );
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}
