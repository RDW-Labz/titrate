"use client";

import { useState } from "react";
import { Burst, Btn } from "./ui";
import { toast } from "./toast";
import { actions, useStore } from "@/lib/store";
import { toMcg, unitsForDose } from "@/lib/recon";
import { doseOn } from "@/lib/titration";
import { SITES, dayKey, daysBetween, suggestSite } from "@/lib/schedule";
import { SitePicker } from "./site-picker";
import type { Compound } from "@/lib/types";

function useLog(compound: Compound, onLogged?: () => void) {
  const { vials, doses } = useStore();
  const [flash, setFlash] = useState(false);
  const [site, setSite] = useState(() => suggestSite(doses));
  const [picker, setPicker] = useState(false);
  const lastUsed = SITES.reduce<Record<string, number>>((acc, name) => {
    const hits = doses.filter((d) => d.site === name && !d.skipped);
    if (hits.length) {
      const latest = Math.max(...hits.map((d) => +new Date(d.at)));
      acc[name] = daysBetween(new Date(latest), new Date());
    }
    return acc;
  }, {});
  const vial = vials.find((v) => v.id === compound.vialId);

  const today = dayKey(new Date());
  const mine = doses.filter((d) => d.compoundId === compound.id && dayKey(new Date(d.at)) === today);
  const taken = mine.filter((d) => !d.skipped).sort((a, b) => +new Date(b.at) - +new Date(a.at));
  const lastTime = taken[0]
    ? new Date(taken[0].at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : null;
  const skipped = mine.some((d) => d.skipped);

  const log = () => {
    const dose = doseOn(compound);
    const units = vial ? unitsForDose(vial, toMcg(dose, compound.unit)) : null;
    const entry = actions.logDose({ compoundId: compound.id, dose, unit: compound.unit, units: units ?? undefined, site });
    setFlash(true);
    onLogged?.();
    toast(`Logged ${compound.name}`, { label: "Undo", run: () => actions.deleteDose(entry.id) });
    setTimeout(() => setFlash(false), 1200);
  };

  const skip = () => {
    const entry = actions.skipDose(compound.id, doseOn(compound), compound.unit);
    onLogged?.();
    toast(`Skipped ${compound.name} today`, { label: "Undo", run: () => actions.deleteDose(entry.id) });
  };

  return { flash, log, skip, lastTime, skipped, site, setSite, picker, setPicker, lastUsed };
}

export function LogDoseButton({
  compound,
  size = "lg",
  variant = "primary",
  className = "",
  onLogged,
  tone = "light",
}: {
  compound: Compound;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "quiet" | "line" | "white";
  className?: string;
  onLogged?: () => void;
  tone?: "light" | "dark";
}) {
  const { flash, log, skip, lastTime, skipped, site, setSite, picker, setPicker, lastUsed } = useLog(compound, onLogged);

  if (lastTime) {
    return (
      <div className={className}>
        <div
          aria-live="polite"
          className={`flex items-center justify-center gap-2 rounded-2xl font-semibold ${
            size === "lg" ? "px-5 py-4 text-[17px]" : "px-4 py-3 text-[15px]"
          } ${tone === "dark" ? "bg-white/12 text-white/75" : "bg-accent-soft text-accent"}`}
        >
          <span className={`text-[15px] ${flash ? "pop" : ""}`}>✓</span>
          Done for today
          <span className="num text-[13px] font-normal opacity-70">· {lastTime}</span>
        </div>
        <button
          onClick={log}
          className={`press mt-1.5 w-full text-center text-[12px] underline underline-offset-2 ${
            tone === "dark" ? "text-white/65" : "text-muted"
          }`}
        >
          Add another dose
        </button>
      </div>
    );
  }

  if (skipped) {
    return (
      <div className={className}>
        <div
          className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[16px] font-semibold ${
            tone === "dark" ? "bg-white/10 text-white/70" : "bg-paper text-muted"
          }`}
        >
          Skipped today
        </div>
        <div className={`mt-1.5 flex justify-center gap-4 text-[12px] ${tone === "dark" ? "text-white/65" : "text-muted"}`}>
          <button onClick={log} className="press underline underline-offset-2">
            Log it anyway
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Btn size={size} variant={variant} className="relative w-full overflow-visible" onClick={log}>
        <Burst show={flash} />
        <span className={flash ? "pop" : ""}>Log it</span>
      </Btn>
      <SitePicker
        open={picker}
        value={site}
        lastUsed={lastUsed}
        onClose={() => setPicker(false)}
        onPick={setSite}
      />
      <div className={`mt-1.5 flex items-center justify-between text-[12px] ${tone === "dark" ? "text-white/65" : "text-muted"}`}>
        <button onClick={() => setPicker(true)} className="press underline underline-offset-2">
          Site: {site.toLowerCase()}
        </button>
        <button onClick={skip} className="press underline underline-offset-2">
          Skip today
        </button>
      </div>
    </div>
  );
}

/** round one-tap check used in lists */
export function LogDot({ compound, onLogged }: { compound: Compound; onLogged?: () => void }) {
  const { flash, log, lastTime, skipped } = useLog(compound, onLogged);

  if (lastTime) {
    return (
      <span
        aria-label={`${compound.name} logged at ${lastTime}`}
        className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-[15px] font-semibold text-accent"
      >
        ✓
      </span>
    );
  }

  if (skipped) {
    return (
      <span
        aria-label={`${compound.name} skipped today`}
        className="grid size-11 shrink-0 place-items-center rounded-full bg-paper text-[15px] text-muted"
      >
        –
      </span>
    );
  }

  return (
    <button
      onClick={log}
      aria-label={`Log ${compound.name} ${doseOn(compound)} ${compound.unit}`}
      className="press relative grid size-11 shrink-0 place-items-center rounded-full border border-line bg-card text-[15px] font-semibold text-muted"
    >
      <Burst show={flash} />
      <span className={flash ? "pop" : ""}>○</span>
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
      disabled={done}
      onClick={() => {
        const ids = compounds.map((c) => {
          const dose = doseOn(c);
          const vial = vials.find((v) => v.id === c.vialId);
          const units = vial ? unitsForDose(vial, toMcg(dose, c.unit)) : null;
          return actions.logDose({ compoundId: c.id, dose, unit: c.unit, units: units ?? undefined }).id;
        });
        setDone(true);
        toast(`Logged ${compounds.length} doses`, { label: "Undo", run: () => ids.forEach(actions.deleteDose) });
      }}
    >
      <Burst show={done} />
      <span className={done ? "pop" : ""}>{done ? "All done" : `Log all ${compounds.length} due`}</span>
    </Btn>
  );
}
