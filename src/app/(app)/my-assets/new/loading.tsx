import { Skeleton } from "@/components/ui/skeleton";

// Own skeleton for the form routes: the list skeleton of /my-assets must not flash here.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8" aria-busy aria-label="Loading form">
      <Skeleton className="mb-6 h-9 w-64" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          {[260, 190, 190, 150, 220].map((h, i) => (
            <Skeleton key={i} className="rounded-xl" style={{ height: h }} />
          ))}
        </div>
        <Skeleton className="hidden h-[340px] rounded-xl lg:block" />
      </div>
    </main>
  );
}
