---
name: bible-tagger-blb-two-stage-load
description: Bible-tagger depends on two blueletterbible.org scripts (ScriptTagger + loadOut.cfm); CSP and readiness must cover both
metadata:
  type: project
---

Bible-tagger (client-only theme component, no server surface) loads `BLB_ScriptTagger-min.js`
from blueletterbible.org. That script then loads `loadOut.cfm` asynchronously after
`pageInit()`, and `loadOut.cfm` defines the reference regexes that tagging needs. As of job
20261010-refresh-race-forced-dark, readiness is proven by a detached "John 3:16" probe
producing an anchor.

**Why:** an empty-probe readiness check passed while every real walk threw. This is the same
lesson as "network success does not imply execution". See [[csp-network-vs-execution]].

**How to apply:** for any Bible-tagger change, ask for live CSP verification of both BLB
loads, by a non-admin member and logged out. Auth, gating and member-data checks normally do
not apply to this repo, so escalation is usually "no".
