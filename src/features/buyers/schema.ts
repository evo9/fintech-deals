import { z } from "zod";
import { AssetCategory, BuyerType, LicenseType } from "@prisma/client";
import { COUNTRIES } from "@/lib/reference";
import { csvOf, euros } from "@/features/assets/schema";

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
