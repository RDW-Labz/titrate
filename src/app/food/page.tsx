"use client";

import { useMemo, useState } from "react";
import { Btn, Card, Field, PageTitle, Pill, Ring, SectionHead, Stat } from "@/components/ui";
import { dayKey } from "@/lib/schedule";
import { actions, useStore } from "@/lib/store";

const BLANK = { name: "", kcal: "", p: "", c: "", f: "", fiber: "" };

export default function FoodPage() {
  const { foods, goals, favorites, weights } = useStore();
  const now = new Date();
  const [draft, setDraft] = useState(BLANK);
  const [weight, setWeight] = useState("");
  const [goalDraft, setGoalDraft] = useState<Record<string, string>>({});

  const today = foods.filter((f) => dayKey(new Date(f.at)) === dayKey(now));
  const total = useMemo(
    () =>
      today.reduce(
        (a, f) => ({ kcal: a.kcal + f.kcal, p: a.p + f.p, c: a.c + f.c, f: a.f + f.f, fiber: a.fiber + f.fiber }),
        { kcal: 0, p: 0, c: 0, f: 0, fiber: 0 },
      ),
    [today],
  );

  const sorted = [...weights].sort((a, b) => a.at.localeCompare(b.at));
  const latest = sorted[sorted.length - 1];
  const delta = latest && sorted[0] ? Math.round((latest.lb - sorted[0].lb) * 10) / 10 : null;
  const proteinLeft = Math.max(0, goals.p - total.p);

  return (
    <div>
      <PageTitle meta={now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}>
        Nutrition
      </PageTitle>

      <Card className="p-4">
        <div className="flex items-start justify-around">
          <Ring value={total.kcal} max={goals.kcal} label="calories" size={84} />
          <Ring value={total.p} max={goals.p} label="protein" size={84} />
          <Ring value={total.fiber} max={goals.fiber} label="fiber" size={84} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
          <Stat label="Carbs" value={`${Math.round(total.c)} g`} sub={`of ${goals.c}`} />
          <Stat label="Fat" value={`${Math.round(total.f)} g`} sub={`of ${goals.f}`} />
          <Stat label="Left to eat" value={`${Math.max(0, goals.kcal - total.kcal)}`} sub="kcal" />
        </div>
        {proteinLeft > 0 ? (
          <p className="mt-2 text-[12px] text-muted">
            {proteinLeft} g of protein to go. On a GLP-1 that is the number that protects lean mass — front-load
            it before appetite disappears.
          </p>
        ) : (
          <p className="mt-2 text-[12px] text-accent">Protein target hit for today.</p>
        )}
      </Card>

      <SectionHead right={latest ? <Pill tone="neutral">{latest.at}</Pill> : undefined}>Weight</SectionHead>
      <Card className="flex items-end gap-2 p-4">
        <div className="field flex-1">
          <label className="mb-1 block text-[12.5px] font-medium text-muted">Today (lb)</label>
          <input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={latest ? String(latest.lb) : "185"} />
        </div>
        <Btn
          variant="line"
          disabled={!(Number(weight) > 0)}
          onClick={() => {
            actions.addWeight(Number(weight));
            setWeight("");
          }}
        >
          Save
        </Btn>
        <div className="w-[92px] text-right">
          <Stat label="Total" value={latest ? `${latest.lb} lb` : "—"} sub={delta === null ? undefined : `${delta > 0 ? "+" : ""}${delta} lb`} />
        </div>
      </Card>

      <SectionHead>Quick add</SectionHead>
      <div className="flex flex-wrap gap-2 px-1">
        {favorites.map((f) => (
          <button
            key={f.name}
            onClick={() => actions.addFood({ name: f.name, kcal: f.kcal, p: f.p, c: f.c, f: f.f, fiber: f.fiber })}
            className="rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] hover:border-accent hover:text-accent"
          >
            {f.name} <span className="num text-muted">{f.kcal}</span>
          </button>
        ))}
      </div>

      <SectionHead>Add something else</SectionHead>
      <Card className="space-y-3 p-4">
        <Field label="Food">
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Chicken burrito bowl" />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["kcal", "Calories"],
              ["p", "Protein g"],
              ["c", "Carbs g"],
              ["f", "Fat g"],
              ["fiber", "Fiber g"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label} className={key === "kcal" ? "col-span-1" : ""}>
              <input
                inputMode="decimal"
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
            </Field>
          ))}
        </div>
        <Btn
          className="w-full"
          disabled={!draft.name.trim()}
          onClick={() => {
            actions.addFood({
              name: draft.name.trim(),
              kcal: Number(draft.kcal) || 0,
              p: Number(draft.p) || 0,
              c: Number(draft.c) || 0,
              f: Number(draft.f) || 0,
              fiber: Number(draft.fiber) || 0,
            });
            actions.addFavorite({
              name: draft.name.trim(),
              kcal: Number(draft.kcal) || 0,
              p: Number(draft.p) || 0,
              c: Number(draft.c) || 0,
              f: Number(draft.f) || 0,
              fiber: Number(draft.fiber) || 0,
            });
            setDraft(BLANK);
          }}
        >
          Add to today
        </Btn>
      </Card>

      <SectionHead right={<Pill tone="neutral">{today.length} entries</Pill>}>Today</SectionHead>
      <Card className="divide-y divide-line">
        {today.length === 0 ? (
          <p className="px-4 py-4 text-[13px] text-muted">Nothing yet. The quick adds above are one tap each.</p>
        ) : (
          today.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[13.5px]">{f.name}</p>
                <p className="num text-[11.5px] text-muted">
                  P {f.p} · C {f.c} · F {f.f} · fiber {f.fiber}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="num text-[13px]">{f.kcal}</span>
                <button
                  aria-label={`Delete ${f.name}`}
                  className="text-[12px] text-muted hover:text-alert"
                  onClick={() => actions.deleteFood(f.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </Card>

      <details className="mt-5 rounded-xl border border-line bg-card px-4 py-3">
        <summary className="cursor-pointer text-[13px] font-medium">Daily targets</summary>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(
            [
              ["kcal", "Calories"],
              ["p", "Protein g"],
              ["c", "Carbs g"],
              ["f", "Fat g"],
              ["fiber", "Fiber g"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                inputMode="numeric"
                value={goalDraft[key] ?? String(goals[key])}
                onChange={(e) => setGoalDraft({ ...goalDraft, [key]: e.target.value })}
              />
            </Field>
          ))}
        </div>
        <Btn
          variant="line"
          className="mt-3 w-full"
          onClick={() => {
            actions.setGoals({
              ...goals,
              ...Object.fromEntries(Object.entries(goalDraft).map(([k, v]) => [k, Number(v) || 0])),
            });
            setGoalDraft({});
          }}
        >
          Save targets
        </Btn>
      </details>
    </div>
  );
}
