import { z } from "zod";
import { AssetCategory, AssetType, BuyerType, LicenseType } from "@prisma/client";
import { COUNTRIES } from "@/lib/reference";
import { csvOf, euros, intField } from "@/features/assets/schema";

/** URL state of the buyers catalog (`/buyers`). Invalid values fall back to defaults instead of throwing. */
export const buyerListParams = z.object({
  q: z.string().trim().max(100).catch(""),
  type: csvOf(Object.values(BuyerType)),
  country: csvOf(COUNTRIES.map((c) => c.code)),
  licenseType: csvOf(Object.values(LicenseType)),
  category: csvOf(Object.values(AssetCategory)),
  budgetMin: euros,
  budgetMax: euros,
  /** "Match against": id of one of the seller's own assets. */
  asset: z.coerce.number().int().min(1).max(999_999_999).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
});
export type BuyerListParams = z.infer<typeof buyerListParams>;

// ---------- own profile (buyer): shared by the form and the action ----------

const MAX_BUDGET = 1_000_000_000;
const COUNTRY_CODES = new Set(COUNTRIES.map((c) => c.code));
const emptyToNull = (v: string) => (v === "" ? null : v);
const unique = <T>(list: T[]) => [...new Set(list)];

export const buyerProfileSchema = z
  .object({
    companyName: z.string().trim().max(120, "Use 120 characters or fewer").transform(emptyToNull),
    buyerType: z
      .union([z.enum(BuyerType), z.literal("")], { error: "Choose a buyer type from the list" })
      .transform((v) => v || null),
    headline: z.string().trim().max(120, "Use 120 characters or fewer").transform(emptyToNull),
    about: z.string().trim().max(2000, "Use 2000 characters or fewer").transform(emptyToNull),
    countries: z.array(z.string().refine((c) => COUNTRY_CODES.has(c), "Choose countries from the list")).transform(unique),
    licenseTypes: z.array(z.enum(LicenseType)).transform(unique),
    categories: z.array(z.enum(AssetCategory)).transform(unique),
    assetTypes: z.array(z.enum(AssetType)).transform(unique),
    budgetMin: intField(0, MAX_BUDGET, "Enter an amount up to 1,000,000,000"),
    budgetMax: intField(0, MAX_BUDGET, "Enter an amount up to 1,000,000,000"),
  })
  .superRefine((v, ctx) => {
    if (v.budgetMin !== null && v.budgetMax !== null && v.budgetMin > v.budgetMax) {
      ctx.addIssue({ code: "custom", path: ["budgetMax"], message: "The maximum must not be below the minimum" });
    }
  });
export type BuyerProfileInput = z.output<typeof buyerProfileSchema>;

export function formDataToProfile(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? "");
  return {
    companyName: text("companyName"),
    buyerType: text("buyerType"),
    headline: text("headline"),
    about: text("about"),
    countries: formData.getAll("countries").map(String),
    licenseTypes: formData.getAll("licenseTypes").map(String),
    categories: formData.getAll("categories").map(String),
    assetTypes: formData.getAll("assetTypes").map(String),
    budgetMin: text("budgetMin"),
    budgetMax: text("budgetMax"),
  };
}
