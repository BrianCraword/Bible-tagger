---
name: blb-readiness-loadout
description: BLB ScriptTagger readiness — walkDomTree on an empty node passes before loadOut.cfm defines the reference regexes; only a real-reference probe proves readiness
metadata:
  type: reference
---

BLB.Tagger.refSearch reads BLB.Tagger.bcre/ccre/rqt/rre, which are defined by loadOut.cfm.
That file loads asynchronously AFTER pageInit(). If walkDomTree runs on an empty node, it never
reaches refSearch, so an empty probe reports "ready" too early. Every real walk then throws
"Cannot read properties of undefined (reading 'test')". This was confirmed live on 2026-10-10.
BLB does tag a detached node: a detached "John 3:16" div gets an a.BLBST_a, with no leak and no popup.

**How to apply:** when reviewing Bible-tagger readiness code, require that readiness is proven by an
anchor actually appearing in a detached probe. Do not accept "walkDomTree didn't throw" as proof.
The MutationObserver there watches childList only, so attribute toggles (data-blb-tagged) do not fire it.
Related: [[dom-ownership]].
