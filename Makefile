.PHONY: check test build lint confidentiality-check

# Single local entry point; CI runs the same target.
check: lint build test confidentiality-check

test:
	node --test "tests/unit/**/*.test.mjs"

# No token build yet; increment 04 adds Style Dictionary.
build:
	@echo "build: nothing to build yet"

# No linters yet; increment 07 adds stylelint.
lint:
	@echo "lint: nothing to lint yet"

# Secrets first, then names, amounts, internal hosts and metadata. The deny-list path comes
# from MQ_DENYLIST; without it the scan warns locally and fails in CI.
confidentiality-check:
	gitleaks dir --no-banner --redact --config .gitleaks.toml .
	node scripts/confidentiality-check.mjs
