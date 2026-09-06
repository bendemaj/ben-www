import { TickApp } from "@/components/tick/tick-app";
import { TickLogin } from "@/components/tick/tick-login";
import { hasTickSession, isTickPasswordConfigured } from "@/lib/tick/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "tick - Ben",
  description: "A small time tracker.",
};

export default async function TickPage() {
  const isProtected = isTickPasswordConfigured();
  const isAuthenticated = await hasTickSession();

  if (!isAuthenticated) {
    return <TickLogin />;
  }

  return <TickApp isProtected={isProtected} />;
}
