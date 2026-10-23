"use client";

import { useState } from "react";
import { useDialog, usePresence } from "@/components/ui";

type Pt = { name: string; x: number; y: number };

const FRONT: Pt[] = [
  { name: "Left deltoid", x: 30, y: 66 },
  { name: "Right deltoid", x: 90, y: 66 },
  { name: "Left abdomen", x: 50, y: 104 },
  { name: "Right abdomen", x: 70, y: 104 },
  { name: "Left thigh", x: 48, y: 158 },
  { name: "Right thigh", x: 72, y: 158 },
];

const BACK: Pt[] = [
  { name: "Left deltoid", x: 30, y: 66 },
  { name: "Right deltoid", x: 90, y: 66 },
  { name: "Left glute", x: 50, y: 122 },
  { name: "Right glute", x: 70, y: 122 },
];

function Body({ side }: { side: "front" | "back" }) {
  return (
    <svg viewBox="0 0 120 190" width="150" height="238" aria-hidden="true" className="text-line">
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="60" cy="22" r="12" />
        <path d="M48 38c-6 2-10 6-11 12l-4 20 6 2 5-14" />
        <path d="M72 38c6 2 10 6 11 12l4 20-6 2-5-14" />
        <path d="M46 40h28l3 34-3 30H46l-3-30z" />
        <path d="M50 104v34l-3 44h9l4-40" />
        <path d="M70 104v34l3 44h-9l-4-40" />
      </g>
      {side === "back" ? (
        <path d="M50 110q10 8 20 0" stroke="currentColor" strokeWidth="1.4" fill="none" opacity="0.6" />
      ) : null}
    </svg>
  );
}

export function SitePicker({
  open,
  value,
  lastUsed,
  onClose,
  onPick,
}: {
  open: boolean;
  value: string;
  lastUsed?: Record<string, number>;
  onClose: () => void;
  onPick: (site: string) => void;
}) {
  const [side, setSide] = useState<"front" | "back">("front");
  const panel = useDialog(open, onClose);
  const { shown, leaving } = usePresence(open);

  if (!shown) return null;
  const pts = side === "front" ? FRONT : BACK;

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Choose an injection site"
    >
      <button
        className={`absolute inset-0 bg-ink/45 backdrop-blur-[2px] ${leaving ? "veil-out" : "veil-in"}`}
        onClick={onClose}
        aria-label="Close"
        tabIndex={-1}
      />
      <div
        ref={panel}
        tabIndex={-1}
        className={`${leaving ? "sheet-out" : "sheet-in"} relative w-full max-w-[460px] rounded-t-[28px] bg-card px-5 pt-3 pb-[max(18px,env(safe-area-inset-bottom))] outline-none`}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <div className="flex items-center justify-between">
          <p className="text-[16px] font-semibold">Injection site</p>
          <div className="flex rounded-full bg-paper p-0.5">
            {(["front", "back"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                aria-pressed={side === s}
                className={`press rounded-full px-3 py-1 text-[12.5px] font-semibold capitalize ${
                  side === s ? "bg-card text-ink shadow-card" : "text-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center">
          <div className="relative">
            <Body side={side} />
            {pts.map((p) => {
              const active = value === p.name;
              return (
                <button
                  key={p.name}
                  onClick={() => {
                    onPick(p.name);
                    onClose();
                  }}
                  aria-label={p.name}
                  title={p.name}
                  className={`press absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
                    active ? "border-white bg-accent" : "border-white/70 bg-accent/45"
                  }`}
                  style={{ left: `${(p.x / 120) * 100}%`, top: `${(p.y / 190) * 100}%` }}
                />
              );
            })}
          </div>
        </div>

        <p className="mt-2 text-center text-[12.5px] text-muted">
          {value}
          {lastUsed?.[value] !== undefined ? ` · last used ${lastUsed[value]}d ago` : " · not used yet"}
        </p>
      </div>
    </div>
  );
}
