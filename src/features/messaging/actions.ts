"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ActionError, runAction, type ActionResult } from "@/lib/action";
import {
  assetVisibilityWhere,
  canContactAboutAsset,
  canContactBuyer,
  catalogBuyersWhere,
  ownAssetsWhere,
  participantPausedReason,
  withVisibility,
} from "@/features/access/visibility";
import { requireUser } from "@/features/auth/guards";
import { formDataToStartConversation, startConversationSchema } from "./schema";

export type StartedConversation = { conversationId: string };

const NOT_FOUND_ASSET = "Asset not found";
const NOT_FOUND_BUYER = "Buyer not found";

/**
 * First message of a conversation (or one more message into an existing one).
 * - a buyer writes to the seller of a visible asset;
 * - a seller writes to a buyer from the catalog, optionally about one of their own published assets.
 * The pair (buyer, seller, asset) has one conversation; it is found or created inside a transaction.
 */
export async function startConversation(
  _prev: ActionResult<StartedConversation> | null,
  formData: FormData,
): Promise<ActionResult<StartedConversation>> {
  return runAction(async () => {
    const user = await requireUser({ roles: ["BUYER", "SELLER"] });
    const input = startConversationSchema.parse(formDataToStartConversation(formData));

    let buyerId: string;
    let sellerId: string;
    let assetId: number | null;

    if (input.kind === "asset") {
      const asset = await db.asset.findFirst({
        where: withVisibility(assetVisibilityWhere(user), { id: input.assetId }),
        select: { id: true, sellerId: true, status: true, seller: { select: { status: true } } },
      });
      if (!asset) throw new ActionError(NOT_FOUND_ASSET);
      const check = canContactAboutAsset(user, asset);
      if (!check.ok) throw new ActionError(check.notFound ? NOT_FOUND_ASSET : check.reason);
      buyerId = user.id; // contactBlockReason rejects a seller here
      sellerId = asset.sellerId;
      assetId = asset.id;
    } else {
      const buyer = await db.user.findFirst({
        where: withVisibility(catalogBuyersWhere, { id: input.buyerId }),
        select: {
          id: true,
          role: true,
          status: true,
          buyerProfile: {
            select: { countries: true, licenseTypes: true, categories: true, budgetMin: true, budgetMax: true },
          },
        },
      });
      if (!buyer) throw new ActionError(NOT_FOUND_BUYER);
      const check = canContactBuyer(user, buyer);
      if (!check.ok) throw new ActionError(check.notFound ? NOT_FOUND_BUYER : check.reason);
      if (input.assetId !== undefined) {
        const own = await db.asset.findFirst({
          where: withVisibility(ownAssetsWhere(user), { id: input.assetId, status: "PUBLISHED" }),
          select: { id: true },
        });
        if (!own) throw new ActionError(NOT_FOUND_ASSET);
      }
      buyerId = buyer.id;
      sellerId = user.id;
      assetId = input.assetId ?? null;
    }

    const now = new Date();
    const key = `${buyerId}:${sellerId}:${assetId ?? "general"}`;
    const conversation = await db.$transaction(
      async (tx) => {
        // NULL assetId is not covered by the unique index: serialise find-or-create per pair
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;

        // The checks above ran a moment ago: a manager may have suspended the other side or the seller
        // may have withdrawn the asset since. Re-check inside the transaction, before anything is written.
        const other = await tx.user.findUnique({
          where: { id: user.id === buyerId ? sellerId : buyerId },
          select: { status: true },
        });
        const paused = other ? participantPausedReason(other.status) : "Not found";
        if (paused) throw new ActionError(paused);
        if (assetId !== null) {
          const stillListed = await tx.asset.findFirst({
            where: { id: assetId, sellerId, status: "PUBLISHED" },
            select: { id: true },
          });
          if (!stillListed) throw new ActionError(NOT_FOUND_ASSET);
        }
        const found = await tx.conversation.findFirst({ where: { buyerId, sellerId, assetId }, select: { id: true } });
        const conv = found ?? (await tx.conversation.create({ data: { buyerId, sellerId, assetId }, select: { id: true } }));
        await tx.message.create({ data: { conversationId: conv.id, senderId: user.id, body: input.body } });
        await tx.conversation.update({
          where: { id: conv.id },
          data: { lastMessageAt: now, ...(user.id === buyerId ? { buyerLastReadAt: now } : { sellerLastReadAt: now }) },
        });
        return conv;
      },
      { maxWait: 10_000, timeout: 15_000 },
    );

    revalidatePath("/messages");
    return { conversationId: conversation.id };
  });
}
