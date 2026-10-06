import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { PAGE_SIZE, toSkipTake } from "@/lib/pagination";
import { withVisibility } from "@/features/access/visibility";
import type { SessionUser } from "@/features/auth/session";
import type { AdminUserTab, AdminUsersParams } from "./schema";

export type AdminUserCounts = Record<AdminUserTab, number>;

const TAB_WHERE: Record<AdminUserTab, Prisma.UserWhereInput> = {
  ALL: {},
  BUYER: { role: "BUYER" },
  SELLER: { role: "SELLER" },
  SUSPENDED: { status: "SUSPENDED" },
  REMOVED: { status: "REMOVED" },
};

function searchWhere(q: string): Prisma.UserWhereInput {
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

  const search = searchWhere(p.q);
  const tabCount = (tab: AdminUserTab) => db.user.count({ where: withVisibility(search, TAB_WHERE[tab]) });

  const [items, all, buyers, sellers, suspended, removed] = await db.$transaction([
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
  ]);

  const counts: AdminUserCounts = { ALL: all, BUYER: buyers, SELLER: sellers, SUSPENDED: suspended, REMOVED: removed };
  return { items, total: counts[p.tab], counts };
}
