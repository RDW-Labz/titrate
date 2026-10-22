"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LevelChart } from "@/components/level-chart";
import { LogDoseButton } from "@/components/log-dose";
import { ReconCalculator } from "@/components/recon-calculator";
import { toast } from "@/components/toast";
import { Btn, Field, PageTitle } from "@/components/ui";
import { levelNow, levelWindow, levelWord } from "@/lib/levels";
import { CATEGORY_LABEL, PEPTIDE_BY_ID, halfLifeLabel } from "@/lib/peptides";
import { addDays, cycleInfo, dayKey, humanIn, inCycle, isDueOn, loggedOn, nextDue, scheduledOn } from "@/lib/schedule";
import { actions, useStore } from "@/lib/store";
import { doseOn, nextStep } from "@/lib/titration";
import { BUD_DAYS, budDaysLeft, scheduleLabel, useByDate, vialStatus } from "@/lib/vial";

const localInput = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

export default function ProtocolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { compounds, doses, vials } = useStore();
  const now = new Date();
  const [doseDraft, setDoseDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [stepDate, setStepDate] = useState("");
  const [stepDose, setStepDose] = useState("");

  const compound = compounds.find((c) => c.id === id);

  const adherence = useMemo(() => {
    if (!compound) return { due: 0, logged: 0 };
    let due = 0;
    let logged = 0;
    for (let i = 0; i < 28; i++) {
      const day = addDays(now, -i);
      if (scheduledOn(compound, day) && inCycle(compound, day)) {
        due++;
        if (loggedOn(doses, compound.id, day)) logged++;
      }
    }
    return { due, logged };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compound, doses]);

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

  const peptide = PEPTIDE_BY_ID.get(compound.peptideId);
  const cycle = cycleInfo(compound, now);
  const vial = vials.find((v) => v.id === compound.vialId);
  const status = vial ? vialStatus(vial, compound, doses) : null;
  const bud = vial ? budDaysLeft(vial, now) : null;
  const next = nextDue(compound, doses, now);
  const current = levelNow(doses, compound, now);
  const inForce = doseOn(compound, now);
  const step = nextStep(compound, now);
  const steps = [...(compound.titration ?? [])].sort((a, b) => a.at.localeCompare(b.at));
  const history = doses
    .filter((d) => d.compoundId === compound.id)
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 30);

  return (
    <div className="pt-3">
      <Link href="/protocols" className="press text-[14px] font-medium text-accent">
        ‹ Peptides
      </Link>

      <div className="mt-2 px-1">
        <h1 className="text-[27px] leading-tight font-semibold tracking-[-0.02em]">{compound.name}</h1>
        <p className="num mt-1 text-[14px] text-muted">
          {inForce} {compound.unit} · {scheduleLabel(compound)}
        </p>
      </div>

      <section className="enter mt-3 rounded-[24px] bg-card px-4 py-4 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-[14px] text-muted">
            {isDueOn(compound, doses, now) ? "Ready when you are" : next ? `Next ${humanIn(next, now)}` : "Off cycle"}
          </p>
          <p className="num text-[14px]">
            {Math.round(current)}% <span className="text-muted">{levelWord(current)}</span>
          </p>
        </div>
        <div className="mt-2">
          <LevelChart values={levelWindow(doses, compound, now, 14, 1)} height={64} />
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
              {cycle.phase} · day {cycle.dayInPhase} of {cycle.phaseLength} · {cycle.daysLeftInPhase} to{" "}
              {cycle.phase === "on" ? "rest" : "restart"}
            </p>
          </div>
        ) : null}
      </section>

      {step ? (
        <p className="mt-2 px-1 text-[12.5px] text-muted">
          Steps up to <span className="num">{step.dose}</span> {compound.unit} on{" "}
          <span className="num">{step.at}</span>
        </p>
      ) : null}

      <details className="mt-3 rounded-[24px] bg-card px-4 py-3.5 shadow-card">
        <summary className="cursor-pointer text-[15px] font-semibold">
          Vial
          {bud !== null ? (
            <span className={`num ml-2 text-[13px] ${bud < 0 ? "text-alert" : bud <= 3 ? "text-warn" : "text-muted"}`}>
              {bud < 0 ? "expired" : `${bud} days left`}
            </span>
          ) : null}
        </summary>
        <div className="mt-3">
          {vial && status ? (
            <>
              <p className="num text-[13px] text-muted">
                {vial.label ?? `${vial.totalMg} mg`} · mixed {vial.mixedOn}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-700"
                  style={{ width: `${Math.max(2, (status.remainingMcg / status.totalMcg) * 100)}%` }}
                />
              </div>
              <p className="num mt-2 text-[14px]">
                {status.dosesLeft} doses left
                {status.unitsPerDose ? ` · ${Math.round(status.unitsPerDose * 2) / 2} u each` : ""}
              </p>
              <p className={`num mt-1 text-[12.5px] ${bud !== null && bud < 0 ? "text-alert" : "text-muted"}`}>
                Use by {useByDate(vial).toLocaleDateString(undefined, { month: "short", day: "numeric" })} ({BUD_DAYS} days after mixing)
              </p>
              {status.dosesLeft <= 2 ? <p className="mt-1 text-[13px] text-warn">Running low — mix a new one.</p> : null}
              {bud !== null && bud < 0 ? (
                <p className="mt-1 text-[13px] text-alert">Past use-by. Mix a fresh vial before the next dose.</p>
              ) : null}
            </>
          ) : (
            <p className="text-[13.5px] text-muted">
              {compound.pen ? "Pen — log the mg." : "No vial yet. Mix one below."}
            </p>
          )}
          <details className="mt-3">
            <summary className="cursor-pointer text-[14px] font-semibold text-accent">
              {vial ? "Mix another" : "Mix a vial"}
            </summary>
            <div className="mt-3">
              <ReconCalculator saveFor={compound} initial={vial} />
            </div>
          </details>
        </div>
      </details>

      <details className="mt-3 rounded-[24px] bg-card px-4 py-3.5 shadow-card">
        <summary className="cursor-pointer text-[15px] font-semibold">
          Dose &amp; history
          <span className="num ml-2 text-[13px] text-muted">
            {adherence.due ? `${Math.round((adherence.logged / adherence.due) * 100)}% on time` : ""}
          </span>
        </summary>

        <div className="mt-3 flex items-end gap-2">
          <Field label={`Base dose (${compound.unit})`} className="flex-1">
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
              toast(`Base dose ${doseDraft} ${compound.unit}`);
              setDoseDraft("");
            }}
          >
            Save
          </Btn>
        </div>

        <p className="mt-4 text-[13px] font-semibold">Titration</p>
        <p className="mt-1 text-[12px] text-muted">
          Scheduled steps change the dose on their own. Logging always uses the dose in force that day.
        </p>
        {steps.length ? (
          <ul className="mt-2 divide-y divide-line">
            {steps.map((s) => {
              const past = s.at <= dayKey(now);
              return (
                <li key={s.at + s.dose} className="flex items-center justify-between py-2">
                  <span className="num text-[13px]">
                    {s.at} <span className={past ? "text-accent" : "text-muted"}>· {past ? "active" : "next"}</span>
                  </span>
                  <span className="num text-[13px]">
                    {s.dose} {compound.unit}
                  </span>
                  <button
                    aria-label={`Remove step ${s.at}`}
                    className="press grid size-9 place-items-center text-[13px] text-muted"
                    onClick={() => actions.setTitration(compound.id, steps.filter((x) => x !== s))}
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        <div className="mt-2 flex items-end gap-2">
          <Field label="Step date" className="flex-1">
            <input type="date" value={stepDate} onChange={(e) => setStepDate(e.target.value)} />
          </Field>
          <Field label={`Dose (${compound.unit})`} className="w-[104px]">
            <input inputMode="decimal" value={stepDose} onChange={(e) => setStepDose(e.target.value)} />
          </Field>
          <Btn
            variant="line"
            disabled={!stepDate || !(Number(stepDose) > 0)}
            onClick={() => {
              actions.setTitration(compound.id, [...steps, { at: stepDate, dose: Number(stepDose) }]);
              toast(`Step added: ${stepDose} ${compound.unit} on ${stepDate}`);
              setStepDate("");
              setStepDose("");
            }}
          >
            Add
          </Btn>
        </div>

        <p className="mt-4 text-[13px] font-semibold">History</p>
        <p className="mt-1 text-[12px] text-muted">Tap a time to fix it — logged late, or the wrong day.</p>
        <ul className="mt-2 divide-y divide-line">
          {history.length === 0 ? (
            <li className="py-3 text-[13.5px] text-muted">No doses yet.</li>
          ) : (
            history.map((d) => {
              const at = new Date(d.at);
              return (
                <li key={d.id} className="py-2">
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
                        className="press num min-h-[38px] text-left text-[13.5px]"
                        onClick={() => setEditing(d.id)}
                        aria-label={`Edit time for dose on ${dayKey(at)}`}
                      >
                        {at.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        <span className="text-muted">
                          {" "}
                          {at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </button>
                      <span className="num text-[13.5px]">
                        {d.dose} {d.unit}
                      </span>
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
        <p className="mt-3 text-[12px] text-muted">
          {peptide ? `${CATEGORY_LABEL[peptide.category]} · half-life ${halfLifeLabel(peptide.halfLifeH)}` : ""}
        </p>
      </details>

      <button
        className="press mt-5 mb-2 w-full py-3 text-[13px] text-muted underline underline-offset-2"
        onClick={() => {
          if (confirm(`Stop tracking ${compound.name} and delete its history?`)) {
            actions.removeCompound(compound.id);
            router.push("/protocols");
          }
        }}
      >
        Stop tracking
      </button>
    </div>
  );
}
