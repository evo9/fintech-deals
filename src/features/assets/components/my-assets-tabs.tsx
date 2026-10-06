"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useListState } from "@/components/shared/list-state";
import { MY_ASSET_TABS, type MyAssetTab } from "../schema";
import type { MyAssetCounts } from "../queries";

const LABELS: Record<MyAssetTab, string> = {
  ALL: "All",
  PUBLISHED: "Published",
  DRAFT: "Drafts",
  ARCHIVED: "Withdrawn",
  REMOVED: "Removed",
};

export function MyAssetsTabs({ value, counts }: { value: MyAssetTab; counts: MyAssetCounts }) {
  const { update } = useListState();
  return (
    <Tabs value={value} onValueChange={(v) => update({ status: v === "ALL" ? null : String(v) })} className="min-w-0">
      <TabsList
        aria-label="Status"
        className="w-full justify-start overflow-x-auto [scrollbar-width:none] sm:w-fit [&::-webkit-scrollbar]:hidden"
      >
        {MY_ASSET_TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="gap-1.5 px-3 sm:px-4">
            {LABELS[tab]}
            <span className="min-w-[1.5ch] text-text-muted tabular-nums sm:min-w-[2ch]">{counts[tab]}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
