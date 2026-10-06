import { z } from "zod";
import { assetIdSchema } from "@/features/assets/schema";

export const REASON_MAX = 500;

export const reasonSchema = z
  .string({ error: "Enter a reason" })
  .trim()
  .min(1, "Enter a reason")
  .max(REASON_MAX, `Use at most ${REASON_MAX} characters`);

export const userIdSchema = z.string().trim().min(1).max(64);

export const userModerationSchema = z.object({ userId: userIdSchema, reason: reasonSchema });

export const assetRemovalSchema = z.object({ assetId: assetIdSchema, reason: reasonSchema });

// ---------- participants list (`/admin/users`) ----------

export const ADMIN_USER_TABS = ["ALL", "BUYER", "SELLER", "SUSPENDED", "REMOVED"] as const;
export type AdminUserTab = (typeof ADMIN_USER_TABS)[number];

/** URL state of `/admin/users`: tab, search and page. Invalid values fall back to defaults. */
export const adminUsersParams = z.object({
  tab: z.enum(ADMIN_USER_TABS).catch("ALL"),
  q: z.string().trim().max(100).catch(""),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
});
export type AdminUsersParams = z.infer<typeof adminUsersParams>;
