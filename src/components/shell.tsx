"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { useReady } from "@/lib/store";

const TABS = [
  { href: "/", label: "Today" },
  { href: "/protocols", label: "Peptides" },
  { href: "/calc", label: "Calc" },
  { href: "/food", label: "Food" },
  { href: "/library", label: "Library" },
] as const;

function TabBar() {
  const pathname = usePathname();
  const index = Math.max(
    0,
    TABS.findIndex((t) => (t.href === "/" ? pathname === "/" : pathname.startsWith(t.href))),
  );

  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="tab-pill absolute top-1.5 bottom-1.5 left-0 rounded-2xl bg-card"
        style={{ width: `${100 / TABS.length}%`, transform: `translateX(${index * 100}%)` }}
      />
      <ul className="relative flex">
        {TABS.map((t, i) => {
          const active = i === index;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`press flex flex-col items-center gap-0.5 rounded-2xl py-2.5 text-[12px] font-semibold ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <span className={`size-1.5 rounded-full transition-colors ${active ? "bg-accent" : "bg-transparent"}`} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const ready = useReady();
  // the store only exists in the browser; rendering pages before it loads would prerender
  // an empty protocol (and trip Next's new Date() check), so hold children until mounted
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[460px] flex-col">
      <main className="flex-1 px-4 pb-32">
        {ready ? children : <div className="pt-20 text-center text-[14px] text-muted">Opening your day…</div>}
      </main>
      <nav
        aria-label="Main"
        className="fixed bottom-0 left-1/2 z-10 w-full max-w-[460px] -translate-x-1/2 border-t border-line bg-paper/90 px-3 pt-1 pb-[max(6px,env(safe-area-inset-bottom))] backdrop-blur-md"
      >
        <Suspense fallback={<div className="h-[62px]" />}>
          <TabBar />
        </Suspense>
      </nav>
    </div>
  );
}