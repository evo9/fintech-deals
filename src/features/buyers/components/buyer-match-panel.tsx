"use client";

import Link from "next/link";
import { XIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListState } from "@/components/shared/list-state";
import { formatAssetId } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BUYER_FILTER_KEYS } from "./buyer-filters";

type MatchAsset = { id: number; headline: string };

/** Block height is fixed so the list does not jump between the three states (see buyer-list-skeleton). */
export const MATCH_PANEL =
  "mt-3 flex flex-col gap-2 rounded-xl border bg-surface px-4 py-3 md:min-h-[66px] md:flex-row md:items-center md:justify-between md:gap-4";
const LEFT = "flex min-w-0 flex-col gap-2 md:flex-1 md:flex-row md:items-center md:gap-4";

/**
 * Ranking, not a filter: pick one of your assets and the buyers are sorted by how well their interests
 * fit it (badge on every card). Filters narrow the list, this only changes its order; both live in the URL.
 */
export function BuyerMatchPanel({
  assets,
  selected,
  total,
  hasActiveFilters,
}: {
  assets: MatchAsset[];
  selected: MatchAsset | undefined;
  total: number;
  hasActiveFilters: boolean;
}) {
  const { update, pending } = useListState();

  const counter = (
    <div className="flex h-8 shrink-0 items-center gap-2 md:h-auto">
      <p aria-live="polite" className="text-sm whitespace-nowrap text-text-muted tabular-nums">
        {total} {total === 1 ? "buyer" : "buyers"}
      </p>
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => update(Object.fromEntries(BUYER_FILTER_KEYS.map((k) => [k, null])))}
        >
          Clear filters
        </Button>
      )}
    </div>
  );

  if (selected) {
    const label = `${formatAssetId(selected.id)} ${selected.headline}`;
    return (
      <div className={MATCH_PANEL}>
        <div className={cn(LEFT, "md:flex-row")}>
          <div className="flex min-w-0 items-center gap-2 md:flex-1">
            <p className="min-w-0 truncate text-sm" title={label}>
              <span className="text-text-muted">Sorted by match with </span>
              <span className="font-semibold">{label}</span>
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Stop sorting by match"
              disabled={pending}
              onClick={() => update({ asset: null })}
            >
              <XIcon aria-hidden />
            </Button>
          </div>
        </div>
        {counter}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className={MATCH_PANEL}>
        <div className={LEFT}>
          <p className="min-w-0 text-sm text-text-muted">Add an asset to see which buyers fit it best.</p>
          <Link href="/my-assets/new" className={cn(buttonVariants({ variant: "secondary" }), "w-fit shrink-0")}>
            Create an asset
          </Link>
        </div>
        {counter}
      </div>
    );
  }

  const items = assets.map((a) => ({ value: String(a.id), label: `${formatAssetId(a.id)} · ${a.headline}` }));

  return (
    <div className={MATCH_PANEL}>
      <div className={LEFT}>
        <p className="shrink-0 text-sm font-medium">Match buyers to your asset</p>
        <Select value={null} items={items} onValueChange={(v) => v && update({ asset: String(v) })}>
          <SelectTrigger aria-label="Match buyers to your asset" className="w-full min-w-0 md:w-[420px] md:max-w-full">
            <SelectValue placeholder="Select an asset..." />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            {items.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                <span className="min-w-0 truncate" title={o.label}>
                  {o.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {counter}
    </div>
  );
}
