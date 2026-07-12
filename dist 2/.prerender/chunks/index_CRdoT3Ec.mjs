import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const ch = CHANNELS.BTL;
  const latestBattlerBlocks = (await getCollection("blocks", ({ data }) => !data.draft && data.channel === "BTL")).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime()).slice(0, 4);
  const surfaces = [
    {
      eyebrow: "Federation Desk",
      title: "Battle Desk V3",
      href: "/nouns-nation-battler-v3/",
      note: "Next-version operating room: live field, federation thought, portable receipts, and signed strategy.",
      cta: "Open V3"
    },
    {
      eyebrow: "Analyst Desk",
      title: "Battle Desk V2",
      href: "/nouns-nation-battler-v2/",
      note: "GameCast-style control room with pressure, table, leaders, controls, and embedded match feed.",
      cta: "Open V2"
    },
    {
      eyebrow: "Original Desk",
      title: "Battle Desk",
      href: "/nouns-nation-battler/",
      note: "The canonical sports desk for the automated 30 vs 30 league and agent bench links.",
      cta: "Open desk"
    },
    {
      eyebrow: "Living Room",
      title: "TV Cast",
      href: "/nouns-nation-battler-tv/",
      note: "No-chrome broadcast mode for big screens, parties, QR handoffs, and keyboard hosting.",
      cta: "Cast it"
    },
    {
      eyebrow: "Pocket Cast",
      title: "Mobile Cast",
      href: "/nouns-nation-battler-mobile/",
      note: "A phone-first match view with a compact score strip, full-height field, quick controls, and move feed.",
      cta: "Open mobile"
    },
    {
      eyebrow: "Archive",
      title: "Desk Wall",
      href: "/nouns-nation-battler-desk/",
      note: "Snapshot-backed report cards, scoreboards, story desk, and agent scorebook frames.",
      cta: "Open wall"
    },
    {
      eyebrow: "Production",
      title: "Production Desk",
      href: "/nouns-nation-battler-production/",
      note: "Accepted-work ledger, broadcast director queue, rooting cards, season archive, and Nouns Bowl hype week.",
      cta: "Produce"
    },
    {
      eyebrow: "Tasks",
      title: "Claim Board",
      href: "/nouns-nation-battler-tasks/",
      note: "Public cards for sponsors, bounties, posters, QA, watch parties, production, and Nouns Bowl work.",
      cta: "Claim work"
    },
    {
      eyebrow: "Assets",
      title: "Poster Wall",
      href: "/nouns-nation-battler-posters/",
      note: "Twenty type-heavy Nouns posters for the league world and shareable match energy.",
      cta: "See posters"
    },
    {
      eyebrow: "Agent Ops",
      title: "Prompt Kit",
      href: "/nouns-nation-battler-prompts/",
      note: "Outcome-first prompts for mobile QA, scorebook recaps, sponsor packaging, poster drops, route audits, and TV rundowns.",
      cta: "Copy prompts"
    },
    {
      eyebrow: "Reference",
      title: "Battler Wiki",
      href: "/nouns-nation-battler-wiki/",
      note: "Human and agent field guide for rules, gangs, watch modes, season arc, sponsor loop, and contribution paths.",
      cta: "Open wiki"
    },
    {
      eyebrow: "Machines",
      title: "Nation JSON",
      href: "/nouns-nation.json",
      note: "A machine-readable map of the hub, federation posture, intake schema, and live links.",
      cta: "Read JSON"
    },
    {
      eyebrow: "Capital",
      title: "Investment Thesis",
      href: "/investment-thesis",
      note: "Milestone-gated investor memo for the Nouns Nation Builder, agents, AI surfaces, and federation path.",
      cta: "Read memo"
    },
    {
      eyebrow: "V2",
      title: "3-Year Roadmap",
      href: "/nouns-nation/roadmap",
      note: "Roadmap and deck for climbing from browser room to TV, partner venues, and live finals.",
      cta: "Open roadmap"
    }
  ];
  const federationCards = [
    {
      step: "01",
      title: "Bring a nation",
      body: "A person, crew, DAO, school, shop, fandom, art collective, or local league can show up with a name, colors, roster, rules, and a feed."
    },
    {
      step: "02",
      title: "Declare the kit",
      body: "Each nation gets portable identity: short code, marks, colors, home link, contact path, and public manifest."
    },
    {
      step: "03",
      title: "Run local matches",
      body: "PointCast can host or mirror automated slates while the nation keeps its own culture, teams, and weird house rules."
    },
    {
      step: "04",
      title: "Join federation events",
      body: "Opt-in bowls, cups, rivalry nights, and cross-nation leaderboards become possible once manifests speak the same shape."
    }
  ];
  const quickLinks = [
    { href: "/nouns-nation-battler/", label: "Watch live" },
    { href: "/nouns-nation-battler-mobile/", label: "Mobile cast" },
    { href: "/nouns-nation-battler-tv/", label: "TV cast" },
    { href: "/nouns-nation-battler-desk/", label: "Desk wall" },
    { href: "/nouns-nation-battler-v3/", label: "Battle Desk V3" },
    { href: "/nouns-nation/federation/", label: "Federation strategy" },
    { href: "/nouns-nation/join/", label: "Bring a nation" },
    { href: "/nouns-nation/roadmap", label: "Roadmap V2" },
    { href: "/investment-thesis", label: "Investment thesis" },
    { href: "/decks/nouns-nation-builder-roadmap-v2.pptx", label: "Pitch deck" },
    { href: "/nouns-nation-battler-agents/", label: "Agent bench" },
    { href: "/nouns-nation-battler-prompts/", label: "Prompt kit" },
    { href: "/nouns-nation-battler-wiki/", label: "Battler wiki" },
    { href: "/nouns-nation-battler-production/", label: "Production desk" },
    { href: "/nouns-nation-battler-tasks/", label: "Claim board" },
    { href: "/c/battler/", label: "CH.BTL blocks" },
    { href: "/nouns-nation-battler.json", label: "Battler JSON" }
  ];
  const watchLinks = [
    {
      eyebrow: "Start here",
      title: "Watch live match desk",
      href: "/nouns-nation-battler/",
      note: "Scorebug, live calls, standings, top Nouns, controls, and embedded 30 vs 30 field feed.",
      cta: "Open live desk"
    },
    {
      eyebrow: "Phone first",
      title: "Mobile Cast",
      href: "/nouns-nation-battler-mobile/",
      note: "Compact score strip, full-height field, quick controls, and move feed tuned for one-handed watching.",
      cta: "Open mobile"
    },
    {
      eyebrow: "Big screen",
      title: "Cast to TV",
      href: "/nouns-nation-battler-tv/",
      note: "Fullscreen broadcast mode for lunch, parties, second screens, and hands-off watching.",
      cta: "Open TV cast"
    },
    {
      eyebrow: "Just the game",
      title: "Raw battler feed",
      href: "/games/nouns-nation-battler/",
      note: "Jump straight into the automated match engine with no desk wrapper.",
      cta: "Open game"
    },
    {
      eyebrow: "Recaps",
      title: "Desk Wall",
      href: "/nouns-nation-battler-desk/",
      note: "Snapshot-backed scoreboards, report cards, story desk, and shareable watch frames.",
      cta: "Open wall"
    }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Nouns Nation",
    description: "A standalone PointCast area for Nouns Nation Battler, live battle desks, Mobile Cast, TV cast, desk wall, agent bench, blocks, and federation strategy for people bringing their own nations, teams, gangs, or leagues.",
    url: "https://pointcast.xyz/nouns-nation/",
    hasPart: surfaces.map((surface) => ({
      "@type": "WebPage",
      name: surface.title,
      url: `https://pointcast.xyz${surface.href}`
    }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Nouns Nation", "description": "The standalone PointCast area for Nouns Nation: Battle Desk V3, Mobile Cast, TV cast, Desk Wall, Agent Bench, Production Desk, Claim Board, fresh Battler blocks, and the federation strategy for bringing your own nation, team, gang, or league.", "image": "/images/og/nouns-nation.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/nouns-nation.json", title: "Nouns Nation federation manifest" },
    { type: "application/json", href: "/nouns-nation-battler.json", title: "Nouns Nation Battler manifest" }
  ], "frame": {
    image: "https://pointcast.xyz/images/og/nouns-nation.png",
    buttons: [
      { label: "Nouns Nation", action: "link", target: "https://pointcast.xyz/nouns-nation/" },
      { label: "Watch Live", action: "link", target: "https://pointcast.xyz/nouns-nation-battler/" },
      { label: "Mobile Cast", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-mobile/" },
      { label: "TV Cast", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-tv/" },
      { label: "Claim Board", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-tasks/" }
    ]
  }, "data-astro-cid-4sdqmv5d": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="nation"${addAttribute(`--btl: ${ch.color600}; --btl-dark: ${ch.color800}; --btl-soft: ${ch.color50};`, "style")} data-astro-cid-4sdqmv5d> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-4sdqmv5d> <a href="/" data-astro-cid-4sdqmv5d>Home</a> <span aria-hidden="true" data-astro-cid-4sdqmv5d>/</span> <a href="/c/battler/" data-astro-cid-4sdqmv5d>CH.BTL</a> <span aria-hidden="true" data-astro-cid-4sdqmv5d>/</span> <span data-astro-cid-4sdqmv5d>Nouns Nation</span> </nav> <section class="hero" aria-labelledby="nation-title" data-astro-cid-4sdqmv5d> <div class="hero__copy" data-astro-cid-4sdqmv5d> <p class="kicker" data-astro-cid-4sdqmv5d>POINTCAST BTL NETWORK / STANDALONE AREA</p> <h1 id="nation-title" data-astro-cid-4sdqmv5d>Nouns Nation is the league room.</h1> <p data-astro-cid-4sdqmv5d>
One area for the automated Nouns sport: live Battle Desk, mobile cast, TV cast, raw match feed, Desk Wall,
          Battle Desk V3, Battle Desk V2,
          Production Desk, Claim Board, agent handoffs, poster archive, machine manifests, and the early federation plan for people
          who want to bring their own nations, teams, gangs, clubs, crews, and local leagues.
</p> <nav class="hero__actions" aria-label="Nouns Nation primary paths" data-astro-cid-4sdqmv5d> <a class="primary" href="/nouns-nation-battler/" data-astro-cid-4sdqmv5d>Watch live match</a> <a href="/nouns-nation-battler-mobile/" data-astro-cid-4sdqmv5d>Mobile Cast</a> <a href="/nouns-nation-battler-tv/" data-astro-cid-4sdqmv5d>TV Cast</a> <a href="/games/nouns-nation-battler/" data-astro-cid-4sdqmv5d>Raw game feed</a> <a href="/nouns-nation-battler-desk/" data-astro-cid-4sdqmv5d>Desk Wall</a> <a href="/nouns-nation-battler-v3/" data-astro-cid-4sdqmv5d>Battle Desk V3</a> <a href="/nouns-nation-battler-v2/" data-astro-cid-4sdqmv5d>Battle Desk V2</a> </nav> </div> <div class="hero__field" aria-label="Nouns Nation signal board" data-astro-cid-4sdqmv5d> <div class="scoreline" data-astro-cid-4sdqmv5d> <span data-astro-cid-4sdqmv5d>NATION</span> <strong data-astro-cid-4sdqmv5d>BTL</strong> <span data-astro-cid-4sdqmv5d>FEDERATION</span> </div> <div class="noun-grid" aria-hidden="true" data-astro-cid-4sdqmv5d> ${[12, 19, 27, 34, 41, 52, 7, 58, 3].map((noun) => renderTemplate`<img${addAttribute(`/games/nouns-nation-battler/assets/noun-${noun}.svg`, "src")} alt="" loading="eager" data-astro-cid-4sdqmv5d>`)} </div> <div class="field-readout" data-astro-cid-4sdqmv5d> <span data-astro-cid-4sdqmv5d>30 vs 30</span> <span data-astro-cid-4sdqmv5d>8 gangs live</span> <span data-astro-cid-4sdqmv5d>V3 thought signed</span> </div> </div> </section> <section class="watch-strip" aria-labelledby="watch-title" data-astro-cid-4sdqmv5d> <div class="section-head section-head--tight" data-astro-cid-4sdqmv5d> <p class="kicker" data-astro-cid-4sdqmv5d>Watch now</p> <h2 id="watch-title" data-astro-cid-4sdqmv5d>Fast paths into the broadcast.</h2> </div> <div class="watch-links" data-astro-cid-4sdqmv5d> ${watchLinks.map((link) => renderTemplate`<a class="watch-link"${addAttribute(link.href, "href")} data-astro-cid-4sdqmv5d> <span data-astro-cid-4sdqmv5d>${link.eyebrow}</span> <strong data-astro-cid-4sdqmv5d>${link.title}</strong> <p data-astro-cid-4sdqmv5d>${link.note}</p> <em data-astro-cid-4sdqmv5d>${link.cta}</em> </a>`)} </div> </section> <section class="ticker" aria-label="Nouns Nation ticker" data-astro-cid-4sdqmv5d> <span data-astro-cid-4sdqmv5d>LIVE</span> <div data-astro-cid-4sdqmv5d> <p data-astro-cid-4sdqmv5d>Watch live at /nouns-nation-battler.</p> <p data-astro-cid-4sdqmv5d>Mobile Cast is tuned for one-handed match viewing.</p> <p data-astro-cid-4sdqmv5d>TV Cast is ready for big screens.</p> <p data-astro-cid-4sdqmv5d>Battle Desk V3 is live.</p> <p data-astro-cid-4sdqmv5d>Battle Desk V2 is live.</p> <p data-astro-cid-4sdqmv5d>Claim Board turns needs into proof-ready work cards.</p> <p data-astro-cid-4sdqmv5d>Federation manifest published.</p> <p data-astro-cid-4sdqmv5d>Intake path open for nations, teams, gangs, and clubs.</p> <p data-astro-cid-4sdqmv5d>Blocks 0406-0409 carry the receipts.</p> </div> </section> <section class="surface-grid" aria-labelledby="surface-title" data-astro-cid-4sdqmv5d> <div class="section-head" data-astro-cid-4sdqmv5d> <p class="kicker" data-astro-cid-4sdqmv5d>Broadcast surfaces</p> <h2 id="surface-title" data-astro-cid-4sdqmv5d>Everything in the room has a job.</h2> </div> <div class="surfaces" data-astro-cid-4sdqmv5d> ${surfaces.map((surface) => renderTemplate`<a class="surface"${addAttribute(surface.href, "href")} data-astro-cid-4sdqmv5d> <span data-astro-cid-4sdqmv5d>${surface.eyebrow}</span> <strong data-astro-cid-4sdqmv5d>${surface.title}</strong> <p data-astro-cid-4sdqmv5d>${surface.note}</p> <em data-astro-cid-4sdqmv5d>${surface.cta}</em> </a>`)} </div> </section> <section class="federation" aria-labelledby="federation-title" data-astro-cid-4sdqmv5d> <div class="federation__copy" data-astro-cid-4sdqmv5d> <p class="kicker" data-astro-cid-4sdqmv5d>Federation posture</p> <h2 id="federation-title" data-astro-cid-4sdqmv5d>Let people bring their own side without flattening the culture.</h2> <p data-astro-cid-4sdqmv5d>
The PointCast job is not to own every nation. It is to publish a clean enough game surface,
          manifest shape, and event calendar that outside groups can bring identity and stakes with
          minimal ceremony. Nations stay theirs. Federation events make them legible together.
</p> <nav class="link-row" aria-label="Federation paths" data-astro-cid-4sdqmv5d> ${quickLinks.map((link) => renderTemplate`<a${addAttribute(link.href, "href")} data-astro-cid-4sdqmv5d>${link.label}</a>`)} </nav> </div> <div class="federation__steps" data-astro-cid-4sdqmv5d> ${federationCards.map((card) => renderTemplate`<article data-astro-cid-4sdqmv5d> <span data-astro-cid-4sdqmv5d>${card.step}</span> <strong data-astro-cid-4sdqmv5d>${card.title}</strong> <p data-astro-cid-4sdqmv5d>${card.body}</p> </article>`)} </div> </section> <section class="blocks" aria-labelledby="blocks-title" data-astro-cid-4sdqmv5d> <div class="section-head" data-astro-cid-4sdqmv5d> <p class="kicker" data-astro-cid-4sdqmv5d>Fresh CH.BTL blocks</p> <h2 id="blocks-title" data-astro-cid-4sdqmv5d>The public receipts for the arena.</h2> </div> <div class="block-list" data-astro-cid-4sdqmv5d> ${latestBattlerBlocks.map((block) => renderTemplate`<a${addAttribute(`/b/${block.data.id}`, "href")} data-astro-cid-4sdqmv5d> <span data-astro-cid-4sdqmv5d>#${block.data.id} / ${block.data.type}</span> <strong data-astro-cid-4sdqmv5d>${block.data.title}</strong> <p data-astro-cid-4sdqmv5d>${block.data.dek}</p> </a>`)} </div> </section> <section class="agent-strip" aria-label="Machine-readable Nouns Nation links" data-astro-cid-4sdqmv5d> <p data-astro-cid-4sdqmv5d>Machine-readable</p> <a href="/nouns-nation.json" data-astro-cid-4sdqmv5d>/nouns-nation.json</a> <a href="/nouns-nation/roadmap.json" data-astro-cid-4sdqmv5d>/nouns-nation/roadmap.json</a> <a href="/decks/nouns-nation-builder-roadmap-v2.pptx" data-astro-cid-4sdqmv5d>/decks/nouns-nation-builder-roadmap-v2.pptx</a> <a href="/nouns-nation-battler.json" data-astro-cid-4sdqmv5d>/nouns-nation-battler.json</a> <a href="/nouns-nation-battler-agents.json" data-astro-cid-4sdqmv5d>/nouns-nation-battler-agents.json</a> <a href="/nouns-nation-battler-wiki.json" data-astro-cid-4sdqmv5d>/nouns-nation-battler-wiki.json</a> <a href="/nouns-nation-battler-tasks/" data-astro-cid-4sdqmv5d>/nouns-nation-battler-tasks</a> <a href="/api/mcp-v2" data-astro-cid-4sdqmv5d>/api/mcp-v2</a> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation/index.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation/index.astro";
const $$url = "/nouns-nation";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
