import { apiInitializer } from "discourse/lib/api";
import loadScript from "discourse/lib/load-script";

// ── Bible Tagger (v0.2) ──────────────────────────────────────────────────
//
// Wraps Blue Letter Bible's ScriptTagger. v0.1 only tagged COOKED posts —
// so plugin surfaces that render their own content (Scripture Campaign
// scenes, reveals, and passage chips; Trivia explanations) never got
// tagged. v0.2:
//
//   • SETTINGS-DRIVEN — translation / link mode / new-window come from the
//     admin panel per site instead of being hardcoded.
//   • DYNAMIC ROUTES — on any route matching bible_tagger_dynamic_routes,
//     a MutationObserver on #main-outlet re-tags as content arrives
//     (campaign scenes load via ajax well after page change; a one-shot
//     scan would miss them).
//   • LOOP-SAFE — tagging mutates the DOM, which would retrigger the
//     observer forever. Retags are debounced, and the observer disconnects
//     during a scan and reconnects after, so a scan can never observe
//     itself.
//
// BLB's pageInit() rescans the whole document and skips already-tagged
// nodes, so repeated calls are safe and cheap.

const SCRIPT_URL =
  "https://www.blueletterbible.org/assets/scripts/blbToolTip/BLB_ScriptTagger-min.js";
const DEBOUNCE_MS = 400;

export default apiInitializer((api) => {
  window.BLB ||= {};
  window.BLB.Tagger ||= {};
  window.BLB.Tagger.Translation = settings.bible_tagger_translation || "CSB";
  window.BLB.Tagger.HyperLinks = settings.bible_tagger_links || "all";
  window.BLB.Tagger.TargetNewWindow = !!settings.bible_tagger_new_window;

  const dynamicPrefixes = (settings.bible_tagger_dynamic_routes || "")
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);

  let observer = null;
  let debounceHandle = null;
  let scriptLoaded = false;

  async function ensureScript() {
    if (!scriptLoaded) {
      await loadScript(SCRIPT_URL);
      scriptLoaded = true;
    }
  }

  async function retag() {
    try {
      await ensureScript();
      if (!window.BLB?.Tagger?.pageInit) {
        return;
      }
      // Disconnect while tagging so our own DOM mutations don't retrigger
      // the observer (the classic observe-yourself loop).
      const wasObserving = !!observer;
      observer?.disconnect();
      window.BLB.Tagger.pageInit();
      if (wasObserving) {
        connectObserver();
      }
    } catch {
      // Script blocked/offline — silently skip; tagging is progressive
      // enhancement and must never break a page.
    }
  }

  function scheduleRetag() {
    clearTimeout(debounceHandle);
    debounceHandle = setTimeout(retag, DEBOUNCE_MS);
  }

  function connectObserver() {
    const outlet = document.getElementById("main-outlet");
    if (!outlet) {
      return;
    }
    observer ||= new MutationObserver(scheduleRetag);
    observer.observe(outlet, { childList: true, subtree: true });
  }

  function teardownObserver() {
    observer?.disconnect();
    observer = null;
    clearTimeout(debounceHandle);
  }

  function onDynamicRoute(url) {
    return dynamicPrefixes.some((p) => url === p || url.startsWith(p));
  }

  // Cooked posts: same surface v0.1 covered, now debounced so a stream of
  // decorations (topic load) triggers one scan, not one per post.
  api.decorateCookedElement(() => scheduleRetag(), {
    id: "bible-tagger-cooked",
    onlyStream: false,
  });

  // Dynamic plugin surfaces: watch while on a matching route.
  api.onPageChange((url) => {
    if (onDynamicRoute(url || "")) {
      connectObserver();
      scheduleRetag(); // catch content already rendered
    } else {
      teardownObserver();
    }
  });
});
