export function UniDashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading courses" aria-busy="true">
      <span className="sr-only">Loading courses</span>
      <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse sm:space-y-8">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-3 border border-line p-3 dark:border-line-dark sm:p-4">
              <div className={`${bar} h-4 w-3/4`} />
              <div className={`${bar} h-6 w-1/2`} />
            </div>
          ))}
        </div>
        <div className="space-y-4 border-y border-line py-5 dark:border-line-dark">
          <div className={`${bar} h-4 w-32`} />
          <div className={`${bar} h-2 w-full`} />
          <div className="hidden grid-cols-2 gap-6 sm:grid">
            {Array.from({ length: 2 }, (_, column) => (
              <div key={column} className="space-y-3">
                {Array.from({ length: 5 }, (_, row) => <div key={row} className={`${bar} h-4 w-full`} />)}
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            <div className={`${bar} h-6 w-40`} />
            <div className={`${bar} h-11 w-full`} />
            <div className="divide-y divide-line border-y border-line dark:divide-line-dark dark:border-line-dark">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="space-y-3 py-4">
                  <div className={`${bar} h-5 ${index % 2 ? "w-2/3" : "w-5/6"}`} />
                  <div className={`${bar} h-4 w-1/2`} />
                </div>
              ))}
            </div>
          </div>
          <div className="hidden space-y-4 border border-line p-4 dark:border-line-dark lg:block">
            <div className={`${bar} h-5 w-24`} />
            {Array.from({ length: 5 }, (_, index) => <div key={index} className={`${bar} h-11 w-full`} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

const bar = "rounded bg-line dark:bg-line-dark";
