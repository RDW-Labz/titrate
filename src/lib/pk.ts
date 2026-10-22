/**
 * One-compartment model with first-order absorption, summed over every dose
 * (superposition). Levels are relative: a single dose peaks at exactly `dose`.
 * Absorption rate is solved from tmax so the curve peaks where the literature says.
 * This is an estimate for pattern-spotting, not a pharmacokinetic measurement.
 */
export type Dose = { at: number; amount: number };

const MINUTES = 60_000;

function absorptionRate(ke: number, tmaxH: number): number {
  // tmax = ln(ka/ke)/(ka-ke); bisect ka in (ke, 100)
  const tmax = Math.max(tmaxH, 0.05);
  const f = (ka: number) => Math.log(ka / ke) / (ka - ke) - tmax;
  let lo = ke * 1.0001;
  let hi = Math.max(ke * 2, 50);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    // f grows then falls; at hi the product ka-ke dominates
    if (Number.isFinite(f(mid)) && f(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function levelAt(doses: Dose[], at: number, halfLifeH: number, tmaxH = 1.5): number {
  const ke = Math.LN2 / Math.max(halfLifeH, 0.05);
  const ka = absorptionRate(ke, tmaxH);
  const peakAt = Math.log(ka / ke) / (ka - ke);
  const peak = Math.exp(-ke * peakAt) - Math.exp(-ka * peakAt);
  let total = 0;
  for (const d of doses) {
    const dt = (at - d.at) / (60 * MINUTES);
    if (dt < 0) continue;
    total += (d.amount * (Math.exp(-ke * dt) - Math.exp(-ka * dt))) / peak;
  }
  return total;
}

export function curve(
  doses: Dose[],
  halfLifeH: number,
  tmaxH: number,
  from: number,
  to: number,
  steps = 96,
): number[] {
  const out: number[] = [];
  for (let i = 0; i <= steps; i++) {
    out.push(levelAt(doses, from + ((to - from) * i) / steps, halfLifeH, tmaxH));
  }
  return out;
}

/** log-decay level ignoring absorption — used for trough/accumulation math */
export function decayLevel(doses: Dose[], at: number, halfLifeH: number): number {
  return doses.reduce((sum, d) => {
    const dt = (at - d.at) / (60 * MINUTES);
    return dt < 0 ? sum : sum + d.amount * Math.pow(0.5, dt / halfLifeH);
  }, 0);
}
