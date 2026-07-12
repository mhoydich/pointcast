import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$NounsNationBattlerPosters = createComponent(($$result, $$props, $$slots) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "Nouns Nation Battler Poster Series",
    description: "Twenty type-heavy Nouns Nation Battler posters made from the game sprite set.",
    url: "https://pointcast.xyz/nouns-nation-battler-posters/",
    inLanguage: "en-US"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Nouns Nation Battler Posters", "description": "Twenty varied, type-heavy posters for Nouns Nation Battler using the actual generated Nouns sprites from the game.", "image": "/images/og/nouns-battler-posters.png", "jsonLd": jsonLd, "frame": {
    image: "https://pointcast.xyz/images/og/nouns-battler-posters.png",
    buttons: [
      { label: "Poster Series", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-posters/" },
      { label: "TV Cast", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-tv/" },
      { label: "Game Room", action: "link", target: "https://pointcast.xyz/nouns-nation-battler/" },
      { label: "Game JSON", action: "link", target: "https://pointcast.xyz/nouns-nation-battler.json" }
    ]
  }, "data-astro-cid-2owzddep": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="poster-page" data-astro-cid-2owzddep> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-2owzddep> <a href="/" data-astro-cid-2owzddep>Home</a> <span aria-hidden="true" data-astro-cid-2owzddep>/</span> <a href="/nouns-nation-battler/" data-astro-cid-2owzddep>Nouns Nation Battler</a> <span aria-hidden="true" data-astro-cid-2owzddep>/</span> <span data-astro-cid-2owzddep>Posters</span> </nav> <section class="intro" data-astro-cid-2owzddep> <p class="kicker" data-astro-cid-2owzddep>CH.BTL / POSTER SERIES</p> <h1 data-astro-cid-2owzddep>Nouns Nation Battler Posters</h1> <p data-astro-cid-2owzddep>
Twenty varied posters built from the actual Nouns battler sprites. Big match type, dense Noun presence,
        gang colors, Rift lanes, Bowl stakes, and couch-readable typography.
</p> <div class="manifest-row" data-astro-cid-2owzddep> <a href="/games/nouns-nation-battler/posters/" target="_blank" rel="noreferrer" data-astro-cid-2owzddep>Open poster wall</a> <a href="/games/nouns-nation-battler/#mode=tv&type=rift" target="_blank" rel="noreferrer" data-astro-cid-2owzddep>TV Rift</a> <a href="/nouns-nation-battler/" data-astro-cid-2owzddep>Game room</a> </div> </section> <section class="poster-frame" aria-label="Nouns Nation Battler poster wall" data-astro-cid-2owzddep> <iframe src="/games/nouns-nation-battler/posters/" title="Nouns Nation Battler poster series" loading="eager" data-astro-cid-2owzddep></iframe> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-battler-posters.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-battler-posters.astro";
const $$url = "/nouns-nation-battler-posters";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsNationBattlerPosters,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
