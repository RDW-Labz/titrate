import type { Compound } from "./types.ts";
import { doseOnAt, parseDay, startOfDay } from "./schedule.ts";

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

/** true when a planned step changes the dose on this day (used for reminder copy) */
export function steppedOn(c: Compound, day: Date): boolean {
  const yesterday = new Date(day.getFullYear(), day.getMonth(), day.getDate() - 1);
  return doseOn(c, day) !== doseOn(c, yesterday);
}
