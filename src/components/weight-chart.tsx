"use client";

import { useId } from "react";
import type { Progress } from "@/lib/progress";

const W = 280;
const H = 64;
const PAD = 8;

/** weight over the window, with a dashed line where the dose changed — so a plateau reads against the step */
export function WeightChart({ data, unit }: { data: Progress; unit: string }) {
  const id = useId().replace(/[:]/g, "");
  const span = Math.max(1, data.max - data.min);
  const y = (lb: number) => H - PAD - ((lb - data.min) / span) * (H - PAD * 2);
  const pts = data.points.map((p) => [p.x * W, y(p.lb)] as const);
  const line = pts.map(([x, yy], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${yy.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const doses = [...new Set(data.marks.map((m) => m.dose))];

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        role="img"
        aria-label={`Weight ${data.min} to ${data.max} lb, ${data.change > 0 ? "up" : "down"} ${Math.abs(data.change)} lb, ${data.marks.length} dose changes`}
      >
        <defs>
          <linearGradient id={`wg-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5ec8a8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#5ec8a8" stopOpacity="0" />
          </linearGradient>
        </defs>

        {data.marks.map((m) => (
          <line
            key={m.at + m.dose}
            x1={m.x * W}
            x2={m.x * W}
            y1={0}
            y2={H}
            stroke="var(--color-warn)"
            strokeWidth="1.4"
            strokeDasharray="3 3"
            opacity="0.7"
          />
        ))}

        <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#wg-${id})`} />
        <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last[0]} cy={last[1]} r="3.5" fill="var(--color-accent)" />
      </svg>

      <div className="num mt-1 flex justify-between text-[10.5px] text-muted">
        <span>{data.min} lb</span>
        <span>
          {doses.length ? `${doses.join(" → ")} ${unit} · dashed = dose change` : "no dose change in this window"}
        </span>
        <span>{data.max} lb</span>
      </div>
    </div>
  );
}
