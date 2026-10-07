"use client";

import Link from "next/link";
import { XIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListState } from "@/components/shared/list-state";
import { formatAssetId } from "@/lib/format";
import { cn } from "@/lib/utils";

type MatchAsset = { id: number; headline: string };

/** Block height is fixed so the list does not jump between the three states (see buyer-list-skeleton). */
export const MATCH_PANEL = "mt-4 flex min-h-[66px] flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-surface px-4 py-3";

/**
 * Ranking, not a filter: pick one of your assets and the buyers are sorted by how well their interests
 * fit it (badge on every card). Filters narrow the list, this only changes its order; both live in the URL.
 */
export function BuyerMatchPanel({ assets, selected }: { assets: MatchAsset[]; selected: MatchAsset | undefined }) {
  const { update, pending } = useListState();

  if (selected) {
    const label = `${formatAssetId(selected.id)} ${selected.headline}`;
    return (
      <div className={MATCH_PANEL}>
        <p className="min-w-0 flex-1 truncate text-sm" title={label}>
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
    );
  }

  if (assets.length === 0) {
    return (
      <div className={MATCH_PANEL}>
        <p className="min-w-0 flex-1 text-sm text-text-muted">Add an asset to see which buyers fit it best.</p>
        <Link href="/my-assets/new" className={cn(buttonVariants({ variant: "secondary" }), "shrink-0")}>
          Create an asset
        </Link>
      </div>
    );
  }

  const items = assets.map((a) => ({ value: String(a.id), label: `${formatAssetId(a.id)} · ${a.headline}` }));

  return (
    <div className={MATCH_PANEL}>
      <p className="shrink-0 text-sm font-medium">Match buyers to your asset</p>
      <Select value={null} items={items} onValueChange={(v) => v && update({ asset: String(v) })}>
        <SelectTrigger aria-label="Match buyers to your asset" className="w-full min-w-0 sm:w-96 sm:max-w-full">
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
  );
}
