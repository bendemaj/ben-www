import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const TICK_COOKIE = "tick-session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function isTickPasswordConfigured() {
  return Boolean(getPassword());
}

export async function hasTickSession() {
  const password = getPassword();
  if (!password) return true;

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(TICK_COOKIE)?.value;

  return Boolean(cookieValue && safeEqual(cookieValue, getSessionToken(password)));
}

export function verifyTickPassword(input: unknown) {
  const password = getPassword();
  if (!password) return true;
  if (typeof input !== "string") return false;

  return safeEqual(input, password);
}

export function setTickSession(response: NextResponse) {
  const password = getPassword();
  if (!password) return;

  response.cookies.set(TICK_COOKIE, getSessionToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export function clearTickSession(response: NextResponse) {
  response.cookies.set(TICK_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

function getPassword() {
  return (
    process.env.TICK_PASSWORD?.trim() ||
    process.env.APPS_PASSWORD?.trim() ||
    process.env.UNI_DASHBOARD_PASSWORD?.trim() ||
    ""
  );
}

function getSessionToken(password: string) {
  return createHash("sha256").update(`tick-session:${password}`).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
