# Ship checklist

The factory never deploys. This is the checklist it hands Brian.

## Before merge

1. Read `.factory/jobs/<id>/approval.md` end to end.
2. Read the diff yourself: `git diff <default-branch>...factory/<id>`
3. Confirm the baseline the spec names is the last confirmed-working one.

## Merge

```
git checkout <default-branch>
git merge --no-ff factory/<id>
git add .factory/log/<id>.md
git commit -m "Factory job <id> record"
```

Throw it away instead:

```
git branch -D factory/<id>
git worktree prune
```

## Live verification

Work the numbered list in `approval.md` under "What to check on the live site".

Rules that apply every time:
- Do not verify as admin id 1 alone. Admin sessions make every Guardian and visibility
  check permissive, so a permission change verified only as admin is unverified.
- Screenshots do not work on community.victoriouschristians.com — MessageBus
  long-polling blocks the idle heuristic. Use DOM interrogation instead.
- Throttle browser automation loops to 3–4 iterations with generous pauses;
  `max_reqs_per_ip_per_10_seconds` is 50 and admin traffic hits it.
- Clear the console between test phases or you will match stale output.

## Deploy

Theme and component repos: push, then update from the admin theme UI.
Plugin repos: push, then rebuild the container.

Deploy one change at a time. If anything looks wrong afterwards, the baseline to return
to is the merge commit's first parent.