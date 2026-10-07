import { Skeleton } from "@/components/ui/skeleton";
import { PAGE_SIZE } from "@/lib/pagination";
import { ASSET_ROW_HEIGHT } from "./assets-table";

export function AssetsSkeleton() {
  return (
    <div aria-busy aria-label="Loading assets">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-full min-w-0 sm:max-w-[22.5rem]" />
        <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:flex-wrap lg:ml-auto lg:w-auto lg:flex-nowrap">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full min-w-0 rounded-full sm:w-36 lg:w-44" />
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-xl border bg-surface">
        <div className="h-10 border-b" />
        {Array.from({ length: PAGE_SIZE.admin }, (_, i) => (
          <div key={i} className={`${ASSET_ROW_HEIGHT} flex items-center border-b px-4 last:border-0`}>
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
      <div className="mt-8 h-10" />
    </div>
  );
}
