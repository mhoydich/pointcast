import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$NounsNationSportsReenactment = createComponent(async ($$result, $$props, $$slots) => {
  const productLinks = [
    { label: "Open Battle Desk", href: "/nouns-nation-battler/" },
    { label: "Goal Room", href: "/nouns-nation-sports-reenactment/goal/" },
    { label: "TV Cast", href: "/nouns-nation-battler-tv/" },
    { label: "Mobile Cast", href: "/nouns-nation-battler-mobile/" },
    { label: "Raw Field", href: "/games/nouns-nation-battler/#mode=tv&type=kingdom" },
    { label: "Manifest", href: "/nouns-nation-battler.json" }
  ];
  const resultShapes = [
    {
      shape: "Close finish",
      field: "Windy kingdom rush",
      line: "Near-even 30v30 with a small survivor gap and late-lane gust.",
      noun: 12
    },
    {
      shape: "Comeback",
      field: "Garden comeback field",
      line: "One side starts under pressure, then gets a scheduled morale surge.",
      noun: 33
    },
    {
      shape: "Blowout",
      field: "Lava lane rout",
      line: "Winner starts with formation and morale advantage; loser fights through heat.",
      noun: 41
    },
    {
      shape: "Upset",
      field: "Auction floor upset",
      line: "Underdog gets belief spike, faster specials, and a noisy floor.",
      noun: 48
    },
    {
      shape: "Overtime",
      field: "Rift overtime field",
      line: "Sudden-death 20v20 pressure with higher damage and fast highlights.",
      noun: 56
    }
  ];
  const products = [
    {
      title: "Result Reenactor",
      price: "Prototype",
      desc: "Type league, winner, loser, score, and result shape. The desk generates a Nouns battle setup, copyable receipt, field modifier, and launch command.",
      deliverables: ["Launch Battle Setup", "Copy Alt Receipt", "Local five-result slate"]
    },
    {
      title: "TV Reenactment Banner",
      price: "Included",
      desc: "The live field displays the source result, shape, field, alive count, and guardrail so viewers understand what the battle is translating.",
      deliverables: ["TV-safe lower banner", "Mobile-safe overlay", "Snapshot-compatible metadata"]
    },
    {
      title: "Alt Sports Slate Pack",
      price: "Packable",
      desc: "Five prewritten sample results for quick demos: NBA close, WNBA comeback, NFL overtime, MLB blowout, and EPL upset.",
      deliverables: ["One-click launch presets", "Broadcast-ready examples", "No API dependency"]
    },
    {
      title: "Sponsor/Media Kit",
      price: "Reservation only",
      desc: "Package a reenactment as a sponsor read, poster concept, social clip brief, or watch-party card without payment processing.",
      deliverables: ["Sponsor card copy", "Poster prompt", "Agent task brief"]
    },
    {
      title: "Agent Scorebook Brief",
      price: "Agent-ready",
      desc: "A structured assignment for Claude, ChatGPT, Codex, or cowork agents to turn a result into a recap, headline set, or proof artifact.",
      deliverables: ["Inputs and guardrails", "Accepted-work path", "Participant-credit language"]
    },
    {
      title: "Custom League Skin",
      price: "Next build",
      desc: "Bring a league, school, shop, DAO, club, or friend group and map results into Nouns gangs, fields, and recurring broadcast bits.",
      deliverables: ["Custom slate", "Field naming", "Recurring show language"]
    }
  ];
  const sampleSlates = [
    { league: "NBA", result: "Celtics 112, Knicks 109", shape: "Close finish", slug: "close" },
    { league: "WNBA", result: "Aces 88, Liberty 84", shape: "Comeback", slug: "comeback" },
    { league: "NFL", result: "Chiefs 27, Ravens 24", shape: "Overtime", slug: "overtime" },
    { league: "MLB", result: "Dodgers 11, Padres 3", shape: "Blowout", slug: "blowout" },
    { league: "EPL", result: "Brighton 2, Arsenal 1", shape: "Upset", slug: "upset" }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Nouns Nation Sports Reenactment",
    description: "A local-first alt-broadcast product that turns typed sports results into Nouns Nation Battler field setups, TV banners, receipts, and sponsor/media products.",
    url: "https://pointcast.xyz/nouns-nation-sports-reenactment/",
    applicationCategory: "GameApplication",
    isPartOf: {
      "@type": "VideoGame",
      name: "Nouns Nation Battler",
      url: "https://pointcast.xyz/nouns-nation-battler/"
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Nouns Sports Reenactment", "description": "Turn typed sports results into Nouns battle setups, TV banners, receipts, and productized sponsor/media packs. Local-first, informational, no official feed required.", "image": "/images/og/nouns-battler-live.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/nouns-nation-battler.json", title: "Nouns Nation Battler manifest" }
  ], "frame": {
    image: "https://pointcast.xyz/images/og/nouns-battler-live.png",
    buttons: [
      { label: "Reenactment", action: "link", target: "https://pointcast.xyz/nouns-nation-sports-reenactment/" },
      { label: "Battle Desk", action: "link", target: "https://pointcast.xyz/nouns-nation-battler/" },
      { label: "TV Cast", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-tv/" },
      { label: "Sponsor Desk", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-sponsors/" }
    ]
  }, "data-astro-cid-vv6pkpzt": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="reenactment-site" data-astro-cid-vv6pkpzt> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-vv6pkpzt> <a href="/" data-astro-cid-vv6pkpzt>Home</a> <span aria-hidden="true" data-astro-cid-vv6pkpzt>/</span> <a href="/nouns-nation-battler/" data-astro-cid-vv6pkpzt>Nouns Nation Battler</a> <span aria-hidden="true" data-astro-cid-vv6pkpzt>/</span> <span data-astro-cid-vv6pkpzt>Sports Reenactment</span> </nav> <section class="hero" aria-labelledby="reenact-title" data-astro-cid-vv6pkpzt> <div class="hero__copy" data-astro-cid-vv6pkpzt> <p class="kicker" data-astro-cid-vv6pkpzt>CH.BTL / SPORTS REENACTMENT MODE</p> <h1 id="reenact-title" data-astro-cid-vv6pkpzt>Turn a box score into a Nouns battle.</h1> <p data-astro-cid-vv6pkpzt>
Type a real or imagined sports result, choose the shape of the game, and launch an
          informational Nouns reenactment. It is not an official replay and it does not predict
          anything. It is an alt-broadcast generator: result in, field setup out.
</p> <div class="hero-actions" data-astro-cid-vv6pkpzt> ${productLinks.map((link, index) => renderTemplate`<a${addAttribute(index < 2 ? "primary" : "", "class")}${addAttribute(link.href, "href")} data-astro-cid-vv6pkpzt>${link.label}</a>`)} </div> </div> <div class="hero-card" aria-label="Sample reenactment card" data-astro-cid-vv6pkpzt> <span data-astro-cid-vv6pkpzt>Sample launch</span> <strong data-astro-cid-vv6pkpzt>Celtics survive the Nouns reenactment</strong> <p data-astro-cid-vv6pkpzt>NBA: Celtics 112, Knicks 109 becomes Tomato Noggles vs Cobalt Frames on Windy kingdom rush.</p> <em data-astro-cid-vv6pkpzt>Informational alt-broadcast setup. No official data feed, no odds, no betting.</em> </div> </section> <section class="kit" aria-labelledby="kit-title" data-astro-cid-vv6pkpzt> <div class="section-head" data-astro-cid-vv6pkpzt> <p class="kicker" data-astro-cid-vv6pkpzt>Broadcast Kit Builder</p> <h2 id="kit-title" data-astro-cid-vv6pkpzt>Pick a result shape. Leave with a show package.</h2> <p data-astro-cid-vv6pkpzt>
These buttons generate launch links, sponsor copy, and agent briefs for the reenactment desk.
          It stays local-first: no official feed, no checkout, no betting claim.
</p> </div> <div class="kit-shell" data-astro-cid-vv6pkpzt> <div class="kit-picker" aria-label="Sample reenactment packages" data-astro-cid-vv6pkpzt> ${sampleSlates.map((item, index) => renderTemplate`<button type="button"${addAttribute(index === 0 ? "is-active" : "", "class")}${addAttribute(item.slug, "data-kit-preset")}${addAttribute(item.league, "data-league")}${addAttribute(item.result, "data-result")}${addAttribute(item.shape, "data-shape")} data-astro-cid-vv6pkpzt> <span data-astro-cid-vv6pkpzt>${item.league}</span> <strong data-astro-cid-vv6pkpzt>${item.shape}</strong> <em data-astro-cid-vv6pkpzt>${item.result}</em> </button>`)} </div> <article class="kit-output" aria-live="polite" data-astro-cid-vv6pkpzt> <span data-kit-field="league" data-astro-cid-vv6pkpzt>NBA</span> <strong data-kit-field="headline" data-astro-cid-vv6pkpzt>Celtics 112, Knicks 109 becomes a Windy kingdom rush reenactment.</strong> <p data-kit-field="brief" data-astro-cid-vv6pkpzt>
Launch a close-finish Nouns battle, capture the TV banner, then package the result as a recap,
            sponsor read, poster prompt, and agent scorebook brief.
</p> <div class="kit-actions" data-astro-cid-vv6pkpzt> <a data-kit-field="launch" href="/nouns-nation-battler/#mode=desk&reenact=close" data-astro-cid-vv6pkpzt>Launch desk</a> <button type="button" data-copy-kit data-astro-cid-vv6pkpzt>Copy kit</button> </div> <textarea data-kit-field="copy" readonly data-astro-cid-vv6pkpzt>NBA ALT-CAST KIT
Source result: Celtics 112, Knicks 109
Shape: Close finish
Field: Windy kingdom rush
Use: recap, sponsor read, poster prompt, and agent scorebook brief
Guardrail: informational Nouns reenactment, not official replay, odds, or betting.</textarea> </article> </div> </section> <section class="use-when" aria-labelledby="use-when-title" data-astro-cid-vv6pkpzt> <div class="section-head" data-astro-cid-vv6pkpzt> <p class="kicker" data-astro-cid-vv6pkpzt>Use this when</p> <h2 id="use-when-title" data-astro-cid-vv6pkpzt>You need the next screen to become a show package.</h2> </div> <div class="use-grid" data-astro-cid-vv6pkpzt> <article data-astro-cid-vv6pkpzt><strong data-astro-cid-vv6pkpzt>Hosting</strong><p data-astro-cid-vv6pkpzt>Pick a goal, generate a rundown, and launch the desk with a clean guardrail.</p></article> <article data-astro-cid-vv6pkpzt><strong data-astro-cid-vv6pkpzt>Sharing</strong><p data-astro-cid-vv6pkpzt>Turn the result into one pasteable receipt for group chat, Farcaster, or Discord.</p></article> <article data-astro-cid-vv6pkpzt><strong data-astro-cid-vv6pkpzt>Agents</strong><p data-astro-cid-vv6pkpzt>Send Claude Code or a visiting agent a bounded job with proof requirements.</p></article> <article data-astro-cid-vv6pkpzt><strong data-astro-cid-vv6pkpzt>Sponsors</strong><p data-astro-cid-vv6pkpzt>Frame a reservation-only read or media package without checkout or payout language.</p></article> </div> <a class="mission-link" href="/nouns-nation-sports-reenactment/goal/" data-astro-cid-vv6pkpzt>Open Mission Control</a> </section> <section class="loop" aria-labelledby="loop-title" data-astro-cid-vv6pkpzt> <div class="section-head" data-astro-cid-vv6pkpzt> <p class="kicker" data-astro-cid-vv6pkpzt>Main loop</p> <h2 id="loop-title" data-astro-cid-vv6pkpzt>Host result → generate card → launch field → package output.</h2> </div> <div class="loop-grid" data-astro-cid-vv6pkpzt> <article data-astro-cid-vv6pkpzt><span data-astro-cid-vv6pkpzt>01</span><strong data-astro-cid-vv6pkpzt>Type the result</strong><p data-astro-cid-vv6pkpzt>League, winner, loser, score, and shape.</p></article> <article data-astro-cid-vv6pkpzt><span data-astro-cid-vv6pkpzt>02</span><strong data-astro-cid-vv6pkpzt>Map the pressure</strong><p data-astro-cid-vv6pkpzt>Close, comeback, blowout, upset, or overtime becomes a field and modifier.</p></article> <article data-astro-cid-vv6pkpzt><span data-astro-cid-vv6pkpzt>03</span><strong data-astro-cid-vv6pkpzt>Launch the battle</strong><p data-astro-cid-vv6pkpzt>The game picks deterministic Nouns gangs and starts a themed match.</p></article> <article data-astro-cid-vv6pkpzt><span data-astro-cid-vv6pkpzt>04</span><strong data-astro-cid-vv6pkpzt>Make the product</strong><p data-astro-cid-vv6pkpzt>Copy a receipt, sponsor read, poster prompt, or agent scorebook brief.</p></article> </div> </section> <section class="shapes" aria-labelledby="shape-title" data-astro-cid-vv6pkpzt> <div class="section-head" data-astro-cid-vv6pkpzt> <p class="kicker" data-astro-cid-vv6pkpzt>Field grammar</p> <h2 id="shape-title" data-astro-cid-vv6pkpzt>Five result shapes, five Nouns broadcast moods.</h2> </div> <div class="shape-grid" data-astro-cid-vv6pkpzt> ${resultShapes.map((item) => renderTemplate`<article data-astro-cid-vv6pkpzt> <img${addAttribute(`/games/nouns-nation-battler/assets/noun-${item.noun}.svg`, "src")} alt="" loading="lazy" data-astro-cid-vv6pkpzt> <span data-astro-cid-vv6pkpzt>${item.shape}</span> <strong data-astro-cid-vv6pkpzt>${item.field}</strong> <p data-astro-cid-vv6pkpzt>${item.line}</p> </article>`)} </div> </section> <section class="products" aria-labelledby="products-title" data-astro-cid-vv6pkpzt> <div class="section-head" data-astro-cid-vv6pkpzt> <p class="kicker" data-astro-cid-vv6pkpzt>Products</p> <h2 id="products-title" data-astro-cid-vv6pkpzt>What this can become besides a match.</h2> </div> <div class="product-grid" data-astro-cid-vv6pkpzt> ${products.map((product) => renderTemplate`<article data-astro-cid-vv6pkpzt> <div data-astro-cid-vv6pkpzt> <span data-astro-cid-vv6pkpzt>${product.price}</span> <strong data-astro-cid-vv6pkpzt>${product.title}</strong> <p data-astro-cid-vv6pkpzt>${product.desc}</p> </div> <ul data-astro-cid-vv6pkpzt> ${product.deliverables.map((item) => renderTemplate`<li data-astro-cid-vv6pkpzt>${item}</li>`)} </ul> </article>`)} </div> </section> <section class="slate" aria-labelledby="slate-title" data-astro-cid-vv6pkpzt> <div data-astro-cid-vv6pkpzt> <p class="kicker" data-astro-cid-vv6pkpzt>Demo slate</p> <h2 id="slate-title" data-astro-cid-vv6pkpzt>Five starts for a lunch-screen demo.</h2> </div> <div class="slate-list" data-astro-cid-vv6pkpzt> ${sampleSlates.map((item) => renderTemplate`<article data-astro-cid-vv6pkpzt> <span data-astro-cid-vv6pkpzt>${item.league}</span> <strong data-astro-cid-vv6pkpzt>${item.result}</strong> <em data-astro-cid-vv6pkpzt>${item.shape}</em> </article>`)} </div> </section> <section class="guardrails" aria-labelledby="guardrails-title" data-astro-cid-vv6pkpzt> <div data-astro-cid-vv6pkpzt> <p class="kicker" data-astro-cid-vv6pkpzt>Guardrails</p> <h2 id="guardrails-title" data-astro-cid-vv6pkpzt>Clear enough to be weird without getting sloppy.</h2> </div> <ul data-astro-cid-vv6pkpzt> <li data-astro-cid-vv6pkpzt>User-entered results only; no live sports API claim.</li> <li data-astro-cid-vv6pkpzt>Informational reenactment, not official replay, not odds, not betting.</li> <li data-astro-cid-vv6pkpzt>The battle is inspired by the result; the sim outcome is not forced.</li> <li data-astro-cid-vv6pkpzt>Products are reservation, media, and creative packages until a human accepts work.</li> </ul> </section> </main> ${renderScript($$result2, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-sports-reenactment.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-sports-reenactment.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-sports-reenactment.astro";
const $$url = "/nouns-nation-sports-reenactment";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsNationSportsReenactment,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
