.PHONY: check test test-unit test-e2e specimen browsers build lint workflow-lint confidentiality-check assets brand brand-check skill skill-zip skill-evals plugin-validate

# Single local entry point; CI runs the same target.
check: lint workflow-lint build test confidentiality-check

test: test-unit test-e2e

test-unit: build
	node --test "tests/unit/**/*.test.mjs"

# Playwright and axe on the generated specimen, with screenshot baselines and a PDF export.
test-e2e: specimen browsers
	node_modules/.bin/playwright test

# The specimen is the visual reference, generated into dist/specimen/ (gitignored). Not part of
# make build, which produces the package outputs only.
specimen: build
	node scripts/build-specimen.mjs

# Playwright's own Chromium headless shell, whose build is pinned by the exact @playwright/test
# version, so baselines match between this machine and CI. CI passes
# PLAYWRIGHT_INSTALL_FLAGS=--with-deps to add the OS libraries (apt, through sudo).
browsers: node_modules/.package-lock.json
	node_modules/.bin/playwright install --only-shell $(PLAYWRIGHT_INSTALL_FLAGS) chromium

# Lockfile install, re-run only when package-lock.json changes. Dependency install scripts
# never run.
node_modules/.package-lock.json: package-lock.json
	npm ci --ignore-scripts

# dist/ is generated from tokens/ and never committed; rebuilt from scratch every time. The llms
# files are generated from guidelines/ and the token build.
build: node_modules/.package-lock.json
	rm -rf dist
	node_modules/.bin/style-dictionary build --config build/style-dictionary.config.mjs
	node scripts/build-llms.mjs

# Stylelint on the shared CSS; the custom-property rule reads dist/tokens.css, so build first.
lint: build
	node_modules/.bin/stylelint "css/**/*.css" scripts/specimen.css

# Same invocations as CI; actionlint calls shellcheck on every run: block.
workflow-lint:
	actionlint
	zizmor --min-severity high .github/

# Secrets first, then names, amounts, internal hosts and metadata. The deny-list path comes
# from MQ_DENYLIST; without it the scan warns locally and fails in CI.
confidentiality-check:
	gitleaks dir --no-banner --redact --config .gitleaks.toml .
	node scripts/confidentiality-check.mjs

# fonts/ and icons/ are committed copies of exact-pinned packages (they ship in the npm tarball
# and the CDN); the unit tests fail when they drift from node_modules. Re-run after a bump.
assets: node_modules/.package-lock.json
	node scripts/copy-fonts.mjs
	node scripts/copy-icons.mjs

# Monogram, favicon SVG and wordmarks outlined from the pinned Outfit variable font. Python
# (fontTools, uv inline-script pins) stays out of make check; brand-check proves the committed
# SVGs still reproduce byte for byte. The favicon PNG and ICO files are not regenerated here.
OUTFIT_VARIABLE := node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2

brand: node_modules/.package-lock.json
	uv run --quiet scripts/outline-brand.py $(OUTFIT_VARIABLE) brand

brand-check: node_modules/.package-lock.json
	uv run --quiet scripts/outline-brand.py --check $(OUTFIT_VARIABLE) brand

# The Claude skill (plugins/medquantis-design-system) is committed, because a plugin cache or a
# claude.ai upload cannot reach dist/. This regenerates its references and eval graders from
# guidelines/ and the tokens, and copies the built assets; the unit tests fail on any drift.
SKILL_DIR := plugins/medquantis-design-system/skills/medquantis-design-system

skill: build
	node scripts/build-skill.mjs
	node scripts/sync-skill-assets.mjs

# Zip for claude.ai upload (Settings, Features), without the eval tasks.
skill-zip: skill
	python3 scripts/skill-zip.py $(SKILL_DIR) dist/medquantis-design-system-skill.zip

# Local manifest check with the Claude Code CLI (no model call); not in make check, because CI has
# no claude CLI. The manifest unit test is the CI gate.
plugin-validate:
	claude plugin validate .
	claude plugin validate plugins/medquantis-design-system

# Eval runs call models on the owner's account and cost money: run only with the owner's approval,
# never from make check. The default is Sonnet only (owner, 2026-10-10); pass SKILL_EVAL_MODELS to add
# haiku or opus, and --case/--runs/--ablation through the CLI for a subset. By default each model runs
# every case three times with the plugin and three times without it; results land in dist/skill-evals/<model>/ (report.html, aggregate-result.json).
# Bash runs under Claude Code's sandbox, which needs bubblewrap and socat on Linux.
# Two WSL workarounds, harmless elsewhere: the sandbox refuses a PATH directory it cannot examine,
# so the /mnt/ entries (Windows interop) are dropped; and it refuses a ~/.docker credential store
# holding a symlink (Docker Desktop for WSL creates one), so claude runs with HOME set to a
# temporary directory that holds only links to the real ~/.claude and ~/.claude.json. The real
# HOME and ~/.docker are never touched; the temporary one is removed on exit.
SKILL_EVAL_MODELS ?= sonnet
SKILL_EVAL_JUDGE ?= sonnet
SKILL_EVAL_MAX_COST ?= 30

skill-evals:
	@set -e; \
	eval_home=$$(mktemp -d); \
	trap 'rm -rf "$$eval_home"' EXIT; \
	ln -s "$$HOME/.claude" "$$eval_home/.claude"; \
	ln -s "$$HOME/.claude.json" "$$eval_home/.claude.json"; \
	eval_path=$$(printf '%s\n' "$$PATH" | tr ':' '\n' | grep -v '^/mnt/' | paste -sd: -); \
	for model in $(SKILL_EVAL_MODELS); do \
		HOME="$$eval_home" PATH="$$eval_path" claude plugin eval plugins/medquantis-design-system --model $$model \
			--judge-model $(SKILL_EVAL_JUDGE) --max-cost-usd $(SKILL_EVAL_MAX_COST) --trust-plugin --no-publish \
			--output-dir dist/skill-evals/$$model \
			--allow-tools Write Edit "Bash(python3 *)" "Bash(cp *)" "Bash(mkdir *)"; \
	done
