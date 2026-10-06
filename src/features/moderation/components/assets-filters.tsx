"use client";

import { FilterBar } from "@/components/shared/filter-bar";
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
      <SelectTrigger aria-label={label} className="min-w-0 flex-1 sm:w-44 sm:flex-none">
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

export function AssetsFilters({ params, total }: { params: AdminAssetsParams; total: number }) {
  const hasActiveFilters =
    params.q !== "" ||
    params.status !== undefined ||
    params.category !== undefined ||
    params.country !== undefined ||
    params.validated !== undefined;

  return (
    <FilterBar
      total={total}
      singular="asset"
      plural="assets"
      filterKeys={["q", "status", "category", "country", "validated"]}
      hasActiveFilters={hasActiveFilters}
      search={{ initialQ: params.q, placeholder: "Search by ID, headline or regulator" }}
    >
      <div className="flex w-full flex-wrap gap-3 sm:ml-auto sm:w-auto sm:flex-nowrap">
        <Filter label="Status" value={params.status} options={STATUS_OPTIONS} param="status" />
        <Filter label="Category" value={params.category} options={CATEGORY_OPTIONS} param="category" />
        <Filter label="Country" value={params.country} options={COUNTRY_OPTIONS} param="country" />
        <Filter label="Validation" value={params.validated} options={VALIDATED_OPTIONS} param="validated" />
      </div>
    </FilterBar>
  );
}
