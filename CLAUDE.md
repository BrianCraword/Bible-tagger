# Bible-tagger

Theme component that wraps Blue Letter Bible's ScriptTagger so scripture references
become popup links. README.md explains the code; this file is how to test it live.

## Testing live
- Site: https://community.victoriouschristians.com (login required; Chrome is signed in
  as the Support admin). Installed as theme component id 305.
- Read the live settings in the page console:
  `moduleBroker.lookup("discourse/lib/theme-settings-store").getObjectForTheme(305)`
- Turn on `debug_logging` to see tagger activity in the console.
- Screenshots fail on this site, so ask Brian for one before calling visual work done.

## Hard-won facts
- BLB's own stylesheet is served cross-origin (unreadable) and uses ID-qualified rules
  that beat ordinary selectors. That is why `common.scss` uses `#blbTagger#blbTagger`,
  names `#bubBody`, and doubles `a.BLBST_a.BLBST_a`. Check the computed colour of every
  popup part live; specificity worked out on paper was wrong twice.
- Popup parts: header `.bubHead > div > h6`, body `#bubBody > div`, verse numbers `.vRef`,
  credit `a.blb-cta` with SVG `.blb-type` (use `fill`).
- BLB is ready only once a detached "John 3:16" probe actually gets an anchor. Its
  reference data (`loadOut.cfm`) arrives after `pageInit()`; an empty probe passes too
  early and every real walk throws.
- Test after a full reload with an empty cache: the refresh bug only showed then.
