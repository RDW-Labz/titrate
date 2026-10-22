"use client";

import Link from "next/link";
import { useState } from "react";
import { PEPTIDE_BY_ID } from "@/lib/peptides";

const PEN = ["semaglutide", "tirzepatide", "liraglutide", "retatrutide"];
const VIAL = ["bpc-157", "tb-500", "ghk-cu", "ipamorelin", "cjc-1295-no-dac", "mots-c"];

function Row({ id }: { id: string }) {
  const p = PEPTIDE_BY_ID.get(id);
  if (!p) return null;
  return (
    <Link
      href={`/protocols/new?p=${p.id}`}
      className="press flex items-center justify-between gap-3 px-4 py-3.5"
    >
      <span className="min-w-0">
        <span className="block truncate text-[16px] font-medium">{p.name}</span>
        <span className="num block truncate text-[12px] text-muted">
          {p.aka ?? `${p.frequency} · ${p.range[0]}–${p.range[1]} ${p.unit}`}
        </span>
      </span>
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-[15px] font-semibold text-accent">
        +
      </span>
    </Link>
  );
}

export default function StartPage() {
  const [choice, setChoice] = useState<"pen" | "vial" | null>(null);

  return (
    <div className="pt-4">
      <h1 className="px-1 text-[28px] leading-tight font-semibold tracking-[-0.025em]">What are you running?</h1>
      <p className="mt-1.5 px-1 text-[13.5px] text-muted">Pick one and we fill in the rest. Change anything later.</p>

      <div className="mt-4 space-y-2.5">
        <button
          onClick={() => setChoice(choice === "pen" ? null : "pen")}
          aria-expanded={choice === "pen"}
          className={`press w-full rounded-[24px] bg-card px-4 py-4 text-left shadow-card ring-1 ring-black/[0.03] ${
            choice === "pen" ? "ring-2 ring-accent/40" : ""
          }`}
        >
          <p className="text-[17px] font-semibold">A GLP-1 pen</p>
          <p className="mt-0.5 text-[13px] text-muted">Ozempic, Mounjaro, Wegovy, Zepbound — weekly or daily pen.</p>
          <p className="num mt-1 text-[11.5px] text-accent">{choice === "pen" ? "Pick a pen ↓" : "4 pens"}</p>
        </button>

        {choice === "pen" ? (
          <div className="divide-y divide-line overflow-hidden rounded-[24px] bg-card shadow-card">
            {PEN.map((id) => (
              <Row key={id} id={id} />
            ))}
          </div>
        ) : null}

        <button
          onClick={() => setChoice(choice === "vial" ? null : "vial")}
          aria-expanded={choice === "vial"}
          className={`press w-full rounded-[24px] bg-card px-4 py-4 text-left shadow-card ring-1 ring-black/[0.03] ${
            choice === "vial" ? "ring-2 ring-accent/40" : ""
          }`}
        >
          <p className="text-[17px] font-semibold">I mix my own vial</p>
          <p className="mt-0.5 text-[13px] text-muted">BPC-157, TB-500, GHK-Cu, growth peptides — powder + water.</p>
          <p className="num mt-1 text-[11.5px] text-accent">{choice === "vial" ? "Pick a peptide ↓" : "20 in the library"}</p>
        </button>

        {choice === "vial" ? (
          <div className="divide-y divide-line overflow-hidden rounded-[24px] bg-card shadow-card">
            {VIAL.map((id) => (
              <Row key={id} id={id} />
            ))}
            <Link href="/library" className="press flex items-center justify-between px-4 py-3.5 text-[14px] font-medium text-accent">
              All peptides
              <span aria-hidden="true">›</span>
            </Link>
          </div>
        ) : null}
      </div>

      <p className="mt-5 px-1 text-[12px] text-muted">
        Not sure? <Link href="/library" className="underline underline-offset-2">Browse the library</Link> — each entry has the
        half-life, usual dose range and how it is cycled.
      </p>
    </div>
  );
}
