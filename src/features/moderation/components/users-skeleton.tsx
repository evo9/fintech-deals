import { Skeleton } from "@/components/ui/skeleton";
import { PAGE_SIZE } from "@/lib/pagination";
import { USER_ROW_HEIGHT } from "./users-table";

export function UsersSkeleton() {
  return (
    <div aria-busy aria-label="Loading participants">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-full min-w-0 sm:max-w-[22.5rem]" />
        <Skeleton className="h-10 w-full rounded-full md:ml-auto md:w-[34rem]" />
      </div>
      <div className="mt-3 rounded-xl border bg-surface">
        <div className="h-10 border-b" />
        {Array.from({ length: PAGE_SIZE.admin }, (_, i) => (
          <div key={i} className={`${USER_ROW_HEIGHT} flex items-center border-b px-4 last:border-0`}>
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
      <div className="mt-8 h-10" />
    </div>
  );
}
