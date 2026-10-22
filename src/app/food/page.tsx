"use client";

import { useId, useState } from "react";
import { Btn, Field, PageTitle, Ring } from "@/components/ui";
import { Disclosure } from "@/components/disclosure";
import { addDays, dayKey } from "@/lib/schedule";
import { actions, useStore } from "@/lib/store";

const BLANK = { name: "", kcal: "", p: "", c: "", f: "", fiber: "" };

function Trend({ values }: { values: number[] }) {
  const id = useId().replace(/[:]/g, "");
  if (values.length < 2) return null;
  const w = 280;
  const h = 56;
  const pad = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(0.1, max - min);
  const y = (v: number) => h - pad - ((v - min) / span) * (h - pad * 2);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, y(v)] as const);
  const line = pts.map(([x, yy], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${yy.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" role="img" aria-label={`Weight trend, ${min} to ${max} lb`}>
        <defs>
          <linearGradient id={`tg-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5ec8a8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#5ec8a8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" x2={w} y1={y(min)} y2={y(min)} stroke="var(--color-line)" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
        <path d={area} fill={`url(#tg-${id})`} />
        <path d={line} pathLength={1} className="chart-line" fill="none" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <circle cx={last[0]} cy={last[1]} r="3.5" fill="var(--color-accent)" />
      </svg>
      <div className="num flex justify-between text-[10.5px] text-muted">
        <span>{min} lb</span>
        <span>{max} lb</span>
      </div>
    </div>
  );
}

export default function FoodPage() {
  const { foods, goals, favorites, weights } = useStore();
  const now = new Date();
  const [back, setBack] = useState(0);
  const [draft, setDraft] = useState(BLANK);
  const [weight, setWeight] = useState("");

  const day = addDays(now, -back);
  const key = dayKey(day);
  const dayFood = foods.filter((f) => dayKey(new Date(f.at)) === key);
  const prevKey = dayKey(addDays(day, -1));
  const prevFood = foods.filter((f) => dayKey(new Date(f.at)) === prevKey);

  const at = () =>
    back === 0
      ? new Date()
      : new Date(day.getFullYear(), day.getMonth(), day.getDate(), now.getHours(), now.getMinutes());

  const kcal = dayFood.reduce((n, f) => n + f.kcal, 0);
  const protein = dayFood.reduce((n, f) => n + f.p, 0);
  const fiber = dayFood.reduce((n, f) => n + f.fiber, 0);
  const sorted = [...weights].sort((a, b) => a.at.localeCompare(b.at));
  const latest = sorted[sorted.length - 1];

  const label =
    back === 0 ? "Today" : back === 1 ? "Yesterday" : day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="pt-3">
      <PageTitle meta="Protein first on a GLP-1.">Food</PageTitle>

      <div className="mb-3 flex items-center justify-between rounded-full bg-card px-2 py-1.5 shadow-card">
        <button
          className="press grid size-9 place-items-center rounded-full text-[17px] text-muted"
          onClick={() => setBack(back + 1)}
          aria-label="Previous day"
        >
          ‹
        </button>
        <span className="text-[14px] font-semibold">{label}</span>
        <button
          className="press grid size-9 place-items-center rounded-full text-[17px] disabled:opacity-30"
          onClick={() => setBack(Math.max(0, back - 1))}
          disabled={back === 0}
          aria-label="Next day"
        >
          ›
        </button>
      </div>

      <section className="enter rounded-[24px] bg-card px-4 py-5 shadow-card">
        <div className="flex items-center justify-around">
          <Ring value={protein} max={goals.p} label="protein" size={100} />
          <Ring value={kcal} max={goals.kcal} label="calories" size={100} />
        </div>
        <p className="mt-2 text-center text-[13px] text-muted">
          {protein >= goals.p ? "Protein done." : `${Math.max(0, goals.p - protein)} g of protein left`}
        </p>
      </section>

      <div className="mt-3 flex flex-wrap gap-2">
        {favorites.slice(0, 6).map((f) => (
          <button
            key={f.name}
            onClick={() => actions.addFood({ name: f.name, kcal: f.kcal, p: f.p, c: f.c, f: f.f, fiber: f.fiber, at: at() })}
            className="press rounded-full bg-card px-3.5 py-2 text-[13.5px] font-medium shadow-card"
          >
            {f.name} <span className="num text-muted">{f.kcal}</span>
          </button>
        ))}
      </div>

      {prevFood.length > 0 && dayFood.length === 0 ? (
        <button
          onClick={() =>
            prevFood.forEach((f) =>
              actions.addFood({ name: f.name, kcal: f.kcal, p: f.p, c: f.c, f: f.f, fiber: f.fiber, at: at() }),
            )
          }
          className="press mt-2 w-full rounded-[22px] bg-card px-4 py-3.5 text-left shadow-card"
        >
          <span className="text-[15px] font-medium">Copy the day before</span>
          <span className="num block text-[12.5px] text-muted">
            {prevFood.length} {prevFood.length === 1 ? "entry" : "entries"} · {prevFood.reduce((n, f) => n + f.kcal, 0)} kcal
          </span>
        </button>
      ) : null}

      <ul className="mt-3 divide-y divide-line rounded-[24px] bg-card shadow-card">
        {dayFood.length === 0 ? (
          <li className="px-4 py-5 text-center text-[13.5px] text-muted">
            Nothing on this day. Tap a chip above, or add your own.
          </li>
        ) : (
          dayFood.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px]">{f.name}</p>
                <p className="num text-[12px] text-muted">
                  {f.p} g protein · {f.kcal} kcal
                </p>
              </div>
              <button
                aria-label={`Delete ${f.name}`}
                onClick={() => actions.deleteFood(f.id)}
                className="press grid size-9 place-items-center text-[15px] text-muted"
              >
                ✕
              </button>
            </li>
          ))
        )}
      </ul>

      <Disclosure className="mt-3" title="More">

        <div className="mt-4">
          <p className="text-[13.5px] font-semibold">Add food</p>
          <div className="mt-2 space-y-3">
            <Field label="Food">
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Chicken bowl" />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["kcal", "Calories"],
                  ["p", "Protein"],
                  ["c", "Carbs"],
                  ["f", "Fat"],
                  ["fiber", "Fiber"],
                ] as const
              ).map(([k, label]) => (
                <Field key={k} label={label}>
                  <input inputMode="decimal" value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
                </Field>
              ))}
            </div>
            <Btn
              className="w-full"
              disabled={!draft.name.trim()}
              onClick={() => {
                const entry = {
                  name: draft.name.trim(),
                  kcal: Number(draft.kcal) || 0,
                  p: Number(draft.p) || 0,
                  c: Number(draft.c) || 0,
                  f: Number(draft.f) || 0,
                  fiber: Number(draft.fiber) || 0,
                };
                actions.addFood({ ...entry, at: at() });
                actions.addFavorite(entry);
                setDraft(BLANK);
              }}
            >
              Add
            </Btn>
          </div>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <p className="text-[13.5px] font-semibold">
            Weight {latest ? `· ${latest.lb} lb` : ""}
            {sorted.length > 1 ? (
              <span className="num ml-1 font-normal text-muted">
                ({Math.round((latest.lb - sorted[0].lb) * 10) / 10 > 0 ? "+" : ""}
                {Math.round((latest.lb - sorted[0].lb) * 10) / 10} since start)
              </span>
            ) : null}
          </p>
          {sorted.length > 1 ? (
            <div className="mt-1">
              <Trend values={sorted.slice(-8).map((w) => w.lb)} />
            </div>
          ) : null}
          <div className="mt-2 flex items-end gap-2">
            <Field label="Today (lb)" className="flex-1">
              <input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={latest ? String(latest.lb) : "185"} />
            </Field>
            <Btn
              variant="quiet"
              disabled={!(Number(weight) > 0)}
              onClick={() => {
                actions.addWeight(Number(weight));
                setWeight("");
              }}
            >
              Save
            </Btn>
          </div>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <p className="text-[13.5px] font-semibold">Daily targets</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(
              [
                ["kcal", "Calories"],
                ["p", "Protein"],
                ["fiber", "Fiber"],
              ] as const
            ).map(([k, label]) => (
              <Field key={k} label={label}>
                <input
                  inputMode="numeric"
                  defaultValue={String(goals[k])}
                  onBlur={(e) => actions.setGoals({ ...goals, [k]: Number(e.target.value) || 0 })}
                />
              </Field>
            ))}
          </div>
        </div>

        <p className="num mt-3 text-[12px] text-muted">Fiber {fiber} g on this day</p>
      </Disclosure>
    </div>
  );
}
