"use client";

import { createContext, useContext } from "react";
import { z } from "zod";
import { defineComponent, createLibrary } from "@openuidev/react-lang";

/**
 * The three cards a typed line can produce. Everything on them comes from app state —
 * the Lang only carries the words the person typed.
 */
type Handlers = { accept?: () => void; undo?: () => void };

const Ctx = createContext<Handlers>({});
export const CardActions = Ctx.Provider;
const useActions = () => useContext(Ctx);

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="num rounded-full bg-paper px-2 py-0.5 text-[11.5px] text-muted">{children}</span>
);

export const LogCard = defineComponent({
  name: "LogCard",
  description: "Confirm a dose the person described in words",
  props: z.object({
    peptide: z.string(),
    dose: z.number(),
    unit: z.string(),
    when: z.string(),
    site: z.string(),
  }),
  component: ({ props }) => {
    const { accept } = useActions();
    return (
      <div className="rounded-[22px] bg-card px-4 py-4 shadow-card">
        <p className="text-[11.5px] font-medium tracking-wide text-muted uppercase">Log this</p>
        <p className="mt-1 text-[19px] font-semibold">
          {props.peptide} <span className="num">{props.dose}</span> {props.unit}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Chip>{props.when}</Chip>
          <Chip>{props.site}</Chip>
        </div>
        <button
          onClick={() => accept?.()}
          className="press mt-3 w-full rounded-xl bg-accent py-2.5 text-[14px] font-semibold text-white"
        >
          Log it
        </button>
      </div>
    );
  },
});

export const LevelCard = defineComponent({
  name: "LevelCard",
  description: "Where a compound's estimated level stands right now",
  props: z.object({
    peptide: z.string(),
    percent: z.number(),
    word: z.string(),
    nextIn: z.string(),
  }),
  component: ({ props }) => (
    <div className="rounded-[22px] bg-hero px-4 py-4 text-white shadow-card">
      <p className="text-[11.5px] font-medium tracking-wide text-white/65 uppercase">{props.peptide}</p>
      <p className="num mt-1 text-[34px] leading-none font-semibold">{props.percent}%</p>
      <p className="mt-1 text-[13px] text-white/75">
        {props.word} · {props.nextIn}
      </p>
    </div>
  ),
});

export const ReconCard = defineComponent({
  name: "ReconCard",
  description: "Units to draw for a mix the person described",
  props: z.object({
    vialMg: z.number(),
    waterMl: z.number(),
    dose: z.number(),
    units: z.string(),
  }),
  component: ({ props }) => (
    <div className="rounded-[22px] bg-card px-4 py-4 shadow-card">
      <p className="text-[11.5px] font-medium tracking-wide text-muted uppercase">Mix</p>
      <p className="mt-1 text-[15px] font-medium">
        {props.vialMg} mg in {props.waterMl} mL
      </p>
      <p className="num mt-2 text-[30px] leading-none font-semibold">
        {props.units} <span className="text-[13px] font-medium text-muted">units</span>
      </p>
      <p className="mt-1 text-[12.5px] text-muted">for a {props.dose} mcg dose</p>
    </div>
  ),
});

export const library = createLibrary({
  root: "LogCard",
  components: [LogCard, LevelCard, ReconCard],
});
