import type { Compound, DoseLog } from "./types";

/** the dose log as CSV, oldest first, quoted for anything a spreadsheet might split */
export function dosesCsv(doses: DoseLog[], compounds: Compound[]): string {
  const rows = [
    ["date", "time", "compound", "dose", "unit", "units_drawn", "site", "skipped"],
    ...doses
      .slice()
      .sort((a, b) => +new Date(a.at) - +new Date(b.at))
      .map((d) => {
        const at = new Date(d.at);
        const c = compounds.find((x) => x.id === d.compoundId);
        return [
          at.toLocaleDateString("en-CA"),
          at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          c?.name ?? "",
          String(d.dose),
          d.unit,
          d.units ? String(d.units) : "",
          d.site ?? "",
          d.skipped ? "yes" : "",
        ];
      }),
  ];
  return rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
}
