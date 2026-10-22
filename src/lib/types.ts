export type Unit = "mcg" | "mg" | "iu";
export type Category = "glp1" | "repair" | "growth" | "metabolic" | "cosmetic" | "other";

export type Peptide = {
  id: string;
  name: string;
  aka?: string;
  category: Category;
  halfLifeH: number;
  tmaxH: number;
  unit: Unit;
  route: "subq" | "pen" | "oral";
  /** common researched range, per dose, in `unit` */
  range: [number, number];
  frequency: string;
  cycle?: string;
  blurb: string;
  note?: string;
};

/** every N days from startDate, or listed weekdays (0 = Sunday) */
export type Schedule = { kind: "every"; everyDays: number } | { kind: "weekly"; days: number[] };

export type Compound = {
  id: string;
  peptideId: string;
  name: string;
  dose: number;
  unit: Unit;
  schedule: Schedule;
  /** on/off cycle in days, e.g. 8 weeks on / 4 off = 56/28 */
  cycle?: { onDays: number; offDays: number };
  startDate: string; // yyyy-mm-dd
  vialId?: string;
  /** GLP-1 pens: concentration printed on the pen */
  pen?: { mgPerMl: number; unitsPerMl: number };
  notes?: string;
};

export type Vial = {
  id: string;
  peptideId: string;
  totalMg: number;
  waterMl: number;
  mixedOn: string; // yyyy-mm-dd
  unitsPerMl: 100 | 40; // U-100 or U-40 syringe
  label?: string;
};

export type DoseLog = {
  id: string;
  compoundId: string;
  at: string; // ISO datetime
  dose: number;
  unit: Unit;
  units?: number; // syringe units drawn
  site?: string;
  skipped?: boolean;
};

export type FoodLog = {
  id: string;
  at: string; // ISO datetime
  name: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  fiber: number;
};

export type WeightLog = { at: string; lb: number };

export type Goals = { kcal: number; p: number; c: number; f: number; fiber: number };

export type Food = {
  name: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  fiber: number;
  glp1?: boolean;
};

export type State = {
  compounds: Compound[];
  vials: Vial[];
  doses: DoseLog[];
  foods: FoodLog[];
  weights: WeightLog[];
  goals: Goals;
  favorites: Food[];
};
