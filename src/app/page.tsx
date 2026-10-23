"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GearIcon } from "@/components/icons";
import { LevelChart } from "@/components/level-chart";
import { LogAllButton, LogDoseButton, LogDot } from "@/components/log-dose";
import { Btn, CountdownRing, Empty, useDialog, usePresence } from "@/components/ui";
import { toast } from "@/components/toast";
import { PEPTIDE_BY_ID } from "@/lib/peptides";
import { dayKey, humanIn, isDueOn, lastDose, nextDoseMoment, timeTo } from "@/lib/schedule";
import { budDaysLeft } from "@/lib/vial";
import { actions, useStore } from "@/lib/store";
import { doseOn } from "@/lib/titration";
import { levelNow, levelSeries } from "@/lib/levels";

const SYMPTOMS = ["Nausea", "Fatigue", "Headache", "Constipation", "Bloating"];

export default function TodayPage() {
  const { compounds, doses, foods, goals, symptoms, vials } = useStore();
  const now = new Date();
  const [flash, setFlash] = useState<string | null>(null);
  const [symptomsOpen, setSymptomsOpen] = useState(false);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1900);
    return () => clearTimeout(t);
  }, [flash]);

  if (compounds.every((c) => c.archived)) {
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
              href="/start"
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

  const active = compounds.filter((c) => !c.archived);
  const rows = active.map((c) => ({ c, due: isDueOn(c, doses, now), next: nextDoseMoment(c, doses, now) }));
  const dueRows = rows.filter((r) => r.due);
  const hero =
    rows.find((r) => r.c.id === flash) ??
    dueRows[0] ??
    [...rows].sort((a, b) => (a.next?.at.getTime() ?? 9e15) - (b.next?.at.getTime() ?? 9e15))[0];
  const others = rows.filter((r) => r.c.id !== hero?.c.id);
  const peptide = hero ? PEPTIDE_BY_ID.get(hero.c.peptideId) : undefined;
  const last = hero ? lastDose(doses, hero.c.id) : undefined;

  const heroSeries = hero ? levelSeries(doses, hero.c, now, 10, 5) : null;
  const heroNow = hero ? levelNow(doses, hero.c, now) : 0;
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
      due: active.some((c) => isDueOn(c, doses, d)),
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
        <span className="flex items-center gap-1">
          <Link href="/protocols?focus=search" aria-label="Search" className="press -m-2 p-3 text-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true" className="size-[21px]">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4.5 4.5" />
            </svg>
          </Link>
          <Link href="/settings" aria-label="Settings" className="press -m-2 -mr-3 p-3 text-muted">
            <GearIcon className="size-[21px]" />
          </Link>
        </span>
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

            {heroSeries ? (
              <div className="mt-4 w-full rounded-2xl bg-white/[0.06] px-2 pt-2 pb-1">
                <div className="level-dark">
                  <LevelChart
                    values={heroSeries.values}
                    height={58}
                    markers={heroSeries.markers}
                    futureMarkers={heroSeries.futureMarkers}
                    nowAt={heroSeries.nowAt}
                    footer={false}
                    dark
                  />
                </div>
                <p className="num mt-0.5 flex justify-between px-1 text-[10.5px] text-white/45">
                  <span>now {Math.round(heroNow)}%</span>
                  <span>next peak {Math.round(heroSeries.nextPeak)}%</span>
                </p>
              </div>
            ) : null}

            <div className="mt-4 w-full">
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

      <div className="enter mt-2 flex items-center gap-3 px-2" style={{ animationDelay: "70ms" }}>
        <div className="flex flex-1 items-center gap-1.5">
          {weekDays.map((d) => (
            <span
              key={d.key}
              title={d.key}
              className={`size-1.5 rounded-full ${
                d.logged ? "bg-accent" : d.skipped ? "border border-accent" : d.due ? "bg-warn/60" : "bg-line"
              } ${d.today ? "ring-2 ring-accent/25" : ""}`}
            />
          ))}
        </div>
        <span className="num text-[11px] text-muted">{weekDays.filter((d) => d.logged).length} of 7 days</span>
      </div>

      {others.length > 0 ? (
        <ul className="mt-3 space-y-2.5">
          {others.map(({ c, due, next }, i) => (
            <li
              key={c.id}
              className="enter flex items-center gap-3 rounded-[22px] bg-card px-4 py-3.5 shadow-card"
              style={{ animationDelay: `${90 + i * 50}ms` }}
            >
              <Link href={`/protocols/view?id=${c.id}`} className="min-w-0 flex-1">
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

      <button
        onClick={() => setSymptomsOpen(true)}
        className="enter press mt-2.5 flex w-full items-center justify-between rounded-[22px] bg-card px-4 py-3.5 shadow-card"
        style={{ animationDelay: "250ms" }}
      >
        <span className="text-[15px] font-medium">Any side effects?</span>
        <span className="flex items-center gap-2 text-[12px] text-muted">
          {todaySymptoms.length ? `${todaySymptoms.length} today` : "none logged"}
          <span aria-hidden="true" className="text-[16px]">›</span>
        </span>
      </button>

      <SymptomSheet
        open={symptomsOpen}
        onClose={() => setSymptomsOpen(false)}
        logged={todaySymptoms}
        onToggle={(name) => {
          const hits = todaySymptoms.filter((x) => x.name === name);
          if (!hits.length) {
            actions.logSymptom(name, 1);
            toast(`${name} · mild`);
            return;
          }
          const sev = Math.max(...hits.map((h) => h.severity));
          if (sev < 3) {
            hits.forEach((h) => actions.updateSymptom(h.id, { severity: (sev + 1) as 1 | 2 | 3 }));
            toast(`${name} · ${sev + 1 === 2 ? "moderate" : "severe"}`);
          } else {
            hits.forEach((h) => actions.deleteSymptom(h.id));
            toast(`${name} cleared`);
          }
        }}
      />
    </div>
  );
}

function SymptomSheet({
  open,
  onClose,
  logged,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  logged: { id: string; name: string; severity: 1 | 2 | 3 }[];
  onToggle: (name: string) => void;
}) {
  const panel = useDialog(open, onClose);
  const { shown, leaving } = usePresence(open);
  if (!shown) return null;
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Side effects">
      <button
        className={`absolute inset-0 bg-ink/45 backdrop-blur-[2px] ${leaving ? "veil-out" : "veil-in"}`}
        onClick={onClose}
        aria-label="Close"
        tabIndex={-1}
      />
      <div
        ref={panel}
        tabIndex={-1}
        className={`${leaving ? "sheet-out" : "sheet-in"} relative w-full max-w-[460px] rounded-t-[28px] bg-card px-5 pt-3 pb-[max(18px,env(safe-area-inset-bottom))] outline-none`}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <p className="text-[16px] font-semibold">Any side effects?</p>
        <p className="mt-0.5 text-[12.5px] text-muted">
          Tap once for mild, again for moderate, again for severe, once more to clear.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SYMPTOMS.map((name) => {
            const hits = logged.filter((x) => x.name === name);
            const sev = hits.length ? Math.max(...hits.map((h) => h.severity)) : 0;
            return (
              <button
                key={name}
                onClick={() => onToggle(name)}
                aria-pressed={hits.length > 0}
                aria-label={`${name}${sev ? `, severity ${sev} of 3` : ""}`}
                className={`press flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13.5px] font-medium ${
                  hits.length ? "bg-warn-soft text-warn" : "bg-paper text-muted"
                }`}
              >
                {name}
                {hits.length > 1 ? <span className="text-[11px] opacity-70">×{hits.length}</span> : null}
                {sev ? (
                  <span className="flex gap-0.5" aria-hidden="true">
                    {[1, 2, 3].map((n) => (
                      <span
                        key={n}
                        className={`size-1 rounded-full transition-colors duration-200 ${n <= sev ? "bg-warn" : "bg-warn/25"}`}
                      />
                    ))}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <Link href="/symptoms" className="press mt-4 block text-center text-[13px] font-medium text-accent">
          See the last 30 days ›
        </Link>
      </div>
    </div>
  );
}
