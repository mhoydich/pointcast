import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$Federation = createComponent(($$result, $$props, $$slots) => {
  const layers = [
    {
      label: "Identity",
      title: "Portable nation manifests",
      body: "Every nation, team, gang, club, or crew gets a small public JSON shape with name, code, colors, roster policy, home link, contact path, and proof notes."
    },
    {
      label: "Play",
      title: "Local rules, shared results",
      body: "Nations can keep their own lore and rules while publishing match snapshots in a common result envelope."
    },
    {
      label: "Broadcast",
      title: "Many desks, one scoreboard",
      body: "PointCast can run a neutral desk; nations can run their own home desk; federation events can pull both into a shared table."
    },
    {
      label: "Events",
      title: "Opt-in cups and bowls",
      body: "The federation calendar starts with exhibition nights, then cups, rivalry weeks, seasonal bowls, and inter-nation championships."
    }
  ];
  const manifestRows = [
    ["nationId", "Stable slug such as tomato-noggles, escu, or mallorca-kite-club."],
    ["displayName", "Human name shown on desks, tables, posters, and blocks."],
    ["kind", "nation, team, gang, club, DAO, school, local league, shop, or crew."],
    ["colors", "Primary, secondary, accent, and optional neutral palette."],
    ["roster", "Teams, Noun ids, player handles, roles, or rules for generated rosters."],
    ["ruleset", "Which match engine, scoring model, season length, and house rules apply."],
    ["feeds", "HTML page, JSON manifest, latest result, optional RSS or blocks feed."],
    ["proof", "Contact, source note, signature, or human-reviewed ownership statement."]
  ];
  const eventLadder = [
    { level: "0", name: "Spectator link", detail: "A nation links to the public Battler or TV cast." },
    { level: "1", name: "Read-only manifest", detail: "A public JSON identity kit can be indexed by PointCast." },
    { level: "2", name: "Snapshot exchange", detail: "Results and standings use the shared snapshot envelope." },
    { level: "3", name: "Home desk", detail: "The nation runs a desk surface and links back to the federation hub." },
    { level: "4", name: "Federated season", detail: "Multiple nations opt into the same cup, table, or bowl calendar." }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    name: "Nouns Nation Federation Strategy",
    description: "A PointCast strategy surface for letting people bring their own nations, teams, gangs, clubs, crews, DAOs, schools, and leagues into Nouns Nation events.",
    url: "https://pointcast.xyz/nouns-nation/federation/"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Nouns Nation Federation", "description": "Federation strategy for Nouns Nation: portable nation manifests, local rules, shared results, home desks, and opt-in cups for people bringing their own nations, teams, gangs, clubs, crews, or leagues.", "image": "/images/og/battle.png", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/nouns-nation.json", title: "Nouns Nation federation manifest" }], "data-astro-cid-wzvnzbm5": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="fed" data-astro-cid-wzvnzbm5> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-wzvnzbm5> <a href="/" data-astro-cid-wzvnzbm5>Home</a> <span aria-hidden="true" data-astro-cid-wzvnzbm5>/</span> <a href="/nouns-nation/" data-astro-cid-wzvnzbm5>Nouns Nation</a> <span aria-hidden="true" data-astro-cid-wzvnzbm5>/</span> <span data-astro-cid-wzvnzbm5>Federation</span> </nav> <header class="hero" data-astro-cid-wzvnzbm5> <p class="kicker" data-astro-cid-wzvnzbm5>FEDERATION STRATEGY / FIRST PASS</p> <h1 data-astro-cid-wzvnzbm5>Bring the culture. Share the field.</h1> <p data-astro-cid-wzvnzbm5>
The federation should feel more like a sports network than a platform lock-in.
        PointCast defines the event grammar, manifest shape, desk feeds, and score envelopes.
        People bring nations, teams, gangs, clubs, DAOs, shops, schools, crews, and local leagues.
</p> <div class="hero__links" data-astro-cid-wzvnzbm5> <a href="/nouns-nation/join/" data-astro-cid-wzvnzbm5>Bring a nation</a> <a href="/nouns-nation.json" data-astro-cid-wzvnzbm5>Read the manifest</a> <a href="/nouns-nation-battler-v3/" data-astro-cid-wzvnzbm5>Open Battle Desk V3</a> </div> </header> <section class="strategy-grid" aria-label="Federation strategy layers" data-astro-cid-wzvnzbm5> ${layers.map((layer) => renderTemplate`<article data-astro-cid-wzvnzbm5> <span data-astro-cid-wzvnzbm5>${layer.label}</span> <strong data-astro-cid-wzvnzbm5>${layer.title}</strong> <p data-astro-cid-wzvnzbm5>${layer.body}</p> </article>`)} </section> <section class="split" aria-labelledby="manifest-title" data-astro-cid-wzvnzbm5> <div class="split__copy" data-astro-cid-wzvnzbm5> <p class="kicker" data-astro-cid-wzvnzbm5>Minimum viable manifest</p> <h2 id="manifest-title" data-astro-cid-wzvnzbm5>The first interface is a small public file.</h2> <p data-astro-cid-wzvnzbm5>
A federation works when a nation can be understood without a meeting.
          The first spec should stay boring: identity, links, roster, rules, feeds,
          proof, and an opt-in event status. The social weirdness lives above it.
</p> </div> <div class="manifest-table" role="table" aria-label="Nation manifest fields" data-astro-cid-wzvnzbm5> ${manifestRows.map(([field, detail]) => renderTemplate`<div role="row" data-astro-cid-wzvnzbm5> <strong role="cell" data-astro-cid-wzvnzbm5>${field}</strong> <span role="cell" data-astro-cid-wzvnzbm5>${detail}</span> </div>`)} </div> </section> <section class="ladder" aria-labelledby="ladder-title" data-astro-cid-wzvnzbm5> <div class="section-head" data-astro-cid-wzvnzbm5> <p class="kicker" data-astro-cid-wzvnzbm5>Integration ladder</p> <h2 id="ladder-title" data-astro-cid-wzvnzbm5>Let people enter at the level they can actually support.</h2> </div> <ol data-astro-cid-wzvnzbm5> ${eventLadder.map((item) => renderTemplate`<li data-astro-cid-wzvnzbm5> <span data-astro-cid-wzvnzbm5>${item.level}</span> <strong data-astro-cid-wzvnzbm5>${item.name}</strong> <p data-astro-cid-wzvnzbm5>${item.detail}</p> </li>`)} </ol> </section> <section class="operating-model" aria-labelledby="model-title" data-astro-cid-wzvnzbm5> <p class="kicker" data-astro-cid-wzvnzbm5>Operating model</p> <h2 id="model-title" data-astro-cid-wzvnzbm5>Federate results, not personality.</h2> <div class="model-grid" data-astro-cid-wzvnzbm5> <article data-astro-cid-wzvnzbm5> <strong data-astro-cid-wzvnzbm5>Open lanes</strong> <p data-astro-cid-wzvnzbm5>Anyone can spectate, fork the visual idea, or publish a nation manifest. Federation events stay opt-in.</p> </article> <article data-astro-cid-wzvnzbm5> <strong data-astro-cid-wzvnzbm5>Small moderation surface</strong> <p data-astro-cid-wzvnzbm5>PointCast indexes manifests and results. It does not host unbounded chat or free-text drama as the core loop.</p> </article> <article data-astro-cid-wzvnzbm5> <strong data-astro-cid-wzvnzbm5>Local pride</strong> <p data-astro-cid-wzvnzbm5>Local teams keep home names, colors, chants, and rivalries. Shared cups only need enough data to schedule and score.</p> </article> <article data-astro-cid-wzvnzbm5> <strong data-astro-cid-wzvnzbm5>Agent friendly</strong> <p data-astro-cid-wzvnzbm5>Agents can scout, commentate, QA, keep score, or summarize a cup by reading manifests and Desk Wall snapshots.</p> </article> </div> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation/federation.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation/federation.astro";
const $$url = "/nouns-nation/federation";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Federation,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
