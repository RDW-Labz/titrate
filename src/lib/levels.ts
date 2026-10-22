import { curve, levelAt, type Dose } from "./pk.ts";
import { addDays, inCycle, scheduledOn } from "./schedule.ts";
import { doseOn } from "./titration.ts";
import { PEPTIDE_BY_ID } from "./peptides.ts";
import type { Compound, DoseLog } from "./types.ts";

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

export type Series = {
  values: number[];
  markers: number[];
  futureMarkers: number[];
  nowAt: number;
  nextPeak: number;
};

/**
 * Past curve from logged doses plus a projection of the scheduled doses ahead,
 * so the right half of the chart shows where the next peaks land.
 */
export function levelSeries(doses: DoseLog[], c: Compound, now: Date, backDays = 14, fwdDays = 7): Series {
  const from = +now - backDays * 86_400_000;
  const to = +now + fwdDays * 86_400_000;

  const past = dosesFor(doses, c.id);
  const future: Dose[] = [];
  for (let i = 1; i <= fwdDays; i++) {
    const day = addDays(now, i);
    if (!scheduledOn(c, day) || !inCycle(c, day)) continue;
    future.push({
      at: +new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9),
      amount: doseOn(c, day),
    });
  }

  const { halfLifeH, tmaxH } = halfLifeOf(c);
  // curve() is in dose units; scale so one dose peak reads as 100%
  const unit = doseOn(c, now) || c.dose || 1;
  const values = curve([...past, ...future], halfLifeH, tmaxH, from, to, 130).map((v) => (v * 100) / unit);
  const frac = (t: number) => (t - from) / (to - from);
  const nowAt = backDays / (backDays + fwdDays);

  return {
    values,
    markers: past.filter((d) => d.at >= from && d.at <= to).map((d) => frac(d.at)),
    futureMarkers: future.map((d) => frac(d.at)),
    nowAt,
    nextPeak: Math.max(...values.slice(Math.floor(values.length * nowAt))),
  };
}
