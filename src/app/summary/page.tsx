"use client";

import Link from "next/link";
import { Btn } from "@/components/ui";
import { toast } from "@/components/toast";
import { doseOn } from "@/lib/titration";
import { addDays, cycleInfo, dayKey, inCycle, loggedOn, scheduledOn } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { budDaysLeft, beyondUseDate, scheduleLabel, vialStatus } from "@/lib/vial";

export default function SummaryPage() {
  const { compounds, doses, vials, symptoms, weights, goals, foods } = useStore();
  const now = new Date();

  const archivedCount = compounds.filter((c) => c.archived).length;
  const rows = compounds.filter((c) => !c.archived).map((c) => {
    let due = 0;
    let logged = 0;
    for (let i = 0; i < 28; i++) {
      const day = addDays(now, -i);
      if (scheduledOn(c, day) && inCycle(c, day)) {
        due++;
        if (loggedOn(doses, c.id, day)) logged++;
      }
    }
    const vial = vials.find((v) => v.id === c.vialId);
    const status = vial ? vialStatus(vial, c, doses) : null;
    const bud = vial ? budDaysLeft(vial, now) : null;
    return { c, due, logged, vial, status, bud, cycle: cycleInfo(c, now) };
  });

  const recent = [...doses]
    .filter((d) => +new Date(d.at) > +now - 14 * 86_400_000)
    .sort((a, b) => +new Date(b.at) - +new Date(a.at));

  const symptomCounts = symptoms
    .filter((s) => +new Date(s.at) > +now - 30 * 86_400_000)
    .reduce<Record<string, number>>((acc, s) => ({ ...acc, [s.name]: (acc[s.name] ?? 0) + 1 }), {});

  const sortedW = [...weights].sort((a, b) => a.at.localeCompare(b.at));
  const latestW = sortedW[sortedW.length - 1];
  const deltaW = latestW && sortedW[0] ? Math.round((latestW.lb - sortedW[0].lb) * 10) / 10 : null;

  const protein = foods
    .filter((f) => dayKey(new Date(f.at)) === dayKey(now))
    .reduce((n, f) => n + f.p, 0);

  return (
    <div className="pt-3">
      <div className="no-print">
        <Link href="/settings" className="press -my-1 inline-block py-1.5 text-[14px] font-medium text-accent">
          ‹ Settings
        </Link>
      </div>

      <header className="mt-2 flex items-end justify-between px-1">
        <div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.025em]">Protocol summary</h1>
          <p className="num mt-1 text-[12.5px] text-muted">
            {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="no-print flex gap-2">
          <Btn
            size="sm"
            variant="quiet"
            onClick={async () => {
              const lines = [
                `Protocol — ${now.toLocaleDateString()}`,
                ...rows.map(
                  ({ c, due, logged }) =>
                    `• ${c.name} ${doseOn(c, now)} ${c.unit}, ${scheduleLabel(c)}${due ? ` — ${Math.round((logged / due) * 100)}% on time (${logged}/${due})` : ""}`,
                ),
                latestW ? `Weight ${latestW.lb} lb${deltaW !== null ? ` (${deltaW > 0 ? "+" : ""}${deltaW})` : ""}` : "",
                Object.keys(symptomCounts).length
                  ? `Side effects: ${Object.entries(symptomCounts).map(([k, v]) => `${k} ×${v}`).join(", ")}`
                  : "",
              ].filter(Boolean);
              const text = lines.join("\n");
              // share sheet first on phones, clipboard second, textarea last
              if (navigator.share) {
                try {
                  await navigator.share({ title: "Protocol summary", text });
                  toast("Shared");
                  return;
                } catch {
                  // user dismissed the sheet — fall through to the clipboard
                }
              }
              try {
                await navigator.clipboard.writeText(text);
                toast("Copied");
              } catch {
                // clipboard API is gated in some browsers; the textarea trick still works
                const ta = document.createElement("textarea");
                ta.value = text;
                ta.style.position = "fixed";
                ta.style.opacity = "0";
                document.body.append(ta);
                ta.select();
                const ok = document.execCommand("copy");
                ta.remove();
                toast(ok ? "Copied" : "Select the text to copy");
              }
            }}
          >
            Copy
          </Btn>
          <Btn size="sm" className="no-print" onClick={() => window.print()}>
            Print
          </Btn>
        </div>
      </header>

      <section className="mt-3 overflow-hidden rounded-[20px] bg-card shadow-card ring-1 ring-black/[0.03]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line text-[11px] text-muted">
              <th className="px-3 py-2 font-medium">Compound</th>
              <th className="px-3 py-2 font-medium">Dose</th>
              <th className="px-3 py-2 font-medium">Schedule</th>
              <th className="px-3 py-2 text-right font-medium">28 d</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-[13px] text-muted">
                  Nothing tracked yet.
                </td>
              </tr>
            ) : (
              rows.map(({ c, due, logged, vial, status, bud, cycle }) => (
                <tr key={c.id} className="border-b border-line/70 align-top last:border-0">
                  <td className="px-3 py-2.5">
                    <span className="text-[13.5px] font-medium">{c.name}</span>
                    <span className="block text-[11.5px] text-muted">
                      {cycle ? `${cycle.phase} · day ${cycle.dayInPhase}/${cycle.phaseLength}` : "continuous"}
                    </span>
                  </td>
                  <td className="num px-3 py-2.5 text-[12.5px]">
                    {doseOn(c, now)} {c.unit}
                    {status?.unitsPerDose ? (
                      <span className="block text-[11px] text-muted">{Math.round(status.unitsPerDose * 2) / 2} u</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-[12.5px]">
                    {scheduleLabel(c)}
                    <span className="block text-[11px] text-muted">
                      {vial ? `use by ${beyondUseDate(vial).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : "pen"}
                      {bud !== null && bud < 0 ? " · expired" : ""}
                    </span>
                  </td>
                  <td className="num px-3 py-2.5 text-right text-[12.5px]">
                    {due ? `${Math.round((logged / due) * 100)}%` : "—"}
                    <span className="block text-[11px] text-muted">
                      {logged}/{due}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="mt-3 grid grid-cols-3 gap-2 px-1 text-[12.5px]">
        <div>
          <p className="text-[11.5px] text-muted">Weight</p>
          <p className="num">{latestW ? `${latestW.lb} lb` : "—"}</p>
          {deltaW !== null ? <p className="num text-[11px] text-muted">{deltaW > 0 ? "+" : ""}{deltaW} lb</p> : null}
        </div>
        <div>
          <p className="text-[11.5px] text-muted">Protein today</p>
          <p className="num">
            {protein} / {goals.p} g
          </p>
        </div>
        <div>
          <p className="text-[11.5px] text-muted">Side effects 30 d</p>
          <p className="num">
            {Object.keys(symptomCounts).length
              ? Object.entries(symptomCounts).map(([k, v]) => `${k} ${v}`).join(" · ")
              : "none logged"}
          </p>
        </div>
      </section>

      <section className="mt-4">
        <h2 className="px-1 text-[13px] font-semibold">Last 14 days</h2>
        <ul className="mt-2 divide-y divide-line rounded-[20px] bg-card shadow-card ring-1 ring-black/[0.03]">
          {recent.length === 0 ? (
            <li className="px-3 py-3 text-[12.5px] text-muted">No doses logged.</li>
          ) : (
            recent.map((d) => {
              const c = compounds.find((x) => x.id === d.compoundId);
              const at = new Date(d.at);
              return (
                <li key={d.id} className="flex items-baseline justify-between px-3 py-2 text-[12.5px]">
                  <span className="num">
                    {at.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    <span className="text-muted"> {at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
                  </span>
                  <span className="min-w-0 flex-1 truncate px-2">{c?.name ?? "—"}</span>
                  <span className="num text-right">
                    {d.skipped ? "skipped" : `${d.dose} ${d.unit}`}
                    {d.site ? <span className="block text-[10.5px] text-muted">{d.site}</span> : null}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      </section>

      {archivedCount ? (
        <p className="mt-3 px-1 text-[11.5px] text-muted">
          {archivedCount} archived peptide{archivedCount === 1 ? "" : "s"} hidden — history is still stored on the device.
        </p>
      ) : null}

      <p className="mt-4 px-1 text-[11px] leading-relaxed text-muted">
        Generated by Titrate from self-reported logs. Published reference values only — not medical advice.
      </p>
    </div>
  );
}
