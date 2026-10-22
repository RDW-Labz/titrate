import { addDays, inCycle, scheduledOn } from "./schedule.ts";
import { doseOn } from "./titration.ts";
import type { Compound } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

/** floating local time (no Z) so the calendar app puts it in the phone's timezone */
const stamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

const escape = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");

/**
 * Calendar events for the doses scheduled in the next `weeks`.
 * One VEVENT per dose: calendar apps expand nothing, so this stays predictable.
 */
export function dosesIcs(compounds: Compound[], now: Date, weeks = 8, hour = 9): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Titrate//Protocol//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (let i = 0; i < weeks * 7; i++) {
    const day = addDays(now, i);
    for (const c of compounds) {
      if (c.archived || !scheduledOn(c, day) || !inCycle(c, day)) continue;
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour);
      const end = new Date(+start + 15 * 60_000);
      const dose = doseOn(c, day);
      lines.push(
        "BEGIN:VEVENT",
        `UID:${c.id}-${stamp(start)}@titrate`,
        `DTSTAMP:${stamp(now)}`,
        `DTSTART:${stamp(start)}`,
        `DTEND:${stamp(end)}`,
        `SUMMARY:${escape(`${c.name} ${dose} ${c.unit}`)}`,
        `DESCRIPTION:${escape(`Titrate — log this dose in the app. Estimated level curve, vial and site rotation are all there.`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-PT5M",
        "ACTION:DISPLAY",
        "DESCRIPTION:Titrate dose",
        "END:VALARM",
        "END:VEVENT",
      );
    }
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
