import { cache } from "react";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { PAGE_SIZE, toSkipTake } from "@/lib/pagination";
import { withVisibility } from "@/features/access/visibility";
import type { SessionUser } from "@/features/auth/session";
import { searchWhere } from "@/features/assets/queries";
import type { AdminAssetsParams, AdminUserTab, AdminUsersParams } from "./schema";

export type AdminUserCounts = Record<AdminUserTab, number>;

const TAB_WHERE: Record<AdminUserTab, Prisma.UserWhereInput> = {
  ALL: {},
  BUYER: { role: "BUYER" },
  SELLER: { role: "SELLER" },
  SUSPENDED: { status: "SUSPENDED" },
  REMOVED: { status: "REMOVED" },
};

function userSearchWhere(q: string): Prisma.UserWhereInput {
  if (!q) return {};
  return {
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
    ],
  };
}

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  companyName: true,
  role: true,
  status: true,
  statusReason: true,
  createdAt: true,
  _count: { select: { assets: true } },
} satisfies Prisma.UserSelect;

export type AdminUserRow = Prisma.UserGetPayload<{ select: typeof adminUserSelect }>;

/**
 * Participants for the manager: every user in every status. Tab counters follow the search, so the
 * numbers always add up to what the current search finds.
 */
export async function listAdminUsers(viewer: SessionUser, p: AdminUsersParams) {
  if (viewer.role !== "MANAGER") notFound();

  const search = userSearchWhere(p.q);
  const tabCount = (tab: AdminUserTab) => db.user.count({ where: withVisibility(search, TAB_WHERE[tab]) });

  const [items, all, buyers, sellers, suspended, removed, tabAll] = await db.$transaction([
    db.user.findMany({
      where: withVisibility(search, TAB_WHERE[p.tab]),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...toSkipTake(p.page, PAGE_SIZE.admin),
      select: adminUserSelect,
    }),
    tabCount("ALL"),
    tabCount("BUYER"),
    tabCount("SELLER"),
    tabCount("SUSPENDED"),
    tabCount("REMOVED"),
    // the same tab without the search: the "N of M" line next to a search shows M
    db.user.count({ where: TAB_WHERE[p.tab] }),
  ]);

  const counts: AdminUserCounts = { ALL: all, BUYER: buyers, SELLER: sellers, SUSPENDED: suspended, REMOVED: removed };
  return { items, total: counts[p.tab], counts, tabTotal: tabAll };
}

// ---------- assets ----------

const adminAssetSelect = {
  id: true,
  headline: true,
  category: true,
  country: true,
  askingPrice: true,
  status: true,
  validatedAt: true,
  createdAt: true,
  seller: { select: { id: true, name: true, companyName: true } },
} satisfies Prisma.AssetSelect;

export type AdminAssetRow = Prisma.AssetGetPayload<{ select: typeof adminAssetSelect }>;

/** Every asset in every status for the manager, filtered by status, category, country, validated and search. */
export async function listAdminAssets(viewer: SessionUser, p: AdminAssetsParams) {
  if (viewer.role !== "MANAGER") notFound();

  const search = await searchWhere(p.q);
  const filters: Prisma.AssetWhereInput[] = [
    ...(search ? [search] : []),
    ...(p.status ? [{ status: p.status }] : []),
    ...(p.category ? [{ category: p.category }] : []),
    ...(p.country ? [{ country: p.country }] : []),
    ...(p.validated === "yes" ? [{ validatedAt: { not: null } }] : []),
    ...(p.validated === "no" ? [{ validatedAt: null }] : []),
  ];
  const where: Prisma.AssetWhereInput = { AND: filters };
  // the same filters without the search: the "N of M" line next to a search shows M
  const withoutSearch: Prisma.AssetWhereInput = { AND: search ? filters.slice(1) : filters };

  const [items, total, filterTotal] = await db.$transaction([
    db.asset.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...toSkipTake(p.page, PAGE_SIZE.admin),
      select: adminAssetSelect,
    }),
    db.asset.count({ where }),
    db.asset.count({ where: withoutSearch }),
  ]);
  return { items, total, filterTotal };
}

// ---------- one participant (manager, read-only) ----------

const adminUserDetailSelect = {
  id: true,
  name: true,
  email: true,
  companyName: true,
  country: true,
  role: true,
  status: true,
  statusReason: true,
  statusChangedAt: true,
  createdAt: true,
  buyerProfile: {
    select: {
      buyerType: true,
      headline: true,
      about: true,
      budgetMin: true,
      budgetMax: true,
      countries: true,
      licenseTypes: true,
      categories: true,
      assetTypes: true,
      updatedAt: true,
    },
  },
  assets: {
    orderBy: { id: "desc" },
    take: 50,
    select: { id: true, headline: true, status: true, askingPrice: true, validatedAt: true },
  },
  _count: { select: { assets: true } },
} satisfies Prisma.UserSelect;

export type AdminUserDetail = Prisma.UserGetPayload<{ select: typeof adminUserDetailSelect }>;

/** Any participant in any status, for a manager. A non-manager or an unknown id is a 404. */
export const getAdminUser = cache(async (viewer: SessionUser, rawId: string): Promise<AdminUserDetail> => {
  if (viewer.role !== "MANAGER" || !/^[A-Za-z0-9]{10,40}$/.test(rawId)) notFound();
  const user = await db.user.findUnique({ where: { id: rawId }, select: adminUserDetailSelect });
  if (!user) notFound();
  return user;
});
