export function LevelChart({ values, height = 72 }: { values: number[]; height?: number }) {
  const w = 300;
  const pad = 4;
  const max = Math.max(100, ...values);
  const pts = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * w;
    const y = height - pad - (v / max) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${height} L0,${height} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Level curve, now ${Math.round(values[values.length - 1] ?? 0)} percent of a dose peak`}
    >
      <path d={area} fill="var(--color-accent-soft)" />
      <path
        d={line}
        pathLength={1}
        className="chart-line"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {last ? <circle cx={last[0]} cy={last[1]} r="3" fill="var(--color-accent)" /> : null}
    </svg>
  );
}