# Titrate — peptide protocol tracker

Mobile-first tracker for peptides and GLP-1s. Runs locally, no accounts, no server: all data lives in
`localStorage` under `titrate.v1`.

```bash
pnpm install
pnpm dev      # http://localhost:3000 (or 3001 if 3000 is taken)
pnpm test     # PK + reconstitution + schedule self-checks
pnpm build
```


## Screens

| Route | Job |
|---|---|
| `/` | Countdown-ring hero, one-tap log (locks until the next dose), site picker, week strip, side-effect chips |
| `/protocols` | Your compounds; tap the circle to log, tap the row for detail |
| `/protocols/[id]` | Level curve with a 7-day projection; vial, dose, schedule, titration, history behind one "More" |
| `/protocols/new` | Prefilled setup — pick a compound, everything else is guessed |
| `/start` | First-run chooser: GLP-1 pen vs mixing your own vial |
| `/calc` | Reconstitution: vial + water → units to draw, with the barrel drawn to scale |
| `/food` | Day-stepped nutrition, protein rings, quick adds, weight trend |
| `/library` | 20 compounds with half-life, peak, ranges, cycle convention |
| `/summary` | Printable / copyable protocol summary for a clinician |
| `/settings` | Reminders, JSON backup, doses CSV, restore, reset |
| `/studio` | OpenUI card renderer (dev surface) |

## What works

- **Dose + cycle tracking** — per compound: dose, schedule (every N days or Mon/Thu style), on/off
  cycle with a progress bar, one-tap logging with auto site rotation, dose history, titration.
- **Reconstitution** — vial mg + water mL → concentration → syringe units (U-100 0.3/0.5/1 mL, U-40),
  doses per vial, capacity warning. Saving a vial makes it count down as you log doses.
- **Estimated level curves** — one-compartment model with first-order absorption, superposition over
  every logged dose, half-life per compound. Shown as % of a single dose peak.
- **Nutrition** — calories/protein/fiber/carbs/fat against targets, quick-add favourites, custom foods,
  weight log. Protein-forward because that is what GLP-1 users actually need to watch.
- **GLP-1s + peptides** — 20 compounds with half-life, peak, common ranges, cycle convention.
- **OpenUI card studio** (`/studio`) — 3 house components render model-written OpenUI Lang.

## Deliberately not built yet

- No accounts, sync or server DB (single device).
- No Health/Apple integration, no home-screen widget — both need a native shell.
- No barcode/photo food database; foods are manual + favourites.
- No assistant chat yet: `/studio` proves the render half, the model call is the next step.

## Deploy

Next 16, no env vars, no database (data is per-browser localStorage).

1. Vercel → **Add New → Project → Import** `RDW-Labz/titrate`.
2. Framework preset: Next.js. Nothing else to configure.
3. After the first deploy, open the URL on a phone and **Add to Home Screen** — the manifest and icon are already in place.

Reference values are published pharmacology for tracking only — the app does not recommend doses.
