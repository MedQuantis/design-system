---
type: Architecture Decision Record
title: Canonical token names carry the --mq- prefix
description: Every canonical CSS custom property is named --mq-*; unprefixed kit names and Tailwind --color-* names are generated mappings, never hand-written.
tags: [design-system, tokens, naming]
timestamp: 2026-10-09T19:06:23+02:00
status: draft
owner: Victor Hueni
last_reviewed: 2026-10-09
review_interval: 180d
---

# Canonical token names carry the --mq- prefix

## Context and Problem Statement

Existing consumers use short names (`--accent`, `--ink`, `--canvas-bg`). Nuxt UI generates `--ui-*`, Tailwind 4 uses `--color-*`, decks define their own variables, and the homemade-claude-kit renderers expect a generic unprefixed contract. Short canonical names collide with any of these.

## Decision Drivers

- No collision with framework or deck-local variables
- Kit renderers must keep working unchanged
- Matches the `mq-` class prefix already used by the report components

## Considered Options

- Keep the short names as canonical
- `--mq-` prefix as canonical, generated mapping files for other contracts

## Decision Outcome

Chosen option: "`--mq-` prefix as canonical, generated mapping files", decided by the owner on 2026-10-09. The build emits `dist/kit-contract.css` (short kit names carrying the literal values of their `--mq-*` source tokens, because the kit's release-note chart reads them as hex and falls back to its own blue on a `var()`) and `dist/tailwind.css` (`--color-*` scales for Nuxt UI). Neither is hand-edited.

### Consequences

- Good: collision-free names; one place defines each value; kit and Tailwind stay native
- Bad: decks still in edition need a search-and-replace from short names to `--mq-*` when migrated
