import Link from "next/link";

export const metadata = {
  title: "Apps - Ben",
  description: "Small tools and personal dashboards.",
};

export default function AppsPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-ink-dark">
          Apps
        </h1>
        <p className="text-[15px] text-muted dark:text-muted-dark">
          Small tools I use and keep close to the portfolio.
        </p>
      </header>

      <ul className="space-y-8">
        <li>
          <Link href="/apps/tick" className="group block space-y-1">
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-[15px] font-medium text-ink group-hover:underline dark:text-ink-dark">
                tick
              </span>
              <span className="shrink-0 text-sm text-faint dark:text-faint-dark">
                Time
              </span>
            </div>
            <p className="text-[15px] leading-6 text-muted dark:text-muted-dark">
              A small timer for tracking focused work sessions.
            </p>
          </Link>
        </li>
        <li>
          <Link href="/apps/uni-dashboard" className="group block space-y-1">
            <div className="flex items-baseline gap-4">
              <span className="text-[15px] font-medium text-ink group-hover:underline dark:text-ink-dark">
                Uni Dashboard
              </span>
              <span className="shrink-0 text-sm text-faint dark:text-faint-dark">
                Courses
              </span>
            </div>
            <p className="text-[15px] leading-6 text-muted dark:text-muted-dark">
              Track ECTS progress, grades, semesters, exams, and pending courses.
            </p>
          </Link>
        </li>
      </ul>
    </div>
  );
}
