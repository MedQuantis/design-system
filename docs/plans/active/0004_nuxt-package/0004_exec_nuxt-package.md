---
type: Implementation Plan
title: "Plan-0004: the Nuxt package of app components (@medquantis/nuxt 0.x)"
description: Turns the repository into a two-package workspace and builds @medquantis/nuxt, a Nuxt layer with the Nuxt UI theme wiring and the product-agnostic app components of guidelines/app-patterns.md, in the order the consuming apps need them; ADR-0009 decides it.
tags: [design-system, apps, components, nuxt, packaging, release]
timestamp: 2026-11-11T00:00:00+01:00
status: draft
owner: Victor Hueni
last_reviewed: 2026-11-11
review_interval: 30d
---

# Implementation Plan: the Nuxt package of app components

## Summary

[ADR-0009](../../../architecture/decisions/adr-0009-app-components-ship-as-a-second-package.md) (draft) decides that app components ship as a second package beside the core. This plan builds that package, `@medquantis/nuxt`, starting with the piece that is copied today (the Nuxt UI theme wiring) and then the components in the order the consuming apps need them.

This plan is a draft and has had no peer review. It starts only when both owners have agreed to the proposal below and ADR-0009 is accepted.

Source: an inventory of 2026-11-11 of the first product's two Nuxt apps (93 components) and of the designed screens of two apps; the evidence document lives in that product's repository. No PRD.

Principles:

1. One increment equals one coherent change set and one commit.
2. Every increment is test-driven: write-first tests observed red, then a green gate; `progress.txt` records both runs.
3. `make check` stays the single local entry point and CI runs the same target.
4. The core package's outputs, tarball, exports and tags do not change in any increment.
5. A component is generalised in the app that owns it first, then moved here; this plan receives components, it does not design them.

## Proposal (text for the governance issue)

`GOVERNANCE.md` asks for a written proposal before a large change. Text to file as the issue:

> **Title:** Ship the shared app components as a second package, `@medquantis/nuxt`
>
> **Problem.** `guidelines/app-patterns.md` describes the app patterns, and each app draws them itself. In the first product this has produced one Nuxt UI theme wiring copied in two apps and the same patterns drawn up to five times. Nine more screens of the internal review app and a second app in another repository are designed on the same shell, table, filters, status pill and decision window. The promotion rule of ADR-0002 has no destination for a framework component.
>
> **Consumers affected.** The two Nuxt apps of the first product and one app in another repository. Consumers that are not Nuxt apps (documents, slides, website, kit, skill) are not affected: the core package does not change.
>
> **Proposed change.** Make the repository a two-package workspace. The core stays at the root, unchanged. A second package, `@medquantis/nuxt`, is a Nuxt layer holding the theme wiring, product-agnostic components for the patterns of `app-patterns.md` (no wording, no domain types, no routes, no data fetching), and the formatters of `data-patterns.md`. It has its own version and tags and depends on the core, never the reverse. ADR-0009 amends the framework-neutrality clause of ADR-0002 so that it applies to the core package.
>
> **Cost.** A second toolchain (TypeScript, Vue, Nuxt, a component test runner) and a second release track; a component API becomes a public contract.
>
> **Alternatives considered.** Keep components in each app; publish from the product repository; a separate repository. See ADR-0009.

## Design

**Layout**

```
package.json            @medquantis/design-system, gains "workspaces": ["packages/*"]
packages/
  nuxt/
    package.json        @medquantis/nuxt
    nuxt.config.ts      the layer: modules, css, ui and icon settings
    app/
      app.config.ts     Nuxt UI colours, radius, warning variants
      assets/css/main.css
      components/       Mq*.vue
      utils/            formatters
    playground/         a Nuxt app that extends the layer and mounts every component
    tests/
```

**Release**

- `release-please-config.json` gains a second entry, `packages/nuxt`, with `include-component-in-tag: true` and the component name `nuxt`, so its tags read `nuxt-vX.Y.Z`. The root entry is unchanged.
- `release.yml` packs and publishes the package that was released; each package has its own npm trusted publisher.
- The second package starts at 0.1.0 and stays on 0.x for the whole of this plan.

**Installation**

- `make` installs with `npm ci --ignore-scripts`, and a Nuxt package needs its types prepared; a Makefile target calls `nuxi prepare` explicitly for `packages/nuxt` and its playground.
- Node stays at the version `mise.toml` pins; the package declares `engines.node >=24` like the core.

**Checks added to `make check`**

- ESLint and type check of `packages/nuxt`.
- Component tests mounted in a real Nuxt environment.
- Playground built twice: server-rendered and as a static single-page app.
- Guards on the package source: no colour, font or shadow literal; no assignment to `--mq-*`; no user-visible string outside a prop default that is empty; no import of a remote asset.
- The confidentiality scan already covers every file; fixtures use fictitious data.

**Consumer contract**

- `extends: ['@medquantis/nuxt']` and exact pins on `@medquantis/nuxt` and `@medquantis/design-system`.
- The consumer keeps: wording, domain types, routes, data fetching, permissions, and its domain components.

## Increments

| # | Change set | Gate |
| :-- | :-- | :-- |
| 01 | Workspace: root `workspaces`, empty `packages/nuxt` with its `package.json`; `release.test.mjs`, `package.test.mjs` and `workflows.test.mjs` extended to assert both packages | `make check` green; the core tarball is byte-identical to the one before |
| 02 | Release track: second release-please entry, `release.yml` for two packages, Dependabot entry for `packages/nuxt` | unit tests on the release shape; a dry-run pack of both packages |
| 03 | The layer with the theme only: `app.config.ts`, `main.css`, `ui` and `icon` settings, playground with one page; the Makefile targets and the guards | playground builds in both modes; the guards pass |
| 04 | Release 0.1.0 and consume it in the two apps of the first product and in the second app | in a consumer's built output: the layer's Tailwind classes are present, every icon is bundled, and the static build passes that app's content security policy. This is the riskiest unknown and it is tested before any component is built |
| 05 | Formatters of `data-patterns.md` | unit tests on each pattern |
| 06 | Shell: app shell, navigation with groups and counts, user menu, environment banner, shortcuts help, error state, empty state, access-refused page | mounted tests; axe on the playground |
| 07 | Worklist set: data table (columns, cell slots, sort, keyboard rows, skeleton, load more, empty), labelled filter select, segmented filter, checkbox filter, search field, status pill, code tile, code chip | mounted tests; axe |
| 08 | Review window set: window frame with queue navigator, panes, tabs and foldable sections; stepper; action bar; timeline; before and after card; annotated text with selection popover | mounted tests; axe |
| 09 | `guidelines/app-patterns.md` and `guidelines/specialising.md` point each pattern to its component; `GOVERNANCE.md` gains the component semver rule of ADR-0009; README section on the package | `guidelines.test.mjs` and `package.test.mjs` |

Blocks that enter later, each when a second screen needs it and through the promotion rule: global search, page header with breadcrumb, key-value list, reading drawer, confirm modal, facets, detail sheet, segmented bar, stat card, charts.

## Risks

| Risk | Mitigation |
| :-- | :-- |
| Tailwind does not scan, or icons are not bundled, for a layer installed from `node_modules` | Increment 04 proves it before any component work; the fallback is an explicit `@source` and an icon list exported by the package |
| A component API is frozen too early | 0.x for the whole plan; a component moves here only after its owning app has generalised it |
| Version drift between `nuxt`, `@nuxt/ui` and the package across consumers | tight peer ranges; one Dependabot group per consumer for the two MedQuantis packages |
| The second toolchain slows `make check` | the playground builds run only when `packages/nuxt` changed |
| Slow loop for the app that is building screens | a consumer can point `extends` at a sibling checkout during development; only the release is a separate step |

## Out of scope

- Any change to the core package's outputs.
- Domain components, wording and API types of any app.
- Components for another framework.
- Dark values beyond what the core's dark theme already gives.
