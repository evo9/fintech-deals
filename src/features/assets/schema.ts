import { z } from "zod";
import { AssetCategory, AssetType, BusinessStatus, LicenseType } from "@prisma/client";
import { COUNTRIES, defaultRegulator } from "@/lib/reference";

/** Multi-select values are comma-separated (`?country=MT,LT`); unknown values are dropped. */
export function csvOf<T extends string>(allowed: readonly T[]) {
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

export const euros = z
  .string()
  .regex(/^\d{1,9}$/)
  .transform(Number)
  .optional()
  .catch(undefined);

export const ASSET_SORTS = ["newest", "price_asc", "price_desc", "best_match"] as const;

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

// ---------- my assets (seller) ----------

export const MY_ASSET_TABS = ["ALL", "PUBLISHED", "DRAFT", "ARCHIVED", "REMOVED"] as const;
export type MyAssetTab = (typeof MY_ASSET_TABS)[number];

/** URL state of `/my-assets`: status tab and page. */
export const myAssetsParams = z.object({
  status: z.enum(MY_ASSET_TABS).catch("ALL"),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
});
export type MyAssetsParams = z.infer<typeof myAssetsParams>;

// ---------- asset form (seller): shared by the form (client) and the actions (server) ----------

export const assetIdSchema = z.string().regex(/^\d{1,9}$/, "Asset not found").transform(Number).or(z.number().int().min(1).max(999_999_999));

/** "draft" and "publish" create or move a draft; "save" edits a published or withdrawn asset. */
export const assetIntentSchema = z.enum(["draft", "publish", "save"]);
export type AssetIntent = z.infer<typeof assetIntentSchema>;

export const MAX_INCLUDED = 10;
export const HEADLINE_MAX = 90;
export const DESCRIPTION_MAX = 2000;
export const PRICE_MAX = 1_000_000_000;
const COUNTRY_CODES = new Set(COUNTRIES.map((c) => c.code));

export function intField(min: number, max: number, message: string) {
  return z
    .string()
    .trim()
    .transform((s) => (s === "" ? null : Number(s)))
    .pipe(z.number({ error: message }).int(message).min(min, message).max(max, message).nullable());
}

/**
 * `draft` needs a headline and the five classification fields (the columns are NOT NULL, so a draft
 * cannot be saved without them); `publish` validates everything (spec 7.7).
 */
export function assetSchema(mode: "draft" | "publish") {
  const full = mode === "publish";
  const year = new Date().getFullYear();

  return z
    .object({
      headline: z
        .string()
        .trim()
        .min(full ? 5 : 1, full ? "Use at least 5 characters" : "Enter a headline")
        .max(HEADLINE_MAX, `Use ${HEADLINE_MAX} characters or fewer`),
      category: z.enum(AssetCategory, { error: "Choose a type of business" }),
      licenseType: z.enum(LicenseType, { error: "Choose a license type" }),
      assetType: z.enum(AssetType, { error: "Choose an asset type" }),
      businessStatus: z.enum(BusinessStatus, { error: "Choose a business status" }),
      country: z.string().refine((c) => COUNTRY_CODES.has(c), "Choose a country"),
      regulator: z
        .string()
        .trim()
        .max(100, "Use 100 characters or fewer")
        .refine((r) => !full || r !== "", "Enter the regulator"),
      yearOfIssue: intField(1990, year, `Enter a year between 1990 and ${year}`),
      employees: intField(0, 100_000, "Enter a number between 0 and 100,000"),
      priceOnRequest: z.boolean(),
      askingPrice: z.string().trim(),
      included: z
        .array(z.string().trim().min(1, "Tags cannot be empty").max(60, "Each tag can have up to 60 characters"))
        .max(MAX_INCLUDED, `Add up to ${MAX_INCLUDED} items`)
        .refine((tags) => new Set(tags.map((t) => t.toLowerCase())).size === tags.length, "Remove duplicate tags"),
      description: z
        .string()
        .trim()
        .max(DESCRIPTION_MAX, `Use ${DESCRIPTION_MAX} characters or fewer`)
        .refine((d) => !full || d.length >= 50, "Use at least 50 characters"),
    })
    .superRefine((v, ctx) => {
      if (v.priceOnRequest) return;
      if (v.askingPrice === "") {
        if (full) ctx.addIssue({ code: "custom", path: ["askingPrice"], message: "Enter a price or choose Price on request" });
        return;
      }
      const n = Number(v.askingPrice);
      if (!/^\d+$/.test(v.askingPrice) || n < 1 || n > PRICE_MAX) {
        ctx.addIssue({ code: "custom", path: ["askingPrice"], message: "Enter an amount between 1 and 1,000,000,000" });
      }
    })
    .transform((v) => ({
      headline: v.headline,
      category: v.category,
      licenseType: v.licenseType,
      assetType: v.assetType,
      businessStatus: v.businessStatus,
      country: v.country,
      regulator: v.regulator || defaultRegulator(v.country),
      yearOfIssue: v.yearOfIssue,
      employees: v.employees,
      askingPrice: v.priceOnRequest || v.askingPrice === "" ? null : Number(v.askingPrice),
      included: v.included,
      description: v.description,
    }));
}
export type AssetInput = z.output<ReturnType<typeof assetSchema>>;

/** Raw form values (strings) in the shape `assetSchema` expects. */
export function formDataToAsset(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? "");
  return {
    headline: text("headline"),
    category: text("category"),
    licenseType: text("licenseType"),
    assetType: text("assetType"),
    businessStatus: text("businessStatus"),
    country: text("country"),
    regulator: text("regulator"),
    yearOfIssue: text("yearOfIssue"),
    employees: text("employees"),
    priceOnRequest: formData.get("priceOnRequest") === "1",
    askingPrice: text("askingPrice"),
    included: formData.getAll("included").map(String),
    description: text("description"),
  };
}
