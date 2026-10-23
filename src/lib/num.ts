/**
 * Adds up numbers and trims the float noise. Typed decimals like 0.1 and 0.2 sum to 0.30000000000000004, and
 * any total shown to a person has to read as the number they entered, not the binary remainder.
 */
export function sum(values: number[], places = 1): number {
  const raw = values.reduce((n, v) => n + v, 0);
  const f = 10 ** places;
  return Math.round(raw * f) / f;
}

/** the same trim for a single value, e.g. a weight that went through arithmetic */
export function round(value: number, places = 1): number {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}
