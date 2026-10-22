"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { useReady } from "@/lib/store";

const TABS = [
  { href: "/", label: "Today" },
  { href: "/protocols", label: "Protocols" },
  { href: "/calc", label: "Calc" },
  { href: "/food", label: "Food" },
  { href: "/library", label: "Library" },
] as const;

function TabBar() {
  const pathname = usePathname();
  return (
    <ul className="flex">
      {TABS.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <li key={t.href} className="flex-1">
            <Link
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11.5px] font-medium ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-[2px] w-6 rounded-full ${active ? "bg-accent" : "bg-transparent"}`}
              />
              {t.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const ready = useReady();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-paper">
      <main className="flex-1 px-4 pb-28">
        {ready ? children : <div className="pt-16 text-center text-[13px] text-muted">Loading your protocol…</div>}
      </main>
      <nav
        aria-label="Main"
        className="fixed bottom-0 left-1/2 z-10 w-full max-w-[480px] -translate-x-1/2 border-t border-line bg-paper/95 backdrop-blur-sm"
      >
        <Suspense fallback={<div className="h-[46px]" />}>
          <TabBar />
        </Suspense>
      </nav>
    </div>
  );
}
