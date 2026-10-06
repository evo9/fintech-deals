import { Skeleton } from "@/components/ui/skeleton";
import { PAGE_SIZE } from "@/lib/pagination";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-6" aria-busy aria-label="Loading conversation">
      <div className="grid h-[calc(100dvh-9.5rem)] min-h-[480px] grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="hidden min-h-0 flex-col overflow-hidden rounded-xl border bg-surface lg:flex">
          <div className="shrink-0 border-b px-4 py-3">
            <Skeleton className="h-7 w-28" />
          </div>
          <div className="min-h-0 flex-1 divide-y overflow-hidden">
            {Array.from({ length: PAGE_SIZE.rows }, (_, i) => (
              <div key={i} className="flex h-[84px] flex-col justify-center gap-2 px-4">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex min-h-0 flex-col rounded-xl border bg-surface">
          <div className="shrink-0 border-b px-4 py-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <div className="min-h-0 flex-1" />
        </div>
      </div>
    </main>
  );
}
