# factory-review-backend memory

- `session` and `status` are Rails reserved names. A Discourse plugin controller action
  using either 404s silently with nothing in the logs.
- Plugin routes do not appear in `rake routes`. Absence there proves nothing.
- Admin sessions mask Guardian checks — admin id 1 makes every visibility and permission
  check permissive. A check exercised only as admin has not been validated.
- When window-function SQL uses `.from(subquery, :alias)`, use `mini_sql`
  (`DB.query` / `DB.query_single`). ActiveRecord's default scope silently appends
  conditions against the original table, raising `PG::UndefinedTable`, often rescued
  into an empty array that hides the failure.
- Matchmaking gates on plugin-managed groups (`matchmaking_onboarding`,
  `matchmaking_interviewing`, `matchmaking_participants`), not trust levels. Flag any
  reintroduction of trust-level coupling.
- Cloudflare caching can mask real server behavior during verification.