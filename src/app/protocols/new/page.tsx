"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Btn, Field, PageTitle, Pill } from "@/components/ui";
import { toast } from "@/components/toast";
import { Disclosure } from "@/components/disclosure";
import { CATEGORY_LABEL, PEPTIDE_BY_ID, PEPTIDES, halfLifeLabel } from "@/lib/peptides";
import { actions } from "@/lib/store";
import type { Peptide } from "@/lib/types";
import { CYCLES, SCHEDULES } from "@/lib/presets";

/** guess the schedule and cycle from the library entry so nobody fills a form */
function presetFor(p: Peptide) {
  const f = p.frequency.toLowerCase();
  const scheduleId = f.includes("weekly")
    ? f.includes("2×") ? "twice" : f.includes("3×") ? "three" : f.includes("1–2×") ? "weekly" : "weekly"
    : "daily";
  const cycleId = p.cycle && /\d+\s*(wk|week)/i.test(p.cycle) ? "8-4" : "none";
  return { dose: String(p.range[0]), scheduleId, cycleId, vialMg: "5", waterMl: "2" };
}

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

  // a deep link (?p=tirzepatide) must arrive fully prefilled, not just with a name
  const preset = peptide ? presetFor(peptide) : null;
  const [dose, setDose] = useState(() => preset?.dose ?? "");
  const [scheduleId, setScheduleId] = useState(() => preset?.scheduleId ?? "daily");
  const [cycleId, setCycleId] = useState(() => preset?.cycleId ?? "none");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [vialMg, setVialMg] = useState(() => preset?.vialMg ?? "5");
  const [waterMl, setWaterMl] = useState(() => preset?.waterMl ?? "2");

  function choose(p: Peptide) {
    const preset = presetFor(p);
    setPeptide(p);
    setDose(preset.dose);
    setScheduleId(preset.scheduleId);
    setCycleId(preset.cycleId);
    setVialMg(preset.vialMg);
    setWaterMl(preset.waterMl);
  }

  if (!peptide) {
    const q = search.trim().toLowerCase();
    return (
      <div>
        <PageTitle meta="Pick one. Everything else is prefilled — you can change it after.">Add a peptide</PageTitle>
        <input
          className="plaininput"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search peptides"
        />
        <ul className="mt-3 divide-y divide-line rounded-[24px] bg-card shadow-card">
          {PEPTIDES.filter((p) => !q || p.name.toLowerCase().includes(q) || p.aka?.toLowerCase().includes(q)).map(
            (p) => (
              <li key={p.id}>
                <button
                  onClick={() => choose(p)}
                  className="press flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[16px] font-medium">{p.name}</span>
                    <span className="num block text-[12.5px] text-muted">
                      {CATEGORY_LABEL[p.category]} · {p.frequency} · t½ {halfLifeLabel(p.halfLifeH)}
                    </span>
                  </span>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                    +
                  </span>
                </button>
              </li>
            ),
          )}
        </ul>
      </div>
    );
  }

  const schedule = SCHEDULES.find((s) => s.id === scheduleId)!.schedule;
  const cycle = CYCLES.find((c) => c.id === cycleId)!.cycle;

  return (
    <div>
      <button onClick={() => setPeptide(null)} className="press mb-1 text-[13px] font-medium text-accent">
        ‹ Choose another
      </button>
      <PageTitle meta={peptide.blurb}>{peptide.name}</PageTitle>

      <section className="enter rounded-[24px] bg-card px-4 py-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="accent">
            {dose} {peptide.unit}
          </Pill>
          <Pill tone="neutral">{SCHEDULES.find((s) => s.id === scheduleId)!.label}</Pill>
          {cycle ? (
            <Pill tone="warn">
              {cycle.onDays / 7}w on / {cycle.offDays / 7}w off
            </Pill>
          ) : null}
          {peptide.route !== "pen" ? (
            <Pill tone="neutral">
              {vialMg} mg + {waterMl} mL
            </Pill>
          ) : null}
        </div>
        <p className="mt-3 text-[13px] text-muted">
          Prefilled from the usual protocol. Start now and change anything later.
        </p>
      </section>

      <Btn
        size="lg"
        className="mt-3 w-full"
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
          if (peptide.route !== "pen") {
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
          toast(`${peptide.name} added`);
          router.push(`/protocols/${compound.id}`);
        }}
      >
        Start tracking
      </Btn>

      <Disclosure className="mt-3" title="Change the details">
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Dose (${peptide.unit})`}>
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
            <div className="grid grid-cols-2 gap-3">
              <Field label="Vial (mg)">
                <input inputMode="decimal" value={vialMg} onChange={(e) => setVialMg(e.target.value)} />
              </Field>
              <Field label="Water (mL)">
                <input inputMode="decimal" value={waterMl} onChange={(e) => setWaterMl(e.target.value)} />
              </Field>
            </div>
          ) : null}
        </div>
      </Disclosure>

      <p className="mt-3 px-1 text-[12px] text-muted">
        Tracking only — ranges come from published research, not a prescription.
      </p>
    </div>
  );
}
