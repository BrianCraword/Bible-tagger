# .factory

Working state for the software factory in this repo.

`jobs/` is ignored by git — uncommitted metadata blocks merges at the worst moment, and
it is why the builder is handed its spec inline rather than by path.

`log/` is tracked; the approver writes each job's record there and Brian stages it with
the merge.

Run `/factory status` in Claude Code to see where things stand.