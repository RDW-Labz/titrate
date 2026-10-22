import type { Compound, DoseLog } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDay(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000);
}

export type CycleInfo = {
  day: number; // 1-based day of the whole cycle
  phase: "on" | "off";
  dayInPhase: number;
  phaseLength: number;
  daysLeftInPhase: number;
};

export function cycleInfo(c: Compound, date: Date): CycleInfo | null {
  if (!c.cycle || c.cycle.onDays + c.cycle.offDays <= 0) return null;
  const offset = daysBetween(parseDay(c.startDate), date);
  if (offset < 0) return null;
  const len = c.cycle.onDays + c.cycle.offDays;
  const dayInCycle = offset % len;
  const on = dayInCycle < c.cycle.onDays;
  const phaseLength = on ? c.cycle.onDays : c.cycle.offDays;
  const dayInPhase = on ? dayInCycle : dayInCycle - c.cycle.onDays;
  return {
    day: offset + 1,
    phase: on ? "on" : "off",
    dayInPhase: dayInPhase + 1,
    phaseLength,
    daysLeftInPhase: phaseLength - dayInPhase - 1,
  };
}

export function inCycle(c: Compound, date: Date): boolean {
  const info = cycleInfo(c, date);
  return info ? info.phase === "on" : true;
}

export function scheduledOn(c: Compound, date: Date): boolean {
  const offset = daysBetween(parseDay(c.startDate), date);
  if (offset < 0) return false;
  if (c.schedule.kind === "weekly") return c.schedule.days.includes(date.getDay());
  return offset % Math.max(1, c.schedule.everyDays) === 0;
}

export function loggedOn(doses: DoseLog[], compoundId: string, date: Date): DoseLog | undefined {
  const key = dayKey(date);
  return doses.find((d) => d.compoundId === compoundId && dayKey(new Date(d.at)) === key && !d.skipped);
}

/** any entry for that day, skipped included — a skipped dose stops it being "due" */
export function anyLogOn(doses: DoseLog[], compoundId: string, date: Date): DoseLog | undefined {
  const key = dayKey(date);
  return doses.find((d) => d.compoundId === compoundId && dayKey(new Date(d.at)) === key);
}

export function skippedOn(doses: DoseLog[], compoundId: string, date: Date): boolean {
  return !!anyLogOn(doses, compoundId, date)?.skipped;
}

export function isDueOn(c: Compound, doses: DoseLog[], date: Date): boolean {
  return scheduledOn(c, date) && inCycle(c, date) && !anyLogOn(doses, c.id, date);
}

/** next unlogged scheduled day, starting today; null if the schedule never lands again */
export function nextDue(c: Compound, doses: DoseLog[], from: Date, horizon = 400): Date | null {
  for (let i = 0; i < horizon; i++) {
    const day = addDays(from, i);
    if (isDueOn(c, doses, day)) return day;
  }
  return null;
}

/** when the next dose is expected: right now if it's due, otherwise 9 am on the due day */
export function nextDoseMoment(c: Compound, doses: DoseLog[], now: Date): { at: Date; due: boolean } | null {
  if (isDueOn(c, doses, now)) return { at: now, due: true };
  const day = nextDue(c, doses, now);
  if (!day) return null;
  return { at: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 0, 0), due: false };
}

export function timeTo(at: Date, now: Date): string {
  const mins = Math.round((at.getTime() - now.getTime()) / 60_000);
  if (mins <= 0) return "Now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

/** the dose in force on a date, given an ordered list of titration steps */
export function doseOnAt(baseDose: number, steps: { at: string; dose: number }[] | undefined, date: Date): number {
  const today = startOfDay(date).getTime();
  const active = (steps ?? []).filter((s) => parseDay(s.at).getTime() <= today);
  if (!active.length) return baseDose;
  return active.reduce((best, s) => (s.at > best.at ? s : best), active[0]).dose;
}

export function lastDose(doses: DoseLog[], compoundId: string): DoseLog | undefined {
  return doses
    .filter((d) => d.compoundId === compoundId && !d.skipped)
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))[0];
}

export function streak(doses: DoseLog[], today = new Date()): number {
  const days = new Set(doses.filter((d) => !d.skipped).map((d) => dayKey(new Date(d.at))));
  let cursor = days.has(dayKey(today)) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(dayKey(cursor))) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export const SITES = [
  "Left abdomen",
  "Right abdomen",
  "Left thigh",
  "Right thigh",
  "Left deltoid",
  "Right deltoid",
  "Left glute",
  "Right glute",
];

/** least recently used site — the whole point of rotation */
export function suggestSite(doses: DoseLog[]): string {
  const lastUse = new Map<string, number>();
  for (const d of doses) {
    if (!d.site) continue;
    const t = +new Date(d.at);
    lastUse.set(d.site, Math.max(lastUse.get(d.site) ?? 0, t));
  }
  return [...SITES].sort((a, b) => (lastUse.get(a) ?? 0) - (lastUse.get(b) ?? 0))[0];
}

export function humanIn(target: Date, now = new Date()): string {
  const diff = daysBetween(now, target);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
}
