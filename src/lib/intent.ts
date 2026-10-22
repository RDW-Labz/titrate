import { PEPTIDES } from "./peptides.ts";
import type { Compound, Unit } from "./types";

/**
 * A typed line becomes one of three shapes. This is a stand-in for a model: same
 * output contract (OpenUI Lang), no network call, and it can be swapped for a real
 * model without touching the cards.
 */
export type Line =
  | { kind: "log"; peptide: string; compoundId?: string; dose: number; unit: Unit; when: string; site: string; at: Date }
  | { kind: "level"; peptide: string; compoundId?: string }
  | { kind: "recon"; vialMg: number; waterMl: number; dose: number };

const NAME_HINTS: Record<string, string> = {
  bpc: "bpc-157",
  "bpc-157": "bpc-157",
  tb: "tb-500",
  "tb-500": "tb-500",
  tirz: "tirzepatide",
  tirzepatide: "tirzepatide",
  sema: "semaglutide",
  semaglutide: "semaglutide",
  reta: "retatrutide",
  retatrutide: "retatrutide",
  ipa: "ipamorelin",
  ipamorelin: "ipamorelin",
  cjc: "cjc-1295-no-dac",
  ghk: "ghk-cu",
  mots: "mots-c",
  ipa2: "ipamorelin",
  tesamorelin: "tesamorelin",
  sermorelin: "sermorelin",
  liraglutide: "liraglutide",
  hcg: "hcg",
  epitalon: "epitalon",
  pt: "pt-141",
  melanotan: "melanotan-ii",
};

const SITE_WORDS: [RegExp, string][] = [
  [/left\s+(?:delt|shoulder)/i, "Left deltoid"],
  [/right\s+(?:delt|shoulder)/i, "Right deltoid"],
  [/left\s+(?:ab|belly|stomach|tummy)/i, "Left abdomen"],
  [/right\s+(?:ab|belly|stomach|tummy)/i, "Right abdomen"],
  [/left\s+(?:thigh|leg)/i, "Left thigh"],
  [/right\s+(?:thigh|leg)/i, "Right thigh"],
  [/left\s+(?:glute|hip|butt)/i, "Left glute"],
  [/right\s+(?:glute|hip|butt)/i, "Right glute"],
];

const findCompound = (text: string, compounds: Compound[]): { name: string; id?: string } | null => {
  const lower = text.toLowerCase();
  for (const c of compounds) {
    const head = c.name.toLowerCase().split(/[\s-]/)[0];
    if (head.length >= 3 && lower.includes(head)) return { name: c.name, id: c.id };
  }
  for (const [hint, id] of Object.entries(NAME_HINTS)) {
    if (new RegExp(`\\b${hint.replace("-", "[- ]?")}\\b`).test(lower)) {
      const known = compounds.find((c) => c.peptideId === id);
      const peptide = PEPTIDES.find((p) => p.id === id);
      return { name: known?.name ?? peptide?.name ?? hint.toUpperCase(), id: known?.id };
    }
  }
  return null;
};

const site = (text: string) => SITE_WORDS.find(([re]) => re.test(text))?.[1];

/** time of day from words; a bare "yesterday" lands at 9am the day before */
function at(text: string, now: Date): { at: Date; when: string } {
  const yesterday = /yesterday/i.test(text);
  const base = new Date(now);
  if (yesterday) base.setDate(base.getDate() - 1);
  if (/morning|am\b/i.test(text)) {
    base.setHours(9, 0, 0, 0);
    return { at: base, when: yesterday ? "yesterday morning" : "this morning" };
  }
  if (/evening|tonight|night|pm\b/i.test(text)) {
    base.setHours(21, 0, 0, 0);
    return { at: base, when: yesterday ? "yesterday evening" : "tonight" };
  }
  return { at: base, when: yesterday ? "yesterday" : "just now" };
}

export function parseLine(text: string, compounds: Compound[], now = new Date()): Line | null {
  const trimmed = text.trim();
  if (trimmed.length < 3) return null;
  const lower = trimmed.toLowerCase();

  // "5 mg in 2 ml for 250 mcg" — a mixing question
  const mg = lower.match(/(\d+(?:\.\d+)?)\s*mg/);
  const ml = lower.match(/(\d+(?:\.\d+)?)\s*ml/);
  if (mg && ml) {
    const dose = lower.match(/(\d+(?:\.\d+)?)\s*(?:mcg|µg)/);
    return { kind: "recon", vialMg: Number(mg[1]), waterMl: Number(ml[1]), dose: dose ? Number(dose[1]) : 250 };
  }

  // "how much is in me", "what's my level"
  const wantsLevel = /how much|level|in my (system|body)|am i at|peak|trough/i.test(lower);
  const named = findCompound(trimmed, compounds);
  if (wantsLevel) {
    const c = named ?? (compounds.find((x) => !x.archived) ? { name: compounds[0].name, id: compounds[0].id } : null);
    return c ? { kind: "level", peptide: c.name, compoundId: c.id } : null;
  }

  // otherwise: a dose was taken
  const amount = lower.match(/(\d+(?:\.\d+)?)\s*(mcg|µg|ug|mg|iu|units?)/);
  if (!amount || !named) return null;
  const raw = amount[2];
  const unit: Unit = raw === "mg" ? "mg" : raw === "iu" || raw === "unit" || raw === "units" ? "iu" : "mcg";
  const { at: when, when: label } = at(trimmed, now);
  return {
    kind: "log",
    peptide: named.name,
    compoundId: named.id,
    dose: Number(amount[1]),
    unit,
    when: label,
    site: site(trimmed) ?? "your usual spot",
    at: when,
  };
}

const q = (s: string) => `"${s.replace(/"/g, "")}"`;

/** the OpenUI Lang the cards above are written in — positional args, one line */
export function toLang(line: Line, extra?: { percent?: number; word?: string; nextIn?: string; units?: string }): string {
  if (line.kind === "log") {
    return `root = LogCard(${q(line.peptide)}, ${line.dose}, ${q(line.unit)}, ${q(line.when)}, ${q(line.site)})`;
  }
  if (line.kind === "level") {
    return `root = LevelCard(${q(line.peptide)}, ${Math.round(extra?.percent ?? 0)}, ${q(extra?.word ?? "cleared")}, ${q(extra?.nextIn ?? "no dose scheduled")})`;
  }
  return `root = ReconCard(${line.vialMg}, ${line.waterMl}, ${line.dose}, ${q(extra?.units ?? "—")})`;
}
