import { NextResponse } from "next/server";
import { hasUniDashboardSession } from "@/lib/uni/auth";
import {
  deleteUniCourse,
  isUniDatabaseConfigured,
  parseCourseInput,
  saveUniCourse,
} from "@/lib/uni/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const { id } = await params;
    const payload = await request.json();
    const course = parseCourseInput(payload, id);
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const { id } = await params;
    await deleteUniCourse(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Course could not be deleted."),
      },
      { status: 500 },
    );
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}
