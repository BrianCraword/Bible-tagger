# factory-review-frontend memory

- Use Discourse theme CSS custom properties, not hardcoded colors. A hardcoded hex is a
  finding unless the spec calls for it.
- `!important` added to win a specificity fight means the selector is wrong. The
  selector is the finding.
- Google Fonts `@import` blocks rendering. Flag new render-blocking imports.
- Decorative icons need `aria-hidden="true"`; icon-only controls need `aria-label`.