import { Skeleton } from "@/components/ui/skeleton";

// Own skeleton: without it the table skeleton of /admin/users flashes on the participant page.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8" aria-busy aria-label="Loading participant">
      <div className="mb-4 flex h-5 items-center">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border bg-surface p-4 sm:p-6">
          <Skeleton className="h-8 w-1/2" />
          <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[60px] rounded-lg" />
            ))}
          </div>
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </main>
  );
}
