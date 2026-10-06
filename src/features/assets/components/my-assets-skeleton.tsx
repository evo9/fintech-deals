import { Skeleton } from "@/components/ui/skeleton";
import { PAGE_SIZE } from "@/lib/pagination";
import { ROW, ROW_ACTIONS, ROW_MAIN, ROW_META, ROW_TOP } from "./my-asset-row-layout";

export function MyAssetsSkeleton() {
  return (
    <div aria-busy aria-label="Loading assets">
      <Skeleton className="h-10 w-full rounded-full sm:w-[34rem]" />
      <ul className="mt-4 flex flex-col gap-3">
        {Array.from({ length: PAGE_SIZE.rows }, (_, i) => (
          <li key={i} className={ROW}>
            <div className={ROW_MAIN}>
              <div className={ROW_TOP}>
                <Skeleton className="h-5 w-2/3" />
              </div>
              <div className={ROW_META}>
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className={ROW_ACTIONS}>
              <Skeleton className="h-9 w-20 rounded-full" />
              <Skeleton className="h-9 w-20 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-8 h-10" />
    </div>
  );
}
