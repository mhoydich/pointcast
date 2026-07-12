import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { I as INVESTMENT_THESIS, a as INVESTMENT_THESIS_VERSION, t as thesisPillars, w as whyNow, c as capitalPlan, r as returnPaths, g as githubSignals, b as risks, d as diligencePlan, e as thesisSources } from './investment-thesis_CTV1v6SD.mjs';
import { N as NOUNS_NATION_ROADMAP, t as threeYearRoadmap } from './nouns-nation-roadmap_7-j5yh2g.mjs';

const $$InvestmentThesis = createComponent(($$result, $$props, $$slots) => {
  const title = "Nouns Nation Builder investment thesis V2";
  const description = INVESTMENT_THESIS.summary;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": "https://pointcast.xyz/investment-thesis#article",
    headline: "Nouns Nation Builder investment thesis V2",
    description,
    datePublished: "2026-04-29",
    dateModified: "2026-04-29",
    url: "https://pointcast.xyz/investment-thesis",
    inLanguage: "en-US",
    author: { "@id": "https://pointcast.xyz/#person" },
    publisher: { "@id": "https://pointcast.xyz/#org" },
    image: "https://pointcast.xyz/images/og/battle.png",
    about: [
      "Nouns DAO",
      "Nouns Builder",
      "agent-native media",
      "Model Context Protocol",
      "Nouns Nation Battler",
      "AI agents"
    ],
    mainEntityOfPage: "https://pointcast.xyz/investment-thesis"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/battle.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/investment-thesis.json", title: "Nouns Nation Builder investment thesis JSON" },
    { type: "application/json", href: "/nouns-nation/roadmap.json", title: "Nouns Nation Builder Roadmap V2 JSON" },
    { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation", href: "/decks/nouns-nation-builder-roadmap-v2.pptx", title: "Nouns Nation Builder Roadmap V2 deck" },
    { type: "application/json", href: "/nouns-nation-battler-agents.json", title: "Nouns Nation Battler Agent Bench JSON" }
  ], "frame": {
    image: "https://pointcast.xyz/images/og/battle.png",
    buttons: [
      { label: "Read thesis", action: "link", target: "https://pointcast.xyz/investment-thesis" },
      { label: "Roadmap V2", action: "link", target: NOUNS_NATION_ROADMAP.url },
      { label: "Pitch deck", action: "link", target: NOUNS_NATION_ROADMAP.deck },
      { label: "Thesis JSON", action: "link", target: "https://pointcast.xyz/investment-thesis.json" },
      { label: "Nation Hub", action: "link", target: "https://pointcast.xyz/nouns-nation/" }
    ]
  }, "data-astro-cid-uohkn7pr": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="thesis" data-astro-cid-uohkn7pr> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-uohkn7pr> <a href="/" data-astro-cid-uohkn7pr>Home</a> <span aria-hidden="true" data-astro-cid-uohkn7pr>/</span> <a href="/nouns-nation/" data-astro-cid-uohkn7pr>Nouns Nation</a> <span aria-hidden="true" data-astro-cid-uohkn7pr>/</span> <span data-astro-cid-uohkn7pr>Investment thesis</span> </nav> <section class="hero" aria-labelledby="thesis-title" data-astro-cid-uohkn7pr> <div class="hero__copy" data-astro-cid-uohkn7pr> <p class="kicker" data-astro-cid-uohkn7pr>Investor memo / ${INVESTMENT_THESIS_VERSION}</p> <h1 id="thesis-title" data-astro-cid-uohkn7pr>Nouns Nation Builder V2.</h1> <p class="dek" data-astro-cid-uohkn7pr>${INVESTMENT_THESIS.summary}</p> <dl class="hero__stats" aria-label="Investment summary" data-astro-cid-uohkn7pr> <div data-astro-cid-uohkn7pr><dt data-astro-cid-uohkn7pr>${INVESTMENT_THESIS.allocation.firstCheck.split(" ")[0]}</dt><dd data-astro-cid-uohkn7pr>first check floor</dd></div> <div data-astro-cid-uohkn7pr><dt data-astro-cid-uohkn7pr>$250k</dt><dd data-astro-cid-uohkn7pr>first tranche ceiling</dd></div> <div data-astro-cid-uohkn7pr><dt data-astro-cid-uohkn7pr>90</dt><dd data-astro-cid-uohkn7pr>day proof window</dd></div> </dl> <div class="actions" aria-label="Thesis actions" data-astro-cid-uohkn7pr> <a href="/nouns-nation/roadmap" data-astro-cid-uohkn7pr>3-year roadmap</a> <a${addAttribute(NOUNS_NATION_ROADMAP.deck, "href")} data-astro-cid-uohkn7pr>Pitch deck</a> <a href="#capital" data-astro-cid-uohkn7pr>Capital plan</a> <a href="/nouns-nation/" data-astro-cid-uohkn7pr>Nation hub</a> <a href="/investment-thesis.json" data-astro-cid-uohkn7pr>JSON mirror</a> </div> </div> <aside class="hero__asset" aria-label="Nouns visual and investor terminal" data-astro-cid-uohkn7pr> <figure class="noun-card" data-astro-cid-uohkn7pr> <img src="https://noun.pics/421.svg" alt="Noun 421 from the Nouns CC0 artwork set" width="420" height="420" loading="eager" data-astro-cid-uohkn7pr> <figcaption data-astro-cid-uohkn7pr>Actual Nouns CC0 art as the cultural primitive.</figcaption> </figure> <div class="terminal" aria-label="Investment terminal" data-astro-cid-uohkn7pr> <span data-astro-cid-uohkn7pr>asset: nouns nation builder</span> <span data-astro-cid-uohkn7pr>edge: cc0 culture + agent labor</span> <span data-astro-cid-uohkn7pr>surface: tv, venues, json, mcp</span> <span data-astro-cid-uohkn7pr>risk: governance + retention + legal</span> <strong data-astro-cid-uohkn7pr>decision: fund in tranches</strong> </div> </aside> </section> <section class="ticker" aria-label="Investment wire" data-astro-cid-uohkn7pr> <span data-astro-cid-uohkn7pr>Nouns Builder makes nounish DAOs easier to deploy.</span> <span data-astro-cid-uohkn7pr>Agents need readable venues, manifests, tasks, and tools.</span> <span data-astro-cid-uohkn7pr>PointCast GitHub now shows Battle Desk V3, Nouns Nation, co-presence, press catalog, and V2 roadmap receipts.</span> <span data-astro-cid-uohkn7pr>Invest in the operating system, not only a one-off game.</span> </section> <section class="section" id="memo" aria-labelledby="memo-title" data-astro-cid-uohkn7pr> <p class="eyebrow" data-astro-cid-uohkn7pr>Memo</p> <h2 id="memo-title" data-astro-cid-uohkn7pr>The one-screen thesis.</h2> <div class="pillar-grid" data-astro-cid-uohkn7pr> ${thesisPillars.map((item) => renderTemplate`<article data-astro-cid-uohkn7pr> <h3 data-astro-cid-uohkn7pr>${item.title}</h3> <p data-astro-cid-uohkn7pr>${item.body}</p> </article>`)} </div> </section> <section class="section" id="why-now" aria-labelledby="why-now-title" data-astro-cid-uohkn7pr> <p class="eyebrow" data-astro-cid-uohkn7pr>Why Now</p> <h2 id="why-now-title" data-astro-cid-uohkn7pr>The timing is suddenly less theoretical.</h2> <div class="why-grid" data-astro-cid-uohkn7pr> ${whyNow.map((item) => renderTemplate`<article data-astro-cid-uohkn7pr> <h3 data-astro-cid-uohkn7pr>${item.title}</h3> <p data-astro-cid-uohkn7pr>${item.body}</p> </article>`)} </div> </section> <section class="section" id="roadmap" aria-labelledby="roadmap-title" data-astro-cid-uohkn7pr> <p class="eyebrow" data-astro-cid-uohkn7pr>Roadmap V2</p> <h2 id="roadmap-title" data-astro-cid-uohkn7pr>The upside is a venue ladder, not a token first.</h2> <p class="section-lede" data-astro-cid-uohkn7pr>
The attached roadmap runs from browser room to living-room TV, then to
        partner venues, and finally to a ticketed live final format. It follows
        the progress of agent building tools: agents lower the operating cost
        of scorekeeping, highlights, recaps, QA, sponsor inventory, and
        machine-readable distribution.
</p> <div class="roadmap-grid" data-astro-cid-uohkn7pr> ${threeYearRoadmap.map((year) => renderTemplate`<article data-astro-cid-uohkn7pr> <span data-astro-cid-uohkn7pr>${year.calendar}</span> <h3 data-astro-cid-uohkn7pr>${year.title}</h3> <p data-astro-cid-uohkn7pr>${year.headline}</p> <a href="/nouns-nation/roadmap" data-astro-cid-uohkn7pr>Open roadmap</a> </article>`)} </div> </section> <section class="section split" id="capital" aria-labelledby="capital-title" data-astro-cid-uohkn7pr> <div data-astro-cid-uohkn7pr> <p class="eyebrow" data-astro-cid-uohkn7pr>Capital</p> <h2 id="capital-title" data-astro-cid-uohkn7pr>Fund the venue, prove the ritual, delay the token.</h2> <p data-astro-cid-uohkn7pr>
I would not start by selling a DAO token or promising collectible upside.
          I would fund product velocity, distribution, and agent task quality first,
          while stacking credits, sponsors, and ecosystem grants around the work.
</p> </div> <div class="stack-list" data-astro-cid-uohkn7pr> ${capitalPlan.map((item) => renderTemplate`<article data-astro-cid-uohkn7pr> <span data-astro-cid-uohkn7pr>${item.label}</span> <p data-astro-cid-uohkn7pr>${item.body}</p> </article>`)} </div> </section> <section class="section" aria-labelledby="returns-title" data-astro-cid-uohkn7pr> <p class="eyebrow" data-astro-cid-uohkn7pr>Return Paths</p> <h2 id="returns-title" data-astro-cid-uohkn7pr>Three ways the capital can come back.</h2> <div class="return-grid" data-astro-cid-uohkn7pr> ${returnPaths.map((item) => renderTemplate`<article data-astro-cid-uohkn7pr> <span data-astro-cid-uohkn7pr>${item.label}</span> <p data-astro-cid-uohkn7pr>${item.body}</p> </article>`)} </div> </section> <section class="section" id="github" aria-labelledby="github-title" data-astro-cid-uohkn7pr> <p class="eyebrow" data-astro-cid-uohkn7pr>GitHub Read</p> <h2 id="github-title" data-astro-cid-uohkn7pr>Latest signals checked before publishing.</h2> <div class="github-grid" data-astro-cid-uohkn7pr> ${githubSignals.map((item) => renderTemplate`<article data-astro-cid-uohkn7pr> <span data-astro-cid-uohkn7pr>${item.label}</span> <h3 data-astro-cid-uohkn7pr>${item.title}</h3> <p data-astro-cid-uohkn7pr>${item.body}</p> <a${addAttribute(item.url, "href")} data-astro-cid-uohkn7pr>Open source</a> </article>`)} </div> </section> <section class="section" id="risks" aria-labelledby="risks-title" data-astro-cid-uohkn7pr> <p class="eyebrow" data-astro-cid-uohkn7pr>Risk Register</p> <h2 id="risks-title" data-astro-cid-uohkn7pr>The investment case fails if these stay unresolved.</h2> <div class="risk-list" data-astro-cid-uohkn7pr> ${risks.map((item) => renderTemplate`<article data-astro-cid-uohkn7pr> <h3 data-astro-cid-uohkn7pr>${item.title}</h3> <p data-astro-cid-uohkn7pr>${item.body}</p> </article>`)} </div> </section> <section class="section" id="diligence" aria-labelledby="diligence-title" data-astro-cid-uohkn7pr> <p class="eyebrow" data-astro-cid-uohkn7pr>Diligence</p> <h2 id="diligence-title" data-astro-cid-uohkn7pr>A 90-day proof plan.</h2> <div class="diligence-grid" data-astro-cid-uohkn7pr> ${diligencePlan.map((item) => renderTemplate`<article data-astro-cid-uohkn7pr> <span data-astro-cid-uohkn7pr>${item.window}</span> <p data-astro-cid-uohkn7pr>${item.body}</p> </article>`)} </div> </section> <section class="section sources" id="sources" aria-labelledby="sources-title" data-astro-cid-uohkn7pr> <p class="eyebrow" data-astro-cid-uohkn7pr>Sources</p> <h2 id="sources-title" data-astro-cid-uohkn7pr>Checked sources.</h2> <div class="source-grid" data-astro-cid-uohkn7pr> ${thesisSources.map((source) => renderTemplate`<a${addAttribute(source.url, "href")} data-astro-cid-uohkn7pr> <strong data-astro-cid-uohkn7pr>${source.label}</strong> <span data-astro-cid-uohkn7pr>${source.note}</span> </a>`)} </div> <p class="disclaimer" data-astro-cid-uohkn7pr>
This is a strategic investment memo, not personalized financial advice,
        a public securities offering, or legal advice. Any token, DAO,
        revenue-share, or collectible structure needs counsel before launch.
</p> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/investment-thesis.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/investment-thesis.astro";
const $$url = "/investment-thesis";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$InvestmentThesis,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
