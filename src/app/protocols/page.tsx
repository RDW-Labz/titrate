"use client";

import Link from "next/link";
import { LogDot } from "@/components/log-dose";
import { Empty } from "@/components/ui";
import { cycleInfo, humanIn, isDueOn, nextDue } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { doseOn } from "@/lib/titration";

export default function PeptidesPage() {
  const { compounds, doses } = useStore();
  const now = new Date();

  return (
    <div className="pt-3">
      <div className="enter flex items-baseline justify-between px-1">
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.025em]">Peptides</h1>
        <Link href="/start" className="press text-[14px] font-semibold text-accent">
          Add
        </Link>
      </div>

      {compounds.length === 0 ? (
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
          {compounds.map((c, i) => {
            const due = isDueOn(c, doses, now);
            const cycle = cycleInfo(c, now);
            const next = nextDue(c, doses, now);
            return (
              <li
                key={c.id}
                className="enter flex items-center gap-3 rounded-[22px] bg-card px-4 py-3.5 shadow-card"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <Link href={`/protocols/${c.id}`} className="min-w-0 flex-1">
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
                </Link>
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
    </div>
  );
}