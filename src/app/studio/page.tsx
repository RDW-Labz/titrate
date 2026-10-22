"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Renderer } from "@openuidev/react-lang";
import { library, SAMPLES } from "@/lib/openui-cards";
import { Btn, Card, PageTitle, Pill, SectionHead } from "@/components/ui";

export default function StudioPage() {
  const [lang, setLang] = useState(SAMPLES[0].lang);
  const [shown, setShown] = useState(SAMPLES[0].lang);
  const [empty, setEmpty] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Anything the library does not define is dropped silently, so check the box actually filled.
  useEffect(() => {
    const t = setTimeout(() => setEmpty((box.current?.childElementCount ?? 0) === 0), 300);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <div>
      <Link href="/" className="text-[12.5px] text-accent">
        ← Today
      </Link>
      <PageTitle meta="Paste or generate OpenUI Lang, see the card your components render.">Card studio</PageTitle>

      <div className="flex flex-wrap gap-1.5">
        {SAMPLES.map((s) => (
          <button
            key={s.label}
            onClick={() => {
              setLang(s.lang);
              setShown(s.lang);
            }}
            className="rounded-full border border-line bg-card px-2.5 py-1 text-[12px] font-medium text-muted hover:border-accent hover:text-accent"
          >
            {s.label}
          </button>
        ))}
      </div>

      <SectionHead right={<Pill tone="neutral">@openuidev/react-lang 1.0.1</Pill>}>Lang</SectionHead>
      <Card className="p-3">
        <textarea
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          rows={5}
          spellCheck={false}
          aria-label="OpenUI Lang"
          className="num w-full resize-y rounded-lg border border-line bg-paper p-2.5 text-[12.5px] leading-relaxed"
        />
        <Btn className="mt-2 w-full" onClick={() => setShown(lang)}>
          Render
        </Btn>
      </Card>

      <SectionHead>Card</SectionHead>
      <div ref={box} aria-live="polite">
        <Renderer library={library} response={shown} isStreaming={false} />
      </div>
      {empty ? (
        <div className="rounded-xl border border-alert bg-alert-soft px-4 py-3 text-[12.5px] text-alert">
          Nothing rendered. Every component in the Lang must exist in the library — check the name and the
          argument order.
        </div>
      ) : null}

      <SectionHead>Where this goes</SectionHead>
      <p className="px-1 text-[12.5px] leading-relaxed text-muted">
        These cards are the assistant surface, not the tracker. Dose logging, the calculator and the history
        lists stay hand-built on purpose — a model should never own the layout of a screen you depend on.
        Next step is a chat that streams this Lang behind a provider call, with the tracker data passed in as
        context.
      </p>
    </div>
  );
}
