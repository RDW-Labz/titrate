import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Card({
  children,
  className = "",
  as: As = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return <As className={`rounded-xl border border-line bg-card ${className}`}>{children}</As>;
}

export function PageTitle({ children, meta }: { children: ReactNode; meta?: ReactNode }) {
  return (
    <div className="px-1 pt-2 pb-3">
      <h1 className="text-[22px] leading-tight font-semibold tracking-[-0.01em]">{children}</h1>
      {meta ? <p className="mt-1 text-[13px] text-muted">{meta}</p> : null}
    </div>
  );
}

export function SectionHead({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mt-5 mb-2 flex items-baseline justify-between px-1">
      <h2 className="text-[13px] font-semibold text-ink">{children}</h2>
      {right}
    </div>
  );
}

type BtnProps = {
  variant?: "primary" | "quiet" | "line";
  size?: "sm" | "md";
  className?: string;
} & ComponentProps<"button">;

const BTN = {
  primary: "bg-accent text-white hover:brightness-110 active:brightness-95",
  quiet: "bg-accent-soft text-accent hover:bg-[#d7e8e3]",
  line: "border border-line bg-card text-ink hover:bg-paper",
};

export function Btn({ variant = "primary", size = "md", className = "", ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-[filter,background-color] disabled:cursor-not-allowed disabled:opacity-50 ${
        size === "sm" ? "px-2.5 py-1.5 text-[12.5px]" : "px-3.5 py-2.5 text-[14px]"
      } ${BTN[variant]} ${className}`}
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
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2.5 text-[14px] font-medium ${BTN[variant]} ${className}`}
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
      <span className="mb-1 block text-[12.5px] font-medium text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11.5px] text-muted">{hint}</span> : null}
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
    neutral: "bg-paper text-muted border-line",
    accent: "bg-accent-soft text-accent border-transparent",
    warn: "bg-warn-soft text-warn border-transparent",
    alert: "bg-alert-soft text-alert border-transparent",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11.5px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Ring({
  value,
  max,
  size = 76,
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
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth="5" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${c * pct} ${c}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-[15px] leading-none font-medium">{Math.round(value)}</span>
          <span className="num text-[10px] text-muted">/ {max}</span>
        </div>
      </div>
      <span className="text-[11.5px] text-muted">{label}</span>
      {sub ? <span className="num text-[10.5px] text-muted">{sub}</span> : null}
    </div>
  );
}

export function Empty({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-card/60 px-4 py-6 text-center">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-[34ch] text-[13px] text-muted">{body}</p>
      {children ? <div className="mt-3 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div>
      <div className="text-[11.5px] text-muted">{label}</div>
      <div className="num text-[17px] font-medium">{value}</div>
      {sub ? <div className="text-[11px] text-muted">{sub}</div> : null}
    </div>
  );
}
