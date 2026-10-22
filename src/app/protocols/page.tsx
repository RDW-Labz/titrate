"use client";

import Link from "next/link";
import { Card, Empty, LinkBtn, PageTitle, Pill, SectionHead } from "@/components/ui";
import { LogDoseButton } from "@/components/log-dose";
import { PEPTIDE_BY_ID } from "@/lib/peptides";
import { cycleInfo, humanIn, isDueOn, nextDue } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { scheduleLabel, vialStatus } from "@/lib/vial";

export default function ProtocolsPage() {
  const { compounds, doses, vials } = useStore();
  const now = new Date();

  return (
    <div>
      <PageTitle meta="Dose, schedule and cycle for each compound you run.">Protocols</PageTitle>

      {compounds.length === 0 ? (
        <Empty title="No protocols yet" body="Pick a peptide from the library, set the dose and schedule once.">
          <LinkBtn href="/protocols/new" variant="primary">
            Add a compound
          </LinkBtn>
        </Empty>
      ) : (
        <>
          <Card className="divide-y divide-line">
            {compounds.map((c) => {
              const peptide = PEPTIDE_BY_ID.get(c.peptideId);
              const cycle = cycleInfo(c, now);
              const vial = vials.find((v) => v.id === c.vialId);
              const status = vial ? vialStatus(vial, c, doses) : null;
              const next = nextDue(c, doses, now);
              return (
                <div key={c.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/protocols/${c.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{c.name}</p>
                      <p className="num text-[12px] text-muted">
                        {c.dose} {c.unit} · {scheduleLabel(c)}
                        {peptide ? ` · t½ ${peptide.halfLifeH}h` : ""}
                      </p>
                    </Link>
                    {isDueOn(c, doses, now) ? (
                      <LogDoseButton compound={c} size="sm" />
                    ) : (
                      <Pill tone={cycle?.phase === "off" ? "warn" : "neutral"}>
                        {cycle?.phase === "off" ? "off cycle" : next ? humanIn(next, now) : "paused"}
                      </Pill>
                    )}
                  </div>

                  {cycle ? (
                    <div className="mt-2">
                      <div className="h-1 overflow-hidden rounded-full bg-line">
                        <div
                          className={`h-full ${cycle.phase === "on" ? "bg-accent" : "bg-warn"}`}
                          style={{ width: `${(cycle.dayInPhase / cycle.phaseLength) * 100}%` }}
                        />
                      </div>
                      <p className="num mt-1 text-[11px] text-muted">
                        {cycle.phase} · day {cycle.dayInPhase}/{cycle.phaseLength} · {cycle.daysLeftInPhase} left
                      </p>
                    </div>
                  ) : null}

                  {status ? (
                    <p className="num mt-2 text-[11.5px] text-muted">
                      vial {Math.round(status.remainingMcg).toLocaleString()} mcg left · {status.dosesLeft} doses
                      {status.unitsPerDose ? ` · ${Math.round(status.unitsPerDose * 2) / 2} u/dose` : ""}
                    </p>
                  ) : (
                    <p className="mt-2 text-[11.5px] text-muted">
                      {c.pen ? "pen — dosed in mg" : "no vial mixed yet"}
                    </p>
                  )}
                </div>
              );
            })}
          </Card>
          <div className="mt-3">
            <LinkBtn href="/protocols/new" variant="line" className="w-full">
              Add another compound
            </LinkBtn>
          </div>
        </>
      )}

      <SectionHead>How cycles work here</SectionHead>
      <p className="px-1 text-[12.5px] leading-relaxed text-muted">
        An on/off cycle is a repeating window from the start date: 8 weeks on / 4 off means 56 days of doses,
        then 28 days where nothing is due. The bar shows where you are inside the current window, and the level
        curve keeps falling through the off period — that taper is usually the part people want to see.
      </p>
    </div>
  );
}