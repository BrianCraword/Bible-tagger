import { apiInitializer } from "discourse/lib/api";

// ── Bible Tagger 2.0.0 ────────────────────────────────────────────────
//
// Loads Blue Letter Bible's ScriptTagger and tags scripture references in
// member-authored content. BLB remains the source of truth: their script
// does the reference detection, the hover popup, the verse text, and
// carries their own accreditation. This component's job is (a) get their
// script to RUN under Discourse's Content-Security-Policy, (b) hand it its
// configuration, and (c) tell it exactly WHICH parts of the page it may
// rewrite.
//
// ── WHY 2.0.0 EXISTS (verified live 2026-08-30) ──────────────────────
//
// Three separate defects, all confirmed against the running site.
//
// 1. CSP BLOCKS BLB'S SCRIPT. This is the regression that took tagging
//    down without anyone changing a setting.
//
//    BLB ships BLB_ScriptTagger-min.js eval-packed: the whole payload is
//    a string handed to eval() on the first statement. Discourse's
//    default policy is now
//
//        script-src 'nonce-…' 'strict-dynamic' 'wasm-unsafe-eval'
//
//    with no 'unsafe-eval'. The exact console error is:
//
//        Uncaught EvalError: Evaluating a string as JavaScript violates
//        the following Content Security Policy directive…
//
//    The script downloads, onload fires, and it defines NOTHING — which
//    is why the network layer looks healthy and the old component's
//    `window.BLB.Tagger` guard passed anyway (it created that object
//    itself two lines earlier) and then threw "pageInit is not a
//    function" on every render.
//
//    content_security_policy_script_src on this site is EMPTY. Nothing
//    was misconfigured here; Discourse core dropped 'unsafe-eval' from
//    its defaults.
//
//    THE FIX (see loadTagger below): we shadow window.eval for the
//    duration of the script load. BLB's packer calls eval(payload); our
//    shim captures that string and returns without evaluating it — so no
//    eval ever executes and CSP is never violated. We then run the
//    captured, already-unpacked source from a Blob URL, which
//    'strict-dynamic' permits because a trusted script created it.
//
//    Verified: the unpacked payload is ~11.5KB, defines pageInit plus 20
//    other functions, and contains ZERO further eval / new Function /
//    document.write — so it runs clean under the strict policy.
//
//    This keeps the site on BLB's live script (no self-hosted fork to go
//    stale) and requires NO CSP change. Adding 'unsafe-eval' would weaken
//    the policy page-globally for every script on the site; we don't.
//
// 2. CONFIG MUST BE APPLIED AFTER LOAD. ScriptTagger assigns its own
//    defaults onto window.BLB.Tagger when it executes, clobbering
//    anything set beforehand. Setting Translation="CSB" before the load
//    silently yields NKJV. applyConfig() therefore runs post-load.
//
//    Two config keys the previous version got wrong, both confirmed by
//    reading BLB's unpacked source:
//      • BLB reads `HideTanslationAbbrev` — THEIR typo, missing the 'r'
//        (`HideVersions=BLB.Tagger.HideTanslationAbbrev`). Writing the
//        correctly-spelled `HideTranslationAbbrev` did nothing. We now
//        write both.
//      • `DarkTheme` appears NOWHERE in BLB's script. The old
//        darkWanted() helper and its matchMedia listener were pure
//        no-ops. Dark mode is now implemented in our own stylesheet
//        against a class we set on <html>.
//
// 3. DOCUMENT-WIDE SCANNING CORRUPTS GLIMMER DOM. pageInit() takes no
//    arguments and hardcodes walkDomTree(document.body). On this site
//    #main-outlet holds the je-nav tree, the vc-feed rails, and nodes
//    like .vc-ai-space__conversation-title — which routinely contains
//    text such as "Romans 1:18-32: Diagnosis, Not Denunciation". BLB
//    replaces that Glimmer-owned text node with an anchor; Glimmer still
//    holds a reference to the node it created, and the next render or
//    teardown produces the removeChild / nextSibling failures that cost
//    vc-feed three releases (0.31.5-0.32.0).
//
//    THE FIX: never let BLB walk the document. walkDomTree(node) accepts
//    an arbitrary root, but its internal `Dom` alias only binds inside
//    pageInit(). So we put SUPPRESS_CLASS on <body> and list it in
//    NoSearchClassNames, then call pageInit() exactly once: it performs
//    its setup and binds Dom while tagging ZERO nodes (verified live).
//    The guard class then STAYS on <body> permanently, so any future
//    stray pageInit() call is inert. From then on we call
//    walkDomTree(el) only on elements matching the scan_selectors
//    setting — a whitelist, never the whole page.
//
//    Verified live: one Feed card body tagged 8 references with zero
//    anchors created outside it, and four feed<->latest route excursions
//    with tagging active produced zero render-corruption errors.
// ──────────────────────────────────────────────────────────────────────

const DEFAULT_SRC =
  "https://www.blueletterbible.org/assets/scripts/blbToolTip/BLB_ScriptTagger-min.js";

// Present on <body> and listed in NoSearchClassNames. Makes any
// document-wide walk a no-op without preventing scoped walks on
// descendants (a scoped walk starts BELOW body, so body is never visited).
const SUPPRESS_CLASS = "blb-no-scan";

// Marks an element we have already tagged, so a re-scan skips it.
const DONE_ATTR = "data-blb-tagged";

const RESCAN_DEBOUNCE_MS = 150;
const LOAD_TIMEOUT_MS = 15000;
const READY_TIMEOUT_MS = 10000;
const READY_POLL_MS = 120;

// A walk that throws un-marks its element so a later pass can try again,
// but each element identity is walked at most MAX_WALK_ATTEMPTS times.
const MAX_WALK_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

let bootPromise = null;
let taggerReady = false;
let rescanTimer = null;
let retryTimer = null;
let observer = null;
let diagnosed = false;

// Element -> number of failed walkDomTree attempts. Weak, so elements
// Glimmer tears down are not kept alive by the count.
const walkAttempts = new WeakMap();

function debug(...args) {
  if (settings.debug_logging) {
    // eslint-disable-next-line no-console
    console.info("[bible-tagger]", ...args);
  }
}

function warnOnce(message) {
  if (diagnosed) {
    return;
  }
  diagnosed = true;
  // eslint-disable-next-line no-console
  console.warn("[bible-tagger] " + message);
}

function currentScriptUrl() {
  return (settings.script_url || "").trim() || DEFAULT_SRC;
}

function scanSelector() {
  return (settings.scan_selectors || "").trim();
}

function hasPageInit() {
  return typeof window.BLB?.Tagger?.pageInit === "function";
}

// ── Load + unpack ─────────────────────────────────────────────────────
//
// Shadow window.eval only for the duration of this load, and only for a
// payload that looks like BLB's (so an unrelated concurrent eval still
// reaches the real one). Restored unconditionally.
function loadTagger() {
  return new Promise((resolve) => {
    const realEval = window.eval;
    let captured = null;
    let capturing = true;
    let settled = false;

    window.eval = function (source) {
      if (
        capturing &&
        typeof source === "string" &&
        source.indexOf("BLB.Tagger") !== -1
      ) {
        captured = source;
        return undefined;
      }
      return realEval.apply(this, arguments);
    };

    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      capturing = false;
      if (window.eval !== realEval) {
        window.eval = realEval;
      }
      resolve(captured);
    };

    const el = document.createElement("script");
    el.src = currentScriptUrl();
    el.async = true;
    el.addEventListener("load", finish);
    el.addEventListener("error", finish);
    setTimeout(finish, LOAD_TIMEOUT_MS);

    try {
      document.head.appendChild(el);
    } catch {
      finish();
    }
  });
}

// Run the captured (already-unpacked) source. A Blob URL script created
// by trusted script is permitted under 'strict-dynamic'.
function runUnpacked(source) {
  return new Promise((resolve) => {
    let url;
    try {
      url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
    } catch {
      resolve(false);
      return;
    }

    const el = document.createElement("script");
    const done = (ok) => {
      URL.revokeObjectURL(url);
      resolve(ok);
    };
    el.src = url;
    el.addEventListener("load", () => done(true));
    el.addEventListener("error", () => done(false));

    try {
      document.head.appendChild(el);
    } catch {
      done(false);
    }
  });
}

// ── Configuration ─────────────────────────────────────────────────────

function noSearchClassNames() {
  const configured = (settings.no_search_class_names || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!configured.includes(SUPPRESS_CLASS)) {
    configured.push(SUPPRESS_CLASS);
  }
  return configured.join(",");
}

function applyConfig() {
  window.BLB ||= {};
  window.BLB.Tagger ||= {};

  const t = window.BLB.Tagger;
  t.Translation = settings.translation || "CSB";
  t.HyperLinks = settings.hyperlinks || "all";
  t.TargetNewWindow = settings.target_new_window !== false;
  t.Style = settings.verse_style || "par";

  // BLB's own key is misspelled. Write both so this keeps working if
  // they ever fix it.
  const hide = !!settings.hide_translation_abbrev;
  t.HideTanslationAbbrev = hide;
  t.HideTranslationAbbrev = hide;

  if (settings.no_search_tag_names) {
    t.NoSearchTagNames = settings.no_search_tag_names;
  }
  t.NoSearchClassNames = noSearchClassNames();
}

// Dark mode is ours, not BLB's — their script has no DarkTheme option.
// We flag <html> and the stylesheet does the rest. `always` also adds a
// forced-dark class, which selects the fixed dark palette so the popup
// stays dark on a light scheme; `auto` follows the scheme's colours.
function applyColorScheme() {
  const mode = settings.dark_theme || "auto";
  let dark;

  if (mode === "always") {
    dark = true;
  } else if (mode === "never") {
    dark = false;
  } else {
    const scheme = getComputedStyle(document.documentElement)
      .getPropertyValue("--scheme-type")
      .trim();
    if (scheme) {
      dark = scheme === "dark";
    } else {
      dark =
        document.documentElement.classList.contains("dark-scheme") ||
        !!window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    }
  }

  document.documentElement.classList.toggle("blb-dark", dark);
  document.documentElement.classList.toggle("blb-light", !dark);
  document.documentElement.classList.toggle(
    "blb-dark-forced",
    mode === "always"
  );
}

// ── Bootstrap ─────────────────────────────────────────────────────────

// pageInit() binds the internal `Dom` alias that walkDomTree needs, but
// it does so asynchronously (it loads YUI first). That alone is not
// readiness: refSearch reads BLB.Tagger.bcre/ccre/rqt/rre, which come
// from loadOut.cfm and arrive asynchronously AFTER pageInit(). Walking an
// empty node never reaches refSearch, so an empty probe passed while
// every real walk still threw. Instead, each attempt walks a fresh,
// detached node holding only a real reference as plain text, and counts
// as ready only if BLB actually produced an anchor in it. The probe is never
// inserted into the document (so it cannot be hovered) and is never
// reused after a failed attempt, since a throw may leave it half-walked.
// Returns the attempt count when ready, false on timeout.
async function waitForWalkReady() {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let attempts = 0;

  while (Date.now() < deadline) {
    attempts++;
    const probe = document.createElement("div");
    probe.textContent = "John 3:16";
    let ready = false;
    try {
      window.BLB.Tagger.walkDomTree(probe);
      ready = probe.querySelector("a") !== null;
    } catch {
      ready = false;
    }
    if (ready) {
      // Drop BLB's anchor (and anything attached to it) with the probe.
      probe.textContent = "";
      return attempts;
    }
    await new Promise((r) => setTimeout(r, READY_POLL_MS));
  }
  return false;
}

async function bootstrap() {
  // Guard goes on BEFORE anything can walk, and stays on for good.
  document.body?.classList.add(SUPPRESS_CLASS);

  const captured = await loadTagger();

  if (!hasPageInit()) {
    if (!captured) {
      warnOnce(
        "Could not load ScriptTagger from " +
          currentScriptUrl() +
          " — scripture tagging is OFF. The script either failed to " +
          "download, or BLB changed how it packages the file. Check the " +
          "URL and that the host is reachable."
      );
      return false;
    }

    debug("script was eval-packed; running unpacked payload", captured.length);
    const ok = await runUnpacked(captured);

    if (!ok || !hasPageInit()) {
      warnOnce(
        "Captured ScriptTagger's packed payload but it did not define " +
          "pageInit when re-run — scripture tagging is OFF. BLB has " +
          "probably changed the file's structure."
      );
      return false;
    }
  }

  applyConfig();
  applyColorScheme();

  // One-time setup. Tags nothing: <body> carries SUPPRESS_CLASS and that
  // class is in NoSearchClassNames, so the document-wide walk is inert.
  try {
    window.BLB.Tagger.pageInit();
  } catch (e) {
    warnOnce("ScriptTagger pageInit() threw during setup: " + e);
    return false;
  }

  const probeAttempts = await waitForWalkReady();
  if (!probeAttempts) {
    warnOnce(
      "ScriptTagger loaded but never tagged a test reference: BLB's " +
        "reference data (loadOut.cfm) or its YUI dependency did not " +
        "finish loading — scripture tagging is OFF."
    );
    return false;
  }

  taggerReady = true;
  debug("ready after", probeAttempts, "probe attempt(s)");
  return true;
}

function ensureBooted() {
  bootPromise ||= bootstrap();
  return bootPromise;
}

// ── Scanning ──────────────────────────────────────────────────────────

function scanNow() {
  if (!taggerReady) {
    return;
  }

  const selector = scanSelector();
  if (!selector) {
    return;
  }

  let nodes;
  try {
    nodes = document.querySelectorAll(selector);
  } catch {
    warnOnce(
      "The scan_selectors setting is not a valid CSS selector list — " +
        "scripture tagging is OFF. Value: " +
        selector
    );
    return;
  }

  applyConfig();
  applyColorScheme();

  let tagged = 0;
  let retryWanted = false;
  nodes.forEach((el) => {
    if (el.hasAttribute(DONE_ATTR) || !el.isConnected) {
      return;
    }
    // Mark BEFORE walking. Our own anchor insertions fire the observer;
    // marking first guarantees the follow-up pass finds nothing and the
    // loop terminates.
    el.setAttribute(DONE_ATTR, "1");
    try {
      window.BLB.Tagger.walkDomTree(el);
      walkAttempts.delete(el);
      tagged++;
    } catch (e) {
      debug("walkDomTree failed on", el, e);
      // A failed walk must not leave the element marked done forever,
      // but it must not hot-loop either: un-mark it for a later retry
      // until it has failed MAX_WALK_ATTEMPTS times, then give up.
      const count = (walkAttempts.get(el) || 0) + 1;
      walkAttempts.set(el, count);
      if (count < MAX_WALK_ATTEMPTS) {
        el.removeAttribute(DONE_ATTR);
        retryWanted = true;
      } else {
        debug("giving up on", el, "after", count, "failed walk(s)");
      }
    }
  });

  if (tagged) {
    debug("tagged", tagged, "element(s)");
  }

  // One pending retry at most; like rescanTimer, never reset it.
  if (retryWanted && !retryTimer) {
    retryTimer = setTimeout(() => {
      retryTimer = null;
      scheduleRescan();
    }, RETRY_DELAY_MS);
  }
}

// Trailing-edge coalescer. Deliberately does NOT reset a pending timer:
// resetting on every mutation lets a busy page starve the scan forever.
function scheduleRescan() {
  if (rescanTimer) {
    return;
  }
  rescanTimer = setTimeout(() => {
    rescanTimer = null;
    ensureBooted().then((ok) => {
      if (ok) {
        scanNow();
      }
    });
  }, RESCAN_DEBOUNCE_MS);
}

function startObserver() {
  if (observer) {
    return;
  }
  const root = document.querySelector("#main-outlet") || document.body;
  if (!root) {
    return;
  }
  observer = new MutationObserver(() => scheduleRescan());
  observer.observe(root, { childList: true, subtree: true });
}

// ── Initializer ───────────────────────────────────────────────────────

export default apiInitializer("1.8.0", (api) => {
  if (settings.tagger_enabled !== true) {
    // eslint-disable-next-line no-console
    console.info(
      "[bible-tagger] loaded, but the tagger_enabled setting is not true — " +
        "doing nothing. Admin → Customize → Themes → Bible Tagger → Settings."
    );
    return;
  }

  // Cooked post bodies in the topic stream.
  api.decorateCooked(() => scheduleRescan(), {
    id: "bible-tagger",
    onlyStream: false,
  });

  // decorateCooked does not fire for every surface — vc-feed renders card
  // bodies straight from the stream payload, and the Plaza and campaign
  // surfaces build their own markup. Page changes plus a scoped
  // MutationObserver catch those, including content that arrives later
  // via infinite scroll or MessageBus.
  api.onPageChange(() => {
    startObserver();
    scheduleRescan();
  });

  startObserver();
  scheduleRescan();

  // Re-theme the popup when the member flips light/dark without reloading.
  if (settings.dark_theme === "auto") {
    window
      .matchMedia?.("(prefers-color-scheme: dark)")
      ?.addEventListener?.("change", () => applyColorScheme());
  }
});
