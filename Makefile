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

# Increment 02 adds the deny-list scanner after gitleaks.
confidentiality-check:
	gitleaks dir --no-banner --redact .
