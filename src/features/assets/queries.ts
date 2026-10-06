import { notFound } from "next/navigation";
import { Prisma, type AssetCategory } from "@prisma/client";
import { db } from "@/lib/db";
import { PAGE_SIZE, toSkipTake } from "@/lib/pagination";
import { COUNTRIES } from "@/lib/reference";
import { catalogAssetsWhere, withVisibility } from "@/features/access/visibility";
import type { SessionUser } from "@/features/auth/session";
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

export type AssetCard = Prisma.AssetGetPayload<{ select: typeof assetCardSelect }>;

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

/** Everything except the category: the tab counters must not depend on the selected tab. */
async function buildFilters(p: AssetListParams): Promise<Prisma.AssetWhereInput[]> {
  const clauses: Array<Prisma.AssetWhereInput | null> = [
    await searchWhere(p.q),
    p.country.length ? { country: { in: p.country } } : null,
    p.licenseType.length ? { licenseType: { in: p.licenseType } } : null,
    p.assetType.length ? { assetType: { in: p.assetType } } : null,
    p.businessStatus.length ? { businessStatus: { in: p.businessStatus } } : null,
    priceWhere(p),
    p.validated ? { validatedAt: { not: null } } : null,
    // `mine` (only my interests) is wired in with matching, task 4.5
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

  const filters = await buildFilters(p);
  const tabsWhere = withVisibility(catalogAssetsWhere, { AND: filters });
  const listWhere = withVisibility(catalogAssetsWhere, {
    AND: p.category ? [...filters, { category: p.category }] : filters,
  });

  // Interactive transaction: list and counters see one snapshot (groupBy loses its typing in an array transaction)
  const [items, grouped] = await db.$transaction(async (tx) => [
    await tx.asset.findMany({
      where: listWhere,
      orderBy: assetOrderBy(p.sort),
      ...toSkipTake(p.page, PAGE_SIZE.cards),
      select: assetCardSelect,
    }),
    await tx.asset.groupBy({ by: ["category"], where: tabsWhere, _count: { _all: true }, orderBy: { category: "asc" } }),
  ] as const);

  const counts: CategoryCounts = { ALL: 0, BANK: 0, FINTECH: 0, PAYMENT: 0, EMI: 0, CRYPTO: 0 };
  for (const row of grouped) {
    counts[row.category] = row._count._all;
    counts.ALL += row._count._all;
  }
  return { items, total: p.category ? counts[p.category] : counts.ALL, counts };
}
