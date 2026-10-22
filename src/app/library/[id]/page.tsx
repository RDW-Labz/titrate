"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, LinkBtn, PageTitle, Pill, SectionHead, Stat } from "@/components/ui";
import { CATEGORY_LABEL, PEPTIDE_BY_ID, halfLifeLabel } from "@/lib/peptides";

export default function PeptidePage() {
  const { id } = useParams<{ id: string }>();
  const p = PEPTIDE_BY_ID.get(id);

  if (!p) {
    return (
      <div className="pt-6">
        <PageTitle>Not in the library</PageTitle>
        <Link href="/library" className="text-[13px] text-accent">
          ← Back to library
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/library" className="press inline-block py-1.5 text-[12.5px] text-accent">
        ← Library
      </Link>
      <PageTitle meta={p.aka ?? CATEGORY_LABEL[p.category]}>{p.name}</PageTitle>

      <Card className="p-4">
        <div className="flex flex-wrap gap-1.5">
          <Pill tone="accent">{CATEGORY_LABEL[p.category]}</Pill>
          <Pill tone="neutral">{p.route === "pen" ? "pen" : p.route === "oral" ? "oral" : "subcutaneous"}</Pill>
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed">{p.blurb}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
          <Stat label="Half-life" value={halfLifeLabel(p.halfLifeH)} />
          <Stat label="Peak" value={halfLifeLabel(p.tmaxH)} sub="after a dose" />
          <Stat label="Common dose" value={`${p.range[0]}–${p.range[1]}`} sub={p.unit} />
        </div>
      </Card>

      <SectionHead>Protocol convention</SectionHead>
      <Card className="divide-y divide-line">
        <Row label="Frequency" value={p.frequency} />
        {p.cycle ? <Row label="Cycle" value={p.cycle} /> : null}
        <Row label="Range" value={`${p.range[0]}–${p.range[1]} ${p.unit} per dose`} />
      </Card>

      {p.note ? (
        <>
          <SectionHead>Worth knowing</SectionHead>
          <Card className="p-4">
            <p className="text-[13px] leading-relaxed text-muted">{p.note}</p>
          </Card>
        </>
      ) : null}

      <div className="mt-4">
        <LinkBtn href={`/protocols/new?p=${p.id}`} variant="primary" className="w-full">
          Start tracking {p.name}
        </LinkBtn>
      </div>
      <p className="mt-3 px-1 text-[11.5px] leading-relaxed text-muted">
        Educational reference only. Ranges come from published research and community protocols; they are not a
        prescription and this app will not recommend a dose.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-2.5">
      <span className="text-[12.5px] text-muted">{label}</span>
      <span className="text-right text-[13px]">{value}</span>
    </div>
  );
}