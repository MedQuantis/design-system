# Governance

## Owners

| Role | Person |
| :-- | :-- |
| Owner | @VictorHueni |
| Backup owner | @MikimikeDevloppAI |

Both are listed in `.github/CODEOWNERS`, so either can approve a change. `main` is protected and releases come only from reviewed tags.

## Review target

Every pull request and proposal gets an answer within 5 working days.

## Two contribution tiers

- **Small changes** (a value adjusted within its intent, a fix, a guideline clarification, a new token in an existing group) go straight to a pull request.
- **Large changes** (a new component, a new token group, a renamed or removed token, anything that visibly re-themes consumers) start with a short written proposal as a GitHub issue: the problem, the consumers affected, the proposed change. The pull request follows once an owner agrees.

## Versioning

Semantic versioning, changelog by release-please:

- **Major:** a token removed or renamed, or a value change that visibly re-themes consumers.
- **Minor:** a token or component added, or a token deprecated (still working, aliased to its replacement, lint warning).
- **Patch:** a value adjusted within its intent without a visible change.

A deprecated token is removed only in the next major.

## Promotion of local components

A component invented locally in two consumers is promoted here only if it passes four tests:

1. **Useful:** needed in more than one place.
2. **Unique:** does not duplicate an existing component.
3. **Consistent:** built from existing tokens and styles.
4. **Versatile:** fits uses beyond the two that produced it.

Every local one-off is logged in [docs/one-offs.md](docs/one-offs.md) with its outcome.
