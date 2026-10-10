.PHONY: check test build lint workflow-lint confidentiality-check assets brand brand-check

# Single local entry point; CI runs the same target.
check: lint workflow-lint build test confidentiality-check

test:
	node --test "tests/unit/**/*.test.mjs"

# Lockfile install, re-run only when package-lock.json changes. Dependency install scripts
# never run.
node_modules/.package-lock.json: package-lock.json
	npm ci --ignore-scripts

# dist/ is generated from tokens/ and never committed; rebuilt from scratch every time.
build: node_modules/.package-lock.json
	rm -rf dist
	node_modules/.bin/style-dictionary build --config build/style-dictionary.config.mjs

# No linters yet; increment 07 adds stylelint.
lint:
	@echo "lint: nothing to lint yet"

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
