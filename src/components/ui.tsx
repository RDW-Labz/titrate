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
  return <As className={`rounded-2xl bg-card ${className}`}>{children}</As>;
}

export function PageTitle({ children, meta }: { children: ReactNode; meta?: ReactNode }) {
  return (
    <div className="px-1 pt-1 pb-4">
      <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.015em]">{children}</h1>
      {meta ? <p className="mt-1 text-[13.5px] text-muted">{meta}</p> : null}
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
  variant?: "primary" | "quiet" | "line";
  size?: "sm" | "md" | "lg";
  className?: string;
} & ComponentProps<"button">;

const BTN = {
  primary: "bg-accent text-white hover:brightness-110",
  quiet: "bg-accent-soft text-accent",
  line: "bg-card text-ink",
};

export function Btn({ variant = "primary", size = "md", className = "", ...rest }: BtnProps) {
  const sizes = {
    sm: "px-3 py-2 text-[13.5px] rounded-xl",
    md: "px-4 py-3 text-[15px] rounded-xl",
    lg: "px-5 py-4 text-[16.5px] rounded-2xl",
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
      className={`press inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-semibold ${BTN[variant]} ${className}`}
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
export function useCountUp(value: number, ms = 550) {
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

export function Ring({
  value,
  max,
  size = 88,
  label,
  sub,
}: {
  value: number;
  max: number;
  size?: number;
  label: string;
  sub?: string;
}) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const shown = useCountUp(Math.round(value));
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth="7" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${c * pct} ${c}`}
            style={{ transition: "stroke-dasharray .7s cubic-bezier(.2,.7,.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-[17px] leading-none font-semibold">{shown}</span>
          <span className="num text-[10.5px] text-muted">of {Math.round(max)}</span>
        </div>
      </div>
      <span className="text-[12.5px] text-muted">{label}</span>
      {sub ? <span className="num text-[11px] text-muted">{sub}</span> : null}
    </div>
  );
}

export function Empty({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <div className="enter rounded-2xl bg-card px-5 py-8 text-center">
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
