# Bible-tagger

Turns scripture references anywhere on the site into Blue Letter Bible tooltip links.

- **Type:** theme component
- **Site:** victoriouschristians.com
- **Repo:** https://github.com/BrianCraword/Bible-tagger

## What it does

Wraps Blue Letter Bible's ScriptTagger script so that references like "John 3:16" become hover-tooltip links to the passage in the configured translation. v0.1 tagged cooked posts only, which meant plugin surfaces rendering their own content were never tagged; v0.2 also watches a configurable list of route prefixes and re-tags as content arrives — Scripture Campaign scenes, reveals, and passage chips, Trivia explanations, and anything else that loads over ajax after the route change.

## Key files

- `javascripts/discourse/api-initializers/theme-initializer.gjs` — the whole component: BLB config from settings, script loading, the `#main-outlet` MutationObserver, and the debounced re-tag
- `settings.yml` — translation, link mode, new-window, and the dynamic-route list

## Settings

| Setting | Default | Purpose |
|---|---|---|
| `bible_tagger_translation` | `CSB` | BLB translation code used by tooltips and links (CSB, ESV, KJV, NASB20, NIV, NKJV, NLT, …). |
| `bible_tagger_new_window` | `true` | Open tagged references in a new tab. |
| `bible_tagger_links` | `all` | `all` tags even references already inside links; `none` gives tooltip only. |
| `bible_tagger_dynamic_routes` | `/scripture-campaign\|/trivia` | Path prefixes where content loads dynamically and should still be tagged. One prefix per row. |

## Dependencies

Loads `BLB_ScriptTagger-min.js` from **blueletterbible.org** at runtime — an external dependency, so the tooltips need that host reachable. Nothing else required; the dynamic-route defaults point at discourse-scripture-campaign and discourse-bible-trivia, but neither has to be installed.

## Notes

- **The observer must not observe itself.** Tagging mutates the DOM, which would retrigger the MutationObserver forever. Re-tags are debounced (400 ms) and the observer disconnects for the duration of a scan, then reconnects.
- **Repeated tagging is safe.** BLB's `pageInit()` rescans the document and skips already-tagged nodes, so extra calls are cheap rather than destructive.
- **Cooked posts are handled by BLB's own pass**; the route watching exists only for surfaces that render outside the cooked-post pipeline. If a new plugin surface needs tagging, add its path prefix to `bible_tagger_dynamic_routes` — no code change.
- **The popup is styled by `--blb-*` variables** in `common/common.scss` (header, surface, text, muted, link, edge, shadow). Light mode sets them; dark mode only restates them. With `dark_theme: auto` on a dark scheme they come from the active Discourse colour scheme; `dark_theme: always` uses a fixed dark palette, so the popup stays dark even on a light scheme.
- **Selectors are deliberately strong.** BLB's remote stylesheet uses ID-qualified rules (under `#bubBody`), so popup rules use a doubled `#blbTagger#blbTagger` and name `#bubBody` where needed; post links use a doubled `a.BLBST_a.BLBST_a` to beat the site's link colour. No `!important` anywhere.
- **Readiness is proven by a real tag.** After `pageInit()`, the component walks a detached test node holding a real reference and only starts scanning once BLB actually tags it, because BLB's reference data (`loadOut.cfm`) arrives after `pageInit()`. If that never happens within 10 s, one console warning says tagging is off. A walk that still fails un-marks its element and is retried after 1 s, at most 3 times per element.
