// Seeded pseudo-random numbers, so the synthetic population and its simulated
// outcomes are identical on every run and every machine.

export type Rng = () => number;

/** mulberry32: small, fast, good enough for synthetic data. */
export function rng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable numeric seed from a string, so each person gets their own stream. */
export function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function between(r: Rng, min: number, max: number): number {
  return min + r() * (max - min);
}

export function intBetween(r: Rng, min: number, max: number): number {
  return Math.floor(between(r, min, max + 1));
}

/** Normally distributed value (Box–Muller). */
export function normal(r: Rng, mean: number, sd: number): number {
  const u = Math.max(r(), 1e-9);
  const v = r();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Log-normal with a given median, for skewed waiting times. */
export function logNormal(r: Rng, median: number, spread: number): number {
  return median * Math.exp(normal(r, 0, spread));
}

export function chance(r: Rng, p: number): boolean {
  return r() < p;
}

export function weighted<T extends string>(r: Rng, weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [k, w] of entries) {
    x -= w;
    if (x <= 0) return k;
  }
  return entries[entries.length - 1][0];
}

export function pick<T>(r: Rng, items: readonly T[]): T {
  return items[Math.floor(r() * items.length)];
}

export function round(value: number, places = 1): number {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}
