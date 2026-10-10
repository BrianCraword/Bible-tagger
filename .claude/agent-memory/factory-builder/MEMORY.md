# factory-builder memory

Established fix patterns for this Discourse stack. Add durable patterns here. Never put
feature-specific detail here.

- `@cached` plus key-sequence comparison is the established fix for identity-reuse
  problems in Glimmer `{{#each}}` blocks.
- Uncached getters that rebuild lists on every access corrupt the Glimmer render tree
  across route transitions. Cache them.
- `node --check` cannot validate .gjs — decorators are not plain JS. Use bracket and
  def/end balance plus static review.
- Minimum-necessary change from the last confirmed-working baseline. Never rewrite a
  block when a targeted change will do.