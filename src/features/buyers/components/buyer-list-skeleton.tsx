import { Skeleton } from "@/components/ui/skeleton";
import { PAGE_SIZE } from "@/lib/pagination";
import { BUYER_BUDGET, BUYER_CARD, BUYER_FOOTER, BUYER_HEAD, BUYER_HEADLINE, BUYER_TAGS } from "./buyer-card-layout";

export function BuyerListSkeleton() {
  return (
    <div aria-busy aria-label="Loading buyers">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 min-w-0 flex-1 rounded-full sm:max-w-sm" />
        <Skeleton className="ml-auto size-10 shrink-0 rounded-full md:w-[7.5rem]" />
      </div>
      <Skeleton className="mt-3 h-[134px] rounded-xl md:h-[66px]" />
      <ul className="mt-3 flex flex-col gap-4">
        {Array.from({ length: PAGE_SIZE.cards }, (_, i) => (
          <li key={i} className={BUYER_CARD}>
            <div className={BUYER_HEAD}>
              <Skeleton className="h-5 w-1/2" />
            </div>
            <div className={BUYER_HEADLINE}>
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className={BUYER_TAGS}>
              <Skeleton className="h-6 w-40 rounded-full" />
            </div>
            <div className={BUYER_BUDGET}>
              <Skeleton className="h-4 w-32" />
            </div>
            <div className={BUYER_FOOTER}>
              <Skeleton className="h-10 flex-1 rounded-full sm:w-36 sm:flex-none" />
              <Skeleton className="h-10 flex-1 rounded-full sm:w-36 sm:flex-none" />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-8 h-10" />
    </div>
  );
}
