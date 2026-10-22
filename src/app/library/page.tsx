"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, PageTitle, Pill, SectionHead } from "@/components/ui";
import { CATEGORY_LABEL, PEPTIDES, halfLifeLabel } from "@/lib/peptides";
import type { Category } from "@/lib/types";

const CATS: (Category | "all")[] = ["all", "glp1", "repair", "growth", "metabolic", "cosmetic", "other"];

export default function LibraryPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");

  const list = PEPTIDES.filter(
    (p) =>
      (cat === "all" || p.category === cat) &&
      (!q.trim() ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.aka?.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div>
      <PageTitle meta="Half-life, common ranges and cycle conventions. Reference, not advice.">
        Peptide library
      </PageTitle>

      <div className="field">
        <input placeholder="Search by name or brand" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search peptides" />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            aria-pressed={cat === c}
            className={`rounded-full border px-2.5 py-1 text-[12px] font-medium ${
              cat === c ? "border-accent bg-accent text-white" : "border-line bg-card text-muted"
            }`}
          >
            {c === "all" ? "All" : CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <SectionHead right={<Pill tone="neutral">{list.length}</Pill>}>Compounds</SectionHead>
      <Card className="divide-y divide-line">
        {list.map((p) => (
          <Link key={p.id} href={`/library/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-paper">
            <span className="min-w-0">
              <span className="block truncate text-[14.5px] font-medium">{p.name}</span>
              <span className="num block truncate text-[11.5px] text-muted">
                {p.aka ? `${p.aka} · ` : ""}
                {p.range[0]}–{p.range[1]} {p.unit} · t½ {halfLifeLabel(p.halfLifeH)}
              </span>
            </span>
            <span className="text-[12px] text-muted">{CATEGORY_LABEL[p.category]}</span>
          </Link>
        ))}
        {list.length === 0 ? <p className="px-4 py-4 text-[13px] text-muted">Nothing matches that.</p> : null}
      </Card>

      <p className="mt-4 px-1 text-[11.5px] leading-relaxed text-muted">
        Half-lives are typical published plasma values used to draw the level curve. Real clearance varies with
        dose, site, and the person — treat the curve as a shape, not a measurement.
      </p>
    </div>
  );
}