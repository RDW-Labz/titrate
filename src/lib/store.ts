"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Compound, DoseLog, Food, FoodLog, Goals, State, SymptomLog, Vial, WaterLog, WeightLog } from "./types.ts";
import { dayKey, parseDay, suggestSite } from "./schedule.ts";

const KEY = "titrate.v1";
const BACKUP = "titrate.v1.backup";

const DEFAULT_GOALS: Goals = { kcal: 2000, p: 150, c: 180, f: 65, fiber: 30 };

export const EMPTY: State = {
  compounds: [],
  vials: [],
  doses: [],
  foods: [],
  weights: [],
  symptoms: [],
  waters: [],
  goals: DEFAULT_GOALS,
  favorites: [
    { name: "Greek yogurt, plain", kcal: 146, p: 25, c: 9, f: 0, fiber: 0, glp1: true },
    { name: "Grilled chicken breast 4 oz", kcal: 187, p: 35, c: 0, f: 4, fiber: 0, glp1: true },
    { name: "Cottage cheese 1 cup", kcal: 180, p: 24, c: 8, f: 5, fiber: 0, glp1: true },
    { name: "Whey shake", kcal: 120, p: 25, c: 3, f: 1, fiber: 0, glp1: true },
    { name: "Lentil soup", kcal: 180, p: 12, c: 30, f: 2, fiber: 8, glp1: true },
    { name: "Eggs, 2 large", kcal: 143, p: 12, c: 1, f: 10, fiber: 0, glp1: true },
  ],
};

const uid = () => Math.round(Math.random() * 1e9).toString(36) + Date.now().toString(36).slice(-4);

let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<State>;
    return { ...EMPTY, ...parsed, goals: { ...DEFAULT_GOALS, ...parsed.goals } };
  } catch {
    return EMPTY;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: State) {
  state = next;
  try {
    // keep one previous snapshot so a bad edit or a cleared tab is recoverable
    const prev = localStorage.getItem(KEY);
    if (prev) localStorage.setItem(BACKUP, prev);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked — keep the in-memory state usable
  }
  emit();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot(): State {
  if (!loaded && typeof window !== "undefined") {
    state = read();
    loaded = true;
  }
  return state;
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

/** true once the browser store has been read — Shell gates rendering on it */
export function useReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}

export function update(fn: (s: State) => State) {
  commit(fn(getSnapshot()));
}

export const actions = {
  addCompound(c: Omit<Compound, "id">): Compound {
    const compound = { ...c, id: uid() };
    update((s) => ({ ...s, compounds: [...s.compounds, compound] }));
    return compound;
  },
  archiveCompound(id: string, archived: boolean) {
    update((s) => ({
      ...s,
      compounds: s.compounds.map((c) => (c.id === id ? { ...c, archived } : c)),
    }));
  },
  updateCompound(id: string, patch: Partial<Compound>) {
    update((s) => ({
      ...s,
      compounds: s.compounds.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  },
  removeCompound(id: string) {
    update((s) => {
      const vialId = s.compounds.find((c) => c.id === id)?.vialId;
      return {
        ...s,
        compounds: s.compounds.filter((c) => c.id !== id),
        doses: s.doses.filter((d) => d.compoundId !== id),
        vials: s.vials.filter((v) => v.id !== vialId),
      };
    });
  },
  addVial(v: Omit<Vial, "id">): Vial {
    const vial = { ...v, id: uid() };
    update((s) => ({ ...s, vials: [...s.vials, vial] }));
    return vial;
  },
  logDose(input: { compoundId: string; dose: number; unit: Compound["unit"]; units?: number; at?: Date; site?: string }): DoseLog {
    const dose: DoseLog = {
      id: uid(),
      compoundId: input.compoundId,
      dose: input.dose,
      unit: input.unit,
      units: input.units,
      site: input.site ?? suggestSite(getSnapshot().doses),
      at: (input.at ?? new Date()).toISOString(),
    };
    update((s) => ({ ...s, doses: [...s.doses, dose] }));
    return dose;
  },
  skipDose(compoundId: string, dose: number, unit: Compound["unit"]): DoseLog {
    const entry: DoseLog = { id: uid(), compoundId, dose, unit, at: new Date().toISOString(), skipped: true };
    update((s) => ({ ...s, doses: [...s.doses, entry] }));
    return entry;
  },
  deleteDose(id: string) {
    update((s) => ({ ...s, doses: s.doses.filter((d) => d.id !== id) }));
  },
  updateDose(id: string, patch: Partial<DoseLog>) {
    update((s) => ({ ...s, doses: s.doses.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  },
  setTitration(compoundId: string, steps: { at: string; dose: number }[]) {
    update((s) => ({
      ...s,
      compounds: s.compounds.map((c) =>
        c.id === compoundId ? { ...c, titration: [...steps].sort((a, b) => a.at.localeCompare(b.at)) } : c,
      ),
    }));
  },
  replace(next: State) {
    commit(next);
  },
  addFood(f: Omit<FoodLog, "id" | "at"> & { at?: Date }) {
    const entry: FoodLog = { ...f, id: uid(), at: (f.at ?? new Date()).toISOString() };
    update((s) => ({ ...s, foods: [...s.foods, entry] }));
  },
  deleteFood(id: string) {
    update((s) => ({ ...s, foods: s.foods.filter((f) => f.id !== id) }));
  },
  logSymptom(name: string, severity: SymptomLog["severity"] = 1) {
    const entry: SymptomLog = { id: uid(), at: new Date().toISOString(), name, severity };
    update((s) => ({ ...s, symptoms: [...s.symptoms, entry] }));
    return entry;
  },
  updateSymptom(id: string, patch: Partial<SymptomLog>) {
    update((s) => ({ ...s, symptoms: s.symptoms.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  },
  deleteSymptom(id: string) {
    update((s) => ({ ...s, symptoms: s.symptoms.filter((x) => x.id !== id) }));
  },
  addWater(ml: number, at = new Date()) {
    const entry: WaterLog = { id: uid(), at: at.toISOString(), ml };
    update((s) => ({ ...s, waters: [...s.waters, entry] }));
    return entry.id;
  },
  deleteWater(id: string) {
    update((s) => ({ ...s, waters: s.waters.filter((w) => w.id !== id) }));
  },
  addWeight(lb: number, at = new Date()) {
    update((s) => ({ ...s, weights: [...s.weights.filter((w) => w.at !== dayKey(at)), { at: dayKey(at), lb }] }));
  },
  setGoals(goals: Goals) {
    update((s) => ({ ...s, goals }));
  },
  addFavorite(f: Food) {
    update((s) => ({ ...s, favorites: [f, ...s.favorites.filter((x) => x.name !== f.name)] }));
  },
  removeFavorite(name: string) {
    update((s) => ({ ...s, favorites: s.favorites.filter((f) => f.name !== name) }));
  },
  reset() {
    commit({ ...EMPTY });
  },
  seed() {
    commit(demoState());
  },
};

function demoState(): State {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();
  const day = (offset: number, hour = 8) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset, hour);

  const tirz = {
    id: "demo-tirz",
    peptideId: "tirzepatide",
    name: "Tirzepatide",
    dose: 5,
    unit: "mg" as const,
    schedule: { kind: "every" as const, everyDays: 7 },
    startDate: day(38).toISOString().slice(0, 10),
    pen: { mgPerMl: 5, unitsPerMl: 100 },
  };
  const bpc = {
    id: "demo-bpc",
    peptideId: "bpc-157",
    name: "BPC-157",
    dose: 250,
    unit: "mcg" as const,
    schedule: { kind: "every" as const, everyDays: 1 },
    cycle: { onDays: 28, offDays: 14 },
    startDate: day(12).toISOString().slice(0, 10),
    vialId: "demo-vial-bpc",
  };
  const ipa = {
    id: "demo-ipa",
    peptideId: "ipamorelin",
    name: "Ipamorelin",
    dose: 200,
    unit: "mcg" as const,
    schedule: { kind: "weekly" as const, days: [1, 2, 3, 4, 5] },
    cycle: { onDays: 56, offDays: 28 },
    startDate: day(20).toISOString().slice(0, 10),
    vialId: "demo-vial-ipa",
  };

  const doses: DoseLog[] = [];
  const sites = ["Left abdomen", "Right abdomen", "Left thigh", "Right thigh"];
  for (let i = 38; i >= 0; i -= 7) {
    doses.push({
      id: `td${i}`,
      compoundId: "demo-tirz",
      dose: 5,
      unit: "mg",
      at: iso(day(i, 9)),
      site: sites[((38 - i) / 7) % 4],
    });
  }
  for (let i = 11; i >= 1; i--) {
    doses.push({ id: `b${i}`, compoundId: "demo-bpc", dose: 250, unit: "mcg", at: iso(day(i, 7)), units: 10, site: sites[i % 4] });
  }
  for (let i = 19; i >= 1; i--) {
    const d = day(i, 21);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    doses.push({ id: `i${i}`, compoundId: "demo-ipa", dose: 200, unit: "mcg", at: iso(d), units: 4 });
  }

  const foods: FoodLog[] = [
    { name: "Greek yogurt + berries", kcal: 190, p: 22, c: 18, f: 3, fiber: 3 },
    { name: "Chicken, rice, broccoli", kcal: 520, p: 46, c: 52, f: 12, fiber: 7 },
    { name: "Whey shake", kcal: 120, p: 25, c: 3, f: 1, fiber: 0 },
  ].map((f, i) => ({ ...f, id: `f${i}`, at: iso(day(0, 8 + i * 4)) }));

  const weights: WeightLog[] = Array.from({ length: 7 }, (_, i) => ({
    at: day(i * 7).toISOString().slice(0, 10),
    lb: Math.round((212 - (6 - i) * 2.4) * 10) / 10,
  }));

  const symptoms: SymptomLog[] = [
    { id: "sy1", at: iso(day(1, 21)), name: "Nausea", severity: 1 },
    { id: "sy2", at: iso(day(3, 9)), name: "Fatigue", severity: 2 },
    { id: "sy3", at: iso(day(6, 10)), name: "Headache", severity: 1 },
  ];

  return {
    ...EMPTY,
    compounds: [tirz, bpc, ipa],
    symptoms,
    vials: [
      {
        id: "demo-vial-bpc",
        peptideId: "bpc-157",
        totalMg: 5,
        waterMl: 2,
        mixedOn: parseDay(day(12).toISOString().slice(0, 10)).toISOString().slice(0, 10),
        unitsPerMl: 100,
        label: "BPC 5 mg + 2 mL",
      },
      {
        id: "demo-vial-ipa",
        peptideId: "ipamorelin",
        totalMg: 10,
        waterMl: 2,
        mixedOn: parseDay(day(20).toISOString().slice(0, 10)).toISOString().slice(0, 10),
        unitsPerMl: 100,
        label: "IPA 10 mg + 2 mL",
      },
    ],
    doses,
    foods,
    weights,
  };
}
