export type ReconInput = {
  vialMg: number;
  waterMl: number;
  doseMcg: number;
  unitsPerMl: number; // 100 for U-100 syringes, 40 for U-40
};

export type ReconResult = {
  concentrationMcgPerMl: number;
  doseMl: number;
  units: number;
  dosesPerVial: number;
};

export const SYRINGES = [
  { id: "u100-03", label: "U-100 · 0.3 mL (30 units)", unitsPerMl: 100, maxUnits: 30 },
  { id: "u100-05", label: "U-100 · 0.5 mL (50 units)", unitsPerMl: 100, maxUnits: 50 },
  { id: "u100-10", label: "U-100 · 1 mL (100 units)", unitsPerMl: 100, maxUnits: 100 },
  { id: "u40-10", label: "U-40 · 1 mL (40 units)", unitsPerMl: 40, maxUnits: 40 },
] as const;

/** mg/mL -> mcg/mL, then dose volume, then syringe units */
export function reconstitute({ vialMg, waterMl, doseMcg, unitsPerMl }: ReconInput): ReconResult | null {
  if (!(vialMg > 0) || !(waterMl > 0) || !(doseMcg > 0)) return null;
  const concentrationMcgPerMl = (vialMg * 1000) / waterMl;
  const doseMl = doseMcg / concentrationMcgPerMl;
  return {
    concentrationMcgPerMl,
    doseMl,
    units: doseMl * unitsPerMl,
    dosesPerVial: (vialMg * 1000) / doseMcg,
  };
}

export function toMcg(dose: number, unit: "mcg" | "mg" | "iu"): number {
  if (unit === "mg") return dose * 1000;
  if (unit === "iu") return 0; // IU has no mg conversion — pens are dosed in units
  return dose;
}

/** units to draw for a dose against a mixed vial */
export function unitsForDose(
  vial: { totalMg: number; waterMl: number; unitsPerMl: number },
  doseMcg: number,
): number | null {
  const r = reconstitute({
    vialMg: vial.totalMg,
    waterMl: vial.waterMl,
    doseMcg,
    unitsPerMl: vial.unitsPerMl,
  });
  return r ? r.units : null;
}

/**
 * Water volume that keeps this dose inside the chosen barrel.
 * More water = more units to draw, so a too-big draw needs *less* water.
 */
export function waterToFit({
  vialMg,
  doseMcg,
  unitsPerMl,
  maxUnits,
}: {
  vialMg: number;
  doseMcg: number;
  unitsPerMl: number;
  maxUnits: number;
}): number | null {
  if (!(vialMg > 0) || !(doseMcg > 0) || !(unitsPerMl > 0) || !(maxUnits > 0)) return null;
  return (maxUnits * vialMg * 1000) / (doseMcg * unitsPerMl);
}

export function formatUnits(u: number): string {
  // insulin syringes are marked every half unit below 10, whole units above
  const rounded = u < 10 ? Math.round(u * 2) / 2 : Math.round(u);
  return rounded.toLocaleString(undefined, { maximumFractionDigits: 1 });
}
