import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const blocks = (await getCollection(
    "blocks",
    ({ data }) => !data.draft && data.type === "WATCH" && Array.isArray(data.media?.beats) && data.media.beats.length > 0
  )).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const title = "YeePlayer — rhythm-game overlays on PointCast blocks";
  const description = "Static rhythm overlays on selected PointCast WATCH blocks. Tap the cued words as they fall. v0 — meditation maps, song maps, and small tribute highlights.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "YeePlayer",
    description,
    hasPart: blocks.map((b) => ({
      "@type": "VideoGame",
      name: `YeePlayer · ${b.data.title}`,
      url: `https://pointcast.xyz/yee/${b.data.id}`,
      genre: "Rhythm"
    }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/yee.png", "jsonLd": jsonLd, "data-astro-cid-7vc4gt2u": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="catalog" data-astro-cid-7vc4gt2u> <header class="catalog__head" data-astro-cid-7vc4gt2u> <p class="kicker mono" data-astro-cid-7vc4gt2u>YEEPLAYER · v0</p> <h1 class="title" data-astro-cid-7vc4gt2u>Rhythm overlays on blocks.</h1> <p class="dek" data-astro-cid-7vc4gt2u>
A small experiment. Some WATCH blocks on PointCast ship with a
<code data-astro-cid-7vc4gt2u>beats</code> array — a list of cued words, section markers, or
        bija mantras that fall down a track while the video plays. Tap SPACE
        (or the hit zone) when each word reaches the line. Perfect timing is a
        bonus, not the point. The point is slowing your attention down to meet
        a sound.
</p> <p class="dek" data-astro-cid-7vc4gt2u>
Meditation-speed when the source is meditation; song-map pacing when
        the source is music. No penalty for missing. Local best-score only.
        Static, single-player, fully client-side — YouTube IFrame API +
        requestAnimationFrame is the whole stack.
</p> </header> ${blocks.length === 0 ? renderTemplate`<p class="empty" data-astro-cid-7vc4gt2u>No rhythm overlays published yet. Check back soon.</p>` : renderTemplate`<ul class="list" data-astro-cid-7vc4gt2u> ${blocks.map((b) => {
    const ch = CHANNELS[b.data.channel];
    const beats = b.data.media.beats;
    return renderTemplate`<li class="item" data-astro-cid-7vc4gt2u> <a${addAttribute(`/yee/${b.data.id}`, "href")} class="item__link" data-astro-cid-7vc4gt2u> <div class="item__head" data-astro-cid-7vc4gt2u> <span class="mono item__chan"${addAttribute(`color: ${ch.color800}`, "style")} data-astro-cid-7vc4gt2u>CH.${ch.code}</span> <span class="mono item__id" data-astro-cid-7vc4gt2u>№ ${b.data.id}</span> <span class="mono item__type" data-astro-cid-7vc4gt2u>WATCH · ${beats.length} BEATS</span> </div> <h2 class="item__title" data-astro-cid-7vc4gt2u>${b.data.title}</h2> ${b.data.dek && renderTemplate`<p class="item__dek" data-astro-cid-7vc4gt2u>${b.data.dek}</p>`} <div class="item__cta mono" data-astro-cid-7vc4gt2u>▶ PLAY</div> </a> </li>`;
  })} </ul>`} <section class="stack" data-astro-cid-7vc4gt2u> <p class="stack__title mono" data-astro-cid-7vc4gt2u>THE STACK</p> <ul class="stack__list" data-astro-cid-7vc4gt2u> <li data-astro-cid-7vc4gt2u><strong data-astro-cid-7vc4gt2u>Schema:</strong> <code data-astro-cid-7vc4gt2u>media.beats: Array&lt;${"{t, word, color?, note?, key?}"}&gt;</code></li> <li data-astro-cid-7vc4gt2u><strong data-astro-cid-7vc4gt2u>Route:</strong> <code data-astro-cid-7vc4gt2u>/yee/${"{id}"}</code> built at static time, one per qualifying block</li> <li data-astro-cid-7vc4gt2u><strong data-astro-cid-7vc4gt2u>Sync:</strong> YouTube IFrame API → <code data-astro-cid-7vc4gt2u>getCurrentTime()</code> polled in <code data-astro-cid-7vc4gt2u>requestAnimationFrame</code></li> <li data-astro-cid-7vc4gt2u><strong data-astro-cid-7vc4gt2u>Hit window:</strong> ±200 ms perfect, ±650 ms good, else drop-through</li> <li data-astro-cid-7vc4gt2u><strong data-astro-cid-7vc4gt2u>Audio:</strong> Web Audio API sine at 880 Hz (perfect) / 660 Hz (good)</li> <li data-astro-cid-7vc4gt2u><strong data-astro-cid-7vc4gt2u>No server.</strong> No accounts. Local best-score only. Just you and the tone.</li> </ul> </section> <section class="why" data-astro-cid-7vc4gt2u> <p class="why__title mono" data-astro-cid-7vc4gt2u>WHY THIS EXISTS</p> <p data-astro-cid-7vc4gt2u>
PointCast wants to reward sustained attention. A video is a one-way
        stream. A beat track turns the stream into a loop — the watcher has
        to listen forward and press on time, which means they have to actually
        breathe with the thing. Meditation videos lose people because they
        demand stillness; a light interactive layer can thread the needle.
        v0 proves the primitive. v1 will add vibration, Tezos-signed session
        receipts, and more titles.
</p> <p class="why__meta mono" data-astro-cid-7vc4gt2u>STATUS: v0 · SHIPPED ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)} · NEXT: vibration + session receipts</p> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/yee/index.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/yee/index.astro";
const $$url = "/yee";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
