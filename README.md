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
mise install   # Node, gitleaks, actionlint, zizmor and shellcheck, pinned in mise.toml
make check     # lint, workflow lint, build, tests and the confidentiality check
```

`make check` is the single local entry point and mirrors CI, which installs the same tools from `mise.toml` and runs the same target. Locally the deny-list scan warns when `MQ_DENYLIST` is unset; point it at a copy of the deny-list (or `tests/fixtures/denylist.txt` for a dry run) to run the full check.

Dependabot proposes weekly bumps for npm dependencies and GitHub Actions. It has no mise ecosystem, so the tool pins in `mise.toml` are bumped by hand, in a PR whose `make check` must pass.

## Owner set-up

CI fails closed until these exist:

1. A private MedQuantis repository holding the deny-list as `denylist.txt` at its root, one client, partner or person name per line.
2. A fine-grained personal access token with read-only `Contents` access to that repository alone, stored in this repository as the Actions secret `MQ_DENYLIST_TOKEN`, and again as a Dependabot secret of the same name so Dependabot PRs can run the scan.
3. The Actions variable `MQ_DENYLIST_REPO` set to that repository's `owner/name`, so its name stays out of this public repository.

## Licence

Code, tokens and generated CSS are MIT. `brand/` and `guidelines/` are © MedQuantis SA, all rights reserved. Fonts keep their OFL licence. See [LICENSE](LICENSE).
