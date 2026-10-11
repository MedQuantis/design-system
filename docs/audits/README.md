# Audits and release bootstrap

This folder records the pre-public audit (`<date>-pre-public-audit.md`) and the one-time steps of the first release. Each audit file states what was scanned, with which tool and version, at which commit, and what is still pending.

## How a release runs

`.github/workflows/release.yml` runs on every push to `main`:

1. **release-please** keeps a release PR open with the next version, the changelog, and the same version in `package.json`, `package-lock.json`, the plugin manifest, the marketplace manifest and the skill's `metadata.version` (`release-please-config.json`, `extra-files`). Merging that PR tags `vX.Y.Z` and creates the GitHub release.
2. **check** runs only when a release was created: it checks out the tag, fetches the real deny-list, runs `make check` (lint, workflow lint, build, unit and e2e tests, gitleaks and the confidentiality scan) and packs the tarball.
3. **publish** runs only after `check` passed: it downloads that exact tarball and publishes it with npm trusted publishing (OIDC, no npm token) and provenance. It installs and builds nothing.

The tag is pushed with the workflow token, which starts no other workflow; that is why `check` repeats the CI gate instead of relying on `ci.yml`.

## First release: steps for the owner

These cannot be automated from the repository. All were done by 2026-10-11, when `v1.0.0` was published; they are kept as the record of how the trusted publisher was set up.

1. **npm organisation.** Create the `@medquantis` organisation on npmjs.com.
2. **Trusted publisher bootstrap.** npm lets a trusted publisher be configured only on a package that already exists. If that is still the case when you do this, publish a placeholder once by hand before merging the first release PR, so the real `1.0.0` comes from the workflow with provenance:
   - from an empty folder holding only a `package.json` (`"name": "@medquantis/design-system"`, `"version": "0.0.0-bootstrap.0"`) and a one-line README, run `npm publish --access public --tag bootstrap`;
   - on npmjs.com, package settings, add a trusted publisher: GitHub Actions, organisation `MedQuantis`, repository `design-system`, workflow `release.yml`, no environment, and tick "Allow npm publish" (without it the publish job fails with `403 OIDC permission denied for this action`);
   - set publishing access to require two-factor authentication and disallow tokens;
   - after `1.0.0` is out, run `npm deprecate @medquantis/design-system@0.0.0-bootstrap.0 "Placeholder for the trusted publisher set-up; use 1.0.0 or later"`.

   If npm by then accepts a trusted publisher for a package that does not exist yet, skip the placeholder.
3. **Release PR checks.** A PR opened with the workflow token starts no `pull_request` workflow, so `ci.yml` does not run on the release PR. If `main` requires the CI check, either push an empty commit to the release PR's branch from your own account (that push starts `ci.yml`), or give release-please a GitHub App token instead of the workflow token. Decide before protecting `main`.
4. **First version.** `release-please-config.json` sets `"release-as": "1.0.0"` so the first release is `1.0.0` rather than `0.1.0` (ADR-0002 semver). Remove that line in the first PR after `v1.0.0` is tagged; `tests/unit/release.test.mjs` fails once the manifest moves past `1.0.0` with it still set.
5. **Visibility.** Switch the repository to public only after the pre-public audit, including the scan with the real deny-list, is green.
