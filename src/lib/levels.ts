import { curve, levelAt, type Dose } from "./pk";
import { PEPTIDE_BY_ID } from "./peptides";
import type { Compound, DoseLog } from "./types";

export function dosesFor(doses: DoseLog[], compoundId: string): Dose[] {
  return doses
    .filter((d) => d.compoundId === compoundId && !d.skipped)
    .map((d) => ({ at: +new Date(d.at), amount: d.dose }));
}

export function halfLifeOf(c: Compound): { halfLifeH: number; tmaxH: number } {
  const p = PEPTIDE_BY_ID.get(c.peptideId);
  return { halfLifeH: p?.halfLifeH ?? 6, tmaxH: p?.tmaxH ?? 1.5 };
}

/** level in dose units -> percent of one dose's peak */
const toPercent = (c: Compound) => (c.dose > 0 ? 100 / c.dose : 1);

export function levelNow(doses: DoseLog[], c: Compound, now: Date): number {
  const { halfLifeH, tmaxH } = halfLifeOf(c);
  return levelAt(dosesFor(doses, c.id), +now, halfLifeH, tmaxH) * toPercent(c);
}

/** levels across a window; 100 = the peak of one dose */
export function levelWindow(
  doses: DoseLog[],
  c: Compound,
  now: Date,
  daysBack = 7,
  daysForward = 1,
): number[] {
  const { halfLifeH, tmaxH } = halfLifeOf(c);
  const from = +now - daysBack * 86_400_000;
  const to = +now + daysForward * 86_400_000;
  return curve(dosesFor(doses, c.id), halfLifeH, tmaxH, from, to, 80).map((v) => v * toPercent(c));
}

export function levelWord(pct: number): string {
  if (pct < 5) return "cleared";
  if (pct < 35) return "trough";
  if (pct < 75) return "rising";
  if (pct < 130) return "near peak";
  return "stacked";
}
