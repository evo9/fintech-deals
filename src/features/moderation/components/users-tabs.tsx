"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useListState } from "@/components/shared/list-state";
import { ADMIN_USER_TABS, type AdminUserTab } from "../schema";
import type { AdminUserCounts } from "../queries";

const LABELS: Record<AdminUserTab, string> = {
  ALL: "All",
  BUYER: "Buyers",
  SELLER: "Sellers",
  SUSPENDED: "Suspended",
  REMOVED: "Removed",
};

export function UsersTabs({ value, counts }: { value: AdminUserTab; counts: AdminUserCounts }) {
  const { update } = useListState();
  return (
    <Tabs value={value} onValueChange={(v) => update({ tab: v === "ALL" ? null : String(v) })} className="min-w-0">
      <TabsList
        aria-label="Participants"
        className="w-full justify-start overflow-x-auto [scrollbar-width:none] sm:w-fit [&::-webkit-scrollbar]:hidden"
      >
        {ADMIN_USER_TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="gap-1.5 px-3 sm:px-4">
            {LABELS[tab]}
            <span className="min-w-[1.5ch] text-text-muted tabular-nums sm:min-w-[2ch]">{counts[tab]}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
