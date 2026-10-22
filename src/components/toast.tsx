"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; message: string; action?: { label: string; run: () => void } };

let current: Toast | null = null;
const subs = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

/** a message with one undo — cheaper than asking "are you sure?" before every tap */
export function toast(message: string, action?: { label: string; run: () => void }) {
  const id = Date.now();
  current = { id, message, action };
  subs.forEach((f) => f());
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (current?.id === id) {
      current = null;
      subs.forEach((f) => f());
    }
  }, 3800);
}

export function ToastHost() {
  const [t, setT] = useState<Toast | null>(current);

  useEffect(() => {
    const update = () => setT(current);
    subs.add(update);
    return () => {
      subs.delete(update);
    };
  }, []);

  if (!t) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="toast-in fixed bottom-[104px] left-1/2 z-20 flex w-[calc(100%-40px)] max-w-[400px] -translate-x-1/2 items-center justify-between gap-3 rounded-full bg-hero px-4 py-2.5 text-white shadow-float"
    >
      <span className="truncate text-[13.5px] font-medium">{t.message}</span>
      {t.action ? (
        <button
          className="press shrink-0 rounded-full bg-white/12 px-3 py-1 text-[13px] font-semibold text-[#8fe3c4]"
          onClick={() => {
            t.action?.run();
            current = null;
            subs.forEach((f) => f());
          }}
        >
          {t.action.label}
        </button>
      ) : null}
    </div>
  );
}
