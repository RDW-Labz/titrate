"use client";

import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

/**
 * OpenUI card set for the assistant surface. Fixed tracker screens stay hand-built;
 * these three only render model-written summaries and plans.
 */
const frame = "rounded-xl border border-line bg-card px-4 py-3";

export const DoseBrief = defineComponent({
  name: "DoseBrief",
  description: "Short summary of what is due today: a heading, one line per dose, an optional footnote",
  props: z.object({
    title: z.string(),
    lines: z.array(z.string()),
    note: z.string().optional(),
  }),
  component: ({ props }) => (
    <div className={frame}>
      <p className="text-[12.5px] font-semibold">{props.title}</p>
      <ul className="mt-2 space-y-1">
        {props.lines.map((line) => (
          <li key={line} className="text-[13.5px] leading-snug">
            {line}
          </li>
        ))}
      </ul>
      {props.note ? <p className="mt-2 border-t border-line pt-2 text-[11.5px] text-muted">{props.note}</p> : null}
    </div>
  ),
});

export const LevelSnapshot = defineComponent({
  name: "LevelSnapshot",
  description: "Estimated level of one compound right now, as a percentage of a single dose peak",
  props: z.object({
    compound: z.string(),
    percent: z.number(),
    shape: z.string(),
    insight: z.string(),
  }),
  component: ({ props }) => (
    <div className={frame}>
      <div className="flex items-baseline justify-between">
        <p className="text-[13.5px] font-medium">{props.compound}</p>
        <p className="num text-[13px] text-muted">{props.shape}</p>
      </div>
      <p className="num mt-1 text-[30px] leading-none font-medium">{Math.round(props.percent)}%</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-accent" style={{ width: `${Math.min(100, Math.max(2, props.percent))}%` }} />
      </div>
      <p className="mt-2 text-[12px] text-muted">{props.insight}</p>
    </div>
  ),
});

export const ReconPlan = defineComponent({
  name: "ReconPlan",
  description: "A reconstitution plan: how much water, how many syringe units per dose, how many doses the vial holds",
  props: z.object({
    vial: z.string(),
    steps: z.array(z.string()),
    units: z.string(),
    doses: z.string(),
  }),
  component: ({ props }) => (
    <div className={frame}>
      <p className="num text-[12.5px] font-semibold">Reconstitution · {props.vial}</p>
      <ol className="mt-2 space-y-1">
        {props.steps.map((step, i) => (
          <li key={step} className="flex gap-2 text-[13px] leading-snug">
            <span className="num text-muted">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ol>
      <div className="mt-2 flex items-baseline gap-4 border-t border-line pt-2">
        <span className="num text-[15px] font-medium">{props.units}</span>
        <span className="num text-[12px] text-muted">{props.doses}</span>
      </div>
    </div>
  ),
});

export const library = createLibrary({
  root: "DoseBrief",
  components: [DoseBrief, LevelSnapshot, ReconPlan],
});

export const SAMPLES = [
  {
    label: "Today",
    lang: `root = DoseBrief("Due today", ["Tirzepatide 5 mg — due now", "BPC-157 250 mcg — 10 units, left abdomen", "Ipamorelin 200 mcg — next at 9 pm"], "Three compounds active, 27 days into the BPC cycle.")`,
  },
  {
    label: "Level",
    lang: `root = LevelSnapshot("Tirzepatide", 118, "near peak", "Day 3 after a 5 mg shot. Half-life is 5 days, so the trough before your next dose is around 60%.")`,
  },
  {
    label: "Mix a vial",
    lang: `root = ReconPlan("BPC-157 5 mg", ["Draw 2 mL bacteriostatic water", "Swirl, never shake, until clear", "Store at 2-8 C, use within 4 weeks"], "10 units", "20 doses at 250 mcg")`,
  },
];
