"use client";

import { useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CountryFlag } from "@/components/shared/country-flag";
import { FilterBar } from "@/components/shared/filter-bar";
import { useListState } from "@/components/shared/list-state";
import {
  ASSET_CATEGORY_LABELS,
  ASSET_TYPE_LABELS,
  BUSINESS_STATUS_LABELS,
  COUNTRIES,
  LICENSE_TYPE_LABELS,
  toOptions,
} from "@/lib/reference";
import { cn } from "@/lib/utils";
import { DEFAULT_ASSET_SORT, type AssetListParams } from "../schema";
import type { CategoryCounts } from "../queries";

const BASE_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];
// Best match makes sense only when the buyer has set interests
const SORT_OPTIONS = [...BASE_SORT_OPTIONS, { value: "best_match", label: "Best match" }];

const EU_CODES = COUNTRIES.filter((c) => c.eu).map((c) => c.code);

// Everything the Filters panel owns (the search box, tabs and sort have their own controls).
const PANEL_KEYS = ["country", "licenseType", "assetType", "businessStatus", "priceMin", "priceMax", "includeOnRequest", "validated"];
const ALL_KEYS = ["q", "category", ...PANEL_KEYS, "mine", "sort"];

function panelCount(p: AssetListParams) {
  return (
    (p.country.length ? 1 : 0) +
    (p.licenseType.length ? 1 : 0) +
    (p.assetType.length ? 1 : 0) +
    (p.businessStatus.length ? 1 : 0) +
    (p.priceMin !== undefined || p.priceMax !== undefined ? 1 : 0) +
    (p.validated ? 1 : 0)
  );
}

export function AssetFilters({
  params,
  total,
  counts,
  hasInterests,
}: {
  params: AssetListParams;
  total: number;
  counts: CategoryCounts;
  hasInterests: boolean;
}) {
  const { update } = useListState();
  const activeInPanel = panelCount(params);
  const sortOptions = hasInterests ? SORT_OPTIONS : BASE_SORT_OPTIONS;
  const sort = sortOptions.some((o) => o.value === params.sort) ? params.sort : DEFAULT_ASSET_SORT;
  const mine = params.mine && hasInterests;
  const hasActiveFilters =
    mine ||
    activeInPanel > 0 || params.q !== "" || params.category !== undefined || sort !== DEFAULT_ASSET_SORT;

  return (
    <FilterBar
      total={total}
      singular="asset"
      plural="assets"
      filterKeys={ALL_KEYS}
      hasActiveFilters={hasActiveFilters}
      search={{ initialQ: params.q, placeholder: "Find an asset..." }}
      controls={
        <>
          <MyInterestsToggle checked={mine} hasInterests={hasInterests} className="hidden md:flex" />
          <FiltersPanel params={params} activeCount={activeInPanel} hasInterests={hasInterests} />
          <Select
            value={sort}
            items={sortOptions}
            onValueChange={(v) => update({ sort: v === DEFAULT_ASSET_SORT ? null : v })}
          >
            <SelectTrigger aria-label="Sort by" className="min-w-0 flex-1 sm:w-48 sm:flex-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="end">
              {sortOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      }
    >
      <div className="w-full sm:ml-auto sm:w-auto">
        <Tabs className="min-w-0" value={params.category ?? "ALL"} onValueChange={(v) => update({ category: v === "ALL" ? null : String(v) })}>
          <TabsList aria-label="Category" className="w-full justify-start overflow-x-auto [scrollbar-width:none] sm:w-fit sm:justify-center [&::-webkit-scrollbar]:hidden">
            <CategoryTab value="ALL" label="All" count={counts.ALL} />
            {toOptions(ASSET_CATEGORY_LABELS).map((o) => (
              <CategoryTab key={o.value} value={o.value} label={o.label} count={counts[o.value]} />
            ))}
          </TabsList>
        </Tabs>
      </div>
    </FilterBar>
  );
}

/** "Only my interests": the buyer's profile applied as filters. Disabled until interests are set. */
function MyInterestsToggle({
  checked,
  hasInterests,
  className,
}: {
  checked: boolean;
  hasInterests: boolean;
  className?: string;
}) {
  const { update } = useListState();
  return (
    <Label
      title={hasInterests ? undefined : "Add interests in your profile to use this"}
      className={cn("h-10 shrink-0 cursor-pointer items-center gap-2 px-1 font-normal", !hasInterests && "cursor-not-allowed opacity-60", className)}
    >
      <Switch
        checked={checked}
        disabled={!hasInterests}
        onCheckedChange={(v) => update({ mine: v ? "1" : null })}
      />
      Only my interests
    </Label>
  );
}

function CategoryTab({ value, label, count }: { value: string; label: string; count: number }) {
  return (
    <TabsTrigger value={value} className="gap-0.5 px-[3px] text-xs sm:gap-1.5 sm:px-4 sm:text-sm">
      {label}
      <span className="min-w-[1.5ch] text-text-muted tabular-nums sm:min-w-[2ch]">{count}</span>
    </TabsTrigger>
  );
}

/** Popover on desktop, Sheet on mobile; both hold the same form with an explicit Apply. */
function FiltersPanel({
  params,
  activeCount,
  hasInterests,
}: {
  params: AssetListParams;
  activeCount: number;
  hasInterests: boolean;
}) {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const label = (
    <>
      <SlidersHorizontalIcon aria-hidden />
      Filters
      {activeCount > 0 && (
        <span className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground tabular-nums">
          {activeCount}
        </span>
      )}
    </>
  );

  return (
    <>
      <Popover open={desktopOpen} onOpenChange={setDesktopOpen}>
        <PopoverTrigger render={<Button variant="outline" className="hidden md:inline-flex" />}>{label}</PopoverTrigger>
        <PopoverContent align="end" className="w-[26rem] gap-0 rounded-xl p-0">
          <FiltersForm params={params} onDone={() => setDesktopOpen(false)} className="max-h-[min(36rem,var(--available-height))]" />
        </PopoverContent>
      </Popover>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger render={<Button variant="outline" className="shrink-0 md:hidden" />}>{label}</SheetTrigger>
        <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-sm">
          <SheetHeader className="border-b">
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription className="sr-only">Narrow down the asset list</SheetDescription>
          </SheetHeader>
          <FiltersForm params={params} showInterests hasInterests={hasInterests} onDone={() => setMobileOpen(false)} className="min-h-0 flex-1" />
        </SheetContent>
      </Sheet>
    </>
  );
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Draft state lives here; the URL changes only on Apply / Reset. Mounted only while the panel is open. */
function FiltersForm({
  params,
  showInterests = false,
  hasInterests = false,
  onDone,
  className,
}: {
  params: AssetListParams;
  /** True only in the mobile sheet: on desktop the toggle sits in the controls row. */
  showInterests?: boolean;
  hasInterests?: boolean;
  onDone: () => void;
  className?: string;
}) {
  const { update } = useListState();
  const [country, setCountry] = useState(params.country);
  const [licenseType, setLicenseType] = useState(params.licenseType);
  const [assetType, setAssetType] = useState(params.assetType);
  const [businessStatus, setBusinessStatus] = useState(params.businessStatus);
  const [priceMin, setPriceMin] = useState(params.priceMin?.toString() ?? "");
  const [priceMax, setPriceMax] = useState(params.priceMax?.toString() ?? "");
  const [includeOnRequest, setIncludeOnRequest] = useState(params.includeOnRequest);
  const [validated, setValidated] = useState(params.validated);

  const allEu = EU_CODES.every((c) => country.includes(c));

  function apply() {
    const csv = (list: string[]) => (list.length ? list.join(",") : null);
    const digits = (s: string) => (/^\d{1,9}$/.test(s.trim()) ? s.trim() : null);
    const min = digits(priceMin);
    const max = digits(priceMax);
    update({
      country: csv(country),
      licenseType: csv(licenseType),
      assetType: csv(assetType),
      businessStatus: csv(businessStatus),
      priceMin: min,
      priceMax: max,
      includeOnRequest: (min || max) && includeOnRequest ? "1" : null,
      validated: validated ? "1" : null,
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
        {showInterests && (
          <MyInterestsToggle checked={params.mine && hasInterests} hasInterests={hasInterests} className="flex" />
        )}
        <Group
          title="Country"
          action={
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-pressed={allEu}
              onClick={() => setCountry(allEu ? country.filter((c) => !EU_CODES.includes(c)) : [...new Set([...country, ...EU_CODES])])}
            >
              {allEu ? "Clear EU" : "All EU"}
            </Button>
          }
        >
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {COUNTRIES.map((c) => (
              <Label key={c.code} className="flex min-h-9 cursor-pointer items-center gap-2 font-normal">
                <Checkbox
                  checked={country.includes(c.code)}
                  onCheckedChange={() => setCountry(toggle(country, c.code))}
                />
                <CountryFlag code={c.code} className="w-5" />
                <span className="truncate">{c.name}</span>
              </Label>
            ))}
          </div>
        </Group>

        <ChipGroup title="License type" labels={LICENSE_TYPE_LABELS} value={licenseType} onChange={setLicenseType} />
        <ChipGroup title="Asset type" labels={ASSET_TYPE_LABELS} value={assetType} onChange={setAssetType} />
        <ChipGroup title="Business status" labels={BUSINESS_STATUS_LABELS} value={businessStatus} onChange={setBusinessStatus} />

        <Group title="Asking price (EUR)">
          <div className="grid grid-cols-2 gap-2">
            <Input
              inputMode="numeric"
              placeholder="From"
              aria-label="Price from"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value.replace(/\D/g, "").slice(0, 9))}
            />
            <Input
              inputMode="numeric"
              placeholder="To"
              aria-label="Price to"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value.replace(/\D/g, "").slice(0, 9))}
            />
          </div>
          <Label className="mt-2 flex min-h-9 cursor-pointer items-center gap-2 font-normal">
            <Checkbox checked={includeOnRequest} onCheckedChange={(v) => setIncludeOnRequest(v === true)} />
            Include price on request
          </Label>
        </Group>

        <Label className="flex min-h-9 cursor-pointer items-center gap-2 font-normal">
          <Checkbox checked={validated} onCheckedChange={(v) => setValidated(v === true)} />
          Validated only
        </Label>
      </div>

      <SheetFooterBar>
        <Button type="button" variant="ghost" onClick={reset}>
          Reset
        </Button>
        <Button type="submit">Apply</Button>
      </SheetFooterBar>
    </form>
  );
}

function SheetFooterBar({ children }: { children: React.ReactNode }) {
  return <SheetFooter className="mt-0 flex-row justify-end gap-2 border-t bg-popover p-3">{children}</SheetFooter>;
}

function Group({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <div className="mb-2 flex h-7 items-center justify-between">
        <legend className="float-left text-sm font-semibold">{title}</legend>
        {action}
      </div>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

function ChipGroup<T extends string>({
  title,
  labels,
  value,
  onChange,
}: {
  title: string;
  labels: Record<T, string>;
  value: T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <Group title={title}>
      <div className="flex flex-wrap gap-2">
        {toOptions(labels).map((o) => {
          const on = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(toggle(value, o.value))}
              className={cn(
                "h-8 rounded-full border px-3 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                on ? "border-primary bg-primary-soft font-medium text-primary" : "bg-surface hover:bg-primary-soft",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </Group>
  );
}
