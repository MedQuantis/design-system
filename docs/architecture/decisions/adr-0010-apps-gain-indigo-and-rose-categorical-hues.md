---
type: Architecture Decision Record
title: Apps gain an indigo and a rose categorical hue for the parts of a rule row
description: The app categorical palette gains --mq-app-cat-indigo and --mq-app-cat-rose, light only and apps only, so an app can colour the three parts of a rule row; the middle part reuses --mq-app-cat-orange-text, because the requested ochre is the warning status colour.
tags: [design-system, colour, apps, accessibility]
timestamp: 2026-11-15T20:00:00+01:00
status: accepted
owner: design-system owner
last_reviewed: 2026-11-15
review_interval: 180d
---

# Apps gain an indigo and a rose categorical hue for the parts of a rule row

## Context and Problem Statement

Paracel's Maintainer shows restitution rules as rows of three parts: « Quand » (when the rule applies), « Ce qui est payé » (what is paid) and « Combien » (how much), with the rule's own quoted text in `--mq-tertiary`. Its prototype colours each part with its own hue, and the owner chose the prototype's hues: an indigo, an ochre and a rose. The app palette of [ADR-0008](adr-0008-apps-have-a-categorical-palette.md) holds none of the three, and its blue, orange and vermillion already carry other meanings in that app: they colour the clinical families of a limitation text (patient criterion, limit or duration, restitution) on the tab beside the rule rows.

## Decision Drivers

- The three parts and the grey quotes must stay apart under normal vision and under protanopia, deuteranopia and tritanopia
- A data category must never read as a system status, nor take a status value ([ADR-0004](adr-0004-status-colours-in-apps-only.md), ADR-0008)
- Each part is read as text, so each hue meets 4.5:1 on the surface and the canvas
- Colour must never be the only carrier of meaning (WCAG 1.4.1)

## Considered Options

- Reuse the blue, the orange and the vermillion of ADR-0008
- Add an indigo, an ochre and a rose, as requested
- Add an indigo and a rose, and reuse `--mq-app-cat-orange-text` for the middle part

## Decision Outcome

Chosen option: add an indigo and a rose and reuse the orange text, decided by the owner on 2026-11-15. The requested ochre `#a06400` is exactly `--mq-warning`, a status colour, which ADR-0008 forbids as a data category; the orange text `#a35f00` is the nearest app hue and already meets 4.5:1.

- Tokens: `--mq-app-cat-indigo` `#4a5aa8` (core `app-indigo`), `--mq-app-cat-rose` `#b71c5a` (core `app-rose`), both for marks, fills and text.
- The rule row reads indigo for « Quand », `--mq-app-cat-orange-text` for « Ce qui est payé », rose for « Combien », and `--mq-tertiary` for the rule's own quotes.
- Apps only, like the rest of the palette: the skill's validator and token lookup refuse them in documents.
- Light only: the dark theme re-values neither token until their dark values are ruled.
- Never colour alone: each part carries its label.

Measured with the design system's own colour maths (`build/color-math.mjs`: WCAG 2.x contrast; CIEDE2000; Machado, Oliveira and Fernandes 2009 at severity 1.0). Contrast: the indigo 6.33:1 on the surface and 6.05:1 on the canvas, the rose 6.31:1 and 6.04:1, so white text on either as a fill meets 4.5:1 too, as it does on the orange text (5.01:1); the three pairs are declared, so a part's number can sit in white on a filled marker. Between the indigo, the orange text, the rose and `--mq-tertiary`, the smallest distance is 24.0 normal (indigo and grey), 15.1 protanopia (rose and grey), 9.8 deuteranopia (rose and grey), 8.9 tritanopia (orange text and rose) and 0.1 achromatopsia (indigo and rose share their lightness). The token test holds 15, 10, 9 and 8 and does not test achromatopsia, which the never-colour-alone rule covers. Near neighbours: the indigo sits 8.5 from `--mq-info` and 13.7 from the violet; the rose 17.4 from `--mq-danger` and 25.2 from the vermillion.

### Consequences

- Good: the app colours its rule rows from design-system tokens, with no local hue and no status colour.
- Bad: the indigo is close to `--mq-info` (8.5) and to the violet (13.7), so it stays out of the six-hue set that many-category charts take, and code tells it from the info status by name, the screen by word.
- Bad: deuteranopia (9.8) sits below the palette's floor of 10, and achromatopsia cannot tell the indigo from the rose, so the part labels carry part of the accessibility.
- Open: dark values, when a dark app needs them.

## Pros and Cons of the Options

### Reuse the blue, the orange and the vermillion

- Good: no new token.
- Bad: in that app those hues already mean clinical families on the neighbouring tab, so a colour would change meaning between tabs; the blue and the orange cannot be text, nor sit behind white text.

### Add an indigo, an ochre and a rose, as requested

- Good: the prototype's hues exactly.
- Bad: the ochre `#a06400` is the value of `--mq-warning`, so a rule part would wear the warning status, which ADR-0004 and ADR-0008 forbid.

### Add an indigo and a rose, and reuse the orange text

- Good: two tokens instead of three; every part meets 4.5:1 and none takes a status value.
- Bad: the middle part is a shade from the prototype's ochre (CIEDE2000 under 3, the same distance ADR-0008 records for the orange text from `--mq-warning`).

## More Information

- Extends the palette of [ADR-0008](adr-0008-apps-have-a-categorical-palette.md) without changing its decision; the values and rules are in [guidelines/charts.md](../../../guidelines/charts.md).
