---
name: blb-css-specificity
description: BLB's remote BLBTagger.css uses ID-qualified rules; popup overrides need a doubled #blbTagger ID, and #bubBody a needs naming explicitly
metadata:
  type: reference
---

BLB's BLBTagger.css is served cross-origin, so its rules can't be read, and it uses ID-qualified selectors. A single-ID
`html.blb-dark #blbTagger.bubble a` loses to it. Confirmed live on 2026-10-10. The verse link under `#bubBody` showed BLB's rgb(57,84,127).
The fix proven live, with no `!important`, was the selector `#blbTagger#blbTagger.bubble` plus `#bubBody a` added to the link rule.
Popup internals: the heading is `.bubHead h6`, the verse numbers are `.vRef`, the CTA is `a.blb-cta`, and the SVG wordmark is `.blb-type` (use `fill`).
The popup contains no `b` or `strong`.

**How to apply:** when reviewing Bible-tagger popup CSS, don't trust specificity worked out from reading alone. Ask for the colours as computed live on a real BLB popup.
Related: [[blb-readiness-loadout]].
