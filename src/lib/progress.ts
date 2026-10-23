import { addDays, daysBetween, parseDay } from "./schedule.ts";
import type { WeightLog } from "./types.ts";

export type Step = { at: string; dose: number };

export type Progress = {
  points: { x: number; lb: number }[];
  marks: { x: number; dose: number; at: string }[];
  min: number;
  max: number;
  change: number;
};

/**
 * Weight inside a trailing window, with where the dose changed inside it. `x` is 0..1 across the window
 * for both, so the chart can draw them on one axis — the point of the whole thing is seeing the steps line
 * up against the line.
 */
export function weightVsSteps(weights: WeightLog[], steps: Step[], now: Date, days = 90): Progress | null {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = addDays(end, -days);
  const inside = (at: string) => parseDay(at) >= start && parseDay(at) <= end;

  const points = [...weights]
    .filter((w) => inside(w.at))
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((w) => ({ x: daysBetween(start, parseDay(w.at)) / days, lb: w.lb }));
  if (points.length < 2) return null;

  const marks = [...steps]
    .filter((s) => inside(s.at))
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((s) => ({ x: daysBetween(start, parseDay(s.at)) / days, dose: s.dose, at: s.at }));

  const lbs = points.map((p) => p.lb);
  return {
    points,
    marks,
    min: Math.min(...lbs),
    max: Math.max(...lbs),
    change: Math.round((lbs[lbs.length - 1] - lbs[0]) * 10) / 10,
  };
}
