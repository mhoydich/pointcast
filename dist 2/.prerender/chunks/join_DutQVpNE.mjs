import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$Join = createComponent(($$result, $$props, $$slots) => {
  const steps = [
    ["Name", "Pick a public display name, short code, kind, and home link."],
    ["Kit", "Choose primary, secondary, accent, mark, and optional sprite references."],
    ["Roster", "List teams, gangs, players, Noun ids, generated roster rules, or role constraints."],
    ["Rules", "Choose a season format, scoring model, house rules, and event availability."],
    ["Feed", "Publish an HTML page, JSON file, blocks feed, or latest result endpoint."],
    ["Opt in", "Enter exhibition nights first; move toward cups and bowls when the feed is stable."]
  ];
  const intakeFields = [
    { label: "Nation kind", value: "nation / team / gang / club / DAO / school / shop / crew / local league" },
    { label: "Home base", value: "city, URL, Farcaster channel, Discord, store, school, or DAO page" },
    { label: "Contact", value: "public handle, email, wallet, signed note, or steward page" },
    { label: "Roster source", value: "fixed list, Noun ids, generated set, local signups, or external feed" },
    { label: "Match mode", value: "auto-battler mirror, custom desk, exhibition, cup, bowl, or local slate" },
    { label: "Proof", value: "human reviewed source note, signed payload, public post, or site backlink" }
  ];
  const manifestExample = `{
  "schema": "https://pointcast.xyz/nouns-nation.json",
  "nationId": "example-nation",
  "displayName": "Example Nation",
  "kind": "team",
  "shortCode": "EXN",
  "home": "https://example.com/nouns",
  "colors": {
    "primary": "#e45745",
    "secondary": "#3677e0",
    "accent": "#d49b19"
  },
  "roster": {
    "mode": "fixed",
    "teams": ["Example Reds", "Example Blues"],
    "nounIds": [12, 27, 41]
  },
  "ruleset": {
    "engine": "nouns-nation-battler",
    "season": "exhibition",
    "matchSize": "30v30"
  },
  "feeds": {
    "html": "https://example.com/nouns",
    "json": "https://example.com/nouns.json",
    "latestResult": "https://example.com/nouns/latest.json"
  },
  "proof": {
    "contact": "hello@example.com",
    "note": "Public steward for Example Nation"
  }
}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Bring a Nation to Nouns Nation",
    description: "A lightweight intake path for people bringing nations, teams, gangs, clubs, crews, DAOs, shops, schools, or local leagues into the Nouns Nation federation.",
    url: "https://pointcast.xyz/nouns-nation/join/"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Bring a Nation", "description": "A lightweight Nouns Nation intake path for people bringing their own nation, team, gang, club, crew, DAO, shop, school, or local league.", "image": "/images/og/battle.png", "jsonLd": jsonLd, "data-astro-cid-xp2iyg4j": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="join" data-astro-cid-xp2iyg4j> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-xp2iyg4j> <a href="/" data-astro-cid-xp2iyg4j>Home</a> <span aria-hidden="true" data-astro-cid-xp2iyg4j>/</span> <a href="/nouns-nation/" data-astro-cid-xp2iyg4j>Nouns Nation</a> <span aria-hidden="true" data-astro-cid-xp2iyg4j>/</span> <span data-astro-cid-xp2iyg4j>Bring a nation</span> </nav> <header class="hero" data-astro-cid-xp2iyg4j> <p class="kicker" data-astro-cid-xp2iyg4j>INTAKE / OPEN SIDES</p> <h1 data-astro-cid-xp2iyg4j>Bring your nation, team, gang, club, crew, DAO, shop, school, or league.</h1> <p data-astro-cid-xp2iyg4j>
The first version is intentionally small: publish enough identity and rules
        that PointCast can link you, score you, schedule exhibitions, and know what
        kind of federation event you are ready for.
</p> <nav class="actions" aria-label="Join actions" data-astro-cid-xp2iyg4j> <a href="/nouns-nation/federation/" data-astro-cid-xp2iyg4j>Read strategy</a> <a href="/nouns-nation.json" data-astro-cid-xp2iyg4j>Open JSON spec</a> <a href="/nouns-nation-battler-v3/" data-astro-cid-xp2iyg4j>Watch V3 desk</a> </nav> </header> <section class="steps" aria-label="Join flow" data-astro-cid-xp2iyg4j> ${steps.map(([label, body], index) => renderTemplate`<article data-astro-cid-xp2iyg4j> <span data-astro-cid-xp2iyg4j>${String(index + 1).padStart(2, "0")}</span> <strong data-astro-cid-xp2iyg4j>${label}</strong> <p data-astro-cid-xp2iyg4j>${body}</p> </article>`)} </section> <section class="intake" aria-labelledby="intake-title" data-astro-cid-xp2iyg4j> <div data-astro-cid-xp2iyg4j> <p class="kicker" data-astro-cid-xp2iyg4j>First pass checklist</p> <h2 id="intake-title" data-astro-cid-xp2iyg4j>The ask is a kit, not a form maze.</h2> <p data-astro-cid-xp2iyg4j>
Send enough public information for a desk operator, agent, or future
          federation scheduler to understand who you are, where to link, what you
          play, and how to verify the steward.
</p> </div> <div class="field-list" data-astro-cid-xp2iyg4j> ${intakeFields.map((field) => renderTemplate`<article data-astro-cid-xp2iyg4j> <span data-astro-cid-xp2iyg4j>${field.label}</span> <strong data-astro-cid-xp2iyg4j>${field.value}</strong> </article>`)} </div> </section> <section class="manifest" aria-labelledby="manifest-title" data-astro-cid-xp2iyg4j> <div data-astro-cid-xp2iyg4j> <p class="kicker" data-astro-cid-xp2iyg4j>Starter manifest</p> <h2 id="manifest-title" data-astro-cid-xp2iyg4j>Copy the shape, change the identity.</h2> </div> <pre data-astro-cid-xp2iyg4j><code data-astro-cid-xp2iyg4j>${manifestExample}</code></pre> </section> <section class="next" aria-label="Nouns Nation next links" data-astro-cid-xp2iyg4j> <a href="/nouns-nation/" data-astro-cid-xp2iyg4j>Nouns Nation hub</a> <a href="/c/battler/" data-astro-cid-xp2iyg4j>Battler blocks</a> <a href="/nouns-nation-battler-agents/" data-astro-cid-xp2iyg4j>Agent Bench</a> <a href="/nouns-nation-battler.json" data-astro-cid-xp2iyg4j>Battler manifest</a> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation/join.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation/join.astro";
const $$url = "/nouns-nation/join";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Join,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
