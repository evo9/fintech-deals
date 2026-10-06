import { describe, expect, it } from "vitest";
import { scoreMatch, type AssetForMatch, type BuyerInterests } from "./score";

const asset: AssetForMatch = {
  country: "MT",
  licenseType: "EMI",
  category: "EMI",
  assetType: "LICENSE_ONLY",
  askingPrice: 1_000_000,
};

const empty: BuyerInterests = {
  countries: [],
  licenseTypes: [],
  categories: [],
  assetTypes: [],
  budgetMin: null,
  budgetMax: null,
};

describe("scoreMatch", () => {
  it("counts every criterion when all of them match", () => {
    const result = scoreMatch(asset, {
      countries: ["MT", "LT"],
      licenseTypes: ["EMI"],
      categories: ["EMI"],
      assetTypes: ["LICENSE_ONLY"],
      budgetMin: 500_000,
      budgetMax: 2_000_000,
    });
    expect(result.considered).toBe(5);
    expect(result.matched).toBe(5);
    expect(result.criteria.every((c) => c.ok)).toBe(true);
  });

  it("reports which criteria matched when only some do", () => {
    const result = scoreMatch(asset, {
      ...empty,
      countries: ["PL"],
      licenseTypes: ["EMI"],
      budgetMin: 2_000_000,
    });
    expect(result.considered).toBe(3);
    expect(result.matched).toBe(1);
    expect(result.criteria).toEqual([
      { key: "country", ok: false },
      { key: "licenseType", ok: true },
      { key: "budget", ok: false },
    ]);
  });

  it("considers nothing when the buyer specified nothing", () => {
    expect(scoreMatch(asset, empty)).toEqual({ matched: 0, considered: 0, criteria: [] });
  });

  it("skips the budget for a price on request", () => {
    const result = scoreMatch(
      { ...asset, askingPrice: null },
      { ...empty, countries: ["MT"], budgetMin: 100, budgetMax: 200 },
    );
    expect(result.considered).toBe(1);
    expect(result.criteria.map((c) => c.key)).toEqual(["country"]);
  });

  it("accepts a budget with only a lower bound", () => {
    expect(scoreMatch(asset, { ...empty, budgetMin: 1_000_000 }).matched).toBe(1);
    expect(scoreMatch(asset, { ...empty, budgetMin: 1_000_001 }).matched).toBe(0);
  });
});
