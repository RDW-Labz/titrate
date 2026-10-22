"use client";

import { useState } from "react";
import { Btn, Field, PageTitle, Ring } from "@/components/ui";
import { dayKey } from "@/lib/schedule";
import { actions, useStore } from "@/lib/store";

const BLANK = { name: "", kcal: "", p: "", c: "", f: "", fiber: "" };

export default function FoodPage() {
  const { foods, goals, favorites, weights } = useStore();
  const now = new Date();
  const [draft, setDraft] = useState(BLANK);
  const [weight, setWeight] = useState("");

  const today = foods.filter((f) => dayKey(new Date(f.at)) === dayKey(now));
  const kcal = today.reduce((n, f) => n + f.kcal, 0);
  const protein = today.reduce((n, f) => n + f.p, 0);
  const fiber = today.reduce((n, f) => n + f.fiber, 0);
  const sorted = [...weights].sort((a, b) => a.at.localeCompare(b.at));
  const latest = sorted[sorted.length - 1];
  const delta = latest && sorted[0] ? Math.round((latest.lb - sorted[0].lb) * 10) / 10 : null;

  return (
    <div className="pt-3">
      <PageTitle meta={now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}>Food</PageTitle>

      <section className="enter rounded-2xl bg-card px-4 py-5">
        <div className="flex items-center justify-around">
          <Ring value={protein} max={goals.p} label="protein" size={100} />
          <Ring value={kcal} max={goals.kcal} label="calories" size={100} />
        </div>
        <p className="mt-3 text-center text-[13px] text-muted">
          {protein >= goals.p ? "Protein done. Nice." : `${Math.max(0, goals.p - protein)} g of protein left`}
        </p>
      </section>

      <div className="mt-3 flex flex-wrap gap-2">
        {favorites.slice(0, 6).map((f) => (
          <button
            key={f.name}
            onClick={() => actions.addFood({ name: f.name, kcal: f.kcal, p: f.p, c: f.c, f: f.f, fiber: f.fiber })}
            className="press rounded-full bg-card px-3.5 py-2 text-[13.5px] font-medium"
          >
            {f.name} <span className="num text-muted">{f.kcal}</span>
          </button>
        ))}
      </div>

      <ul className="mt-3 divide-y divide-line rounded-2xl bg-card">
        {today.length === 0 ? (
          <li className="px-4 py-5 text-center text-[13.5px] text-muted">Tap one above to log breakfast.</li>
        ) : (
          today.map((f) => (
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
                className="press px-2 text-[15px] text-muted"
              >
                ✕
              </button>
            </li>
          ))
        )}
      </ul>

      <details className="mt-3 rounded-2xl bg-card px-4 py-3">
        <summary className="cursor-pointer text-[14px] font-semibold">Add something else</summary>
        <div className="mt-3 space-y-3">
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
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <input inputMode="decimal" value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
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
              actions.addFood(entry);
              actions.addFavorite(entry);
              setDraft(BLANK);
            }}
          >
            Add to today
          </Btn>
        </div>
      </details>

      <details className="mt-3 rounded-2xl bg-card px-4 py-3">
        <summary className="cursor-pointer text-[14px] font-semibold">
          Weight{latest ? ` · ${latest.lb} lb` : ""}
          {delta !== null ? <span className="num text-muted"> ({delta > 0 ? "+" : ""}{delta})</span> : null}
        </summary>
        <div className="mt-3 flex items-end gap-2">
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
      </details>

      <details className="mt-3 rounded-2xl bg-card px-4 py-3">
        <summary className="cursor-pointer text-[14px] font-semibold">Daily targets</summary>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(
            [
              ["kcal", "Calories"],
              ["p", "Protein"],
              ["c", "Carbs"],
              ["f", "Fat"],
              ["fiber", "Fiber"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                inputMode="numeric"
                defaultValue={String(goals[key])}
                onBlur={(e) => actions.setGoals({ ...goals, [key]: Number(e.target.value) || 0 })}
              />
            </Field>
          ))}
        </div>
      </details>

      <p className="mt-4 px-1 text-[12px] text-muted">
        Fiber {fiber} g today. On a GLP-1, protein and fiber are the two numbers worth watching.
      </p>
    </div>
  );
}