import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Map = createComponent(($$result, $$props, $$slots) => {
  const title = "Map — coffee near PointCast HQ";
  const description = "Six dependable coffee stops around El Segundo and the immediate South Bay orbit, plotted for quick downtown walks, office-district runs, and one easy North Manhattan detour.";
  const shops = [
    {
      id: "blue-butterfly-main",
      name: "Blue Butterfly Coffee",
      zone: "Downtown El Segundo",
      type: "all-day anchor",
      address: "351 Main St, El Segundo, CA 90245",
      hours: "Every day · 6:00 AM - 7:00 PM",
      note: "The default Main Street answer: patio, breakfast, bagels, and the easiest place to linger.",
      lat: 33.9205484,
      lon: -118.4160859,
      color: "#185fa5",
      mapsUrl: "https://maps.apple.com/place?place-id=I7BE048979469F7D7",
      siteUrl: "https://bluebutterflycoffee.com"
    },
    {
      id: "smoky-hollow-sierra",
      name: "Smoky Hollow Coffee Roasters",
      zone: "Smoky Hollow",
      type: "roastery room",
      address: "118 Sierra St, El Segundo, CA 90245",
      hours: "Mon - Fri · 7:00 AM - 6:00 PM · Sat + Sun · 7:00 AM - 5:00 PM",
      note: "Warehouse-pocket shop with the strongest pure roastery energy in town.",
      lat: 33.9171082,
      lon: -118.4086704,
      color: "#7d6f56",
      mapsUrl: "https://maps.apple.com/place?place-id=ID59CB4A0F622158C",
      siteUrl: "https://smokyhollowcoffee.com"
    },
    {
      id: "offset-el-segundo",
      name: "Offset Coffee Roasters",
      zone: "Sepulveda corridor",
      type: "patio stop",
      address: "150 S Pacific Coast Hwy Unit B, El Segundo, CA 90245",
      hours: "Every day · 7:00 AM - 4:00 PM",
      note: "A clean, modern roastery stop with a strong patio and quick in-and-out rhythm.",
      lat: 33.9147803,
      lon: -118.3954512,
      color: "#0d8f8a",
      mapsUrl: "https://maps.apple.com/place?place-id=I5BC475612C302B98",
      siteUrl: "https://offsetcoffee.com"
    },
    {
      id: "blue-butterfly-pct",
      name: "Blue Butterfly Coffee PCT Towers",
      zone: "North Sepulveda",
      type: "weekday fallback",
      address: "222 N Pacific Coast Hwy N Ste 120, El Segundo, CA 90245",
      hours: "Mon - Fri · 7:00 AM - 3:00 PM",
      note: "Useful when meetings pull you into the office belt and you still want a real coffee stop.",
      lat: 33.9191393,
      lon: -118.3952911,
      color: "#b46d8f",
      mapsUrl: "https://maps.apple.com/place?place-id=IEA06C437F0F36A06"
    },
    {
      id: "smoky-hollow-continental",
      name: "Smoky Hollow Coffee Roasters",
      zone: "Continental district",
      type: "weekday office outpost",
      address: "300 Continental Blvd FL 1, El Segundo, CA 90245",
      hours: "Mon - Fri · 7:00 AM - 3:00 PM",
      note: "Best thought of as the Continental campus coffee answer, not the destination flagship.",
      lat: 33.9202222,
      lon: -118.3897717,
      color: "#7c63d8",
      mapsUrl: "https://maps.apple.com/place?place-id=ICBE8B5F97A44FC56",
      siteUrl: "https://smokyhollowcoffee.com"
    },
    {
      id: "two-guns-north-manhattan",
      name: "Two Guns Espresso",
      zone: "North Manhattan",
      type: "southbound detour",
      address: "3516 N Highland Ave, Manhattan Beach, CA 90266",
      hours: "Every day · 6:00 AM - 3:00 PM",
      note: "The one deliberate detour on this map: close enough to El Segundo to matter, breezier than the office run.",
      lat: 33.9000732,
      lon: -118.4172798,
      color: "#d17a2c",
      mapsUrl: "https://maps.apple.com/place?place-id=I1D8FFF1CB85FD5E2",
      siteUrl: "https://twogunsespresso.com"
    }
  ];
  const bounds = {
    minLat: 33.897,
    maxLat: 33.9225,
    minLon: -118.4195,
    maxLon: -118.3885
  };
  const mapArea = {
    left: 140,
    top: 54,
    right: 584,
    bottom: 596
  };
  function scaleX(lon) {
    const width = mapArea.right - mapArea.left;
    return mapArea.left + (lon - bounds.minLon) / (bounds.maxLon - bounds.minLon) * width;
  }
  function scaleY(lat) {
    const height = mapArea.bottom - mapArea.top;
    return mapArea.top + (bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat) * height;
  }
  const plottedShops = shops.map((shop, index) => {
    const x = scaleX(shop.lon);
    const y = scaleY(shop.lat);
    return {
      ...shop,
      x,
      y,
      labelY: index === shops.length - 1 ? y + 28 : y - 20
    };
  });
  const zones = [...new Map(plottedShops.map((shop) => [shop.zone, shop])).values()];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "PointCast coffee map",
    description,
    url: "https://pointcast.xyz/collabs/map",
    isPartOf: {
      "@type": "CollectionPage",
      name: "PointCast Collaborators",
      url: "https://pointcast.xyz/collabs"
    },
    hasPart: shops.map((shop, index) => ({
      "@type": "CafeOrCoffeeShop",
      "@id": `https://pointcast.xyz/collabs/map#${shop.id}`,
      name: shop.name,
      description: shop.note,
      url: shop.siteUrl ?? shop.mapsUrl,
      address: {
        "@type": "PostalAddress",
        streetAddress: shop.address,
        addressLocality: index === shops.length - 1 ? "Manhattan Beach" : "El Segundo",
        addressRegion: "CA",
        postalCode: index === shops.length - 1 ? "90266" : "90245",
        addressCountry: "US"
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: shop.lat,
        longitude: shop.lon
      }
    }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/collabs.png", "jsonLd": jsonLd, "data-astro-cid-3ffaowfo": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="page" data-astro-cid-3ffaowfo> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-3ffaowfo> <a href="/" data-astro-cid-3ffaowfo>Home</a> <span aria-hidden="true" data-astro-cid-3ffaowfo>›</span> <a href="/collabs" data-astro-cid-3ffaowfo>collabs</a> <span aria-hidden="true" data-astro-cid-3ffaowfo>›</span> <span data-astro-cid-3ffaowfo>map</span> </nav> <header class="head" data-astro-cid-3ffaowfo> <p class="kicker mono" data-astro-cid-3ffaowfo>EL SEGUNDO · COFFEE FIELD MAP</p> <h1 class="title" data-astro-cid-3ffaowfo>Where to grab coffee near HQ.</h1> <p class="dek" data-astro-cid-3ffaowfo>\nA small South Bay coffee surface for PointCast collaborators: downtown El Segundo anchors,\n        the warehouse-pocket roasters, two weekday office-district fallbacks, and one easy North\n        Manhattan detour when you want to drift closer to the water.\n</p> <section class="meta-strip" aria-label="Map summary" data-astro-cid-3ffaowfo> <article class="meta-card" data-astro-cid-3ffaowfo> <span class="mono" data-astro-cid-3ffaowfo>Coverage</span> <strong data-astro-cid-3ffaowfo>6 dependable stops</strong> </article> <article class="meta-card" data-astro-cid-3ffaowfo> <span class="mono" data-astro-cid-3ffaowfo>Best cluster</span> <strong data-astro-cid-3ffaowfo>Downtown + Smoky Hollow</strong> </article> <article class="meta-card" data-astro-cid-3ffaowfo> <span class="mono" data-astro-cid-3ffaowfo>Last check</span> <strong data-astro-cid-3ffaowfo>April 20, 2026</strong> </article> </section> </header> <section class="bridge" data-astro-cid-3ffaowfo> <p class="bridge__kicker mono" data-astro-cid-3ffaowfo>CONNECTED SURFACE</p> <p class="bridge__copy" data-astro-cid-3ffaowfo>\nThis page hangs off <a href="/collabs" data-astro-cid-3ffaowfo>/collabs</a> as the concrete version of the\n        "HOST LOCAL" path: a small scouting surface for coffee shops that could plausibly anchor\n        future <a href="/tv" data-astro-cid-3ffaowfo>/tv</a> stations or feed the broader SoCal lens at <a href="/local" data-astro-cid-3ffaowfo>/local</a>.\n</p> </section> <section class="layout" aria-label="Coffee map and shortlist" data-astro-cid-3ffaowfo> <article class="panel" data-astro-cid-3ffaowfo> <div class="panel-head" data-astro-cid-3ffaowfo> <div data-astro-cid-3ffaowfo> <h2 data-astro-cid-3ffaowfo>Field plot</h2> <p data-astro-cid-3ffaowfo>Plotted from current Apple Maps place coordinates so the pins reflect real geography.</p> </div> <span class="mono" data-astro-cid-3ffaowfo>South Bay / near LAX</span> </div> <div class="map-wrap" data-astro-cid-3ffaowfo> <div class="map-frame" data-astro-cid-3ffaowfo> <svg class="map-svg" viewBox="0 0 640 650" role="img" aria-labelledby="map-title map-desc" data-astro-cid-3ffaowfo> <title id="map-title">Coffee shops around El Segundo</title> <desc id="map-desc" data-astro-cid-3ffaowfo>\nA stylized map showing six coffee shops around El Segundo and North Manhattan.\n</desc> <rect x="0" y="0" width="640" height="650" fill="#faf8f3" data-astro-cid-3ffaowfo></rect> <rect x="0" y="0" width="120" height="650" fill="#f4f8fc" data-astro-cid-3ffaowfo></rect> <g opacity="0.9" data-astro-cid-3ffaowfo> <line class="grid-stroke" x1="110" y1="70" x2="590" y2="70" data-astro-cid-3ffaowfo></line> <line class="grid-stroke" x1="110" y1="180" x2="590" y2="180" data-astro-cid-3ffaowfo></line> <line class="grid-stroke" x1="110" y1="290" x2="590" y2="290" data-astro-cid-3ffaowfo></line> <line class="grid-stroke" x1="110" y1="400" x2="590" y2="400" data-astro-cid-3ffaowfo></line> <line class="grid-stroke" x1="110" y1="510" x2="590" y2="510" data-astro-cid-3ffaowfo></line> <line class="grid-stroke" x1="170" y1="40" x2="170" y2="600" data-astro-cid-3ffaowfo></line> <line class="grid-stroke" x1="280" y1="40" x2="280" y2="600" data-astro-cid-3ffaowfo></line> <line class="grid-stroke" x1="390" y1="40" x2="390" y2="600" data-astro-cid-3ffaowfo></line> <line class="grid-stroke" x1="500" y1="40" x2="500" y2="600" data-astro-cid-3ffaowfo></line> </g> <g opacity="0.95" data-astro-cid-3ffaowfo> <path class="route-stroke" d="M 270 55 L 270 595" data-astro-cid-3ffaowfo></path> <path class="route-stroke" d="M 450 55 L 450 595" data-astro-cid-3ffaowfo></path> <path class="route-stroke" d="M 165 178 L 580 178" data-astro-cid-3ffaowfo></path> <path class="route-stroke" d="M 165 318 L 580 318" data-astro-cid-3ffaowfo></path> <path class="route-stroke" d="M 165 474 L 580 474" data-astro-cid-3ffaowfo></path> </g> <text class="road-label" x="279" y="64" transform="rotate(90 279 64)" data-astro-cid-3ffaowfo>Main / Sierra</text> <text class="road-label" x="459" y="54" transform="rotate(90 459 54)" data-astro-cid-3ffaowfo>Pacific Coast Hwy</text> <text class="road-label" x="176" y="171" data-astro-cid-3ffaowfo>Grand Ave</text> <text class="road-label" x="176" y="311" data-astro-cid-3ffaowfo>El Segundo Blvd</text> <text class="road-label" x="176" y="467" data-astro-cid-3ffaowfo>Manhattan Beach Blvd</text> <text class="region-label" x="30" y="325" transform="rotate(-90 30 325)" data-astro-cid-3ffaowfo>Pacific Ocean</text> <text class="region-label" x="170" y="128" data-astro-cid-3ffaowfo>Downtown El Segundo</text> <text class="region-label" x="170" y="258" data-astro-cid-3ffaowfo>Smoky Hollow</text> <text class="region-label" x="396" y="112" data-astro-cid-3ffaowfo>Sepulveda corridor</text> <text class="region-label" x="382" y="255" data-astro-cid-3ffaowfo>Continental district</text> <text class="region-label" x="170" y="582" data-astro-cid-3ffaowfo>North Manhattan</text> ', ' </svg> </div> <div class="map-legend" data-astro-cid-3ffaowfo> ', ' </div> <p class="map-note" data-astro-cid-3ffaowfo>\nThe downtown and Smoky Hollow stops are the easiest cluster to work into a normal El\n            Segundo day. The Sepulveda and Continental pins are more weekday-office energy.\n</p> </div> </article> <aside class="panel list-shell" data-astro-cid-3ffaowfo> <div class="list-head" data-astro-cid-3ffaowfo> <h2 data-astro-cid-3ffaowfo>Shortlist</h2> <p data-astro-cid-3ffaowfo>Click a card or map marker to focus a stop. Weekday-only office outposts are labeled clearly.</p> </div> <div class="shop-list" data-astro-cid-3ffaowfo> ', ` </div> </aside> </section> <section class="callout" data-astro-cid-3ffaowfo> <h2 data-astro-cid-3ffaowfo>How to use it</h2> <p data-astro-cid-3ffaowfo>
If you want the classic walkable El Segundo loop, start with Blue Butterfly on Main, hop east
        to Smoky Hollow on Sierra, then cut back toward Offset on Pacific Coast Highway. Save the PCT
        Towers and Continental locations for weekday meetings, and treat Two Guns as the clean
        southbound escape hatch.
</p> </section> <section class="related" data-astro-cid-3ffaowfo> <p class="related__label mono" data-astro-cid-3ffaowfo>RELATED</p> <ul class="related__list" data-astro-cid-3ffaowfo> <li data-astro-cid-3ffaowfo><a href="/collabs" data-astro-cid-3ffaowfo>/collabs</a></li> <li data-astro-cid-3ffaowfo><a href="/tv" data-astro-cid-3ffaowfo>/tv</a></li> <li data-astro-cid-3ffaowfo><a href="/local" data-astro-cid-3ffaowfo>/local</a></li> <li data-astro-cid-3ffaowfo><a href="/here" data-astro-cid-3ffaowfo>/here</a></li> </ul> </section> <p class="footer-note" data-astro-cid-3ffaowfo>
Data note: addresses, hours, and coordinates were cross-checked on April 20, 2026 against live
      Apple Maps place pages and shop sites where available. Office-district cafes can shift hours
      faster than the downtown anchors.
</p> </div> <script>
    (() => {
      const nodes = Array.from(document.querySelectorAll('[data-shop]'));

      function setActive(shopId) {
        nodes.forEach((node) => {
          node.classList.toggle('is-active', node.dataset.shop === shopId);
        });
      }

      nodes.forEach((node) => {
        const activate = () => setActive(node.dataset.shop || '');
        node.addEventListener('mouseenter', activate);
        node.addEventListener('focus', activate);
        node.addEventListener('click', activate);
        node.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activate();
          }
        });
      });
    })();
  <\/script> `])), maybeRenderHead(), plottedShops.map((shop, index) => renderTemplate`<g${addAttribute(["marker-button", { "is-active": index === 0 }], "class:list")}${addAttribute(shop.id, "data-shop")} tabindex="0" role="button"${addAttribute(`Focus ${shop.name}`, "aria-label")} data-astro-cid-3ffaowfo> <circle class="marker-ring"${addAttribute(shop.x, "cx")}${addAttribute(shop.y, "cy")} r="15" fill="white"${addAttribute(shop.color, "stroke")} stroke-width="1.5" data-astro-cid-3ffaowfo></circle> <circle class="marker-pip"${addAttribute(shop.x, "cx")}${addAttribute(shop.y, "cy")} r="8"${addAttribute(shop.color, "fill")} data-astro-cid-3ffaowfo></circle> <text class="marker-label"${addAttribute(shop.x, "x")}${addAttribute(shop.labelY, "y")} text-anchor="middle" data-astro-cid-3ffaowfo>${shop.name}</text> </g>`), zones.map((zone) => renderTemplate`<span class="legend-chip" data-astro-cid-3ffaowfo> <span class="legend-dot"${addAttribute(`--chip-color:${zone.color}`, "style")} data-astro-cid-3ffaowfo></span> ${zone.zone} </span>`), plottedShops.map((shop, index) => renderTemplate`<article${addAttribute(["shop-card", { "is-active": index === 0 }], "class:list")}${addAttribute(shop.id, "data-shop")}${addAttribute(shop.id, "id")} data-astro-cid-3ffaowfo> <div class="shop-topline" data-astro-cid-3ffaowfo> <div data-astro-cid-3ffaowfo> <p class="shop-zone mono" data-astro-cid-3ffaowfo>${shop.zone}</p> <h3 class="shop-name" data-astro-cid-3ffaowfo>${shop.name}</h3> </div> <span class="shop-type mono" data-astro-cid-3ffaowfo>${shop.type}</span> </div> <p class="shop-copy" data-astro-cid-3ffaowfo>${shop.note}</p> <p class="shop-address" data-astro-cid-3ffaowfo>${shop.address}</p> <p class="shop-hours" data-astro-cid-3ffaowfo>${shop.hours}</p> <div class="shop-links" data-astro-cid-3ffaowfo> <a${addAttribute(shop.mapsUrl, "href")} target="_blank" rel="noopener" data-astro-cid-3ffaowfo>Apple Maps</a> ${shop.siteUrl && renderTemplate`<a${addAttribute(shop.siteUrl, "href")} target="_blank" rel="noopener" data-astro-cid-3ffaowfo>Website</a>`} </div> </article>`)) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/collabs/map.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/collabs/map.astro";
const $$url = "/collabs/map";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Map,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
