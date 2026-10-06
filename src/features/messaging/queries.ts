import { db } from "@/lib/db";

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
