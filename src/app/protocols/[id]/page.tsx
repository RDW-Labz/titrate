"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LevelChart } from "@/components/level-chart";
import { LogDoseButton } from "@/components/log-dose";
import { ReconCalculator } from "@/components/recon-calculator";
import { Btn, Card, Field, PageTitle, Pill, SectionHead, Stat } from "@/components/ui";
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
  const [doseDraft, setDoseDraft] = useState<string | null>(null);

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
  }, [compound, doses, now]);

  if (!compound) {
    return (
      <div className="pt-6">
        <PageTitle>Protocol not found</PageTitle>
        <Link href="/protocols" className="text-[13px] text-accent">
          ← Back to protocols
        </Link>
      </div>
    );
  }

  const peptide = PEPTIDE_BY_ID.get(compound.peptideId);
  const cycle = cycleInfo(compound, now);
  const vial = vials.find((v) => v.id === compound.vialId);
  const status = vial ? vialStatus(vial, compound, doses) : null;
  const next = nextDue(compound, doses, now);
  const values = levelWindow(doses, compound, now, 14, 2);
  const current = levelNow(doses, compound, now);
  const history = doses
    .filter((d) => d.compoundId === compound.id)
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 14);

  return (
    <div>
      <Link href="/protocols" className="text-[12.5px] text-accent">
        ← Protocols
      </Link>
      <PageTitle meta={peptide ? `${CATEGORY_LABEL[peptide.category]} · ${peptide.blurb}` : undefined}>
        {compound.name}
      </PageTitle>

      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="num text-[26px] leading-none font-medium">
              {compound.dose} <span className="text-[15px] text-muted">{compound.unit}</span>
            </p>
            <p className="num mt-1 text-[12px] text-muted">
              {scheduleLabel(compound)}
              {status?.unitsPerDose ? ` · ${Math.round(status.unitsPerDose * 2) / 2} u per dose` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11.5px] text-muted">{isDueOn(compound, doses, now) ? "due" : "next"}</p>
            <p className="num text-[14px]">{isDueOn(compound, doses, now) ? "now" : next ? humanIn(next, now) : "—"}</p>
          </div>
        </div>

        <div className="mt-3">
          <LogDoseButton compound={compound} className="w-full" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3">
          <Stat label="Half-life" value={peptide ? halfLifeLabel(peptide.halfLifeH) : "—"} />
          <Stat
            label="Adherence 28d"
            value={adherence.due ? `${Math.round((adherence.logged / adherence.due) * 100)}%` : "—"}
            sub={adherence.due ? `${adherence.logged}/${adherence.due}` : undefined}
          />
          <Stat
            label="Vial left"
            value={status ? `${status.dosesLeft}` : "—"}
            sub={status ? "doses" : compound.pen ? "pen" : undefined}
          />
        </div>
      </Card>

      {cycle ? (
        <>
          <SectionHead right={<Pill tone={cycle.phase === "on" ? "accent" : "warn"}>{cycle.phase} cycle</Pill>}>
            Cycle
          </SectionHead>
          <Card className="p-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className={`h-full ${cycle.phase === "on" ? "bg-accent" : "bg-warn"}`}
                style={{ width: `${(cycle.dayInPhase / cycle.phaseLength) * 100}%` }}
              />
            </div>
            <div className="num mt-2 flex justify-between text-[11.5px] text-muted">
              <span>
                day {cycle.dayInPhase} of {cycle.phaseLength} ({cycle.phase})
              </span>
              <span>
                {cycle.daysLeftInPhase} d to {cycle.phase === "on" ? "off" : "on"}
              </span>
            </div>
          </Card>
        </>
      ) : null}

      <SectionHead right={<Pill tone="neutral">% of one dose peak</Pill>}>Estimated level</SectionHead>
      <Card className="p-4">
        <div className="flex items-baseline justify-between">
          <p className="num text-[24px] font-medium">{Math.round(current)}%</p>
          <p className="text-[12px] text-muted">{levelWord(current)}</p>
        </div>
        <LevelChart values={values} height={80} showAxis />
        <div className="num mt-1 flex justify-between text-[10.5px] text-muted">
          <span>14 days ago</span>
          <span>now</span>
          <span>+2 days</span>
        </div>
        <p className="mt-2 text-[11.5px] text-muted">
          One-compartment estimate from half-life and your logged doses. It shows the shape — peak, trough,
          accumulation — not a blood level.
        </p>
      </Card>

      <SectionHead right={<Pill tone="neutral">{compound.pen ? "pen" : "vial"}</Pill>}>Titrate</SectionHead>
      <Card className="p-4">
        <div className="flex items-end gap-2">
          <div className="field flex-1">
            <label className="mb-1 block text-[12.5px] font-medium text-muted">Dose ({compound.unit})</label>
            <input
              inputMode="decimal"
              value={doseDraft ?? String(compound.dose)}
              onChange={(e) => setDoseDraft(e.target.value)}
            />
          </div>
          <Btn
            variant="line"
            disabled={doseDraft === null || !(Number(doseDraft) > 0)}
            onClick={() => {
              actions.updateCompound(compound.id, { dose: Number(doseDraft) });
              setDoseDraft(null);
            }}
          >
            Save
          </Btn>
        </div>
        <p className="mt-2 text-[11.5px] text-muted">
          Future doses use the new dose. Past logs keep theirs, so the level curve stays honest.
        </p>
      </Card>

      <SectionHead>Vial</SectionHead>
      <Card className="p-4">
        {vial && status ? (
          <>
            <div className="flex items-baseline justify-between">
              <p className="text-[14px] font-medium">{vial.label ?? `${vial.totalMg} mg vial`}</p>
              <p className="num text-[12px] text-muted">mixed {vial.mixedOn}</p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className="h-full bg-accent"
                style={{ width: `${Math.max(2, (status.remainingMcg / status.totalMcg) * 100)}%` }}
              />
            </div>
            <div className="num mt-2 grid grid-cols-3 gap-2 text-[12px]">
              <Stat label="Left" value={`${Math.round(status.remainingMcg).toLocaleString()} mcg`} />
              <Stat label="Doses" value={status.dosesLeft} />
              <Stat label="Per dose" value={status.unitsPerDose ? `${Math.round(status.unitsPerDose * 2) / 2} u` : "—"} />
            </div>
            {status.dosesLeft <= 2 ? (
              <p className="mt-2 text-[12px] text-warn">Running out — mix the next vial before the last dose.</p>
            ) : null}
          </>
        ) : (
          <p className="text-[13px] text-muted">
            {compound.pen ? "Pen-dosed compound: log the mg from the pen." : "No vial mixed yet — set the mg and water below."}
          </p>
        )}

        <details className="mt-3 border-t border-line pt-3">
          <summary className="cursor-pointer text-[13px] font-medium text-accent">
            {vial ? "Mix another vial" : "Mix a vial"}
          </summary>
          <div className="mt-3">
            <ReconCalculator saveFor={compound} initial={vial} />
          </div>
        </details>
      </Card>

      <SectionHead>History</SectionHead>
      <Card className="divide-y divide-line">
        {history.length === 0 ? (
          <p className="px-4 py-4 text-[13px] text-muted">No doses logged yet.</p>
        ) : (
          history.map((d) => {
            const at = new Date(d.at);
            return (
              <div key={d.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="num text-[13px]">
                    {at.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    <span className="text-muted"> · {at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
                  </p>
                  <p className="text-[11.5px] text-muted">
                    {d.site ?? "site not recorded"}
                    {d.units ? ` · ${d.units} u` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="num text-[13px]">
                    {d.dose} {d.unit}
                  </span>
                  <button
                    aria-label={`Delete dose from ${dayKey(at)}`}
                    className="text-[12px] text-muted hover:text-alert"
                    onClick={() => actions.deleteDose(d.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </Card>

      <div className="mt-6 mb-2 px-1">
        <button
          className="text-[12px] text-muted underline underline-offset-2 hover:text-alert"
          onClick={() => {
            if (confirm(`Stop tracking ${compound.name} and delete its dose history?`)) {
              actions.removeCompound(compound.id);
              router.push("/protocols");
            }
          }}
        >
          Stop tracking this compound
        </button>
      </div>
    </div>
  );
}
