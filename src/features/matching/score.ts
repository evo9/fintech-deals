// Pure matching of an asset against a buyer's interests (spec section 6): no database access.
import type { AssetCategory, AssetType, LicenseType } from "@prisma/client";

export type MatchKey = "country" | "licenseType" | "category" | "assetType" | "budget";

export type AssetForMatch = {
  country: string;
  licenseType: LicenseType;
  category: AssetCategory;
  assetType: AssetType;
  askingPrice: number | null;
};

export type BuyerInterests = {
  countries: string[];
  licenseTypes: LicenseType[];
  categories: AssetCategory[];
  assetTypes: AssetType[];
  budgetMin: number | null;
  budgetMax: number | null;
};

export type MatchResult = {
  matched: number;
  /** Criteria the buyer specified (and that apply to this asset). */
  considered: number;
  /** Only the considered criteria. */
  criteria: { key: MatchKey; ok: boolean }[];
};

export const MATCH_LABELS: Record<MatchKey, string> = {
  country: "Country",
  licenseType: "License type",
  category: "Type of business",
  assetType: "Asset type",
  budget: "Budget",
};

export function hasInterests(profile: BuyerInterests | null | undefined): profile is BuyerInterests {
  if (!profile) return false;
  return (
    profile.countries.length > 0 ||
    profile.licenseTypes.length > 0 ||
    profile.categories.length > 0 ||
    profile.assetTypes.length > 0 ||
    profile.budgetMin != null ||
    profile.budgetMax != null
  );
}

/** A criterion counts only if the buyer set it; a price on request does not take part in the budget. */
export function scoreMatch(asset: AssetForMatch, profile: BuyerInterests): MatchResult {
  const criteria: MatchResult["criteria"] = [];
  if (profile.countries.length) {
    criteria.push({ key: "country", ok: profile.countries.includes(asset.country) });
  }
  if (profile.licenseTypes.length) {
    criteria.push({ key: "licenseType", ok: profile.licenseTypes.includes(asset.licenseType) });
  }
  if (profile.categories.length) {
    criteria.push({ key: "category", ok: profile.categories.includes(asset.category) });
  }
  if (profile.assetTypes.length) {
    criteria.push({ key: "assetType", ok: profile.assetTypes.includes(asset.assetType) });
  }
  const hasBudget = profile.budgetMin != null || profile.budgetMax != null;
  if (hasBudget && asset.askingPrice != null) {
    const price = asset.askingPrice;
    criteria.push({
      key: "budget",
      ok: (profile.budgetMin == null || price >= profile.budgetMin) && (profile.budgetMax == null || price <= profile.budgetMax),
    });
  }
  return { matched: criteria.filter((c) => c.ok).length, considered: criteria.length, criteria };
}

/** Matching is shown only when at least one criterion was considered. */
export function isShown(match: MatchResult | null): match is MatchResult {
  return match !== null && match.considered > 0;
}

export function isStrongMatch(match: MatchResult): boolean {
  return match.considered > 0 && match.matched === match.considered;
}

/** Best match first: share of matched criteria, then newest. */
export function compareByMatch(
  a: { match: MatchResult | null; publishedAt: Date | null; id: number },
  b: { match: MatchResult | null; publishedAt: Date | null; id: number },
): number {
  const ra = a.match && a.match.considered > 0 ? a.match.matched / a.match.considered : 0;
  const rb = b.match && b.match.considered > 0 ? b.match.matched / b.match.considered : 0;
  if (rb !== ra) return rb - ra;
  const da = a.publishedAt?.getTime() ?? 0;
  const db = b.publishedAt?.getTime() ?? 0;
  return db - da || b.id - a.id;
}
