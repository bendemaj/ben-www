import { NextResponse } from "next/server";
import { hasTickSession } from "@/lib/tick/auth";
import { isTickDatabaseConfigured } from "@/lib/tick/db";
import {
  createTimeEntry,
  listTimeEntries,
  validateTimeEntryInput,
} from "@/lib/tick/time-entries";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasTickSession())) return unauthorized();

  if (!isTickDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 503 },
    );
  }

  try {
    return NextResponse.json({ entries: await listTimeEntries(), writable: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await hasTickSession())) return unauthorized();

  if (!isTickDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 503 },
    );
  }

  try {
    const input = validateTimeEntryInput(await request.json());
    return NextResponse.json({ entry: await createTimeEntry(input) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}
