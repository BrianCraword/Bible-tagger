# Changelog

## [Unreleased]
- The dark-mode popup (`html.blb-dark #blbTagger.bubble`) now takes its
  background, text, border, link, and bold heading/credit colours from the
  active Discourse colour scheme instead of a fixed purple palette. As a
  result, `dark_theme: always` on a light scheme now shows that light
  scheme's own colours rather than the old fixed dark palette.

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
