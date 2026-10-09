---
type: Architecture Decision Record
title: Status colours are for interactive apps only
description: Documents stay navy-only and encode state by mark style; interactive apps may use success, warning, danger and info colours for genuine system status, always paired with an icon or a word.
tags: [design-system, colour, accessibility]
timestamp: 2026-10-09T19:06:23+02:00
status: draft
owner: Victor Hueni
last_reviewed: 2026-10-09
review_interval: 180d
---

# Status colours are for interactive apps only

## Context and Problem Statement

The platform report design system (2026-10-08) forbids green, orange and red: states read by mark style (filled, pale, outline, dashed, struck). The Paracel app uses `success #2e7d32`, `warning #d4850a` (text variant `#a06400` for AA), `error #d8232a`, `info #1565c0`, plus six annotation hues for limitation text, and Nuxt UI components (`UAlert`, `UBadge`, form validation) expect status colours. One rule cannot fit both without redesigning one side.

## Decision Drivers

- Documents must stay sober and print legibly in black and white
- App users expect a red error and a green confirmation
- Colour must never be the only carrier of meaning (WCAG 1.4.1)

## Considered Options

- Navy-only everywhere, apps included
- Status colours defined centrally, usage rule split by medium

## Decision Outcome

Chosen option: "Status colours defined centrally, usage rule split by medium", decided by the owner on 2026-10-09.

- Documents (decks, reports, papers, newsletters, website): navy-only, state by mark style. No change from the 2026-10-08 rule.
- Interactive apps (Paracel frontend, platform viewer): `--mq-success`, `--mq-warning`, `--mq-danger`, `--mq-info` for genuine system status only (errors, validation, alerts, confirmations), always paired with an icon or a word.
- Paracel's six limitation-annotation hues stay local to the Paracel repo under `--app-*` until a second consumer needs them (promotion rule, ADR-0002).
- Text-on-light variants that meet WCAG AA (such as `#a06400` for warning) are part of the central semantic layer.
- Warning is split in two tokens (owner, 2026-10-09): `#d4850a` as a fill only, always with ink text, and `#a06400` for warning text, icons and borders. `#d4850a` fails WCAG AA as text (2.81:1 on canvas) and the 3:1 non-text minimum as an icon or border; white on it fails (2.93:1).

### Consequences

- Good: no frontend redesign; one value per status colour across all apps; documents keep their established style
- Bad: the guidelines must state the medium split clearly, and a lint cannot easily tell a document from an app, so review carries part of the enforcement
