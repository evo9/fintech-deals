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
