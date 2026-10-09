# MedQuantis design system

The single source of the MedQuantis visual identity: design tokens, shared CSS, self-hosted fonts and icons, brand assets, guidelines and a Claude skill. Every value is defined once, in `tokens/`, and reaches each consumer as a generated output in its native format ([ADR-0002](docs/architecture/decisions/adr-0002-central-tokens-first-design-system.md)).

> Status: bootstrap. Nothing is published yet; the repository stays private until the pre-public confidentiality audit passes ([ADR-0005](docs/architecture/decisions/adr-0005-public-repo-with-confidentiality-gate.md)).

## Outputs

| Output | For |
| :-- | :-- |
| `dist/tokens.css` | Every consumer: `--mq-*` custom properties ([ADR-0006](docs/architecture/decisions/adr-0006-mq-token-prefix.md)) |
| `dist/tokens.json` | Scripts and pipelines that need resolved values |
| `dist/tailwind.css` | Tailwind 4 and Nuxt UI apps (`@theme` with 50 to 950 scales) |
| `dist/kit-contract.css` | homemade-claude-kit renderers only, deployed as `docs/ux/tokens.css`; never loaded in an app |
| `css/` | Shared `mq-` components, slide canvas and A4 print styles for build-less media |
| `fonts/`, `icons/`, `brand/` | Self-hosted fonts, a pinned Lucide build, logos and monogram |
| `guidelines/` | Brand, voice, colour, typography, chart, data and accessibility rules |

The design system ships framework-neutral outputs only (CSS, JSON, Tailwind theme, static assets). Wiring the tokens into a component library (Nuxt UI, shadcn/ui) belongs to the consumer.

## Consumption

- **Node consumers** install `@medquantis/design-system` at an exact version and let Dependabot propose bumps.
- **Build-less and Python consumers** reference the CDN URL of a tagged release, or vendor a release into `vendor/medquantis-ds/` with `make design-sync`, a `VERSION` file and a CI check that the copy matches the tag.
- Upgrades are deliberate: never a version range, never a branch URL.

## Specialisation rules

1. Core and semantic tokens are not overridden in a consumer.
2. A product-level variation, if ever needed, is a theme in this repo, never a local override.
3. Local additions use the consumer's own prefix (`--deck-*`, `--app-*`) and reference `var(--mq-*)` only; a stylelint rule blocks raw hex colours outside this repo.
4. A component invented locally in two consumers is a candidate for promotion here if it is useful, unique, consistent and versatile (see [GOVERNANCE.md](GOVERNANCE.md)). Every local one-off is logged in [docs/one-offs.md](docs/one-offs.md).

## Development

```sh
mise install   # Node 24 and gitleaks, pinned in mise.toml
make check     # lint, build, tests and the confidentiality check
```

`make check` is the single local entry point and mirrors CI.

## Licence

Code, tokens and generated CSS are MIT. `brand/` and `guidelines/` are © MedQuantis SA, all rights reserved. Fonts keep their OFL licence. See [LICENSE](LICENSE).
