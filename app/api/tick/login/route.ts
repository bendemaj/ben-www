import { NextResponse } from "next/server";
import { setTickSession, verifyTickPassword } from "@/lib/tick/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    password?: unknown;
  } | null;

  if (!verifyTickPassword(payload?.password)) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setTickSession(response);

  return response;
}
