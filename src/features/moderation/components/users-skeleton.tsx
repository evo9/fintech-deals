import { Skeleton } from "@/components/ui/skeleton";
import { PAGE_SIZE } from "@/lib/pagination";
import { USER_ROW_HEIGHT } from "./users-table";

export function UsersSkeleton() {
  return (
    <div aria-busy aria-label="Loading participants">
      <Skeleton className="h-10 w-full rounded-full sm:w-[34rem]" />
      <Skeleton className="mt-4 h-10 w-full rounded-full sm:max-w-sm" />
      <div className="mt-4 flex h-10 items-center">
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="mt-4 rounded-xl border bg-surface">
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
