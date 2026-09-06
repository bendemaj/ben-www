import { NextResponse } from "next/server";
import { clearTickSession } from "@/lib/tick/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearTickSession(response);

  return response;
}
