import Link from "next/link";
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

export function Card({
  children,
  className = "",
  as: As = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return <As className={`rounded-[var(--radius-card)] bg-card shadow-card ${className}`}>{children}</As>;
}

export function PageTitle({ children, meta }: { children: ReactNode; meta?: ReactNode }) {
  return (
    <div className="px-1 pt-2 pb-4">
      <h1 className="text-[28px] leading-[1.1] font-semibold tracking-[-0.025em]">{children}</h1>
      {meta ? <p className="mt-1.5 text-[13.5px] text-muted">{meta}</p> : null}
    </div>
  );
}

export function SectionHead({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mt-6 mb-2 flex items-baseline justify-between px-1">
      <h2 className="text-[14px] font-semibold">{children}</h2>
      {right}
    </div>
  );
}

type BtnProps = {
  variant?: "primary" | "quiet" | "line" | "white";
  size?: "sm" | "md" | "lg";
  className?: string;
} & ComponentProps<"button">;

const BTN = {
  primary: "bg-accent text-white hover:brightness-110",
  quiet: "bg-accent-soft text-accent",
  line: "bg-card text-ink shadow-card",
  white: "bg-white text-hero hover:brightness-95",
};

export function Btn({ variant = "primary", size = "md", className = "", ...rest }: BtnProps) {
  const sizes = {
    sm: "px-3 py-2 text-[13.5px] rounded-xl",
    md: "px-4 py-3 text-[15px] rounded-2xl",
    lg: "px-5 py-4 text-[17px] rounded-2xl",
  } as const;
  return (
    <button
      {...rest}
      className={`press inline-flex items-center justify-center gap-2 font-semibold disabled:opacity-40 ${sizes[size]} ${BTN[variant]} ${className}`}
    />
  );
}

export function LinkBtn({
  href,
  children,
  variant = "line",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof BTN;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`press inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[15px] font-semibold ${BTN[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`field block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-medium text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[12px] text-muted">{hint}</span> : null}
    </label>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "warn" | "alert";
}) {
  const tones = {
    neutral: "bg-paper text-muted",
    accent: "bg-accent-soft text-accent",
    warn: "bg-warn-soft text-warn",
    alert: "bg-alert-soft text-alert",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** counts up to `value`, so a number feels like it landed */
export function useCountUp(value: number, ms = 600) {
  const [n, setN] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      setN(a + (value - a) * (1 - (1 - k) ** 3));
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return n;
}

function RingSvg({
  pct,
  size,
  stroke,
  track = "var(--color-line)",
  width = 8,
  gradient = false,
  children,
}: {
  pct: number;
  size: number;
  stroke: string;
  track?: string;
  width?: number;
  gradient?: boolean;
  children?: ReactNode;
}) {
  const [drawn, setDrawn] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDrawn(Math.min(1, Math.max(0, pct))), 60);
    return () => clearTimeout(t);
  }, [pct]);
  const r = size / 2 - width / 2 - 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        {gradient ? (
          <defs>
            <linearGradient id={`rg-${size}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8fe6c6" />
              <stop offset="55%" stopColor="#5ec8a8" />
              <stop offset="100%" stopColor="#2fa98a" />
            </linearGradient>
          </defs>
        ) : null}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={width} opacity={0.28} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r + width * 0.95}
          fill="none"
          stroke={track}
          strokeWidth="1.5"
          strokeDasharray="1 6"
          opacity={0.25}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={gradient ? `url(#rg-${size})` : stroke}
          strokeWidth={width}
          strokeLinecap="round"
          strokeDasharray={`${c * drawn} ${c}`}
          className="ring-track"
        />
      </svg>
      {children ? <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div> : null}
    </div>
  );
}

/** big hero ring: time until the next dose, with the fractional interval already elapsed */
export function CountdownRing({
  progress,
  top,
  big,
  bottom,
  size = 176,
}: {
  progress: number;
  top: string;
  big: string;
  bottom: string;
  size?: number;
}) {
  return (
    <RingSvg pct={progress} size={size} stroke="#5ec8a8" track="#ffffff" width={10} gradient>
      <span className="text-[11.5px] font-medium text-white/55">{top}</span>
      <span className="num mt-1 text-[26px] leading-none font-semibold text-white">{big}</span>
      <span className="mt-1 text-[11.5px] text-white/55">{bottom}</span>
    </RingSvg>
  );
}

export function Ring({
  value,
  max,
  size = 96,
  label,
}: {
  value: number;
  max: number;
  size?: number;
  label: string;
}) {
  const shown = useCountUp(Math.round(value));
  return (
    <div className="flex flex-col items-center gap-2">
      <RingSvg pct={max > 0 ? value / max : 0} size={size} stroke="var(--color-accent)" width={8}>
        <span className="num text-[19px] leading-none font-semibold">{shown}</span>
        <span className="num text-[10.5px] text-muted">of {Math.round(max)}</span>
      </RingSvg>
      <span className="text-[12.5px] text-muted">{label}</span>
    </div>
  );
}

export function Empty({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <div className="enter rounded-[var(--radius-card)] bg-card px-5 py-8 text-center shadow-card">
      <p className="text-[17px] font-semibold">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[30ch] text-[14px] leading-relaxed text-muted">{body}</p>
      {children ? <div className="mt-4 flex flex-col gap-2">{children}</div> : null}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div>
      <div className="text-[12px] text-muted">{label}</div>
      <div className="num text-[16px] font-medium">{value}</div>
      {sub ? <div className="text-[11.5px] text-muted">{sub}</div> : null}
    </div>
  );
}

/** confetti pop when something gets logged */
export function Burst({ show }: { show: boolean }) {
  if (!show) return null;
  const dots = Array.from({ length: 7 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 7 - Math.PI / 2;
    return { dx: `${Math.round(Math.cos(a) * 26)}px`, dy: `${Math.round(Math.sin(a) * 26)}px`, d: `${i * 20}ms` };
  });
  return (
    <span className="burst pointer-events-none absolute inset-0" aria-hidden="true">
      {dots.map((d, i) => (
        <span key={i} style={{ ["--dx" as string]: d.dx, ["--dy" as string]: d.dy, animationDelay: d.d }}>
          {" "}
        </span>
      ))}
    </span>
  );
}
