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
import { MESSAGES_PAGE } from "@/lib/pagination";
import { canSendMessage } from "@/features/access/visibility";
import { canViewConversation } from "@/features/access/visibility";
import {
  formDataToStartConversation,
  loadEarlierSchema,
  sendMessageSchema,
  startConversationSchema,
} from "./schema";
import type { ThreadMessage } from "./queries";

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
        const me = await tx.user.findUnique({ where: { id: user.id }, select: { status: true } });
        if (me?.status !== "ACTIVE") throw new ActionError("Your account is suspended");
        const other = await tx.user.findUnique({
          where: { id: user.id === buyerId ? sellerId : buyerId },
          select: { status: true },
        });
        const paused = other ? participantPausedReason(other.status) : "Not found";
        if (paused) throw new ActionError(paused);
        if (input.kind === "buyer") {
          // the buyer may have emptied the profile since the catalog check: then they are hidden from sellers
          const stillInCatalog = await tx.user.findFirst({
            where: withVisibility(catalogBuyersWhere, { id: buyerId }),
            select: { id: true },
          });
          if (!stillInCatalog) throw new ActionError(NOT_FOUND_BUYER);
        }
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

const NOT_FOUND_CONVERSATION = "Conversation not found";

/** A message into an existing conversation. The sender comes from the session, the counterpart is re-read. */
export async function sendMessage(rawConversationId: unknown, rawBody: unknown): Promise<ActionResult<ThreadMessage>> {
  return runAction(async () => {
    const user = await requireUser({ roles: ["BUYER", "SELLER"] });
    const input = sendMessageSchema.parse({ conversationId: rawConversationId, body: rawBody });

    const conversation = await db.conversation.findUnique({
      where: { id: input.conversationId },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        buyer: { select: { id: true, role: true, status: true } },
        seller: { select: { id: true, role: true, status: true } },
      },
    });
    if (!conversation || !canViewConversation(user, conversation)) throw new ActionError(NOT_FOUND_CONVERSATION);
    const counterpart = conversation.buyerId === user.id ? conversation.seller : conversation.buyer;
    const check = canSendMessage(user, conversation, counterpart);
    if (!check.ok) throw new ActionError(check.notFound ? NOT_FOUND_CONVERSATION : check.reason);

    const now = new Date();
    const message = await db.$transaction(
      async (tx) => {
        // the check above ran a moment ago: re-read the other side before writing
        const me = await tx.user.findUnique({ where: { id: user.id }, select: { status: true } });
        if (me?.status !== "ACTIVE") throw new ActionError("Your account is suspended");
        const other = await tx.user.findUnique({ where: { id: counterpart.id }, select: { status: true } });
        const paused = other ? participantPausedReason(other.status) : NOT_FOUND_CONVERSATION;
        if (paused) throw new ActionError(paused);

        const created = await tx.message.create({
          data: { conversationId: conversation.id, senderId: user.id, body: input.body },
          select: { id: true, senderId: true, body: true, createdAt: true },
        });
        await tx.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: now, ...(user.id === conversation.buyerId ? { buyerLastReadAt: now } : { sellerLastReadAt: now }) },
        });
        return created;
      },
      { maxWait: 10_000, timeout: 15_000 },
    );

    revalidatePath("/messages");
    return { id: message.id, senderId: message.senderId, body: message.body, createdAt: message.createdAt.toISOString() };
  });
}

/** "Load earlier messages": the 30 messages before `before`, participants only. Read-only, so a suspended user may call it. */
export async function loadEarlierMessages(
  rawConversationId: unknown,
  rawBefore: unknown,
): Promise<ActionResult<{ messages: ThreadMessage[]; hasMore: boolean }>> {
  return runAction(async () => {
    const user = await requireUser({ roles: ["BUYER", "SELLER"], allowSuspended: true });
    const input = loadEarlierSchema.parse({ conversationId: rawConversationId, before: rawBefore });

    const conversation = await db.conversation.findUnique({
      where: { id: input.conversationId },
      select: { id: true, buyerId: true, sellerId: true },
    });
    if (!conversation || !canViewConversation(user, conversation)) throw new ActionError(NOT_FOUND_CONVERSATION);

    const rows = await db.message.findMany({
      where: { conversationId: conversation.id, createdAt: { lt: new Date(input.before) } },
      orderBy: { createdAt: "desc" },
      take: MESSAGES_PAGE + 1,
      select: { id: true, senderId: true, body: true, createdAt: true },
    });
    return {
      messages: rows
        .slice(0, MESSAGES_PAGE)
        .reverse()
        .map((m) => ({ id: m.id, senderId: m.senderId, body: m.body, createdAt: m.createdAt.toISOString() })),
      hasMore: rows.length > MESSAGES_PAGE,
    };
  });
}
