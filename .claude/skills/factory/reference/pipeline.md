# Job file layout

```
.factory/
  backlog.md                  one feature per line, "- [ ] ..."
  config.md                   gates, board path, default branch
  SPEC-SOURCE.md              where the authoritative rebuild spec lives
  jobs/<job-id>/              working state, not committed
    job.md                    id, date, request, status
    spec.md                   stage 1
    checks.md                 static check results
    build.md                  stage 2
    review-discourse-api.md   stage 3
    review-backend.md
    review-frontend.md
    review-security.md
    approval.md               stage 5
  log/<job-id>.md             one-screen record, committed
```

Job id format: `<yyyyMMdd>-<short-slug>`, e.g. `20261011-status-indicator-tooltip`.
Branch: `factory/<job-id>`.

# Status values

`spec` → `awaiting-design-approval` → `build` → `review` → `rework` → `decided` → `merged`

# Why the working state is not committed

Uncommitted metadata in the working tree blocks the merge at exactly the wrong moment.
`.factory/jobs/` is ignored, so it never dirties `git status`.

This has a consequence worth knowing: the builder runs in an isolated worktree, which is
a clean checkout of the default branch, so `.factory/jobs/` does not exist there. The
builder cannot read its own spec from disk. The orchestrator hands it the spec text in
the delegation prompt, and writes the builder's returned report back to `build.md` in the
main checkout. Everything else — spec writer, reviewers, approver — runs in the main
checkout and reads these files normally.

The durable record is `.factory/log/<job-id>.md`, which is tracked. The approver writes
it; Brian stages it with the merge.

# Parallelism

The builder uses `isolation: worktree`, so several jobs can run at once in separate
Windows Terminal panes without colliding. Two or three concurrent jobs is the practical
ceiling before review quality drops and usage limits bite.