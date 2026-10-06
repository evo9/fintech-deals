import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { PAGE_SIZE, toSkipTake } from "@/lib/pagination";
import { notFound } from "next/navigation";
import { catalogBuyersWhere, ownAssetsWhere, withVisibility } from "@/features/access/visibility";
import type { SessionUser } from "@/features/auth/session";
import type { BuyerListParams } from "./schema";
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

// ---------- buyers catalog (seller) ----------

const buyerCardSelect = {
  id: true,
  name: true,
  companyName: true,
  country: true,
  buyerProfile: {
    select: {
      buyerType: true,
      headline: true,
      countries: true,
      licenseTypes: true,
      categories: true,
      assetTypes: true,
      budgetMin: true,
      budgetMax: true,
    },
  },
} satisfies Prisma.UserSelect;

type BuyerRow = Prisma.UserGetPayload<{ select: typeof buyerCardSelect }>;
export type BuyerCard = BuyerRow & { match: MatchResult | null };

function buyerFilters(p: BuyerListParams): Prisma.UserWhereInput[] {
  const profile: Prisma.BuyerProfileWhereInput[] = [];
  if (p.type.length) profile.push({ buyerType: { in: p.type } });
  if (p.country.length) profile.push({ countries: { hasSome: p.country } });
  if (p.licenseType.length) profile.push({ licenseTypes: { hasSome: p.licenseType } });
  if (p.category.length) profile.push({ categories: { hasSome: p.category } });
  // The buyer's budget range must overlap the requested one; an open end overlaps; no budget at all does not.
  if (p.budgetMin !== undefined || p.budgetMax !== undefined) {
    profile.push({ OR: [{ budgetMin: { not: null } }, { budgetMax: { not: null } }] });
    if (p.budgetMax !== undefined) profile.push({ OR: [{ budgetMin: null }, { budgetMin: { lte: p.budgetMax } }] });
    if (p.budgetMin !== undefined) profile.push({ OR: [{ budgetMax: null }, { budgetMax: { gte: p.budgetMin } }] });
  }

  const clauses: Prisma.UserWhereInput[] = [];
  if (profile.length) clauses.push({ buyerProfile: { is: { AND: profile } } });
  if (p.q) {
    clauses.push({
      OR: [
        { name: { contains: p.q, mode: "insensitive" } },
        { companyName: { contains: p.q, mode: "insensitive" } },
        { buyerProfile: { is: { headline: { contains: p.q, mode: "insensitive" } } } },
        { buyerProfile: { is: { about: { contains: p.q, mode: "insensitive" } } } },
      ],
    });
  }
  return clauses;
}

/** Buyers catalog for sellers: active buyers with a filled profile, optionally scored against one own asset. */
export async function listCatalogBuyers(viewer: SessionUser, p: BuyerListParams) {
  if (viewer.role !== "SELLER") notFound();

  const ownPublished = withVisibility(ownAssetsWhere(viewer), { status: "PUBLISHED" });
  const myAssets = await db.asset.findMany({
    where: ownPublished,
    select: { id: true, headline: true },
    orderBy: { id: "desc" },
    take: 50,
  });
  // an asset id that is not the seller's own (or not published) is simply ignored
  const target = p.asset ? myAssets.find((a) => a.id === p.asset) : undefined;
  const asset = target
    ? await db.asset.findFirst({
        where: withVisibility(ownPublished, { id: target.id }),
        select: { country: true, licenseType: true, category: true, assetType: true, askingPrice: true },
      })
    : null;

  const where = withVisibility(catalogBuyersWhere, { AND: buyerFilters(p) });
  const score = (r: BuyerRow): BuyerCard => ({
    ...r,
    match: asset && r.buyerProfile ? scoreMatch(asset, r.buyerProfile) : null,
  });

  if (asset) {
    // "Match against" sorts in memory over the whole filtered set (prototype shortcut, see README)
    const rows = await db.user.findMany({ where, select: buyerCardSelect, orderBy: [{ id: "desc" }] });
    const sorted = rows
      .map(score)
      .sort((a, b) => compareByMatch({ match: a.match, publishedAt: null, id: 0 }, { match: b.match, publishedAt: null, id: 0 }));
    const { skip, take } = toSkipTake(p.page, PAGE_SIZE.cards);
    return { items: sorted.slice(skip, skip + take), total: rows.length, myAssets, matchAsset: target?.id };
  }

  const [rows, total] = await db.$transaction([
    db.user.findMany({
      where,
      select: buyerCardSelect,
      orderBy: [{ buyerProfile: { updatedAt: "desc" } }, { id: "desc" }],
      ...toSkipTake(p.page, PAGE_SIZE.cards),
    }),
    db.user.count({ where }),
  ]);
  return { items: rows.map(score), total, myAssets, matchAsset: undefined };
}
