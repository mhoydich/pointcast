import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';
import { f as filterInRangeBlocks, S as STATIONS, b as filterBlocksForStation, A as ANCHOR, c as NAME_DROPS, d as NATURE_NOTES, g as getStationPath, R as RADIUS_METERS } from './local_DC-fTB3e.mjs';

const $$Local = createComponent(async ($$result, $$props, $$slots) => {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const inRangeBlocks = filterInRangeBlocks(blocks);
  const stations = [...STATIONS].sort((a, b) => a.miles - b.miles).map((station) => ({
    station,
    blockCount: filterBlocksForStation(blocks, station).length
  }));
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Los_Angeles"
  }).format(/* @__PURE__ */ new Date());
  const title = "Local · 100 miles from El Segundo";
  const description = "PointCast's 100-mile lens. Anchored on El Segundo. Name-drops, stations, in-range blocks, adjacent surfaces. The local register of the site — and the data layer for /tv STATIONS mode.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    "@id": "https://pointcast.xyz/local",
    name: "PointCast · Local (100mi)",
    description,
    url: "https://pointcast.xyz/local",
    containedInPlace: {
      "@type": "City",
      name: "El Segundo",
      containedInPlace: { "@type": "AdministrativeArea", name: "Los Angeles County, California" }
    },
    geo: {
      "@type": "GeoCircle",
      geoMidpoint: { "@type": "GeoCoordinates", latitude: ANCHOR.coords.latitude, longitude: ANCHOR.coords.longitude },
      geoRadius: RADIUS_METERS
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-hxzrboae": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-hxzrboae> <nav class="breadcrumb" aria-label="Breadcrumb" data-astro-cid-hxzrboae> <a href="/" data-astro-cid-hxzrboae>← All blocks</a> <span aria-hidden="true" data-astro-cid-hxzrboae>/</span> <span data-astro-cid-hxzrboae>local</span> </nav> <header class="masthead" data-astro-cid-hxzrboae> <p class="masthead__kicker mono" data-astro-cid-hxzrboae>LOCAL · 100 MILES FROM EL SEGUNDO</p> <h1 class="masthead__title" data-astro-cid-hxzrboae>Local · <em data-astro-cid-hxzrboae>the 100-mile lens</em></h1> <p class="masthead__date mono" data-astro-cid-hxzrboae>${today}</p> <p class="masthead__lede" data-astro-cid-hxzrboae>
PointCast anchors on El Segundo. This page is the tonal register for
        everything within a hundred miles — from the next town over to Santa
        Barbara north, Palm Springs east, North San Diego County south.
        Place is not a filter; it's a <em data-astro-cid-hxzrboae>register</em>, same as mood.
</p> </header> <section class="section" aria-label="Name drops — El Segundo institutions" data-astro-cid-hxzrboae> <div class="section__head" data-astro-cid-hxzrboae> <h2 class="section__kicker mono" data-astro-cid-hxzrboae>NAME DROPS · EL SEGUNDO</h2> <a class="section__all" href="/poll/es-name-drops" data-astro-cid-hxzrboae>vote on the first one →</a> </div> <p class="section__lede" data-astro-cid-hxzrboae>
The shortlist of places that do most of the work of signaling you
        know the town. From Mike's <a href="/b/0276" data-astro-cid-hxzrboae>verbatim list</a>.
</p> <ul class="drops" data-astro-cid-hxzrboae> ${NAME_DROPS.map((d) => renderTemplate`<li class="drops__item" data-astro-cid-hxzrboae> <span class="drops__name" data-astro-cid-hxzrboae>${d.name}</span> <span class="drops__kind mono" data-astro-cid-hxzrboae>${d.kind}</span> <span class="drops__one" data-astro-cid-hxzrboae>${d.one}</span> </li>`)} </ul> </section> <section class="section nature-module" id="nature" aria-label="Nature — El Segundo flora and dune signals" data-astro-cid-hxzrboae> <div class="section__head" data-astro-cid-hxzrboae> <h2 class="section__kicker mono" data-astro-cid-hxzrboae>NATURE · DUNE SIGNALS</h2> <a class="section__all" href="/nature" data-astro-cid-hxzrboae>open field guide →</a> </div> <p class="section__lede" data-astro-cid-hxzrboae>
El Segundo's nature register is coastal-dune, airport-edge, marine-layer
        smallness: buckwheat, sand, scrub, and the butterfly that makes the
        town name literal.
</p> <div class="nature-grid" data-astro-cid-hxzrboae> ${NATURE_NOTES.map((note) => renderTemplate`<article${addAttribute(`nature-card nature-card--${note.kind}`, "class")} data-astro-cid-hxzrboae> <div class="nature-card__top" data-astro-cid-hxzrboae> <span class="nature-card__kind mono" data-astro-cid-hxzrboae>${note.kind}</span> <span class="nature-card__season mono" data-astro-cid-hxzrboae>${note.season}</span> </div> <h3 class="nature-card__name" data-astro-cid-hxzrboae>${note.name}</h3> ${note.scientific && renderTemplate`<p class="nature-card__latin" data-astro-cid-hxzrboae>${note.scientific}</p>`} <p class="nature-card__signal" data-astro-cid-hxzrboae>${note.signal}</p> <p class="nature-card__read" data-astro-cid-hxzrboae>${note.localRead}</p> <a class="nature-card__source mono"${addAttribute(note.sourceUrl, "href")} target="_blank" rel="noopener" data-astro-cid-hxzrboae> ${note.sourceLabel} ↗
</a> </article>`)} </div> </section> <section class="section" aria-label="Stations — nearby cities" data-astro-cid-hxzrboae> <div class="section__head" data-astro-cid-hxzrboae> <h2 class="section__kicker mono" data-astro-cid-hxzrboae>STATIONS · ${STATIONS.length} IN RANGE</h2> <span class="section__sub mono" data-astro-cid-hxzrboae>sorted by distance</span> </div> <p class="section__lede" data-astro-cid-hxzrboae>
The <a href="/tv" data-astro-cid-hxzrboae>/tv</a> mode flips between stations like
        broadcast channels — pick a city, you get its block feed, weather,
        events, and in-range drops.
</p> <ul class="stations" data-astro-cid-hxzrboae> ${stations.map(({ station, blockCount }) => renderTemplate`<li class="stations__item" data-astro-cid-hxzrboae> <div class="stations__lead" data-astro-cid-hxzrboae> <span class="stations__dir mono" data-astro-cid-hxzrboae>${station.direction}</span> <span class="stations__name" data-astro-cid-hxzrboae>${station.name}</span> <span class="stations__miles mono" data-astro-cid-hxzrboae>${station.miles}<span class="stations__unit" data-astro-cid-hxzrboae>mi</span></span> </div> <p class="stations__blurb" data-astro-cid-hxzrboae>${station.blurb}</p> <div class="stations__foot" data-astro-cid-hxzrboae> <span class="stations__count mono" data-astro-cid-hxzrboae> ${blockCount > 0 ? `${blockCount} block${blockCount === 1 ? "" : "s"} in range` : "no blocks yet"} </span> <a class="stations__cast mono"${addAttribute(getStationPath(station), "href")} data-astro-cid-hxzrboae>cast this station →</a> </div> </li>`)} </ul> </section> ${inRangeBlocks.length > 0 && renderTemplate`<section class="section"${addAttribute(`Blocks in range — ${inRangeBlocks.length} items`, "aria-label")} data-astro-cid-hxzrboae> <div class="section__head" data-astro-cid-hxzrboae> <h2 class="section__kicker mono" data-astro-cid-hxzrboae>IN-RANGE BLOCKS · ${inRangeBlocks.length}</h2> <a class="section__all" href="/archive" data-astro-cid-hxzrboae>all blocks →</a> </div> <p class="section__lede" data-astro-cid-hxzrboae>
Every block with a location tag that resolves inside the radius.
          This list grows whenever a new block carries a <code data-astro-cid-hxzrboae>meta.location</code>
in SoCal.
</p> <ul class="blocks" data-astro-cid-hxzrboae> ${inRangeBlocks.map((b) => {
    const ch = CHANNELS[b.data.channel];
    return renderTemplate`<li class="blocks__item" data-astro-cid-hxzrboae> <a class="blocks__link"${addAttribute(`/b/${b.data.id}`, "href")} data-astro-cid-hxzrboae> <span class="blocks__meta mono" data-astro-cid-hxzrboae> <span class="blocks__id" data-astro-cid-hxzrboae>№${b.data.id}</span> <span class="blocks__sep" aria-hidden="true" data-astro-cid-hxzrboae>·</span> <span class="blocks__ch"${addAttribute(`color: ${ch.color800}`, "style")} data-astro-cid-hxzrboae>CH.${ch.code}</span> <span class="blocks__sep" aria-hidden="true" data-astro-cid-hxzrboae>·</span> <span class="blocks__loc" data-astro-cid-hxzrboae>${b.data.meta?.location}</span> </span> <span class="blocks__title" data-astro-cid-hxzrboae>${b.data.title}</span> </a> </li>`;
  })} </ul> </section>`} <section class="section section--adjacent" aria-label="Adjacent surfaces" data-astro-cid-hxzrboae> <h2 class="section__kicker mono" data-astro-cid-hxzrboae>ADJACENT · GO DEEPER</h2> <ul class="adjacent" data-astro-cid-hxzrboae> <li data-astro-cid-hxzrboae><a href="/beacon" data-astro-cid-hxzrboae><strong data-astro-cid-hxzrboae>/beacon</strong> — 25-mile neighborhood map</a></li> <li data-astro-cid-hxzrboae><a href="/areas" data-astro-cid-hxzrboae><strong data-astro-cid-hxzrboae>/areas</strong> — paddle exchange, meetups, UES, Honey League</a></li> <li data-astro-cid-hxzrboae><a href="/paddle-exchange" data-astro-cid-hxzrboae><strong data-astro-cid-hxzrboae>/paddle-exchange</strong> — local pickleball paddle shelf</a></li> <li data-astro-cid-hxzrboae><a href="/meetups" data-astro-cid-hxzrboae><strong data-astro-cid-hxzrboae>/meetups</strong> — Mike-led community events</a></li> <li data-astro-cid-hxzrboae><a href="/university-of-el-segundo" data-astro-cid-hxzrboae><strong data-astro-cid-hxzrboae>/university-of-el-segundo</strong> — course tracks and First Tide</a></li> <li data-astro-cid-hxzrboae><a href="/honey-league" data-astro-cid-hxzrboae><strong data-astro-cid-hxzrboae>/honey-league</strong> — soft local standings</a></li> <li data-astro-cid-hxzrboae><a href="/nature" data-astro-cid-hxzrboae><strong data-astro-cid-hxzrboae>/nature</strong> — El Segundo local flora field guide</a></li> <li data-astro-cid-hxzrboae><a href="/b/0254" data-astro-cid-hxzrboae><strong data-astro-cid-hxzrboae>/b/0254</strong> — why the 25-mile radius is the right shape</a></li> <li data-astro-cid-hxzrboae><a href="/b/0330" data-astro-cid-hxzrboae><strong data-astro-cid-hxzrboae>/b/0330</strong> — El Segundo local flora and dune signals</a></li> <li data-astro-cid-hxzrboae><a href="/b/0276" data-astro-cid-hxzrboae><strong data-astro-cid-hxzrboae>/b/0276</strong> — the El Segundo name-drops editorial</a></li> <li data-astro-cid-hxzrboae><a href="/poll/es-name-drops" data-astro-cid-hxzrboae><strong data-astro-cid-hxzrboae>/poll/es-name-drops</strong> — which to name-drop first</a></li> <li data-astro-cid-hxzrboae><a href="/tv" data-astro-cid-hxzrboae><strong data-astro-cid-hxzrboae>/tv</strong> — broadcast mode (STATIONS mode arriving soon)</a></li> <li data-astro-cid-hxzrboae><a href="/shop" data-astro-cid-hxzrboae><strong data-astro-cid-hxzrboae>PointCast Commerce</strong> — Good Feels mirror and local shop routing</a></li> </ul> </section> <aside class="agent-strip" data-astro-cid-hxzrboae> <p class="agent-strip__label" data-astro-cid-hxzrboae>MACHINE-READABLE</p> <ul data-astro-cid-hxzrboae> <li data-astro-cid-hxzrboae><a href="/local.json" data-astro-cid-hxzrboae>/local.json</a></li> <li data-astro-cid-hxzrboae><a href="/blocks.json" data-astro-cid-hxzrboae>/blocks.json</a></li> <li data-astro-cid-hxzrboae><a href="/for-agents" data-astro-cid-hxzrboae>/for-agents</a></li> </ul> </aside> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/local.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/local.astro";
const $$url = "/local";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Local,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
