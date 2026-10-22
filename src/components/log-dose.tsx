"use client";

import { useState } from "react";
import { Burst, Btn } from "./ui";
import { toast } from "./toast";
import { actions, useStore } from "@/lib/store";
import { toMcg, unitsForDose } from "@/lib/recon";
import type { Compound } from "@/lib/types";

function useLog(compound: Compound, onLogged?: () => void) {
  const { vials } = useStore();
  const [done, setDone] = useState(false);
  const vial = vials.find((v) => v.id === compound.vialId);

  const log = () => {
    const units = vial ? unitsForDose(vial, toMcg(compound.dose, compound.unit)) : null;
    const entry = actions.logDose({
      compoundId: compound.id,
      dose: compound.dose,
      unit: compound.unit,
      units: units ?? undefined,
    });
    setDone(true);
    onLogged?.();
    toast(`Logged ${compound.name}`, { label: "Undo", run: () => actions.deleteDose(entry.id) });
    setTimeout(() => setDone(false), 1900);
  };

  return { done, log };
}

export function LogDoseButton({
  compound,
  size = "lg",
  variant = "primary",
  className = "",
  onLogged,
}: {
  compound: Compound;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "quiet" | "line" | "white";
  className?: string;
  onLogged?: () => void;
}) {
  const { done, log } = useLog(compound, onLogged);
  return (
    <Btn size={size} variant={done ? "quiet" : variant} className={`relative overflow-visible ${className}`} onClick={log}>
      <Burst show={done} />
      <span className={done ? "pop" : ""}>{done ? "Logged" : "Log it"}</span>
    </Btn>
  );
}

/** round one-tap check used in lists */
export function LogDot({ compound, onLogged }: { compound: Compound; onLogged?: () => void }) {
  const { done, log } = useLog(compound, onLogged);
  return (
    <button
      onClick={log}
      aria-label={`Log ${compound.name} ${compound.dose} ${compound.unit}`}
      className={`press relative grid size-11 shrink-0 place-items-center rounded-full border text-[15px] font-semibold ${
        done ? "border-accent bg-accent text-white" : "border-line bg-card text-muted"
      }`}
    >
      <Burst show={done} />
      <span className={done ? "pop" : ""}>{done ? "✓" : "○"}</span>
    </button>
  );
}

/** everything due today, in one tap */
export function LogAllButton({ compounds }: { compounds: Compound[] }) {
  const { vials } = useStore();
  const [done, setDone] = useState(false);

  return (
    <Btn
      variant="quiet"
      className="relative w-full"
      onClick={() => {
        const ids = compounds.map((c) => {
          const vial = vials.find((v) => v.id === c.vialId);
          const units = vial ? unitsForDose(vial, toMcg(c.dose, c.unit)) : null;
          return actions.logDose({ compoundId: c.id, dose: c.dose, unit: c.unit, units: units ?? undefined }).id;
        });
        setDone(true);
        toast(`Logged ${compounds.length} doses`, { label: "Undo", run: () => ids.forEach(actions.deleteDose) });
        setTimeout(() => setDone(false), 1900);
      }}
    >
      <Burst show={done} />
      <span className={done ? "pop" : ""}>{done ? "All done" : `Log all ${compounds.length} due`}</span>
    </Btn>
  );
}
