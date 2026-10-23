"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Renderer } from "@openuidev/react-lang";
import { CardActions, library } from "@/lib/cards";
import { toast } from "@/components/toast";
import { PageTitle } from "@/components/ui";
import { parseLine, toLang, type Line } from "@/lib/intent";
import { levelNow, levelWord } from "@/lib/levels";
import { humanIn, nextDue } from "@/lib/schedule";
import { actions, useStore } from "@/lib/store";

const SAMPLES = ["250 mcg BPC this morning, left thigh", "how much tirz is in me", "5 mg in 2 ml for 250 mcg"];

export default function AssistantPage() {
  const { compounds, doses } = useStore();
  const [text, setText] = useState("");
  const [lang, setLang] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Line | null>(null);
  const [blank, setBlank] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const now = new Date();

  function run(input: string) {
    const line = parseLine(input, compounds, now);
    setParsed(line);
    setBlank(false);
    if (!line) {
      setLang(null);
      return;
    }

    const extra =
      line.kind === "level"
        ? (() => {
            const c = compounds.find((x) => x.id === line.compoundId);
            if (!c) return { percent: 0, word: "no data", nextIn: "not tracking it" };
            const pct = levelNow(doses, c, now);
            const next = nextDue(c, doses, now);
            return { percent: pct, word: levelWord(pct), nextIn: next ? `next ${humanIn(next, now)}` : "nothing scheduled" };
          })()
        : line.kind === "recon"
          ? (() => {
              const concentration = (line.vialMg * 1000) / line.waterMl;
              const units = (line.dose / concentration) * 100;
              return { units: String(Math.round(units * 2) / 2) };
            })()
          : undefined;

    setLang(toLang(line, extra));
    // the Renderer drops unknown Lang silently — check for children and say so instead
    setTimeout(() => setBlank((hostRef.current?.childElementCount ?? 0) === 0), 350);
  }

  const accept = () => {
    if (!parsed || parsed.kind !== "log" || !parsed.compoundId) return;
    actions.logDose({
      compoundId: parsed.compoundId,
      dose: parsed.dose,
      unit: parsed.unit,
      at: parsed.at,
      site: parsed.site.includes("usual") ? undefined : parsed.site,
    });
    toast(`Logged ${parsed.peptide} ${parsed.dose} ${parsed.unit}`);
    setText("");
    setLang(null);
    setParsed(null);
  };

  return (
    <div className="pt-3">
      <Link href="/" className="press -my-1 inline-block py-1.5 text-[14px] font-medium text-accent">
        ‹ Today
      </Link>
      <PageTitle meta="Say it in a line — the card is built from your own protocol.">Type it</PageTitle>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(text);
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="250 mcg BPC this morning"
          aria-label="Describe a dose or ask a question"
          className="plaininput"
          autoFocus
        />
      </form>

      <div className="mt-2 flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setText(s);
              run(s);
            }}
            className="press rounded-full bg-card px-3 py-1.5 text-[12.5px] text-muted shadow-card"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-4" ref={hostRef} aria-live="polite">
        <CardActions value={{ accept }}>
          {lang ? <Renderer library={library} response={lang} isStreaming={false} /> : null}
        </CardActions>
      </div>

      {blank ? (
        <p className="mt-3 rounded-[18px] bg-card px-4 py-3 text-[13px] text-muted shadow-card">
          I couldn&apos;t draw that card. Try naming the peptide and the dose, like “250 mcg BPC this morning”.
        </p>
      ) : null}

      {text.length > 2 && !lang && !blank ? (
        <p className="mt-3 px-1 text-[13px] text-muted">
          Not sure what that means yet — name the peptide and the dose, or ask “how much is in me”.
        </p>
      ) : null}

      {lang ? (
        <details className="mt-4 px-1">
          <summary className="cursor-pointer text-[12px] text-muted">the card, as OpenUI Lang</summary>
          <pre className="mt-1 overflow-x-auto rounded-xl bg-card px-3 py-2 text-[11px] text-ink shadow-card">{lang}</pre>
        </details>
      ) : null}
    </div>
  );
}
