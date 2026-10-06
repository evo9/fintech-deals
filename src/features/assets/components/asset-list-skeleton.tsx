import { Skeleton } from "@/components/ui/skeleton";
import { PAGE_SIZE } from "@/lib/pagination";
import {
  CARD,
  CARD_BODY,
  CARD_BUTTONS,
  CARD_DESCRIPTION,
  CARD_FLAG_COLUMN,
  CARD_FOOTER,
  CARD_HEADER,
  CARD_HEADLINE,
  CARD_INCLUDED,
  CARD_TILES,
} from "./asset-card-layout";

function AssetCardSkeleton() {
  return (
    <li className={CARD}>
      <div className={CARD_FLAG_COLUMN}>
        <Skeleton className="aspect-[3/2] w-[120px] rounded-[3px]" />
      </div>
      <div className={CARD_BODY}>
        <div className={CARD_HEADER}>
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className={`${CARD_HEADLINE} w-3/4`} />
        <div className={CARD_TILES}>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className={i === 4 ? "col-span-2 h-[60px] rounded-lg lg:col-span-1" : "h-[60px] rounded-lg"} />
          ))}
        </div>
        <Skeleton className="h-7 w-2/3 rounded-full" />
        <Skeleton className={`${CARD_INCLUDED} w-1/2 rounded-full`} />
        <Skeleton className={CARD_DESCRIPTION} />
        <div className={CARD_FOOTER}>
          <Skeleton className="h-5 w-28" />
          <div className={CARD_BUTTONS}>
            <Skeleton className="h-10 flex-1 rounded-full sm:w-32 sm:flex-none" />
            <Skeleton className="h-10 flex-1 rounded-full sm:w-36 sm:flex-none" />
          </div>
        </div>
      </div>
    </li>
  );
}

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
          <AssetCardSkeleton key={i} />
        ))}
      </ul>
      <div className="mt-8 h-10" />
    </div>
  );
}
