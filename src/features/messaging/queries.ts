import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { MESSAGES_PAGE, PAGE_SIZE, toSkipTake } from "@/lib/pagination";
import { canViewAsset, canViewConversation } from "@/features/access/visibility";
import type { SessionUser } from "@/features/auth/session";

/** Buyer: the conversations they already have about these assets (asset id -> conversation id). */
export async function conversationIdsByAsset(buyerId: string, assetIds: number[]): Promise<Map<number, string>> {
  if (assetIds.length === 0) return new Map();
  const rows = await db.conversation.findMany({
    where: { buyerId, assetId: { in: assetIds } },
    select: { id: true, assetId: true },
  });
  return new Map(rows.flatMap((r) => (r.assetId === null ? [] : [[r.assetId, r.id] as const])));
}

export type PairConversation = { id: string; assetId: number | null };

/** Seller: their conversations with these buyers, newest first (buyer id -> conversations). */
export async function conversationsWithBuyers(
  sellerId: string,
  buyerIds: string[],
): Promise<Map<string, PairConversation[]>> {
  const map = new Map<string, PairConversation[]>();
  if (buyerIds.length === 0) return map;
  const rows = await db.conversation.findMany({
    where: { sellerId, buyerId: { in: buyerIds } },
    select: { id: true, assetId: true, buyerId: true },
    orderBy: { lastMessageAt: "desc" },
  });
  for (const r of rows) map.set(r.buyerId, [...(map.get(r.buyerId) ?? []), { id: r.id, assetId: r.assetId }]);
  return map;
}

/** Seller: own published assets to pick from in the contact dialog. */
export async function ownPublishedAssetOptions(sellerId: string) {
  return db.asset.findMany({
    where: { sellerId, status: "PUBLISHED" },
    select: { id: true, headline: true },
    orderBy: { id: "desc" },
    take: 50,
  });
}

// ---------- messages screen ----------

const participantSelect = { id: true, name: true, companyName: true, role: true, status: true } satisfies Prisma.UserSelect;

const conversationListSelect = {
  id: true,
  buyerId: true,
  sellerId: true,
  lastMessageAt: true,
  buyer: { select: participantSelect },
  seller: { select: participantSelect },
  asset: { select: { id: true, headline: true } },
  messages: { select: { body: true, senderId: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
} satisfies Prisma.ConversationSelect;

type ListRow = Prisma.ConversationGetPayload<{ select: typeof conversationListSelect }>;

export type ConversationItem = {
  id: string;
  counterpart: ListRow["buyer"];
  asset: { id: number; headline: string } | null;
  lastMessage: { body: string; fromMe: boolean; createdAt: string } | null;
  lastMessageAt: string;
};

function requireParticipant(viewer: SessionUser) {
  // managers do not take part in conversations
  if (viewer.role !== "BUYER" && viewer.role !== "SELLER") notFound();
}

/** Conversation list of the viewer: only their own, newest activity first, 10 per page. */
export async function listConversations(viewer: SessionUser, page: number) {
  requireParticipant(viewer);
  const where: Prisma.ConversationWhereInput = { OR: [{ buyerId: viewer.id }, { sellerId: viewer.id }] };
  const [rows, total] = await db.$transaction([
    db.conversation.findMany({
      where,
      orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
      ...toSkipTake(page, PAGE_SIZE.rows),
      select: conversationListSelect,
    }),
    db.conversation.count({ where }),
  ]);
  const items: ConversationItem[] = rows.map((r) => {
    const last = r.messages[0];
    return {
      id: r.id,
      counterpart: r.buyerId === viewer.id ? r.seller : r.buyer,
      asset: r.asset,
      lastMessage: last ? { body: last.body, fromMe: last.senderId === viewer.id, createdAt: last.createdAt.toISOString() } : null,
      lastMessageAt: r.lastMessageAt.toISOString(),
    };
  });
  return { items, total };
}

export type ThreadMessage = { id: string; senderId: string; body: string; createdAt: string };

function toThreadMessage(m: { id: string; senderId: string; body: string; createdAt: Date }): ThreadMessage {
  return { id: m.id, senderId: m.senderId, body: m.body, createdAt: m.createdAt.toISOString() };
}

/** One conversation with its last 30 messages. Not a participant, missing, or a malformed id: 404. */
export async function getConversationForViewer(viewer: SessionUser, rawId: string) {
  requireParticipant(viewer);
  if (!/^[A-Za-z0-9]{10,40}$/.test(rawId)) notFound();

  const conversation = await db.conversation.findFirst({
    where: { id: rawId, OR: [{ buyerId: viewer.id }, { sellerId: viewer.id }] },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      buyer: { select: participantSelect },
      seller: { select: participantSelect },
      asset: { select: { id: true, headline: true, status: true, sellerId: true, seller: { select: { status: true } } } },
    },
  });
  if (!conversation || !canViewConversation(viewer, conversation)) notFound();

  const recent = await db.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: MESSAGES_PAGE + 1,
    select: { id: true, senderId: true, body: true, createdAt: true },
  });
  const counterpart = conversation.buyerId === viewer.id ? conversation.seller : conversation.buyer;
  const asset = conversation.asset;

  return {
    id: conversation.id,
    counterpart,
    // a link to the asset only when the viewer may open it, plain text otherwise
    asset: asset ? { id: asset.id, headline: asset.headline, linkable: canViewAsset(viewer, asset) } : null,
    messages: recent.slice(0, MESSAGES_PAGE).reverse().map(toThreadMessage),
    hasMore: recent.length > MESSAGES_PAGE,
  };
}
