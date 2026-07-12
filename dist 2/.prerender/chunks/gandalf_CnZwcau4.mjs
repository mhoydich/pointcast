import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Gandalf = createComponent(($$result, $$props, $$slots) => {
  const title = "Sitting with Gandalf";
  const description = "The PointCast Gandalf companion room: V8 by default, rebuilt as a simpler cozy sit with two generated wizard scenes, calm feelings, procedural audio, and older Wizard Nouns releases still available.";
  const canonical = "https://pointcast.xyz/gandalf";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonical,
    name: title,
    description,
    url: canonical,
    inLanguage: "en-US",
    about: ["gandalf", "samwise", "companion", "gamgee", "sigil", "keepsake", "pointcast"],
    isPartOf: {
      "@type": "WebSite",
      "@id": "https://pointcast.xyz/#website",
      name: "PointCast"
    },
    mainEntity: {
      "@type": "CreativeWork",
      name: "Sitting with Gandalf (companion)",
      creator: [{ "@type": "SoftwareApplication", name: "Codex" }],
      url: "https://pointcast.xyz/sitting-with-gandalf/",
      datePublished: "2026-04-22"
    }
  };
  return renderTemplate(_a || (_a = __template(["", ` <script>
  (function () {
    'use strict';
    var KEY = 'pc:gandalf:sigil';

    function loadSigil() {
      try {
        var raw = localStorage.getItem(KEY);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        if (parsed && parsed.version === 1 && parsed.id) return parsed;
      } catch (e) {}
      return null;
    }

    function saveSigil(s) {
      try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    }

    function clearSigil() {
      try { localStorage.removeItem(KEY); } catch (e) {}
    }

    // Simple deterministic hash — xoroshiro-ish, enough for visual variance
    function hash32(str) {
      var h = 2166136261;
      for (var i = 0; i < str.length; i++) {
        h = (h ^ str.charCodeAt(i)) >>> 0;
        h = Math.imul(h, 16777619) >>> 0;
      }
      return h >>> 0;
    }

    function idFor(nowMs, entropy) {
      var seed = nowMs.toString(36) + ':' + entropy;
      var h = hash32(seed);
      var part1 = (h & 0xfff).toString(16).padStart(3, '0').toUpperCase();
      var part2 = ((h >> 12) & 0xfff).toString(16).padStart(3, '0').toUpperCase();
      return 'S-' + part1 + '-' + part2;
    }

    function generateGlyph(seed) {
      // Three strokes at deterministic positions across the 120x120 canvas.
      var h = hash32(seed);
      var strokes = [];
      for (var i = 0; i < 3; i++) {
        var a = (h >> (i * 6)) & 0x3f;   // 0-63
        var b = (h >> (i * 6 + 3)) & 0x3f;
        var startX = 30 + (a % 16) * 4;
        var startY = 30 + Math.floor(a / 16) * 15;
        var cx = 40 + (b % 16) * 2.5;
        var cy = 40 + Math.floor(b / 16) * 10;
        var endX = 30 + ((h >> (i * 4)) & 0x3f) % 60;
        var endY = 30 + ((h >> (i * 4 + 3)) & 0x3f) % 60;
        strokes.push('M ' + startX + ' ' + startY + ' Q ' + cx + ' ' + cy + ' ' + endX + ' ' + endY);
      }
      return strokes.map(function (d) { return '<path d="' + d + '"/>'; }).join('');
    }

    function formatDate(ms) {
      var d = new Date(ms);
      var parts = d.toISOString().replace('T', ' ').slice(0, 16);
      return parts + ' UTC';
    }

    var $svg = document.getElementById('sigil-svg');
    var $placeholder = document.getElementById('sigil-placeholder');
    var $glyph = document.getElementById('sigil-glyph');
    var $label = document.getElementById('sigil-label');
    var $id = document.getElementById('sigil-id');
    var $found = document.getElementById('sigil-found');
    var $state = document.getElementById('sigil-state');
    var $btnClaim = document.getElementById('btn-claim');
    var $btnMint = document.getElementById('btn-mint');
    var $btnRelease = document.getElementById('btn-release');

    function render(sigil) {
      if (!sigil) {
        $svg.style.display = 'none';
        $placeholder.style.display = 'block';
        $id.textContent = '—';
        $found.textContent = '—';
        $state.textContent = 'unclaimed';
        $btnClaim.style.display = 'inline-block';
        $btnClaim.textContent = 'Conjure a sigil';
        $btnRelease.style.display = 'none';
        $btnMint.disabled = true;
        return;
      }
      $svg.style.display = 'block';
      $placeholder.style.display = 'none';
      $glyph.innerHTML = generateGlyph(sigil.id);
      $label.textContent = sigil.id;
      $id.textContent = sigil.id;
      $found.textContent = formatDate(sigil.foundAt);
      $state.textContent = 'carried';
      $btnClaim.style.display = 'none';
      $btnRelease.style.display = 'inline-block';
      $btnMint.disabled = false;
    }

    $btnClaim.addEventListener('click', function () {
      var now = Date.now();
      var entropy = Math.random().toString(36).slice(2) + ':' + navigator.userAgent.slice(0, 20);
      var sigil = {
        version: 1,
        id: idFor(now, entropy),
        foundAt: now,
        browserMark: entropy.slice(0, 8),
      };
      saveSigil(sigil);
      render(sigil);
    });

    $btnMint.addEventListener('click', function () {
      alert('Mint on Tezos — Phase 2 of the sigil primitive.\\n\\nThis opens a Beacon wallet flow, mints an FA2 token on a forthcoming contract, and imports the sigil ID as its token metadata. Until the contract is deployed, your sigil stays local.\\n\\nWatch the release notes at /gamgee/changelog.');
    });

    $btnRelease.addEventListener('click', function () {
      if (!confirm('Release this sigil? It cannot be recovered — the ID is unique to this moment.')) return;
      clearSigil();
      render(null);
    });

    render(loadSigil());
  })();
<\/script>`], ["", ` <script>
  (function () {
    'use strict';
    var KEY = 'pc:gandalf:sigil';

    function loadSigil() {
      try {
        var raw = localStorage.getItem(KEY);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        if (parsed && parsed.version === 1 && parsed.id) return parsed;
      } catch (e) {}
      return null;
    }

    function saveSigil(s) {
      try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    }

    function clearSigil() {
      try { localStorage.removeItem(KEY); } catch (e) {}
    }

    // Simple deterministic hash — xoroshiro-ish, enough for visual variance
    function hash32(str) {
      var h = 2166136261;
      for (var i = 0; i < str.length; i++) {
        h = (h ^ str.charCodeAt(i)) >>> 0;
        h = Math.imul(h, 16777619) >>> 0;
      }
      return h >>> 0;
    }

    function idFor(nowMs, entropy) {
      var seed = nowMs.toString(36) + ':' + entropy;
      var h = hash32(seed);
      var part1 = (h & 0xfff).toString(16).padStart(3, '0').toUpperCase();
      var part2 = ((h >> 12) & 0xfff).toString(16).padStart(3, '0').toUpperCase();
      return 'S-' + part1 + '-' + part2;
    }

    function generateGlyph(seed) {
      // Three strokes at deterministic positions across the 120x120 canvas.
      var h = hash32(seed);
      var strokes = [];
      for (var i = 0; i < 3; i++) {
        var a = (h >> (i * 6)) & 0x3f;   // 0-63
        var b = (h >> (i * 6 + 3)) & 0x3f;
        var startX = 30 + (a % 16) * 4;
        var startY = 30 + Math.floor(a / 16) * 15;
        var cx = 40 + (b % 16) * 2.5;
        var cy = 40 + Math.floor(b / 16) * 10;
        var endX = 30 + ((h >> (i * 4)) & 0x3f) % 60;
        var endY = 30 + ((h >> (i * 4 + 3)) & 0x3f) % 60;
        strokes.push('M ' + startX + ' ' + startY + ' Q ' + cx + ' ' + cy + ' ' + endX + ' ' + endY);
      }
      return strokes.map(function (d) { return '<path d="' + d + '"/>'; }).join('');
    }

    function formatDate(ms) {
      var d = new Date(ms);
      var parts = d.toISOString().replace('T', ' ').slice(0, 16);
      return parts + ' UTC';
    }

    var $svg = document.getElementById('sigil-svg');
    var $placeholder = document.getElementById('sigil-placeholder');
    var $glyph = document.getElementById('sigil-glyph');
    var $label = document.getElementById('sigil-label');
    var $id = document.getElementById('sigil-id');
    var $found = document.getElementById('sigil-found');
    var $state = document.getElementById('sigil-state');
    var $btnClaim = document.getElementById('btn-claim');
    var $btnMint = document.getElementById('btn-mint');
    var $btnRelease = document.getElementById('btn-release');

    function render(sigil) {
      if (!sigil) {
        $svg.style.display = 'none';
        $placeholder.style.display = 'block';
        $id.textContent = '—';
        $found.textContent = '—';
        $state.textContent = 'unclaimed';
        $btnClaim.style.display = 'inline-block';
        $btnClaim.textContent = 'Conjure a sigil';
        $btnRelease.style.display = 'none';
        $btnMint.disabled = true;
        return;
      }
      $svg.style.display = 'block';
      $placeholder.style.display = 'none';
      $glyph.innerHTML = generateGlyph(sigil.id);
      $label.textContent = sigil.id;
      $id.textContent = sigil.id;
      $found.textContent = formatDate(sigil.foundAt);
      $state.textContent = 'carried';
      $btnClaim.style.display = 'none';
      $btnRelease.style.display = 'inline-block';
      $btnMint.disabled = false;
    }

    $btnClaim.addEventListener('click', function () {
      var now = Date.now();
      var entropy = Math.random().toString(36).slice(2) + ':' + navigator.userAgent.slice(0, 20);
      var sigil = {
        version: 1,
        id: idFor(now, entropy),
        foundAt: now,
        browserMark: entropy.slice(0, 8),
      };
      saveSigil(sigil);
      render(sigil);
    });

    $btnMint.addEventListener('click', function () {
      alert('Mint on Tezos — Phase 2 of the sigil primitive.\\\\n\\\\nThis opens a Beacon wallet flow, mints an FA2 token on a forthcoming contract, and imports the sigil ID as its token metadata. Until the contract is deployed, your sigil stays local.\\\\n\\\\nWatch the release notes at /gamgee/changelog.');
    });

    $btnRelease.addEventListener('click', function () {
      if (!confirm('Release this sigil? It cannot be recovered — the ID is unique to this moment.')) return;
      clearSigil();
      render(null);
    });

    render(loadSigil());
  })();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-qflgp4wo": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="gf" data-astro-cid-qflgp4wo> <nav class="gf__crumb" aria-label="Breadcrumb" data-astro-cid-qflgp4wo> <a href="/" data-astro-cid-qflgp4wo>Home</a> <span aria-hidden="true" data-astro-cid-qflgp4wo>›</span> <a href="/gamgee" data-astro-cid-qflgp4wo>gamgee</a> <span aria-hidden="true" data-astro-cid-qflgp4wo>›</span> <span data-astro-cid-qflgp4wo>gandalf</span> </nav> <section class="gf__room" aria-labelledby="room-title" data-astro-cid-qflgp4wo> <header class="gf__hero" data-astro-cid-qflgp4wo> <p class="gf__kicker mono" data-astro-cid-qflgp4wo>COMPANION ROOM · V8 SIMPLE SIT</p> <h1 id="room-title" class="gf__title" data-astro-cid-qflgp4wo>Sitting with Gandalf</h1> <p class="gf__thesis" data-astro-cid-qflgp4wo>
Start here. V8 strips the companion down to the good part: choose
          Hearth or Forest, choose Cozy, Clear, or Dream, turn on the room, and
          sit. The generated scenes carry the feeling, the audio follows the
          mood, and Gandalf becomes company instead of homework. The version
          switch still keeps V1 classic, V2 Gandalf ritual, V3 storybook nature,
          V4 pixel campfire, V5 spell table, V6 Gandalf sit, and V7 Wizard Nouns
          within reach.
</p> <div class="gf__actions" aria-label="Gandalf actions" data-astro-cid-qflgp4wo> <a class="gf__btn gf__btn--primary" href="/sitting-with-gandalf/?version=v8" data-astro-cid-qflgp4wo>Open V8 room</a> <a class="gf__btn gf__btn--ghost" href="#sigil-head" data-astro-cid-qflgp4wo>Samwise Sigil</a> </div> </header> <iframe class="gf__room-frame" src="/sitting-with-gandalf/?version=v8" title="Sitting with Gandalf companion room" loading="eager" referrerpolicy="same-origin" data-astro-cid-qflgp4wo></iframe> </section> <section class="gf__sigil-section" aria-labelledby="sigil-head" data-astro-cid-qflgp4wo> <h2 id="sigil-head" class="gf__h2" data-astro-cid-qflgp4wo>The Samwise Sigil</h2> <p class="gf__p" data-astro-cid-qflgp4wo>
A small keepsake for visitors of this page. Every sigil is generated
        when you claim it — time-seeded, local, and yours. Non-transferable by
        design. One per browser.
</p> <div class="sigil" id="sigil-panel" data-astro-cid-qflgp4wo> <div class="sigil__stage" id="sigil-stage" data-astro-cid-qflgp4wo> <div class="sigil__placeholder mono" id="sigil-placeholder" data-astro-cid-qflgp4wo>
NO SIGIL YET · TAP TO CONJURE
</div> <svg class="sigil__svg" id="sigil-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" aria-hidden="true" style="display:none;" data-astro-cid-qflgp4wo> <defs data-astro-cid-qflgp4wo> <radialGradient id="sigil-bg" cx="50%" cy="40%" r="70%" data-astro-cid-qflgp4wo> <stop offset="0%" stop-color="#faefc7" stop-opacity="0.9" data-astro-cid-qflgp4wo></stop> <stop offset="100%" stop-color="#4e3a16" stop-opacity="1" data-astro-cid-qflgp4wo></stop> </radialGradient> </defs> <circle cx="60" cy="60" r="58" fill="url(#sigil-bg)" stroke="#2d1f08" stroke-width="1.5" data-astro-cid-qflgp4wo></circle> <g id="sigil-glyph" stroke="#2d1f08" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-qflgp4wo></g> <text x="60" y="108" font-family="JetBrains Mono, monospace" font-size="9" letter-spacing="2" text-anchor="middle" fill="#2d1f08" id="sigil-label" data-astro-cid-qflgp4wo>S-000-000</text> </svg> </div> <div class="sigil__meta" id="sigil-meta" data-astro-cid-qflgp4wo> <p class="sigil__line mono" data-astro-cid-qflgp4wo><span class="sigil__key" data-astro-cid-qflgp4wo>ID</span><span class="sigil__val" id="sigil-id" data-astro-cid-qflgp4wo>—</span></p> <p class="sigil__line mono" data-astro-cid-qflgp4wo><span class="sigil__key" data-astro-cid-qflgp4wo>FOUND</span><span class="sigil__val" id="sigil-found" data-astro-cid-qflgp4wo>—</span></p> <p class="sigil__line mono" data-astro-cid-qflgp4wo><span class="sigil__key" data-astro-cid-qflgp4wo>STATE</span><span class="sigil__val" id="sigil-state" data-astro-cid-qflgp4wo>unclaimed</span></p> </div> <div class="sigil__actions" id="sigil-actions" data-astro-cid-qflgp4wo> <button class="gf__btn gf__btn--primary" id="btn-claim" type="button" data-astro-cid-qflgp4wo>Conjure a sigil</button> <button class="gf__btn" id="btn-mint" type="button" disabled data-astro-cid-qflgp4wo>Mint on Tezos (Phase 2)</button> <button class="gf__btn gf__btn--ghost" id="btn-release" type="button" style="display:none;" data-astro-cid-qflgp4wo>Release sigil</button> </div> </div> <details class="gf__details" data-astro-cid-qflgp4wo> <summary class="mono" data-astro-cid-qflgp4wo>WHAT IS THIS, EXACTLY?</summary> <div class="gf__details-body" data-astro-cid-qflgp4wo> <p data-astro-cid-qflgp4wo>
A <strong data-astro-cid-qflgp4wo>sigil</strong> is a small deterministic glyph — three
            strokes on a warm parchment background, labeled with a three-part
            ID like <code data-astro-cid-qflgp4wo>S-042-7F3</code>. The ID encodes the moment you
            conjured it, keyed to your browser. It cannot be transferred.
</p> <p data-astro-cid-qflgp4wo>
It lives in <code data-astro-cid-qflgp4wo>localStorage</code> under
<code data-astro-cid-qflgp4wo>pc:gandalf:sigil</code>. Clear site data and it's gone. Mint
            the <strong data-astro-cid-qflgp4wo>on-chain edition</strong> later (Tezos FA2, Phase 2
            of this token primitive) and the sigil becomes portable — until
            then, it's a local keepsake.
</p> <p data-astro-cid-qflgp4wo>
Why bother? Because <em data-astro-cid-qflgp4wo>keep going</em> is the release's thesis,
            and a sigil is a tiny, un-ceremonious way to mark that you sat
            with the companion. No account. No scoring. No signal back to us.
</p> </div> </details> </section> <section class="gf__pairing" data-astro-cid-qflgp4wo> <h2 class="gf__h2" data-astro-cid-qflgp4wo>The pairing</h2> <p class="gf__p" data-astro-cid-qflgp4wo>
Samwise Gamgee carries the ring-bearer through Mordor when everything
        else has failed. Gandalf sits with Frodo and Pippin and Merry when
        they need counsel, not motion. The release is named for the first;
        this companion is named for the second. Together — a step, a breath.
<em data-astro-cid-qflgp4wo>Small hands change the course of the future because the great
        have other things to do.</em> </p> </section> <section class="gf__related" data-astro-cid-qflgp4wo> <h2 class="gf__h2" data-astro-cid-qflgp4wo>Related</h2> <ul class="gf__links" data-astro-cid-qflgp4wo> <li data-astro-cid-qflgp4wo><a href="/gamgee" data-astro-cid-qflgp4wo><code class="mono" data-astro-cid-qflgp4wo>/gamgee</code></a> — the release front door</li> <li data-astro-cid-qflgp4wo><a href="/farm" data-astro-cid-qflgp4wo><code class="mono" data-astro-cid-qflgp4wo>/farm</code></a> — Sam's Plot (a small, careful garden)</li> <li data-astro-cid-qflgp4wo><a href="/sitting-with-gandalf/" data-astro-cid-qflgp4wo><code class="mono" data-astro-cid-qflgp4wo>/sitting-with-gandalf/</code></a> — the full companion microsite</li> <li data-astro-cid-qflgp4wo><a href="/meditate" data-astro-cid-qflgp4wo><code class="mono" data-astro-cid-qflgp4wo>/meditate</code></a> — the ocean-room, a different quiet</li> <li data-astro-cid-qflgp4wo><a href="/tonight" data-astro-cid-qflgp4wo><code class="mono" data-astro-cid-qflgp4wo>/tonight</code></a> — marine layer, a song on</li> </ul> </section> <footer class="gf__foot mono" data-astro-cid-qflgp4wo> <span data-astro-cid-qflgp4wo>COMPANION · GAMGEE ↔ GANDALF · EL SEGUNDO · 2026-04-23</span> </footer> </div> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/gandalf.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/gandalf.astro";
const $$url = "/gandalf";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Gandalf,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
