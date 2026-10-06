import { z } from "zod";

export const MESSAGE_MAX = 2000;

export const messageBodySchema = z
  .string()
  .trim()
  .min(1, "Write a message")
  .max(MESSAGE_MAX, `Use ${MESSAGE_MAX} characters or fewer`);

const optionalAssetId = z
  .string()
  .trim()
  .transform((s) => (s === "" ? undefined : s))
  .pipe(z.string().regex(/^\d{1,9}$/, "Choose an asset from the list").transform(Number).optional());

/**
 * "asset": a buyer writes about a visible asset (the seller is the asset's owner).
 * "buyer": a seller writes to a buyer from the catalog, optionally about one of their own assets.
 */
export const startConversationSchema = z
  .object({
    kind: z.enum(["asset", "buyer"]),
    assetId: optionalAssetId,
    buyerId: z.string().trim().max(40).optional(),
    body: messageBodySchema,
  })
  .superRefine((v, ctx) => {
    if (v.kind === "asset" && v.assetId === undefined) {
      ctx.addIssue({ code: "custom", path: ["assetId"], message: "Choose an asset" });
    }
    if (v.kind === "buyer" && !v.buyerId) {
      ctx.addIssue({ code: "custom", path: ["buyerId"], message: "Choose a buyer" });
    }
  });

export function formDataToStartConversation(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? "");
  return {
    kind: text("kind"),
    assetId: text("assetId"),
    buyerId: text("buyerId") || undefined,
    body: text("body"),
  };
}

export const sendMessageSchema = z.object({
  conversationId: z.string().trim().min(1).max(40),
  body: messageBodySchema,
});

export const loadEarlierSchema = z.object({
  conversationId: z.string().trim().min(1).max(40),
  before: z.iso.datetime({ message: "Invalid date" }),
});
