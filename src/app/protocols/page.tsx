"use client";

import Link from "next/link";
import { useState } from "react";
import { LogDot } from "@/components/log-dose";
import { toast } from "@/components/toast";
import { Empty } from "@/components/ui";
import { addDays, cycleInfo, humanIn, inCycle, isDueOn, loggedOn, nextDue, scheduledOn } from "@/lib/schedule";
import { actions, useStore } from "@/lib/store";
import { doseOn } from "@/lib/titration";
import { PEPTIDE_BY_ID, PEPTIDES, halfLifeLabel } from "@/lib/peptides";
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
  const [q, setQ] = useState("");

  const query = q.trim().toLowerCase();
  const mine = compounds.filter((c) => !c.archived);
  const active = query ? mine.filter((c) => c.name.toLowerCase().includes(query)) : mine;
  const archived = compounds.filter((c) => c.archived && (!query || c.name.toLowerCase().includes(query)));
  const pages = [
    { href: "/calc", label: "Calc", hint: "reconstitution" },
    { href: "/food", label: "Food", hint: "nutrition & weight" },
    { href: "/library", label: "Library", hint: "20 compounds" },
    { href: "/summary", label: "Summary", hint: "for a clinician" },
    { href: "/settings", label: "Settings", hint: "reminders, backup" },
    { href: "/studio", label: "Studio", hint: "OpenUI cards" },
  ].filter((p) => query && (p.label.toLowerCase().includes(query) || p.hint.includes(query)));

  const libraryHits = query
    ? PEPTIDES.filter(
        (p) =>
          (p.name.toLowerCase().includes(query) || p.aka?.toLowerCase().includes(query)) &&
          !compounds.some((c) => c.peptideId === p.id || c.name.toLowerCase() === p.name.toLowerCase()),
      ).slice(0, 5)
    : [];

  return (
    <div className="pt-3">
      <div className="enter flex items-baseline justify-between px-1">
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.025em]">Peptides</h1>
        <Link href="/start" className="press text-[14px] font-semibold text-accent">
          Add
        </Link>
      </div>

      <div className="relative mt-1">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your peptides or the library"
          aria-label="Search peptides"
          className="plaininput pl-10"
        />
        {q ? (
          <button
            onClick={() => setQ("")}
            aria-label="Clear search"
            className="press absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center text-[15px] text-muted"
          >
            ✕
          </button>
        ) : null}
      </div>

      {query && active.length + archived.length + libraryHits.length === 0 ? (
        <p className="mt-4 px-1 text-[13px] text-muted">Nothing matches “{q}”.</p>
      ) : null}

      {active.length === 0 && !query ? (
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

      {pages.length ? (
        <div className="mt-4">
          <p className="px-1 text-[12.5px] font-semibold text-muted">Go to</p>
          <ul className="mt-2 divide-y divide-line overflow-hidden rounded-[22px] bg-card shadow-card">
            {pages.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="press flex items-center justify-between px-4 py-3">
                  <span className="text-[15px] font-medium">{p.label}</span>
                  <span className="text-[12px] text-muted">{p.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {libraryHits.length ? (
        <div className="mt-4">
          <p className="px-1 text-[12.5px] font-semibold text-muted">In the library</p>
          <ul className="mt-2 divide-y divide-line overflow-hidden rounded-[22px] bg-card shadow-card">
            {libraryHits.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/library/${p.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{p.name}</p>
                  <p className="num text-[12px] text-muted">
                    t½ {halfLifeLabel(p.halfLifeH)} · {p.range[0]}–{p.range[1]} {p.unit}
                  </p>
                </Link>
                <Link
                  href={`/protocols/new?p=${p.id}`}
                  className="press rounded-xl bg-accent-soft px-3 py-2 text-[12.5px] font-semibold text-accent"
                >
                  Add
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
