"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Btn, Card, Field, PageTitle, Pill, SectionHead } from "@/components/ui";
import { CATEGORY_LABEL, PEPTIDE_BY_ID, PEPTIDES, halfLifeLabel } from "@/lib/peptides";
import { actions } from "@/lib/store";
import type { Schedule, Peptide } from "@/lib/types";

const SCHEDULES: { id: string; label: string; schedule: Schedule }[] = [
  { id: "daily", label: "Daily", schedule: { kind: "every", everyDays: 1 } },
  { id: "eod", label: "Every other day", schedule: { kind: "every", everyDays: 2 } },
  { id: "twice", label: "Mon + Thu", schedule: { kind: "weekly", days: [1, 4] } },
  { id: "three", label: "Mon, Wed, Fri", schedule: { kind: "weekly", days: [1, 3, 5] } },
  { id: "weekdays", label: "Weekdays", schedule: { kind: "weekly", days: [1, 2, 3, 4, 5] } },
  { id: "weekly", label: "Weekly", schedule: { kind: "every", everyDays: 7 } },
  { id: "biweekly", label: "Every 2 weeks", schedule: { kind: "every", everyDays: 14 } },
];

const CYCLES = [
  { id: "none", label: "Continuous", cycle: undefined },
  { id: "4-2", label: "4 wk on / 2 off", cycle: { onDays: 28, offDays: 14 } },
  { id: "6-2", label: "6 wk on / 2 off", cycle: { onDays: 42, offDays: 14 } },
  { id: "8-4", label: "8 wk on / 4 off", cycle: { onDays: 56, offDays: 28 } },
  { id: "12-4", label: "12 wk on / 4 off", cycle: { onDays: 84, offDays: 28 } },
];

export default function NewProtocolPage() {
  return (
    <Suspense fallback={<div className="pt-6 text-[13px] text-muted">Loading…</div>}>
      <NewProtocol />
    </Suspense>
  );
}

function NewProtocol() {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState("");
  const [peptide, setPeptide] = useState<Peptide | null>(() => {
    const id = params.get("p");
    return id ? (PEPTIDE_BY_ID.get(id) ?? null) : null;
  });

  const [dose, setDose] = useState("");
  const [scheduleId, setScheduleId] = useState("daily");
  const [cycleId, setCycleId] = useState("none");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mixVial, setMixVial] = useState(true);
  const [vialMg, setVialMg] = useState("5");
  const [waterMl, setWaterMl] = useState("2");

  function choose(p: Peptide) {
    setPeptide(p);
    setDose(String(p.range[0]));
    setScheduleId(p.frequency.toLowerCase().includes("weekly") && !p.frequency.includes("3") ? "weekly" : p.frequency.includes("daily") ? "daily" : "daily");
    setCycleId(p.cycle && /week/i.test(p.cycle) && p.cycle.includes("/") ? "8-4" : "none");
    setMixVial(p.route !== "pen");
    setVialMg(p.range[0] >= 1000 ? "10" : "5");
  }

  if (!peptide) {
    const q = search.trim().toLowerCase();
    return (
      <div>
        <PageTitle meta="Pick the compound. Doses and schedules are editable later.">New protocol</PageTitle>
        <div className="field">
          <input
            placeholder="Search peptides"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search peptides"
          />
        </div>
        <SectionHead>{q ? "Matches" : "All compounds"}</SectionHead>
        <Card className="divide-y divide-line">
          {PEPTIDES.filter((p) => !q || p.name.toLowerCase().includes(q) || p.aka?.toLowerCase().includes(q)).map(
            (p) => (
              <button
                key={p.id}
                onClick={() => choose(p)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-paper"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[14.5px] font-medium">{p.name}</span>
                  <span className="num block text-[11.5px] text-muted">
                    {CATEGORY_LABEL[p.category]} · {p.frequency} · t½ {halfLifeLabel(p.halfLifeH)}
                  </span>
                </span>
                <span className="text-muted">+</span>
              </button>
            ),
          )}
        </Card>
      </div>
    );
  }

  const schedule = SCHEDULES.find((s) => s.id === scheduleId)!.schedule;
  const cycle = CYCLES.find((c) => c.id === cycleId)!.cycle;

  return (
    <div>
      <button onClick={() => setPeptide(null)} className="mb-2 text-[12.5px] text-accent">
        ← Change compound
      </button>
      <PageTitle meta={peptide.blurb}>{peptide.name}</PageTitle>

      <Card className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Dose per shot (${peptide.unit})`} hint={`Common: ${peptide.range[0]}–${peptide.range[1]} ${peptide.unit}`}>
            <input inputMode="decimal" value={dose} onChange={(e) => setDose(e.target.value)} />
          </Field>
          <Field label="Start date">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
        </div>

        <Field label="Schedule">
          <select value={scheduleId} onChange={(e) => setScheduleId(e.target.value)}>
            {SCHEDULES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Cycle" hint={peptide.cycle ? `Typical: ${peptide.cycle}` : undefined}>
          <select value={cycleId} onChange={(e) => setCycleId(e.target.value)}>
            {CYCLES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        {peptide.route !== "pen" ? (
          <div className="rounded-lg border border-line bg-paper p-3">
            <label className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-medium">I mix this vial myself</span>
              <input
                type="checkbox"
                checked={mixVial}
                onChange={(e) => setMixVial(e.target.checked)}
                className="size-4 accent-[var(--color-accent)]"
              />
            </label>
            {mixVial ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Vial (mg)">
                  <input inputMode="decimal" value={vialMg} onChange={(e) => setVialMg(e.target.value)} />
                </Field>
                <Field label="Water (mL)">
                  <input inputMode="decimal" value={waterMl} onChange={(e) => setWaterMl(e.target.value)} />
                </Field>
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>

      <div className="mt-3 flex items-center gap-2">
        <Pill tone="neutral">{schedule.kind === "every" ? `every ${schedule.everyDays}d` : `${schedule.days.length}×/week`}</Pill>
        <Pill tone={cycle ? "warn" : "neutral"}>{cycle ? `${cycle.onDays / 7}w on / ${cycle.offDays / 7}w off` : "continuous"}</Pill>
      </div>

      <Btn
        className="mt-4 w-full"
        disabled={!(Number(dose) > 0)}
        onClick={() => {
          const compound = actions.addCompound({
            peptideId: peptide.id,
            name: peptide.name,
            dose: Number(dose),
            unit: peptide.unit,
            schedule,
            cycle,
            startDate,
          });
          if (mixVial && peptide.route !== "pen") {
            const vial = actions.addVial({
              peptideId: peptide.id,
              totalMg: Number(vialMg),
              waterMl: Number(waterMl),
              mixedOn: startDate,
              unitsPerMl: 100,
              label: `${vialMg} mg + ${waterMl} mL`,
            });
            actions.updateCompound(compound.id, { vialId: vial.id });
          }
          router.push(`/protocols/${compound.id}`);
        }}
      >
        Start tracking
      </Btn>
      <p className="mt-2 px-1 text-[11.5px] text-muted">
        Tracking only. This app does not prescribe doses — the ranges shown are the commonly researched ones.
      </p>
    </div>
  );
}
