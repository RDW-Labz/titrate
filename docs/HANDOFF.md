# Titrate — session handoff

Paste this into a fresh session to resume. Written 2026-10-23, updated after the push to `main`.

## What it is

A mobile-first peptide + GLP-1 protocol tracker. Runs entirely in the browser: no accounts, no server,
no database. All state is `localStorage` under `titrate.v1` (one-key backup in `titrate.v1.backup`);
progress photos are IndexedDB `titrate-photos` because images blow the 5 MB key budget.

Repo `~/peptide-tracker` — Next 16.4.2, React 19, Tailwind 4, TypeScript. 47 files, ~5.9k lines in `src/`.
Pushed to `https://github.com/RDW-Labz/titrate` (private), branch `main`, nothing deployed yet.

## Run + verify

```bash
cd ~/peptide-tracker
lsof -nP -iTCP:3000 -sTCP:LISTEN | awk 'NR>1{print $2}' | xargs -r kill   # never pkill by name
pnpm test                     # 27 node:test checks, must print "pass 27 / fail 0"
pnpm build && (./node_modules/.bin/next start -p 3000 >/tmp/titrate-run.log 2>&1 < /dev/null &)
```
Server runs at `http://localhost:3000`. Test file: `scripts/selfcheck.mts` (explicit path, not a directory).
`src/lib/*` uses explicit `.ts` import specifiers so Node can strip types and run the real modules.

## Screens (all hand-built React; no generative layer except `/assistant`)

| Route | Job |
|---|---|
| `/` | Hero: countdown ring, level mini-curve, one-tap Log (locks after the dose), site link, skip, week dots, other compounds, log-all, protein, "Any side effects?" sheet |
| `/protocols` | Your compounds: search (stack + library + screens), 28-day adherence donut, archive toggle |
| `/protocols/[id]` | Level chart with 7-day projection, Log, cycle bar; vial, dose, schedule, history behind one More |
| `/protocols/new?p=` | Prefilled setup, one tap to create |
| `/start` | First run: GLP-1 pen vs mixing your own vial |
| `/calc` | Reconstitution: vial + water + dose + syringe → units, barrel drawn to scale |
| `/food` | Day stepper, protein/kcal rings, water, weight, favourite chips, list, More (add food, targets, trend) |
| `/photos` | Progress photos (IndexedDB, shrunk to ≤1200 px) |
| `/library`, `/library/[id]` | 20 compounds: half-life, tmax, range, cycle convention |
| `/summary` | Clinician one-pager, copy/share, **Print → PDF** |
| `/symptoms` | Side effects, 30 days, severity dots, delete |
| `/settings` | Reminders, backup/restore/undo, doses CSV, calendar .ics, Type it, summary, reset, install hint |
| `/assistant` | "Type it": a sentence → OpenUI Lang → card built from your protocol, button writes the dose |

## Domain logic worth not re-deriving

- **Recon**: `mcg/mL = mg*1000/waterMl`, `units = (dose/mcgPerMl)*unitsPerMl`. U-100 vs U-40 is the common
  error. More water = **more** units for the same dose, so overflow advice names the volume that fits
  (`waterToFit`), never "add water".
- **Levels**: one-compartment + first-order absorption, superposition, `ka` solved from `tmax`. Normalised
  so one dose peaks at 100 %; the chart projects scheduled doses forward as a dashed tail.
- **Schedule/cycle/titration**: due = `scheduledOn && inCycle && no entry that day`; a *skipped* entry
  satisfies the day but never counts as taken. Dose in force = latest titration step on or before the day.
- **Adherence**: 28-day window, skips count as missing. Tested in `src/lib/adherence.ts`.

## Traps already paid for

- **Print PDF was blank**: entrance animations are `fill-mode: both` from `opacity: 0`, and a print
  re-layout restarts them. Print CSS kills animations and pins `.page-in`. Verify by `Page.printToPDF`
  and asserting `/Font` exists — emulating print media passes on a blank page.
- **Deleting a route** leaves `.next/dev/types/validator.ts` importing it → `TS2307` on the next build.
  `rm -rf .next`, rebuild.
- **Counting "visible" controls** with `getBoundingClientRect` includes children of collapsed
  disclosures. Count what a state flag actually renders.
- `text-transform: uppercase` changes `innerText` — DOM checks for card labels must be case-insensitive.
- Never `pnpm build` while a server holds `.next`: every route but `/` then 404s.
- Accessible contrast: accent `#0d7460` (was `#0e7c66`, 4.41 on accent-soft). All screens ≥ AA now.

## Open work, in the order it was queued

1. **Model-backed Type it** — `parseLine()` in `src/lib/intent.ts` is deterministic; replacing it with a
   fetch that returns OpenUI Lang is the whole change. Needs an API key + a route (breaks the no-server rule).
2. **Deploy** — Vercel import of `RDW-Labz/titrate` (repo is pushed and current).
3. Native-only ideas deliberately unbuilt: Health sync, real home-screen widgets, push reminders (all need a
   shell). Manifest shortcuts + calendar export are the web substitutes already shipped.

Done: **overlay a11y** — `useDialog(open, onClose)` in `src/components/ui.tsx` gives all three overlays
(`SymptomSheet`, photo viewer, `SitePicker`) a focus trap, Escape, and focus return to the trigger; the Type it
card host is `aria-live="polite"`. Verified in the DOM with real Tab/Shift-Tab/Escape keystrokes. Not done:
body scroll still moves behind an open sheet, and the backdrop is mouse-only (no tabbable Close).

## Conventions the user expects

Long autonomous stretches — ship, test, build, commit, verify in the DOM, then one short report. Commit per
change with `-c user.name="Hermes" -c user.email="hermes@local"`. Delete rather than defend when the user
says the app is too much. Reference values are published pharmacology, never a recommendation.
