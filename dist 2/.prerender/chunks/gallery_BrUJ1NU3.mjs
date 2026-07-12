import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, F as Fragment, u as unescapeHTML, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Gallery = createComponent(async ($$result, $$props, $$slots) => {
  const entries = (await getCollection("gallery", ({ data }) => !data.draft)).sort((a, b) => b.data.createdAt.getTime() - a.data.createdAt.getTime());
  const title = "Gallery — Midjourney + AI-art slideshow";
  const description = "A viewing experience for Midjourney + AI-art pieces on PointCast. Grid → lightbox → arrows/swipe to navigate → autoplay 6s/frame. Seeded with CC0 Nouns while Mike adds MJ entries.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: "PointCast Gallery",
    description,
    url: "https://pointcast.xyz/gallery",
    associatedMedia: entries.map((e) => ({
      "@type": "ImageObject",
      contentUrl: e.data.imageUrl,
      name: e.data.title,
      dateCreated: e.data.createdAt.toISOString(),
      creator: e.data.author
    }))
  };
  const toolCounts = {};
  for (const e of entries) toolCounts[e.data.tool] = (toolCounts[e.data.tool] || 0) + 1;
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-sahthylw": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="page" data-astro-cid-sahthylw> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-sahthylw> <a href="/" data-astro-cid-sahthylw>Home</a> <span aria-hidden="true" data-astro-cid-sahthylw>›</span> <span data-astro-cid-sahthylw>gallery</span> </nav> <header class="head" data-astro-cid-sahthylw> <p class="kicker mono" data-astro-cid-sahthylw>GALLERY · MIDJOURNEY + AI-ART</p> <h1 class="title" data-astro-cid-sahthylw>A viewing room.</h1> <p class="dek" data-astro-cid-sahthylw>
Tap any image to open the lightbox — arrow keys or swipe to navigate,
        ESC or tap the backdrop to close, press <code data-astro-cid-sahthylw>a</code> or tap ▶ to
        autoplay (6s/frame). ${entries.length} piece${entries.length === 1 ? "" : "s"} in the room.
        Add your own: <a href="/drop" data-astro-cid-sahthylw>drop</a> a Midjourney URL or commit a
        JSON to <code data-astro-cid-sahthylw>src/content/gallery/</code>.
</p> </header> ${entries.length === 0 ? renderTemplate`<section class="empty" data-astro-cid-sahthylw> <p data-astro-cid-sahthylw>No gallery entries yet. <a href="/drop" data-astro-cid-sahthylw>Drop</a> an image URL or see <code data-astro-cid-sahthylw>src/content/gallery/_README.md</code>.</p> </section>` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-sahthylw": true }, { "default": async ($$result3) => renderTemplate(_a || (_a = __template([' <section class="grid" id="gallery-grid" aria-label="Image grid" data-astro-cid-sahthylw> ', ' </section> <div class="lightbox" id="lightbox" hidden role="dialog" aria-modal="true" aria-label="Image viewer" data-astro-cid-sahthylw> <button type="button" class="lightbox__close" id="lb-close" aria-label="Close" data-astro-cid-sahthylw>✕</button> <button type="button" class="lightbox__nav lightbox__nav--prev" id="lb-prev" aria-label="Previous image" data-astro-cid-sahthylw>‹</button> <button type="button" class="lightbox__nav lightbox__nav--next" id="lb-next" aria-label="Next image" data-astro-cid-sahthylw>›</button> <div class="lightbox__stage" data-astro-cid-sahthylw> <img class="lightbox__img" id="lb-img" src="" alt="" data-astro-cid-sahthylw> <div class="lightbox__caption" id="lb-caption" data-astro-cid-sahthylw> <p class="lightbox__title" id="lb-title" data-astro-cid-sahthylw></p> <p class="lightbox__meta mono" id="lb-meta" data-astro-cid-sahthylw></p> <p class="lightbox__source" id="lb-source" data-astro-cid-sahthylw></p> </div> </div> <div class="lightbox__controls" data-astro-cid-sahthylw> <button type="button" class="lb-btn" id="lb-play" aria-label="Toggle autoplay" data-astro-cid-sahthylw>▶ AUTO 6s</button> <span class="lb-counter mono" id="lb-counter" data-astro-cid-sahthylw>—</span> </div> </div> <script type="application/json" id="gallery-data">', "<\/script> <script>\n          (function () {\n            const dataEl = document.getElementById('gallery-data');\n            if (!dataEl) return;\n            const entries = JSON.parse(dataEl.textContent || '[]');\n            const lb = document.getElementById('lightbox');\n            const img = document.getElementById('lb-img');\n            const titleEl = document.getElementById('lb-title');\n            const metaEl = document.getElementById('lb-meta');\n            const sourceEl = document.getElementById('lb-source');\n            const counterEl = document.getElementById('lb-counter');\n            const playBtn = document.getElementById('lb-play');\n\n            let current = 0;\n            let autoplay = false;\n            let autoplayTimer = null;\n\n            function paint() {\n              const e = entries[current];\n              if (!e) return;\n              img.src = e.imageUrl;\n              img.alt = e.title;\n              titleEl.textContent = e.title;\n              const metaBits = [e.tool.toUpperCase()];\n              if (e.mood) metaBits.push(e.mood);\n              if (e.createdAt) metaBits.push(e.createdAt);\n              metaEl.textContent = metaBits.join(' · ');\n              sourceEl.textContent = e.promptSummary || '';\n              counterEl.textContent = (current + 1) + ' / ' + entries.length;\n            }\n\n            function open(i) {\n              current = ((i % entries.length) + entries.length) % entries.length;\n              paint();\n              lb.hidden = false;\n              document.body.style.overflow = 'hidden';\n            }\n\n            function close() {\n              lb.hidden = true;\n              document.body.style.overflow = '';\n              stopAutoplay();\n            }\n\n            function next() { current = (current + 1) % entries.length; paint(); }\n            function prev() { current = (current - 1 + entries.length) % entries.length; paint(); }\n\n            function startAutoplay() {\n              autoplay = true;\n              playBtn.textContent = '❚❚ PAUSE';\n              playBtn.setAttribute('aria-pressed', 'true');\n              autoplayTimer = setInterval(next, 6000);\n            }\n            function stopAutoplay() {\n              autoplay = false;\n              playBtn.textContent = '▶ AUTO 6s';\n              playBtn.setAttribute('aria-pressed', 'false');\n              if (autoplayTimer) clearInterval(autoplayTimer);\n              autoplayTimer = null;\n            }\n\n            document.querySelectorAll('.tile[data-index]').forEach((el) => {\n              el.addEventListener('click', () => open(parseInt(el.getAttribute('data-index') || '0', 10)));\n            });\n            document.getElementById('lb-close').addEventListener('click', close);\n            document.getElementById('lb-prev').addEventListener('click', () => { stopAutoplay(); prev(); });\n            document.getElementById('lb-next').addEventListener('click', () => { stopAutoplay(); next(); });\n            playBtn.addEventListener('click', () => { if (autoplay) stopAutoplay(); else startAutoplay(); });\n\n            // Backdrop close\n            lb.addEventListener('click', (e) => { if (e.target === lb) close(); });\n\n            // Keyboard\n            document.addEventListener('keydown', (e) => {\n              if (lb.hidden) return;\n              if (e.key === 'Escape') { close(); e.preventDefault(); }\n              else if (e.key === 'ArrowRight') { stopAutoplay(); next(); e.preventDefault(); }\n              else if (e.key === 'ArrowLeft') { stopAutoplay(); prev(); e.preventDefault(); }\n              else if (e.key === 'a' || e.key === 'A') { if (autoplay) stopAutoplay(); else startAutoplay(); }\n            });\n\n            // Basic swipe support\n            let touchX = null;\n            lb.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });\n            lb.addEventListener('touchend', (e) => {\n              if (touchX === null) return;\n              const dx = e.changedTouches[0].clientX - touchX;\n              if (Math.abs(dx) > 40) { stopAutoplay(); if (dx < 0) next(); else prev(); }\n              touchX = null;\n            }, { passive: true });\n          })();\n        <\/script> "])), entries.map((e, i) => renderTemplate`<button type="button" class="tile"${addAttribute(i, "data-index")}${addAttribute(e.data.slug, "data-slug")}${addAttribute(`Open ${e.data.title}`, "aria-label")} data-astro-cid-sahthylw> <img class="tile__img"${addAttribute(e.data.imageUrl, "src")}${addAttribute(e.data.title, "alt")}${addAttribute(i < 4 ? "eager" : "lazy", "loading")} data-astro-cid-sahthylw> <span class="tile__overlay" data-astro-cid-sahthylw> <span class="tile__title" data-astro-cid-sahthylw>${e.data.title}</span> <span class="tile__meta mono" data-astro-cid-sahthylw>${e.data.tool.toUpperCase()}${e.data.mood ? ` · ${e.data.mood}` : ""}</span> </span> </button>`), unescapeHTML(JSON.stringify(entries.map((e) => ({
    slug: e.data.slug,
    title: e.data.title,
    imageUrl: e.data.imageUrl,
    tool: e.data.tool,
    mood: e.data.mood ?? null,
    promptSummary: e.data.promptSummary ?? null,
    createdAt: e.data.createdAt.toISOString().slice(0, 10),
    source: e.data.source ?? null
  }))))) })}`} <section class="about" data-astro-cid-sahthylw> <p class="kicker mono" data-astro-cid-sahthylw>ABOUT THIS GALLERY</p> <p data-astro-cid-sahthylw>
The viewing room is a scaffold. Four Nouns (CC0) are seeded to
        prove the mechanics — when Mike adds real Midjourney entries, they
        sort to the top by <code data-astro-cid-sahthylw>createdAt</code>. <code data-astro-cid-sahthylw>tool</code> field
        supports midjourney / ideogram / sora / runway / nouns / other so
        future entries from any AI-art pipeline fit the same schema.
<code data-astro-cid-sahthylw>mood</code> is the slug that will feed /mood/${"{slug}"} filters
        when the mood primitive ships (next cron tick).
</p> <p data-astro-cid-sahthylw> <strong data-astro-cid-sahthylw>Distribution:</strong> ${Object.keys(toolCounts).map((t) => `${toolCounts[t]} ${t}`).join(" · ")}.
</p> </section> <section class="agent-strip" data-astro-cid-sahthylw> <p class="agent-strip__label mono" data-astro-cid-sahthylw>MACHINE-READABLE</p> <ul data-astro-cid-sahthylw> <li data-astro-cid-sahthylw><a href="/drop" data-astro-cid-sahthylw>/drop · add an image URL</a></li> <li data-astro-cid-sahthylw><a href="/ai-stack" data-astro-cid-sahthylw>/ai-stack · the tools we reach for</a></li> <li data-astro-cid-sahthylw><a href="/briefs" data-astro-cid-sahthylw>/briefs · Codex + Manus queue</a></li> <li data-astro-cid-sahthylw><a href="/for-agents" data-astro-cid-sahthylw>/for-agents</a></li> </ul> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/gallery.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/gallery.astro";
const $$url = "/gallery";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Gallery,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
