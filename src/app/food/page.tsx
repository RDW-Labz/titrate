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
  const yesterday = foods.filter(
    (f) => dayKey(new Date(f.at)) === dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)),
  );
  const kcal = today.reduce((n, f) => n + f.kcal, 0);
  const protein = today.reduce((n, f) => n + f.p, 0);
  const fiber = today.reduce((n, f) => n + f.fiber, 0);
  const latest = [...weights].sort((a, b) => a.at.localeCompare(b.at)).pop();

  return (
    <div className="pt-3">
      <PageTitle meta={now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}>Food</PageTitle>

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
            onClick={() => actions.addFood({ name: f.name, kcal: f.kcal, p: f.p, c: f.c, f: f.f, fiber: f.fiber })}
            className="press rounded-full bg-card px-3.5 py-2 text-[13.5px] font-medium shadow-card"
          >
            {f.name} <span className="num text-muted">{f.kcal}</span>
          </button>
        ))}
      </div>

      {yesterday.length > 0 && today.length === 0 ? (
        <button
          onClick={() =>
            yesterday.forEach((f) => actions.addFood({ name: f.name, kcal: f.kcal, p: f.p, c: f.c, f: f.f, fiber: f.fiber }))
          }
          className="press mt-2 w-full rounded-[22px] bg-card px-4 py-3.5 text-left shadow-card"
        >
          <span className="text-[15px] font-medium">Same as yesterday</span>
          <span className="num block text-[12.5px] text-muted">
            copies {yesterday.length} {yesterday.length === 1 ? "entry" : "entries"} · {yesterday.reduce((n, f) => n + f.kcal, 0)} kcal
          </span>
        </button>
      ) : null}

      <ul className="mt-3 divide-y divide-line rounded-[24px] bg-card shadow-card">
        {today.length === 0 ? (
          <li className="px-4 py-5 text-center text-[13.5px] text-muted">Tap one above, or add your own.</li>
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
                className="press grid size-9 place-items-center text-[15px] text-muted"
              >
                ✕
              </button>
            </li>
          ))
        )}
      </ul>

      <details className="mt-3 rounded-[24px] bg-card px-4 py-3.5 shadow-card">
        <summary className="cursor-pointer text-[15px] font-semibold">More</summary>

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
              Add
            </Btn>
          </div>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <p className="text-[13.5px] font-semibold">Weight {latest ? `· ${latest.lb} lb` : ""}</p>
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
        </div>

        <p className="num mt-3 text-[12px] text-muted">Fiber {fiber} g today</p>
      </details>
    </div>
  );
}
