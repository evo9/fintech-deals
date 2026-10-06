"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ActionError, runAction, type ActionResult } from "@/lib/action";
import { assetTransitionBlockReason, canManageOwnAsset } from "@/features/access/visibility";
import { requireUser } from "@/features/auth/guards";
import { assetIdSchema, assetIntentSchema, assetSchema, formDataToAsset } from "./schema";

export type SavedAsset = { id: number; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" };

const NOT_FOUND = "Asset not found"; // same text for "missing" and "not yours"

function revalidateAsset(id: number) {
  revalidatePath("/my-assets");
  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  revalidatePath(`/my-assets/${id}/edit`);
}

/** New asset: saved as a draft or published at once. The owner always comes from the session. */
export async function createAsset(_prev: ActionResult<SavedAsset> | null, formData: FormData): Promise<ActionResult<SavedAsset>> {
  return runAction(async () => {
    const user = await requireUser({ roles: ["SELLER"] });
    const intent = z.enum(["draft", "publish"]).parse(formData.get("intent"));
    const input = assetSchema(intent).parse(formDataToAsset(formData));

    const asset = await db.asset.create({
      data: {
        ...input,
        sellerId: user.id,
        status: intent === "publish" ? "PUBLISHED" : "DRAFT",
        publishedAt: intent === "publish" ? new Date() : null,
      },
      select: { id: true, status: true },
    });

    revalidateAsset(asset.id);
    return { id: asset.id, status: asset.status as SavedAsset["status"] };
  });
}

/**
 * Edit own asset. A draft is saved ("draft") or published ("publish"); a published or withdrawn one is
 * saved with full validation ("save") and keeps its status. A REMOVED asset cannot be changed.
 */
export async function updateAsset(_prev: ActionResult<SavedAsset> | null, formData: FormData): Promise<ActionResult<SavedAsset>> {
  return runAction(async () => {
    const user = await requireUser({ roles: ["SELLER"] });
    const id = assetIdSchema.parse(formData.get("id"));
    const intent = assetIntentSchema.parse(formData.get("intent"));

    const asset = await db.asset.findUnique({ where: { id }, select: { id: true, sellerId: true, status: true } });
    if (!asset || !canManageOwnAsset(user, asset)) throw new ActionError(NOT_FOUND);

    if (asset.status === "DRAFT") {
      if (intent === "save") throw new ActionError("Save the draft or publish it");
    } else if (intent !== "save") {
      throw new ActionError("Only drafts can be saved as a draft");
    }
    if (intent === "publish") {
      const blocked = assetTransitionBlockReason(asset, "publish");
      if (blocked) throw new ActionError(blocked);
    }

    const input = assetSchema(intent === "draft" ? "draft" : "publish").parse(formDataToAsset(formData));
    const publishing = intent === "publish";

    // Conditional on the status read above: a concurrent withdraw or removal must not be overwritten
    const { count } = await db.asset.updateMany({
      where: { id, status: asset.status },
      data: { ...input, ...(publishing ? { status: "PUBLISHED", publishedAt: new Date() } : {}) },
    });
    if (count === 0) throw new ActionError("The asset has changed, reload the page and try again");

    revalidateAsset(id);
    return { id, status: (publishing ? "PUBLISHED" : asset.status) as SavedAsset["status"] };
  });
}

/** Only a draft can be deleted: published assets may be referenced by conversations. */
export async function deleteDraftAsset(rawId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireUser({ roles: ["SELLER"] });
    const id = assetIdSchema.parse(rawId);

    const asset = await db.asset.findUnique({ where: { id }, select: { id: true, sellerId: true, status: true } });
    if (!asset || !canManageOwnAsset(user, asset)) throw new ActionError(NOT_FOUND);
    const blocked = assetTransitionBlockReason(asset, "delete");
    if (blocked) throw new ActionError(blocked);

    const { count } = await db.asset.deleteMany({ where: { id, status: "DRAFT" } });
    if (count === 0) throw new ActionError("Only drafts can be deleted");
    revalidatePath("/my-assets");
  });
}

/** PUBLISHED <-> ARCHIVED, owner only. The write is conditional on the status read above. */
async function moveOwnAsset(rawId: unknown, transition: "withdraw" | "republish", to: "ARCHIVED" | "PUBLISHED") {
  const user = await requireUser({ roles: ["SELLER"] });
  const id = assetIdSchema.parse(rawId);

  const asset = await db.asset.findUnique({ where: { id }, select: { id: true, sellerId: true, status: true } });
  if (!asset || !canManageOwnAsset(user, asset)) throw new ActionError(NOT_FOUND);
  const blocked = assetTransitionBlockReason(asset, transition);
  if (blocked) throw new ActionError(blocked);

  const { count } = await db.asset.updateMany({ where: { id, status: asset.status }, data: { status: to } });
  if (count === 0) throw new ActionError("The asset has changed, reload the page and try again");

  revalidateAsset(id);
}

export async function withdrawAsset(rawId: unknown): Promise<ActionResult> {
  return runAction(() => moveOwnAsset(rawId, "withdraw", "ARCHIVED"));
}

export async function republishAsset(rawId: unknown): Promise<ActionResult> {
  return runAction(() => moveOwnAsset(rawId, "republish", "PUBLISHED"));
}
