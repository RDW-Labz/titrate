"use client";

import Link from "next/link";
import { useMemo } from "react";
import { LogDoseButton } from "@/components/log-dose";
import { LevelChart } from "@/components/level-chart";
import { Btn, Card, Empty, LinkBtn, Pill, Ring, SectionHead, Stat } from "@/components/ui";
import { levelNow, levelWindow, levelWord } from "@/lib/levels";
import { PEPTIDE_BY_ID } from "@/lib/peptides";
import { cycleInfo, dayKey, daysBetween, humanIn, isDueOn, nextDue, streak } from "@/lib/schedule";
import { actions, useStore } from "@/lib/store";
import type { Compound } from "@/lib/types";

export default function TodayPage() {
  const { compounds, doses, foods, goals, weights } = useStore();
  const now = new Date();

  const rows = useMemo(() => {
    return compounds
      .map((c) => ({ c, due: isDueOn(c, doses, now), next: nextDue(c, doses, now) }))
      .sort((a, b) => {
        if (a.due !== b.due) return a.due ? -1 : 1;
        return (a.next?.getTime() ?? Infinity) - (b.next?.getTime() ?? Infinity);
      });
  }, [compounds, doses, now]);

  const hero = rows[0];
  const rest = rows.slice(1);
  const dues = rows.filter((r) => r.due);
  const loggedToday = doses.filter((d) => dayKey(new Date(d.at)) === dayKey(now) && !d.skipped).length;

  const todayFood = foods.filter((f) => dayKey(new Date(f.at)) === dayKey(now));
  const kcal = todayFood.reduce((n, f) => n + f.kcal, 0);
  const protein = todayFood.reduce((n, f) => n + f.p, 0);
  const latestWeight = [...weights].sort((a, b) => b.at.localeCompare(a.at))[0];
  const weightDelta = latestWeight
    ? Math.round((latestWeight.lb - weights[weights.length - 1].lb) * 10) / 10
    : null;

  if (compounds.length === 0) {
    return (
      <div className="pt-3">
        <Wordmark />
        <Empty
          title="Nothing tracked yet"
          body="Add a compound and this screen becomes your day: what's due, what's in your system, and what you've eaten."
        >
          <LinkBtn href="/protocols/new" variant="primary">
            Add a compound
          </LinkBtn>
          <Btn variant="line" onClick={() => actions.seed()}>
            Load a sample protocol
          </Btn>
        </Empty>
        <SectionHead>What this tracks</SectionHead>
        <Card className="divide-y divide-line">
          {[
            ["Doses and cycles", "Every compound, its schedule, and where you are in the on/off cycle."],
            ["Reconstitution", "mg + mL of water to syringe units, per vial. Doses left counts down."],
            ["Level curves", "Estimated compound level from half-life and every dose you've logged."],
            ["Nutrition", "Protein and calories on GLP-1s, where they decide whether you keep muscle."],
          ].map(([title, body]) => (
            <div key={title} className="px-4 py-3">
              <p className="text-[14px] font-medium">{title}</p>
              <p className="mt-0.5 text-[13px] text-muted">{body}</p>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Wordmark />
      <div className="flex items-end justify-between px-1 pb-3">
        <div>
          <h1 className="text-[22px] leading-tight font-semibold tracking-[-0.01em]">
            {now.toLocaleDateString(undefined, { weekday: "long" })}
          </h1>
          <p className="num text-[12.5px] text-muted">
            {now.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <Pill tone={streak(doses, now) > 0 ? "accent" : "neutral"}>
          {streak(doses, now)} day streak · {loggedToday} logged
        </Pill>
      </div>

      {hero ? <Hero row={hero} now={now} dues={dues.length} all={compounds} /> : null}

      <div className="mt-3 flex gap-2">
        <LinkBtn href="/calc" variant="line" className="flex-1">
          Reconstitute a vial
        </LinkBtn>
        <LinkBtn href="/protocols" variant="line" className="flex-1">
          All protocols
        </LinkBtn>
      </div>

      {rest.length > 0 ? (
        <>
          <SectionHead right={<Link href="/protocols" className="text-[12.5px] text-accent">Manage</Link>}>
            {dues.length > 1 ? "Also due today" : "Up next"}
          </SectionHead>
          <Card className="divide-y divide-line">
            {rest.map(({ c, next }) => {
              const due = isDueOn(c, doses, now);
              return (
                <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <Link href={`/protocols/${c.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-medium">{c.name}</p>
                    <p className="num text-[12px] text-muted">
                      {c.dose} {c.unit} · {next ? (due ? "due today" : `due ${humanIn(next, now)}`) : "off cycle"}
                    </p>
                  </Link>
                  {due ? (
                    <LogDoseButton compound={c} size="sm" />
                  ) : (
                    <Pill tone="neutral">{next ? humanIn(next, now) : "off"}</Pill>
                  )}
                </div>
              );
            })}
          </Card>
        </>
      ) : null}

      <SectionHead>Estimated levels</SectionHead>
      <Card className="divide-y divide-line">
        {compounds.map((c) => {
          const values = levelWindow(doses, c, now, 7, 1);
          const current = levelNow(doses, c, now);
          const peptide = PEPTIDE_BY_ID.get(c.peptideId);
          return (
            <Link key={c.id} href={`/protocols/${c.id}`} className="block px-4 py-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[14px] font-medium">{c.name}</span>
                <span className="num text-[12.5px]">
                  {Math.round(current)}% <span className="text-muted">{levelWord(current)}</span>
                </span>
              </div>
              <LevelChart values={values} height={40} />
              <p className="num text-[11px] text-muted">
                t½ {peptide ? peptide.halfLifeH : 6}h · % of one dose peak · last 7 days
              </p>
            </Link>
          );
        })}
      </Card>

      <SectionHead right={<Link href="/food" className="text-[12.5px] text-accent">Log food</Link>}>
        Today
      </SectionHead>
      <Card className="px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <Ring value={kcal} max={goals.kcal} label="kcal" />
          <Ring value={protein} max={goals.p} label="protein" />
          <Ring value={todayFood.reduce((n, f) => n + f.fiber, 0)} max={goals.fiber} label="fiber" />
          <div className="flex-1 text-right">
            <Stat
              label="Weight"
              value={latestWeight ? `${latestWeight.lb} lb` : "—"}
              sub={weightDelta === null ? undefined : `${weightDelta > 0 ? "+" : ""}${weightDelta} lb total`}
            />
          </div>
        </div>
        {todayFood.length === 0 ? (
          <p className="mt-3 text-[12.5px] text-muted">
            Nothing logged today. Protein first on a GLP-1 — {Math.max(0, goals.p - protein)} g to go.
          </p>
        ) : null}
      </Card>

      <div className="mt-6 flex items-center justify-between px-1 text-[11.5px] text-muted">
        <Link href="/studio" className="text-muted underline underline-offset-2">
          Card studio (OpenUI)
        </Link>
        <button
          className="underline underline-offset-2"
          onClick={() => {
            if (confirm("Clear every compound, dose and food log on this device?")) actions.reset();
          }}
        >
          Clear data
        </button>
      </div>
    </div>
  );
}

function Wordmark() {
  return (
    <div className="flex items-center justify-between pt-4 pb-1">
      <Link href="/" className="flex items-baseline gap-2">
        <span className="text-[15px] font-semibold tracking-[-0.02em]">Titrate</span>
        <span className="text-[11px] text-muted">peptide protocol tracker</span>
      </Link>
    </div>
  );
}

function Hero({
  row,
  now,
  dues,
  all,
}: {
  row: { c: Compound; due: boolean; next: Date | null };
  now: Date;
  dues: number;
  all: Compound[];
}) {
  const { doses } = useStore();
  const { c, due, next } = row;
  const peptide = PEPTIDE_BY_ID.get(c.peptideId);
  const cycle = cycleInfo(c, now);
  const last = doses
    .filter((d) => d.compoundId === c.id && !d.skipped)
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))[0];
  const sinceLast = last ? daysBetween(new Date(last.at), now) : null;

  return (
    <Card as="section" className="overflow-hidden border-ink bg-ink text-white">
      <div className="px-4 pt-3.5 pb-4">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-white/65">{due ? "Due now" : "Next dose"}</span>
          <span className="num text-[11.5px] text-white/60">
            {all.length} compound{all.length === 1 ? "" : "s"}
            {dues > 1 ? ` · ${dues} due` : ""}
          </span>
        </div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[24px] leading-tight font-semibold tracking-[-0.01em]">{c.name}</h2>
            <p className="num mt-0.5 text-[13px] text-white/70">
              {c.dose} {c.unit} · {peptide?.frequency ?? "custom schedule"}
            </p>
          </div>
          <div className="text-right">
            <p className="num text-[26px] leading-none font-medium">{due ? "Now" : next ? humanIn(next, now).replace("in ", "") : "—"}</p>
            <p className="num text-[11px] text-white/60">{cycle ? `cycle d${cycle.day}` : "\u00a0"}</p>
          </div>
        </div>
        {cycle ? (
          <div className="mt-3">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-white/80"
                style={{ width: `${Math.min(100, (cycle.dayInPhase / cycle.phaseLength) * 100)}%` }}
              />
            </div>
            <p className="num mt-1 text-[11px] text-white/60">
              {cycle.phase === "on" ? "on" : "off"} · day {cycle.dayInPhase} of {cycle.phaseLength} ·{" "}
              {cycle.daysLeftInPhase} to {cycle.phase === "on" ? "off period" : "on period"}
            </p>
          </div>
        ) : null}
        <div className="mt-4 flex items-center gap-2">
          <LogDoseButton compound={c} className="flex-1 !bg-white !text-ink hover:!brightness-95" />
          <Link
            href={`/protocols/${c.id}`}
            className="rounded-lg border border-white/25 px-3 py-2.5 text-[13px] font-medium text-white/90"
          >
            Details
          </Link>
        </div>
        {sinceLast !== null ? (
          <p className="mt-2 text-[11.5px] text-white/50">
            Last logged {sinceLast === 0 ? "today" : `${sinceLast} day${sinceLast === 1 ? "" : "s"} ago`}
            {last?.site ? ` · ${last.site}` : ""}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
