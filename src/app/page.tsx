"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GearIcon } from "@/components/icons";
import { LogAllButton, LogDoseButton, LogDot } from "@/components/log-dose";
import { Btn, CountdownRing, Empty } from "@/components/ui";
import { toast } from "@/components/toast";
import { PEPTIDE_BY_ID } from "@/lib/peptides";
import { dayKey, humanIn, isDueOn, lastDose, nextDoseMoment, timeTo } from "@/lib/schedule";
import { budDaysLeft } from "@/lib/vial";
import { actions, useStore } from "@/lib/store";
import { doseOn } from "@/lib/titration";

const SYMPTOMS = ["Nausea", "Fatigue", "Headache", "Constipation", "Bloating"];

export default function TodayPage() {
  const { compounds, doses, foods, goals, symptoms, vials } = useStore();
  const now = new Date();
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1900);
    return () => clearTimeout(t);
  }, [flash]);

  if (compounds.length === 0) {
    return (
      <div className="pt-3">
        <h1 className="px-1 text-[28px] font-semibold tracking-[-0.025em]">Today</h1>
        <section className="enter mt-3 rounded-[30px] bg-hero px-5 py-6 text-white">
          <div className="flex items-center gap-5">
            <CountdownRing progress={0.72} top="Next dose" big="—" bottom="nothing yet" size={132} />
            <div className="min-w-0">
              <p className="text-[17px] leading-tight font-semibold">Your protocol starts here</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-white/55">
                Pick a peptide. We fill in the dose, schedule and vial — then this screen is one tap a day.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-2">
            <Link
              href="/protocols/new"
              className="press rounded-2xl bg-white px-4 py-3.5 text-center text-[16px] font-semibold text-hero"
            >
              Add a peptide
            </Link>
            <Btn variant="quiet" className="!bg-white/10 !text-white" onClick={() => actions.seed()}>
              Show me a sample
            </Btn>
          </div>
        </section>
        <p className="mt-3 px-1 text-[12.5px] leading-relaxed text-muted">
          What you get: a countdown ring, one-tap logging with the syringe units already worked out, and a
          history you can edit.
        </p>
      </div>
    );
  }

  const rows = compounds.map((c) => ({ c, due: isDueOn(c, doses, now), next: nextDoseMoment(c, doses, now) }));
  const dueRows = rows.filter((r) => r.due);
  const hero =
    rows.find((r) => r.c.id === flash) ??
    dueRows[0] ??
    [...rows].sort((a, b) => (a.next?.at.getTime() ?? 9e15) - (b.next?.at.getTime() ?? 9e15))[0];
  const others = rows.filter((r) => r.c.id !== hero?.c.id);
  const peptide = hero ? PEPTIDE_BY_ID.get(hero.c.peptideId) : undefined;
  const last = hero ? lastDose(doses, hero.c.id) : undefined;

  const heroVial = hero ? vials.find((v) => v.id === hero.c.vialId) : undefined;
  const heroBud = heroVial ? budDaysLeft(heroVial, now) : null;
  const vialWarn =
    heroBud === null
      ? null
      : heroBud < 0
        ? { days: heroBud, text: "Vial is past its use-by date — mix a fresh one." }
        : heroBud <= 3
          ? { days: heroBud, text: `Vial use-by in ${heroBud} day${heroBud === 1 ? "" : "s"} — mix a fresh one.` }
          : null;

  const total = hero?.next ? hero.next.at.getTime() - (last ? +new Date(last.at) : +now - 86_400_000) : 1;
  const elapsed = last ? +now - +new Date(last.at) : total;
  const progress = hero?.due ? 1 : Math.min(1, Math.max(0.04, elapsed / Math.max(1, total)));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    const k = dayKey(d);
    return {
      key: k,
      letter: d.toLocaleDateString(undefined, { weekday: "narrow" }),
      today: k === dayKey(now),
      logged: doses.filter((x) => !x.skipped && dayKey(new Date(x.at)) === k).length,
      skipped: doses.some((x) => x.skipped && dayKey(new Date(x.at)) === k),
      due: compounds.some((c) => isDueOn(c, doses, d)),
    };
  });

  const todayFood = foods.filter((f) => dayKey(new Date(f.at)) === dayKey(now));
  const todaySymptoms = symptoms.filter((x) => dayKey(new Date(x.at)) === dayKey(now));
  const kcal = todayFood.reduce((n, f) => n + f.kcal, 0);
  const protein = todayFood.reduce((n, f) => n + f.p, 0);

  return (
    <div className="pt-3">
      <div className="enter flex items-center justify-between px-1">
        <div className="flex items-baseline gap-2">
          <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.025em]">Today</h1>
          <span className="text-[13px] text-muted">
            {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </span>
        </div>
        <Link href="/settings" aria-label="Settings" className="press -mr-1 p-1.5 text-muted">
          <GearIcon className="size-[21px]" />
        </Link>
      </div>

      {hero ? (
        <section
          key={hero.c.id}
          className="enter relative mt-3 overflow-hidden rounded-[30px] bg-hero px-5 pt-5 pb-5 text-white"
          style={{ animationDelay: "40ms" }}
        >
          <div
            aria-hidden="true"
            className="ring-glow pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#5ec8a8]/20 blur-2xl"
          />
          <div className="relative flex flex-col items-center">
            <CountdownRing
              progress={progress}
              top={hero.due ? "Due now" : "Next dose"}
              big={hero.due ? "Ready" : hero.next ? timeTo(hero.next.at, now) : "—"}
              bottom={
                hero.due
                  ? ""
                  : hero.next
                    ? hero.next.at.toLocaleString(undefined, { weekday: "short", hour: "numeric" })
                    : ""
              }
            />
            <h2 className="mt-4 max-w-full truncate text-[27px] leading-tight font-semibold tracking-[-0.02em]">
              {hero.c.name}
            </h2>
            <p className="num mt-1 text-[14px] text-white/60">
              {doseOn(hero.c, now)} {hero.c.unit} · {peptide?.frequency ?? "custom"}
            </p>

            <div className="mt-5 w-full">
              <LogDoseButton
                compound={hero.c}
                variant="white"
                tone="dark"
                className="w-full"
                onLogged={() => setFlash(hero.c.id)}
              />
            </div>
            <p className="mt-2.5 text-[12px] text-white/55">
              {last ? `Last ${humanIn(new Date(last.at), now)}${last.site ? ` · ${last.site}` : ""}` : "First dose"}
            </p>
            {vialWarn ? (
              <p className={`mt-1 text-[12px] ${vialWarn.days < 0 ? "text-[#ff9d8f]" : "text-[#f0c98a]"}`}>{vialWarn.text}</p>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="enter mt-3 flex items-end justify-between rounded-[22px] bg-card px-4 py-3 shadow-card" style={{ animationDelay: "70ms" }}>
        {weekDays.map((d) => {
          const count = d.logged;
          const done = count > 0;
          return (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={`size-2 rounded-full ${
                  done ? "bg-accent" : d.skipped ? "border border-accent bg-transparent" : d.due ? "bg-warn/60" : "bg-line"
                }`}
              />
              <span className={`text-[10.5px] ${d.today ? "font-semibold text-ink" : "text-muted"}`}>{d.letter}</span>
            </div>
          );
        })}
      </div>

      {others.length > 0 ? (
        <ul className="mt-3 space-y-2.5">
          {others.map(({ c, due, next }, i) => (
            <li
              key={c.id}
              className="enter flex items-center gap-3 rounded-[22px] bg-card px-4 py-3.5 shadow-card"
              style={{ animationDelay: `${90 + i * 50}ms` }}
            >
              <Link href={`/protocols/${c.id}`} className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-medium">{c.name}</p>
                <p className="num text-[12.5px] text-muted">
                  {doseOn(c, now)} {c.unit} · {due ? "due today" : next ? humanIn(next.at, now) : "off cycle"}
                </p>
              </Link>
              {due ? <LogDot compound={c} /> : <span className="pr-1 text-[18px] text-muted">›</span>}
            </li>
          ))}
        </ul>
      ) : null}

      {rows.filter((r) => r.due).length > 1 ? (
        <div className="enter mt-3" style={{ animationDelay: "170ms" }}>
          <LogAllButton compounds={rows.filter((r) => r.due).map((r) => r.c)} />
        </div>
      ) : null}

      <Link
        href="/food"
        className="enter press mt-3 flex items-center gap-3 rounded-[22px] bg-card px-4 py-4 shadow-card"
        style={{ animationDelay: "210ms" }}
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
        <span className="num text-[12.5px] text-muted">{kcal} kcal</span>
      </Link>

      <section className="enter mt-3 rounded-[22px] bg-card px-4 py-4 shadow-card" style={{ animationDelay: "250ms" }}>
        <div className="flex items-baseline justify-between">
          <p className="text-[15px] font-medium">Any side effects?</p>
          <span className="num text-[12px] text-muted">
            {todaySymptoms.length ? `${todaySymptoms.length} today` : "tap any"}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {SYMPTOMS.map((name) => {
            const hit = todaySymptoms.filter((x) => x.name === name);
            return (
              <button
                key={name}
                onClick={() => {
                  if (hit.length) hit.forEach((x) => actions.deleteSymptom(x.id));
                  else {
                    actions.logSymptom(name);
                    toast(`Noted ${name.toLowerCase()}`);
                  }
                }}
                aria-pressed={hit.length > 0}
                className={`press rounded-full px-3 py-1.5 text-[13px] font-medium ${
                  hit.length ? "bg-warn-soft text-warn" : "bg-paper text-muted"
                }`}
              >
                {hit.length > 1 ? `${hit.length}× ` : ""}
                {name}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}