import { Skeleton } from "@/components/ui/skeleton";

// Own skeleton: without it the catalog skeleton of the parent segment flashes on the asset page.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8" aria-busy aria-label="Loading asset">
      <div className="mb-4 flex h-5 items-center">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 rounded-xl border bg-surface p-4 sm:p-6">
          <div className="flex gap-4 sm:gap-5">
            <Skeleton className="aspect-[3/2] w-20 rounded-[3px] sm:w-[120px]" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-40 rounded-full" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-3">
            {Array.from({ length: 9 }, (_, i) => (
              <Skeleton key={i} className="h-[60px] rounded-lg" />
            ))}
          </div>
          <Skeleton className="mt-8 h-6 w-32" />
          <Skeleton className="mt-3 h-28 w-full" />
        </div>
        <div className="flex flex-col gap-4 rounded-xl border bg-surface p-4 sm:p-6">
          <Skeleton className="h-[84px] rounded-lg" />
          <Skeleton className="h-16" />
          <Skeleton className="h-11 rounded-full" />
        </div>
      </div>
    </main>
  );
}
