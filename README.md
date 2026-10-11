# Bible-tagger

Turns scripture references anywhere on the site into Blue Letter Bible tooltip links.

- **Type:** theme component
- **Site:** victoriouschristians.com
- **Repo:** https://github.com/BrianCraword/Bible-tagger

## What it does

Wraps Blue Letter Bible's ScriptTagger script so that references like "John 3:16" become hover-tooltip links to the passage in the configured translation. v0.1 tagged cooked posts only, which meant plugin surfaces rendering their own content were never tagged; v0.2 also watches a configurable list of route prefixes and re-tags as content arrives — Scripture Campaign scenes, reveals, and passage chips, Trivia explanations, and anything else that loads over ajax after the route change.

## Key files

- `javascripts/discourse/api-initializers/bible-tagger.js` — the whole component: BLB config from settings, script loading, scanning and re-tagging
- `common/common.scss` — popup and reference-link styling, light and dark, including the colour settings
- `settings.yml` — every setting, with full descriptions

## Settings

The names were changed in 2.0.0 (the `bible_tagger_` prefix was dropped). `settings.yml` has the full description of each.

| Setting | Default | Purpose |
|---|---|---|
| `tagger_enabled` | `true` | Master switch. Check this first if nothing is tagged. |
| `translation` | `CSB` | BLB translation code for the popup and links. |
| `hyperlinks` | `all` | `all`, `none` (popup only) or `hover`. |
| `target_new_window` | `true` | Open blueletterbible.org in a new tab. |
| `hide_translation_abbrev` | `false` | Hide the "CSB" BLB appends to tagged references. |
| `verse_style` | `par` | `par` or `line` verse layout in the popup. |
| `dark_theme` | `auto` | `auto` follows the colour scheme; `always` / `never`. |
| `no_search_tag_names` | `code,pre,textarea` | Tags BLB never scans. |
| `no_search_class_names` | `mention,hashtag,…` | Classes BLB never scans. |
| `scan_selectors` | `.cooked, .chat-message-text, …` | The only regions the tagger may rewrite (an allowlist). |
| `script_url` | blank | Advanced: pin a self-hosted ScriptTagger copy. |
| `debug_logging` | `false` | Log tagger activity to the console. |

### Colour settings (2.2.0)

Each default is the colour 2.1.0 used, so nothing changes until one is edited.

| Setting | Default | Colours |
|---|---|---|
| `popup_header_top_colour` | `#e0812a` | Top of the popup header bar (light and dark) |
| `popup_header_bottom_colour` | `#c1631a` | Bottom of the popup header bar (light and dark) |
| `popup_link_colour` | `#b85f14` | Links inside the popup, light mode |
| `popup_link_colour_dark` | `#f0a85a` | Links inside the popup, dark mode (`auto` and `always`) |
| `reference_link_colour` | `#d9741d` | Tagged references in posts, light mode |
| `reference_link_colour_dark` | `#f0973f` | Tagged references in posts, dark mode |
| `forced_dark_background` | `#1f1b2e` | Popup background, `dark_theme: always` |
| `forced_dark_credit_background` | `#191528` | "Powered by" strip, `dark_theme: always` |
| `forced_dark_text_colour` | `#ece9f5` | Verse text, `dark_theme: always` |
| `forced_dark_muted_colour` | `#b9b2cc` | Verse numbers and credit, `dark_theme: always` |
| `forced_dark_border_colour` | `#3a3350` | Popup outline and credit divider, `dark_theme: always` |

- **Hex only:** `#rgb` or `#rrggbb`, any case. Spaces around the value are trimmed. Anything else (`banana`, `e0812a` with no `#`, `#12345`, blank) is ignored and that one colour stays at its default. The stylesheet still compiles.
- **Why the check is in the SCSS:** Discourse has no colour setting type, and string settings can only be limited by length. Discourse passes each setting to SCSS as `$name: unquote("value")`, so the value arrives as whatever text the admin typed. A Sass function in `common.scss` (`blb-hex`) accepts it only if it is a valid hex colour; otherwise it uses the default. Only a checked hex value is ever written into the CSS.
- **Hover colours:** the underline and hover tint of a reference link come from its colour. The hover text colour is the 2.1.0 colour (`#b85f14` light, `#ffb067` dark) while the link colour is at its default. If the link colour is changed, the hover colour is mixed from it: 15% black in light mode, 25% white in dark mode.
- **`dark_theme: auto`** takes its background, text, muted text and border from the member's Discourse colour scheme. It has no settings for those; the two dark link colours do apply.

## Dependencies

Loads `BLB_ScriptTagger-min.js` from **blueletterbible.org** at runtime — an external dependency, so the tooltips need that host reachable. Nothing else required; the dynamic-route defaults point at discourse-scripture-campaign and discourse-bible-trivia, but neither has to be installed.

## Notes

- **The observer must not observe itself.** Tagging mutates the DOM, which would retrigger the MutationObserver forever. Re-tags are debounced (400 ms) and the observer disconnects for the duration of a scan, then reconnects.
- **Repeated tagging is safe.** BLB's `pageInit()` rescans the document and skips already-tagged nodes, so extra calls are cheap rather than destructive.
- **Cooked posts are handled by BLB's own pass**; the route watching exists only for surfaces that render outside the cooked-post pipeline. If a new plugin surface needs tagging, add its path prefix to `bible_tagger_dynamic_routes` — no code change.
- **The popup is styled by `--blb-*` variables** in `common/common.scss` (header, surface, text, muted, link, edge, shadow). Light mode sets them; dark mode only restates them. With `dark_theme: auto` on a dark scheme they come from the active Discourse colour scheme; `dark_theme: always` uses its own dark palette (the `forced_dark_*` settings), so the popup stays dark even on a light scheme.
- **Selectors are deliberately strong.** BLB's remote stylesheet uses ID-qualified rules (under `#bubBody`), so popup rules use a doubled `#blbTagger#blbTagger` and name `#bubBody` where needed; post links use a doubled `a.BLBST_a.BLBST_a` to beat the site's link colour. No `!important` anywhere.
- **Readiness is proven by a real tag.** After `pageInit()`, the component walks a detached test node holding a real reference and only starts scanning once BLB actually tags it, because BLB's reference data (`loadOut.cfm`) arrives after `pageInit()`. If that never happens within 10 s, one console warning says tagging is off. A walk that still fails un-marks its element and is retried after 1 s, at most 3 times per element.
