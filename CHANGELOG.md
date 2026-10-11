# Changelog

## 2.2.0 — 2026-10-10
- New: eleven colour settings, so admins can change the popup and
  reference-link colours without editing code. Each default is exactly the
  2.1.0 colour, so upgrading changes nothing until one is edited (checked by
  compiling both versions and diffing the CSS: identical).
  - `popup_header_top_colour`, `popup_header_bottom_colour` — header bar
  - `popup_link_colour`, `popup_link_colour_dark` — links inside the popup
  - `reference_link_colour`, `reference_link_colour_dark` — tagged
    references in posts
  - `forced_dark_background`, `forced_dark_credit_background`,
    `forced_dark_text_colour`, `forced_dark_muted_colour`,
    `forced_dark_border_colour` — the `dark_theme: always` palette
- Values must be hex (`#rgb` or `#rrggbb`). An invalid value (a colour name,
  a missing `#`, a wrong length, blank) is ignored and that colour stays at
  its default; the stylesheet still compiles.
- The hover colour of a reference link is now worked out from that link's
  colour. At the default colours it is unchanged.
- `dark_theme: auto` still takes its colours from the Discourse colour
  scheme; only the two dark link colours apply to it.
- No JavaScript changes. No existing setting changed.

## 2.1.0 — 2026-10-10
- Fixed: after a full page load (cold cache), references are tagged again.
  The component now waits until BLB actually tags a test reference before
  scanning, and a failed walk is retried, at most 3 times per element.
- New popup design: orange header bar, rounded card with shadow, site
  fonts, orange reference links in posts, and a toned-down "Powered by"
  credit. Every colour comes from a small set of `--blb-*` variables, so
  light and dark modes only restate the variables.
- Dark mode now styles the whole popup, not just its outer frame. BLB's own
  stylesheet had kept a white body, blue header and black text inside it.
  `dark_theme: auto` follows the active colour scheme; `always` uses a
  fixed dark palette that stays dark on a light scheme.

## 2.0.0 — 2026-10-10
- **Breaking: every setting key was renamed from its 0.2.0 name.** The
  `bible_tagger_` prefix was dropped throughout, so existing values do not
  carry over — the component comes up with defaults and must be reconfigured
  after upgrading.
  - `bible_tagger_translation` -> `translation`
  - `bible_tagger_links` -> `hyperlinks`
  - `bible_tagger_new_window` -> `target_new_window`
  - `bible_tagger_dynamic_routes` -> removed, no replacement setting
- Added settings: `tagger_enabled`, `hide_translation_abbrev`, `verse_style`,
  `dark_theme`, `no_search_tag_names`, `no_search_class_names`,
  `scan_selectors`, `script_url`, `debug_logging`.
- Replaced the `theme-initializer.gjs` initializer with a plain-JS
  `javascripts/discourse/api-initializers/bible-tagger.js`.
- Added `common/common.scss`.
- Renamed the component to "Bible Tagger 2.0" and set `theme_version` to
  `2.0.0` (the 2.0 package shipped it unset).

## 2026-07-08 — changelog initialized
- Added CHANGELOG.md as part of command-center validation system. (commit: <hash>)
