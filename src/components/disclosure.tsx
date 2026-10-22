"use client";

import { useState, type ReactNode } from "react";

export function Chevron({ open = false, className = "" }: { open?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`size-4 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""} ${className}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/**
 * <details> but animated: the panel grows from 0fr to 1fr on the grid so the
 * height transition is smooth without measuring anything.
 */
export function Disclosure({
  title,
  right,
  children,
  defaultOpen = false,
  className = "",
  nested = false,
}: {
  title: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  nested?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={
        nested
          ? className
          : `rounded-[24px] bg-card shadow-card ${className}`
      }
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`press flex w-full items-center justify-between gap-3 text-left ${
          nested ? "py-2" : "px-4 py-3.5"
        }`}
      >
        <span className={nested ? "text-[13px] font-semibold text-accent" : "text-[15px] font-semibold"}>
          {title}
        </span>
        <span className="flex items-center gap-2 text-muted">
          {right}
          <Chevron open={open} />
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className={`${nested ? "" : "px-4"} pb-4 opacity-100 transition-opacity duration-300 ${open ? "" : "opacity-0"}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
