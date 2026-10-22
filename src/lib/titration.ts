import type { Compound } from "./types";
import { doseOnAt, parseDay, startOfDay } from "./schedule";

/** the dose in force on a given day: the latest scheduled step, else the base dose */
export function doseOn(c: Compound, date: Date = new Date()): number {
  return doseOnAt(c.dose, c.titration, date);
}

/** the next step that has not started yet */
export function nextStep(c: Compound, date: Date = new Date()): { at: string; dose: number } | undefined {
  const today = startOfDay(date).getTime();
  return (c.titration ?? [])
    .filter((s) => parseDay(s.at).getTime() > today)
    .sort((a, b) => a.at.localeCompare(b.at))[0];
}

export function titrationLabel(c: Compound): string | null {
  const steps = c.titration ?? [];
  if (!steps.length) return null;
  const next = nextStep(c);
  return next ? `${next.dose} ${c.unit} on ${next.at}` : `${steps.length} step${steps.length === 1 ? "" : "s"} set`;
}
