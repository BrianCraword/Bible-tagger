# factory-review-security memory

- Admin sessions make every Guardian and visibility check permissive. Category-visibility
  filtering in this codebase went unvalidated for exactly this reason.
- Gated destinations are never linked directly. All matchmaking entry points route
  through `/matchmaking/profile`, which handles every consent and verification state.
- The Veritas interview agent is ephemeral by design: reachable only inside its
  interview window, via a server-owned authorized link, gone once it resolves.
- Network success does not imply script execution. A third-party script downloaded and
  fired `onload` while CSP silently blocked its `eval`, leaving its API undefined.
- A GitHub PAT was previously exposed from `app.yml` via discourse-doctor to a public
  URL. No token, PAT or key belongs in source or committed config.