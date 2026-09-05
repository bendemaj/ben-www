import { NextResponse } from "next/server";
import { clearUniDashboardSession } from "@/lib/uni/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearUniDashboardSession(response);

  return response;
}
