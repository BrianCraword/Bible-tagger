---
name: checks-ps1-blocked-in-worktree
description: The worktree-isolation guard refuses any `powershell` invocation, so checks.ps1 cannot run from a builder worktree; replicate its checks by hand
metadata:
  type: feedback
---

In a worktree-isolated builder session the harness refuses every `powershell ...` command
(it cannot prove the script won't run git outside the worktree), however the path is given.

**Why:** Observed 2026-10-10; three variants (relative path, absolute path, after cd) were
all refused. Do not try to get around the guard.

**How to apply:** Read `.claude/skills/factory/scripts/checks.ps1` and replicate the checks
that apply to the changed file types with bash/node (brace balance for .js/.gjs, `ruby -c`
and the session/status grep for .rb, JSON parse of about.json/package.json). Say in the
build record that the checks were run by hand, not by the script.

The same guard refuses compound bash commands that mix `git` with other steps, or that run
`node` on a path held in a shell variable. Run `git diff`/`git commit` as their own commands,
and give `cp` / `node --check` literal absolute paths in separate calls. Python is not on
PATH either; use the Edit tool for multi-line text replacements.
