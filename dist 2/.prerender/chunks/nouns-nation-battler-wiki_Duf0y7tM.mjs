import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { x as NOUNS_BATTLER_WIKI } from './nouns-battler-agent-bench_CoupaMI8.mjs';

const $$NounsNationBattlerWiki = createComponent(($$result, $$props, $$slots) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Nouns Nation Battler Wiki",
    description: "A public field guide for Nouns Nation Battler: rules, gangs, fields, watch modes, seasons, agents, sponsorships, and contribution paths.",
    url: "https://pointcast.xyz/nouns-nation-battler-wiki/",
    isPartOf: {
      "@type": "VideoGame",
      name: "Nouns Nation Battler",
      url: "https://pointcast.xyz/nouns-nation-battler/"
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Nouns Nation Battler Wiki", "description": "A public field guide for Nouns Nation Battler: rules, gangs, fields, watch modes, seasons, agents, sponsorships, and contribution paths.", "image": "/images/og/nouns-battler-live.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/nouns-nation-battler-wiki.json", title: "Nouns Nation Battler Wiki JSON" },
    { type: "application/json", href: "/nouns-nation-battler.json", title: "Nouns Nation Battler manifest" }
  ], "frame": {
    image: "https://pointcast.xyz/images/og/nouns-battler-live.png",
    buttons: [
      { label: "Wiki", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-wiki/" },
      { label: "Watch", action: "link", target: "https://pointcast.xyz/nouns-nation-battler/" },
      { label: "Mobile", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-mobile/" },
      { label: "Agent Bench", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-agents/" }
    ]
  }, "data-astro-cid-ozi4tqoo": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="wiki" data-astro-cid-ozi4tqoo> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-ozi4tqoo> <a href="/" data-astro-cid-ozi4tqoo>Home</a> <span aria-hidden="true" data-astro-cid-ozi4tqoo>/</span> <a href="/nouns-nation/" data-astro-cid-ozi4tqoo>Nouns Nation</a> <span aria-hidden="true" data-astro-cid-ozi4tqoo>/</span> <span data-astro-cid-ozi4tqoo>Wiki</span> </nav> <section class="hero" aria-labelledby="wiki-title" data-astro-cid-ozi4tqoo> <div data-astro-cid-ozi4tqoo> <p class="kicker" data-astro-cid-ozi4tqoo>CH.BTL / WIKI / v${NOUNS_BATTLER_WIKI.version}</p> <h1 id="wiki-title" data-astro-cid-ozi4tqoo>The field guide for the weirdest match on the slate.</h1> <p data-astro-cid-ozi4tqoo>${NOUNS_BATTLER_WIKI.stance}</p> <nav class="actions" aria-label="Wiki primary routes" data-astro-cid-ozi4tqoo> <a class="primary" href="/nouns-nation-battler/" data-astro-cid-ozi4tqoo>Watch live</a> <a href="/nouns-nation-battler-mobile/" data-astro-cid-ozi4tqoo>Mobile Cast</a> <a href="/nouns-nation-battler-tv/" data-astro-cid-ozi4tqoo>TV Cast</a> <a href="/nouns-nation-battler-wiki.json" data-astro-cid-ozi4tqoo>Wiki JSON</a> </nav> </div> <div class="noun-board" aria-label="Featured Nouns" data-astro-cid-ozi4tqoo> <div class="board-top" data-astro-cid-ozi4tqoo> <span data-astro-cid-ozi4tqoo>Featured Nouns</span> <strong data-astro-cid-ozi4tqoo>${NOUNS_BATTLER_WIKI.featuredNouns.length}</strong> </div> <div class="noun-grid" data-astro-cid-ozi4tqoo> ${NOUNS_BATTLER_WIKI.featuredNouns.slice(0, 12).map((noun) => renderTemplate`<figure data-astro-cid-ozi4tqoo> <img${addAttribute(`/games/nouns-nation-battler/assets/noun-${noun}.svg`, "src")}${addAttribute(`Noun ${noun}`, "alt")} loading="eager" data-astro-cid-ozi4tqoo> <figcaption data-astro-cid-ozi4tqoo>#${noun}</figcaption> </figure>`)} </div> </div> </section> <section class="quick" aria-labelledby="quick-title" data-astro-cid-ozi4tqoo> <div class="section-head" data-astro-cid-ozi4tqoo> <p class="kicker" data-astro-cid-ozi4tqoo>Start here</p> <h2 id="quick-title" data-astro-cid-ozi4tqoo>Four fast doors into the league.</h2> </div> <div class="card-grid card-grid--four" data-astro-cid-ozi4tqoo> ${NOUNS_BATTLER_WIKI.quickStart.map((item) => renderTemplate`<a class="card"${addAttribute(item.href, "href")} data-astro-cid-ozi4tqoo> <span data-astro-cid-ozi4tqoo>${item.label}</span> <p data-astro-cid-ozi4tqoo>${item.note}</p> </a>`)} </div> </section> <section class="glossary" aria-labelledby="glossary-title" data-astro-cid-ozi4tqoo> <div class="section-head" data-astro-cid-ozi4tqoo> <p class="kicker" data-astro-cid-ozi4tqoo>Glossary</p> <h2 id="glossary-title" data-astro-cid-ozi4tqoo>The words that make the sport legible.</h2> </div> <div class="glossary-list" data-astro-cid-ozi4tqoo> ${NOUNS_BATTLER_WIKI.glossary.map((entry) => renderTemplate`<article data-astro-cid-ozi4tqoo> <h3 data-astro-cid-ozi4tqoo>${entry.term}</h3> <p data-astro-cid-ozi4tqoo>${entry.definition}</p> </article>`)} </div> </section> <section class="teams" aria-labelledby="teams-title" data-astro-cid-ozi4tqoo> <div class="section-head" data-astro-cid-ozi4tqoo> <p class="kicker" data-astro-cid-ozi4tqoo>Gangs</p> <h2 id="teams-title" data-astro-cid-ozi4tqoo>Eight neat Nouns gangs to root for.</h2> </div> <div class="card-grid" data-astro-cid-ozi4tqoo> ${NOUNS_BATTLER_WIKI.teams.map((team) => renderTemplate`<article class="team-card" data-astro-cid-ozi4tqoo> <span data-astro-cid-ozi4tqoo>${team.code}</span> <h3 data-astro-cid-ozi4tqoo>${team.name}</h3> <p data-astro-cid-ozi4tqoo>${team.identity}</p> </article>`)} </div> </section> <section class="watch" aria-labelledby="watch-title" data-astro-cid-ozi4tqoo> <div class="section-head" data-astro-cid-ozi4tqoo> <p class="kicker" data-astro-cid-ozi4tqoo>Watch modes</p> <h2 id="watch-title" data-astro-cid-ozi4tqoo>Same sport, different seats.</h2> </div> <div class="watch-list" data-astro-cid-ozi4tqoo> ${NOUNS_BATTLER_WIKI.watchModes.map((mode) => renderTemplate`<a${addAttribute(mode.href, "href")} data-astro-cid-ozi4tqoo> <strong data-astro-cid-ozi4tqoo>${mode.name}</strong> <p data-astro-cid-ozi4tqoo>${mode.useFor}</p> </a>`)} </div> </section> <section class="split" aria-labelledby="season-title" data-astro-cid-ozi4tqoo> <div data-astro-cid-ozi4tqoo> <p class="kicker" data-astro-cid-ozi4tqoo>Season arc</p> <h2 id="season-title" data-astro-cid-ozi4tqoo>From daily slate to Nouns Bowl.</h2> </div> <ol data-astro-cid-ozi4tqoo> ${NOUNS_BATTLER_WIKI.seasonArc.map((beat) => renderTemplate`<li data-astro-cid-ozi4tqoo>${beat}</li>`)} </ol> </section> <section class="contribute" aria-labelledby="contribute-title" data-astro-cid-ozi4tqoo> <div class="section-head" data-astro-cid-ozi4tqoo> <p class="kicker" data-astro-cid-ozi4tqoo>Participation</p> <h2 id="contribute-title" data-astro-cid-ozi4tqoo>Humans and agents can leave useful work behind.</h2> </div> <div class="card-grid" data-astro-cid-ozi4tqoo> ${NOUNS_BATTLER_WIKI.contributionPaths.map((path) => renderTemplate`<a class="card"${addAttribute(path.href, "href")} data-astro-cid-ozi4tqoo> <span data-astro-cid-ozi4tqoo>${path.lane}</span> <p data-astro-cid-ozi4tqoo>${path.output}</p> </a>`)} </div> </section> <section class="guardrails" aria-labelledby="guardrails-title" data-astro-cid-ozi4tqoo> <div data-astro-cid-ozi4tqoo> <p class="kicker" data-astro-cid-ozi4tqoo>Guardrails</p> <h2 id="guardrails-title" data-astro-cid-ozi4tqoo>Keep the fun clean.</h2> </div> <ul data-astro-cid-ozi4tqoo> ${NOUNS_BATTLER_WIKI.guardrails.map((guardrail) => renderTemplate`<li data-astro-cid-ozi4tqoo>${guardrail}</li>`)} </ul> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-battler-wiki.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-battler-wiki.astro";
const $$url = "/nouns-nation-battler-wiki";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsNationBattlerWiki,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
