# MedQuantis design system

The single source of the MedQuantis visual identity: design tokens, shared CSS, self-hosted fonts and icons, brand assets, guidelines and a Claude skill. Every value is defined once, in `tokens/`, and reaches each consumer as a generated output in its native format ([ADR-0002](docs/architecture/decisions/adr-0002-central-tokens-first-design-system.md)).

> Status: bootstrap. Nothing is published yet; the repository stays private until the pre-public confidentiality audit passes ([ADR-0005](docs/architecture/decisions/adr-0005-public-repo-with-confidentiality-gate.md)).

## Outputs

| Output | For |
| :-- | :-- |
| `dist/tokens.css` | Every consumer: `--mq-*` custom properties ([ADR-0006](docs/architecture/decisions/adr-0006-mq-token-prefix.md)) |
| `dist/tokens.json` | Scripts and pipelines that need resolved values |
| `dist/tailwind.css` | Tailwind 4 and Nuxt UI apps (`@theme` with 50 to 950 scales); imports `tokens.css` itself |
| `dist/kit-contract.css` | homemade-claude-kit renderers only, deployed as `docs/ux/tokens.css`; never loaded in an app. Carries the latin fonts as embedded data, since the renderers inline this one file |
| `css/` | Shared `mq-` components, slide canvas and A4 print styles for build-less media (see Shared CSS) |
| `fonts/fonts.css` | Self-hosted Outfit, Newsreader and Geist Mono (variable woff2, latin and latin-ext, relative paths); deploy the folder whole |
| `icons/lucide.min.js` | A pinned Lucide build (version and hash in `icons/manifest.json`) |
| `brand/` | Monogram, favicon set and wordmark: `wordmark-on-light` and `wordmark-on-navy`, live text for screen and `-print` with outlined text |
| `guidelines/` | Brand, voice, colour, typography, chart, data and accessibility rules |

The design system ships framework-neutral outputs only (CSS, JSON, Tailwind theme, static assets). Wiring the tokens into a component library (Nuxt UI, shadcn/ui) belongs to the consumer.

## Shared CSS

The `mq-` component CSS serves build-less media: slides, A4 reports, papers, the website and HTML built by Python pipelines. Load `dist/tokens.css` and `fonts/fonts.css`, then the files you need, each in its own cascade layer and every selector inside `:where()`, so a local class always wins:

| File | Layer | Holds |
| :-- | :-- | :-- |
| `css/base.css` | `mq.base` | Typography roles (`mq-doc`, `mq-eyebrow`, `mq-title`, `mq-lead`, `mq-prose`, `mq-note`, `mq-figure`) |
| `css/components.css` | `mq.components` | Card, navy panel, KPI tiles, table, badges in line-style states, callout, progress and distribution bars, legend, takeaway, footer |
| `css/slide.css` | `mq.slide` | The 1280 x 720 slide canvas, section label, title and slide number |
| `css/print.css` | `mq.print` | A4 pages with exact colour printing |
| `css/app.css` | `mq.app` | Status badges, for interactive apps only |

Documents never load `css/app.css`: they are navy-only and show states by mark style ([ADR-0004](docs/architecture/decisions/adr-0004-status-colours-in-apps-only.md)). Apps with a component library (Nuxt UI, shadcn/ui) take the tokens and the Tailwind theme only; they do not load the `mq-` component CSS.

Consumers lint their own CSS with the same rules: `export { default } from "@medquantis/design-system/stylelint";` in their `stylelint.config.mjs`. It rejects literal colours, fonts and shadows, `!important`, unknown custom properties, and any radius other than the three `--mq-radius-*` tokens, so no pill shape can be drawn.

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
mise install      # Node, gitleaks, actionlint, zizmor, shellcheck and uv, pinned in mise.toml
make check        # lint, workflow lint, build, tests and the confidentiality check
make assets       # refresh fonts/ and icons/ from their pinned npm packages
make brand        # re-outline the monogram and wordmark SVGs from the pinned Outfit font
make brand-check  # prove the committed brand SVGs reproduce byte for byte (Python, not in make check)
```

`fonts/` and `icons/` are committed copies of exact-pinned packages because they ship in the npm package; a unit test fails when they drift, so a Dependabot bump of a font or of Lucide needs `make assets` in the same PR. The screen wordmarks use live text, which renders in Outfit only where the page loads `fonts.css` (inline SVG); in an `<img>` use the `-print` variant.

`make build` installs the npm dependencies from `package-lock.json` (`npm ci --ignore-scripts`) when the lockfile changes, then regenerates `dist/` from `tokens/` with Style Dictionary. `make check` is the single local entry point and mirrors CI, which installs the same tools from `mise.toml` and runs the same target. Locally the deny-list scan warns when `MQ_DENYLIST` is unset; point it at a copy of the deny-list (or `tests/fixtures/denylist.txt` for a dry run) to run the full check.

Dependabot proposes weekly bumps for npm dependencies and GitHub Actions. It has no mise ecosystem, so the tool pins in `mise.toml` are bumped by hand, in a PR whose `make check` must pass.

## Owner set-up

CI fails closed until these exist:

1. A private MedQuantis repository holding the deny-list as `denylist.txt` at its root, one client, partner or person name per line.
2. A fine-grained personal access token with read-only `Contents` access to that repository alone, stored in this repository as the Actions secret `MQ_DENYLIST_TOKEN`, and again as a Dependabot secret of the same name so Dependabot PRs can run the scan.
3. The Actions variable `MQ_DENYLIST_REPO` set to that repository's `owner/name`, so its name stays out of this public repository.

## Licence

Code, tokens and generated CSS are MIT. `brand/` and `guidelines/` are © MedQuantis SA, all rights reserved. Fonts keep their OFL licence. See [LICENSE](LICENSE).
