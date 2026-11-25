import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { formatJson, formatMarkdownRow, type SpikeReport } from "./spike-report";

const base: SpikeReport = {
  deviceLabel: "test",
  userAgent: "ua",
  mode: "main",
  delegate: "CPU",
  cadence: "design",
  resolution: "640x480",
  tasks: ["segmenter", "face"],
  durationSeconds: 30,
  fps: 12.34,
  msPerTask: { segmenter: { count: 10, mean: 20, p95: 30, max: 40 } },
  loopMs: { count: 10, mean: 50, p95: 60, max: 70 },
  longTasks: 2,
  longTaskMs: 130,
};

describe("spike report formatting", () => {
  it("always yields a single table row with a fixed column count", () => {
    fc.assert(
      fc.property(fc.string(), (label) => {
        const row = formatMarkdownRow({ ...base, deviceLabel: label });
        expect(row.includes("\n")).toBe(false);
        // Unescaped pipes delimit cells: 10 columns means 11 delimiters.
        expect(row.replace(/\\\|/g, "").split("|").length - 1).toBe(11);
      }),
    );
  });

  it("marks tasks without samples as n/a and never invents numbers", () => {
    expect(formatMarkdownRow(base)).toContain("face n/a");
  });

  it("round-trips through JSON", () => {
    expect(JSON.parse(formatJson(base))).toEqual(base);
  });
});
