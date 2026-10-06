// All visibility and permission rules (spec section 5). Queries and actions import from here;
// no ad-hoc status checks in pages. Hiding a button is not access control.
import type { AssetStatus, ModerationAction, Prisma, Role, UserStatus } from "@prisma/client";

type Viewer = { id: string; role: Role; status: UserStatus };

// ---------- assets ----------

/** Published asset of an active seller: visible to every role. */
export const publicAssetWhere: Prisma.AssetWhereInput = {
  status: "PUBLISHED",
  seller: { status: "ACTIVE" },
};

/** Buyer catalog (`/assets`): only public assets. Sellers and managers have their own lists. */
export const catalogAssetsWhere = publicAssetWhere;

/** `where` for any asset the viewer may open: manager - all, seller - own plus public, buyer - public. */
export function assetVisibilityWhere(viewer: Viewer): Prisma.AssetWhereInput {
  if (viewer.role === "MANAGER") return {};
  if (viewer.role === "SELLER") return { OR: [{ sellerId: viewer.id }, publicAssetWhere] };
  return publicAssetWhere;
}

/** "My assets" list of a seller. */
export function ownAssetsWhere(viewer: Viewer): Prisma.AssetWhereInput {
  return { sellerId: viewer.id };
}

type AssetRef = { sellerId: string; status: AssetStatus; seller: { status: UserStatus } };

/** Same rule as `assetVisibilityWhere`, for a loaded asset. A false result must become notFound(). */
export function canViewAsset(viewer: Viewer, asset: AssetRef): boolean {
  if (viewer.role === "MANAGER") return true;
  if (viewer.id === asset.sellerId) return true;
  return asset.status === "PUBLISHED" && asset.seller.status === "ACTIVE";
}

/** Seller actions on an asset (edit, withdraw, republish, delete draft): owner, and not after removal by a manager. */
export function canManageOwnAsset(
  user: Viewer,
  asset: { sellerId: string; status: AssetStatus },
): boolean {
  return user.role === "SELLER" && user.id === asset.sellerId && asset.status !== "REMOVED";
}

export type AssetTransition = "publish" | "withdraw" | "republish" | "delete";

/**
 * Status rules for seller actions (use together with `canManageOwnAsset`):
 * publish DRAFT, withdraw PUBLISHED -> ARCHIVED, republish ARCHIVED -> PUBLISHED, delete DRAFT only
 * (published assets may be referenced by conversations).
 */
export function assetTransitionBlockReason(
  asset: { status: AssetStatus },
  transition: AssetTransition,
): string | null {
  switch (transition) {
    case "publish":
      return asset.status === "DRAFT" ? null : "Only drafts can be published";
    case "withdraw":
      return asset.status === "PUBLISHED" ? null : "Only published assets can be withdrawn";
    case "republish":
      return asset.status === "ARCHIVED" ? null : "Only withdrawn assets can be republished";
    case "delete":
      return asset.status === "DRAFT" ? null : "Only drafts can be deleted";
  }
}

// ---------- buyers ----------

type Interests = {
  countries: string[];
  licenseTypes: string[];
  categories: string[];
  budgetMin: number | null;
  budgetMax: number | null;
};

/** Filled = at least one of: countries, license types, categories, budget. Asset types alone do not count. */
export function isProfileFilled(profile: Interests | null | undefined): boolean {
  if (!profile) return false;
  return (
    profile.countries.length > 0 ||
    profile.licenseTypes.length > 0 ||
    profile.categories.length > 0 ||
    profile.budgetMin != null ||
    profile.budgetMax != null
  );
}

/** Buyers catalog for sellers: active buyers with a filled profile. */
export const catalogBuyersWhere: Prisma.UserWhereInput = {
  role: "BUYER",
  status: "ACTIVE",
  buyerProfile: {
    is: {
      OR: [
        { countries: { isEmpty: false } },
        { licenseTypes: { isEmpty: false } },
        { categories: { isEmpty: false } },
        { budgetMin: { not: null } },
        { budgetMax: { not: null } },
      ],
    },
  },
};

type BuyerRef = { id: string; role: Role; status: UserStatus; buyerProfile: Interests | null };

/** Buyer profile page: the buyer themself, a manager, or a seller when the buyer is in the catalog. */
export function canViewBuyerProfile(viewer: Viewer, buyer: BuyerRef): boolean {
  if (buyer.role !== "BUYER") return false;
  if (viewer.role === "MANAGER" || viewer.id === buyer.id) return true;
  return viewer.role === "SELLER" && buyer.status === "ACTIVE" && isProfileFilled(buyer.buyerProfile);
}

// ---------- contact and conversations ----------

const PAUSED_SUSPENDED = "This participant is suspended. Messaging is paused.";
const PAUSED_REMOVED = "This participant is no longer on the platform.";

/** Banner text above a disabled message input, null when the other participant is active. */
export function participantPausedReason(status: UserStatus): string | null {
  if (status === "SUSPENDED") return PAUSED_SUSPENDED;
  if (status === "REMOVED") return PAUSED_REMOVED;
  return null;
}

/** Why `sender` may not write to `target`; null = allowed. Buyer <-> seller only, never self, never a manager. */
export function contactBlockReason(
  sender: Viewer,
  target: { id: string; role: Role; status: UserStatus },
): string | null {
  if (sender.id === target.id) return "You cannot message yourself";
  if (sender.role === "MANAGER" || target.role === "MANAGER") {
    return "Managers do not take part in conversations";
  }
  if (sender.role === target.role) {
    return sender.role === "BUYER" ? "Buyers can only message sellers" : "Sellers can only message buyers";
  }
  if (sender.status !== "ACTIVE") return "Your account is suspended";
  return participantPausedReason(target.status);
}

/**
 * Result of a contact check. `notFound` means the target must not be revealed at all:
 * the action calls notFound() (or returns "not found"), never shows `reason` as a toast.
 */
export type ContactCheck = { ok: true } | { ok: false; notFound: boolean; reason: string };

const OK: ContactCheck = { ok: true };
const NOT_FOUND: ContactCheck = { ok: false, notFound: true, reason: "Not found" };

function fromReason(reason: string | null): ContactCheck {
  return reason ? { ok: false, notFound: false, reason } : OK;
}

/** Buyer contacting a seller from an asset page: the asset must be visible to the buyer. */
export function canContactAboutAsset(sender: Viewer, asset: AssetRef): ContactCheck {
  if (!canViewAsset(sender, asset)) return NOT_FOUND;
  return fromReason(
    contactBlockReason(sender, { id: asset.sellerId, role: "SELLER", status: asset.seller.status }),
  );
}

/** Seller contacting a buyer from the profile page: the buyer must be visible to the seller. */
export function canContactBuyer(sender: Viewer, buyer: BuyerRef): ContactCheck {
  if (!canViewBuyerProfile(sender, buyer)) return NOT_FOUND;
  return fromReason(contactBlockReason(sender, buyer));
}

export function canViewConversation(
  viewer: Viewer,
  conversation: { buyerId: string; sellerId: string },
): boolean {
  return viewer.id === conversation.buyerId || viewer.id === conversation.sellerId;
}

/** Sending into an existing conversation: sender must be a participant, the other side must be active. */
export function canSendMessage(
  sender: Viewer,
  conversation: { buyerId: string; sellerId: string },
  counterpart: { id: string; role: Role; status: UserStatus },
): ContactCheck {
  if (!canViewConversation(sender, conversation)) return NOT_FOUND;
  return fromReason(contactBlockReason(sender, counterpart));
}

// ---------- moderation ----------

export function userModerationBlockReason(
  manager: Viewer,
  target: { id: string; role: Role; status: UserStatus },
  action: Extract<ModerationAction, "SUSPEND" | "RESTORE" | "REMOVE">,
  reason?: string | null,
): string | null {
  if (manager.role !== "MANAGER") return "Only managers can moderate";
  if (manager.status !== "ACTIVE") return "Your account is suspended";
  if (action !== "RESTORE" && !reason?.trim()) return "Enter a reason";
  // also covers a manager acting on themselves
  if (target.role === "MANAGER") return "Managers cannot be suspended or removed";
  if (action === "SUSPEND" && target.status !== "ACTIVE") return "Only active users can be suspended";
  if (action === "RESTORE" && target.status !== "SUSPENDED") return "Only suspended users can be restored";
  if (action === "REMOVE" && target.status === "REMOVED") return "This user is already removed";
  return null;
}

export function assetModerationBlockReason(
  manager: Viewer,
  asset: { status: AssetStatus; validatedAt: Date | null },
  action: Extract<ModerationAction, "REMOVE_ASSET" | "VALIDATE_ASSET">,
  reason?: string | null,
): string | null {
  if (manager.role !== "MANAGER") return "Only managers can moderate";
  if (manager.status !== "ACTIVE") return "Your account is suspended";
  if (action === "REMOVE_ASSET" && !reason?.trim()) return "Enter a reason";
  if (action === "REMOVE_ASSET" && asset.status === "REMOVED") return "This asset is already removed";
  if (action === "VALIDATE_ASSET") {
    if (asset.status !== "PUBLISHED") return "Only published assets can be validated";
    if (asset.validatedAt) return "This asset is already validated";
  }
  return null;
}
