export function LevelChart({
  values,
  height = 68,
  showAxis = false,
  label,
}: {
  values: number[];
  height?: number;
  showAxis?: boolean;
  label?: string;
}) {
  const w = 300;
  const h = height;
  const pad = showAxis ? 6 : 3;
  const max = Math.max(100, ...values);
  const pts = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * w;
    const y = h - pad - (v / max) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1];

  return (
    <div>
      {label ? <div className="mb-1 text-[11.5px] text-muted">{label}</div> : null}
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height={h}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Estimated level curve, current ${Math.round(values[values.length - 1] ?? 0)} percent of a dose peak`}
      >
        <path d={area} fill="var(--color-accent-soft)" />
        <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        {last ? <circle cx={last[0]} cy={last[1]} r="2.6" fill="var(--color-accent)" /> : null}
      </svg>
    </div>
  );
}
