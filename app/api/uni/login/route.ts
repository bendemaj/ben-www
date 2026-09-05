import { NextResponse } from "next/server";
import {
  setUniDashboardSession,
  verifyUniDashboardPassword,
} from "@/lib/uni/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    password?: unknown;
  } | null;

  if (!verifyUniDashboardPassword(payload?.password)) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setUniDashboardSession(response);

  return response;
}
