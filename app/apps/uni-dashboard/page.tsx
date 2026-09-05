import { UniDashboard } from "@/components/uni/uni-dashboard";
import { UniLogin } from "@/components/uni/uni-login";
import {
  hasUniDashboardSession,
  isUniDashboardPasswordConfigured,
} from "@/lib/uni/auth";
import { seedCourses } from "@/lib/uni/seed";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Uni Dashboard - Ben",
  description: "Personal course tracking for ECTS, semesters, grades, and exams.",
};

export default async function UniDashboardPage() {
  const isProtected = isUniDashboardPasswordConfigured();
  const isAuthenticated = await hasUniDashboardSession();

  if (!isAuthenticated) {
    return <UniLogin />;
  }

  return <UniDashboard initialCourses={seedCourses} isProtected={isProtected} />;
}
