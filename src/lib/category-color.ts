import type { Category } from "./types";

/** one tone per category, used for list dots and library rows */
export const CATEGORY_DOT: Record<Category, string> = {
  glp1: "bg-accent",
  repair: "bg-[#4d8fd6]",
  growth: "bg-[#7b6bd6]",
  metabolic: "bg-warn",
  cosmetic: "bg-[#c9738f]",
  other: "bg-muted",
};
