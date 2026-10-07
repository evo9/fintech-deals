"use client";

import { SearchInput } from "@/components/shared/filter-bar";
import { Button } from "@/components/ui/button";
import { useListState } from "@/components/shared/list-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ASSET_CATEGORY_LABELS, ASSET_STATUS_LABELS, COUNTRIES, toOptions } from "@/lib/reference";
import type { AdminAssetsParams } from "../schema";

const ALL = "ALL";

const STATUS_OPTIONS = [{ value: ALL, label: "All statuses" }, ...toOptions(ASSET_STATUS_LABELS)];
const CATEGORY_OPTIONS = [{ value: ALL, label: "All categories" }, ...toOptions(ASSET_CATEGORY_LABELS)];
const COUNTRY_OPTIONS = [{ value: ALL, label: "All countries" }, ...COUNTRIES.map((c) => ({ value: c.code, label: c.name }))];
const VALIDATED_OPTIONS = [
  { value: ALL, label: "Any validation" },
  { value: "yes", label: "Validated" },
  { value: "no", label: "Not validated" },
];

function Filter({
  label,
  value,
  options,
  param,
}: {
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  param: string;
}) {
  const { update } = useListState();
  return (
    <Select value={value ?? ALL} items={options} onValueChange={(v) => update({ [param]: v === ALL ? null : v })}>
      <SelectTrigger aria-label={label} className="w-full min-w-0 sm:w-36 lg:w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const FILTER_KEYS = ["q", "status", "category", "country", "validated"];

/** Search on the left, the four filters (and Clear filters) on the right; they wrap on a narrow screen. */
export function AssetsFilters({ params }: { params: AdminAssetsParams }) {
  const { update } = useListState();
  const hasActiveFilters =
    params.q !== "" ||
    params.status !== undefined ||
    params.category !== undefined ||
    params.country !== undefined ||
    params.validated !== undefined;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        initialQ={params.q}
        placeholder="Search by ID, headline or regulator"
        className="min-w-0 sm:max-w-[22.5rem]"
      />
      <div className="grid w-full grid-cols-2 items-center gap-3 sm:flex sm:flex-wrap lg:ml-auto lg:w-auto lg:flex-nowrap">
        <Filter label="Status" value={params.status} options={STATUS_OPTIONS} param="status" />
        <Filter label="Category" value={params.category} options={CATEGORY_OPTIONS} param="category" />
        <Filter label="Country" value={params.country} options={COUNTRY_OPTIONS} param="country" />
        <Filter label="Validation" value={params.validated} options={VALIDATED_OPTIONS} param="validated" />
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="col-span-2 sm:col-span-1" onClick={() => update(Object.fromEntries(FILTER_KEYS.map((k) => [k, null])))}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
