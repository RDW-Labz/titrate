"use client";

import { useState } from "react";
import { Btn } from "./ui";
import { actions, useStore } from "@/lib/store";
import { formatUnits, toMcg, unitsForDose } from "@/lib/recon";
import type { Compound } from "@/lib/types";

export function LogDoseButton({
  compound,
  size = "md",
  variant = "primary",
  className = "",
}: {
  compound: Compound;
  size?: "sm" | "md";
  variant?: "primary" | "quiet" | "line";
  className?: string;
}) {
  const { vials } = useStore();
  const [done, setDone] = useState(false);
  const vial = vials.find((v) => v.id === compound.vialId);
  const units = vial ? unitsForDose(vial, toMcg(compound.dose, compound.unit)) : null;

  return (
    <Btn
      size={size}
      variant={done ? "quiet" : variant}
      className={className}
      onClick={() => {
        actions.logDose({ compoundId: compound.id, dose: compound.dose, unit: compound.unit, units: units ?? undefined });
        setDone(true);
        setTimeout(() => setDone(false), 2500);
      }}
    >
      {done ? (
        "Logged"
      ) : (
        <>
          Log <span className="num">{compound.dose}</span> {compound.unit}
          {units ? <span className="num opacity-80">· {formatUnits(units)} u</span> : null}
        </>
      )}
    </Btn>
  );
}