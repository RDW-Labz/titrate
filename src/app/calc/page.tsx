"use client";

import { ReconCalculator } from "@/components/recon-calculator";
import { Card, PageTitle, SectionHead } from "@/components/ui";

export default function CalcPage() {
  return (
    <div>
      <PageTitle meta="Vial mg + water → the units you draw for one dose.">Reconstitution</PageTitle>
      <Card className="p-4">
        <ReconCalculator />
      </Card>

      <SectionHead>Reading it</SectionHead>
      <div className="space-y-2 px-1 text-[12.5px] leading-relaxed text-muted">
        <p>
          A 5 mg vial with 2 mL of water holds 2,500 mcg per mL. A 250 mcg dose is 0.1 mL — 10 units on a
          U-100 syringe.
        </p>
        <p>
          More water makes the math easier to draw accurately; it does not change how much peptide you get.
          Half-units matter below 10 u, which is why the result rounds to 0.5.
        </p>
        <p>
          U-40 syringes are marked for 40 units per mL. Using U-100 numbers on a U-40 barrel is the most
          common dosing error here — check the barrel, then pick the syringe above.
        </p>
      </div>
    </div>
  );
}