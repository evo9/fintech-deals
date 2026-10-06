import { cache } from "react";
import { notFound } from "next/navigation";
import { Prisma, type AssetCategory } from "@prisma/client";
import { db } from "@/lib/db";
import { PAGE_SIZE, toSkipTake } from "@/lib/pagination";
import { COUNTRIES } from "@/lib/reference";
import {
  assetVisibilityWhere,
  canViewAsset,
  catalogAssetsWhere,
  withVisibility,
} from "@/features/access/visibility";
import type { SessionUser } from "@/features/auth/session";
import { getBuyerInterests } from "@/features/buyers/queries";
import {
  compareByMatch,
  hasInterests,
  scoreMatch,
  type BuyerInterests,
  type MatchResult,
} from "@/features/matching/score";
import type { AssetListParams } from "./schema";

const assetCardSelect = {
  id: true,
  headline: true,
  category: true,
  licenseType: true,
  assetType: true,
  businessStatus: true,
  country: true,
  regulator: true,
  yearOfIssue: true,
  employees: true,
  askingPrice: true,
  included: true,
  description: true,
  publishedAt: true,
  validatedAt: true,
  sellerId: true,
} satisfies Prisma.AssetSelect;

type AssetCardRow = Prisma.AssetGetPayload<{ select: typeof assetCardSelect }>;

/** Card data plus the match with the viewer's interests (null when they have none). */
export type AssetCard = AssetCardRow & { match: MatchResult | null };

/** Same shape as the tabs: every category plus the "All" total. */
export type CategoryCounts = Record<AssetCategory | "ALL", number>;

/** Ids whose `included` tags contain the text: Prisma has no substring match on String[]. Visibility is applied by the caller. */
async function idsMatchingIncluded(text: string): Promise<number[]> {
  const pattern = `%${text.replace(/[\\%_]/g, "\\$&")}%`;
  const rows = await db.$queryRaw<{ id: number }[]>`
    SELECT a."id" FROM "Asset" a
    WHERE EXISTS (SELECT 1 FROM unnest(a."included") AS tag WHERE tag ILIKE ${pattern})`;
  return rows.map((r) => r.id);
}

/** Search: asset ID, headline, description, country, regulator, included. */
async function searchWhere(q: string): Promise<Prisma.AssetWhereInput | null> {
  if (!q) return null;
  const id = /^#?(\d{1,9})$/.exec(q);
  const needle = q.toLowerCase();
  const countryCodes = COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(needle) || c.code.toLowerCase() === needle,
  ).map((c) => c.code);
  const includedIds = await idsMatchingIncluded(q);

  return {
    OR: [
      ...(id ? [{ id: Number(id[1]) }] : []),
      { headline: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { regulator: { contains: q, mode: "insensitive" } },
      ...(countryCodes.length ? [{ country: { in: countryCodes } }] : []),
      ...(includedIds.length ? [{ id: { in: includedIds } }] : []),
    ],
  };
}

function priceWhere(p: AssetListParams): Prisma.AssetWhereInput | null {
  if (p.priceMin === undefined && p.priceMax === undefined) return null;
  const range: Prisma.IntNullableFilter = {};
  if (p.priceMin !== undefined) range.gte = p.priceMin;
  if (p.priceMax !== undefined) range.lte = p.priceMax;
  return { OR: [{ askingPrice: range }, ...(p.includeOnRequest ? [{ askingPrice: null }] : [])] };
}

/** "Only my interests": every criterion the buyer set becomes a filter; a price on request passes the budget. */
function interestsWhere(i: BuyerInterests): Prisma.AssetWhereInput {
  const budget: Prisma.IntNullableFilter = {};
  if (i.budgetMin != null) budget.gte = i.budgetMin;
  if (i.budgetMax != null) budget.lte = i.budgetMax;
  const clauses: Prisma.AssetWhereInput[] = [
    ...(i.countries.length ? [{ country: { in: i.countries } }] : []),
    ...(i.licenseTypes.length ? [{ licenseType: { in: i.licenseTypes } }] : []),
    ...(i.categories.length ? [{ category: { in: i.categories } }] : []),
    ...(i.assetTypes.length ? [{ assetType: { in: i.assetTypes } }] : []),
    ...(i.budgetMin != null || i.budgetMax != null ? [{ OR: [{ askingPrice: null }, { askingPrice: budget }] }] : []),
  ];
  return { AND: clauses };
}

/** Everything except the category: the tab counters must not depend on the selected tab. */
async function buildFilters(p: AssetListParams, interests: BuyerInterests | null): Promise<Prisma.AssetWhereInput[]> {
  const clauses: Array<Prisma.AssetWhereInput | null> = [
    await searchWhere(p.q),
    p.country.length ? { country: { in: p.country } } : null,
    p.licenseType.length ? { licenseType: { in: p.licenseType } } : null,
    p.assetType.length ? { assetType: { in: p.assetType } } : null,
    p.businessStatus.length ? { businessStatus: { in: p.businessStatus } } : null,
    priceWhere(p),
    p.validated ? { validatedAt: { not: null } } : null,
    p.mine && hasInterests(interests) ? interestsWhere(interests) : null,
  ];
  return clauses.filter((c): c is Prisma.AssetWhereInput => c !== null);
}

function assetOrderBy(sort: AssetListParams["sort"]): Prisma.AssetOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ askingPrice: { sort: "asc", nulls: "last" } }, { id: "desc" }];
    case "price_desc":
      return [{ askingPrice: { sort: "desc", nulls: "last" } }, { id: "desc" }];
    default:
      return [{ publishedAt: "desc" }, { id: "desc" }];
  }
}

/** Buyer catalog page: cards of the current page, total for the selected tab, counters for all tabs. */
export async function listCatalogAssets(viewer: SessionUser, p: AssetListParams) {
  if (viewer.role !== "BUYER") notFound();

  const interests = await getBuyerInterests(viewer.id);
  const interestsSet = hasInterests(interests);
  const filters = await buildFilters(p, interests);
  const tabsWhere = withVisibility(catalogAssetsWhere, { AND: filters });
  const listWhere = withVisibility(catalogAssetsWhere, {
    AND: p.category ? [...filters, { category: p.category }] : filters,
  });
  // "Best match" sorts in memory over the whole filtered set (a prototype shortcut, see README)
  const bestMatch = p.sort === "best_match" && interestsSet;

  // Array transaction (one round trip): an interactive one needs its own connection and times out on the pooler
  const [rows, grouped] = await db.$transaction([
    db.asset.findMany({
      where: listWhere,
      orderBy: assetOrderBy(bestMatch ? "newest" : p.sort),
      ...(bestMatch ? {} : toSkipTake(p.page, PAGE_SIZE.cards)),
      select: assetCardSelect,
    }),
    db.asset.groupBy({
      by: ["category"],
      where: tabsWhere,
      _count: { _all: true },
      orderBy: { category: "asc" },
    }),
  ]);

  const counts: CategoryCounts = { ALL: 0, BANK: 0, FINTECH: 0, PAYMENT: 0, EMI: 0, CRYPTO: 0 };
  for (const row of grouped) {
    // Inside an array transaction Prisma types `_count` as `true | {...}`; with `_all` it is always the object
    const n = typeof row._count === "object" ? (row._count._all ?? 0) : 0;
    counts[row.category] = n;
    counts.ALL += n;
  }

  let items: AssetCard[] = rows.map((r) => ({ ...r, match: interestsSet ? scoreMatch(r, interests) : null }));
  if (bestMatch) {
    const { skip, take } = toSkipTake(p.page, PAGE_SIZE.cards);
    items = items.sort(compareByMatch).slice(skip, skip + take);
  }
  return { items, total: p.category ? counts[p.category] : counts.ALL, counts, hasInterests: interestsSet };
}

const assetDetailSelect = {
  id: true,
  sellerId: true,
  headline: true,
  category: true,
  licenseType: true,
  assetType: true,
  businessStatus: true,
  country: true,
  regulator: true,
  yearOfIssue: true,
  employees: true,
  askingPrice: true,
  included: true,
  description: true,
  status: true,
  publishedAt: true,
  validatedAt: true,
  removedReason: true,
  seller: { select: { name: true, companyName: true, country: true, status: true } },
} satisfies Prisma.AssetSelect;

export type AssetDetail = Prisma.AssetGetPayload<{ select: typeof assetDetailSelect }>;

/**
 * Asset page: buyer - published assets of active sellers, seller - own in any status plus published,
 * manager - all. Anything else is a 404 (also for a malformed id), never a "forbidden".
 * `cache` lets generateMetadata and the page share one query.
 */
export const getAssetForViewer = cache(async (viewer: SessionUser, rawId: string): Promise<AssetDetail> => {
  if (!/^\d{1,9}$/.test(rawId)) notFound();
  const asset = await db.asset.findFirst({
    where: withVisibility(assetVisibilityWhere(viewer), { id: Number(rawId) }),
    select: assetDetailSelect,
  });
  if (!asset || !canViewAsset(viewer, asset)) notFound();
  return asset;
});
