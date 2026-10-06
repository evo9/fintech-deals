import { db } from "@/lib/db";
import type { BuyerInterests } from "@/features/matching/score";

/** Interests of a buyer for matching; null when the profile does not exist yet. */
export async function getBuyerInterests(userId: string): Promise<BuyerInterests | null> {
  return db.buyerProfile.findUnique({
    where: { userId },
    select: {
      countries: true,
      licenseTypes: true,
      categories: true,
      assetTypes: true,
      budgetMin: true,
      budgetMax: true,
    },
  });
}
