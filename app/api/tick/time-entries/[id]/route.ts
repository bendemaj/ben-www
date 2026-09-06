import { NextResponse } from "next/server";
import { hasTickSession } from "@/lib/tick/auth";
import { isTickDatabaseConfigured } from "@/lib/tick/db";
import {
  deleteTimeEntry,
  updateTimeEntry,
  validateTimeEntryInput,
} from "@/lib/tick/time-entries";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: RouteContext) {
  if (!(await hasTickSession())) return unauthorized();

  if (!isTickDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 503 },
    );
  }

  try {
    const { id } = await context.params;
    const input = validateTimeEntryInput(await request.json());
    const entry = await updateTimeEntry(id, input);

    if (!entry) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await hasTickSession())) return unauthorized();

  if (!isTickDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 503 },
    );
  }

  try {
    const { id } = await context.params;
    await deleteTimeEntry(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}
