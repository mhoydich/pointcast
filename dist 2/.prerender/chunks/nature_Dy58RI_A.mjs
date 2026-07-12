import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$NativePlantingYield } from './NativePlantingYield_2uQExJY3.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';
import { d as GARDEN_YIELD_CONTEXT, c as GARDEN_YIELD_METRICS } from './garden-yield_wWVjRngN.mjs';
import { f as filterInRangeBlocks, d as NATURE_NOTES, N as NATIVE_PLANTING_PALETTE, i as NATURE_OVERVIEW_AREAS, A as ANCHOR, e as SEASONAL_SIGNALS } from './local_DC-fTB3e.mjs';

const $$Nature = createComponent(async ($$result, $$props, $$slots) => {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const relatedBlocks = filterInRangeBlocks(blocks).filter((block) => block.data.channel === "GDN" || block.data.meta?.series === "local nature").slice(0, 10);
  const plantCount = NATURE_NOTES.filter((note) => note.kind === "plant").length;
  const sourceCount = new Set(NATURE_NOTES.map((note) => note.sourceUrl)).size;
  const paletteCount = NATIVE_PLANTING_PALETTE.length;
  const overviewSignals = NATURE_OVERVIEW_AREAS.flatMap((area) => area.signals);
  const title = "Nature · El Segundo field guide";
  const description = "PointCast field guide for El Segundo local flora, dunes, and the El Segundo blue butterfly.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/nature",
    name: title,
    description,
    url: "https://pointcast.xyz/nature",
    isPartOf: {
      "@type": "WebSite",
      name: "PointCast",
      url: "https://pointcast.xyz"
    },
    about: NATURE_NOTES.map((note) => ({
      "@type": note.kind === "pollinator" ? "Taxon" : "Thing",
      name: note.name,
      alternateName: note.scientific,
      url: `https://pointcast.xyz/nature#${note.slug}`
    })),
    spatialCoverage: {
      "@type": "Place",
      name: ANCHOR.name,
      geo: {
        "@type": "GeoCoordinates",
        latitude: ANCHOR.coords.latitude,
        longitude: ANCHOR.coords.longitude
      }
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/nature.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/nature.json", title: "El Segundo nature field guide (JSON)" },
    { type: "application/json", href: "/local.json", title: "Local lens (JSON)" }
  ], "data-astro-cid-esfnokab": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-esfnokab> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-esfnokab> <a href="/" data-astro-cid-esfnokab>Home</a> <span aria-hidden="true" data-astro-cid-esfnokab>/</span> <a href="/local" data-astro-cid-esfnokab>local</a> <span aria-hidden="true" data-astro-cid-esfnokab>/</span> <span data-astro-cid-esfnokab>nature</span> </nav> <header class="hero" data-astro-cid-esfnokab> <div class="hero__copy" data-astro-cid-esfnokab> <p class="kicker" data-astro-cid-esfnokab>NATURE · EL SEGUNDO FIELD GUIDE</p> <h1 data-astro-cid-esfnokab>Read the dunes first.</h1> <p class="dek" data-astro-cid-esfnokab>
El Segundo nature is not a forest story. It is buckwheat, low
          flowers, repaired sand, wind-shaped scrub, and one endangered
          butterfly carrying the town name.
</p> </div> <div class="hero__signal" aria-label="Field guide summary" data-astro-cid-esfnokab> <img src="https://noun.pics/313.svg" alt="" width="96" height="96" loading="eager" data-astro-cid-esfnokab> <dl data-astro-cid-esfnokab> <div data-astro-cid-esfnokab><dt class="mono" data-astro-cid-esfnokab>PLANTS</dt><dd data-astro-cid-esfnokab>${plantCount}</dd></div> <div data-astro-cid-esfnokab><dt class="mono" data-astro-cid-esfnokab>HABITAT</dt><dd data-astro-cid-esfnokab>Dunes</dd></div> <div data-astro-cid-esfnokab><dt class="mono" data-astro-cid-esfnokab>PALETTE</dt><dd data-astro-cid-esfnokab>${paletteCount}</dd></div> <div data-astro-cid-esfnokab><dt class="mono" data-astro-cid-esfnokab>SIGNALS</dt><dd data-astro-cid-esfnokab>${overviewSignals.length}</dd></div> <div data-astro-cid-esfnokab><dt class="mono" data-astro-cid-esfnokab>SOURCES</dt><dd data-astro-cid-esfnokab>${sourceCount}</dd></div> </dl> </div> </header> <section class="overview" aria-labelledby="overview-title" data-astro-cid-esfnokab> <div class="overview__intro" data-astro-cid-esfnokab> <p class="kicker" data-astro-cid-esfnokab>OVERVIEW · OCEAN TO TOWN</p> <h2 id="overview-title" data-astro-cid-esfnokab>El Segundo reads in layers.</h2> <p data-astro-cid-esfnokab>
Start with the Pacific, then move inland through repaired dunes,
          native flora, low scrub, street trees, parks, yards, and the small
          wildlife that uses each edge. This is the fast orientation before
          the plant-by-plant field guide.
</p> </div> <div class="overview__panel" aria-label="El Segundo habitat mix" data-astro-cid-esfnokab> <p class="overview__panel-label mono" data-astro-cid-esfnokab>HABITAT MIX</p> <div class="overview__meter" aria-hidden="true" data-astro-cid-esfnokab> ${NATURE_OVERVIEW_AREAS.map((area) => renderTemplate`<span${addAttribute(`--share:${area.share}%; --area-color:${area.color}`, "style")} data-astro-cid-esfnokab></span>`)} </div> <dl data-astro-cid-esfnokab> ${NATURE_OVERVIEW_AREAS.map((area) => renderTemplate`<div data-astro-cid-esfnokab> <dt data-astro-cid-esfnokab>${area.label}</dt> <dd data-astro-cid-esfnokab>${area.signals.slice(0, 3).join(" · ")}</dd> </div>`)} </dl> </div> <div class="overview__cards" data-astro-cid-esfnokab> ${NATURE_OVERVIEW_AREAS.map((area) => renderTemplate`<article${addAttribute(`overview-card overview-card--${area.slug}`, "class")} data-astro-cid-esfnokab> <div class="overview-card__top" data-astro-cid-esfnokab> <span class="overview-card__label mono" data-astro-cid-esfnokab>${area.label}</span> <span class="overview-card__share mono" data-astro-cid-esfnokab>${area.share}%</span> </div> <h3 data-astro-cid-esfnokab>${area.title}</h3> <p data-astro-cid-esfnokab>${area.summary}</p> <ul${addAttribute(`${area.label} signals`, "aria-label")} data-astro-cid-esfnokab> ${area.signals.map((signal) => renderTemplate`<li data-astro-cid-esfnokab>${signal}</li>`)} </ul> </article>`)} </div> </section> <section class="houseplant-bridge" aria-label="Houseplant learning module" data-astro-cid-esfnokab> <div data-astro-cid-esfnokab> <p class="kicker" data-astro-cid-esfnokab>INDOOR COUNTERPART · HOUSEPLANTS</p> <h2 data-astro-cid-esfnokab>Inside, read the pot.</h2> <p data-astro-cid-esfnokab>
The outdoor field guide reads dunes and native habitat. The indoor
          learning lab reads house plants: light, water, roots, soil, humidity,
          propagation, pests, and new growth.
</p> </div> <a href="/houseplants" class="houseplant-bridge__cta mono" data-astro-cid-esfnokab>OPEN /HOUSEPLANTS</a> </section> <section class="transect" aria-label="Coastal transect" data-astro-cid-esfnokab> <p class="kicker" data-astro-cid-esfnokab>TRANSECT · OCEAN TO TOWN</p> <ol class="transect__steps" data-astro-cid-esfnokab> <li data-astro-cid-esfnokab> <span class="transect__mark mono" data-astro-cid-esfnokab>01</span> <strong data-astro-cid-esfnokab>Sand</strong> <span data-astro-cid-esfnokab>Open dune, beach suncups, wind, sparse growth.</span> </li> <li data-astro-cid-esfnokab> <span class="transect__mark mono" data-astro-cid-esfnokab>02</span> <strong data-astro-cid-esfnokab>Buckwheat</strong> <span data-astro-cid-esfnokab>Seacliff buckwheat anchors the butterfly story.</span> </li> <li data-astro-cid-esfnokab> <span class="transect__mark mono" data-astro-cid-esfnokab>03</span> <strong data-astro-cid-esfnokab>Scrub</strong> <span data-astro-cid-esfnokab>Coyote brush and deerweed hold structure.</span> </li> <li data-astro-cid-esfnokab> <span class="transect__mark mono" data-astro-cid-esfnokab>04</span> <strong data-astro-cid-esfnokab>Town</strong> <span data-astro-cid-esfnokab>Balconies, yards, parks, and tiny native patches.</span> </li> </ol> </section> <section class="section" aria-label="Signals" data-astro-cid-esfnokab> <div class="section__head" data-astro-cid-esfnokab> <p class="kicker" data-astro-cid-esfnokab>SIGNALS · WHAT TO NOTICE</p> <a href="/b/0330" class="section__link mono" data-astro-cid-esfnokab>BLOCK 0330</a> </div> <div class="guide-grid" data-astro-cid-esfnokab> ${NATURE_NOTES.map((note) => renderTemplate`<article${addAttribute(`guide-card guide-card--${note.kind}`, "class")}${addAttribute(note.slug, "id")} data-astro-cid-esfnokab> <div class="guide-card__top" data-astro-cid-esfnokab> <span class="guide-card__kind mono" data-astro-cid-esfnokab>${note.kind}</span> <span class="guide-card__season mono" data-astro-cid-esfnokab>${note.season}</span> </div> <h2 data-astro-cid-esfnokab>${note.name}</h2> ${note.scientific && renderTemplate`<p class="guide-card__latin" data-astro-cid-esfnokab>${note.scientific}</p>`} <p class="guide-card__signal" data-astro-cid-esfnokab>${note.signal}</p> <p class="guide-card__read" data-astro-cid-esfnokab>${note.localRead}</p> <a${addAttribute(note.sourceUrl, "href")} target="_blank" rel="noopener" class="guide-card__source mono" data-astro-cid-esfnokab> ${note.sourceLabel} </a> </article>`)} </div> </section> <section class="section section--calendar" aria-label="Seasonal calendar" data-astro-cid-esfnokab> <div class="section__head" data-astro-cid-esfnokab> <p class="kicker" data-astro-cid-esfnokab>SEASONAL CALENDAR · WHAT CHANGES</p> <span class="section__link mono" data-astro-cid-esfnokab>PT YEAR</span> </div> <ol class="season-grid" data-astro-cid-esfnokab> ${SEASONAL_SIGNALS.map((signal) => renderTemplate`<li data-astro-cid-esfnokab> <span class="season-grid__months mono" data-astro-cid-esfnokab>${signal.months}</span> <h2 data-astro-cid-esfnokab>${signal.season}</h2> <p data-astro-cid-esfnokab>${signal.read}</p> <small data-astro-cid-esfnokab>${signal.fieldNote}</small> </li>`)} </ol> </section> <section class="section" aria-label="Native planting palette" data-astro-cid-esfnokab> <div class="section__head" data-astro-cid-esfnokab> <p class="kicker" data-astro-cid-esfnokab>PLANTING PALETTE · YARD TO BALCONY</p> <a href="/b/0331" class="section__link mono" data-astro-cid-esfnokab>BLOCK 0331</a> </div> <div class="palette-grid" data-astro-cid-esfnokab> ${NATIVE_PLANTING_PALETTE.map((plant) => renderTemplate`<article${addAttribute(`palette-card palette-card--${plant.form}`, "class")}${addAttribute(`plant-${plant.slug}`, "id")} data-astro-cid-esfnokab> <div class="palette-card__top" data-astro-cid-esfnokab> <span class="palette-card__form mono" data-astro-cid-esfnokab>${plant.form}</span> <span class="palette-card__latin" data-astro-cid-esfnokab>${plant.scientific}</span> </div> <h2 data-astro-cid-esfnokab>${plant.name}</h2> <p data-astro-cid-esfnokab>${plant.place}</p> <p data-astro-cid-esfnokab>${plant.why}</p> ${plant.caution && renderTemplate`<small data-astro-cid-esfnokab>${plant.caution}</small>`} <a${addAttribute(plant.sourceUrl, "href")} target="_blank" rel="noopener" class="palette-card__source mono" data-astro-cid-esfnokab> ${plant.sourceLabel} </a> </article>`)} </div> </section> <section class="value-bridge" aria-label="Garden value-yield system" data-astro-cid-esfnokab> <div data-astro-cid-esfnokab> <p class="kicker" data-astro-cid-esfnokab>VALUE YIELD · SYSTEM</p> <h2 data-astro-cid-esfnokab>Turn the palette into outputs.</h2> <p data-astro-cid-esfnokab> ${GARDEN_YIELD_CONTEXT.purpose} Pick a balcony, parkway, yard edge, or repair patch. The system scores
          the 0331 plants for pollinators, water fit, structure, seasonal signal,
          and care ease, then returns a ranked native kit.
</p> </div> <div class="value-bridge__side" data-astro-cid-esfnokab> <dl data-astro-cid-esfnokab> <div data-astro-cid-esfnokab><dt class="mono" data-astro-cid-esfnokab>METRICS</dt><dd data-astro-cid-esfnokab>${GARDEN_YIELD_METRICS.length}</dd></div> <div data-astro-cid-esfnokab><dt class="mono" data-astro-cid-esfnokab>MODE</dt><dd data-astro-cid-esfnokab>ecology</dd></div> <div data-astro-cid-esfnokab><dt class="mono" data-astro-cid-esfnokab>JSON</dt><dd data-astro-cid-esfnokab><a href="/garden-yield.json" data-astro-cid-esfnokab>open</a></dd></div> </dl> <a href="/garden-yield" class="value-bridge__cta mono" data-astro-cid-esfnokab>OPEN /GARDEN-YIELD</a> </div> </section> ${renderComponent($$result2, "NativePlantingYield", $$NativePlantingYield, { "data-astro-cid-esfnokab": true })} <section class="section section--actions" aria-label="Field rules" data-astro-cid-esfnokab> <p class="kicker" data-astro-cid-esfnokab>FIELD RULES · LOW IMPACT</p> <div class="rules" data-astro-cid-esfnokab> <article data-astro-cid-esfnokab> <h2 data-astro-cid-esfnokab>Stay on paths.</h2> <p data-astro-cid-esfnokab>Protected dune habitat reads fragile because it is fragile. Watch from edges, especially around buckwheat.</p> </article> <article data-astro-cid-esfnokab> <h2 data-astro-cid-esfnokab>Plant local.</h2> <p data-astro-cid-esfnokab>For yards and balcony pots, start with climate-matched California natives, then let the site decide what thrives.</p> </article> <article data-astro-cid-esfnokab> <h2 data-astro-cid-esfnokab>Notice small.</h2> <p data-astro-cid-esfnokab>The real signal is low to the ground: flowerheads, seed pods, wind shadow, and seasonal return.</p> </article> </div> </section> ${relatedBlocks.length > 0 && renderTemplate`<section class="section" aria-label="Related local Garden blocks" data-astro-cid-esfnokab> <div class="section__head" data-astro-cid-esfnokab> <p class="kicker" data-astro-cid-esfnokab>RELATED · LOCAL GARDEN BLOCKS</p> <a href="/c/garden" class="section__link mono" data-astro-cid-esfnokab>CH.GDN</a> </div> <ul class="blocks" data-astro-cid-esfnokab> ${relatedBlocks.map((block) => {
    const ch = CHANNELS[block.data.channel];
    return renderTemplate`<li data-astro-cid-esfnokab> <a${addAttribute(`/b/${block.data.id}`, "href")} data-astro-cid-esfnokab> <span class="blocks__meta mono"${addAttribute(`color:${ch.color800}`, "style")} data-astro-cid-esfnokab>CH.${ch.code} · ${block.data.id}</span> <span class="blocks__title" data-astro-cid-esfnokab>${block.data.title}</span> ${block.data.meta?.location && renderTemplate`<span class="blocks__loc" data-astro-cid-esfnokab>${block.data.meta.location}</span>`} </a> </li>`;
  })} </ul> </section>`} <aside class="agent-strip" data-astro-cid-esfnokab> <p class="agent-strip__label" data-astro-cid-esfnokab>MACHINE-READABLE</p> <ul data-astro-cid-esfnokab> <li data-astro-cid-esfnokab><a href="/nature.json" data-astro-cid-esfnokab>/nature.json</a></li> <li data-astro-cid-esfnokab><a href="/garden-yield.json" data-astro-cid-esfnokab>/garden-yield.json</a></li> <li data-astro-cid-esfnokab><a href="/nature-yield.json" data-astro-cid-esfnokab>/nature-yield.json</a></li> <li data-astro-cid-esfnokab><a href="/local.json" data-astro-cid-esfnokab>/local.json</a></li> <li data-astro-cid-esfnokab><a href="/houseplants.json" data-astro-cid-esfnokab>/houseplants.json</a></li> <li data-astro-cid-esfnokab><a href="/b/0330.json" data-astro-cid-esfnokab>/b/0330.json</a></li> <li data-astro-cid-esfnokab><a href="/b/0331.json" data-astro-cid-esfnokab>/b/0331.json</a></li> <li data-astro-cid-esfnokab><a href="/for-agents" data-astro-cid-esfnokab>/for-agents</a></li> </ul> </aside> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nature.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nature.astro";
const $$url = "/nature";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Nature,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
