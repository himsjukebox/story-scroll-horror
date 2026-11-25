export interface Summary {
  count: number;
  mean: number;
  p95: number;
  max: number;
}

/**
 * Nearest-rank percentile of an unsorted list. `p` is clamped to [0, 100].
 * Returns 0 for an empty list so callers never see NaN.
 */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const clamped = Number.isNaN(p) ? 0 : Math.min(100, Math.max(0, p));
  const rank = Math.ceil((clamped / 100) * sorted.length);
  return sorted[Math.max(0, rank - 1)] ?? 0;
}

export function summarize(values: readonly number[]): Summary {
  if (values.length === 0) return { count: 0, mean: 0, p95: 0, max: 0 };
  let sum = 0;
  let max = -Infinity;
  for (const v of values) {
    sum += v;
    if (v > max) max = v;
  }
  return { count: values.length, mean: sum / values.length, p95: percentile(values, 95), max };
}

/** Keeps the most recent `capacity` samples. Non-finite samples are ignored. */
export class RollingStats {
  private readonly buffer: number[] = [];

  constructor(readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError("capacity must be a positive integer");
    }
  }

  push(value: number): void {
    if (!Number.isFinite(value)) return;
    this.buffer.push(value);
    if (this.buffer.length > this.capacity) this.buffer.shift();
  }

  reset(): void {
    this.buffer.length = 0;
  }

  get size(): number {
    return this.buffer.length;
  }

  values(): number[] {
    return [...this.buffer];
  }

  summary(): Summary {
    return summarize(this.buffer);
  }
}
