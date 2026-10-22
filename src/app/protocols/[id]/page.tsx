"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { LevelChart } from "@/components/level-chart";
import { LogDoseButton } from "@/components/log-dose";
import { ReconCalculator } from "@/components/recon-calculator";
import { Disclosure } from "@/components/disclosure";
import { toast } from "@/components/toast";
import { Btn, Field, PageTitle } from "@/components/ui";
import { levelNow, levelSeries, levelWord } from "@/lib/levels";
import { dayKey, cycleInfo, humanIn, isDueOn, nextDue } from "@/lib/schedule";
import { actions, useStore } from "@/lib/store";
import { doseOn, nextStep } from "@/lib/titration";
import { CYCLES, SCHEDULES, cyclePresetId, schedulePresetId } from "@/lib/presets";
import { budDaysLeft, scheduleLabel, useByDate, vialStatus } from "@/lib/vial";

const localInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

export default function ProtocolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { compounds, doses, vials } = useStore();
  const now = new Date();
  const [doseDraft, setDoseDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editingDose, setEditingDose] = useState<string | null>(null);
  const [stepDate, setStepDate] = useState("");
  const [stepDose, setStepDose] = useState("");
  const [missedAt, setMissedAt] = useState("");
  const [missedDose, setMissedDose] = useState("");
  const [allHistory, setAllHistory] = useState(false);

  const compound = compounds.find((c) => c.id === id);
  if (!compound) {
    return (
      <div className="pt-6">
        <PageTitle>Not found</PageTitle>
        <Link href="/protocols" className="text-[14px] text-accent">
          Back to peptides
        </Link>
      </div>
    );
  }

  const cycle = cycleInfo(compound, now);
  const vial = vials.find((v) => v.id === compound.vialId);
  const status = vial ? vialStatus(vial, compound, doses) : null;
  const bud = vial ? budDaysLeft(vial, now) : null;
  const next = nextDue(compound, doses, now);
  const current = levelNow(doses, compound, now);
  const series = levelSeries(doses, compound, now, 14, 7);
  const inForce = doseOn(compound, now);
  const step = nextStep(compound, now);
  const steps = [...(compound.titration ?? [])].sort((a, b) => a.at.localeCompare(b.at));
  const history = doses
    .filter((d) => d.compoundId === compound.id)
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 30);

  return (
    <div className="pt-3">
      <Link href="/protocols" className="press -my-1 inline-block py-1.5 text-[14px] font-medium text-accent">
        ‹ Peptides
      </Link>

      <div className="mt-2 px-1">
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.025em]">{compound.name}</h1>
        <p className="num mt-1 text-[14px] text-muted">
          {inForce} {compound.unit} · {scheduleLabel(compound)}
        </p>
      </div>

      <section className="enter mt-3 rounded-[24px] bg-card px-4 py-4 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-[14px] text-muted">
            {isDueOn(compound, doses, now) ? "Ready when you are" : next ? `Next ${humanIn(next, now)}` : "Off cycle"}
          </p>
          <p className="num text-[12.5px] text-muted">
            {Math.round(current)}% {levelWord(current)} · next peak{" "}
            <span className="text-ink">{Math.round(series.nextPeak)}%</span>
          </p>
        </div>
        <div className="mt-2">
          <LevelChart
            values={series.values}
            height={136}
            markers={series.markers}
            futureMarkers={series.futureMarkers}
            nowAt={series.nowAt}
          />
        </div>
        <div className="mt-4">
          <LogDoseButton compound={compound} className="w-full" />
        </div>
        {cycle ? (
          <div className="mt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className={`h-full rounded-full ${cycle.phase === "on" ? "bg-accent" : "bg-warn"} transition-[width] duration-700`}
                style={{ width: `${(cycle.dayInPhase / cycle.phaseLength) * 100}%` }}
              />
            </div>
            <p className="num mt-1.5 text-[12px] text-muted">
              {cycle.phase} · day {cycle.dayInPhase} of {cycle.phaseLength}
            </p>
          </div>
        ) : null}
      </section>

      <Disclosure
        className="mt-3"
        title="More"
        right={
          step ? (
            <span className="num text-[12.5px] text-muted">
              next {step.dose} {compound.unit}
            </span>
          ) : undefined
        }
      >

        <div className="mt-4">
          <p className="text-[13.5px] font-semibold">Vial</p>
          {vial && status ? (
            <>
              <p className="num mt-1 text-[12.5px] text-muted">
                {status.dosesLeft} doses left · {status.unitsPerDose ? `${Math.round(status.unitsPerDose * 2) / 2} u each` : "—"} · use by{" "}
                {useByDate(vial).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                {bud !== null && bud < 0 ? " (expired)" : ""}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-700"
                  style={{ width: `${Math.max(2, (status.remainingMcg / status.totalMcg) * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <p className="mt-1 text-[12.5px] text-muted">{compound.pen ? "Pen — log the mg." : "No vial yet."}</p>
          )}
          <Disclosure nested title={vial ? "Mix another" : "Mix a vial"}>
            <ReconCalculator saveFor={compound} initial={vial} />
          </Disclosure>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <p className="text-[13.5px] font-semibold">Dose</p>
          <div className="mt-2 flex items-end gap-2">
            <Field label={`Dose (${compound.unit})`} className="flex-1">
              <input
                inputMode="decimal"
                value={doseDraft}
                placeholder={String(compound.dose)}
                onChange={(e) => setDoseDraft(e.target.value)}
              />
            </Field>
            <Btn
              variant="quiet"
              disabled={!(Number(doseDraft) > 0)}
              onClick={() => {
                actions.updateCompound(compound.id, { dose: Number(doseDraft) });
                toast(`Dose ${doseDraft} ${compound.unit}`);
                setDoseDraft("");
              }}
            >
              Save
            </Btn>
          </div>
          {steps.length ? (
            <ul className="mt-2 divide-y divide-line">
              {steps.map((s) => (
                <li key={s.at + s.dose} className="flex items-center justify-between py-1.5">
                  <span className="num text-[12.5px]">{s.at}</span>
                  <span className="num text-[12.5px]">
                    {s.dose} {compound.unit}
                  </span>
                  <button
                    aria-label={`Remove ${s.at}`}
                    className="press grid size-9 place-items-center text-[13px] text-muted"
                    onClick={() => actions.setTitration(compound.id, steps.filter((x) => x !== s))}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <Disclosure nested title="Plan a dose change" className="mt-1">
            <div className="mt-2 flex items-end gap-2">
              <Field label="On" className="flex-1">
                <input type="date" value={stepDate} onChange={(e) => setStepDate(e.target.value)} />
              </Field>
              <Field label={compound.unit} className="w-[88px]">
                <input inputMode="decimal" value={stepDose} onChange={(e) => setStepDose(e.target.value)} />
              </Field>
              <Btn
                variant="line"
                disabled={!stepDate || !(Number(stepDose) > 0)}
                onClick={() => {
                  actions.setTitration(compound.id, [...steps, { at: stepDate, dose: Number(stepDose) }]);
                  toast("Saved");
                  setStepDate("");
                  setStepDose("");
                }}
              >
                Add
              </Btn>
            </div>
          </Disclosure>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <p className="text-[13.5px] font-semibold">Schedule</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Field label="How often">
              <select
                value={schedulePresetId(compound.schedule)}
                onChange={(e) => {
                  const preset = SCHEDULES.find((p) => p.id === e.target.value);
                  if (preset) {
                    actions.updateCompound(compound.id, { schedule: preset.schedule });
                    toast(`Now: ${preset.label}`);
                  }
                }}
              >
                {SCHEDULES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
                {schedulePresetId(compound.schedule) === "custom" ? <option value="custom">Custom</option> : null}
              </select>
            </Field>
            <Field label="Cycle">
              <select
                value={cyclePresetId(compound.cycle)}
                onChange={(e) => {
                  const preset = CYCLES.find((c) => c.id === e.target.value);
                  if (preset) {
                    actions.updateCompound(compound.id, { cycle: preset.cycle });
                    toast(preset.cycle ? "Cycle set" : "Continuous");
                  }
                }}
              >
                {CYCLES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
                {cyclePresetId(compound.cycle) === "custom" ? <option value="custom">Custom</option> : null}
              </select>
            </Field>
          </div>
          <p className="mt-1.5 text-[12px] text-muted">
            Changing this re-dates what's due from today; logged doses stay.
          </p>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <p className="text-[13.5px] font-semibold">History</p>
          <Disclosure nested title="Log a missed dose" className="mt-1">
            <div className="mt-2 flex items-end gap-2">
              <Field label="When" className="flex-1">
                <input type="date" value={missedAt} onChange={(e) => setMissedAt(e.target.value)} />
              </Field>
              <Field label={compound.unit} className="w-[88px]">
                <input inputMode="decimal" value={missedDose} placeholder={String(inForce)} onChange={(e) => setMissedDose(e.target.value)} />
              </Field>
              <Btn
                variant="line"
                disabled={!missedAt}
                onClick={() => {
                  const [y, m, d] = missedAt.split("-").map(Number);
                  const at = new Date(y, m - 1, d, 9, 0, 0);
                  const dose = Number(missedDose) > 0 ? Number(missedDose) : inForce;
                  actions.logDose({ compoundId: compound.id, dose, unit: compound.unit, at });
                  toast(`Logged ${dose} ${compound.unit} on ${missedAt}`);
                  setMissedAt("");
                  setMissedDose("");
                }}
              >
                Add
              </Btn>
            </div>
          </Disclosure>
          <ul className="mt-1 divide-y divide-line">
            {history.length === 0 ? (
              <li className="py-2 text-[12.5px] text-muted">Nothing logged yet.</li>
            ) : (
              (allHistory ? history : history.slice(0, 5)).map((d) => {
                const at = new Date(d.at);
                return (
                  <li key={d.id} className="py-1.5">
                    {editing === d.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="datetime-local"
                          defaultValue={localInput(at)}
                          className="plaininput flex-1 py-2 text-[13px]"
                          onChange={(e) => {
                            const v = new Date(e.target.value);
                            if (!Number.isNaN(+v)) {
                              actions.updateDose(d.id, { at: v.toISOString() });
                              toast("Time updated");
                            }
                          }}
                        />
                        <button
                          className="press grid min-h-[38px] place-items-center px-3 text-[13px] font-semibold text-accent"
                          onClick={() => setEditing(null)}
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <button
                          className="press num min-h-[38px] text-left text-[13px]"
                          onClick={() => setEditing(d.id)}
                          aria-label={`Edit time for dose on ${dayKey(at)}`}
                        >
                          {at.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          <span className="text-muted">
                            {" "}
                            {at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                          </span>
                        </button>
                        {editingDose === d.id ? (
                          <input
                            type="number"
                            inputMode="decimal"
                            autoFocus
                            defaultValue={d.dose}
                            aria-label={`Dose amount for ${dayKey(at)}`}
                            className="plaininput w-[76px] px-2 py-1 text-right text-[13px]"
                            onBlur={(e) => {
                              const v = Number(e.target.value);
                              if (v > 0) actions.updateDose(d.id, { dose: v });
                              setEditingDose(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                          />
                        ) : (
                          <button
                            onClick={() => setEditingDose(d.id)}
                            className="press num min-h-[38px] text-[13px]"
                            aria-label={`Edit amount for dose on ${dayKey(at)}`}
                          >
                            {d.dose} {d.unit}
                          </button>
                        )}
                        <button
                          aria-label={`Delete dose ${dayKey(at)}`}
                          className="press grid size-9 place-items-center text-[13px] text-muted"
                          onClick={() => actions.deleteDose(d.id)}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </li>
                );
              })
            )}
          </ul>
          {history.length > 5 ? (
            <button
              onClick={() => setAllHistory(!allHistory)}
              className="press mt-1 w-full py-2 text-center text-[13px] font-medium text-accent"
            >
              {allHistory ? "Show fewer" : `All ${history.length} doses`}
            </button>
          ) : null}
        </div>

        <div className="mt-4 flex gap-2">
          <Btn
            variant="line"
            className="flex-1 !text-[13px]"
            onClick={() => {
              actions.archiveCompound(compound.id, true);
              toast(`${compound.name} archived — history kept`, {
                label: "Undo",
                run: () => actions.archiveCompound(compound.id, false),
              });
              router.push("/protocols");
            }}
          >
            Archive
          </Btn>
          <Btn
            variant="line"
            className="!text-[13px] !text-alert"
            onClick={() => {
              if (confirm(`Delete ${compound.name} and its dose history for good?`)) {
                actions.removeCompound(compound.id);
                router.push("/protocols");
              }
            }}
          >
            Delete
          </Btn>
        </div>
      </Disclosure>
    </div>
  );
}