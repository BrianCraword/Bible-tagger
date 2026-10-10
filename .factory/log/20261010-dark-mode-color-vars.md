# 20261010-dark-mode-color-vars

- **Date:** 2026-10-10
- **Branch:** factory/20261010-dark-mode-color-vars (commit 1a3373e, from main 7b7a3c2; component files identical to v2.0.0)
- **Feature:** In dark mode, the Blue Letter Bible hover popup takes its colours from the member's active Discourse colour scheme, not a fixed purple palette. Accepted side effect: `dark_theme: always` on a light scheme shows that light scheme's colours.

## Files changed
- `common/common.scss`: five hex values in the `html.blb-dark` block replaced with `var(--secondary)`, `var(--primary-very-high)`, `var(--primary-low)`, `var(--tertiary)`, `var(--primary)`, plus one comment line
- `README.md`: one bullet under "## Notes"
- `CHANGELOG.md`: one bullet under "## [Unreleased]"

3 files, +12 / -5.

## Checks
- `checks.ps1` did not run (PowerShell blocked in the builder's worktree). The builder ran the applicable checks by hand, and they were clean. No `checks.md`.
- Static only. This code has not been run in any Discourse instance.

## Verdicts
| Reviewer | Verdict | Escalate | Blocking |
|---|---|---|---|
| discourse-api | pass | n/a | 0 |
| frontend | pass | n/a | 0 |
| security | pass | no | 0 |
| backend | skipped (no Ruby in diff) | n/a | n/a |

All 5 acceptance criteria were met on reading the diff. Criterion 3 was met when limited to component files, because the literal `git diff v2.0.0 --stat` also lists factory files committed to main after v2.0.0.

## Decision
**ESCALATE.** Reasons: AUTO_MERGE is off, and the spec's "Needs live verification" section is non-empty. No escalation category was touched, and no reviewer objected. Recommendation: merge, then run the live checks as a regular member. Those cover the popup appearing at all, dark scheme on a post, chat and a Feed card, a second dark scheme, navigating away and back, and `always`-on-light.

Owner: Brian.
