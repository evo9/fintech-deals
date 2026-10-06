import { z } from "zod";
import { AssetCategory, AssetType, BusinessStatus, LicenseType } from "@prisma/client";
import { COUNTRIES } from "@/lib/reference";

/** Multi-select values are comma-separated (`?country=MT,LT`); unknown values are dropped. */
function csvOf<T extends string>(allowed: readonly T[]) {
  const set = new Set<string>(allowed);
  return z
    .string()
    .transform((s) => [...new Set(s.split(",").filter((v) => set.has(v)))] as T[])
    .catch([]);
}

const flag = z
  .string()
  .transform((s) => s === "1")
  .catch(false);

const euros = z
  .string()
  .regex(/^\d{1,9}$/)
  .transform(Number)
  .optional()
  .catch(undefined);

export const ASSET_SORTS = ["newest", "price_asc", "price_desc"] as const;

/** URL state of the buyer catalog. Invalid values fall back to defaults instead of throwing. */
export const assetListParams = z.object({
  q: z.string().trim().max(100).catch(""),
  category: z.enum(AssetCategory).optional().catch(undefined),
  country: csvOf(COUNTRIES.map((c) => c.code)),
  licenseType: csvOf(Object.values(LicenseType)),
  assetType: csvOf(Object.values(AssetType)),
  businessStatus: csvOf(Object.values(BusinessStatus)),
  priceMin: euros,
  priceMax: euros,
  includeOnRequest: flag,
  validated: flag,
  mine: flag,
  sort: z.enum(ASSET_SORTS).catch("newest"),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
});
export type AssetListParams = z.infer<typeof assetListParams>;

export const DEFAULT_ASSET_SORT = "newest" satisfies AssetListParams["sort"];
