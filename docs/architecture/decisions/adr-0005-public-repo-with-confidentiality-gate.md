---
type: Architecture Decision Record
title: Public repository behind a confidentiality gate
description: The design-system repo is public from the start; nothing merges or releases unless an automated confidentiality scan and CODEOWNER review pass.
tags: [design-system, security, governance]
timestamp: 2026-10-09T19:06:23+02:00
status: draft
owner: Victor Hueni
last_reviewed: 2026-10-09
review_interval: 180d
---

# Public repository behind a confidentiality gate

## Context and Problem Statement

A public repo lets build-less consumers load a tagged release from a CDN and avoids registry tokens for the npm package. The material that currently describes the design system is not publishable as-is: the 2026-10-08 report design system cites client deck paths (insurer names) as its sources, and deck excerpts carry client names and figures. Brand tokens, logos and OFL fonts are already public on medquantis.ch.

## Decision Drivers

- Simplest possible consumption for the website and deck pipelines
- Zero leakage of client names, prices, people or internal systems
- A leak in a public repo is permanent (forks, caches, CDN mirrors)

## Considered Options

- Private repo, consumption via GitHub Packages token and vendored release copies
- Public repo with a blocking confidentiality gate

## Decision Outcome

Chosen option: "Public repo with a blocking confidentiality gate", decided by the owner on 2026-10-09, on the condition that the control is in place before the first public push.

The gate has three layers:

1. **Clean origin.** Content is rewritten, never bulk-copied, from platform or Paracel. Examples use fictitious data only ("Assureur A", "Médicament X", round illustrative amounts). Source citations naming client decks are removed. The repo starts from a fresh history, and a full-tree plus full-history audit passes before the visibility switch.
2. **Automated CI check, blocking on every PR and on release tags:** gitleaks for secrets; a deny-list scan of client, partner and person names, the list held in a private MedQuantis repo and read in CI with a scoped token; a pattern scan for CHF amounts and prices anywhere, and inside `examples/` for any amount or percentage without an illustrative marker (`mq:illustrative`); a scan for internal paths and hosts (SharePoint, `crm/`, private repo names); a metadata check on images and SVGs (EXIF, author, embedded file paths). The same check runs locally as `make confidentiality-check`.
   Percentages outside `examples/` are not scanned (owner, 2026-10-09): they are routine in CSS and in chart and accessibility guidelines, so flagging them would train contributors to add markers by reflex. A bare percentage reveals nothing on its own; it becomes sensitive only next to a client or product name, which the deny-list scan and the clean-origin rule already cover.
3. **Human review.** CODEOWNER approval required, `main` protected, releases only from reviewed tags.

Licensing (owner, 2026-10-09): public visibility serves distribution, not reuse. Code, tokens and generated CSS are MIT; logos, monogram and the written guidelines are "© MedQuantis SA, all rights reserved", excluded from the MIT licence in the root `LICENSE`; fonts keep their OFL licence. Agencies and freelancers get usage rights through their contract.

### Consequences

- Good: CDN consumption, no registry tokens, the brand reference is shareable with agencies and freelancers
- Bad: the private deny-list must be maintained (a new client name is added when its CRM organisation file is created); every guideline example costs the effort of inventing neutral data
