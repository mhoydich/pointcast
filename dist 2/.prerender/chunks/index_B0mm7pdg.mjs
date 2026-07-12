import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, u as unescapeHTML, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const title = "University of El Segundo";
  const description = "UES — a small, unaccredited, place-based curriculum at pointcast.xyz. Each Track is a field study in some aspect of the town. The classroom is the town itself.";
  const tracks = [
    {
      code: "UES-05",
      slug: "/ues/track-05",
      title: "The Rebuildable Town",
      subtitle: "A field study in inhabitable software",
      weeks: 6,
      status: "live",
      blurb: "Six lessons drawn from one Sunday of building. Block IDs as commitments. Spells, not buttons. The visiting handbook. The hourly cron. Garbage collection as care. Geocities + sim city. The classroom is the town itself.",
      fieldTrips: [
        { week: 1, theme: "Block IDs are Monotonic", href: "/blocks.json" },
        { week: 2, theme: "Spells, not Buttons", href: "/spells" },
        { week: 3, theme: "The Visiting Handbook", href: "/handshakes" },
        { week: 4, theme: "The Hourly Cron" },
        { week: 5, theme: "Garbage Collection as Care" },
        { week: 6, theme: "Geocities + SimCity", href: "/rooms" }
      ]
    }
  ];
  const forthcoming = [
    { code: "UES-04", title: "Civic Layer", note: "Lives at /civic-layer pending re-shelving under /ues" },
    { code: "UES-01", title: "Inaugural — TBD", note: "Track 01-03 reserved for back-fill if useful" }
  ];
  const facultyNotes = [
    "No tuition. No accreditation. No degree.",
    "Tracks are open enrollment — read the page, do the field trip, write the Block.",
    "The library is /blocks.json. The transcript is /handshakes.",
    "If a Track grows, it splits. If a Track decays, it gets archived but its address (UES-NN) stays monotonic."
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": "https://pointcast.xyz/ues",
    name: "University of El Segundo",
    description,
    address: { "@type": "PostalAddress", addressLocality: "El Segundo", addressRegion: "CA" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "UES Tracks",
      itemListElement: tracks.map((t, i) => ({
        "@type": "Course",
        position: i + 1,
        courseCode: t.code,
        name: t.title,
        description: t.blurb,
        url: `https://pointcast.xyz${t.slug}`
      }))
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "data-astro-cid-x3otn6xw": true }, { "default": ($$result2) => renderTemplate`  ${maybeRenderHead()}<article class="ues-hub" data-astro-cid-x3otn6xw> <header class="banner" data-astro-cid-x3otn6xw> <div class="banner-meta" data-astro-cid-x3otn6xw> <span data-astro-cid-x3otn6xw>UES</span> <span class="dot" data-astro-cid-x3otn6xw>·</span> <span data-astro-cid-x3otn6xw>EST. 2026 · EL SEGUNDO, CA</span> <span class="dot" data-astro-cid-x3otn6xw>·</span> <span data-astro-cid-x3otn6xw>UNACCREDITED</span> </div> <h1 data-astro-cid-x3otn6xw>University of El Segundo</h1> <p class="dek" data-astro-cid-x3otn6xw>
A small, place-based curriculum at pointcast.xyz. Each Track is a field study in some aspect
        of the town. The classroom is the town itself. The library is <a href="/blocks.json" data-astro-cid-x3otn6xw>/blocks.json</a>.
        The transcript is <a href="/handshakes" data-astro-cid-x3otn6xw>/handshakes</a>. There is no tuition.
</p> </header> <section class="tracks" data-astro-cid-x3otn6xw> <h2 data-astro-cid-x3otn6xw>tracks · live</h2> <ol class="track-list" data-astro-cid-x3otn6xw> ${tracks.map((t) => renderTemplate`<li class="track" data-astro-cid-x3otn6xw> <div class="track-meta" data-astro-cid-x3otn6xw> <span class="track-code" data-astro-cid-x3otn6xw>${t.code}</span> <span class="track-weeks" data-astro-cid-x3otn6xw>${t.weeks} weeks</span> <span class="track-status track-status--live" data-astro-cid-x3otn6xw>${t.status}</span> </div> <h3 class="track-title" data-astro-cid-x3otn6xw><a${addAttribute(t.slug, "href")} data-astro-cid-x3otn6xw>${t.title}</a></h3> <p class="track-subtitle" data-astro-cid-x3otn6xw>${t.subtitle}</p> <p class="track-blurb" data-astro-cid-x3otn6xw>${t.blurb}</p> <details class="track-trips" data-astro-cid-x3otn6xw> <summary data-astro-cid-x3otn6xw>field trips (${t.fieldTrips.length})</summary> <ul data-astro-cid-x3otn6xw> ${t.fieldTrips.map((ft) => renderTemplate`<li data-astro-cid-x3otn6xw> <span class="trip-week" data-astro-cid-x3otn6xw>week ${ft.week}</span> <span class="trip-theme" data-astro-cid-x3otn6xw>${ft.theme}</span> ${ft.href && renderTemplate`<span class="trip-link" data-astro-cid-x3otn6xw>→ <a${addAttribute(ft.href, "href")} data-astro-cid-x3otn6xw>${ft.href}</a></span>`} </li>`)} </ul> </details> <p class="track-cta" data-astro-cid-x3otn6xw><a${addAttribute(t.slug, "href")} data-astro-cid-x3otn6xw>open ${t.code} →</a></p> </li>`)} </ol> </section> <section class="tracks" data-astro-cid-x3otn6xw> <h2 data-astro-cid-x3otn6xw>tracks · forthcoming</h2> <ul class="forthcoming" data-astro-cid-x3otn6xw> ${forthcoming.map((t) => renderTemplate`<li data-astro-cid-x3otn6xw> <span class="track-code" data-astro-cid-x3otn6xw>${t.code}</span> <span class="forth-title" data-astro-cid-x3otn6xw>${t.title}</span> <span class="forth-note" data-astro-cid-x3otn6xw>${t.note}</span> </li>`)} </ul> </section> <section class="faculty" data-astro-cid-x3otn6xw> <h2 data-astro-cid-x3otn6xw>faculty notes</h2> <ul class="faculty-list" data-astro-cid-x3otn6xw> ${facultyNotes.map((n) => renderTemplate`<li data-astro-cid-x3otn6xw>${n}</li>`)} </ul> </section> <footer class="signoff" data-astro-cid-x3otn6xw> <p data-astro-cid-x3otn6xw>— ues, anchored in el segundo, 2026</p> <nav class="footnav" data-astro-cid-x3otn6xw> <a href="/ues/track-05" data-astro-cid-x3otn6xw>UES-05 · The Rebuildable Town</a> <a href="/explore" data-astro-cid-x3otn6xw>/explore — directory</a> <a href="/rooms" data-astro-cid-x3otn6xw>/rooms — town hub</a> <a href="/handshakes" data-astro-cid-x3otn6xw>/handshakes — receipts</a> </nav> </footer> </article> `, "head": ($$result2) => renderTemplate(_a || (_a = __template(['<script type="application/ld+json">', "<\/script>"])), unescapeHTML(JSON.stringify(jsonLd))) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/ues/index.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/ues/index.astro";
const $$url = "/ues";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
