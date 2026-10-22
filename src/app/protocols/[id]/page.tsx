"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LevelChart } from "@/components/level-chart";
import { LogDoseButton } from "@/components/log-dose";
import { ReconCalculator } from "@/components/recon-calculator";
import { Btn, Field, PageTitle } from "@/components/ui";
import { levelNow, levelWindow, levelWord } from "@/lib/levels";
import { CATEGORY_LABEL, PEPTIDE_BY_ID, halfLifeLabel } from "@/lib/peptides";
import { addDays, cycleInfo, dayKey, humanIn, inCycle, isDueOn, loggedOn, nextDue, scheduledOn } from "@/lib/schedule";
import { actions, useStore } from "@/lib/store";
import { scheduleLabel, vialStatus } from "@/lib/vial";

export default function ProtocolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { compounds, doses, vials } = useStore();
  const now = new Date();
  const [doseDraft, setDoseDraft] = useState("");

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
  const next = nextDue(compound, doses, now);
  const current = levelNow(doses, compound, now);
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
          {compound.dose} {compound.unit} · {scheduleLabel(compound)}
        </p>
      </div>

      <section className="enter mt-3 rounded-2xl bg-card px-4 py-4">
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

      <details className="mt-3 rounded-2xl bg-card px-4 py-3.5">
        <summary className="cursor-pointer text-[15px] font-semibold">Vial</summary>
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
              {status.dosesLeft <= 2 ? <p className="mt-1 text-[13px] text-warn">Mix a new one soon.</p> : null}
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

      <details className="mt-3 rounded-2xl bg-card px-4 py-3.5">
        <summary className="cursor-pointer text-[15px] font-semibold">
          Dose &amp; history
          <span className="num ml-2 text-[13px] text-muted">
            {adherence.due ? `${Math.round((adherence.logged / adherence.due) * 100)}% on time` : ""}
          </span>
        </summary>
        <div className="mt-3 flex items-end gap-2">
          <Field label={`Change dose (${compound.unit})`} className="flex-1">
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
              setDoseDraft("");
            }}
          >
            Save
          </Btn>
        </div>
        <ul className="mt-3 divide-y divide-line">
          {history.length === 0 ? (
            <li className="py-3 text-[13.5px] text-muted">No doses yet.</li>
          ) : (
            history.map((d) => {
              const at = new Date(d.at);
              return (
                <li key={d.id} className="flex items-center justify-between py-2.5">
                  <span className="num text-[13.5px]">
                    {at.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    <span className="text-muted">
                      {" "}
                      {at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </span>
                  <span className="num text-[13.5px]">
                    {d.dose} {d.unit}
                  </span>
                  <button
                    aria-label={`Delete dose ${dayKey(at)}`}
                    className="press px-1 text-[13px] text-muted"
                    onClick={() => actions.deleteDose(d.id)}
                  >
                    ✕
                  </button>
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