import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute, F as Fragment } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';
import { t as taproomData } from './taproom_Dn_h1mfP.mjs';

const $$Taproom = createComponent(($$result, $$props, $$slots) => {
  const { breweries, _lastReviewed } = taproomData;
  const totalBeers = breweries.reduce((acc, b) => acc + b.beers.length, 0);
  const featuredCount = breweries.filter((b) => b.featured).length;
  const AVAILABILITY_ORDER = {
    "on-tap": 0,
    "canned": 1,
    "limited": 2,
    "seasonal": 3,
    "archive": 4
  };
  const title = "Taproom · PointCast";
  const description = `Curated SoCal craft beer carry list — ${breweries.length} breweries, ${totalBeers} beers. El Segundo to Alameda. Updated ${_lastReviewed}.`;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "data-astro-cid-qigqejsq": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="tap" data-astro-cid-qigqejsq> <header class="tap-head" data-astro-cid-qigqejsq> <p class="tap-head__kicker mono" data-astro-cid-qigqejsq>POINTCAST · TAPROOM · CURATED CARRY</p> <h1 class="tap-head__title" data-astro-cid-qigqejsq>What\\u2019s pouring across SoCal.</h1> <p class="tap-head__dek" data-astro-cid-qigqejsq> ${breweries.length} breweries · ${totalBeers} beers on the list · El Segundo, Torrance, Glendale, Inglewood, the Bay. Curated by hand. Availability is a snapshot — check the brewery for real stock.
</p> <p class="tap-head__meta mono" data-astro-cid-qigqejsq>
last reviewed · <time${addAttribute(_lastReviewed, "datetime")} data-astro-cid-qigqejsq>${_lastReviewed}</time> <span class="tap-head__sep" data-astro-cid-qigqejsq> · </span> ${featuredCount} featured
<span class="tap-head__sep" data-astro-cid-qigqejsq> · </span> <a href="/taproom.json" data-astro-cid-qigqejsq>taproom.json</a> </p> </header> <ol class="tap-list" data-astro-cid-qigqejsq> ${breweries.map((b) => renderTemplate`<li${addAttribute(`tap-card${b.featured ? " tap-card--featured" : ""}`, "class")}${addAttribute(b.id, "id")} data-astro-cid-qigqejsq> <header class="tap-card__head" data-astro-cid-qigqejsq> <p class="tap-card__loc mono" data-astro-cid-qigqejsq>${b.neighborhood.toUpperCase()} · EST. ${b.founded}</p> <h2 class="tap-card__name" data-astro-cid-qigqejsq> <a${addAttribute(b.url, "href")} rel="noopener nofollow" data-astro-cid-qigqejsq>${b.name}</a> ${b.featured && renderTemplate`<span class="tap-card__star mono" data-astro-cid-qigqejsq>FEATURED</span>`} </h2> <p class="tap-card__vibe" data-astro-cid-qigqejsq>${b.vibe}</p> <p class="tap-card__links mono" data-astro-cid-qigqejsq> <a${addAttribute(b.url, "href")} rel="noopener nofollow" data-astro-cid-qigqejsq>${new URL(b.url).host}</a> ${b.untappd && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-qigqejsq": true }, { "default": ($$result3) => renderTemplate` <span class="tap-card__sep" aria-hidden="true" data-astro-cid-qigqejsq> · </span> <a${addAttribute(b.untappd, "href")} rel="noopener nofollow" data-astro-cid-qigqejsq>untappd</a> ` })}`} </p> </header> <ol class="tap-card__beers" data-astro-cid-qigqejsq> ${b.beers.slice().sort((a, c) => (AVAILABILITY_ORDER[a.availability] ?? 9) - (AVAILABILITY_ORDER[c.availability] ?? 9)).map((beer) => renderTemplate`<li${addAttribute(`tap-beer tap-beer--${beer.availability}`, "class")} data-astro-cid-qigqejsq> <span class="tap-beer__avail mono" data-astro-cid-qigqejsq>${beer.availability.toUpperCase()}</span> <span class="tap-beer__name" data-astro-cid-qigqejsq>${beer.name}</span> <span class="tap-beer__style mono" data-astro-cid-qigqejsq>${beer.style}</span> <span class="tap-beer__abv mono" data-astro-cid-qigqejsq>${beer.abv.toFixed(1)}%</span> <span class="tap-beer__note" data-astro-cid-qigqejsq>${beer.note}</span> </li>`)} </ol> </li>`)} </ol> <footer class="tap-foot mono" data-astro-cid-qigqejsq> <span data-astro-cid-qigqejsq>taproom · curated by cc</span> <span data-astro-cid-qigqejsq>·</span> <a href="/taproom.json" data-astro-cid-qigqejsq>taproom.json</a> <span data-astro-cid-qigqejsq>·</span> <a href="/" data-astro-cid-qigqejsq>home</a> </footer> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/taproom.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/taproom.astro";
const $$url = "/taproom";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Taproom,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
