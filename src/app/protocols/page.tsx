"use client";

import Link from "next/link";
import { useState } from "react";
import { LogDot } from "@/components/log-dose";
import { toast } from "@/components/toast";
import { Empty } from "@/components/ui";
import { addDays, cycleInfo, humanIn, inCycle, isDueOn, loggedOn, nextDue, scheduledOn } from "@/lib/schedule";
import { actions, useStore } from "@/lib/store";
import { doseOn } from "@/lib/titration";
import { PEPTIDE_BY_ID } from "@/lib/peptides";
import { CATEGORY_DOT } from "@/lib/category-color";
import type { Compound } from "@/lib/types";

function adherence(c: Compound, doses: ReturnType<typeof useStore>["doses"], now: Date) {
  let due = 0;
  let logged = 0;
  for (let i = 0; i < 28; i++) {
    const day = addDays(now, -i);
    if (scheduledOn(c, day) && inCycle(c, day)) {
      due++;
      if (loggedOn(doses, c.id, day)) logged++;
    }
  }
  return due ? Math.round((logged / due) * 100) : null;
}

/** tiny 28-day adherence donut */
function AdherenceDot({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const r = 9;
  const c = 2 * Math.PI * r;
  const stroke = pct >= 80 ? "var(--color-accent)" : pct >= 50 ? "var(--color-warn)" : "var(--color-alert)";
  return (
    <span className="relative grid size-6 place-items-center" aria-label={`${pct}% of doses on time`}>
      <svg width="24" height="24" className="-rotate-90" aria-hidden="true">
        <circle cx="12" cy="12" r={r} fill="none" stroke="var(--color-line)" strokeWidth="2.5" />
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${(c * Math.min(100, pct)) / 100} ${c}`}
        />
      </svg>
    </span>
  );
}

export default function PeptidesPage() {
  const store = useStore();
  const { compounds, doses } = store;
  const now = new Date();
  const [showArchived, setShowArchived] = useState(false);

  const active = compounds.filter((c) => !c.archived);
  const archived = compounds.filter((c) => c.archived);

  return (
    <div className="pt-3">
      <div className="enter flex items-baseline justify-between px-1">
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.025em]">Peptides</h1>
        <Link href="/start" className="press text-[14px] font-semibold text-accent">
          Add
        </Link>
      </div>

      {active.length === 0 ? (
        <div className="mt-4">
          <Empty title="Nothing here yet" body="Add the peptide you're running and set the dose once.">
            <Link
              href="/start"
              className="press rounded-2xl bg-accent px-4 py-3.5 text-[16px] font-semibold text-white"
            >
              Add a peptide
            </Link>
          </Empty>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {active.map((c, i) => {
            const due = isDueOn(c, doses, now);
            const cycle = cycleInfo(c, now);
            const next = nextDue(c, doses, now);
            const pct = adherence(c, doses, now);
            return (
              <li
                key={c.id}
                className="enter flex items-center gap-3 rounded-[22px] bg-card px-4 py-3.5 shadow-card"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <Link href={`/protocols/${c.id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`size-2 shrink-0 rounded-full ${CATEGORY_DOT[PEPTIDE_BY_ID.get(c.peptideId)?.category ?? "other"]}`}
                  />
                  <span className="min-w-0 flex-1">
                    <p className="truncate text-[17px] font-medium">{c.name}</p>
                    <p className="num text-[13px] text-muted">
                      {doseOn(c, now)} {c.unit}
                      {cycle?.phase === "off"
                        ? " · off cycle"
                        : due
                          ? " · today"
                          : next
                            ? ` · ${humanIn(next, now)}`
                            : ""}
                    </p>
                  </span>
                </Link>
                <AdherenceDot pct={pct} />
                {due ? (
                  <LogDot compound={c} />
                ) : (
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-paper text-[17px] text-muted">
                    ›
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {archived.length ? (
        <div className="mt-4">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="press px-1 text-[13px] font-medium text-muted underline underline-offset-2"
          >
            {showArchived ? "Hide" : "Show"} archived ({archived.length})
          </button>
          {showArchived ? (
            <ul className="mt-2 space-y-2">
              {archived.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-[22px] bg-card/70 px-4 py-3 shadow-card">
                  <Link href={`/protocols/${c.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-muted">{c.name}</p>
                    <p className="num text-[12px] text-muted">
                      archived · {doses.filter((d) => d.compoundId === c.id && !d.skipped).length} doses kept
                    </p>
                  </Link>
                  <button
                    onClick={() => {
                      actions.archiveCompound(c.id, false);
                      toast(`${c.name} restored`);
                    }}
                    className="press rounded-xl bg-accent-soft px-3 py-2 text-[12.5px] font-semibold text-accent"
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
