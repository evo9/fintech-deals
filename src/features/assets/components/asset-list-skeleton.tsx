import { Skeleton } from "@/components/ui/skeleton";
import { PAGE_SIZE } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { ASSET_CARD_HEIGHT } from "./asset-card";

/** Same dimensions as the page chrome and the cards, so the first load does not shift. */
export function AssetListSkeleton() {
  return (
    <div aria-busy aria-label="Loading assets">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-full rounded-full sm:max-w-sm sm:flex-1" />
        <Skeleton className="h-10 w-full rounded-full sm:ml-auto sm:w-[28rem]" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 sm:h-10 sm:flex-nowrap">
        <div className="flex h-9 items-center">
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <Skeleton className="h-10 w-[7.5rem] shrink-0 rounded-full" />
          <Skeleton className="h-10 min-w-0 flex-1 rounded-full sm:w-48 sm:flex-none" />
        </div>
      </div>
      <ul className="mt-4 flex flex-col gap-4">
        {Array.from({ length: PAGE_SIZE.cards }, (_, i) => (
          <li key={i}>
            <Skeleton className={cn("w-full rounded-xl", ASSET_CARD_HEIGHT)} />
          </li>
        ))}
      </ul>
      <div className="mt-8 h-10" />
    </div>
  );
}
