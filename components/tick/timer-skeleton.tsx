export function TimerSkeleton() {
  return (
    <div role="status" aria-label="Loading timer and entries" aria-busy="true">
      <span className="sr-only">Loading timer and entries</span>
      <div aria-hidden="true" className="space-y-7 motion-safe:animate-pulse">
        <div className="space-y-3">
          <div className={`${bar} h-5 w-3/4`} />
          <div className="flex items-center justify-between gap-4 border-t border-line pt-3 dark:border-line-dark">
            <div className={`${bar} h-10 w-44 max-w-[70%]`} />
            <div className={`${bar} h-4 w-10`} />
          </div>
          <div className={`${bar} h-4 w-24`} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className={`${bar} h-3 w-16`} />
            <div className={`${bar} h-3 w-12`} />
          </div>
          <div className="divide-y divide-line border-t border-line dark:divide-line-dark dark:border-line-dark">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-4 py-3">
                <div className={`${bar} h-4 ${index % 2 ? "w-1/2" : "w-2/3"}`} />
                <div className={`${bar} h-4 w-12 shrink-0`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const bar = "rounded bg-line dark:bg-line-dark";
