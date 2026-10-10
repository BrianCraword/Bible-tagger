# Authoritative specification source - Bible-tagger

The spec writer reads this file first.

SPEC_DOCUMENT: <path or URL to the VC rebuild specification>
AUDIT_DOCUMENT: <path or URL to the Bible Tagger component audit, if one exists>
BASELINE: tag v2.0.0 on main (pushed 2026-10-10). This is the last confirmed-working
          state and what is installed on the live site.

## Scope of this repo

A Discourse theme component that loads Blue Letter Bible's ScriptTagger and tags
scripture references in member-authored content. BLB stays the source of truth: their
script does reference detection, the hover popup, the verse text, and carries their own
accreditation. This component does exactly three things and should not grow a fourth:

1. Gets BLB's script to run under Discourse's Content-Security-Policy, by capturing its
   eval-packed payload through a temporary window.eval shim and re-running the unpacked
   source from a Blob URL. No eval ever executes and no CSP change is required.
2. Hands BLB its configuration after load, because ScriptTagger clobbers anything set
   beforehand with its own defaults.
3. Tells BLB which regions of the page it may rewrite, via the scan_selectors allowlist.

It is explicitly NOT responsible for: Bible study content, the Feed, navigation, AI
personas, or anything server-side. It has no Ruby, no routes, no migrations and no
database access. A job that needs any of those belongs in another repo.

## Standing constraints

- Minimum-necessary change from the baseline above.
- **Never widen the scanning surface.** scan_selectors is an allowlist and it exists
  because BLB's pageInit walks document.body, and rewriting a Glimmer-owned text node
  leaves Glimmer holding a reference to a node that no longer exists. That is the
  removeChild / nextSibling failure that cost discourse-vc-feed three releases. Adding
  a container selector for a specific surface is fine. Anything broad like "#main-outlet"
  is not, and neither is removing the SUPPRESS_CLASS guard from body.
- **settings.yml evolves additively.** Never rename or remove a key; stored per-site
  values are keyed to them and survive every component update. Adding keys is fine.
- BLB's own property name `HideTanslationAbbrev` is misspelled in their source. The
  component writes both spellings on purpose. Do not "fix" it to one.
- `DarkTheme` does not exist in BLB's script. Dark mode is implemented in this
  component's own stylesheet against a class set on <html>. Do not reintroduce it as a
  BLB config key.
- The component must stay silent and harmless when tagger_enabled is false, logging one
  console line so an off switch can never again be mistaken for a failure.
- Until SPEC_DOCUMENT is filled in above, the spec writer flags missing requirements in
  Open Questions rather than inventing them.

## Live verification notes for this repo

Nothing here can be verified without a running Discourse. Every job's live-verification
section should name the surfaces it touched, drawn from the scan_selectors default:
`.cooked` (topic stream), `.chat-message-text`, `.sc-library-card__premise`. Check at
least one Feed card and one route excursion away and back, since the render corruption
this component guards against only surfaces on teardown.
