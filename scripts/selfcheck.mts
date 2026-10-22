import test from "node:test";
import assert from "node:assert/strict";
import { reconstitute, unitsForDose, formatUnits } from "../src/lib/recon.ts";
import { levelAt, decayLevel } from "../src/lib/pk.ts";
import { cycleInfo, isDueOn, nextDue, suggestSite, streak, dayKey } from "../src/lib/schedule.ts";
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
