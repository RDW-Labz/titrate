"use client";

import Link from "next/link";
import { useState } from "react";
import { PageTitle } from "@/components/ui";
import { PEPTIDES, halfLifeLabel } from "@/lib/peptides";
import { CATEGORY_DOT } from "@/lib/category-color";


export default function LibraryPage() {
  const [q, setQ] = useState("");
  const list = PEPTIDES.filter(
    (p) => !q.trim() || p.name.toLowerCase().includes(q.toLowerCase()) || p.aka?.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="pt-3">
      <PageTitle meta="Half-life, usual dose range, how it's cycled.">Library</PageTitle>

      <input
        className="plaininput"
        placeholder="Search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search peptides"
      />

      <ul className="mt-3 divide-y divide-line rounded-[24px] bg-card shadow-card">
        {list.map((p, i) => (
          <li key={p.id} className="enter" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
            <Link href={`/library/${p.id}`} className="press flex items-center gap-3 px-4 py-3.5">
              <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${CATEGORY_DOT[p.category]}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-medium">{p.name}</span>
                <span className="num block truncate text-[12.5px] text-muted">
                  t½ {halfLifeLabel(p.halfLifeH)} · {p.range[0]}–{p.range[1]} {p.unit}
                </span>
              </span>
              <span className="text-[18px] text-muted">›</span>
            </Link>
          </li>
        ))}
        {list.length === 0 ? <li className="px-4 py-5 text-center text-[13.5px] text-muted">Nothing matches that.</li> : null}
      </ul>

      <p className="mt-4 px-1 text-[12px] text-muted">
        Published reference values for tracking. Not a dosing recommendation.
      </p>
    </div>
  );
}