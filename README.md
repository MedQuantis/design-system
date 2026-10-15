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
| `dist/llms.txt`, `dist/llms-full.txt` | The guidelines and the token list for language models ([llmstxt.org](https://llmstxt.org/) format), generated from `guidelines/` and the tokens |
| `plugins/medquantis-design-system/` | The Claude skill, as a Claude Code plugin and as a zip for claude.ai (see Claude skill) |

The design system ships framework-neutral outputs only (CSS, JSON, Tailwind theme, static assets). Wiring the tokens into a component library (Nuxt UI, shadcn/ui) belongs to the consumer.

## Shared CSS

The `mq-` component CSS serves build-less media: slides, A4 reports, papers, the website and HTML built by Python pipelines. Load `dist/tokens.css` and `fonts/fonts.css`, then the files you need, each in its own cascade layer and every selector inside `:where()`, so a local class always wins:

| File | Layer | Holds |
| :-- | :-- | :-- |
| `css/base.css` | `mq.base` | Typography roles (`mq-doc`, `mq-eyebrow`, `mq-title`, `mq-lead`, `mq-prose`, `mq-note`, `mq-figure`) |
| `css/components.css` | `mq.components` | Card, navy panel, KPI tiles, table, badges in line-style states, callout, progress and distribution bars, legend, takeaway, footer |
| `css/slide.css` | `mq.slide` | The 1280 x 720 slide canvas, section label, title, and the footer row with the legal line and slide number |
| `css/print.css` | `mq.print` | A4 pages with exact colour printing |
| `css/app.css` | `mq.app` | Status badges, for interactive apps only |

Documents never load `css/app.css`: they are navy-only and show states by mark style ([ADR-0004](docs/architecture/decisions/adr-0004-status-colours-in-apps-only.md)). Apps with a component library (Nuxt UI, shadcn/ui) take the tokens and the Tailwind theme only; they do not load the `mq-` component CSS.

### Component status

Every `mq-` component is `trial` until a consumer uses it in production; it becomes `stable` once a consumer depends on it and its markup has not changed for a release. A `trial` component may still change its markup or classes in a minor release. Usage rules are in [guidelines/](guidelines/README.md).

| Component | Classes | File | Status |
| :-- | :-- | :-- | :-- |
| Document root and wrapper | `mq-doc`, `mq-wrap` | `css/base.css` | trial |
| Headings | `mq-display`, `mq-title`, `mq-subtitle` | `css/base.css` | trial |
| Eyebrow, lead, prose | `mq-eyebrow`, `mq-lead`, `mq-prose` | `css/base.css` | trial |
| Label, note, mono, emphasis | `mq-label`, `mq-note`, `mq-mono`, `mq-em` | `css/base.css` | trial |
| Hero figure | `mq-figure` | `css/base.css` | trial |
| Card | `mq-card` (`mq-card-title`, `mq-card-body`) | `css/components.css` | trial |
| Navy panel | `mq-panel` (`mq-panel-kicker`, `-title`, `-text`, `-rule`, `-icon`) | `css/components.css` | trial |
| KPI tiles | `mq-kpis`, `mq-kpi` (`is-navy`, `is-pale`) | `css/components.css` | trial |
| Table | `mq-table`, `mq-num` (`is-key`, `is-highlight`, `is-total`) | `css/components.css` | trial |
| Badge, states by mark style | `mq-badge` (`is-solid`, `is-ring`, `is-pale`, `is-outline`, `is-quiet`, `is-dashed`) | `css/components.css` | trial |
| Callout | `mq-callout` (`mq-callout-title`) | `css/components.css` | trial |
| Progress bar | `mq-progress` | `css/components.css` | trial |
| Distribution bar | `mq-distribution`, `mq-segment` | `css/components.css` | trial |
| Legend | `mq-legend` (`is-column`, `mq-legend-value`), `mq-swatch` | `css/components.css` | trial |
| Takeaway | `mq-takeaway` | `css/components.css` | trial |
| Footer | `mq-foot` | `css/components.css` | trial |
| Slide canvas | `mq-slide` (`mq-slide-label`, `-title`, `-body`, `-foot`, `-number`) | `css/slide.css` | trial |
| A4 page and desk | `mq-page`, `mq-desk`, `mq-no-print` | `css/print.css` | trial |
| Status badge, apps only | `mq-status` (`is-success`, `is-warning`, `is-danger`, `is-info`) | `css/app.css` | trial |

Consumers lint their own CSS with the same rules: `export { default } from "@medquantis/design-system/stylelint";` in their `stylelint.config.mjs`. It rejects literal colours, fonts and shadows, `!important`, unknown custom properties, any radius other than the three `--mq-radius-*` tokens (so no pill shape can be drawn), and a local `--app-*`, `--site-*`, `--viz-*` or `--deck-*` property set to a literal instead of a `var(--mq-*)` reference (a `calc()` that scales tokens by a plain number is allowed). The config loads two stylelint plugins that the package does not install for you, so a consumer that lints adds them as its own dev dependencies, at the versions this release is tested with: `npm install --save-dev --save-exact stylelint@17.16.0 stylelint-declaration-strict-value@1.12.1 stylelint-value-no-unknown-custom-properties@6.1.1`.

## Specimen

The specimen is the visual reference of the design system: every colour token with its contrast pairings and their allowed use, the type scale, the radii and shadows, every `mq-` component, a 1280 x 720 slide, an A4 page, the brand files and the app status layer. `make specimen` generates it into `dist/specimen/index.html` from `dist/tokens.json`, `css/` and the fictitious data in `examples/`; open that file in a browser. The folder holds its own copies of the CSS, fonts and brand files, so it works offline and requests nothing outside itself. It is never edited by hand and never committed. `make build` does not build it, so the package outputs stay free of it.

`make test` runs the unit tests, then Playwright and axe on the specimen: WCAG 2.2 AA with no serious or critical violation, no request outside the folder, a tagged PDF export, and screenshot baselines of each part of the page (header, every section, footer) and of the focus ring in `tests/e2e/specimen.spec.mjs-snapshots/`. The browser is Playwright's own Chromium headless shell, whose build is pinned by the exact `@playwright/test` version; `make browsers` installs it locally and CI installs the same build, so the baselines compare like with like. After a deliberate visual change, regenerate the baselines with `node_modules/.bin/playwright test --update-snapshots` and review the new images in the PR. When the CI job fails, it uploads Playwright's `test-results/` (actual, expected and diff images) as the `playwright-test-results` artifact, kept for 7 days.

## Claude skill

The skill `medquantis-design-system` teaches Claude to build on-brand slides, A4 reports, web pages, app screens and charts from the tokens and the `mq-` components, then to check the result with its validator, which fails any colour outside the token set, a status colour in a document, an unknown `--mq-*` token and an em or en dash. It lives in `plugins/medquantis-design-system/skills/medquantis-design-system/`: `SKILL.md`, one reference per medium generated from `guidelines/`, a token lookup and the validator in `scripts/` (Python 3.11 standard library, so they run in a claude.ai container too), and a copy of the built tokens, CSS, fonts and brand files in `assets/`, because an installed plugin cannot reach `dist/`.

- **Claude Code:** this repository is a plugin marketplace named `medquantis`. Add it with `/plugin marketplace add MedQuantis/design-system`, then `/plugin install medquantis-design-system@medquantis`.
- **claude.ai:** `make skill-zip` writes `dist/medquantis-design-system-skill.zip`; upload it under Settings, Features. Each member uploads it once.

`make skill` regenerates the references and the generated eval graders and copies the built assets; the unit tests fail when the committed skill differs from a fresh build, so a token or guideline change needs `make skill` in the same PR. The plugin, the marketplace and the skill carry the package version. `make plugin-validate` runs `claude plugin validate` locally (no model call); CI relies on the manifest unit test.

The eval tasks (`plugins/medquantis-design-system/evals/`, at the plugin root so the model under test cannot read the rubrics, three or more per medium, run by `claude plugin eval`) call models on the owner's account, so they never run in `make check`. Each case grades the produced files: the page is on palette, self-contained (styles and tokens inlined by `bundle.py`), and the validator's recorded verdict (`validate.py --record validation.txt`) is clean. `make skill-evals` runs them on Sonnet by default (`SKILL_EVAL_MODELS` adds Haiku or Opus) with a cost ceiling (`SKILL_EVAL_MAX_COST`, USD per model) and writes the reports to `dist/skill-evals/<model>/`; Linux needs `bubblewrap` and `socat` for Claude Code's sandbox. Under WSL the target drops the `/mnt/` PATH entries and runs with a temporary HOME that links only `~/.claude` and `~/.claude.json`, because the sandbox refuses both the Windows interop directories and Docker Desktop's symlinked credential store.

## Consumption

- **Node consumers** install `@medquantis/design-system` at an exact version and let Dependabot propose bumps.
- **Build-less and Python consumers** reference the CDN URL of a tagged release, or vendor a release into `vendor/medquantis-ds/` with `make design-sync`, a `VERSION` file and a CI check that the copy matches the tag.
- Upgrades are deliberate: never a version range, never a branch URL.

### CDN with an exact version and an SRI hash

Each release is on npm, so jsDelivr serves its files at a fixed URL. Always name an exact version and pin the file with a Subresource Integrity hash; never use a version range (`@1`, `@^1.0.0`, `@latest`) or a GitHub-backed jsDelivr URL (`/gh/` instead of `/npm/`), which serves the repository rather than the published release.

```html
<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@medquantis/design-system@X.Y.Z/dist/tokens.css"
      integrity="sha384-<hash of that exact file>"
      crossorigin="anonymous">
```

Replace `X.Y.Z` with the release you adopt and compute the hash from that release's own file, taken from its npm tarball (`npm pack @medquantis/design-system@X.Y.Z`, then `tar -xzf` it and run the command inside `package/`):

```sh
echo "sha384-$(openssl dgst -sha384 -binary dist/tokens.css | openssl base64 -A)"
```

Every other shipped file (`css/*.css`, `fonts/fonts.css`, `dist/kit-contract.css`) works the same way, each with its own hash. Fonts referenced by `fonts.css` load relative to it, so serve the stylesheet and its fonts from the same release URL.

## Specialisation rules

1. Core and semantic tokens are not overridden in a consumer.
2. A product-level variation, if ever needed, is a theme in this repo, never a local override.
3. Local additions use the consumer's own prefix (`--deck-*`, `--app-*`) and reference `var(--mq-*)` only; a stylelint rule blocks raw hex colours outside this repo.
4. A component invented locally in two consumers is a candidate for promotion here if it is useful, unique, consistent and versatile (see [GOVERNANCE.md](GOVERNANCE.md)). Every local one-off is logged in [docs/one-offs.md](docs/one-offs.md).

## Development

```sh
mise install      # Node, Python, gitleaks, actionlint, zizmor, shellcheck and uv, pinned in mise.toml
make check        # lint, workflow lint, build, tests and the confidentiality check
make specimen     # generate the specimen page into dist/specimen/index.html
make test         # unit tests, then Playwright and axe on the specimen (installs the pinned browser)
make assets       # refresh fonts/ and icons/ from their pinned npm packages
make brand        # re-outline the monogram and wordmark SVGs from the pinned Outfit font
make brand-check  # prove the committed brand SVGs reproduce byte for byte (Python, not in make check)
make skill        # regenerate the Claude skill's references, eval graders and assets
make skill-zip    # zip the skill for claude.ai into dist/
make kit-check    # run the homemade-claude-kit resolver on the packed package (needs KIT_DIR)
```

`make kit-check` packs the package as npm would publish it, unpacks it into a fresh temporary folder and runs the kit resolver (`plugins/delivery-comms/shared/design_source.py provenance`) on it, through the kit's own mise environment. `KIT_DIR` names a local homemade-claude-kit checkout, for example `KIT_DIR=../homemade-claude-kit make kit-check`; without it the target prints a skip message and exits 0. It is a separate gate, not part of `make check`, because CI has no kit checkout. `kit-manifest.json` is a build output at the repository root (gitignored), because the kit reads the manifest only at the top of the package.

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
