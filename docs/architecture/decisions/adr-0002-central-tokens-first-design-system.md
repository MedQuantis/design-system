---
type: Architecture Decision Record
title: Central tokens-first design system consumed by pinned version
description: One MedQuantis design-system repo holds the tokens, shared CSS, assets, guidelines and Claude skill; every other repo consumes a pinned release and specialises only through namespaced local extensions.
tags: [design-system, brand, tokens]
timestamp: 2026-10-09T19:06:23+02:00
status: draft
owner: Victor Hueni
last_reviewed: 2026-10-09
review_interval: 180d
---

# Central tokens-first design system consumed by pinned version

## Context and Problem Statement

The MedQuantis visual identity (navy accent, warm off-white canvas, Outfit / Newsreader / Geist Mono) is shared in spirit but copied in practice. Inventory on 2026-10-09:

- Platform repo (decks, wiki, viewer): 18 copies of `decks/*/design/styles.css` (3,212 to 4,258 lines each) in 8 distinct variants; `docs/design-system.md` names one client deck's stylesheet as the source of truth; `docs/design-system-rapport.md` (2026-10-08) contradicts `design-system.md` and `brand.md` and lists them as stale.
- Platform repo `viewer/src/styles.css`: its own `:root` copy.
- Website repo `assets/styles.css`: its own `:root` copy, with `--accent-on-dark: #ffffff` where the decks use `#8fc0ff`.
- Paracel product repo: `frontend/app/assets/css/main.css` with a Swiss-red accent, `docs/ux/DESIGN_SYSTEM.md`, a generated `docs/ux/tokens.css`, and 6 slide decks each carrying its own `styles.css` (6 variants).
- Claude-produced artefacts (claude.ai pages, kit skills `com-slide-deck`, `com-artefact-viz`) read whatever `docs/ux/tokens.css` the current repo has, or fall back to neutral defaults.

Every fix (for example Paracel's WCAG AA tertiary grey `#707070`) lands in one copy and never reaches the others. How should MedQuantis hold one source of truth for its visual identity while letting each repo add what only it needs?

## Decision Drivers

- One source of truth: a value is defined once and every consumer derives from it
- Consumers differ in toolchain: Nuxt UI 4 / Tailwind 4 app, React/Vite viewer, build-less static website, Python slide pipelines that stitch one self-contained HTML file, Claude skills
- A consumer must be able to specialise (deck layouts, app-only annotation colours) without forking the base
- Upgrades must be deliberate and reviewable per consumer, never a silent change under a running deck or app
- Claude sessions in any repo, and on claude.ai, must produce on-brand output without per-repo setup

## Considered Options

- Keep per-repo copies, align them by hand on a documented reference
- Git submodule of a shared design folder in each consumer
- Central repo with tokens as data, generated outputs per toolchain, consumed by pinned release (npm package or vendored release copy)

## Decision Outcome

Chosen option: "Central repo with tokens as data, generated outputs, pinned consumption", because it is the only option where a value exists once and still reaches every toolchain in its native form, and where each consumer chooses when to upgrade.

Shape of the repo:

- `tokens/*.json` in the W3C Design Tokens format, layered core (raw values) → semantic (roles) → themes (only if ever decided; none in v1, see ADR-0003)
- A Style Dictionary build emitting `dist/tokens.css` (`--mq-*`, see ADR-0006), `dist/tailwind.css` (`@theme` with 50 to 950 scales for Nuxt UI), `dist/kit-contract.css` (the homemade-claude-kit generic names), `dist/tokens.json`
- `css/`: shared `mq-` components (card, navy panel, KPI tile, table, badge, callout), `slide.css` (1280×720 canvas), `print.css` (A4)
- `assets/`: self-hosted woff2 fonts (OFL, licence per folder), one pinned Lucide build; `brand/`: logo SVGs and monogram (all rights reserved)
- `guidelines/`: one merged brand, voice, data-pattern, chart and accessibility guide replacing the competing docs (all rights reserved)
- a specimen page generated from the tokens and CSS by a script, never hand-edited: the visual reference and review screenshot
- `skill/medquantis-brand/`: the same rules as a Claude skill, shipped as a Claude Code plugin and uploadable to claude.ai

Consumption:

- Node consumers (Paracel frontend, platform viewer) install `@medquantis/design-system` at an exact version
- Build-less and Python consumers (website, platform decks, Paracel slides) either reference the CDN URL of a tagged release (possible because the repo is public, ADR-0005) or vendor a release into `vendor/medquantis-ds/` via `make design-sync`, with a `VERSION` file and a CI check that the copy matches the tag; stitched decks inline the CSS either way
- Dependabot proposes version bumps in each consumer

Framework neutrality (owner, 2026-10-09): the design system ships only framework-neutral outputs (CSS, JSON, Tailwind theme, static assets) and no framework components. Wiring into a component library (Nuxt UI, shadcn/ui, Radix, MUI) belongs to the consumer; when two consumers need the same wiring, it may ship as a separate optional sub-path export generated from the tokens, never as part of the core outputs.

Specialisation rules:

1. Core and semantic tokens are not overridden in a consumer.
2. A product-level variation, if ever needed, is a theme in this repo, never a local override.
3. Local additions use the consumer's own prefix (`--deck-*`, `--app-*`) and reference `var(--mq-*)` only; a stylelint rule blocks raw hex colours outside this repo.
4. A component invented locally in two consumers is a candidate for promotion here (owner, 2026-10-09). It is promoted only if it passes four tests: useful (needed in more than one place), unique (does not duplicate an existing component), consistent (built from existing tokens and styles), versatile (fits uses beyond the two that produced it). Every local one-off is logged in `docs/one-offs.md`, one line each: consumer, what, date, outcome (promoted, kept local with a reason, or replaced by an existing component).

Governance: owner `@VictorHueni`, backup owner `@MikimikeDevloppAI` (owner, 2026-10-09), both listed in `CODEOWNERS` so either can approve; review answer within 5 working days, written in `GOVERNANCE.md`; protected `main`, release-please changelog, semver: major = token removed or renamed, or a value change that visibly re-themes consumers (owner, 2026-10-09); minor = token or component added, or a token deprecated (still working, aliased to its replacement, lint warning); patch = a value adjusted within its intent without a visible change (rounding, a contrast fix that stays perceptually the same). A deprecated token is removed only in the next major.

### Positive Consequences

- A token change reaches every consumer through one reviewed release
- Each toolchain gets its native format without hand translation
- Kit skills and Claude artefacts become on-brand by reading `kit-contract.css`
- Consumers upgrade on their own schedule, with a diffable version bump

### Negative Consequences

- One more repo, build and release pipeline to maintain
- Migrating the existing decks costs a search-and-replace per deck still in edition; finished decks stay frozen on their stitched output
- Consumers can lag behind the latest release; drift becomes visible as a version gap instead of a silent value gap

## Pros and Cons of the Options

### Keep per-repo copies, aligned by hand

#### Positive

- No new repo or tooling

#### Negative

- Already failed: 8 variants inside one repo, plus 3 other divergent copies
- Fixes never propagate

### Git submodule

#### Positive

- One copy of the files, pinned by commit

#### Negative

- Ships raw files, not per-toolchain outputs; Nuxt UI still needs a hand-written theme
- Submodule workflows are error-prone for non-developer contributors who edit decks
- No semver signal on what changed

### Central repo, tokens as data, pinned releases

#### Positive

- Single definition, generated outputs per toolchain, semver releases

#### Negative

- Requires a build step and release discipline in the central repo
