"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChipGroup, CountryChecklist, FilterFooter, FilterGroup, FilterPanel } from "@/components/shared/filter-panel";
import { FilterBar } from "@/components/shared/filter-bar";
import { useListState } from "@/components/shared/list-state";
import { Button } from "@/components/ui/button";
import { formatAssetId } from "@/lib/format";
import { ASSET_CATEGORY_LABELS, BUYER_TYPE_LABELS, LICENSE_TYPE_LABELS } from "@/lib/reference";
import { cn } from "@/lib/utils";
import type { BuyerListParams } from "../schema";

const PANEL_KEYS = ["type", "country", "licenseType", "category", "budgetMin", "budgetMax"];
const ALL_KEYS = ["q", ...PANEL_KEYS, "asset"];
const NONE = "none";

function panelCount(p: BuyerListParams) {
  return (
    (p.type.length ? 1 : 0) +
    (p.country.length ? 1 : 0) +
    (p.licenseType.length ? 1 : 0) +
    (p.category.length ? 1 : 0) +
    (p.budgetMin !== undefined || p.budgetMax !== undefined ? 1 : 0)
  );
}

export function BuyerFilters({
  params,
  total,
  myAssets,
  matchAsset,
}: {
  params: BuyerListParams;
  total: number;
  myAssets: { id: number; headline: string }[];
  matchAsset: number | undefined;
}) {
  const { update } = useListState();
  const activeInPanel = panelCount(params);
  const matchItems = [
    { value: NONE, label: "Match against: none" },
    ...myAssets.map((a) => ({ value: String(a.id), label: `${formatAssetId(a.id)} ${a.headline}` })),
  ];

  return (
    <FilterBar
      total={total}
      singular="buyer"
      plural="buyers"
      filterKeys={ALL_KEYS}
      hasActiveFilters={activeInPanel > 0 || params.q !== "" || matchAsset !== undefined}
      search={{ initialQ: params.q, placeholder: "Find a buyer..." }}
      controls={
        <>
          <FilterPanel activeCount={activeInPanel} description="Narrow down the buyer list">
            {({ done, className }) => <FiltersForm params={params} onDone={done} className={className} />}
          </FilterPanel>
          {myAssets.length > 0 && (
            <Select
              value={matchAsset !== undefined ? String(matchAsset) : NONE}
              items={matchItems}
              onValueChange={(v) => update({ asset: v === NONE ? null : String(v) })}
            >
              <SelectTrigger aria-label="Match against one of your assets" className="min-w-0 flex-1 sm:w-64 sm:flex-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} align="end" className="min-w-72">
                {matchItems.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </>
      }
    />
  );
}

/** Draft state lives here; the URL changes only on Apply / Reset. Mounted only while the panel is open. */
function FiltersForm({ params, onDone, className }: { params: BuyerListParams; onDone: () => void; className?: string }) {
  const { update } = useListState();
  const [type, setType] = useState(params.type);
  const [country, setCountry] = useState(params.country);
  const [licenseType, setLicenseType] = useState(params.licenseType);
  const [category, setCategory] = useState(params.category);
  const [budgetMin, setBudgetMin] = useState(params.budgetMin?.toString() ?? "");
  const [budgetMax, setBudgetMax] = useState(params.budgetMax?.toString() ?? "");

  function apply() {
    const csv = (list: string[]) => (list.length ? list.join(",") : null);
    const digits = (s: string) => (/^\d{1,9}$/.test(s.trim()) ? s.trim() : null);
    update({
      type: csv(type),
      country: csv(country),
      licenseType: csv(licenseType),
      category: csv(category),
      budgetMin: digits(budgetMin),
      budgetMax: digits(budgetMax),
    });
    onDone();
  }

  function reset() {
    update(Object.fromEntries(PANEL_KEYS.map((k) => [k, null])));
    onDone();
  }

  return (
    <form
      className={cn("flex flex-col", className)}
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
        <ChipGroup title="Buyer type" labels={BUYER_TYPE_LABELS} value={type} onChange={setType} />
        <CountryChecklist value={country} onChange={setCountry} />
        <ChipGroup title="License type" labels={LICENSE_TYPE_LABELS} value={licenseType} onChange={setLicenseType} />
        <ChipGroup title="Type of business" labels={ASSET_CATEGORY_LABELS} value={category} onChange={setCategory} />
        <FilterGroup title="Budget overlaps (EUR)">
          <div className="grid grid-cols-2 gap-2">
            <Input
              inputMode="numeric"
              placeholder="From"
              aria-label="Budget from"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value.replace(/\D/g, "").slice(0, 9))}
            />
            <Input
              inputMode="numeric"
              placeholder="To"
              aria-label="Budget to"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value.replace(/\D/g, "").slice(0, 9))}
            />
          </div>
        </FilterGroup>
      </div>
      <FilterFooter>
        <Button type="button" variant="ghost" onClick={reset}>
          Reset
        </Button>
        <Button type="submit">Apply</Button>
      </FilterFooter>
    </form>
  );
}
