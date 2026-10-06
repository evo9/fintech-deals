import { db } from "@/lib/db";
import { catalogBuyersWhere, withVisibility } from "@/features/access/visibility";
import type { SessionUser } from "@/features/auth/session";
import { compareByMatch, scoreMatch, type AssetForMatch, type BuyerInterests, type MatchResult } from "@/features/matching/score";

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

const MATCHING_BUYERS_LIMIT = 5;

export type MatchingBuyer = {
  id: string;
  name: string;
  companyName: string | null;
  country: string | null;
  match: MatchResult;
};

/**
 * Top buyers for one of the seller's own published assets: only buyers visible in the buyers catalog
 * (active, profile filled), best match first. Scored in memory, like the "Best match" sort.
 */
export async function topMatchingBuyers(
  viewer: SessionUser,
  asset: AssetForMatch & { id: number; sellerId: string; status: string },
): Promise<MatchingBuyer[]> {
  if (viewer.role !== "SELLER" || viewer.id !== asset.sellerId || asset.status !== "PUBLISHED") return [];

  const buyers = await db.user.findMany({
    where: withVisibility(catalogBuyersWhere),
    select: {
      id: true,
      name: true,
      companyName: true,
      country: true,
      buyerProfile: {
        select: { countries: true, licenseTypes: true, categories: true, assetTypes: true, budgetMin: true, budgetMax: true },
      },
    },
  });

  return buyers
    .flatMap((b) => {
      if (!b.buyerProfile) return [];
      const match = scoreMatch(asset, b.buyerProfile);
      return match.matched > 0 ? [{ id: b.id, name: b.name, companyName: b.companyName, country: b.country, match }] : [];
    })
    .sort((a, b) => compareByMatch({ ...a, publishedAt: null, id: 0 }, { ...b, publishedAt: null, id: 0 }) || a.name.localeCompare(b.name))
    .slice(0, MATCHING_BUYERS_LIMIT);
}
