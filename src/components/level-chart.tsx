"use client";

import { useId } from "react";

/**
 * Level curve with a gradient fill, faint gridlines, a tick per logged dose and
 * a "now" marker. Values are % of one dose peak; markers are 0-1 x positions.
 */
export function LevelChart({
  values,
  height = 120,
  markers = [],
  nowAt,
  label,
}: {
  values: number[];
  height?: number;
  markers?: number[];
  nowAt?: number;
  label?: string;
}) {
  const id = useId().replace(/[:]/g, "");
  const w = 320;
  const padTop = 10;
  const padBottom = 12;
  const max = Math.max(100, ...values) * 1.05;

  const pt = (v: number, i: number) => {
    const x = (i / Math.max(1, values.length - 1)) * w;
    const y = height - padBottom - (v / max) * (height - padTop - padBottom);
    return [x, y] as const;
  };

  const pts = values.map(pt);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${height - padBottom} L0,${height - padBottom} Z`;
  const last = pts[pts.length - 1];
  const peak = Math.max(...values);
  const peakIdx = values.indexOf(peak);

  return (
    <div>
      {label ? <div className="mb-1 text-[12px] text-muted">{label}</div> : null}
      <svg
        viewBox={`0 0 ${w} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Level curve, now ${Math.round(values[values.length - 1] ?? 0)} percent of a dose peak`}
      >
        <defs>
          <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5ec8a8" stopOpacity="0.34" />
            <stop offset="70%" stopColor="#5ec8a8" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#5ec8a8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`line-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2fa98a" />
            <stop offset="100%" stopColor="#0e7c66" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((f) => {
          const y = height - padBottom - ((max * f) / max) * (height - padTop - padBottom);
          return (
            <line
              key={f}
              x1="0"
              x2={w}
              y1={y}
              y2={y}
              stroke="var(--color-line)"
              strokeWidth="1"
              strokeDasharray={f === 1 ? "0" : "3 5"}
              opacity={f === 1 ? 0.9 : 0.55}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        <path d={area} fill={`url(#area-${id})`} />

        {markers.map((m, i) => (
          <line
            key={i}
            x1={m * w}
            x2={m * w}
            y1={height - padBottom}
            y2={height - padBottom - 7}
            stroke="var(--color-accent)"
            strokeWidth="1.5"
            opacity="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path
          d={line}
          pathLength={1}
          className="chart-line"
          fill="none"
          stroke={`url(#line-${id})`}
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {nowAt !== undefined ? (
          <line
            x1={nowAt * w}
            x2={nowAt * w}
            y1={padTop - 4}
            y2={height - padBottom}
            stroke="var(--color-ink)"
            strokeWidth="1"
            strokeDasharray="2 4"
            opacity="0.28"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}

        {peakIdx >= 0 ? <circle cx={pts[peakIdx][0]} cy={pts[peakIdx][1]} r="2" fill="#2fa98a" opacity="0.45" /> : null}
        {last ? <circle cx={last[0]} cy={last[1]} r="4" fill="var(--color-accent)" /> : null}
        {last ? <circle cx={last[0]} cy={last[1]} r="7.5" fill="var(--color-accent)" opacity="0.16" /> : null}
      </svg>
      <div className="num flex justify-between px-0.5 text-[10.5px] text-muted">
        <span>peak {Math.round(peak)}%</span>
        <span>now {Math.round(values[values.length - 1] ?? 0)}%</span>
      </div>
    </div>
  );
}
