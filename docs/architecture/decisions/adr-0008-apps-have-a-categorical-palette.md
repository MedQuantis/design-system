---
type: Architecture Decision Record
title: Interactive apps have a categorical palette and change-type tokens
description: Apps may colour many-category charts and data categories with six vivid hues and three change-type tokens built on them, light only; documents keep the navy and blue-grey ordered palette, and no chart series ever takes a status colour.
tags: [design-system, colour, charts, accessibility, apps]
timestamp: 2026-11-03T08:00:00+01:00
status: accepted
owner: design-system owner
last_reviewed: 2026-11-03
review_interval: 180d
---

# Interactive apps have a categorical palette and change-type tokens

## Context and Problem Statement

`guidelines/charts.md` allowed the navy and blue-grey family only, in every medium: four ordered series and a remainder. A public data app built on the design system shows six change series side by side, and lists changes of three types (added, modified, removed) in badges, table dots, filter pills and counts. With four navy and blue-grey steps the six series stop being readable, and its product owner rejected both navy-only and muted charts for it. The app kept its own hues as a logged one-off ([#35](https://github.com/MedQuantis/design-system/issues/35)). Any other MedQuantis app that charts many categories or lists changes would define its own again.

## Decision Drivers

- Six categories must stay apart under normal vision and under protanopia and deuteranopia
- A data category must never read as a system status (ADR-0004)
- Colour must never be the only carrier of meaning (WCAG 1.4.1)
- Documents stay navy-only (ADR-0003, ADR-0004)

## Considered Options

- Navy and blue-grey only, more series by repetition or patterns
- Okabe-Ito: two light hues need outlines on white, and it reads softer
- IBM Carbon in its slot order: "removed" turns teal and "status" red
- The six hues the requesting app tested (its "option F"), with change-type tokens on top

## Decision Outcome

Chosen option: the six hues of option F with change-type tokens, decided by the owner on 2026-11-03 with the values as requested, light only (owner rulings 20 and 21).

- Tokens: `--mq-app-cat-green` `#1c7e3f`, `--mq-app-cat-orange` `#d78000`, `--mq-app-cat-orange-text` `#a35f00`, `--mq-app-cat-vermillion` `#cf2a00`, `--mq-app-cat-blue` `#3a8ff5`, `--mq-app-cat-violet` `#5a2fbe`, `--mq-app-cat-teal` `#178a91`; `--mq-change-added` (green), `--mq-change-modified` (orange) with `--mq-change-modified-text` (orange text), `--mq-change-removed` (vermillion).
- Apps only, like the status colours: the skill's validator and token lookup refuse them in documents.
- A one-series chart stays navy; up to four series the ordered palette still applies.
- No series uses a status token. The vermillion is a data category, not an error; `--mq-danger` stays for errors.
- Marks sit on the surface, where every hue meets 3:1; text in a hue meets 4.5:1, hence the orange text shade; the blue and the teal are never text.
- Never colour alone: every mark carries a label, a legend entry, a sign or a word.
- Light only: the dark theme re-values none of these tokens until their dark values are ruled.

Measured with the design system's own colour maths (WCAG 2.x contrast; CIEDE2000; Machado, Oliveira and Fernandes 2009 at severity 1.0), between the six hues and navy series 1: smallest distance 17.4 normal, 11.9 protanopia, 12.9 deuteranopia, 8.4 tritanopia (green and teal), 0.8 achromatopsia (green and vermillion share their lightness). The token test holds 15, 10, 10 and 8 and does not test achromatopsia, which the never-colour-alone rule covers. Three hues sit close to a status colour: the green 3.3 from `--mq-success`, the orange 2.2 from `--mq-warning-fill`, the orange text 2.8 from `--mq-warning`, the vermillion 7.9 from `--mq-danger`.

### Consequences

- Good: one set of values for the same meaning in every MedQuantis app; the requesting app deletes its local exception and aliases its local names to these tokens.
- Bad: tritanopia (8.4) and achromatopsia sit below the ordered palette's floor of 10, so the label rule carries part of the accessibility; the change types look like the status colours, so code must tell them apart by name and the screen by word or sign; the orange is below 3:1 on the canvas (2.88:1) and on the recessed surface, so charts in these hues sit on the surface.
- Open: dark values for the palette, when a dark app needs them.
