import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { S as SPELLS, $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Spells = createComponent(($$result, $$props, $$slots) => {
  const byKind = {
    burst: SPELLS.filter((s) => s.kind === "burst"),
    companion: SPELLS.filter((s) => s.kind === "companion"),
    ambient: SPELLS.filter((s) => s.kind === "ambient")
  };
  const kindLabel = {
    burst: "BURSTS",
    companion: "COMPANIONS",
    ambient: "AMBIENT"
  };
  const kindBlurb = {
    burst: "One-shot — spawns, delights, self-cleans.",
    companion: "Small creatures that cross the screen, then wander off.",
    ambient: "Persistent — stays until you clear it."
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/spells",
    name: "PointCast Spells — Magic Words",
    description: "Every magic word in the PointCast dock. Type +spell in the omnibox or click Cast.",
    url: "https://pointcast.xyz/spells",
    hasPart: SPELLS.map((s) => ({
      "@type": "Thing",
      name: s.label,
      description: s.blurb,
      identifier: s.id
    }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Spells — Magic Words", "description": "Every magic word in the PointCast dock. Type +spell in the omnibox or click a chip in slot 06 CAST.", "jsonLd": jsonLd, "data-astro-cid-lerju5hz": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="pg" data-astro-cid-lerju5hz> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-lerju5hz> <a href="/" data-astro-cid-lerju5hz>Home</a> <span aria-hidden="true" data-astro-cid-lerju5hz>›</span> <span data-astro-cid-lerju5hz>spells</span> </nav> <header class="head" data-astro-cid-lerju5hz> <p class="kicker" data-astro-cid-lerju5hz>06 CAST · MAGIC WORDS · v1</p> <h1 class="display" data-astro-cid-lerju5hz>Spells.</h1> <p class="dek" data-astro-cid-lerju5hz>\nType <code data-astro-cid-lerju5hz>+spell</code> in the omnibox, or click a chip in slot&nbsp;06&nbsp;CAST.\n', ' magic words, three kinds.\n</p> <div class="head-actions" data-astro-cid-lerju5hz> <button class="btn btn--clear" id="js-clear-all" type="button" data-astro-cid-lerju5hz>🌪 clear all</button> <button class="btn btn--cast-all" id="js-cast-all" type="button" data-astro-cid-lerju5hz>✨ cast everything</button> </div> </header> ', ` <footer class="pg-footer" data-astro-cid-lerju5hz> <p class="pg-footer__note" data-astro-cid-lerju5hz>
Type <code data-astro-cid-lerju5hz>+spellname</code> in the omnibox anywhere on PointCast.
        Spells stack — cast as many as you like. Clear with the tray&rsquo;s
        ✕ or <code data-astro-cid-lerju5hz>pc:spell:clear</code>.
</p> <p class="pg-footer__note" data-astro-cid-lerju5hz>
Studied in <a href="/ues/track-05#week-2" data-astro-cid-lerju5hz>UES Track 05 · Week 2 — Spells, not Buttons</a>.
</p> <p class="pg-footer__note" data-astro-cid-lerju5hz> <a href="/cast" data-astro-cid-lerju5hz>Prize Cast →</a>
&nbsp;·&nbsp;
<a href="/" data-astro-cid-lerju5hz>Home →</a> </p> </footer> </div> <script>
    (function () {
      'use strict';

      function dispatch(id) {
        document.dispatchEvent(new CustomEvent('pc:spell:cast', { detail: { id: id } }));
      }

      document.addEventListener('click', function (e) {
        var t = e.target;

        // cast button
        var castId = t.closest('[data-cast]') && t.closest('[data-cast]').dataset.cast;
        if (castId) {
          dispatch(castId);
          return;
        }

        // copy button
        var copyEl = t.closest('[data-copy]');
        if (copyEl) {
          var id = copyEl.dataset.copy;
          var text = '+' + id;
          try {
            navigator.clipboard.writeText(text).then(function () {
              copyEl.textContent = '✓ copied';
              setTimeout(function () { copyEl.textContent = 'copy'; }, 1800);
            });
          } catch (_) {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            copyEl.textContent = '✓ copied';
            setTimeout(function () { copyEl.textContent = 'copy'; }, 1800);
          }
          return;
        }

        // clear all
        if (t.closest('#js-clear-all')) {
          document.dispatchEvent(new CustomEvent('pc:spell:clear'));
          return;
        }

        // cast everything — stagger 250ms apart
        if (t.closest('#js-cast-all')) {
          var ids = Array.from(document.querySelectorAll('[data-cast]')).map(function (el) {
            return el.dataset.cast;
          });
          ids.forEach(function (id, i) {
            setTimeout(function () { dispatch(id); }, i * 250);
          });
          return;
        }
      });
    })();
  <\/script> `])), maybeRenderHead(), SPELLS.length, ["burst", "companion", "ambient"].map((kind) => renderTemplate`<section class="section"${addAttribute(kindLabel[kind], "aria-label")} data-astro-cid-lerju5hz> <div class="section-head" data-astro-cid-lerju5hz> <p class="section-kicker" data-astro-cid-lerju5hz>${kindLabel[kind]}</p> <p class="section-note" data-astro-cid-lerju5hz>${kindBlurb[kind]}</p> </div> <div class="grid" role="list" data-astro-cid-lerju5hz> ${byKind[kind].map((spell) => renderTemplate`<article class="card"${addAttribute(spell.id, "id")} role="listitem"${addAttribute(`--accent: ${spell.accent}`, "style")}${addAttribute(spell.id, "data-spell-id")} data-astro-cid-lerju5hz> <div class="card-top" data-astro-cid-lerju5hz> <span class="glyph" aria-hidden="true" data-astro-cid-lerju5hz>${spell.glyph}</span> <div class="card-meta" data-astro-cid-lerju5hz> <p class="spell-id mono" data-astro-cid-lerju5hz>+${spell.id}</p> <span${addAttribute(`pill pill--${kind}`, "class")} data-astro-cid-lerju5hz>${kind}${spell.durationMs ? ` · ${(spell.durationMs / 1e3).toFixed(0)}s` : ""}</span> </div> </div> <p class="blurb" data-astro-cid-lerju5hz>${spell.blurb}</p> <div class="card-actions" data-astro-cid-lerju5hz> <button class="btn btn--cast" type="button"${addAttribute(spell.id, "data-cast")}${addAttribute(`Cast ${spell.label}`, "aria-label")} data-astro-cid-lerju5hz>cast</button> <button class="btn btn--copy" type="button"${addAttribute(spell.id, "data-copy")}${addAttribute(`Copy +${spell.id} to clipboard`, "aria-label")} data-astro-cid-lerju5hz>copy</button> </div> </article>`)} </div> </section>`)) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/spells.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/spells.astro";
const $$url = "/spells";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Spells,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
