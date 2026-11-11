---
type: Implementation Plan
title: "Plan-0004: the optional Vue component package (@medquantis/ui 0.x)"
description: Builds @medquantis/ui, the optional Nuxt layer of presentation components that ADR-0009 allows, as a second package of this repository with its own release track and CI job; the Nuxt UI theme wiring first, then the components extracted from the first product's layer in the order the owner ruled on issue 44.
tags: [design-system, apps, components, vue, nuxt, packaging, release]
timestamp: 2026-11-11T00:00:00+01:00
status: draft
owner: Victor Hueni
last_reviewed: 2026-11-11
review_interval: 30d
---

# Implementation Plan: the optional Vue component package

## Summary

[#44](https://github.com/MedQuantis/design-system/issues/44) proposes `@medquantis/ui`, an optional Vue component package published from this repository, and the owner agreed to it on 2026-11-06. [ADR-0009](../../../architecture/decisions/adr-0009-optional-vue-component-package.md) records the decision. This plan builds the package.

This plan is a draft and has had no peer review.

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

## Proposed additions to ADR-0009

ADR-0009 fixes the package and its scope. Building it needs four more rules, proposed here for the owners to add to the ADR or to `GOVERNANCE.md`:

1. **No language in the package.** A component has no user-visible string; every label is a prop or a slot. The first product keeps all its wording in one module, and a guard test there already forbids it elsewhere.
2. **Runs in both render modes and offline.** Safe under server rendering and under a static single-page build; no remote font, image, icon or script, since one consumer runs under a content security policy that allows none.
3. **Semver for a component API.** Major: a component, prop, slot or emitted event removed or renamed, or a default that visibly changes consumers. Minor: one added. Patch: a fix with no change to the API or the drawn result. On 0.x a minor version may break; the package stays on 0.x until the first components have each been used by two screens.
4. **One name prefix: `Mq`** (owner, 2026-11-11). Components in the first product are named after their screen (`ReviewTable`); a neutral prefix avoids collisions with a consumer's own components, and `Mq` is the prefix of the tokens and the CSS (ADR-0006). A component is named by its role in an app (`MqDataTable`, `MqStatusPill`, `MqStatCard`), never by the bare name of a document class of `css/components.css` (`MqTable`, `MqBadge`, `MqCard`), which apps do not load and which is a different thing.

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

## Increments

| # | Change set | Gate |
| :-- | :-- | :-- |
| 01 | Workspace: root `workspaces`, empty `packages/ui` with its `package.json`; `release.test.mjs`, `package.test.mjs` and `workflows.test.mjs` extended to assert both packages | `make check` green; the core tarball is byte-identical to the one before |
| 02 | Release track and CI: second release-please entry, `release.yml` for two packages, the `packages/ui/**` CI job, Dependabot entry | unit tests on the release and workflow shape; a dry-run pack of both packages |
| 03 | The layer with the theme only: `app.config.ts`, `main.css`, `ui` and `icon` settings, playground with one page, the guards | playground builds in both modes; the guards pass |
| 04 | Release 0.1.0 and consume it in both review apps | in a consumer's built output: the layer's Tailwind classes are present, every icon is bundled, and the static build passes that app's content security policy. This is the riskiest unknown and it is tested before any component moves |
| 05 | Shell: app shell, navigation with groups and counts, user menu, environment banner | mounted tests moved with the components; axe on the playground |
| 06 | Sign-in, access-refused and error pages; empty state | mounted tests; axe |
| 07 | Work queue: data table (columns, cell slots, sort, keyboard rows, loading rows, load more, empty), status segments, status and owner filters, status pill | mounted tests; axe |
| 08 | Decision modal: window frame with queue navigator, panes, tabs and foldable sections; stepper; footer action bar; history timeline; result card; choice cards | mounted tests; axe |
| 09 | A value beside its source; overview cards (stat card, segmented bar) | mounted tests; axe |
| 10 | `guidelines/app-patterns.md` and `guidelines/specialising.md` point each pattern to its component; `GOVERNANCE.md` gains the component semver rule; README section on the package | `guidelines.test.mjs` and `package.test.mjs` |

Later, each when both review screens need it: keyboard shortcuts help, code tile and chip, search field, global search, page header with breadcrumb, key-value list, reading drawer, confirm modal, facets, detail sheet, annotated text.

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
