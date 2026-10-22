# Reference: Pep AI (peptide tracker) — observed 2026-10-22

Source: App Store listing `id6758682710` screenshots (6 in-app captures, 600×1334) plus pepaiapp.com
marketing mockups. In-app chrome read from the captures; motion inferred where a still cannot show it.

## What the strong screens share

| Pattern | What Pep AI does | Why it works |
|---|---|---|
| Hero = countdown | A large circular ring with `22 h 36 m` inside, next dose name below, one "today" line | Answers "what do I do next" in one glance; the ring gives the screen a face |
| One number per card | `Medication level 3.84 mg — Declining` | Each card carries exactly one fact plus a word for its trend |
| Airy cards | Pure-white cards, ~20-24 px radius, soft shadow, no borders | Reads as friendly, not clinical; shadow does the separation |
| Tinted page | Very light blue-grey page under white cards | Cards pop without heavy outlines |
| Accent used sparingly | One blue for data and primary actions; everything else neutral | Eye lands on the ring, then the button |
| Body map | Rear/front silhouette for injection sites, with "3 days ago · left abdomen" rows | Turns a boring rotation rule into a picture |
| Nav | Icon + label, large tap targets, active state filled | Discoverable without reading |

## What we deliberately do not copy

- The pale-blue brand wash and capsule/molecule illustrations — that is their identity, not a pattern.
- Subscription walls mid-flow; everything here is reachable.
- 3-tab-plus-community nav; our five destinations are all real screens.

## Screen → pattern we apply

| Our screen | Pattern |
|---|---|
| Today | Dark hero with a **countdown ring**, one action, then two rows max |
| Peptides | White cards, 24 px radius, soft shadow, due row marked with a filled dot |
| Detail | Small ring + the level curve; everything else folded into expanders |
| Nutrition | Two rings, chips, list — one accent, no table |
| Nav | Floating rounded bar, icon + label, sliding pill |

## Motion budget (what we add)

1. Ring sweep + number count-up on mount.
2. Cards rise in, 40-60 ms apart, once per screen.
3. Tab pill slides between tabs (spring).
4. Log: button flips to `Logged`, 7-dot burst, hero advances.
5. Chart line draws itself.
6. All of it off under `prefers-reduced-motion`.
