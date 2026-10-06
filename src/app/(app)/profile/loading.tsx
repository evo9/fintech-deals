import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

// Same header and two-column grid as the page: About, Interests on the left, preview on the right.
// Section heights are approximate: compare with the real form in the manual pass (8.2).
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8" aria-busy aria-label="Loading profile">
      <PageHeader title="My profile" description="Tell sellers what you are looking for" />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <Skeleton className="h-[420px] rounded-xl" />
          <Skeleton className="h-[560px] rounded-xl" />
        </div>
        <Skeleton className="hidden h-[340px] rounded-xl lg:block" />
      </div>
    </main>
  );
}
