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

/** the barrel, drawn to scale: ticks every 10 units, fill to the drawn amount */
function SyringeBar({ units, maxUnits, over }: { units: number; maxUnits: number; over: boolean }) {
  const pct = Math.max(0, Math.min(1, units / maxUnits));
  const ticks = Array.from({ length: 11 }, (_, i) => i / 10);

  return (
    <div className="mt-3">
      <div className="relative h-10">
        {ticks.map((t, i) => (
          <span
            key={t}
            className="absolute top-0 h-2 w-px bg-line"
            style={{ left: `${t * 100}%`, height: i % 5 === 0 ? 10 : 6, opacity: i % 5 === 0 ? 0.9 : 0.55 }}
          />
        ))}
        <div className="absolute top-3 right-0 left-0 h-7 overflow-hidden rounded-full bg-line/70">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${over ? "bg-alert/70" : "bg-accent/80"}`}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-0 w-0.5 -translate-x-1/2 rounded-full bg-ink"
          style={{ left: `${pct * 100}%` }}
        />
      </div>
      <div className="num mt-1 flex justify-between text-[10px] text-muted">
        <span>0</span>
        <span>{Math.round(maxUnits / 2)}</span>
        <span>{maxUnits} u</span>
      </div>
    </div>
  );
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
      // the calculator still works in memory if storage is blocked
    }
  }, [vialMg, waterMl, dose, syringeId]);

  const syringe = SYRINGES.find((s) => s.id === syringeId) ?? SYRINGES[2];
  const result = reconstitute({
    vialMg: Number(vialMg),
    waterMl: Number(waterMl),
    doseMcg: Number(dose),
    unitsPerMl: syringe.unitsPerMl,
  });
  const over = result ? result.units > syringe.maxUnits : false;

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

      <div className={`mt-3 rounded-[20px] px-4 py-4 ${over ? "bg-alert-soft" : "bg-paper"}`} aria-live="polite">
        {result ? (
          <>
            <p className="text-[12px] font-medium text-muted">Draw to</p>
            <p className="num mt-0.5 text-[42px] leading-none font-semibold">
              {formatUnits(result.units)}
              <span className="ml-2 text-[15px] font-medium text-muted">units</span>
            </p>

            <SyringeBar units={result.units} maxUnits={syringe.maxUnits} over={over} />

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3">
              <Stat label="Doses" value={Math.floor(result.dosesPerVial)} sub="per vial" />
              <Stat label="Per mL" value={Math.round(result.concentrationMcgPerMl).toLocaleString()} sub="mcg" />
              <Stat label="Volume" value={result.doseMl.toFixed(3)} sub="mL" />
            </div>

            {over ? (
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
