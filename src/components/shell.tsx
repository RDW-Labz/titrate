"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { BookIcon, CalcIcon, ForkIcon, HomeIcon, VialIcon } from "./icons";
import { ToastHost } from "./toast";
import { PageFade } from "./page-fade";
import { Reminders } from "./reminders";
import { useReady } from "@/lib/store";

const TABS = [
  { href: "/", label: "Today", Icon: HomeIcon },
  { href: "/protocols", label: "Peptides", Icon: VialIcon },
  { href: "/calc", label: "Calc", Icon: CalcIcon },
  { href: "/food", label: "Food", Icon: ForkIcon },
  { href: "/library", label: "Library", Icon: BookIcon },
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
        className="tab-pill absolute top-0 bottom-0 left-0 flex items-center justify-center rounded-full bg-accent-soft"
        style={{ width: `${100 / TABS.length}%`, transform: `translateX(${index * 100}%)` }}
      >
        <span className="h-1 w-6 rounded-full bg-accent/25" />
      </span>
      <ul className="relative flex">
        {TABS.map((t, i) => {
          const active = i === index;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`press relative flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold ${
                  active ? "tab-active text-accent" : "text-muted"
                }`}
              >
                <t.Icon className={active ? "size-[21px]" : "size-[21px] opacity-80"} />
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
        {ready ? (
          <Suspense fallback={children}>
            <PageFade>{children}</PageFade>
          </Suspense>
        ) : (
          // matches the real layout closely enough that the swap barely moves
          <div className="pt-3" aria-hidden="true">
            <div className="ml-1 h-7 w-24 animate-pulse rounded-full bg-line/70" />
            <div className="mt-3 h-[336px] animate-pulse rounded-[30px] bg-hero/85" />
            <div className="mt-3 h-[66px] animate-pulse rounded-[22px] bg-card shadow-card" />
            <div className="mt-2.5 h-[66px] animate-pulse rounded-[22px] bg-card shadow-card" />
          </div>
        )}
      </main>
      <nav
        aria-label="Main"
        className="fixed bottom-[max(14px,env(safe-area-inset-bottom))] left-1/2 z-10 w-[calc(100%-24px)] max-w-[432px] -translate-x-1/2 rounded-full bg-card p-1.5 shadow-float"
      >
        <Suspense fallback={<div className="h-[58px]" />}>
          <TabBar />
        </Suspense>
      </nav>
      <ToastHost />
      <Reminders />
    </div>
  );
}