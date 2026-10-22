"use client";

import { useState } from "react";
import { Btn, Field, Pill, Stat } from "./ui";
import { SYRINGES, formatUnits, reconstitute } from "@/lib/recon";
import { actions, useStore } from "@/lib/store";
import type { Compound, Vial } from "@/lib/types";

export function ReconCalculator({
  saveFor,
  initial,
}: {
  saveFor?: Compound;
  initial?: Partial<Vial>;
}) {
  const [vialMg, setVialMg] = useState(String(initial?.totalMg ?? 5));
  const [waterMl, setWaterMl] = useState(String(initial?.waterMl ?? 2));
  const [dose, setDose] = useState(String(saveFor?.dose ?? 250));
  const [syringeId, setSyringeId] = useState("u100-10");
  const [saved, setSaved] = useState(false);
  const { compounds } = useStore();

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
        <Field label="Vial size (mg)">
          <input inputMode="decimal" value={vialMg} onChange={(e) => setVialMg(e.target.value)} />
        </Field>
        <Field label="Bacteriostatic water (mL)">
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
        className={`mt-3 rounded-xl border px-4 py-3.5 ${tooBig ? "border-alert bg-alert-soft" : "border-line bg-paper"}`}
        aria-live="polite"
      >
        {result ? (
          <>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11.5px] text-muted">Draw to</p>
                <p className="num text-[34px] leading-none font-medium">{formatUnits(result.units)}</p>
                <p className="text-[12px] text-muted">units ({syringe.unitsPerMl === 100 ? "U-100" : "U-40"} syringe)</p>
              </div>
              <div className="text-right">
                <p className="num text-[15px]">{result.doseMl.toFixed(3)} mL</p>
                <p className="num text-[12px] text-muted">{(result.concentrationMcgPerMl / 1000).toFixed(2)} mg/mL</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
              <Stat label="Doses per vial" value={Math.floor(result.dosesPerVial)} />
              <Stat label="Concentration" value={`${Math.round(result.concentrationMcgPerMl)}`} sub="mcg/mL" />
              <Stat label="Vial volume" value={`${Number(waterMl).toFixed(1)}`} sub="mL" />
            </div>
            {tooBig ? (
              <p className="mt-2 text-[12px] text-alert">
                That dose needs more than this syringe holds. Add water, or use a bigger barrel.
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-[13px] text-muted">Enter a vial size, water volume and dose.</p>
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
            {saved ? "Saved to this protocol" : "Save this vial to the protocol"}
          </Btn>
          <p className="mt-2 text-[11.5px] text-muted">
            Every dose you log after this counts down the vial: {result ? Math.floor(result.dosesPerVial) : 0} doses in it.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-[11.5px] text-muted">
          Math is mg ÷ mL → mcg/mL, then dose ÷ concentration → syringe units.
          {compounds.length > 0 ? " Save a vial from a protocol to make it count down automatically." : ""}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <Pill tone="neutral">Reconstitute with the vial upright</Pill>
        <Pill tone="neutral">Never shake — swirl</Pill>
      </div>
    </div>
  );
}
