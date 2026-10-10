# Specialising the design system

The design system is the single source of the MedQuantis visual identity ([ADR-0002](../docs/architecture/decisions/adr-0002-central-tokens-first-design-system.md)). A consumer uses it as released and adds only what it alone needs.

## Framework neutrality

The design system ships framework-neutral outputs only: CSS custom properties (`dist/tokens.css`), resolved values (`dist/tokens.json`), a Tailwind theme (`dist/tailwind.css`), the kit contract for kit renderers (`dist/kit-contract.css`), the shared `mq-` CSS, fonts, icons and brand files. It ships no framework component.

- Wiring the tokens into a component library (Nuxt UI, shadcn/ui, Radix, MUI) belongs to the consumer. For example, a component library that names its error colour `error` maps it to `--mq-danger` in the app, not here.
- When two consumers need the same wiring, it may ship here as a separate optional export generated from the tokens, never as part of the core outputs.
- Apps with a component library take the tokens and the Tailwind theme only. They do not load the `mq-` component CSS and never load `kit-contract.css`, whose unprefixed names collide with framework variables.

## Use what exists first

- Build documents from the shared `mq-` classes with their documented markup. Every shared class carries the `mq-` prefix so it never collides with a consumer's classes.
- Add no colour, font, shadow, radius or spacing that is not a token. When a need is not covered, combine existing components before inventing one.
- The specimen (`make specimen`, then `dist/specimen/index.html`) is the visual reference; when a rendering is in doubt, it decides.
- Pin an exact release; never a range or a branch.

## The four rules

1. **Core and semantic tokens are never overridden in a consumer.** A consumer does not redefine `--mq-accent` or any other `--mq-*` name.
2. **A product-level variation is a theme in this repository**, never a local override. There is no theme in v1 ([ADR-0003](../docs/architecture/decisions/adr-0003-navy-is-the-single-brand-accent.md)).
3. **Local additions use the consumer's own prefix** (`--deck-*`, `--app-*`) and reference `var(--mq-*)` only. The shared stylelint config (`@medquantis/design-system/stylelint`) rejects literal colours, fonts and shadows, `!important`, unknown custom properties and any radius other than the three radius tokens. A repository whose dense views need a sans body may override its own body family locally under its prefix.
4. **A component invented locally in two consumers is a candidate for promotion** into this repository.

## Promotion tests

A local component is promoted only if it passes all four tests:

| Test | Question |
| :-- | :-- |
| Useful | Is it needed in more than one place? |
| Unique | Does it avoid duplicating an existing component? |
| Consistent | Is it built from existing tokens and styles only? |
| Versatile | Does it fit uses beyond the two that produced it? |

## The one-off log

Every local one-off (a component or a token a consumer adds under its own prefix) is logged in [`docs/one-offs.md`](../docs/one-offs.md), one line each: the consumer, what was added, the date, and the outcome. The outcome is one of: promoted, kept local (with the reason), or replaced by an existing component. The log is how two independent one-offs are noticed and become a promotion candidate. Proposals follow the two contribution tiers of [GOVERNANCE.md](../GOVERNANCE.md).
