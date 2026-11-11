---
type: Architecture Decision Record
title: An optional Vue component package for MedQuantis review screens
description: The repository publishes @medquantis/ui, an optional Nuxt layer of presentation components on Nuxt UI 4, with its own version and CI job, beside core outputs that stay framework-neutral; components are extracted from the first product's layer with their tests, with its wording, API types and fixtures replaced by neutral ones.
tags: [design-system, components, vue, nuxt, packaging]
timestamp: 2026-11-06T19:00:00+01:00
status: draft
owner: design-system owner
last_reviewed: 2026-11-06
review_interval: 180d
---

# An optional Vue component package for MedQuantis review screens

## Context and Problem Statement

Two MedQuantis apps build review screens of the same shape: Paracel's Maintainer, a Nuxt 4 and Nuxt UI 4 single-page app, and a second app that ships into customers' networks and is also a Vue front end, as its owner ruled on 2026-11-06 ([#44](https://github.com/MedQuantis/design-system/issues/44)). Their shared presentation components sit in a private Nuxt layer inside Paracel's repository, which the second app must not depend on, so the shared components need a home outside Paracel.

[ADR-0002](adr-0002-central-tokens-first-design-system.md) ruled on 2026-10-09 that this repository ships "no framework components", and that wiring two consumers share "may ship as a separate optional sub-path export generated from the tokens, never as part of the core outputs". The question is whether Vue components may ship from here under that exception, and how.

## Decision Drivers

- One component library for the MedQuantis review screens, so a fix or a pattern lands once.
- Documents, slides, the kit renderers and the website must not change or take a framework dependency.
- The public repository's confidentiality gate applies to every file ([ADR-0005](adr-0005-public-repo-with-confidentiality-gate.md)).
- A solo-maintained toolchain: as few repositories and release pipelines as the boundary allows.

## Considered Options

- An optional package in this repository, `@medquantis/ui`, with its own version.
- A new repository for the component library.
- Components stay in each app, sharing only the tokens and the app patterns.

## Decision Outcome

Chosen option: "An optional package in this repository", decided by the owner on 2026-11-06 ([#44](https://github.com/MedQuantis/design-system/issues/44#issuecomment-6687308884)), because it is the exception ADR-0002 already allows and adds one package, not one repository.

- **Package:** `@medquantis/ui` in `packages/ui/`, a Nuxt layer on Nuxt UI 4 built from `dist/tokens.css` and the Tailwind theme. It pins `@medquantis/design-system` by exact version; consumers pin `@medquantis/ui` by exact version, bumped by Dependabot.
- **Scope:** presentation components only. No API calls, no domain vocabulary (no indication, limitation or case component), no app routes. A component enters only if both review screens need it, the promotion tests of ADR-0002 applied to two apps.
- **Core unchanged:** the core outputs stay framework-neutral, and no core output imports from `packages/ui/`.
- **Clean origin:** components are extracted from Paracel's layer, not rewritten (owner, 2026-11-10, [#44](https://github.com/MedQuantis/design-system/issues/44)). Each generic component moves with its tests; Paracel's wording, API types and fixtures are replaced with neutral, fictitious ones, and each component passes `make confidentiality-check` like every other file (ADR-0005), so no Paracel data or domain vocabulary reaches this repository. The Maintainer then imports them from `@medquantis/ui`, so one copy exists.
- **Releases:** its own release-please component and version, tagged with its component name (for example `ui-v0.1.0`); the core package keeps its tags and versioning.
- **CI:** a separate job, run only when `packages/ui/**` changes, for the build, type check and tests.
- **First components:** the app shell, the sign-in, access-refused and error pages, the work queue with status and owner filters, a value beside its source, and the decision modal. Keyboard shortcuts come later.

### Consequences

- Good: one library for both review screens; a component fixed here reaches both apps by a version bump.
- Good: no consumer of the core outputs sees a change; the core's semver rules in [GOVERNANCE.md](../../../GOVERNANCE.md) apply to `@medquantis/ui` separately.
- Bad: a Nuxt and Nuxt UI toolchain and its npm dependencies enter this repository, with their own updates to review.
- Bad: each component must be made generic before it moves (wording, API types and fixtures replaced), and the Maintainer must move from its local components to the package.
- Bad: a breaking change in the package is a coordinated release across two apps.

## Pros and Cons of the Options

### An optional package in this repository

- Good: allowed by ADR-0002's exception; tokens and components live side by side; one repository and one gate.
- Bad: the repository is no longer framework-free as a whole, only in its core outputs.

### A new repository

- Good: this repository stays framework-free.
- Bad: a third repository, release pipeline and confidentiality gate to run alone.

### Components stay in each app

- Good: no new package.
- Bad: every component is built twice and drifts; the second app cannot reuse the Maintainer's.

## More Information

- Refines [ADR-0002](adr-0002-central-tokens-first-design-system.md) (framework neutrality applies to the core outputs) without superseding it.
- Consumers: Paracel's Maintainer and the second review screen named in [#44](https://github.com/MedQuantis/design-system/issues/44).
