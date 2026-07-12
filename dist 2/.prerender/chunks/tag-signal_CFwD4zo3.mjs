import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$TagSignal = createComponent(($$result, $$props, $$slots) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: "Tag Signal v2",
    description: "An embeddable browser tag game with combo scoring, signal pickups, local heat tracking, and endpoint-ready analytics events.",
    url: "https://pointcast.xyz/tag-signal",
    gamePlatform: "Web browser",
    genre: "Tag",
    inLanguage: "en-US"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Tag Signal v2", "description": "An embeddable tag game for other sites, with combo scoring, signal pickups, local heat tracking, postMessage events, and optional analytics endpoint forwarding.", "image": "/images/og/b/0389.png", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/tag-signal.json", title: "Tag Signal manifest (JSON)" }], "frame": {
    image: "https://pointcast.xyz/images/og/b/0389.png",
    buttons: [
      { label: "Play", action: "link", target: "https://pointcast.xyz/tag-signal" },
      { label: "Full screen", action: "link", target: "https://pointcast.xyz/games/tag-signal/" },
      { label: "Manifest", action: "link", target: "https://pointcast.xyz/tag-signal.json" },
      { label: "Home feed", action: "link", target: "https://pointcast.xyz/" }
    ]
  }, "data-astro-cid-6p4pwcoe": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="tag-page" data-astro-cid-6p4pwcoe> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-6p4pwcoe> <a href="/" data-astro-cid-6p4pwcoe>Home</a> <span aria-hidden="true" data-astro-cid-6p4pwcoe>/</span> <a href="/c/btl" data-astro-cid-6p4pwcoe>CH.BTL</a> <span aria-hidden="true" data-astro-cid-6p4pwcoe>/</span> <span data-astro-cid-6p4pwcoe>Tag Signal v2</span> </nav> <section class="intro" data-astro-cid-6p4pwcoe> <p class="kicker" data-astro-cid-6p4pwcoe>CH.BTL / EMBEDDABLE SITE GAME</p> <h1 data-astro-cid-6p4pwcoe>Tag Signal v2</h1> <p data-astro-cid-6p4pwcoe>
A drop-in tag game for other sites. V2 adds combo scoring, gold signal pickups,
        local heat tracking, versioned events, and endpoint-ready analytics forwarding.
</p> <div class="manifest-row" data-astro-cid-6p4pwcoe> <a href="/games/tag-signal/" target="_blank" rel="noreferrer" data-astro-cid-6p4pwcoe>Open full screen</a> <a href="/games/tag-signal/embed-demo.html" target="_blank" rel="noreferrer" data-astro-cid-6p4pwcoe>Embed demo</a> <a href="/tag-signal.json" data-astro-cid-6p4pwcoe>Manifest JSON</a> </div> </section> <section class="game-frame" aria-label="Tag Signal playable frame" data-astro-cid-6p4pwcoe> <iframe src="/games/tag-signal/" title="Tag Signal game" loading="eager" data-astro-cid-6p4pwcoe></iframe> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/tag-signal.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/tag-signal.astro";
const $$url = "/tag-signal";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$TagSignal,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
