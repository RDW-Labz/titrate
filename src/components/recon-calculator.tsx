"use client";

import { useEffect, useState } from "react";
import { Btn, Field, Stat } from "./ui";
import { SYRINGES, formatUnits, reconstitute } from "@/lib/recon";
import { actions } from "@/lib/store";
import type { Compound, Vial } from "@/lib/types";

const LAST = "titrate.calc";

type LastCalc = { vialMg: string; waterMl: string; dose: string; syringeId: string };

function lastCalc(): LastCalc | null {
  try {
    return JSON.parse(localStorage.getItem(LAST) ?? "null") as LastCalc | null;
  } catch {
    return null;
  }
}

export function ReconCalculator({ saveFor, initial }: { saveFor?: Compound; initial?: Partial<Vial> }) {
  // standalone use remembers the last mix; a protocol's own vial always wins
  const [seed] = useState<LastCalc | null>(() => (initial || saveFor ? null : lastCalc()));
  const [vialMg, setVialMg] = useState(String(initial?.totalMg ?? seed?.vialMg ?? 5));
  const [waterMl, setWaterMl] = useState(String(initial?.waterMl ?? seed?.waterMl ?? 2));
  const [dose, setDose] = useState(String(saveFor?.dose ?? seed?.dose ?? 250));
  const [syringeId, setSyringeId] = useState(seed?.syringeId ?? "u100-10");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(LAST, JSON.stringify({ vialMg, waterMl, dose, syringeId }));
    } catch {
      // ignore storage failures — the calculator still works in memory
    }
  }, [vialMg, waterMl, dose, syringeId]);

  const syringe = SYRINGES.find((s) => s.id === syringeId) ?? SYRINGES[2];
  const result = reconstitute({
    vialMg: Number(vialMg),
    waterMl: Number(waterMl),
    doseMcg: Number(dose),
    unitsPerMl: syringe.unitsPerMl,
  });
  const tooBig = result ? result.units > syringe.maxUnits : false;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Vial (mg)">
          <input inputMode="decimal" value={vialMg} onChange={(e) => setVialMg(e.target.value)} />
        </Field>
        <Field label="Water (mL)">
          <input inputMode="decimal" value={waterMl} onChange={(e) => setWaterMl(e.target.value)} />
        </Field>
        <Field label="Dose (mcg)">
          <input inputMode="decimal" value={dose} onChange={(e) => setDose(e.target.value)} />
        </Field>
        <Field label="Syringe">
          <select value={syringeId} onChange={(e) => setSyringeId(e.target.value)}>
            {SYRINGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div
        className={`mt-3 rounded-[20px] px-4 py-4 ${tooBig ? "bg-alert-soft" : "bg-paper"}`}
        aria-live="polite"
      >
        {result ? (
          <>
            <p className="text-[12px] font-medium text-muted">Draw to</p>
            <p className="num mt-0.5 text-[42px] leading-none font-semibold">
              {formatUnits(result.units)}
              <span className="ml-2 text-[15px] font-medium text-muted">units</span>
            </p>
            <p className="mt-1.5 text-[12.5px] text-muted">{syringe.label}</p>

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3">
              <Stat label="Doses" value={Math.floor(result.dosesPerVial)} sub="per vial" />
              <Stat label="Per mL" value={Math.round(result.concentrationMcgPerMl).toLocaleString()} sub="mcg" />
              <Stat label="Volume" value={result.doseMl.toFixed(3)} sub="mL" />
            </div>

            {tooBig ? (
              <p className="mt-3 text-[12.5px] text-alert">
                More than this barrel holds — add water or pick a bigger syringe.
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-[13px] text-muted">Enter a vial size, water and dose.</p>
        )}
      </div>

      {saveFor ? (
        <div className="mt-3">
          <Btn
            className="w-full"
            disabled={!result}
            onClick={() => {
              const vial = actions.addVial({
                peptideId: saveFor.peptideId,
                totalMg: Number(vialMg),
                waterMl: Number(waterMl),
                mixedOn: new Date().toISOString().slice(0, 10),
                unitsPerMl: syringe.unitsPerMl as 100 | 40,
                label: `${vialMg} mg + ${waterMl} mL`,
              });
              actions.updateCompound(saveFor.id, { vialId: vial.id });
              setSaved(true);
            }}
          >
            {saved ? "Saved" : "Save this vial"}
          </Btn>
        </div>
      ) : (
        <p className="mt-2 px-1 text-[12px] text-muted">
          {result ? `${Math.floor(result.dosesPerVial)} doses in this vial.` : ""}
        </p>
      )}
    </div>
  );
}
