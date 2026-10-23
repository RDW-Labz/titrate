# Titrate — session handoff

Paste this into a fresh session to resume. Written 2026-10-23, updated after the push to `main`.

## What it is

A mobile-first peptide + GLP-1 protocol tracker. Runs entirely in the browser: no accounts, no server,
no database. All state is `localStorage` under `titrate.v1` (one-key backup in `titrate.v1.backup`);
progress photos are IndexedDB `titrate-photos` because images blow the 5 MB key budget.

Repo `~/peptide-tracker` — Next 16.4.2, React 19, Tailwind 4, TypeScript. 47 files, ~5.9k lines in `src/`.
Public at `https://github.com/RDW-Labz/titrate`, branch `main`. **Live: https://rdw-labz.github.io/titrate/** (GitHub Pages, static export, rebuilt on every push to `main`).

## Run + verify

```bash
cd ~/peptide-tracker
lsof -nP -iTCP:3000 -sTCP:LISTEN | awk 'NR>1{print $2}' | xargs -r kill   # never pkill by name
pnpm test                     # 27 node:test checks, must print "pass 27 / fail 0"
pnpm dev                      # local: http://localhost:3000 (no basePath)
```

Production is a **static export** — there is no `next start` any more. `pnpm build` writes `out/`;
CI builds it with `PAGES_BASE_PATH=/titrate` and Pages serves it there. To check the built artifact
locally, serve `out/` under that prefix (a five-line Python `translate_path` shim is enough) and open
`http://127.0.0.1:3050/titrate/`. Test file: `scripts/selfcheck.mts` (explicit path, not a directory).
`src/lib/*` uses explicit `.ts` import specifiers so Node can strip types and run the real modules.

## Screens (all hand-built React; no generative layer except `/assistant`)

| Route | Job |
|---|---|
| `/` | Hero: countdown ring, level mini-curve, one-tap Log (locks after the dose), site link, skip, week dots, other compounds, log-all, protein, "Any side effects?" sheet |
| `/protocols` | Your compounds: search (stack + library + screens), 28-day adherence donut, archive toggle |
| `/protocols/view?id=` | Level chart with 7-day projection, Log, cycle bar; weight vs dose steps; vial, dose, schedule, history behind one More |
| `/protocols/new?p=` | Prefilled setup, one tap to create |
| `/start` | First run: GLP-1 pen vs mixing your own vial |
| `/calc` | Reconstitution: vial + water + dose + syringe → units, barrel drawn to scale |
| `/food` | Day stepper, protein/kcal rings, water, weight, favourite chips, list, More (add food, targets, trend) |
| `/photos` | Progress photos (IndexedDB, shrunk to ≤1200 px) |
| `/library`, `/library/view?id=` | 20 compounds: half-life, tmax, range, cycle convention |
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
- **Weight vs dose**: `weightVsSteps()` in `src/lib/progress.ts` puts weights and titration steps on one 0..1
  axis over a trailing 90-day window, so the chart on a compound page shows a plateau against the step that
  caused it. Tested in `selfcheck.mts`; `src/components/weight-chart.tsx` is the drawing only.

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
- **Static export cannot have a dynamic segment over `localStorage` ids.** `/protocols/[id]` and
  `/library/[id]` are now `/protocols/view?id=` and `/library/view?id=`, read with `useIdParam()` behind a
  `Suspense` boundary (`useSearchParams` needs one to prerender). Any *new* per-item page inherits this.
- `output: "export"` also drops `cacheComponents`/`partialPrefetching` and needs `export const dynamic =
  "force-static"` on `manifest.ts` before it will build.
- **basePath is not applied to strings in `manifest.ts` or `metadata.icons`** — they are prefixed by hand from
  `NEXT_PUBLIC_BASE_PATH`; forget it and install points at the org root.
- **A native `confirm()` cannot be driven from the browser harness** — it blocks both `Runtime.evaluate` and
  `Input.dispatchMouseEvent` until dismissed, and the CDP session cannot reach `Page.handleJavaScriptDialog`
  in time. Only the destructive paths behind `confirm()` need a human check.
- The service worker only registers in a production build, so a `pnpm dev` tab never caches. Testing offline
  needs the built `out/` (or the live site) plus CDP `Network.emulateNetworkConditions`; `js()` runs in an
  isolated world where `navigator.serviceWorker` and `caches` are undefined, so read results through the DOM.
- A **private** repo makes Pages org-login-only (`github.com/pages/auth` redirect) and serves it at the domain
  ROOT, not `/<repo>` — which silently breaks a `/titrate` build. Public repo → `rdw-labz.github.io/titrate`.
- **Tap targets, not just contrast**: nothing is under 40 px except plain text links. Severity is one 44 px
  control that cycles (three 10 px dots were untappable), header icons are 21 px glyphs in a 45 px box, delete ✕
  is 44 px, and `Btn size="sm"` is 40 px tall.
- Accessible contrast: accent `#0d7460` (was `#0e7c66`, 4.41 on accent-soft). All screens ≥ AA now.

## Open work, in the order it was queued

1. **Model-backed Type it** — `parseLine()` in `src/lib/intent.ts` is deterministic; replacing it with a
   fetch that returns OpenUI Lang is the whole change. Needs an API key + a route (breaks the no-server rule).
2. Native-only ideas deliberately unbuilt: Health sync, real home-screen widgets, push reminders (all need a
   shell). Manifest shortcuts + calendar export are the web substitutes already shipped.

Done: **the backup is a real snapshot** — Download now appends the IndexedDB photos to the JSON (they were
silently excluded, so a new phone lost every progress photo) and Restore refills them, skipping duplicates by
data. "Delete everything" now clears photos too, and a deleted photo offers Undo on the toast instead of being
irreversible on one tap. Verified by round-tripping through the real file input: download → wipe both stores →
restore → photo back with its original date.

Done: **weight against titration** — the compound page shows weight over 90 days with a dashed line at every
dose change, plus the net change and the dose order in the footer. The demo's Tirzepatide now carries two
titration steps (2.5 → 5 mg) so the feature is visible in the sample.

Done: **overlay lock + update prompt** — an open overlay now freezes the page behind it (lock on
`documentElement`, not `body`: body alone still lets the window scroll) and a swapped service worker raises a
"New version ready → Reload" toast, but only when a worker was already controlling the page, so a first install
stays quiet. `useByDate()` in `lib/vial.ts` is now `beyondUseDate()` — the old name read as a hook and lint
flagged all three call sites. Lint errors 8 → 5; the rest are false positives (`useActions` really is a hook).

Done: **offline shell** — `public/sw.js` is registered by `Shell` (production only). It precaches the 14 pages
plus icons at install, serves HTML network-first (so a deploy can't go stale) and hashed `_next/static` chunks
cache-first, and matches navigations with `ignoreSearch` so `/protocols/view/?id=` works offline. Verified by
cutting the network in CDP and loading home, calc, a library entry and a protocol deep link. Bump `CACHE` in
`sw.js` only when a release must not run from cache at all. This also makes `navigator.serviceWorker.ready`
resolve, which is what `Reminders` was waiting on — notifications now actually fire where permission is granted.

Done: **deploy** — repo is public, Pages is live at https://rdw-labz.github.io/titrate/, workflow
`.github/workflows/pages.yml` (pnpm 12, Node 24, `pnpm test` before build). Verify a deploy by loading the live
URL and sweeping all 13 routes, not by reading the run log.

Done: **overlay a11y** — `useDialog(open, onClose)` in `src/components/ui.tsx` gives all three overlays
(`SymptomSheet`, photo viewer, `SitePicker`) a focus trap, Escape, and focus return to the trigger; the Type it
card host is `aria-live="polite"`. Verified in the DOM with real Tab/Shift-Tab/Escape keystrokes. Not done:
body scroll still moves behind an open sheet, and the backdrop is mouse-only (no tabbable Close).

## Conventions the user expects

Long autonomous stretches — ship, test, build, commit, verify in the DOM, then one short report. Commit per
change with `-c user.name="Hermes" -c user.email="hermes@local"`. Delete rather than defend when the user
says the app is too much. Reference values are published pharmacology, never a recommendation.
