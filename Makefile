.PHONY: check test build lint workflow-lint confidentiality-check

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
