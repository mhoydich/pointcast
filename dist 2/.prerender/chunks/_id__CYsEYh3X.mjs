import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, d as defineScriptVars, b as addAttribute, u as unescapeHTML, F as Fragment, k as renderTransition, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$SparrowLayout } from './SparrowLayout_VSvjr4EN.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { g as getChannel } from './channels_C2qW9mSV.mjs';
/* empty css                          */

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
async function getStaticPaths() {
  const blocks = await getCollection("blocks", ({ data }) => !data.draft);
  return blocks.map((b) => ({ params: { id: b.data.id } }));
}
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  const all = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const idx = all.findIndex((b) => b.data.id === id);
  if (idx < 0) {
    return Astro2.redirect("/sparrow");
  }
  const block = all[idx];
  const prev = all[idx - 1];
  const next = all[idx + 1];
  const ch = getChannel(block.data.channel);
  const fmtDate = (d) => d.toISOString().slice(0, 10).replaceAll("-", ".");
  const bodyParas = (block.data.body ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const companionRecords = (block.data.companions ?? []).map((c) => {
    const ref = c.refId || c.id || "";
    const match = all.find((b) => b.data.id === ref);
    return {
      id: ref,
      title: match?.data.title ?? ref,
      channel: match?.data.channel ?? c.channel ?? null,
      note: c.note ?? null
    };
  });
  function renderInlineCode(s) {
    return s.replace(/`([^`]+)`/g, "<code>$1</code>");
  }
  return renderTemplate`${renderComponent($$result, "SparrowLayout", $$SparrowLayout, { "title": `№ ${block.data.id} — ${block.data.title}`, "description": block.data.dek ?? block.data.title, "canonicalPath": `/sparrow/b/${block.data.id}`, "homeHref": "/sparrow" }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="sp-reading-progress" aria-hidden="true"><div class="sp-reading-progress__bar"></div></div> <article class="sp-reader"', "", '> <div class="sp-article"> <header class="sp-article-head"', '> <div class="sp-article-meta"> <span class="sp-r-stamp" aria-hidden="true"> <span class="sp-r-stamp__ch">', '</span> <span class="sp-r-stamp__type">', '</span> </span> <span class="sp-r-id">№ ', "</span> <span>·</span> <time", ">", "</time> ", " <span>·</span> <span>by <code>", "</code></span> ", ' </div> <h1 class="sp-article-title">', "</h1> ", ' </header> <div class="sp-article-body"> ', " ", ' </div>  <div class="sp-reactions" data-sp-reactions', ' aria-label="reactions"> <div class="sp-reactions-head"> <span class="sp-reactions-kicker">✦ react</span> <span class="sp-nostr-status" data-sp-nostr-status data-state="unknown"> <span class="sp-nostr-dot" aria-hidden="true"></span> <span class="sp-nostr-label" data-sp-nostr-label>local only</span> </span> <button type="button" class="sp-nostr-connect" data-sp-nostr-connect hidden>connect signer →</button> </div> <div class="sp-reactions-row"> <button type="button" class="sp-react sp-react--ember" data-sp-react="ember" aria-pressed="false"> <span class="sp-react-glyph" aria-hidden="true">🔥</span> <span class="sp-react-label">lit</span> </button> <button type="button" class="sp-react sp-react--moss" data-sp-react="moss" aria-pressed="false"> <span class="sp-react-glyph" aria-hidden="true">🌿</span> <span class="sp-react-label">evergreen</span> </button> <button type="button" class="sp-react sp-react--lilac" data-sp-react="lilac" aria-pressed="false"> <span class="sp-react-glyph" aria-hidden="true">💜</span> <span class="sp-react-label">rare</span> </button> </div> <p class="sp-reactions-hint" data-sp-reactions-hint>\nPicks stay on this device until a Nostr signer is connected. With\n          a NIP-07 extension (Alby, nos2x, Flamingo) active, each pick\n          fans out as a kind-7 event keyed off\n<code>https://pointcast.xyz/b/', '</code>.\n</p> </div>  <details class="sp-compose" data-sp-compose', "", '> <summary class="sp-compose-summary"> <span class="sp-compose-glyph" aria-hidden="true">✎</span> <span class="sp-compose-label">reply via PointCast</span> <span class="sp-compose-hint">→ drafts a new block in CH.', '</span> </summary> <div class="sp-compose-body"> <div class="sp-compose-row"> <label class="sp-compose-field"> <span>subject <em>optional</em></span> <input type="text" name="subject" maxlength="120" data-sp-compose-subject', ` autocomplete="off"> </label> </div> <div class="sp-compose-row"> <label class="sp-compose-field"> <span>body</span> <textarea name="body" rows="5" maxlength="3800" data-sp-compose-body placeholder="A few sentences. Markdown, links, quotes — all welcome. Lands in PointCast's inbox tagged with this block as context." required></textarea> </label> </div> <div class="sp-compose-row sp-compose-meta"> <span class="sp-compose-chip"> <span class="sp-compose-chip-k">channel</span> <code>`, '</code> </span> <span class="sp-compose-chip"> <span class="sp-compose-chip-k">type</span> <code>NOTE</code> </span> <span class="sp-compose-chip"> <span class="sp-compose-chip-k">ref</span> <code>/b/', `</code> </span> <span class="sp-compose-counter" data-sp-compose-counter>0 / 3800</span> </div> <div class="sp-compose-row sp-compose-bridge" data-sp-magpie-bridge hidden> <div class="sp-bridge-head"> <span class="sp-bridge-pill" data-sp-magpie-pill data-state="unknown"> <span class="sp-bridge-dot" aria-hidden="true"></span> <span data-sp-magpie-label>magpie · checking</span> </span> <a class="sp-bridge-cta" href="/magpie" data-sp-magpie-cta target="_blank" rel="noopener">compose in magpie →</a> </div> <fieldset class="sp-bridge-dests" data-sp-magpie-dests aria-label="destinations for this reply"> <legend class="sr-only">destinations</legend>  <label class="sp-bridge-dest is-ready is-locked" data-sp-dest="pointcast"> <input type="checkbox" checked disabled data-sp-dest-input="pointcast"> <span class="sp-bridge-dest-code">PC</span> <span class="sp-bridge-dest-name">PointCast</span> <span class="sp-bridge-dest-state">canonical</span> </label> </fieldset> <p class="sp-bridge-note" data-sp-magpie-note>
Tick any extra destinations and Sparrow POSTs to Magpie's
<code>/compose</code> endpoint (clip-less broadcast, coming
              from the Magpie side). If Magpie can't take the payload,
              the reply still lands in PointCast via the direct
<code>/api/ping</code> path.
</p> </div> <div class="sp-compose-row sp-compose-actions"> <button type="button" class="sp-compose-submit" data-sp-compose-submit>
Post reply →
</button> <span class="sp-compose-result" data-sp-compose-result aria-live="polite"></span> </div> <p class="sp-compose-foot">
Lands in <code>https://pointcast.xyz/api/ping</code> as a <code>pc-ping-v1</code> draft
            with <code>expand=true</code>; cc stages a full block on its next tick.
</p> </div> </details> <footer class="sp-article-foot"> `, " ", ' </footer> </div> <aside class="sp-aside" aria-label="block meta"> <div class="sp-aside-box"', "> <h3>✦ channel</h3> <a", ' class="sp-link" style="font-family: var(--sp-display); font-size: 18px;"> ', " · ", ' </a> <p class="sp-aside-mono" style="margin-top: 8px;">', '</p> </div> <div class="sp-aside-box"> <h3>✦ save</h3> <button type="button" class="sp-save-btn"', ' aria-pressed="false">\n☆ add to reading list\n</button> <p class="sp-aside-mono" style="margin-top: 10px;">\nalso: press <kbd>S</kbd> anywhere in Sparrow.\n</p> </div> ', " ", ' <div class="sp-aside-box"> <h3>✦ canonical</h3> <a', ' class="sp-link">/b/', `</a> <p class="sp-aside-mono" style="margin-top: 8px;">
the full pointcast render, outside sparrow's chrome.
</p> </div> </aside> </article> <aside class="sp-beacon" aria-label="back to reel"> <span class="sp-beacon-sweep" aria-hidden="true"></span> <span class="sp-beacon-kicker">✦ reel</span> <span class="sp-beacon-body"> <kbd>J</kbd> older · <kbd>K</kbd> newer · <kbd>S</kbd> save · <kbd>⌘K</kbd> jump
</span> <a href="/sparrow" class="sp-link sp-beacon-cta">back to reel →</a> </aside> <script>(function(){`, "\n    (() => {\n      // On the reader, J/K nav to next/prev block. The layout's J/K\n      // focus-receipt handler is a no-op here (no receipts present),\n      // so this listener takes over cleanly.\n      document.addEventListener('keydown', (e) => {\n        const inField =\n          ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) ||\n          e.target?.isContentEditable;\n        if (inField) return;\n        const k = e.key.toLowerCase();\n        if (k === 'j' && nextUrl) { e.preventDefault(); window.location.href = nextUrl; }\n        else if (k === 'k' && prevUrl) { e.preventDefault(); window.location.href = prevUrl; }\n      });\n\n      // v0.5: idle prefetch of neighboring readers so K/J paging is\n      // instant (combines with the SW cache-first runtime strategy).\n      const prefetch = (url) => {\n        if (!url) return;\n        const link = document.createElement('link');\n        link.rel = 'prefetch';\n        link.as = 'document';\n        link.href = url;\n        document.head.appendChild(link);\n      };\n      const queueIdle = (fn) => {\n        if ('requestIdleCallback' in window) {\n          requestIdleCallback(fn, { timeout: 2000 });\n        } else {\n          setTimeout(fn, 600);\n        }\n      };\n      queueIdle(() => {\n        prefetch(prevUrl);\n        prefetch(nextUrl);\n      });\n    })();\n  })();<\/script> "])), maybeRenderHead(), addAttribute(block.data.id, "data-sp-block-id"), addAttribute(`--ch: var(--ch-${block.data.channel.toLowerCase()});`, "style"), addAttribute(renderTransition($$result2, "4boumiuz", "", `b-${block.data.id}`), "data-astro-transition-scope"), block.data.channel, block.data.type, block.data.id, addAttribute(block.data.timestamp.toISOString(), "datetime"), fmtDate(block.data.timestamp), block.data.readingTime && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <span>·</span> <span>${block.data.readingTime}</span> ` })}`, block.data.author, block.data.mood && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <span>·</span> <span>mood <code>${block.data.mood}</code></span> ` })}`, block.data.title, block.data.dek && renderTemplate`<p class="sp-article-dek">${block.data.dek}</p>`, bodyParas.length === 0 && renderTemplate`<p class="sp-aside-mono">
This block doesn't carry a body on Sparrow — it lives as a card.
            Open <a class="sp-link"${addAttribute(`/b/${block.data.id}`, "href")}>the canonical block</a> for the
            full render.
</p>`, bodyParas.map((p) => renderTemplate`<p>${unescapeHTML(renderInlineCode(p))}</p>`), addAttribute(block.data.id, "data-sp-block-id"), block.data.id, addAttribute(block.data.id, "data-sp-block-id"), addAttribute(block.data.channel, "data-sp-channel"), block.data.channel, addAttribute(`Re: ${block.data.title.slice(0, 60)}`, "placeholder"), block.data.channel, block.data.id, prev && renderTemplate`<a class="sp-nav-btn"${addAttribute(`/sparrow/b/${prev.data.id}`, "href")}>
← <kbd>K</kbd> newer · № ${prev.data.id} </a>`, next && renderTemplate`<a class="sp-nav-btn"${addAttribute(`/sparrow/b/${next.data.id}`, "href")} style="margin-left: auto;">
older · № ${next.data.id} <kbd>J</kbd> →
</a>`, addAttribute(`border-color: color-mix(in oklch, var(--ch) 50%, var(--sp-rule));`, "style"), addAttribute(`/sparrow/ch/${ch?.slug}`, "href"), block.data.channel, ch?.name, ch?.purpose, addAttribute(block.data.id, "data-sp-save"), companionRecords.length > 0 && renderTemplate`<div class="sp-aside-box"> <h3>✦ companions</h3> <ul class="sp-aside-list"> ${companionRecords.map((c) => renderTemplate`<li> <a${addAttribute(`/sparrow/b/${c.id}`, "href")}> ${c.title} ${c.channel && renderTemplate`<span class="sp-aside-mono" style="display: block; margin-top: 2px;">${c.channel}</span>`} </a> </li>`)} </ul> </div>`, block.data.external && renderTemplate`<div class="sp-aside-box"> <h3>✦ external</h3> <a${addAttribute(block.data.external.url, "href")} class="sp-link" target="_blank" rel="noopener"> ${block.data.external.label} →
</a> </div>`, addAttribute(`/b/${block.data.id}`, "href"), block.data.id, defineScriptVars({
    prevUrl: prev ? `/sparrow/b/${prev.data.id}` : null,
    nextUrl: next ? `/sparrow/b/${next.data.id}` : null
  })) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sparrow/b/[id].astro", "self");

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sparrow/b/[id].astro";
const $$url = "/sparrow/b/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
