---
type: Implementation Plan
title: "Plan-0004: the optional Vue component package (@medquantis/ui 0.x)"
description: Builds @medquantis/ui, the optional Nuxt layer of presentation components that ADR-0009 allows, as a second package of this repository with its own release track and CI job; the Nuxt UI theme wiring first, then the components extracted from the first product's layer in the order the owner ruled on issue 44.
tags: [design-system, apps, components, vue, nuxt, packaging, release]
timestamp: 2026-11-11T00:00:00+01:00
status: accepted
owner: Victor Hueni
last_reviewed: 2026-11-17
review_interval: 30d
---

# Implementation Plan: the optional Vue component package

## Summary

[#44](https://github.com/MedQuantis/design-system/issues/44) proposes `@medquantis/ui`, an optional Vue component package published from this repository, and the owner agreed to it on 2026-11-06. [ADR-0009](../../../architecture/decisions/adr-0009-optional-vue-component-package.md) records the decision. This plan builds the package.

The owner accepted this plan and ADR-0009 on 2026-11-17, with the four package rules below moved into the ADR, and declined a peer review before Increment 01. Increments 01 to 03 run autonomously, one pull request each; Increment 04 waits for the owner's go, because it publishes to npm and changes a consumer.

**Decisions this plan takes as given** (ADR-0009 and the owner rulings on #44):

- Package `@medquantis/ui` in `packages/ui/`, a Nuxt layer on Nuxt UI 4. It pins the core by exact version; consumers pin it by exact version.
- Presentation components only: no API calls, no domain vocabulary, no app routes. A component enters only if both review screens need it.
- The core outputs stay framework-neutral and nothing in the core imports from `packages/ui/`.
- Its own release-please component and version, tagged `ui-vX.Y.Z`. The core keeps its tags.
- A separate CI job, run only when `packages/ui/**` changes.
- First components: the app shell; the sign-in, access-refused and error pages; the work queue with status and owner filters; a value beside its source; the decision modal. Keyboard shortcuts come later.
- Ruling of 2026-11-10: components are **extracted from** the first product's layer, not rewritten. Each generic component moves with its tests; wording, API types and fixtures are replaced with neutral, fictitious ones; each passes the confidentiality gate. First to move: the shell, the work queue (table, status segments, status pill), the decision modal (modal, stepper, footer, history, result card, choice cards) and the overview cards.

Source: #44 and its rulings; an inventory of 2026-11-11 of the first product's two Nuxt apps (93 components) and of the designed screens of both review apps, kept as a research document in that product's repository. No PRD.

Principles:

1. One increment equals one coherent change set and one commit.
2. Every increment is test-driven: write-first tests observed red, then a green gate; `progress.txt` records both runs.
3. The core package's outputs, tarball, exports and tags do not change in any increment.
4. A component is made generic in the app that owns it first (wording and types become props, its tests stay green), then moves here with its tests. This plan receives components; it does not design them.

## What the inventory adds

Measured on 2026-11-11 in the first product:

- The Nuxt UI theme wiring (`app.config.ts`: colour aliases, radius steps, warning variants) is the same file in both of its apps, copied. It is the only code duplicated between them, and the smallest thing the package can take over.
- None of the 38 components of the review app's layer is reusable as written: 36 import that app's wording and 32 its API types. 21 become generic once wording and types are props; 7 need a split into a generic frame and a domain wrapper (table, modal, stepper, history, result card, footer, annotated text); 10 stay domain.
- Nine more screens of that app are designed. Ranked by how many of them draw each block: navigation with groups and counts (9), data table (8), filter select with counts (7), segmented status control (7), status pill (7), code tile (6), search field (6), page header with breadcrumb (5), key-value list (5).
- The second review app's approval prototype shares about half of its building blocks with those screens: shell, table, filters, status pill, decision window, stepper, tabs, timeline.

## Package rules

ADR-0009 §Package rules holds the four rules this plan proposed and the owner accepted on 2026-11-17: no language in the package, both render modes and offline, semver for a component API, the `Mq` prefix. The guards of Increment 03 enforce the first two; Increment 10 adds the third to `GOVERNANCE.md`.

## Design

**Layout**

```
package.json            @medquantis/design-system, gains "workspaces": ["packages/*"]
packages/
  ui/
    package.json        @medquantis/ui
    nuxt.config.ts      the layer: modules, css, ui and icon settings
    app/
      app.config.ts     Nuxt UI colours, radius, warning variants
      assets/css/main.css
      components/       Mq*.vue
      utils/            formatters of guidelines/data-patterns.md
    playground/         a Nuxt app that extends the layer and mounts every component
    tests/
```

**Release**

- `release-please-config.json` gains a second entry, `packages/ui`, with its component name in the tag (`ui-vX.Y.Z`). The root entry is unchanged.
- `release.yml` packs and publishes the package that was released; the new package gets its own npm trusted publisher.
- The package starts at 0.1.0.

**Installation**

- `make` installs with `npm ci --ignore-scripts`, and a Nuxt package needs its types prepared: a Makefile target calls `nuxi prepare` explicitly for `packages/ui` and its playground.
- Node stays at the version `mise.toml` pins; the package declares `engines.node >=24` like the core.

**The CI job for `packages/ui/**`**, with one Makefile target that runs the same steps locally:

- ESLint and type check.
- Component tests mounted in a real Nuxt environment.
- Playground built twice: server-rendered and as a static single-page app.
- Guards on the package source: no colour, font or shadow literal; no assignment to `--mq-*`; no user-visible string; no remote asset.
- `make check` keeps running the confidentiality scan over every file, this package included.

**Consumer contract**

- `extends: ['@medquantis/ui']`, with exact pins on `@medquantis/ui` and `@medquantis/design-system`.
- The consumer keeps its wording, domain types, routes, data fetching, permissions and domain components.

## Increment Plan

**Overall Status:** pending
**Current Increment:** 01

Increments 01 to 03 are written out in full. Increments 04 to 10 keep their one-line change set and gate; each is written out, from what the previous increments shipped, before it starts.

### Increment 01: the workspace

**Status:** pending

Scope:

1. **Write first, expect red:**
   - extend `tests/unit/package.test.mjs`: the root `package.json` declares `"workspaces": ["packages/*"]`; `packages/ui/package.json` exists with `name` `@medquantis/ui`, `version` `0.0.0`, `"private": true` (dropped in Increment 02, when the release track exists), `type` `module` and `engines.node` equal to the root's; the core tarball's file list (`npm pack --dry-run --json --ignore-scripts` at the root) holds nothing under `packages/`.
   - extend `tests/unit/release.test.mjs`: the root release-please entry and its tag format (`vX.Y.Z`, no component) are unchanged.
2. Root `package.json` gains `workspaces`; `packages/ui/package.json` as tested; `package-lock.json` regenerated with `npm install --package-lock-only --ignore-scripts`, gaining only the workspace entry.
3. The table row named `workflows.test.mjs` here; nothing in the workflows changes until Increment 02, so its test moves there.

Primary files:

1. `package.json`, `package-lock.json`, `packages/ui/package.json`
2. `tests/unit/package.test.mjs`, `tests/unit/release.test.mjs`

Test gate:

1. `MQ_DENYLIST=<the real deny-list> make check`
2. The core tarball against the one packed from `main` before the increment (`npm pack --ignore-scripts` on both, then unpack and diff): the same files, each byte-identical, except `package/package.json`, whose only difference is the `workspaces` key.

Exit criteria:

1. npm sees two packages in one workspace, and the core package ships what it shipped before.

Prediction:

1. New: `packages/ui/package.json`.
2. Changed: `package.json` (the `workspaces` key only), `package-lock.json` (the workspace entry only), the two test files.
3. Byte-identical: everything under `dist/`, `kit-manifest.json`, the skill.

### Increment 02: the release track

**Status:** pending

Scope:

1. **Write first, expect red:**
   - extend `tests/unit/release.test.mjs`: `release-please-config.json` has a `packages/ui` entry (`release-type` `node`, `package-name` `@medquantis/ui`, `component` `ui`, `include-component-in-tag` `true`, its own `CHANGELOG.md`); the root entry gains `exclude-paths: ["packages/ui"]`, so a commit under `packages/ui/` never releases the core; `.release-please-manifest.json` holds `"packages/ui": "0.0.0"`, so the first `feat(ui)` commit proposes 0.1.0; no `release-as` anywhere.
   - extend `tests/unit/workflows.test.mjs`: `release.yml` reads the root outputs and the `packages/ui--` outputs separately; a core release packs and publishes the root tarball as today; a `ui` release runs the same gate on the tagged commit, packs `npm pack --workspace packages/ui --ignore-scripts`, uploads it under its own artifact name and publishes it with provenance from a job of its own, with only `id-token: write` and `contents: read`.
   - extend `tests/unit/package.test.mjs`: `packages/ui/package.json` is no longer private and has `publishConfig.access` `public`, `repository.directory` `packages/ui` and a `files` allow-list.
2. `release-please-config.json`, `.release-please-manifest.json`, `release.yml` as tested; `packages/ui/package.json` as tested, with an empty `files` allow-list that Increment 03 fills.
3. `.github/dependabot.yml`: the npm entry gains a `nuxt` group (`nuxt`, `@nuxt/*`, `vue`, `reka-ui`, `tailwindcss`, `@tailwindcss/*`), so the Nuxt toolchain moves in one pull request.
4. The `packages/ui/**` CI job and its Makefile target move to Increment 03: until the layer exists there is nothing for them to run.
5. Check the output names of `googleapis/release-please-action` v5 for a path other than `.` against its documentation before writing `release.yml`, and record what was checked in `progress.txt`.

Primary files:

1. `release-please-config.json`, `.release-please-manifest.json`, `.github/workflows/release.yml`, `.github/dependabot.yml`, `packages/ui/package.json`
2. `tests/unit/release.test.mjs`, `tests/unit/workflows.test.mjs`, `tests/unit/package.test.mjs`

Test gate:

1. `MQ_DENYLIST=<the real deny-list> make check` (actionlint and zizmor included)
2. `npm pack --dry-run --ignore-scripts` at the root lists the files of Increment 01's gate; `npm pack --dry-run --workspace packages/ui --ignore-scripts` packs only `package.json`.

Exit criteria:

1. A `feat(ui)` commit on `main` would open a release pull request for `ui-v0.1.0` and leave the core version where it is.

Prediction:

1. New: `packages/ui/CHANGELOG.md` only if release-please needs it to exist (record which).
2. Changed: the five primary files and the three test files.
3. Byte-identical: everything under `dist/`, `kit-manifest.json`, the skill, `ci.yml`.

### Increment 03: the layer with the theme only

**Status:** pending

Scope:

1. **Write first, expect red:**
   - new `packages/ui/tests/unit/guards.test.ts` (Vitest, Node environment), the guards over the package source (`nuxt.config.ts`, `app/`): no colour, font or shadow literal and no assignment to a `--mq-*` property (port the first product's `design-tokens.test.ts`, with its wording replaced); no `http:` or `https:` URL and no `@import` or `url()` that leaves the package; no text node in a component template and no string literal passed to a `label`, `title`, `placeholder` or `aria-label` attribute. Each guard is seen failing once on a planted fixture under `tests/fixtures/`, then on nothing.
   - new `packages/ui/tests/nuxt/theme.test.ts` (Vitest, `nuxt` environment from `@nuxt/test-utils`): a Nuxt app built from the layer resolves `appConfig.ui.colors` to the design system's names (`primary` navy, `error` danger, `neutral` stone) and mounts a `UButton` of colour `warning` with the warning fill classes.
   - extend `tests/unit/package.test.mjs`: `packages/ui/package.json` pins `@medquantis/design-system` and `@nuxt/ui` at exact versions, declares `nuxt` as a peer dependency, has `main` `./nuxt.config.ts`, and its `files` hold `nuxt.config.ts` and `app/` and nothing under `playground/` or `tests/`.
2. `packages/ui/nuxt.config.ts`, `app/app.config.ts`, `app/assets/css/main.css`: the theme wiring of the first product's layer (colour aliases, radius steps, warning variants, the `ui` and `icon` settings: no colour mode, every icon bundled, no Iconify API), extracted with every product name, alias, path and comment that names that product removed. The layer names its own files through `import.meta.url`, never `~`.
3. `packages/ui/playground/`: a Nuxt app that `extends` the layer, with one page showing the themed Nuxt UI components (buttons in every colour and variant, alert, badge, input, modal) with fictitious text.
4. `packages/ui` gets its scripts (`lint`, `typecheck`, `test`, `build`, `generate`) and its ESLint, TypeScript and Vitest configuration, mirrored on the first product's layer.
5. `Makefile`: a `ui-check` target that installs with the shared `npm ci --ignore-scripts`, runs `nuxi prepare` for the layer and the playground explicitly, then lint, type check, both Vitest projects, the playground built server-rendered (`nuxi build`) and as a static single-page app (`nuxi generate`). `make check` is unchanged and keeps scanning `packages/ui/` for confidentiality.
6. `.github/workflows/ci.yml`: a `ui` job running `make ui-check`, only when the pull request or push changes `packages/ui/**`, `package.json` or `package-lock.json` (a changed-files step in the job, not a workflow `paths:` filter, so the workflow always runs); never added to the required checks. `release.yml`'s `ui` check job runs `make ui-check` as well as `make check`.
7. If `npm ci --ignore-scripts` leaves a native binary of the toolchain uninstalled (esbuild, the Tailwind oxide engine, `@parcel/watcher`), name it in `progress.txt` and fix it with the narrowest step (an explicit `npm rebuild <package>` in `ui-check`), never by dropping `--ignore-scripts`.

Primary files:

1. `packages/ui/` (layer, playground, configuration, tests), `Makefile`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `package-lock.json`
2. `packages/ui/tests/unit/guards.test.ts`, `packages/ui/tests/nuxt/theme.test.ts`, `tests/unit/package.test.mjs`, `tests/unit/workflows.test.mjs`

Test gate:

1. `make ui-check`
2. `MQ_DENYLIST=<the real deny-list> make check`
3. The core tarball as in Increment 01's gate, against the one packed after Increment 02: identical.

Exit criteria:

1. The playground builds in both modes from the layer alone, and the guards pass on the package source.

Prediction:

1. New: everything under `packages/ui/` other than `package.json`.
2. Changed: `packages/ui/package.json`, `package-lock.json`, `Makefile`, `ci.yml`, `release.yml`, `.gitignore` (the playground's `.nuxt/`, `.output/` and `dist/`), the two root test files.
3. Byte-identical: everything under `dist/`, `kit-manifest.json`, the skill, the core tarball.

### Increment 04: release 0.1.0 and consume it

**Status:** blocked

Waits for the owner's go (2026-11-17), and for these answers first: whether « both review apps » means the first product's review app alone for now, and that the npm trusted publisher for `@medquantis/ui` exists (npm may need the package to exist before one can be set; check). Gate: in a consumer's built output the layer's Tailwind classes are present, every icon is bundled, and the static build passes that app's content security policy.

### Increment 05: shell

**Status:** pending

App shell, navigation with groups and counts, user menu, environment banner. Gate: mounted tests moved with the components; axe on the playground.

### Increment 06: sign-in, access-refused and error pages

**Status:** pending

The three pages and the empty state. Gate: mounted tests; axe.

### Increment 07: work queue

**Status:** pending

Data table (columns, cell slots, sort, keyboard rows, loading rows, load more, empty), status segments, status and owner filters, status pill. Gate: mounted tests; axe.

### Increment 08: decision modal

**Status:** pending

Window frame with queue navigator, panes, tabs and foldable sections; stepper; footer action bar; history timeline; result card; choice cards. Gate: mounted tests; axe.

### Increment 09: a value beside its source, overview cards

**Status:** pending

The value beside its source; stat card and segmented bar. Gate: mounted tests; axe.

### Increment 10: guidelines, governance and README

**Status:** pending

`guidelines/app-patterns.md` and `guidelines/specialising.md` point each pattern to its component; `GOVERNANCE.md` gains the component semver rule of ADR-0009; a README section on the package. Gate: `guidelines.test.mjs` and `package.test.mjs`.

Later, each when both review screens need it: keyboard shortcuts help, code tile and chip, search field, global search, page header with breadcrumb, key-value list, reading drawer, confirm modal, facets, detail sheet, annotated text.

## Delivery Rules

1. One increment per commit and per pull request, branched from an up-to-date `main` once the previous increment has merged; merged when CI is green (owner, 2026-11-17, for Increments 01 to 03).
2. **Commit scope:** `ui`. Types: `build` (01), `ci` (02), `feat` (03, the first commit that releases the package). Trailer `Refs: Plan-0004 increment NN`, never the plan number in the scope.
3. Tests named in Scope are written or extended first and observed failing before the implementation lands; `progress.txt` records the red run and the green run.
4. The confidentiality check with the real deny-list runs in every gate (`MQ_DENYLIST` set); fixtures and playground text are fictitious only.
5. A change to an existing output that its `Prediction:` does not name blocks the increment.
6. Foreground gates only; every iteration ends with a definitive state.
7. No em dash in prose; never hard-wrap markdown.

## Risks

| Risk | Mitigation |
| :-- | :-- |
| Tailwind does not scan, or icons are not bundled, for a layer installed from `node_modules` | Increment 04 proves it before any component moves; the fallback is an explicit `@source` and an icon list exported by the package |
| A component API is frozen too early | 0.x for the whole plan; a component moves only after its owning app has made it generic |
| Version drift between `nuxt`, `@nuxt/ui` and the package across consumers | tight peer ranges; one Dependabot group per consumer for the two MedQuantis packages |
| Domain vocabulary or product data reaches this public repository with an extracted component | fixtures and wording replaced before the move; the confidentiality gate on every file; the no-string guard |
| Slow loop for the app that is building screens | a consumer can point `extends` at a sibling checkout during development; only the release is a separate step |

## Out of scope

- Any change to the core package's outputs.
- Domain components, wording and API types of any app.
- Components for another framework.
