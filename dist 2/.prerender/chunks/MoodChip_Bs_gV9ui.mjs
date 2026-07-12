import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { m as maybeRenderHead, a as renderTemplate, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import 'clsx';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { M as MOOD_SOUNDTRACKS } from './moods-soundtracks_CEitMVRv.mjs';

const $$PresenceBar = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<span class="presence" id="pc-presence" aria-live="polite" data-initial="off" data-astro-cid-duy6ze2x> <span class="presence__sep" aria-hidden="true" data-astro-cid-duy6ze2x>·</span> <span class="presence__pill" id="pc-presence-pill" data-astro-cid-duy6ze2x> <span class="presence__dot" aria-hidden="true" data-astro-cid-duy6ze2x></span> <span class="presence__you" data-astro-cid-duy6ze2x>YOU</span> <span class="presence__count" id="pc-presence-label" data-astro-cid-duy6ze2x>·</span> </span> </span> ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/PresenceBar.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/PresenceBar.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$MoodChip = createComponent(($$result, $$props, $$slots) => {
  const MOODS = [
    { id: "chill", label: "CHILL", color: "#2B8A3E", hint: "slow + calm" },
    { id: "hype", label: "HYPE", color: "#C92A2A", hint: "on the rise" },
    { id: "focus", label: "FOCUS", color: "#1864AB", hint: "in the work" },
    { id: "flow", label: "FLOW", color: "#5F3DC4", hint: "on tempo" },
    { id: "curious", label: "CURIOUS", color: "#E8590C", hint: "following a thread" },
    { id: "quiet", label: "QUIET", color: "#5F5E5A", hint: "under the noise" }
  ];
  JSON.stringify(MOOD_SOUNDTRACKS);
  return renderTemplate(_a || (_a = __template(["", '<aside class="mood" aria-label="Current mood" data-astro-cid-ywn45ifw> <span class="mood__kicker mono" data-astro-cid-ywn45ifw>MOOD · ONE TAP · PAGE FOLLOWS</span> <div class="mood__row" role="group" data-astro-cid-ywn45ifw> ', ` </div>  </aside> <script>
  (function () {
    var buttons = Array.from(document.querySelectorAll('.mood__btn[data-mood-id]'));
    if (!buttons.length) return;
    var lsKey = 'pc:mood';
    var root = document.documentElement;

    // Mood → hue map for the meditative color-field pulse.
    // Per Mike 2026-04-20 13:00 PT: "when you click mode, animation and
    // change of the ui to match, have lite visualizations that are
    // meditative."
    var MOOD_HUE = {
      chill:   155,  // green-tea
      hype:    8,    // warm red
      focus:   215,  // cobalt
      flow:    275,  // soft violet
      curious: 28,   // amber
      quiet:   220,  // deep slate-blue
    };

    function applyMood(id) {
      if (!id) return;
      root.setAttribute('data-pc-mood', id);
      buttons.forEach(function (b) {
        b.classList.toggle('mood__btn--active', b.getAttribute('data-mood-id') === id);
      });
    }

    function meditativePulse(id) {
      // Respect prefers-reduced-motion.
      try {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      } catch (e) {}
      var hue = MOOD_HUE[id] || 28;
      var overlay = document.createElement('div');
      overlay.className = 'mood-pulse';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.setProperty('--mood-hue', String(hue));
      document.body.appendChild(overlay);
      // Cleanup after animation completes.
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 1800);
    }

    // Paint prior choice (no pulse on initial load).
    try {
      var prior = localStorage.getItem(lsKey);
      if (prior) applyMood(prior);
    } catch (e) {}

    // ---------- Soundtrack toggle (Mike 2026-04-20 13:20 PT: "soundtracks
    //            that match the mood, that can be turned on, broadcast") ----
    var soundtrackEl = document.getElementById('mood-soundtrack');
    var soundtrackToggle = document.getElementById('mood-soundtrack-toggle');
    var soundtrackLabel = document.getElementById('mood-soundtrack-label');
    var soundtrackPlayer = document.getElementById('mood-soundtrack-player');
    var soundtrackFrame = document.getElementById('mood-soundtrack-frame');
    var soundtrackClose = document.getElementById('mood-soundtrack-close');
    var soundtracks = {};
    try { soundtracks = JSON.parse(soundtrackEl && soundtrackEl.getAttribute('data-soundtracks') || '{}'); } catch (e) { soundtracks = {}; }

    function showSoundtrackOffer(id) {
      if (!soundtrackEl || !soundtrackLabel || !soundtrackToggle) return;
      var t = soundtracks[id];
      if (!t) { soundtrackEl.hidden = true; return; }
      soundtrackEl.hidden = false;
      soundtrackLabel.textContent = t.label + ' · ' + id.toUpperCase();
      soundtrackToggle.setAttribute('data-mood-id', id);
      soundtrackToggle.setAttribute('aria-expanded', 'false');
      // Reset player when switching moods.
      if (soundtrackPlayer) soundtrackPlayer.hidden = true;
      if (soundtrackFrame && soundtrackFrame.src && soundtrackFrame.src !== 'about:blank') {
        soundtrackFrame.src = 'about:blank';
      }
    }

    function openSoundtrack() {
      if (!soundtrackPlayer || !soundtrackFrame || !soundtrackToggle) return;
      var id = soundtrackToggle.getAttribute('data-mood-id');
      var t = id && soundtracks[id];
      if (!t) return;
      soundtrackFrame.src = t.url;
      soundtrackPlayer.hidden = false;
      soundtrackToggle.setAttribute('aria-expanded', 'true');
    }

    function closeSoundtrack() {
      if (!soundtrackPlayer || !soundtrackFrame || !soundtrackToggle) return;
      soundtrackFrame.src = 'about:blank';
      soundtrackPlayer.hidden = true;
      soundtrackToggle.setAttribute('aria-expanded', 'false');
    }

    if (soundtrackToggle) {
      soundtrackToggle.addEventListener('click', function () {
        if (soundtrackToggle.getAttribute('aria-expanded') === 'true') closeSoundtrack();
        else openSoundtrack();
      });
    }
    if (soundtrackClose) soundtrackClose.addEventListener('click', closeSoundtrack);

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-mood-id');
        try { localStorage.setItem(lsKey, id); } catch (e) {}
        applyMood(id);
        meditativePulse(id);
        // Notify the CoNavigator so the persistent bar updates + offers ▶.
        try {
          window.dispatchEvent(new CustomEvent('pc:mood-changed', { detail: { moodId: id } }));
        } catch (e) {}
      });
    });
  })();
<\/script> `])), maybeRenderHead(), MOODS.map((m) => renderTemplate`<button type="button" class="mood__btn"${addAttribute(m.id, "data-mood-id")}${addAttribute(`--mood-color: ${m.color};`, "style")}${addAttribute(`Set mood: ${m.label}`, "aria-label")} data-astro-cid-ywn45ifw> <span class="mood__swatch" aria-hidden="true" data-astro-cid-ywn45ifw></span> <span class="mood__label mono" data-astro-cid-ywn45ifw>${m.label}</span> <span class="mood__hint" data-astro-cid-ywn45ifw>${m.hint}</span> </button>`));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/MoodChip.astro", void 0);

export { $$PresenceBar as $, $$MoodChip as a };
