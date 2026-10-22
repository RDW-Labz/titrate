import test from "node:test";
import assert from "node:assert/strict";
import { reconstitute, unitsForDose, formatUnits } from "../src/lib/recon.ts";
import { levelAt, decayLevel } from "../src/lib/pk.ts";
import { levelSeries, levelWord, levelNow } from "../src/lib/levels.ts";
import { dosesIcs } from "../src/lib/ics.ts";
import { cycleInfo, isDueOn, nextDue, suggestSite, streak, dayKey, doseOnAt, addDays, daysBetween, anyLogOn, skippedOn } from "../src/lib/schedule.ts";
import type { Compound, DoseLog } from "../src/lib/types.ts";

const hours = (h: number) => h * 3_600_000;

test("reconstitution: 5 mg in 2 mL, 250 mcg dose is 10 units on U-100", () => {
  const r = reconstitute({ vialMg: 5, waterMl: 2, doseMcg: 250, unitsPerMl: 100 })!;
  assert.equal(r.concentrationMcgPerMl, 2500);
  assert.equal(Math.round(r.doseMl * 1000) / 1000, 0.1);
  assert.equal(r.units, 10);
  assert.equal(r.dosesPerVial, 20);
});

test("reconstitution: same dose is 4 units on a U-40 barrel", () => {
  assert.equal(unitsForDose({ totalMg: 5, waterMl: 2, unitsPerMl: 40 }, 250), 4);
});

test("reconstitution: bad input returns null instead of NaN", () => {
  assert.equal(reconstitute({ vialMg: 0, waterMl: 2, doseMcg: 250, unitsPerMl: 100 }), null);
  assert.equal(reconstitute({ vialMg: 5, waterMl: 0, doseMcg: 250, unitsPerMl: 100 }), null);
  assert.equal(unitsForDose({ totalMg: 5, waterMl: 2, unitsPerMl: 100 }, 0), null);
});

test("unit formatting rounds to half units below 10", () => {
  assert.equal(formatUnits(10.4), "10");
  assert.equal(formatUnits(2.26), "2.5");
});

test("level curve peaks at tmax and equals the dose there", () => {
  const peak = levelAt([{ at: 0, amount: 250 }], hours(2), 4, 2);
  assert.ok(Math.abs(peak - 250) < 1, `peak was ${peak}`);
  assert.equal(levelAt([{ at: 0, amount: 250 }], 0, 4, 2), 0);
});

test("level falls after the peak and is nearly gone in 5 half-lives", () => {
  const after4 = levelAt([{ at: 0, amount: 250 }], hours(2 + 4), 4, 2);
  assert.ok(after4 > 140 && after4 < 160, `was ${after4}`);
  assert.ok(levelAt([{ at: 0, amount: 250 }], hours(2 + 20), 4, 2) < 20);
});

test("doses stack, and a future dose contributes nothing", () => {
  const two = levelAt(
    [
      { at: 0, amount: 250 },
      { at: hours(2), amount: 250 },
    ],
    hours(4),
    4,
    2,
  );
  // first dose is decaying at 4 h (205), second is at its peak (250)
  assert.ok(Math.abs(two - 455) < 5, `was ${two}`);
  assert.equal(levelAt([{ at: hours(4), amount: 250 }], hours(0), 4, 2), 0);
  assert.ok(Math.abs(decayLevel([{ at: 0, amount: 100 }], hours(4), 4) - 50) < 0.001);
});

const compound = (over: Partial<Compound> = {}): Compound => ({
  id: "c1",
  peptideId: "bpc-157",
  name: "BPC-157",
  dose: 250,
  unit: "mcg",
  schedule: { kind: "every", everyDays: 1 },
  startDate: dayKey(new Date(2026, 0, 1)),
  ...over,
});

const log = (at: Date, compoundId = "c1"): DoseLog => ({
  id: `d${+at}`,
  compoundId,
  at: at.toISOString(),
  dose: 250,
  unit: "mcg",
});

test("a daily compound is due today until it is logged", () => {
  const c = compound();
  const now = new Date(2026, 0, 10);
  assert.equal(isDueOn(c, [], now), true);
  assert.equal(isDueOn(c, [log(now)], now), false);
});

test("nothing is due before the start date", () => {
  const c = compound({ startDate: "2026-02-01" });
  assert.equal(isDueOn(c, [], new Date(2026, 0, 10)), false);
});

test("weekly schedules only land on the listed weekdays", () => {
  const c = compound({ schedule: { kind: "weekly", days: [1, 4] } });
  assert.equal(isDueOn(c, [], new Date(2026, 0, 5)), true); // Monday
  assert.equal(isDueOn(c, [], new Date(2026, 0, 6)), false); // Tuesday
});

test("an 8 week on / 4 week off cycle closes after day 56", () => {
  const c = compound({ cycle: { onDays: 56, offDays: 28 } });
  assert.equal(cycleInfo(c, new Date(2026, 0, 30))?.phase, "on");
  assert.equal(cycleInfo(c, new Date(2026, 2, 10))?.phase, "off");
  assert.equal(isDueOn(c, [], new Date(2026, 2, 10)), false);
});

test("nextDue skips days already logged", () => {
  const c = compound({ schedule: { kind: "every", everyDays: 7 } });
  const now = new Date(2026, 0, 10);
  assert.equal(dayKey(nextDue(c, [log(now)], now)!), dayKey(new Date(2026, 0, 15)));
});

test("streak counts consecutive logged days without breaking on a fresh morning", () => {
  const now = new Date(2026, 0, 10, 7);
  const doses = [log(new Date(2026, 0, 8)), log(new Date(2026, 0, 9))];
  assert.equal(streak(doses, now), 2);
});

test("site suggestion picks the least recently used site", () => {
  const doses: DoseLog[] = [{ ...log(new Date()), site: "Right glute" }];
  assert.equal(suggestSite(doses), "Left abdomen");
});

test("titration: the dose in force follows the latest step on or before the day", () => {
  const steps = [
    { at: "2026-01-05", dose: 7.5 },
    { at: "2026-01-01", dose: 5 },
    { at: "2026-01-19", dose: 10 },
  ];
  assert.equal(doseOnAt(2.5, steps, new Date(2025, 11, 30)), 2.5, "before any step");
  assert.equal(doseOnAt(2.5, steps, new Date(2026, 0, 1)), 5);
  assert.equal(doseOnAt(2.5, steps, new Date(2026, 0, 10)), 7.5);
  assert.equal(doseOnAt(2.5, steps, new Date(2026, 0, 19)), 10);
  assert.equal(doseOnAt(2.5, undefined, new Date(2026, 0, 19)), 2.5);
});

test("vial use-by is 28 days after mixing", () => {
  const mixed = new Date(2026, 0, 1);
  const useBy = addDays(mixed, 28);
  assert.equal(dayKey(useBy), "2026-01-29");
  assert.equal(daysBetween(new Date(2026, 0, 20), useBy), 9);
  assert.equal(daysBetween(new Date(2026, 1, 5), useBy), -7);
});

test("a skipped dose satisfies the day without counting as taken", () => {
  const c = compound();
  const now = new Date(2026, 0, 10);
  const skipped: DoseLog = { id: "s1", compoundId: "c1", at: now.toISOString(), dose: 250, unit: "mcg", skipped: true };
  assert.equal(isDueOn(c, [skipped], now), false, "no longer due");
  assert.equal(skippedOn([skipped], "c1", now), true);
  assert.equal(anyLogOn([skipped], "c1", now)?.skipped, true);
  assert.equal(streak([skipped], now), 0, "a skip is not a logged day");
});

test("the projected curve is scaled so one dose peak reads as 100%", () => {
  const c = compound({ peptideId: "tirzepatide", dose: 2500, unit: "mcg", schedule: { kind: "every", everyDays: 7 } });
  const now = new Date(2026, 0, 10, 9);
  const dose = { ...log(now), dose: 2500 }; // the log() fixture defaults to 250 mcg
  const s = levelSeries([dose], c, now, 14, 7);
  assert.ok(s.nextPeak > 90 && s.nextPeak < 220, `next peak was ${s.nextPeak}%`);
  assert.equal(s.futureMarkers.length, 1, "one scheduled dose inside the week ahead");
  const peak = levelNow([dose], c, new Date(+now + 24 * 3_600_000)); // tirzepatide peaks ~24 h after a dose
  assert.ok(Math.abs(peak - 100) < 8, `a dose at its peak should read ~100%, got ${peak}`);
});

test("nothing is projected while the cycle is in its off phase", () => {
  // a long off phase so every day in the week ahead is off
  const c = compound({ cycle: { onDays: 7, offDays: 14 }, startDate: "2026-01-12" });
  const now = new Date(2026, 0, 20, 9);
  assert.equal(cycleInfo(c, now)?.phase, "off");
  assert.equal(levelSeries([], c, now, 14, 7).futureMarkers.length, 0);
});

test("level words follow the percentages", () => {
  assert.equal(levelWord(2), "cleared");
  assert.equal(levelWord(20), "trough");
  assert.equal(levelWord(50), "rising");
  assert.equal(levelWord(100), "near peak");
  assert.equal(levelWord(180), "stacked");
});

test("calendar export writes one event per scheduled dose and nothing while off-cycle", () => {
  const now = new Date(2026, 0, 5, 8);
  const daily = compound({ id: "c-daily" });
  const weekly = compound({ id: "c-weekly", name: "Tirzepatide", peptideId: "tirzepatide", dose: 2500, schedule: { kind: "every", everyDays: 7 } });
  // started in December, so the two weeks after Jan 5 sit inside a long off phase
  const off = compound({ id: "c-off", cycle: { onDays: 7, offDays: 60 }, startDate: "2025-12-01" });
  const mock = compound({ id: "c-arch", archived: true });

  const ics = dosesIcs([daily, weekly, off, mock], now, 2);
  const events = ics.split("BEGIN:VEVENT").length - 1;
  assert.equal(events, 14 + 2, "14 daily doses plus 2 weekly ones in two weeks");
  assert.ok(ics.includes("SUMMARY:BPC-157 250 mcg"));
  assert.ok(ics.includes("SUMMARY:Tirzepatide 2500 mcg"));
  assert.ok(!ics.includes("c-arch"), "archived compounds are skipped");
  assert.ok(ics.startsWith("BEGIN:VCALENDAR") && ics.trimEnd().endsWith("END:VCALENDAR"));
  assert.ok(ics.includes("\r\n"), "CRLF line endings, as the spec requires");
});
