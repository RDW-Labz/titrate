"use client";

import { ReconCalculator } from "@/components/recon-calculator";
import { PageTitle } from "@/components/ui";

export default function CalcPage() {
  return (
    <div className="pt-3">
      <PageTitle meta="Vial + water in, units to draw out.">Calc</PageTitle>
      <section className="enter rounded-[24px] bg-card p-4 shadow-card">
        <ReconCalculator />
      </section>
      <p className="mt-4 px-1 text-[12.5px] leading-relaxed text-muted">
        More water makes it easier to draw accurately — it does not change the dose. Check whether your barrel
        is U-100 or U-40 before you draw.
      </p>
    </div>
  );
}