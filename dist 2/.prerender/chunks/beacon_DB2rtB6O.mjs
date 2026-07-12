import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { N as NEIGHBORHOODS_BY_DISTANCE } from './neighborhoods_BtGyzOCy.mjs';

const $$Beacon = createComponent(($$result, $$props, $$slots) => {
  const NEARBY = NEIGHBORHOODS_BY_DISTANCE;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    "@id": "https://pointcast.xyz/beacon",
    name: "PointCast Beacon · 25-mile radius",
    description: "25-mile community-growth radius anchored in El Segundo. Neighborhoods eligible for mesh extension, third-space networks, DAO-led real estate, and cross-community programming.",
    url: "https://pointcast.xyz/beacon",
    geo: {
      "@type": "GeoCoordinates",
      latitude: 33.919,
      longitude: -118.416,
      name: "El Segundo, CA"
    },
    geoWithin: {
      "@type": "GeoCircle",
      geoMidpoint: { "@type": "GeoCoordinates", latitude: 33.919, longitude: -118.416 },
      geoRadius: "40233"
      // 25 miles in meters
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Beacon", "description": "PointCast's 25-mile community-growth radius anchored in El Segundo. Neighborhoods in range for mesh internet, third-space networks, DAO-led real estate.", "image": "/images/og/beacon.png", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/beacon.json", title: "Beacon radius (JSON)" }], "data-astro-cid-hzazx2mk": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-hzazx2mk> <nav class="crumb" data-astro-cid-hzazx2mk> <a href="/" data-astro-cid-hzazx2mk>Home</a> <span aria-hidden="true" data-astro-cid-hzazx2mk>›</span> <span data-astro-cid-hzazx2mk>beacon</span> </nav> <header class="hero" data-astro-cid-hzazx2mk> <p class="kicker" data-astro-cid-hzazx2mk>BEACON · 25-MILE RADIUS · FROM EL SEGUNDO</p> <h1 class="display" data-astro-cid-hzazx2mk>A beacon for the area.</h1> <p class="dek" data-astro-cid-hzazx2mk>
PointCast anchors in El Segundo. Draw a circle 25 miles out and
        you get most of the South Bay, the Westside, industrial Hawthorne
        through Compton, downtown LA's edge, and part of Long Beach.
        That's the service area. These are the neighborhoods the mesh
        could extend to, the third-space network could replicate into,
        the DAO could invest alongside.
</p> </header> <section class="panel panel--compass" data-astro-cid-hzazx2mk> <div class="compass" data-astro-cid-hzazx2mk> <div class="compass__ring" aria-hidden="true" data-astro-cid-hzazx2mk> <span class="compass__pin" data-astro-cid-hzazx2mk></span> <span class="compass__dir compass__dir--n" data-astro-cid-hzazx2mk>N</span> <span class="compass__dir compass__dir--e" data-astro-cid-hzazx2mk>E</span> <span class="compass__dir compass__dir--s" data-astro-cid-hzazx2mk>S</span> <span class="compass__dir compass__dir--w" data-astro-cid-hzazx2mk>W</span> <span class="compass__radius" data-astro-cid-hzazx2mk>25 MI</span> </div> <div class="compass__facts" data-astro-cid-hzazx2mk> <div data-astro-cid-hzazx2mk><dt class="mono" data-astro-cid-hzazx2mk>ANCHOR</dt><dd data-astro-cid-hzazx2mk>El Segundo · 33.919 N, 118.416 W</dd></div> <div data-astro-cid-hzazx2mk><dt class="mono" data-astro-cid-hzazx2mk>RADIUS</dt><dd data-astro-cid-hzazx2mk>25 miles · ~40 km</dd></div> <div data-astro-cid-hzazx2mk><dt class="mono" data-astro-cid-hzazx2mk>COVERAGE</dt><dd data-astro-cid-hzazx2mk>Most of the South Bay + Westside + Harbor + part of DTLA/Long Beach</dd></div> <div data-astro-cid-hzazx2mk><dt class="mono" data-astro-cid-hzazx2mk>CANDIDATES</dt><dd data-astro-cid-hzazx2mk>${NEARBY.length} neighborhoods documented below</dd></div> </div> </div> </section> <section class="panel" data-astro-cid-hzazx2mk> <div class="panel__head" data-astro-cid-hzazx2mk> <p class="kicker" data-astro-cid-hzazx2mk>NEARBY · sorted by distance</p> <p class="panel__dek" data-astro-cid-hzazx2mk>TARGET · primary first-wave extension. ADJACENT · reachable, dependent on infrastructure. SEED · actively part of the growth.</p> </div> <ol class="places" data-astro-cid-hzazx2mk> ${NEARBY.map((p) => renderTemplate`<li${addAttribute(`place place--${p.status}`, "class")} data-astro-cid-hzazx2mk> <div class="place__head" data-astro-cid-hzazx2mk> <span class="place__name" data-astro-cid-hzazx2mk>${p.name}</span> <span class="place__status mono" data-astro-cid-hzazx2mk>${p.status.toUpperCase()}</span> <span class="place__dist mono" data-astro-cid-hzazx2mk>${p.distance} MI · ${p.bearing}</span> </div> <p class="place__why" data-astro-cid-hzazx2mk>${p.why}</p> </li>`)} </ol> </section> <section class="panel" data-astro-cid-hzazx2mk> <p class="kicker" data-astro-cid-hzazx2mk>THE PROGRAMS</p> <div class="programs" data-astro-cid-hzazx2mk> <article class="program" data-astro-cid-hzazx2mk> <h3 class="program__title" data-astro-cid-hzazx2mk>Mesh extension</h3> <p class="program__body" data-astro-cid-hzazx2mk>
Per <a href="/b/0240" data-astro-cid-hzazx2mk>Block 0240</a>. Start in El Segundo. First hop Manhattan / Hermosa (3-5 mi). Second hop Redondo / Westchester. Year two: Venice + Culver City. Every mesh chapter inherits the gear pool, playbook, and peer-to-peer backhaul agreements.
</p> </article> <article class="program" data-astro-cid-hzazx2mk> <h3 class="program__title" data-astro-cid-hzazx2mk>Third-space network</h3> <p class="program__body" data-astro-cid-hzazx2mk>
Per <a href="/b/0242" data-astro-cid-hzazx2mk>Block 0242</a>. The archetype (pickleball + nature + food + saunas + pool + art) replicates. First instance: El Segundo. Year two targets: Venice, Torrance, Inglewood, Long Beach. Fifty instances total, networked membership.
</p> </article> <article class="program" data-astro-cid-hzazx2mk> <h3 class="program__title" data-astro-cid-hzazx2mk>DAO real estate</h3> <p class="program__body" data-astro-cid-hzazx2mk>
Per <a href="/b/0241" data-astro-cid-hzazx2mk>Block 0241</a>. ESREF buys commercial property in 90245 (El Segundo) year one. Expansion mandate could grow the mandate to the 25-mile radius starting year two, on a per-property DAO vote. <a href="/dao" data-astro-cid-hzazx2mk>PC-0001</a> is the first binding vote.
</p> </article> <article class="program" data-astro-cid-hzazx2mk> <h3 class="program__title" data-astro-cid-hzazx2mk>PointCast areas</h3> <p class="program__body" data-astro-cid-hzazx2mk>
The new participation layer lives at <a href="/areas" data-astro-cid-hzazx2mk>/areas</a>: Paddle Tide Exchange, Mike-led meetups, University of El Segundo, and Honey League. Same 25-mile radius, tuned for people who can actually hand off a paddle, host a table, or attend First Tide.
</p> </article> <article class="program" data-astro-cid-hzazx2mk> <h3 class="program__title" data-astro-cid-hzazx2mk>Cross-programming</h3> <p class="program__body" data-astro-cid-hzazx2mk>
Pickleball tournaments across the network. Mesh-node-building workshops. Third-space quarterly conventions. The 25-mile radius is tight enough that a Saturday morning drive covers any two cities.
</p> </article> </div> </section> <aside class="surfaces" data-astro-cid-hzazx2mk> <p class="kicker" data-astro-cid-hzazx2mk>RELATED</p> <ul class="surfaces__list" data-astro-cid-hzazx2mk> <li data-astro-cid-hzazx2mk><a href="/b/0240" data-astro-cid-hzazx2mk><span class="mono" data-astro-cid-hzazx2mk>MESH</span> /b/0240</a></li> <li data-astro-cid-hzazx2mk><a href="/b/0241" data-astro-cid-hzazx2mk><span class="mono" data-astro-cid-hzazx2mk>RE FUND</span> /b/0241</a></li> <li data-astro-cid-hzazx2mk><a href="/b/0242" data-astro-cid-hzazx2mk><span class="mono" data-astro-cid-hzazx2mk>THIRD PLACE</span> /b/0242</a></li> <li data-astro-cid-hzazx2mk><a href="/b/0244" data-astro-cid-hzazx2mk><span class="mono" data-astro-cid-hzazx2mk>BEACON</span> /b/0244</a></li> <li data-astro-cid-hzazx2mk><a href="/areas" data-astro-cid-hzazx2mk><span class="mono" data-astro-cid-hzazx2mk>AREAS</span> /areas</a></li> <li data-astro-cid-hzazx2mk><a href="/dao" data-astro-cid-hzazx2mk><span class="mono" data-astro-cid-hzazx2mk>DAO</span> /dao</a></li> <li data-astro-cid-hzazx2mk><a href="/beacon.json" data-astro-cid-hzazx2mk><span class="mono" data-astro-cid-hzazx2mk>JSON</span> /beacon.json</a></li> </ul> </aside> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/beacon.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/beacon.astro";
const $$url = "/beacon";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Beacon,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
