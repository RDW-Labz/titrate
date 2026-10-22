import { unitsForDose, toMcg } from "./recon";
import type { Compound, DoseLog, Vial } from "./types";

export type VialStatus = {
  totalMcg: number;
  usedMcg: number;
  remainingMcg: number;
  unitsPerDose: number | null;
  dosesLeft: number;
  concentrationMcgPerMl: number;
};

/** supply counts down from the doses logged after the vial was mixed */
export function vialStatus(vial: Vial, compound: Compound, doses: DoseLog[]): VialStatus {
  const totalMcg = vial.totalMg * 1000;
  const mixedAt = new Date(`${vial.mixedOn}T00:00:00`).getTime();
  const usedMcg = doses
    .filter((d) => d.compoundId === compound.id && !d.skipped && +new Date(d.at) >= mixedAt)
    .reduce((n, d) => n + toMcg(d.dose, d.unit), 0);
  const doseMcg = toMcg(compound.dose, compound.unit);
  return {
    totalMcg,
    usedMcg,
    remainingMcg: Math.max(0, totalMcg - usedMcg),
    unitsPerDose: unitsForDose(vial, doseMcg),
    dosesLeft: doseMcg > 0 ? Math.floor(Math.max(0, totalMcg - usedMcg) / doseMcg) : 0,
    concentrationMcgPerMl: totalMcg / vial.waterMl,
  };
}

export function scheduleLabel(c: Compound): string {
  if (c.schedule.kind === "weekly") {
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return c.schedule.days.length === 7 ? "Daily" : c.schedule.days.map((d) => names[d]).join(" · ");
  }
  const n = c.schedule.everyDays;
  return n === 1 ? "Daily" : n === 7 ? "Weekly" : n === 14 ? "Every 2 weeks" : `Every ${n} days`;
}
