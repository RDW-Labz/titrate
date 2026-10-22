"use client";

import Link from "next/link";
import { PageTitle } from "@/components/ui";
import { dayKey } from "@/lib/schedule";
import { actions, useStore } from "@/lib/store";

const NAMES = ["Nausea", "Fatigue", "Headache", "Constipation", "Bloating"];

export default function SymptomsPage() {
  const { symptoms } = useStore();
  const now = new Date();
  const cutoff = +now - 30 * 86_400_000;
  const recent = symptoms
    .filter((s) => +new Date(s.at) >= cutoff)
    .sort((a, b) => +new Date(b.at) - +new Date(a.at));

  const counts = recent.reduce<Record<string, number>>((acc, s) => ({ ...acc, [s.name]: (acc[s.name] ?? 0) + 1 }), {});

  const byDay = recent.reduce<Record<string, typeof recent>>((acc, s) => {
    const k = dayKey(new Date(s.at));
    return { ...acc, [k]: [...(acc[k] ?? []), s] };
  }, {});

  return (
    <div className="pt-3">
      <Link href="/" className="press -my-1 inline-block py-1.5 text-[14px] font-medium text-accent">
        ‹ Today
      </Link>
      <PageTitle meta="Last 30 days. Tap the dots to change how bad it was.">Side effects</PageTitle>

      {recent.length === 0 ? (
        <div className="rounded-[24px] bg-card px-5 py-8 text-center shadow-card">
          <p className="text-[16px] font-semibold">Nothing logged</p>
          <p className="mx-auto mt-1.5 max-w-[28ch] text-[13.5px] text-muted">
            The chips on Today land here — one tap each, so you can see what a dose actually did.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {NAMES.filter((n) => counts[n]).map((n) => (
              <span key={n} className="rounded-full bg-warn-soft px-3 py-1.5 text-[12.5px] font-medium text-warn">
                {n} ×{counts[n]}
              </span>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {Object.entries(byDay).map(([day, items]) => (
              <section key={day} className="rounded-[24px] bg-card px-4 py-3 shadow-card">
                <p className="text-[12.5px] font-semibold text-muted">
                  {day === dayKey(now)
                    ? "Today"
                    : new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </p>
                <ul className="mt-1 divide-y divide-line">
                  {items.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 py-2">
                      <span className="num w-[62px] shrink-0 text-[12.5px] text-muted">
                        {new Date(s.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      </span>
                      <span className="flex-1 text-[14px]">{s.name}</span>
                      <span className="flex gap-1" aria-label={`Severity ${s.severity} of 3`}>
                        {[1, 2, 3].map((n) => (
                          <button
                            key={n}
                            aria-label={`Set ${s.name} severity ${n}`}
                            onClick={() => actions.updateSymptom(s.id, { severity: n as 1 | 2 | 3 })}
                            className={`size-2.5 rounded-full ${n <= s.severity ? "bg-warn" : "bg-line"}`}
                          />
                        ))}
                      </span>
                      <button
                        aria-label={`Delete ${s.name}`}
                        onClick={() => actions.deleteSymptom(s.id)}
                        className="press grid size-9 place-items-center text-[13px] text-muted"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
