import { addDays, inCycle, loggedOn, scheduledOn } from "./schedule.ts";
import type { Compound, DoseLog } from "./types";

/**
 * Share of scheduled, in-cycle days in the last `days` that were actually logged.
 * Skips do not count as taken; null when nothing was scheduled in the window.
 */
export function adherencePct(c: Compound, doses: DoseLog[], now: Date, days = 28): number | null {
  let due = 0;
  let logged = 0;
  for (let i = 0; i < days; i++) {
    const day = addDays(now, -i);
    if (!scheduledOn(c, day) || !inCycle(c, day)) continue;
    due++;
    if (loggedOn(doses, c.id, day)) logged++;
  }
  return due ? Math.round((logged / due) * 100) : null;
}
