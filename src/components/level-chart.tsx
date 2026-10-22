"use client";

import { useId } from "react";

/**
 * Level curve with gradient fill, faint gridlines, a tick per logged dose, a
 * dotted "now" line and a dashed projection of the next scheduled doses.
 */
export function LevelChart({
  values,
  height = 132,
  markers = [],
  futureMarkers = [],
  nowAt = 0.5,
  footer = true,
}: {
  values: number[];
  height?: number;
  markers?: number[];
  futureMarkers?: number[];
  nowAt?: number;
  footer?: boolean;
}) {
  const id = useId().replace(/[:]/g, "");
  const w = 320;
  const padTop = 12;
  const padBottom = 14;
  const max = Math.max(100, ...values) * 1.06;

  const pt = (v: number, i: number): readonly [number, number] => {
    const x = (i / Math.max(1, values.length - 1)) * w;
    const y = height - padBottom - (v / max) * (height - padTop - padBottom);
    return [x, y] as const;
  };

  const pts = values.map(pt);
  const split = Math.max(1, Math.min(values.length - 1, Math.round(nowAt * (values.length - 1))));

  const path = (from: number, to: number) =>
    pts
      .slice(from, to)
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ");

  const pastLine = path(0, split + 1);
  const futureLine = path(split, pts.length);
  const area = `${pastLine} L${pts[split][0].toFixed(1)},${height - padBottom} L0,${height - padBottom} Z`;
  const futureArea = `${futureLine} L${pts[pts.length - 1][0].toFixed(1)},${height - padBottom} L${pts[split][0].toFixed(1)},${height - padBottom} Z`;
  const last = pts[pts.length - 1];
  const nowPt = pts[split];
  const peak = Math.max(...values);

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Level curve, now ${Math.round(values[split] ?? 0)} percent of a dose peak, projecting forward`}
      >
        <defs>
          <linearGradient id={`a-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5ec8a8" stopOpacity="0.32" />
            <stop offset="70%" stopColor="#5ec8a8" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#5ec8a8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`l-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2fa98a" />
            <stop offset="100%" stopColor="#0e7c66" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((f) => {
          const y = height - padBottom - f * (height - padTop - padBottom);
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
              opacity={f === 1 ? 0.85 : 0.5}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        <path d={area} fill={`url(#a-${id})`} />
        <path d={futureArea} fill={`url(#a-${id})`} opacity="0.45" />

        {markers.map((m, i) => (
          <line
            key={`p${i}`}
            x1={m * w}
            x2={m * w}
            y1={height - padBottom}
            y2={height - padBottom - 8}
            stroke="var(--color-accent)"
            strokeWidth="1.5"
            opacity="0.55"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {futureMarkers.map((m, i) => (
          <line
            key={`f${i}`}
            x1={m * w}
            x2={m * w}
            y1={height - padBottom}
            y2={height - padBottom - 8}
            stroke="var(--color-accent)"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            opacity="0.35"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <line
          x1={nowPt[0]}
          x2={nowPt[0]}
          y1={padTop - 6}
          y2={height - padBottom}
          stroke="var(--color-ink)"
          strokeWidth="1"
          strokeDasharray="2 4"
          opacity="0.25"
          vectorEffect="non-scaling-stroke"
        />

        <path
          d={pastLine}
          pathLength={1}
          className="chart-line"
          fill="none"
          stroke={`url(#l-${id})`}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={futureLine}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeLinecap="round"
          opacity="0.5"
          vectorEffect="non-scaling-stroke"
        />

        <circle cx={nowPt[0]} cy={nowPt[1]} r="4" fill="var(--color-accent)" />
        <circle cx={nowPt[0]} cy={nowPt[1]} r="8" fill="var(--color-accent)" opacity="0.14" />
        {last ? <circle cx={last[0]} cy={last[1]} r="2.5" fill="var(--color-accent)" opacity="0.4" /> : null}
      </svg>

      {footer ? (
        <div className="num flex justify-between px-0.5 text-[10.5px] text-muted">
          <span>peak {Math.round(peak)}%</span>
          <span>dashed = projected</span>
          <span>now {Math.round(values[split] ?? 0)}%</span>
        </div>
      ) : null}
    </div>
  );
}
