---
type: Audit Record
title: Pre-public audit, first pass
description: Secret scan of the full git history and confidentiality scan of the tree and the history with the real deny-list before the repository goes public; the first CI run with the real deny-list is green.
tags: [audit, confidentiality, release]
timestamp: 2026-10-10T15:32:00+02:00
status: active
owner: Victor Hueni
last_reviewed: 2026-10-10
review_interval: 30d
---

# Pre-public audit, first pass (2026-10-10)

Plan 0001, increment 11, scope item 3. The repository stays private until every row below is green ([ADR-0005](../architecture/decisions/adr-0005-public-repo-with-confidentiality-gate.md)).

**Verdict: green.** The secret scan of the whole history is clean, the real deny-list finds nothing in the tree or in the history, and the first CI run on GitHub, which fetches the real deny-list itself, passed. The repository may be switched to public once `main` is protected.

| Check | Tool and version | Scope | Result |
| :-- | :-- | :-- | :-- |
| Secrets in the full history | gitleaks 8.30.1, `gitleaks detect --no-banner --redact --log-opts="--all"`, rules of `.gitleaks.toml` (gitleaks defaults) | 51 commits, every branch and ref, at commit `8343991` | No leaks found, exit 0 |
| Confidentiality scan of the tree, fixture deny-list | `MQ_DENYLIST=tests/fixtures/denylist.txt make confidentiality-check` (gitleaks on the tree, then `scripts/confidentiality-check.mjs`) | 275 tracked and untracked files, 9 excluded by `scripts/confidentiality-exclude.txt`, at commit `8343991` | 0 findings, exit 0 |
| Fail-closed check | `CI=true make confidentiality-check` without a deny-list | same tree | Exit 2, as designed |
| Confidentiality scan of the tree, real deny-list | `MQ_DENYLIST=<local copy> node scripts/confidentiality-check.mjs`, list of 64 terms | 276 files, 9 excluded, at commit `183a76e` | 0 findings |
| Real deny-list over the history | `git log --all -p \| grep -i -w -F -o -f <terms of the list>` | every branch and ref, accents folded as the scanner does, at commit `183a76e` | No match |
| First CI run with the real deny-list | `ci.yml` on pull request #3, deny-list fetched with `MQ_DENYLIST_TOKEN` | commit `9c1dd78`: unit 177/177, e2e 25/25 with the committed screenshot baselines, gitleaks no leaks, 276 files scanned | Passed, run 38067643025 |

## The real deny-list

The real deny-list lives in a private MedQuantis repository named by the `MQ_DENYLIST_REPO` variable, set on 2026-10-10. It lists every Swiss basic health insurer of the public federal lists and the other organisations named by the client deck folders; a name that is also a common word, a place or a surname is listed in its company form only, and the bare abbreviation of one insurer is listed only in its company forms, because alone it is the name of the stylesheet language. Personal names are added by the owner.

The read-only `MQ_DENYLIST_TOKEN` secret is set for Actions and for Dependabot. After any change to the list, re-run the tree scan and the history check above and update the table. The screenshot baselines recorded on this machine passed on the GitHub runner, so scope item 6 needed no regeneration.

Only then is the visibility switched to public.
