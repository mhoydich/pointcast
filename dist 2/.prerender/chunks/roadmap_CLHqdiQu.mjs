import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { N as NOUNS_NATION_ROADMAP, a as aiToolingCurve, t as threeYearRoadmap, v as venueLadder, c as capitalGatesV2, n as ninetyDayMoves, r as roadmapGithubSignals, b as roadmapSources } from './nouns-nation-roadmap_7-j5yh2g.mjs';

const $$Roadmap = createComponent(($$result, $$props, $$slots) => {
  const title = "Nouns Nation Builder Roadmap V2";
  const description = "A three-year roadmap for taking Nouns Nation from web-native arena to agent-operated broadcast, TV-ready league, partner venues, and a live final format.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": "https://pointcast.xyz/nouns-nation/roadmap#roadmap",
    name: title,
    description,
    datePublished: "2026-04-29",
    dateModified: "2026-04-29",
    url: NOUNS_NATION_ROADMAP.url,
    inLanguage: "en-US",
    author: { "@id": "https://pointcast.xyz/#person" },
    publisher: { "@id": "https://pointcast.xyz/#org" },
    image: "https://pointcast.xyz/images/og/battle.png",
    associatedMedia: {
      "@type": "MediaObject",
      name: "Nouns Nation Builder Roadmap V2 deck",
      contentUrl: NOUNS_NATION_ROADMAP.deck,
      encodingFormat: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/battle.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/nouns-nation/roadmap.json", title: "Nouns Nation Builder Roadmap V2 JSON" },
    { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation", href: "/decks/nouns-nation-builder-roadmap-v2.pptx", title: "Nouns Nation Builder Roadmap V2 deck" }
  ], "frame": {
    image: "https://pointcast.xyz/images/og/battle.png",
    buttons: [
      { label: "Roadmap V2", action: "link", target: "https://pointcast.xyz/nouns-nation/roadmap" },
      { label: "Roadmap JSON", action: "link", target: "https://pointcast.xyz/nouns-nation/roadmap.json" },
      { label: "Pitch deck", action: "link", target: NOUNS_NATION_ROADMAP.deck },
      { label: "Nation hub", action: "link", target: "https://pointcast.xyz/nouns-nation/" }
    ]
  }, "data-astro-cid-mgm7btvw": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="roadmap" data-astro-cid-mgm7btvw> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-mgm7btvw> <a href="/" data-astro-cid-mgm7btvw>Home</a> <span aria-hidden="true" data-astro-cid-mgm7btvw>/</span> <a href="/nouns-nation/" data-astro-cid-mgm7btvw>Nouns Nation</a> <span aria-hidden="true" data-astro-cid-mgm7btvw>/</span> <span data-astro-cid-mgm7btvw>Roadmap V2</span> </nav> <section class="hero" aria-labelledby="roadmap-title" data-astro-cid-mgm7btvw> <div class="hero__copy" data-astro-cid-mgm7btvw> <p class="kicker" data-astro-cid-mgm7btvw>Roadmap V2 / ${NOUNS_NATION_ROADMAP.date}</p> <h1 id="roadmap-title" data-astro-cid-mgm7btvw>From browser room to stadium board.</h1> <p data-astro-cid-mgm7btvw>${NOUNS_NATION_ROADMAP.thesis}</p> <nav class="actions" aria-label="Roadmap actions" data-astro-cid-mgm7btvw> <a class="primary"${addAttribute(NOUNS_NATION_ROADMAP.deck, "href")} data-astro-cid-mgm7btvw>Pitch deck</a> <a href="/nouns-nation/roadmap.json" data-astro-cid-mgm7btvw>Roadmap JSON</a> <a href="/investment-thesis" data-astro-cid-mgm7btvw>Investment thesis</a> <a href="/nouns-nation/" data-astro-cid-mgm7btvw>Nation hub</a> </nav> </div> <figure class="hero__asset" data-astro-cid-mgm7btvw> <img src="/images/og/battle.png" alt="Nouns Nation battle broadcast graphic" width="1200" height="630" loading="eager" data-astro-cid-mgm7btvw> <figcaption data-astro-cid-mgm7btvw> ${NOUNS_NATION_ROADMAP.position} </figcaption> </figure> </section> <section class="ticker" aria-label="Roadmap ticker" data-astro-cid-mgm7btvw> <span data-astro-cid-mgm7btvw>V2</span> <p data-astro-cid-mgm7btvw>AI tools compress production cost.</p> <p data-astro-cid-mgm7btvw>Agents run the desk, not the whole culture.</p> <p data-astro-cid-mgm7btvw>TV is the next surface.</p> <p data-astro-cid-mgm7btvw>Venues are the first real-world wedge.</p> </section> <section class="section" id="ai-tools" aria-labelledby="ai-tools-title" data-astro-cid-mgm7btvw> <p class="eyebrow" data-astro-cid-mgm7btvw>AI Tool Curve</p> <h2 id="ai-tools-title" data-astro-cid-mgm7btvw>The tooling curve now favors tiny media studios.</h2> <div class="tool-curve" data-astro-cid-mgm7btvw> ${aiToolingCurve.map((item) => renderTemplate`<article data-astro-cid-mgm7btvw> <span data-astro-cid-mgm7btvw>${item.period}</span> <h3 data-astro-cid-mgm7btvw>${item.title}</h3> <p data-astro-cid-mgm7btvw>${item.signal}</p> <strong data-astro-cid-mgm7btvw>${item.implication}</strong> </article>`)} </div> </section> <section class="section" id="roadmap" aria-labelledby="three-year-title" data-astro-cid-mgm7btvw> <p class="eyebrow" data-astro-cid-mgm7btvw>Three Year Roadmap</p> <h2 id="three-year-title" data-astro-cid-mgm7btvw>A staged path from ritual to broadcast asset.</h2> <div class="year-stack" data-astro-cid-mgm7btvw> ${threeYearRoadmap.map((year) => renderTemplate`<article data-astro-cid-mgm7btvw> <div class="year-mark" data-astro-cid-mgm7btvw> <span data-astro-cid-mgm7btvw>${year.year}</span> <strong data-astro-cid-mgm7btvw>${year.calendar}</strong> </div> <div data-astro-cid-mgm7btvw> <h3 data-astro-cid-mgm7btvw>${year.title}</h3> <p data-astro-cid-mgm7btvw>${year.headline}</p> <div class="roadmap-cols" data-astro-cid-mgm7btvw> <div data-astro-cid-mgm7btvw> <span data-astro-cid-mgm7btvw>Public surfaces</span> <ul data-astro-cid-mgm7btvw> ${year.publicSurfaces.map((item) => renderTemplate`<li data-astro-cid-mgm7btvw>${item}</li>`)} </ul> </div> <div data-astro-cid-mgm7btvw> <span data-astro-cid-mgm7btvw>Build</span> <ul data-astro-cid-mgm7btvw> ${year.build.map((item) => renderTemplate`<li data-astro-cid-mgm7btvw>${item}</li>`)} </ul> </div> <div data-astro-cid-mgm7btvw> <span data-astro-cid-mgm7btvw>Gates</span> <ul data-astro-cid-mgm7btvw> ${year.gates.map((item) => renderTemplate`<li data-astro-cid-mgm7btvw>${item}</li>`)} </ul> </div> </div> </div> </article>`)} </div> </section> <section class="section ladder" id="venues" aria-labelledby="venue-title" data-astro-cid-mgm7btvw> <div data-astro-cid-mgm7btvw> <p class="eyebrow" data-astro-cid-mgm7btvw>Venue Ladder</p> <h2 id="venue-title" data-astro-cid-mgm7btvw>The product should climb screens before it climbs cap tables.</h2> <p data-astro-cid-mgm7btvw>
The browser proves repeat behavior. TV proves social viewing.
          Partner venues prove local demand. Stadiums only matter after the
          runbook survives without founder-only magic.
</p> </div> <div class="ladder__steps" data-astro-cid-mgm7btvw> ${venueLadder.map((item, index) => renderTemplate`<article data-astro-cid-mgm7btvw> <span data-astro-cid-mgm7btvw>${String(index + 1).padStart(2, "0")}</span> <h3 data-astro-cid-mgm7btvw>${item.stage}</h3> <p data-astro-cid-mgm7btvw>${item.body}</p> </article>`)} </div> </section> <section class="section split" id="capital" aria-labelledby="capital-title" data-astro-cid-mgm7btvw> <div data-astro-cid-mgm7btvw> <p class="eyebrow" data-astro-cid-mgm7btvw>Capital Gates</p> <h2 id="capital-title" data-astro-cid-mgm7btvw>Tranche the money to proof, not vibes.</h2> <p data-astro-cid-mgm7btvw>
The capital plan stays milestone-gated. Fund the operating surface,
          then expand only when the audience, agents, and sponsor loop show
          they can repeat.
</p> </div> <div class="gate-list" data-astro-cid-mgm7btvw> ${capitalGatesV2.map((gate) => renderTemplate`<article data-astro-cid-mgm7btvw> <span data-astro-cid-mgm7btvw>${gate.gate}</span> <strong data-astro-cid-mgm7btvw>${gate.amount}</strong> <p data-astro-cid-mgm7btvw>${gate.unlock}</p> </article>`)} </div> </section> <section class="section" id="ninety" aria-labelledby="ninety-title" data-astro-cid-mgm7btvw> <p class="eyebrow" data-astro-cid-mgm7btvw>Next 90 Days</p> <h2 id="ninety-title" data-astro-cid-mgm7btvw>The first proof window is simple and public.</h2> <div class="move-grid" data-astro-cid-mgm7btvw> ${ninetyDayMoves.map((move) => renderTemplate`<article data-astro-cid-mgm7btvw> <span data-astro-cid-mgm7btvw>${move.window}</span> <p data-astro-cid-mgm7btvw>${move.move}</p> </article>`)} </div> </section> <section class="section" id="github" aria-labelledby="github-title" data-astro-cid-mgm7btvw> <p class="eyebrow" data-astro-cid-mgm7btvw>GitHub Receipts</p> <h2 id="github-title" data-astro-cid-mgm7btvw>Latest main was checked before V2.</h2> <div class="github-grid" data-astro-cid-mgm7btvw> ${roadmapGithubSignals.map((signal) => renderTemplate`<article data-astro-cid-mgm7btvw> <span data-astro-cid-mgm7btvw>${signal.label}</span> <h3 data-astro-cid-mgm7btvw>${signal.title}</h3> <p data-astro-cid-mgm7btvw>${signal.body}</p> <a${addAttribute(signal.url, "href")} data-astro-cid-mgm7btvw>Open commit</a> </article>`)} </div> </section> <section class="section sources" id="sources" aria-labelledby="sources-title" data-astro-cid-mgm7btvw> <p class="eyebrow" data-astro-cid-mgm7btvw>Sources</p> <h2 id="sources-title" data-astro-cid-mgm7btvw>Roadmap assumptions.</h2> <div class="source-grid" data-astro-cid-mgm7btvw> ${roadmapSources.map((source) => renderTemplate`<a${addAttribute(source.url, "href")} data-astro-cid-mgm7btvw> <strong data-astro-cid-mgm7btvw>${source.label}</strong> <span data-astro-cid-mgm7btvw>${source.note}</span> </a>`)} </div> <p class="disclaimer" data-astro-cid-mgm7btvw>
Strategic roadmap only. Not personalized financial advice, a public
        securities offering, or legal advice. Token, DAO, revenue-share, and
        collectible mechanics need counsel before launch.
</p> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation/roadmap.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation/roadmap.astro";
const $$url = "/nouns-nation/roadmap";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Roadmap,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
