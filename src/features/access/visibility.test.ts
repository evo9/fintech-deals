import { describe, expect, it } from "vitest";
import {
  assetModerationBlockReason,
  assetTransitionBlockReason,
  canContactAboutAsset,
  canContactBuyer,
  canManageOwnAsset,
  canSendMessage,
  canViewAsset,
  canViewBuyerProfile,
  contactBlockReason,
  isProfileFilled,
  userModerationBlockReason,
} from "./visibility";

const buyer = { id: "b1", role: "BUYER", status: "ACTIVE" } as const;
const seller = { id: "s1", role: "SELLER", status: "ACTIVE" } as const;
const manager = { id: "m1", role: "MANAGER", status: "ACTIVE" } as const;

const asset = (status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "REMOVED", sellerStatus: "ACTIVE" | "SUSPENDED" | "REMOVED" = "ACTIVE") => ({
  sellerId: "s1",
  status,
  seller: { status: sellerStatus },
});

const filled = { countries: ["MT"], licenseTypes: [], categories: [], budgetMin: null, budgetMax: null };
const emptyProfile = { countries: [], licenseTypes: [], categories: [], budgetMin: null, budgetMax: null };

describe("asset visibility", () => {
  it("shows a published asset of an active seller to everyone", () => {
    for (const viewer of [buyer, seller, manager]) expect(canViewAsset(viewer, asset("PUBLISHED"))).toBe(true);
  });

  it("hides drafts, withdrawn and removed assets from buyers and other sellers", () => {
    const otherSeller = { id: "s2", role: "SELLER", status: "ACTIVE" } as const;
    for (const status of ["DRAFT", "ARCHIVED", "REMOVED"] as const) {
      expect(canViewAsset(buyer, asset(status))).toBe(false);
      expect(canViewAsset(otherSeller, asset(status))).toBe(false);
    }
  });

  it("shows every status to the owner and to a manager", () => {
    for (const status of ["DRAFT", "ARCHIVED", "REMOVED"] as const) {
      expect(canViewAsset(seller, asset(status))).toBe(true);
      expect(canViewAsset(manager, asset(status))).toBe(true);
    }
  });

  it("hides assets of a suspended or removed seller from buyers", () => {
    expect(canViewAsset(buyer, asset("PUBLISHED", "SUSPENDED"))).toBe(false);
    expect(canViewAsset(buyer, asset("PUBLISHED", "REMOVED"))).toBe(false);
    expect(canViewAsset(manager, asset("PUBLISHED", "SUSPENDED"))).toBe(true);
  });

  it("does not let the owner edit an asset removed by a manager", () => {
    expect(canManageOwnAsset(seller, { sellerId: "s1", status: "PUBLISHED" })).toBe(true);
    expect(canManageOwnAsset(seller, { sellerId: "s1", status: "REMOVED" })).toBe(false);
    expect(canManageOwnAsset(seller, { sellerId: "s2", status: "PUBLISHED" })).toBe(false);
    expect(canManageOwnAsset(manager, { sellerId: "m1", status: "PUBLISHED" })).toBe(false);
  });

  it("allows only the documented status transitions", () => {
    expect(assetTransitionBlockReason({ status: "DRAFT" }, "publish")).toBeNull();
    expect(assetTransitionBlockReason({ status: "PUBLISHED" }, "withdraw")).toBeNull();
    expect(assetTransitionBlockReason({ status: "ARCHIVED" }, "republish")).toBeNull();
    expect(assetTransitionBlockReason({ status: "PUBLISHED" }, "delete")).not.toBeNull();
    expect(assetTransitionBlockReason({ status: "REMOVED" }, "republish")).not.toBeNull();
  });
});

describe("buyer profile visibility", () => {
  it("counts a profile as filled by countries, license types, categories or budget", () => {
    expect(isProfileFilled(filled)).toBe(true);
    expect(isProfileFilled({ ...emptyProfile, budgetMax: 1 })).toBe(true);
    expect(isProfileFilled(emptyProfile)).toBe(false);
    expect(isProfileFilled(null)).toBe(false);
  });

  it("shows a buyer to a seller only when active and filled", () => {
    const ref = (status: "ACTIVE" | "SUSPENDED", profile: typeof filled) => ({ id: "b1", role: "BUYER" as const, status, buyerProfile: profile });
    expect(canViewBuyerProfile(seller, ref("ACTIVE", filled))).toBe(true);
    expect(canViewBuyerProfile(seller, ref("ACTIVE", emptyProfile))).toBe(false);
    expect(canViewBuyerProfile(seller, ref("SUSPENDED", filled))).toBe(false);
    expect(canViewBuyerProfile(buyer, ref("ACTIVE", emptyProfile))).toBe(true); // own profile
  });
});

describe("contact rules", () => {
  it("allows buyer <-> seller only", () => {
    expect(contactBlockReason(buyer, seller)).toBeNull();
    expect(contactBlockReason(seller, buyer)).toBeNull();
    expect(contactBlockReason(buyer, { id: "b2", role: "BUYER", status: "ACTIVE" })).not.toBeNull();
    expect(contactBlockReason(seller, { id: "s2", role: "SELLER", status: "ACTIVE" })).not.toBeNull();
  });

  it("rejects messaging yourself and anything involving a manager", () => {
    expect(contactBlockReason(buyer, buyer)).toBe("You cannot message yourself");
    expect(contactBlockReason(manager, seller)).not.toBeNull();
    expect(contactBlockReason(buyer, manager)).not.toBeNull();
  });

  it("rejects suspended or removed participants on either side", () => {
    expect(contactBlockReason(buyer, { ...seller, status: "SUSPENDED" })).not.toBeNull();
    expect(contactBlockReason(buyer, { ...seller, status: "REMOVED" })).not.toBeNull();
    expect(contactBlockReason({ ...buyer, status: "SUSPENDED" }, seller)).not.toBeNull();
  });

  it("answers 'not found' when the target must not be revealed", () => {
    expect(canContactAboutAsset(buyer, asset("DRAFT"))).toMatchObject({ ok: false, notFound: true });
    expect(canContactAboutAsset(buyer, asset("PUBLISHED"))).toEqual({ ok: true });
    expect(
      canContactBuyer(seller, { id: "b1", role: "BUYER", status: "ACTIVE", buyerProfile: emptyProfile }),
    ).toMatchObject({ ok: false, notFound: true });
  });

  it("lets only participants send into a conversation", () => {
    const conversation = { buyerId: "b1", sellerId: "s1" };
    const other = { id: "b1", role: "BUYER", status: "ACTIVE" } as const;
    expect(canSendMessage(other, conversation, { ...seller })).toEqual({ ok: true });
    expect(canSendMessage({ ...other, id: "x" }, conversation, { ...seller })).toMatchObject({ ok: false, notFound: true });
    expect(canSendMessage(other, conversation, { ...seller, status: "SUSPENDED" })).toMatchObject({ ok: false });
  });
});

describe("moderation rules", () => {
  it("requires a reason to suspend or remove, but not to restore", () => {
    expect(userModerationBlockReason(manager, buyer, "SUSPEND", " ")).toBe("Enter a reason");
    expect(userModerationBlockReason(manager, buyer, "SUSPEND", "spam")).toBeNull();
    expect(userModerationBlockReason(manager, { ...buyer, status: "SUSPENDED" }, "RESTORE")).toBeNull();
  });

  it("never moderates a manager, including the acting one", () => {
    expect(userModerationBlockReason(manager, manager, "SUSPEND", "x")).not.toBeNull();
    expect(userModerationBlockReason(manager, { id: "m2", role: "MANAGER", status: "ACTIVE" }, "REMOVE", "x")).not.toBeNull();
  });

  it("allows only managers, and only active ones", () => {
    expect(userModerationBlockReason(seller, buyer, "SUSPEND", "x")).not.toBeNull();
    expect(userModerationBlockReason({ ...manager, status: "SUSPENDED" }, buyer, "SUSPEND", "x")).not.toBeNull();
  });

  it("validates only published, not yet validated assets and needs a reason to remove", () => {
    const published = { status: "PUBLISHED", validatedAt: null } as const;
    expect(assetModerationBlockReason(manager, published, "VALIDATE_ASSET")).toBeNull();
    expect(assetModerationBlockReason(manager, { ...published, validatedAt: new Date() }, "VALIDATE_ASSET")).not.toBeNull();
    expect(assetModerationBlockReason(manager, { status: "DRAFT", validatedAt: null }, "VALIDATE_ASSET")).not.toBeNull();
    expect(assetModerationBlockReason(manager, published, "REMOVE_ASSET", "")).toBe("Enter a reason");
    expect(assetModerationBlockReason(manager, { status: "REMOVED", validatedAt: null }, "REMOVE_ASSET", "x")).not.toBeNull();
  });
});
