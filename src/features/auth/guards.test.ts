import { describe, expect, it } from "vitest";
import { safeNextPath } from "./guards";

describe("safeNextPath", () => {
  it("keeps relative paths with a query", () => {
    expect(safeNextPath("/assets/712?tab=1")).toBe("/assets/712?tab=1");
  });

  it("rejects absolute, protocol-relative and control-character values", () => {
    for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com", "/\t/evil.com", "", null, undefined, "evil"]) {
      expect(safeNextPath(bad)).toBeNull();
    }
  });

  it("rejects dot segments that normalize to a protocol-relative URL", () => {
    expect(safeNextPath("/..//evil.com")).toBeNull();
    expect(safeNextPath("/.//evil.com")).toBeNull();
  });
});
