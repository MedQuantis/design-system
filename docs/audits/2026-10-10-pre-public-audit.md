---
type: Audit Record
title: Pre-public audit, first pass
description: Secret scan of the full git history and confidentiality scan with the fixture deny-list before the repository goes public; the scan with the real deny-list is still pending.
tags: [audit, confidentiality, release]
timestamp: 2026-10-10T15:32:00+02:00
status: draft
owner: Victor Hueni
last_reviewed: 2026-10-10
review_interval: 30d
---

# Pre-public audit, first pass (2026-10-10)

Plan 0001, increment 11, scope item 3. The repository stays private until every row below is green ([ADR-0005](../architecture/decisions/adr-0005-public-repo-with-confidentiality-gate.md)).

**Verdict: not yet complete.** The secret scan of the whole history is clean. The confidentiality scan ran with the fixture deny-list only; the scan with the real deny-list has not run.

| Check | Tool and version | Scope | Result |
| :-- | :-- | :-- | :-- |
| Secrets in the full history | gitleaks 8.30.1, `gitleaks detect --no-banner --redact --log-opts="--all"`, rules of `.gitleaks.toml` (gitleaks defaults) | 51 commits, every branch and ref, at commit `8343991` | No leaks found, exit 0 |
| Confidentiality scan of the tree, fixture deny-list | `MQ_DENYLIST=tests/fixtures/denylist.txt make confidentiality-check` (gitleaks on the tree, then `scripts/confidentiality-check.mjs`) | 275 tracked and untracked files, 9 excluded by `scripts/confidentiality-exclude.txt`, at commit `8343991` | 0 findings, exit 0 |
| Fail-closed check | `CI=true make confidentiality-check` without a deny-list | same tree | Exit 2, as designed |
| Confidentiality scan with the real deny-list | same command with `MQ_DENYLIST` pointing at the real list | tree, and history (see below) | **Pending** |

## Pending: the scan with the real deny-list

The real deny-list lives in a private MedQuantis repository that does not exist yet (owner set-up step 1 in the README). The fixture list only proves the scanner works; it names no real client, partner or person, so a clean result with it says nothing about real names.

To close this audit, the owner:

1. creates the private deny-list repository and its `denylist.txt`, and the `MQ_DENYLIST_TOKEN` secret and `MQ_DENYLIST_REPO` variable (README, Owner set-up);
2. runs `MQ_DENYLIST=<path to a local copy> make confidentiality-check` on the tip of the branch to be published, and records the file count and the result here;
3. checks the history too, since the scanner reads the current tree only: `git log --all -p | grep -i -n -F -f <path to a local copy>` must print nothing, and any hit means rewriting history before the switch to public;
4. re-runs the gitleaks history scan on the final commit if anything was committed after `8343991`, and updates the table;
5. confirms the first CI run on GitHub is green with the real deny-list.

Only then is the visibility switched to public.
