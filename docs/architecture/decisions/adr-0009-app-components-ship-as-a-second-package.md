---
type: Architecture Decision Record
title: App components ship as a second package beside the core
description: The repository gains a second npm package, a Nuxt layer with the theme wiring and the product-agnostic app components, that depends on the core design system; the core package stays framework-neutral. Amends the framework-neutrality clause of ADR-0002.
tags: [design-system, apps, components, nuxt, packaging]
timestamp: 2026-11-11T00:00:00+01:00
status: draft
owner: Victor Hueni
last_reviewed: 2026-11-11
review_interval: 180d
---

# App components ship as a second package beside the core

## Context and Problem Statement

ADR-0002 keeps this repository framework-neutral: "the design system ships only framework-neutral outputs (CSS, JSON, Tailwind theme, static assets) and no framework components. Wiring into a component library belongs to the consumer". `guidelines/app-patterns.md` therefore describes each app pattern (shell, review table, decision window, status pill, timeline) in prose and leaves the components that draw it to each app.

An inventory of 2026-11-11 measured what that produces in the first product built on the design system:

- Two Nuxt 4 and Nuxt UI 4 apps hold 93 components. The Nuxt UI theme wiring (`app.config.ts`: colour aliases, radius steps, the warning variants) is the same file in both, copied.
- The same patterns are drawn several times: five stat tiles, three segmented controls, two timelines, two labelled filter selects, about twenty inline empty and error blocks.
- None of the 38 components of the internal review app is reusable as written: 36 import that app's wording and 32 its API types, although 28 of them are a generic frame around domain content.
- Nine more screens of that app are designed, and they reuse the same shell, table, filters, status pill and decision window.
- A second MedQuantis app, in another repository, is designed on the same frame. Its approval prototype shares about half of its building blocks with the review app's prototypes.

ADR-0002's own promotion rule says a component invented in two consumers is a candidate for promotion here. For app components that rule has no landing place: the repository ships no framework code. Where should the shared app components live, and how does the core stay usable by documents, slides, the website and any other framework?

## Decision Drivers

- One definition of each app pattern, as ADR-0002 asks for each value
- The core must stay framework-neutral: documents, slides, the website, the kit and the Claude skill consume it without any framework
- A consumer in another repository must be able to install the components at a pinned version
- Tokens and components change at different speeds and break in different ways
- Two owners maintain the repository; one more toolchain has a cost

## Considered Options

1. Keep the components in each app (ADR-0002 unchanged)
2. Hold them in the product monorepo and publish a package from there
3. A separate repository for a Nuxt component package that depends on the core
4. A second package in this repository, beside the core

## Decision Outcome

Chosen option: 4, a second package in this repository, because it is the usual shape of a design system kept by one team for one main framework (tokens and components as separate packages of one repository), it gives the promotion rule a landing place, and it lets a new token and the component that needs it land in one pull request.

**Shape**

- The core package `@medquantis/design-system` stays at the repository root with its contents, exports, tarball and `vX.Y.Z` tags unchanged.
- The root `package.json` gains `workspaces`. A second package lives in `packages/nuxt/` and is published as `@medquantis/nuxt`.
- `@medquantis/nuxt` is a Nuxt layer: a consumer adds it to `extends` and receives the theme wiring, the components and the formatters.
- Dependency runs one way. `@medquantis/nuxt` depends on the core; nothing in the core imports, names or generates anything for it.

**What the second package holds**

- The Nuxt UI wiring on the tokens: colour aliases, radius steps, warning variants, fonts, focus ring.
- Product-agnostic components that implement `guidelines/app-patterns.md`: each pattern's anatomy and states, with everything the guideline lists under "Stays in the app" passed in by the consumer.
- The formatters of `guidelines/data-patterns.md` (numbers, percentages, dates, missing values).

**Rules for a component in the second package**

1. No user-visible string: every label is a prop or a slot. The package ships no language.
2. No domain type, no route, no data fetching, no permission logic.
3. Values come from `--mq-*` tokens only, as in the core CSS.
4. Safe under server rendering and under a static single-page build; light theme, with the dark theme working when the consumer loads it.
5. Self-contained: no remote font, image, icon or script.
6. One name prefix, `Mq`.
7. A mounted test and a place in the playground for every component.
8. A component enters only through the promotion rule of ADR-0002 (two consumers, four tests). Domain components stay in the apps.

**What stays as ADR-0002 states it**

- The core outputs name no framework. The test on `dist/tokens.css`, `tokens.json`, `tailwind.css` and `kit-contract.css` is unchanged.
- The `mq-` component CSS remains for documents; apps still do not load it.
- Consumers pin exact versions and upgrade deliberately.

**Versioning of the second package**

- Its own version and tags (`nuxt-vX.Y.Z`), released independently of the core.
- Major: a component, prop, slot or emitted event removed or renamed, or a default that visibly changes consumers. Minor: a component, prop, slot or event added. Patch: a fix with no change to the API or the drawn result.
- It stays on 0.x until the shell, the worklist set and the review window set have each been used by two screens; on 0.x a minor version may break.
- Peer dependencies on `nuxt`, `@nuxt/ui` and the core, with ranges tight enough that a consumer cannot combine untested versions.

### Positive Consequences

- A pattern of `guidelines/app-patterns.md` has one implementation, tested once, for every MedQuantis app on Nuxt
- The guideline and the component sit in one repository and are reviewed together
- A new app starts from the shell and the theme with one line of configuration
- The core is untouched for every consumer that is not a Nuxt app

### Negative Consequences

- A second toolchain in this repository (TypeScript, Vue, Nuxt, a component test runner) and a second release track, for two owners to maintain
- A component API becomes a public contract; a prop rename is a versioned change
- An app gets a component change only through a release and a version bump, where today it edits its own file
- The repository is public and scanned for confidentiality: fixtures and examples must be fictitious
- Apps on another framework get nothing from the second package; they keep the tokens and the guidelines

## Pros and Cons of the Options

### 1. Keep the components in each app

#### Positive

- No change here

#### Negative

- Already produces copies: one theme wiring twice, the same patterns drawn up to five times
- A second app in another repository can only copy

### 2. Hold them in the product monorepo and publish from there

#### Positive

- A component and the screen that uses it change in one pull request

#### Negative

- The shared library of every product is released from one product's repository
- The guideline and its implementation live apart

### 3. A separate repository for the component package

#### Positive

- No change to this repository's single-package shape or to ADR-0002
- Independent toolchain and release

#### Negative

- A third repository, with its own CI, governance and release set-up
- A component that needs a new token takes two releases in two repositories
- Guideline and implementation are reviewed apart

### 4. A second package in this repository

#### Positive

- One place for tokens, guidelines and components; one review
- The promotion rule gets a destination
- Same pattern as the larger public design systems that serve one main framework

#### Negative

- The repository becomes a workspace with two release tracks
- More tooling to keep current

## Links

- Amends [ADR-0002](adr-0002-central-tokens-first-design-system.md), "Framework neutrality": the clause now applies to the core package, not to the repository
- [guidelines/app-patterns.md](../../../guidelines/app-patterns.md), [guidelines/data-patterns.md](../../../guidelines/data-patterns.md), [guidelines/specialising.md](../../../guidelines/specialising.md)
- [Plan-0004](../../plans/active/0004_nuxt-package/0004_exec_nuxt-package.md)
