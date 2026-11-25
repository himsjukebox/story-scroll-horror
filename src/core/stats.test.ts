import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { percentile, RollingStats, summarize } from "./stats";

const samples = fc.array(fc.double({ min: 0, max: 1000, noNaN: true }), { minLength: 1, maxLength: 200 });

describe("percentile", () => {
  it("returns 0 for an empty list", () => {
    expect(percentile([], 95)).toBe(0);
  });

  it("is always one of the inputs, between min and max", () => {
    fc.assert(
      fc.property(samples, fc.double({ min: -50, max: 150, noNaN: true }), (values, p) => {
        const r = percentile(values, p);
        expect(values).toContain(r);
        expect(r).toBeGreaterThanOrEqual(Math.min(...values));
        expect(r).toBeLessThanOrEqual(Math.max(...values));
      }),
    );
  });

  it("is monotonic in p, with p=0 at the min and p=100 at the max", () => {
    fc.assert(
      fc.property(samples, fc.double({ min: 0, max: 100, noNaN: true }), fc.double({ min: 0, max: 100, noNaN: true }), (values, a, b) => {
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        expect(percentile(values, lo)).toBeLessThanOrEqual(percentile(values, hi));
        expect(percentile(values, 0)).toBe(Math.min(...values));
        expect(percentile(values, 100)).toBe(Math.max(...values));
      }),
    );
  });

  it("does not mutate its input", () => {
    fc.assert(
      fc.property(samples, (values) => {
        const copy = [...values];
        percentile(values, 95);
        expect(values).toEqual(copy);
      }),
    );
  });
});

describe("summarize", () => {
  it("keeps mean <= max and p95 <= max", () => {
    fc.assert(
      fc.property(samples, (values) => {
        const s = summarize(values);
        expect(s.count).toBe(values.length);
        expect(s.mean).toBeLessThanOrEqual(s.max + 1e-9);
        expect(s.p95).toBeLessThanOrEqual(s.max);
      }),
    );
  });
});

describe("RollingStats", () => {
  it("rejects invalid capacity", () => {
    expect(() => new RollingStats(0)).toThrow(RangeError);
    expect(() => new RollingStats(1.5)).toThrow(RangeError);
  });

  it("keeps only the last `capacity` finite samples", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), fc.array(fc.double({ min: 0, max: 100 }), { maxLength: 100 }), (cap, values) => {
        const r = new RollingStats(cap);
        for (const v of values) r.push(v);
        const finite = values.filter(Number.isFinite);
        expect(r.size).toBe(Math.min(cap, finite.length));
        expect(r.values()).toEqual(finite.slice(-cap));
        expect(r.size).toBeLessThanOrEqual(cap);
      }),
    );
  });

  it("ignores NaN and Infinity, and reset empties it", () => {
    const r = new RollingStats(3);
    r.push(Number.NaN);
    r.push(Number.POSITIVE_INFINITY);
    expect(r.size).toBe(0);
    r.push(2);
    r.reset();
    expect(r.summary()).toEqual({ count: 0, mean: 0, p95: 0, max: 0 });
  });
});
