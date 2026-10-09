---
type: Architecture Decision Record
title: MedQuantis navy is the single brand accent everywhere
description: Navy #0a2463 is the accent for every MedQuantis surface including the Paracel app; Swiss red #d8232a remains only as the danger status colour, and no Paracel theme is created.
tags: [design-system, brand, colour]
timestamp: 2026-10-09T19:06:23+02:00
status: draft
owner: Victor Hueni
last_reviewed: 2026-10-09
review_interval: 180d
---

# MedQuantis navy is the single brand accent everywhere

## Context and Problem Statement

Decks, papers, the website and the platform viewer use navy `#0a2463` as accent. The Paracel app (`frontend/`) and the 6 Paracel slide decks use Swiss red `#d8232a` as `primary`, inherited from the March 2026 "SL Platform" design system. `brand.md` states that Paracel is the internal product name and MedQuantis the public brand, yet the LS Explorer is public. Should the product keep its own accent?

## Decision Drivers

- One public identity for a small company
- Paracel is positioned as the technology, not a separate brand
- Avoid maintaining a second theme without a stated business reason

## Considered Options

- Navy everywhere, red only as the danger status colour
- A `paracel` theme in the central repo keeping red as Paracel's accent

## Decision Outcome

Chosen option: "Navy everywhere, red only as the danger status colour", decided by the owner on 2026-10-09. No `paracel` theme exists in v1; the theme layer of ADR-0002 stays available should a sub-brand ever be decided.

### Consequences

- Good: one recognisable identity across app, decks, papers and website; no second palette to maintain
- Bad: the Paracel frontend must switch `primary` from the red scale to a navy 50 to 950 scale and re-check every component that relied on red for emphasis (active tab, focus ring, logo); Paracel's 6 slide decks change accent when next edited
