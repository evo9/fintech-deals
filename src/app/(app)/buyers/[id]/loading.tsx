import { Skeleton } from "@/components/ui/skeleton";

// Own skeleton: without it the list skeleton of /buyers flashes on the profile page.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8" aria-busy aria-label="Loading profile">
      <div className="mb-4 flex h-5 items-center">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 rounded-xl border bg-surface p-4 sm:p-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="mt-3 h-5 w-1/3" />
          <Skeleton className="mt-6 h-6 w-3/4" />
          <Skeleton className="mt-8 h-6 w-24" />
          <Skeleton className="mt-3 h-24 w-full" />
          <Skeleton className="mt-8 h-6 w-48" />
          <Skeleton className="mt-4 h-24 w-full" />
        </div>
        <div className="flex flex-col gap-4 rounded-xl border bg-surface p-4 sm:p-6">
          <Skeleton className="h-[76px] rounded-lg" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-11 rounded-full" />
        </div>
      </div>
    </main>
  );
}
