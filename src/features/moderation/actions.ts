"use server";

import { revalidatePath } from "next/cache";
import type { ModerationAction, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ActionError, runAction, type ActionResult } from "@/lib/action";
import { assetModerationBlockReason, userModerationBlockReason } from "@/features/access/visibility";
import { requireUser } from "@/features/auth/guards";
import { assetIdSchema } from "@/features/assets/schema";
import { assetRemovalSchema, userIdSchema, userModerationSchema } from "./schema";

const USER_NOT_FOUND = "User not found";
const ASSET_NOT_FOUND = "Asset not found";
const STALE = "The record has changed, reload the page and try again";

function revalidateUsers() {
  revalidatePath("/admin/users");
  revalidatePath("/admin/log");
  revalidatePath("/buyers");
  revalidatePath("/assets");
  revalidatePath("/my-assets");
  revalidatePath("/messages");
}

function revalidateAsset(id: number) {
  revalidatePath("/admin/assets");
  revalidatePath("/admin/log");
  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  revalidatePath("/my-assets");
}

/**
 * SUSPEND / RESTORE / REMOVE of a user. The manager always comes from the session, the target from the
 * database. The status change and the log entry are written in one transaction; the update is
 * conditional on the status that was checked.
 */
async function moderateUser(action: "SUSPEND" | "RESTORE" | "REMOVE", raw: unknown) {
  const manager = await requireUser({ roles: ["MANAGER"] });
  const input =
    action === "RESTORE"
      ? { userId: userIdSchema.parse((raw as { userId?: unknown } | null)?.userId), reason: null }
      : userModerationSchema.parse(raw);

  const target = await db.user.findUnique({ where: { id: input.userId }, select: { id: true, role: true, status: true } });
  if (!target) throw new ActionError(USER_NOT_FOUND);
  const blocked = userModerationBlockReason(manager, target, action, input.reason);
  if (blocked) throw new ActionError(blocked);

  const restoring = action === "RESTORE";
  await db.$transaction(async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id: target.id, status: target.status },
      data: {
        status: restoring ? "ACTIVE" : action === "SUSPEND" ? "SUSPENDED" : "REMOVED",
        statusReason: restoring ? null : input.reason,
        statusChangedAt: new Date(),
      },
    });
    if (count === 0) throw new ActionError(STALE);
    await tx.moderationLog.create({
      data: { managerId: manager.id, action, targetUserId: target.id, reason: input.reason },
    });
  });

  revalidateUsers();
}

export async function suspendUser(input: { userId: string; reason: string }): Promise<ActionResult> {
  return runAction(() => moderateUser("SUSPEND", input));
}

export async function restoreUser(input: { userId: string }): Promise<ActionResult> {
  return runAction(() => moderateUser("RESTORE", input));
}

export async function removeUser(input: { userId: string; reason: string }): Promise<ActionResult> {
  return runAction(() => moderateUser("REMOVE", input));
}

async function writeAssetLog(
  tx: Prisma.TransactionClient,
  managerId: string,
  action: ModerationAction,
  assetId: number,
  reason: string | null,
) {
  await tx.moderationLog.create({ data: { managerId, action, targetAssetId: assetId, reason } });
}

/** Take an asset off the listings with a reason (REMOVE_ASSET). The owner sees the reason. */
export async function removeAsset(input: { assetId: number; reason: string }): Promise<ActionResult> {
  return runAction(async () => {
    const manager = await requireUser({ roles: ["MANAGER"] });
    const { assetId, reason } = assetRemovalSchema.parse(input);

    const asset = await db.asset.findUnique({ where: { id: assetId }, select: { id: true, status: true, validatedAt: true } });
    if (!asset) throw new ActionError(ASSET_NOT_FOUND);
    const blocked = assetModerationBlockReason(manager, asset, "REMOVE_ASSET", reason);
    if (blocked) throw new ActionError(blocked);

    await db.$transaction(async (tx) => {
      const { count } = await tx.asset.updateMany({
        where: { id: asset.id, status: asset.status },
        data: { status: "REMOVED", removedReason: reason },
      });
      if (count === 0) throw new ActionError(STALE);
      await writeAssetLog(tx, manager.id, "REMOVE_ASSET", asset.id, reason);
    });

    revalidateAsset(asset.id);
  });
}

/** Validate a published asset: the Validated badge appears (VALIDATE_ASSET). */
export async function validateAsset(rawId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const manager = await requireUser({ roles: ["MANAGER"] });
    const id = assetIdSchema.parse(rawId);

    const asset = await db.asset.findUnique({ where: { id }, select: { id: true, status: true, validatedAt: true } });
    if (!asset) throw new ActionError(ASSET_NOT_FOUND);
    const blocked = assetModerationBlockReason(manager, asset, "VALIDATE_ASSET");
    if (blocked) throw new ActionError(blocked);

    await db.$transaction(async (tx) => {
      const { count } = await tx.asset.updateMany({
        where: { id: asset.id, status: "PUBLISHED", validatedAt: null },
        data: { validatedAt: new Date() },
      });
      if (count === 0) throw new ActionError(STALE);
      await writeAssetLog(tx, manager.id, "VALIDATE_ASSET", asset.id, null);
    });

    revalidateAsset(asset.id);
  });
}
