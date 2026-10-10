# Backlog - Bible-tagger

One feature per line. `/factory next` takes the top unchecked item.

Keep this short. The board named in `.factory/config.md` is the source of truth for
open work; this file is just the queue feeding the pipeline.

Ordered deliberately: the first three are small and visible, to prove the loop and
exercise a different reviewer each time. Real work starts at item 4.

## Prove the loop

- [ ] Replace the hardcoded dark-mode hex values in common.scss (#1f1b2e, #ece9f5, #3a3350, #c9a7f0, #ffffff) with Discourse colour variables so the popup follows the active scheme instead of one fixed palette
- [ ] Fill in about.json: theme_version 2.0.0, authors, about_url, and the minimum_discourse_version implied by apiInitializer("1.8.0"); add a .discourse-compatibility file
- [ ] Make `translation` an enum of the versions BLB actually serves, so a typo can no longer silently fall back to NKJV the way the setting description warns about

## Real defects found in 2.0.0

- [ ] A failed boot is permanent: ensureBooted does `bootPromise ||= bootstrap()`, so once bootstrap resolves false the promise stays truthy and never retries. A slow network or a 15s LOAD_TIMEOUT_MS means tagging is off until the member reloads. Add a bounded retry on page change.
- [ ] An edited post never gets re-tagged: scanNow sets data-blb-tagged on the element and skips it forever, but Discourse re-cooks into the same .cooked element. Clear the attribute when the element's content changes rather than treating it as tagged for life.
- [ ] startObserver binds to #main-outlet once and returns early if an observer already exists, so if that element is ever replaced the observer is left watching a detached node and scanning silently stops. Verify whether Discourse replaces it, and rebind if so.
- [ ] window.eval is restored by whichever of load/error/timeout fires first. If the timeout wins while the script is still in flight, BLB's later eval reaches the real one and throws under CSP with nothing catching it. Make the shim's lifetime deterministic.
- [ ] scanNow calls applyConfig and applyColorScheme on every debounced scan. Settings only change in the admin UI; move both to boot and to an explicit settings-changed path.

## Next level

- [ ] Per-member translation: let a member pick their own Bible version, persisted in localStorage, with a site setting to allow or forbid the override. Site setting stays the default.
- [ ] Category scoping: a setting naming which categories tagging applies to, so study categories get it and support or off-topic categories do not.
- [ ] An exclusion selector list to complement scan_selectors, for carving a region out of an otherwise taggable container without widening the allowlist.
- [ ] Make the popup z-index a setting rather than the hardcoded 1250, and document the stacking values it has to clear in the setting description instead of in a CSS comment.
- [ ] Verify anchors BLB creates under TargetNewWindow carry rel="noopener". Modern browsers imply it for target=_blank, so this may already be moot - confirm before changing anything.
- [ ] Move setting descriptions from settings.yml into locales/en.yml if that is the current Discourse convention for theme components. Verify first; do not restructure on my say-so.
