import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { L as LOCAL_AREAS, a as LOCAL_AREA_RADIUS, A as AREA_NEXT_STEPS, M as MEETUP_SERIES } from './localAreas_mKBCCGeN.mjs';

const $$Areas = createComponent(($$result, $$props, $$slots) => {
  const title = "PointCast Areas";
  const description = "New PointCast local areas inside the 25-mile participation radius: paddle exchange, Mike-led meetups, University of El Segundo, and Local Honey League.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/areas",
    name: title,
    description,
    url: "https://pointcast.xyz/areas",
    hasPart: LOCAL_AREAS.map((area) => ({
      "@type": "CreativeWork",
      "@id": `https://pointcast.xyz${area.path}`,
      name: area.name,
      description: area.description,
      url: `https://pointcast.xyz${area.path}`
    }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/areas.json", title: "PointCast Areas (JSON)" }], "data-astro-cid-nl5nevpi": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-nl5nevpi> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-nl5nevpi> <a href="/" data-astro-cid-nl5nevpi>Home</a> <span aria-hidden="true" data-astro-cid-nl5nevpi>/</span> <a href="/local" data-astro-cid-nl5nevpi>local</a> <span aria-hidden="true" data-astro-cid-nl5nevpi>/</span> <span data-astro-cid-nl5nevpi>areas</span> </nav> <header class="hero" data-astro-cid-nl5nevpi> <div class="hero__copy" data-astro-cid-nl5nevpi> <p class="kicker" data-astro-cid-nl5nevpi>POINTCAST AREAS · 25-MILE PARTICIPATION LAYER</p> <h1 data-astro-cid-nl5nevpi>Four local rooms that can become real on a Saturday.</h1> <p data-astro-cid-nl5nevpi>
The 100-mile lens is still right for broadcast. These are tighter:
          paddles, events, courses, and league tables need repeat contact, court
          handoffs, and people who can actually show up.
</p> </div> <figure class="radius" aria-label="25-mile PointCast participation radius" data-astro-cid-nl5nevpi> <svg viewBox="0 0 320 320" role="img" aria-labelledby="radius-title radius-desc" data-astro-cid-nl5nevpi> <title id="radius-title">25-mile participation radius</title> <desc id="radius-desc" data-astro-cid-nl5nevpi>A simple radius map centered on El Segundo with ocean, courts, and local area markers.</desc> <rect x="0" y="0" width="320" height="320" fill="#fbfbf8" data-astro-cid-nl5nevpi></rect> <rect x="0" y="0" width="112" height="320" fill="#d9eef1" data-astro-cid-nl5nevpi></rect> <path d="M112 0 C98 58 128 105 112 159 C97 211 124 258 106 320" fill="none" stroke="#185fa5" stroke-width="3" data-astro-cid-nl5nevpi></path> <circle cx="160" cy="168" r="118" fill="none" stroke="#12110e" stroke-width="2" data-astro-cid-nl5nevpi></circle> <circle cx="160" cy="168" r="6" fill="#c95c2e" stroke="#12110e" stroke-width="2" data-astro-cid-nl5nevpi></circle> <path d="M160 168 L160 50" stroke="#12110e" stroke-width="2" stroke-dasharray="5 7" data-astro-cid-nl5nevpi></path> <g fill="#12110e" font-family="monospace" font-size="11" data-astro-cid-nl5nevpi> <text x="135" y="38" data-astro-cid-nl5nevpi>25 MI</text> <text x="172" y="174" data-astro-cid-nl5nevpi>EL SEGUNDO</text> <text x="22" y="40" data-astro-cid-nl5nevpi>PACIFIC</text> </g> <g data-astro-cid-nl5nevpi> <circle cx="143" cy="122" r="11" fill="#e7f4ef" stroke="#0f6258" stroke-width="2" data-astro-cid-nl5nevpi></circle> <circle cx="218" cy="132" r="11" fill="#eef4fa" stroke="#185fa5" stroke-width="2" data-astro-cid-nl5nevpi></circle> <circle cx="194" cy="216" r="11" fill="#fff4dc" stroke="#6f4f14" stroke-width="2" data-astro-cid-nl5nevpi></circle> <circle cx="119" cy="217" r="11" fill="#fff0bf" stroke="#9a5f0b" stroke-width="2" data-astro-cid-nl5nevpi></circle> </g> </svg> <figcaption data-astro-cid-nl5nevpi> <strong data-astro-cid-nl5nevpi>${LOCAL_AREA_RADIUS.label}</strong> <span data-astro-cid-nl5nevpi>${LOCAL_AREA_RADIUS.radiusMiles} miles from El Segundo</span> </figcaption> </figure> </header> <section class="section" aria-labelledby="area-heading" data-astro-cid-nl5nevpi> <div class="section__head" data-astro-cid-nl5nevpi> <p class="kicker" data-astro-cid-nl5nevpi>THE AREAS</p> <h2 id="area-heading" data-astro-cid-nl5nevpi>Local programs with public doors.</h2> </div> <div class="areas" data-astro-cid-nl5nevpi> ${LOCAL_AREAS.map((area) => renderTemplate`<article class="area"${addAttribute(`--area-ink:${area.palette.ink}; --area-wash:${area.palette.wash}; --area-rule:${area.palette.rule};`, "style")} data-astro-cid-nl5nevpi> <div class="area__top" data-astro-cid-nl5nevpi> <span data-astro-cid-nl5nevpi>${area.kicker}</span> <span data-astro-cid-nl5nevpi>${area.status}</span> </div> <h3 data-astro-cid-nl5nevpi>${area.name}</h3> <p class="area__noun" data-astro-cid-nl5nevpi>${area.noun}</p> <p data-astro-cid-nl5nevpi>${area.description}</p> <ul data-astro-cid-nl5nevpi> ${area.actions.map((action) => renderTemplate`<li data-astro-cid-nl5nevpi>${action}</li>`)} </ul> <a${addAttribute(area.path, "href")} data-astro-cid-nl5nevpi>Open ${area.shortName} &rarr;</a> </article>`)} </div> </section> <section class="section split" aria-labelledby="radius-heading" data-astro-cid-nl5nevpi> <div data-astro-cid-nl5nevpi> <p class="kicker" data-astro-cid-nl5nevpi>RADIUS DECISION</p> <h2 id="radius-heading" data-astro-cid-nl5nevpi>Start at 25, keep 100 for broadcast.</h2> <p data-astro-cid-nl5nevpi>${LOCAL_AREA_RADIUS.policy}</p> </div> <div class="rulebook" data-astro-cid-nl5nevpi> <p class="rulebook__label" data-astro-cid-nl5nevpi>first operating pass</p> <ol data-astro-cid-nl5nevpi> ${AREA_NEXT_STEPS.map((step) => renderTemplate`<li data-astro-cid-nl5nevpi>${step}</li>`)} </ol> </div> </section> <section class="section" aria-labelledby="meetup-heading" data-astro-cid-nl5nevpi> <div class="section__head" data-astro-cid-nl5nevpi> <p class="kicker" data-astro-cid-nl5nevpi>CALENDAR SEEDS</p> <h2 id="meetup-heading" data-astro-cid-nl5nevpi>Meetups are the connective tissue.</h2> </div> <div class="series" data-astro-cid-nl5nevpi> ${MEETUP_SERIES.map((series) => renderTemplate`<article class="series__item" data-astro-cid-nl5nevpi> <span data-astro-cid-nl5nevpi>${series.cadence}</span> <h3 data-astro-cid-nl5nevpi>${series.title}</h3> <p data-astro-cid-nl5nevpi>${series.format}</p> <small data-astro-cid-nl5nevpi>${series.where} · ${series.connectedArea}</small> </article>`)} </div> </section> <aside class="machine" data-astro-cid-nl5nevpi> <p class="kicker" data-astro-cid-nl5nevpi>MACHINE-READABLE</p> <a href="/areas.json" data-astro-cid-nl5nevpi>/areas.json</a> </aside> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/areas.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/areas.astro";
const $$url = "/areas";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Areas,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
