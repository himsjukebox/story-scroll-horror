import fc from "fast-check";
import { describe, expect, it } from "vitest";

describe("test tooling", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2);
  });

  it("runs fast-check", () => {
    fc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => a + b === b + a));
  });
});
