---
type: Architecture Decision Record
title: MedQuantis has a dark theme
description: The themes tier reserved by ADR-0002 gets its first theme, dark, which re-values the existing semantic roles under a .dark selector for apps, documents and slides, chosen per document or per app and never inferred for a document from the reader's screen.
tags: [design-system, colour, theme, accessibility]
timestamp: 2026-10-15T22:00:00+02:00
status: draft
owner: Victor Hueni
last_reviewed: 2026-10-15
review_interval: 180d
---

# MedQuantis has a dark theme

## Context and Problem Statement

MedQuantis has one dark surface today, the navy panel (`guidelines/colour.md`): a navy gradient with an on-navy text tier, meant for one block per slide or page. ADR-0002 reserves a themes tier ("only if ever decided; none in v1") and ADR-0003 kept it empty.

Paracel's decks have dark section slides, and their migration (Paracel Plan 0190, Q-17) needs them to stay dark on a theme MedQuantis owns. Plan-0003 as merged (#16) answers that with parallel `--mq-dark-*` tokens for slides only. The owner then asked for a real MedQuantis theme covering apps, documents and slides (2026-10-15), and for a design pass before any plan runs.

The design pass applied one override of the semantic `--mq-*` roles to the whole specimen page. Every section rendered dark with no other change: nothing in `css/` or the specimen carries a colour literal. Navy itself fails on a dark canvas (`#0a2463` on `#11161f` is 1.25:1), so the brand must show differently on dark.

How should MedQuantis offer dark, and where does it apply?

## Decision Drivers

- One source of truth (ADR-0002): a role is named once, and a component must not need a second name to work on dark
- Every toolchain must switch the same way: Nuxt UI 4 and Tailwind 4 apps, static pages, the kit's slide and document pipelines
- Navy stays the single accent (ADR-0003) and status colours stay apps only (ADR-0004)
- Every text pair meets WCAG 2.x AA (4.5:1, 3:1 for large text and non-text) in both themes
- Adding dark must not change a single byte that a light consumer receives today (semver minor, ADR-0002)

## Considered Options

- No dark theme: dark slides become light, the navy panel stays the only dark surface
- Dark slides only, with parallel `--mq-dark-*` tokens (Plan-0003 as merged)
- A dark theme in the themes tier: the same semantic roles re-valued under a `.dark` selector, for apps, documents and slides

## Decision Outcome

Chosen option: "A dark theme in the themes tier", because the design pass showed that re-valuing the existing roles is enough for every component, so one name per role survives and every consumer switches by one class. Decided by the owner during the design pass of 2026-10-15; the renders and the decision log are in the design-pass notes (gitignored, `var/design-pass/dark-theme/`).

### Mechanism

- `tokens/themes/dark/` holds the dark value of each semantic role that changes; a role without a dark value keeps its light value. Core tokens gain only the new raw values.
- Every output emits the theme under the `.dark` selector, after the light `:root` values: `tokens.css`, the Tailwind theme, the kit contract (the kit's optional `dark` module, kit Plan-0006) and `tokens.json`. `.dark` is the class Nuxt UI 4 color mode sets on `<html>` and the class the kit puts on a dark slide, so one selector serves both.
- The design system never switches on `prefers-color-scheme` by itself. An app may follow the viewer's setting by toggling `.dark`; a document or deck never does (see Scope).
- Components read roles only, as today; a component that needs a literal to work on dark is a defect.

### Scope

- **Apps and the website:** light and dark; the app decides how the viewer chooses.
- **Documents (A4 reports, papers, PDFs):** light and dark, chosen by the author per document at build time, never from the reader's screen. A dark document stays dark in its PDF. Light stays the default for anything likely printed on paper.
- **Slides:** a whole deck, or a single slide carrying `.dark`, as the kit's `dark` class does.

### Values (owner, 2026-10-15)

Contrast with the WCAG 2.x formula, on canvas `#11161f` and surface `#1a2131`.

| Role | Dark value | On canvas | On surface |
| :-- | :-- | --: | --: |
| `--mq-canvas` | `#11161f`, a near-black with a navy cast | | |
| `--mq-surface`, `--mq-surface-alt` | `#1a2131`, `#141a26` | | |
| `--mq-desk` | `#0b0f16` | | |
| `--mq-border`, `--mq-border-light` | white at 14 %, at 10 % | decorative | decorative |
| `--mq-border-strong` | `#8795b3` | 6.03:1 | 5.35:1 |
| `--mq-ink` | `#f5f4f1`, warm white | 16.48:1 | 14.62:1 |
| `--mq-muted` | `#c3cbdc` | 11.13:1 | 9.88:1 |
| `--mq-tertiary` | `#8f98aa` | 6.25:1 | 5.54:1 |
| `--mq-decoration` | `#6b7385` | 3.81:1 | 3.38:1 |
| `--mq-accent` | `#6f88c9`, the lifted navy | 5.22:1 | 4.63:1 |
| `--mq-accent-hover` | `#8aa0d6` | 6.98:1 | |
| `--mq-on-accent` | `#11161f` | 5.22:1 on the accent | |
| `--mq-accent-pale`, `--mq-accent-pale-2` | the lifted navy at 18 %, at 10 % | | |
| `--mq-focus-ring-color` | `#9fb3e8`, the light navy | 8.71:1 | |
| `--mq-panel-start`, `--mq-panel-end` | `#2f4c8f`, `#0f2a5e` | white 8.23:1 at the start | |
| `--mq-shadow-panel` | a 1 px outline, light navy at 35 %, no glow | | |

The light navy `#9fb3e8` (8.71:1) is also kept for large highlighted title text.

### Brand on dark

- Every dark surface uses the existing white wordmark files (`wordmark-on-navy*.svg`): 18.13:1 on canvas, 16.08:1 on surface. The navy wordmark is 1.25:1 there and is never used on dark.
- A navy brand tile on dark takes the panel gradient, never the lifted accent (white on `#6f88c9` is 3.48:1).
- The monogram keeps its file and gets the panel's 1 px light-navy outline on dark, since its navy square is 1.11:1 against a dark surface.
- No new brand file is needed.

### Status colours on dark (apps only, ADR-0004)

| Role | Dark value | On canvas | On surface |
| :-- | :-- | --: | --: |
| `--mq-success` | `#6fbf73` | 8.09:1 | 7.18:1 |
| `--mq-warning` | `#e0a040` | 8.00:1 | 7.10:1 |
| `--mq-danger` | `#ff6b6b` | 6.53:1 | 5.80:1 |
| `--mq-info` | `#64a8f0` | 7.25:1 | 6.43:1 |
| `--mq-warning-fill` | `#d4850a`, unchanged | | |
| `--mq-warning-tint` | the warning fill at 16 % | ink 11.63:1 on it | |

A new role, `--mq-on-warning-fill`, carries text on the warning fill: ink in light, `#11161f` in dark (6.18:1). Ruling 5's "ink on the fill" fails in dark, where warm white on `#d4850a` is 2.67:1.

### Charts on dark

The four series run in reverse order, the lightest first, under the same rules as light: series 4 for context bars, the remainder drawn with a series 4 outline.

| Role | Dark value | On canvas |
| :-- | :-- | --: |
| `--mq-chart-series-1` | `#9fb3e8` | 8.71:1 |
| `--mq-chart-series-2` | `#6f88c9` | 5.22:1 |
| `--mq-chart-series-3` | `#5d6f91` | 3.58:1 |
| `--mq-chart-series-4` | `#3a4560` | 1.90:1 |
| `--mq-chart-rest` | `#232b3d` | 1.28:1 |
| `--mq-chart-axis` | `#6b7385` | 3.81:1 |
| `--mq-chart-baseline` | white at 10 % | decorative |

Each dark series meets or beats its light counterpart against its canvas (light: 13.90, 4.84, 2.88, 1.56 and 1.23:1).

### Positive Consequences

- One name per role in both themes: a component, a deck module or a Nuxt UI wiring written for light works on dark without change
- Apps, documents and slides switch by the same `.dark` class, and Nuxt UI 4 needs no extra mapping
- The navy panel, charts, status layer and brand all have a defined dark form, so a Paracel dark slide needs nothing deck-local
- Light consumers receive the same bytes: the theme is additive, a minor release

### Negative Consequences

- Every new role needs a dark value or an explicit "same as light", and every pair is checked twice
- The specimen prints its hex values and contrast ratios at build time, from the light values; it must render each theme to show the right numbers
- `.dark` is a generic class name: a consumer that already uses `.dark` for something else gets the theme there too
- A dark PDF uses more ink if someone prints it anyway; the author's choice carries that risk

### Relation to other decisions

- Fills the themes tier of ADR-0002, which stays otherwise unchanged; ADR-0002's specialisation rule 2 (a variation is a theme here, never a local override) applies to dark.
- Consistent with ADR-0003: on dark, navy shows as its lifted tint `#6f88c9`, its light tint `#9fb3e8` and the panel gradient; no new hue.
- Consistent with ADR-0004: documents stay free of status colours in both themes.
- Replaces the parallel `--mq-dark-*` tokens of Plan-0003 as merged; Plan-0003 is reworked to this mechanism.

## Pros and Cons of the Options

### No dark theme

#### Positive

- Nothing to build or maintain

#### Negative

- Paracel's dark slides lose their dark sections, against the owner's Q-17 ruling
- Apps cannot offer dark mode

### Dark slides only, parallel `--mq-dark-*` tokens

#### Positive

- Small: slides only, one kit module

#### Negative

- Two names per role: every component on a dark slide needs its own dark rules
- Apps and documents still have no dark, and adding them later means a third naming scheme

### A dark theme in the themes tier

#### Positive

- Proven on the whole specimen with one override and no component change
- One selector for every toolchain

#### Negative

- Broader scope than slides alone: every role and pair gets a second value to define and test
