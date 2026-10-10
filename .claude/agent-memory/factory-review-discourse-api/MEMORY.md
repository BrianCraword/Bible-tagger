# factory-review-discourse-api memory

- DOM ownership is the recurring fault line in this stack. Anything that rewrites or
  replaces Glimmer-owned text nodes outside Glimmer's awareness corrupts the render tree
  — `removeChild` and `nextSibling` null errors — especially across route transitions.
  Two separate incidents: a third-party script walking `document.body`, and uncached
  list getters in vc-feed.
- `@cached` plus key-sequence comparison is the established fix for identity reuse in
  `{{#each}}`.
- The `custom_homepage` claim stays with VC-Canvas, not with the redirect plugin.
- Live instrumentation beats static analysis here. Source-only analysis of this stack has
  produced retracted findings more than once. State confidence accordingly.