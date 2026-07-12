import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import 'clsx';

var __freeze$1 = Object.freeze;
var __defProp$1 = Object.defineProperty;
var __template$1 = (cooked, raw) => __freeze$1(__defProp$1(cooked, "raw", { value: __freeze$1(cooked.slice()) }));
var _a$1;
const $$FreshnessChip = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$FreshnessChip;
  const BUILD_AT = (/* @__PURE__ */ new Date()).toISOString();
  return renderTemplate(_a$1 || (_a$1 = __template$1(["", '<div class="pc-freshness" id="pc-freshness"', ` aria-live="polite" hidden data-astro-cid-4jtahzdu> <button type="button" class="pc-freshness__chip mono" id="pc-freshness-chip" title="Newer content shipped since this page loaded. Click to reload." data-astro-cid-4jtahzdu> <span class="pc-freshness__dot" aria-hidden="true" data-astro-cid-4jtahzdu></span> <span class="pc-freshness__label" data-astro-cid-4jtahzdu>NEW · RELOAD</span> <span class="pc-freshness__meta" id="pc-freshness-meta" data-astro-cid-4jtahzdu></span> </button> <button type="button" class="pc-freshness__dismiss mono" id="pc-freshness-dismiss" aria-label="Dismiss new-version notice" data-astro-cid-4jtahzdu>×</button> </div> <script>
  (function () {
    'use strict';
    var root = document.getElementById('pc-freshness');
    var chip = document.getElementById('pc-freshness-chip');
    var meta = document.getElementById('pc-freshness-meta');
    var dismiss = document.getElementById('pc-freshness-dismiss');
    if (!root || !chip) return;

    var buildAt = root.getAttribute('data-build-at') || '';
    var buildMs = Date.parse(buildAt);
    if (!isFinite(buildMs)) return;

    // Poll config — 120s is rare enough to not spam, frequent enough
    // to catch ship-within-a-minute cases. First check fires 20s after
    // mount so we don't burden the initial load.
    var FIRST_CHECK_MS = 20_000;
    var POLL_MS        = 120_000;
    var DISMISS_KEY    = 'pc:freshness:dismissed-build';

    function wasDismissed() {
      try { return localStorage.getItem(DISMISS_KEY) === buildAt; }
      catch (e) { return false; }
    }
    if (wasDismissed()) return; // stay silent if this specific build was dismissed

    function show(newestIso, count) {
      if (meta) {
        var ago = relTime(newestIso);
        meta.textContent = count > 1 ? ('+' + count + ' · ' + ago) : ago;
      }
      root.hidden = false;
    }
    function hide() { root.hidden = true; }

    function relTime(iso) {
      var t = new Date(iso).getTime();
      if (!isFinite(t)) return '';
      var d = Math.max(0, Math.floor((Date.now() - t) / 1000));
      if (d < 60)        return d + 's';
      if (d < 3600)      return Math.floor(d / 60) + 'm';
      if (d < 86400)     return Math.floor(d / 3600) + 'h';
      return Math.floor(d / 86400) + 'd';
    }

    async function check() {
      try {
        var res = await fetch('/api/wire-events?limit=8', { cache: 'no-store' });
        if (!res.ok) return;
        var data = await res.json();
        var events = (data && Array.isArray(data.events)) ? data.events : [];
        // Count events strictly newer than this page's build. Only
        // 'commit' kind — blocks don't warrant a reload on their own
        // since getCollection output is already in the rendered HTML.
        var newer = events.filter(function (e) {
          if (!e || e.kind !== 'commit' || !e.at) return false;
          var ts = Date.parse(e.at);
          return isFinite(ts) && ts > buildMs;
        });
        if (newer.length === 0) { hide(); return; }
        show(newer[0].at, newer.length);
      } catch (e) { /* network blip; try again next poll */ }
    }

    chip.addEventListener('click', function () {
      // Force a full reload — bypass memory cache + ClientRouter state.
      // location.reload(true) is legacy but still works in Chromium /
      // WebKit; pass an argument otherwise and rely on no-cache HTML.
      try { window.location.reload(true); }
      catch (e) { window.location.reload(); }
    });
    dismiss.addEventListener('click', function (ev) {
      ev.stopPropagation();
      try { localStorage.setItem(DISMISS_KEY, buildAt); } catch (e) {}
      hide();
    });

    setTimeout(function () {
      check();
      setInterval(check, POLL_MS);
    }, FIRST_CHECK_MS);
  })();
<\/script>`])), maybeRenderHead(), addAttribute(BUILD_AT, "data-build-at"));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/FreshnessChip.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$FirstSee = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a || (_a = __template(["", `<div class="first-see" id="pc-first-see" role="dialog" aria-labelledby="pc-first-see-label" aria-hidden="true" hidden data-astro-cid-in2onl23> <a href="/mythos" class="first-see__link" id="pc-first-see-link" data-astro-cid-in2onl23> <span class="first-see__kicker mono" data-astro-cid-in2onl23>First time?</span> <span class="first-see__copy" id="pc-first-see-label" data-astro-cid-in2onl23>
This is a small internet town from El Segundo. <span class="first-see__cta" data-astro-cid-in2onl23>Read the mythos →</span> </span> </a> <button type="button" class="first-see__dismiss mono" id="pc-first-see-dismiss" aria-label="Dismiss first-time hint" data-astro-cid-in2onl23>×</button> </div> <script>
  (function () {
    'use strict';
    var KEY      = 'pc:first-seen';
    var SHOW_AT  = 4000;     // delay before showing — let the page settle
    var AUTO_GO  = 15_000;   // dismiss after this if untouched

    var root, link, dismiss, autoTimer, showTimer;

    function readSeen() {
      try { return localStorage.getItem(KEY) === '1'; }
      catch (e) { return true; } // private mode → don't bug the user
    }
    function writeSeen() {
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
    }

    function hide(reason) {
      if (!root) return;
      root.classList.remove('first-see--in');
      root.classList.add('first-see--out');
      // After the slide-out animation completes, fully hide.
      setTimeout(function () {
        if (root) {
          root.hidden = true;
          root.setAttribute('aria-hidden', 'true');
        }
      }, 320);
      if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
      if (reason !== 'auto') writeSeen();
    }

    function show() {
      if (!root) return;
      root.hidden = false;
      root.setAttribute('aria-hidden', 'false');
      // Force a reflow so the slide-in animation runs.
      void root.offsetHeight;
      root.classList.add('first-see--in');
      autoTimer = setTimeout(function () { hide('auto'); }, AUTO_GO);
    }

    function init() {
      root    = document.getElementById('pc-first-see');
      link    = document.getElementById('pc-first-see-link');
      dismiss = document.getElementById('pc-first-see-dismiss');
      if (!root) return;
      if (readSeen()) return;

      // The clicking-the-link path also marks seen so the hint
      // doesn't reappear after the user follows it.
      if (link) {
        link.addEventListener('click', function () {
          writeSeen();
        });
      }
      if (dismiss) {
        dismiss.addEventListener('click', function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          hide('user');
        });
      }

      showTimer = setTimeout(show, SHOW_AT);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
<\/script>`])), maybeRenderHead());
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/FirstSee.astro", void 0);

export { $$FirstSee as $, $$FreshnessChip as a };
