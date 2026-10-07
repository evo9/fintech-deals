"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChipGroup, CountryChecklist, FilterFooter, FilterGroup, FilterPanel } from "@/components/shared/filter-panel";
import { SearchInput } from "@/components/shared/filter-bar";
import { useListState } from "@/components/shared/list-state";
import { Button } from "@/components/ui/button";
import { ASSET_CATEGORY_LABELS, BUYER_TYPE_LABELS, LICENSE_TYPE_LABELS } from "@/lib/reference";
import { cn } from "@/lib/utils";
import type { BuyerListParams } from "../schema";

const PANEL_KEYS = ["type", "country", "licenseType", "category", "budgetMin", "budgetMax"];
/** URL keys reset by "Clear filters" (the match asset has its own reset). */
export const BUYER_FILTER_KEYS = ["q", ...PANEL_KEYS];

function panelCount(p: BuyerListParams) {
  return (
    (p.type.length ? 1 : 0) +
    (p.country.length ? 1 : 0) +
    (p.licenseType.length ? 1 : 0) +
    (p.category.length ? 1 : 0) +
    (p.budgetMin !== undefined || p.budgetMax !== undefined ? 1 : 0)
  );
}

/** One row: the search box takes the free width, Filters sits on its right. */
export function BuyerFilters({ params }: { params: BuyerListParams }) {
  const activeInPanel = panelCount(params);

  return (
    <div className="flex items-center gap-3">
      <SearchInput
        initialQ={params.q}
        placeholder="Find a buyer..."
        className="min-w-0 flex-1 sm:max-w-none"
      />
      <FilterPanel activeCount={activeInPanel} description="Narrow down the buyer list" compactOnMobile>
        {({ done, className }) => <FiltersForm params={params} onDone={done} className={className} />}
      </FilterPanel>
    </div>
  );
}

/** Draft state lives here; the URL changes only on Apply / Reset. Mounted only while the panel is open. */
function FiltersForm({
  params,
  onDone,
  className,
}: {
  params: BuyerListParams;
  onDone: () => void;
  className?: string;
}) {
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
            <div>
              <Label htmlFor="budget-from" className="sr-only">
                Budget from
              </Label>
              <Input
                inputMode="numeric"
                placeholder="From"
                id="budget-from"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value.replace(/\D/g, "").slice(0, 9))}
              />
            </div>
            <div>
              <Label htmlFor="budget-to" className="sr-only">
                Budget to
              </Label>
              <Input
                inputMode="numeric"
                placeholder="To"
                id="budget-to"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value.replace(/\D/g, "").slice(0, 9))}
              />
            </div>
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
