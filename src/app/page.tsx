"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogDoseButton, LogDot } from "@/components/log-dose";
import { Btn, Empty } from "@/components/ui";
import { PEPTIDE_BY_ID } from "@/lib/peptides";
import { dayKey, humanIn, isDueOn, lastDose, nextDue } from "@/lib/schedule";
import { actions, useStore } from "@/lib/store";

export default function TodayPage() {
  const { compounds, doses, foods, goals } = useStore();
  const now = new Date();
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1900);
    return () => clearTimeout(t);
  }, [flash]);

  if (compounds.length === 0) {
    return (
      <div className="pt-4">
        <h1 className="px-1 text-[26px] font-semibold tracking-[-0.015em]">Today</h1>
        <div className="mt-4">
          <Empty title="Let's track something" body="Add a peptide and this screen becomes one big button: what's due, tap, done.">
            <Link
              href="/protocols/new"
              className="press rounded-2xl bg-accent px-4 py-3.5 text-[16px] font-semibold text-white"
            >
              Add a peptide
            </Link>
            <Btn variant="line" onClick={() => actions.seed()}>
              Show me a sample
            </Btn>
          </Empty>
        </div>
      </div>
    );
  }

  const rows = compounds.map((c) => ({ c, due: isDueOn(c, doses, now), next: nextDue(c, doses, now) }));
  const dueRows = rows.filter((r) => r.due);
  const hero = rows.find((r) => r.c.id === flash) ?? dueRows[0] ?? rows.sort((a, b) => (a.next?.getTime() ?? 9e15) - (b.next?.getTime() ?? 9e15))[0];
  const others = rows.filter((r) => r.c.id !== hero?.c.id);
  const peptide = hero ? PEPTIDE_BY_ID.get(hero.c.peptideId) : undefined;
  const last = hero ? lastDose(doses, hero.c.id) : undefined;

  const todayFood = foods.filter((f) => dayKey(new Date(f.at)) === dayKey(now));
  const kcal = todayFood.reduce((n, f) => n + f.kcal, 0);
  const protein = todayFood.reduce((n, f) => n + f.p, 0);

  return (
    <div className="pt-3">
      <div className="enter flex items-baseline justify-between px-1">
        <h1 className="text-[26px] font-semibold tracking-[-0.015em]">Today</h1>
        <span className="text-[13px] text-muted">
          {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
        </span>
      </div>

      {hero ? (
        <section
          key={hero.c.id}
          className="enter mt-3 rounded-[26px] bg-ink px-5 py-5 text-white"
          style={{ animationDelay: "40ms" }}
        >
          <p className="text-[13px] font-medium text-white/55">{hero.due ? "Due now" : "Next up"}</p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-[30px] leading-[1.1] font-semibold tracking-[-0.02em]">{hero.c.name}</h2>
              <p className="num mt-1 text-[14px] text-white/65">
                {hero.c.dose} {hero.c.unit} · {peptide?.frequency ?? "custom"}
              </p>
            </div>
            <p className="num shrink-0 pt-1 text-[15px] text-white/80">
              {hero.due ? "now" : hero.next ? humanIn(hero.next, now) : "—"}
            </p>
          </div>

          <div className="mt-5">
            <LogDoseButton
              compound={hero.c}
              className="w-full !rounded-2xl !bg-white !py-4 !text-[17px] !text-ink hover:!brightness-95"
              onLogged={() => setFlash(hero.c.id)}
            />
          </div>
          <p className="mt-2.5 text-[12.5px] text-white/45">
            {last ? `Last ${humanIn(new Date(last.at), now)}${last.site ? ` · ${last.site}` : ""}` : "First dose"}
          </p>
        </section>
      ) : null}

      {others.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {others.map(({ c, due, next }, i) => (
            <li
              key={c.id}
              className="enter flex items-center gap-3 rounded-2xl bg-card px-4 py-3"
              style={{ animationDelay: `${80 + i * 45}ms` }}
            >
              <Link href={`/protocols/${c.id}`} className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-medium">{c.name}</p>
                <p className="num text-[13px] text-muted">
                  {c.dose} {c.unit} · {due ? "due today" : next ? humanIn(next, now) : "off cycle"}
                </p>
              </Link>
              {due ? <LogDot compound={c} /> : <span className="pr-1 text-[18px] text-muted">›</span>}
            </li>
          ))}
        </ul>
      ) : null}

      <Link
        href="/food"
        className="enter press mt-3 flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5"
        style={{ animationDelay: "160ms" }}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium">
            {protein} g protein <span className="text-muted">of {goals.p}</span>
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-700"
              style={{ width: `${Math.min(100, (protein / Math.max(1, goals.p)) * 100)}%` }}
            />
          </div>
        </div>
        <span className="num text-[13px] text-muted">{kcal} kcal</span>
      </Link>
    </div>
  );
}