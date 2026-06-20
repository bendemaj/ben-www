export const metadata = {
  title: "CV — Ben",
  description: "Experience and background.",
};

interface Role {
  role: string;
  period: string;
  description: string;
}

interface Experience {
  company: string;
  location: string;
  roles: Role[];
}

const experience: Experience[] = [
  {
    company: "Technische Universität Wien",
    location: "Vienna, AT",
    roles: [
      {
        role: "Teaching Assistant",
        period: "2025 — Present",
        description:
          "Supported students in programming fundamentals, debugging, and low-level system concepts.",
      },
    ],
  },
  {
    company: "Austrian Power Grid",
    location: "Vienna, AT",
    roles: [
      {
        role: "Intern — System Development",
        period: "Summer 2025",
        description:
          "Analyzed and structured energy market data while developing automation scripts to streamline large-scale data processing.",
      },
      {
        role: "Intern — Data Excellence & AI",
        period: "Summer 2024",
        description:
          "Automated internal processes with Python and conducted research on AI safety methodologies.",
      },
    ],
  },
  {
    company: "Scheidt & Bachmann Parking Solutions",
    location: "Vienna, AT",
    roles: [
      {
        role: "Working Student",
        period: "2024 — 2025",
        description:
          "Worked on intelligent transport systems, commissioning and maintaining barrier infrastructure and electronic assemblies.",
      },
    ],
  },
  {
    company: "F. Hoffmann-La Roche",
    location: "Basel, CH",
    roles: [
      {
        role: "Intern — Infrastructure & Data Center",
        period: "Summer 2022",
        description:
          "Implemented zero-touch provisioning automation and configured enterprise Cisco network infrastructure in a data center environment.",
      },
    ],
  },
  {
    company: "Strabag",
    location: "Graz, AT",
    roles: [
      {
        role: "Intern — Tunnel Automation",
        period: "Summer 2020",
        description:
          "Contributed to tunnel automation projects within critical infrastructure systems.",
      },
    ],
  },
  {
    company: "Insyde Weinmanager",
    location: "Vienna, AT",
    roles: [
      {
        role: "Intern — Software Development",
        period: "Summer 2019",
        description:
          "Supported software development tasks in a commercial application environment.",
      },
    ],
  },
];

export default function CVPage() {
  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-ink-dark">
          CV
        </h1>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-faint dark:text-faint-dark">
          Experience
        </h2>
        <ul className="space-y-8">
          {experience.map((e) => (
            <li key={e.company}>
              <div className="mb-3 flex items-baseline gap-2">
                <p className="text-sm font-medium text-ink dark:text-ink-dark">
                  {e.company}
                </p>
                <span className="text-xs text-faint dark:text-faint-dark">
                  {e.location}
                </span>
              </div>
              <ul className="space-y-5">
                {e.roles.map((r) => (
                  <li
                    key={r.role + r.period}
                    className="grid grid-cols-[1fr_auto] gap-x-4 border-l border-line pl-3 dark:border-line-dark"
                  >
                    <div className="space-y-1">
                      <p className="text-[15px] font-medium text-muted dark:text-muted-dark">
                        {r.role}
                      </p>
                      <p className="text-[15px] leading-6 text-muted dark:text-muted-dark">
                        {r.description}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-faint dark:text-faint-dark">
                      {r.period}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
