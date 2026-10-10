# 20261010-refresh-race-forced-dark

- **Date:** 2026-10-10
- **Branch:** factory/20261010-refresh-race-forced-dark. Head 76c92da: 67d641a was the build, b9aa41a rework 1, 76c92da rework 2. The base was main at 338c125.
- **Feature:**
  - Cold-cache loads tag references again. Readiness now requires BLB to actually tag a detached "John 3:16" probe, because its reference regexes come from `loadOut.cfm` after `pageInit()`. Failed walks un-mark the element and are retried, at most 3 times, through one non-resetting timer.
  - `dark_theme: always` restores the fixed dark palette through a `blb-dark-forced` class on `<html>`.
  - Both dark blocks now outrank BLB's ID-qualified remote CSS.

## Files changed
- `javascripts/discourse/api-initializers/bible-tagger.js`
- `common/common.scss`
- `README.md` (Notes bullets)
- `CHANGELOG.md` (`[Unreleased]`)

4 files, +133 / -19. `settings.yml` and `about.json` are untouched.

## Spec amendment
AC10 was amended by reworks 1 and 2 after live testing:
- Both dark blocks use the doubled ID `#blbTagger#blbTagger.bubble`.
- Both blocks add `h6`, `.vRef`, `.blb-type { fill }` and `#bubBody a`.
- The forced palette gains a sixth hex, `#c9c3dc`.

The scheme block is therefore no longer byte-identical. The discourse-api reviewer asked for this to be recorded.

## Checks
- **Static checks:**
  - `checks.ps1` did not run, because PowerShell is blocked in the worktree. The builder ran the checks by hand, and they were clean.
  - There is no `!important` in the repo.
  - The diff touches exactly 4 files.
- **Orchestrator live pre-deploy test on production:**
  - The branch CSS was injected into a live page, not installed.
  - The readiness probe logic was proven in isolation.
  - The CSS failed twice, which drove reworks 1 and 2. It passed after 76c92da, with computed colours matching in both dark modes.
- **Not run:** this branch has not run as an installed component in any Discourse instance.

## Verdicts
| Reviewer | Verdict | Escalate | Blocking |
|---|---|---|---|
| discourse-api | pass | n/a | 0 |
| frontend | pass | n/a | 0 |
| security | pass | no | 0 |
| backend | skipped (no Ruby) | n/a | n/a |
| orchestrator live | pass on 76c92da (failed on 67d641a and b9aa41a) | n/a | 0 |

## Unverified until deploy
- The cold-cache full load end to end.
- `nested === 0`, meaning no reference link ends up inside another.
- No `removeChild`/`nextSibling` errors on route change.
- The CSP for `loadOut.cfm` for a non-admin member.

## Follow-up
In the `auto` block, `.vRef` uses `var(--primary-medium)`. Live it computed rgb(145,145,145) on white, about 3.2:1, which is below AA for small text. Suggest `--primary-high` in a separate job. This came from the frontend review and is non-blocking.

## Decision
**ESCALATE.** AUTO_MERGE is off, "Needs live verification" is non-empty, and AC10 was amended. No escalation category was touched, and no reviewer objected.

Recommendation:
1. Merge, removing the builder worktree first.
2. Deploy.
3. Run the spec's live script that day as a regular member, then logged out.

Confidence is moderate.

Owner: Brian.
