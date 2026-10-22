import type { Schedule } from "./types";

export const SCHEDULES: { id: string; label: string; schedule: Schedule }[] = [
  { id: "daily", label: "Daily", schedule: { kind: "every", everyDays: 1 } },
  { id: "eod", label: "Every other day", schedule: { kind: "every", everyDays: 2 } },
  { id: "twice", label: "Mon + Thu", schedule: { kind: "weekly", days: [1, 4] } },
  { id: "three", label: "Mon, Wed, Fri", schedule: { kind: "weekly", days: [1, 3, 5] } },
  { id: "weekdays", label: "Weekdays", schedule: { kind: "weekly", days: [1, 2, 3, 4, 5] } },
  { id: "weekly", label: "Weekly", schedule: { kind: "every", everyDays: 7 } },
  { id: "biweekly", label: "Every 2 weeks", schedule: { kind: "every", everyDays: 14 } },
];

export const CYCLES: { id: string; label: string; cycle?: { onDays: number; offDays: number } }[] = [
  { id: "none", label: "Continuous", cycle: undefined },
  { id: "4-2", label: "4 wk on / 2 off", cycle: { onDays: 28, offDays: 14 } },
  { id: "8-4", label: "8 wk on / 4 off", cycle: { onDays: 56, offDays: 28 } },
  { id: "12-4", label: "12 wk on / 4 off", cycle: { onDays: 84, offDays: 28 } },
];

/** which preset a stored schedule matches, so the editor shows the right option */
export function schedulePresetId(s: Schedule): string {
  const found = SCHEDULES.find(
    (p) =>
      p.schedule.kind === s.kind &&
      (s.kind === "every"
        ? p.schedule.kind === "every" && p.schedule.everyDays === s.everyDays
        : p.schedule.kind === "weekly" && p.schedule.days.join() === s.days.join()),
  );
  return found?.id ?? "custom";
}

export function cyclePresetId(cycle?: { onDays: number; offDays: number }): string {
  if (!cycle) return "none";
  return CYCLES.find((c) => c.cycle?.onDays === cycle.onDays && c.cycle?.offDays === cycle.offDays)?.id ?? "custom";
}
