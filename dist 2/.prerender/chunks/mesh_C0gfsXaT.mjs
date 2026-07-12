import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { a as CHANNEL_LIST } from './channels_C2qW9mSV.mjs';
import { B as BLOCK_TYPE_LIST } from './block-types_l5R3rOkI.mjs';
import { c as countByStatus, N as NEIGHBORHOODS_BY_DISTANCE, R as RADIUS_MILES } from './neighborhoods_BtGyzOCy.mjs';

const $$Mesh = createComponent(async ($$result, $$props, $$slots) => {
  const blocks = await getCollection("blocks", ({ data }) => !data.draft);
  const totalBlocks = blocks.length;
  const visits = blocks.filter(
    (b) => b.data.type === "VISIT" || Boolean(b.data.visitor?.geo) || Boolean(b.data.meta?.location)
  );
  visits.filter((b) => b.data.visitor?.kind !== "agent").length;
  visits.filter((b) => b.data.visitor?.kind === "agent").length;
  const nearestNeighborhoods = NEIGHBORHOODS_BY_DISTANCE.slice(0, 6);
  const neighborhoodCounts = countByStatus();
  NEIGHBORHOODS_BY_DISTANCE.filter((n) => n.status === "seed").map((n) => n.name);
  const blocksByChannel = CHANNEL_LIST.map((ch) => ({
    code: ch.code,
    slug: ch.slug,
    name: ch.name,
    purpose: ch.purpose,
    color600: ch.color600,
    color800: ch.color800,
    count: blocks.filter((b) => b.data.channel === ch.code).length
  }));
  const blocksByType = BLOCK_TYPE_LIST.map((t) => ({
    code: t.code,
    label: t.label,
    count: blocks.filter((b) => b.data.type === t.code).length
  }));
  const agentSurfaces = [
    { path: "/agents.json", kind: "manifest", desc: "Consolidated discovery manifest. Every machine-readable surface, contract addresses, stripped-HTML spec." },
    { path: "/blocks.json", kind: "feed", desc: "Full block list. Same shape the homepage renders from." },
    { path: "/archive.json", kind: "feed", desc: "Reverse-chronological archive." },
    { path: "/editions.json", kind: "feed", desc: "All blocks with an edition (MINT / FAUCET)." },
    { path: "/now.json", kind: "state", desc: 'Current mood / run state / top-of-stack. Shapes "what is PointCast doing right now".' },
    { path: "/cast.json", kind: "feed", desc: "Sunday Cast lineup." },
    { path: "/battle.json", kind: "feed", desc: "Battler Card of the Day + rotation." },
    { path: "/timeline.json", kind: "feed", desc: "Day-keyed rollup of every published block." },
    { path: "/feed.json", kind: "feed", desc: "JSON Feed 1.1 of posts." },
    { path: "/feed.xml", kind: "rss", desc: "RSS 2.0 of posts." },
    { path: "/rss.xml", kind: "rss", desc: "RSS 2.0 aliased." },
    { path: "/c/{slug}.json", kind: "channel", desc: "Per-channel JSON feed (one per each of the 9 channels)." },
    { path: "/c/{slug}.rss", kind: "channel", desc: "Per-channel RSS feed (one per each of the 9 channels)." },
    { path: "/b/{id}.json", kind: "block", desc: "Per-block JSON sibling to /b/{id}." },
    { path: "/llms.txt", kind: "index", desc: "LLM-discovery convention (short)." },
    { path: "/llms-full.txt", kind: "index", desc: "LLM-discovery convention (verbose)." },
    { path: "/sitemap-blocks.xml", kind: "sitemap", desc: "Sitemap of every block (for crawlers)." },
    { path: "/for-agents", kind: "doc", desc: "Human-readable manifest. Explains the Block primitive, channels, citation format." }
  ];
  const agentUAs = [
    "ai:*",
    "GPTBot",
    "ClaudeBot",
    "PerplexityBot",
    "OAI-SearchBot",
    "Atlas",
    "Google-Extended"
  ];
  const title = "Mesh — three networks that carry PointCast";
  const description = "PointCast runs on three meshes at once. LOCAL: the 25-mile radius around El Segundo. ONLINE: nine channels, RSS, JSON feeds, Farcaster. AGENT: stripped-HTML, /agents.json, llms.txt, every block as JSON. This page is the map.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Collection",
    name: "PointCast Mesh",
    description,
    url: "https://pointcast.xyz/mesh",
    hasPart: [
      { "@type": "Place", name: "Local Mesh (25-mile radius, El Segundo-centered)", url: "https://pointcast.xyz/beacon" },
      { "@type": "DataFeed", name: "Online Mesh (channels + RSS + JSON feeds)", url: "https://pointcast.xyz/agents.json" },
      { "@type": "Dataset", name: "Agent Mesh (stripped-HTML + llms.txt + machine manifest)", url: "https://pointcast.xyz/for-agents" }
    ]
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/mesh.png", "jsonLd": jsonLd, "data-astro-cid-wv7vbxcc": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="mesh" data-astro-cid-wv7vbxcc> <header class="mesh__head" data-astro-cid-wv7vbxcc> <p class="kicker mono" data-astro-cid-wv7vbxcc>MESH</p> <h1 class="title" data-astro-cid-wv7vbxcc>Three networks, one broadcast.</h1> <p class="dek" data-astro-cid-wv7vbxcc>
PointCast isn't one site. It's a thing sitting inside three overlapping
        networks: a <strong data-astro-cid-wv7vbxcc>local</strong> one (25-mile radius around El Segundo),
        an <strong data-astro-cid-wv7vbxcc>online</strong> one (nine channels, feeds, wallets), and an
<strong data-astro-cid-wv7vbxcc>agent</strong> one (stripped HTML and JSON surfaces every
        LLM / crawler / indexer walks). This page shows all three at once.
</p> </header> <section class="layer layer--local" data-astro-cid-wv7vbxcc> <div class="layer__head" data-astro-cid-wv7vbxcc> <p class="layer__kicker mono" data-astro-cid-wv7vbxcc>MESH · LOCAL</p> <h2 class="layer__title" data-astro-cid-wv7vbxcc>25-mile radius.</h2> <p class="layer__dek" data-astro-cid-wv7vbxcc>
El Segundo is the center. Every block tagged with a location, every
          visit-drop, every pickleball court, every cafe. The mesh isn't a
          Wi-Fi network (yet) — it's the set of places the site has been or
          wants to go.
</p> </div> <div class="layer__grid" data-astro-cid-wv7vbxcc> <div class="stat" data-astro-cid-wv7vbxcc> <span class="stat__value mono" data-astro-cid-wv7vbxcc>${RADIUS_MILES}<span class="stat__unit mono" data-astro-cid-wv7vbxcc>MI</span></span> <span class="stat__label mono" data-astro-cid-wv7vbxcc>RADIUS</span> </div> <div class="stat" data-astro-cid-wv7vbxcc> <span class="stat__value mono" data-astro-cid-wv7vbxcc>${NEIGHBORHOODS_BY_DISTANCE.length}</span> <span class="stat__label mono" data-astro-cid-wv7vbxcc>NEIGHBORHOODS</span> </div> <div class="stat" data-astro-cid-wv7vbxcc> <span class="stat__value mono" data-astro-cid-wv7vbxcc>${visits.length}</span> <span class="stat__label mono" data-astro-cid-wv7vbxcc>VISITS</span> </div> <div class="stat" data-astro-cid-wv7vbxcc> <span class="stat__value mono" data-astro-cid-wv7vbxcc>${totalBlocks}</span> <span class="stat__label mono" data-astro-cid-wv7vbxcc>TOTAL BLOCKS</span> </div> </div> <div class="places" data-astro-cid-wv7vbxcc> <p class="places__title mono" data-astro-cid-wv7vbxcc>NEAREST · ${nearestNeighborhoods.length} OF ${NEIGHBORHOODS_BY_DISTANCE.length}</p> <ul class="places__list" data-astro-cid-wv7vbxcc> ${nearestNeighborhoods.map((p) => renderTemplate`<li${addAttribute(`place place--${p.status}`, "class")} data-astro-cid-wv7vbxcc> <span class="place__name" data-astro-cid-wv7vbxcc>${p.name}</span> <span class="place__dist mono" data-astro-cid-wv7vbxcc>${p.distance} MI · ${p.bearing}</span> <span class="place__status mono" data-astro-cid-wv7vbxcc>${p.status.toUpperCase()}</span> </li>`)} </ul> </div> <div class="layer__cta" data-astro-cid-wv7vbxcc> <a class="btn" href="/beacon" data-astro-cid-wv7vbxcc>→ /beacon · full map + 19 neighborhoods (${neighborhoodCounts.seed} seed, ${neighborhoodCounts.target} target, ${neighborhoodCounts.adjacent} adjacent)</a> <a class="btn btn--ghost" href="/c/visit" data-astro-cid-wv7vbxcc>→ CH.VST · visit log</a> </div> </section> <section class="layer layer--online" data-astro-cid-wv7vbxcc> <div class="layer__head" data-astro-cid-wv7vbxcc> <p class="layer__kicker mono" data-astro-cid-wv7vbxcc>MESH · ONLINE</p> <h2 class="layer__title" data-astro-cid-wv7vbxcc>Nine channels, open feeds.</h2> <p class="layer__dek" data-astro-cid-wv7vbxcc>
Each channel has a color, a slug, a purpose, and three feeds: HTML
          at <code data-astro-cid-wv7vbxcc>/c/&#123;slug&#125;</code>, JSON at <code data-astro-cid-wv7vbxcc>/c/&#123;slug&#125;.json</code>,
          RSS at <code data-astro-cid-wv7vbxcc>/c/&#123;slug&#125;.rss</code>. Subscribe to as few or as
          many as you like. That's the mesh — readers pick their own slice.
</p> </div> <ul class="chan-grid" data-astro-cid-wv7vbxcc> ${blocksByChannel.map((c) => renderTemplate`<li class="chan"${addAttribute(`--ch: ${c.color600}; --ch-deep: ${c.color800}`, "style")} data-astro-cid-wv7vbxcc> <a${addAttribute(`/c/${c.slug}`, "href")} class="chan__link" data-astro-cid-wv7vbxcc> <span class="chan__code mono" data-astro-cid-wv7vbxcc>CH.${c.code}</span> <span class="chan__name" data-astro-cid-wv7vbxcc>${c.name}</span> <span class="chan__purpose" data-astro-cid-wv7vbxcc>${c.purpose}</span> <span class="chan__count mono" data-astro-cid-wv7vbxcc>${c.count} BLOCKS</span> <span class="chan__feeds mono" data-astro-cid-wv7vbxcc> <a${addAttribute(`/c/${c.slug}.json`, "href")} onclick="event.stopPropagation()" data-astro-cid-wv7vbxcc>.json</a>
· <a${addAttribute(`/c/${c.slug}.rss`, "href")} onclick="event.stopPropagation()" data-astro-cid-wv7vbxcc>.rss</a> </span> </a> </li>`)} </ul> <div class="layer__cta" data-astro-cid-wv7vbxcc> <a class="btn" href="/subscribe" data-astro-cid-wv7vbxcc>→ /subscribe · RSS + JSON + email</a> <a class="btn btn--ghost" href="/feed.xml" data-astro-cid-wv7vbxcc>→ /feed.xml (all posts)</a> </div> </section> <section class="layer layer--agent" data-astro-cid-wv7vbxcc> <div class="layer__head" data-astro-cid-wv7vbxcc> <p class="layer__kicker mono" data-astro-cid-wv7vbxcc>MESH · AGENT</p> <h2 class="layer__title" data-astro-cid-wv7vbxcc>Parallel machine surface.</h2> <p class="layer__dek" data-astro-cid-wv7vbxcc>
Every page on PointCast has a JSON sibling. Every channel has a feed.
          Every block has a citation format. Agents that announce themselves
          via User-Agent (prefix <code data-astro-cid-wv7vbxcc>ai:</code>, or one of the well-known
          bots) get stripped HTML — no CSS, no preload, no inline JS — for
          ~12% smaller payload. CORS is open on every JSON endpoint. No
          preflight.
</p> </div> <div class="layer__grid" data-astro-cid-wv7vbxcc> <div class="stat" data-astro-cid-wv7vbxcc> <span class="stat__value mono" data-astro-cid-wv7vbxcc>${agentSurfaces.length}</span> <span class="stat__label mono" data-astro-cid-wv7vbxcc>AGENT SURFACES</span> </div> <div class="stat" data-astro-cid-wv7vbxcc> <span class="stat__value mono" data-astro-cid-wv7vbxcc>${CHANNEL_LIST.length}</span> <span class="stat__label mono" data-astro-cid-wv7vbxcc>CHANNELS × 3 FEEDS</span> </div> <div class="stat" data-astro-cid-wv7vbxcc> <span class="stat__value mono" data-astro-cid-wv7vbxcc>${BLOCK_TYPE_LIST.length}</span> <span class="stat__label mono" data-astro-cid-wv7vbxcc>BLOCK TYPES</span> </div> <div class="stat" data-astro-cid-wv7vbxcc> <span class="stat__value mono" data-astro-cid-wv7vbxcc>${agentUAs.length}</span> <span class="stat__label mono" data-astro-cid-wv7vbxcc>DETECTED UAs</span> </div> </div> <div class="agent-table" data-astro-cid-wv7vbxcc> <p class="agent-table__title mono" data-astro-cid-wv7vbxcc>WHAT AGENTS CAN WALK</p> <ul class="agent-list" data-astro-cid-wv7vbxcc> ${agentSurfaces.map((s) => renderTemplate`<li class="agent-item" data-astro-cid-wv7vbxcc> <a${addAttribute(s.path.includes("{") ? "/agents.json" : s.path, "href")} class="agent-item__path mono" data-astro-cid-wv7vbxcc>${s.path}</a> <span class="agent-item__kind mono" data-astro-cid-wv7vbxcc>${s.kind.toUpperCase()}</span> <span class="agent-item__desc" data-astro-cid-wv7vbxcc>${s.desc}</span> </li>`)} </ul> </div> <div class="ua-box" data-astro-cid-wv7vbxcc> <p class="ua-box__title mono" data-astro-cid-wv7vbxcc>DETECTED USER-AGENTS · STRIPPED-HTML MODE</p> <ul class="ua-list" data-astro-cid-wv7vbxcc> ${agentUAs.map((ua) => renderTemplate`<li class="mono" data-astro-cid-wv7vbxcc>${ua}</li>`)} </ul> <p class="ua-box__note" data-astro-cid-wv7vbxcc>
When any of these hit a page, the response strips <code data-astro-cid-wv7vbxcc>&lt;style&gt;</code>,
<code data-astro-cid-wv7vbxcc>&lt;link rel="preload"&gt;</code>, inline <code data-astro-cid-wv7vbxcc>&lt;script&gt;</code>,
          icons, and generator meta. JSON-LD is preserved. An <code data-astro-cid-wv7vbxcc>X-Agent-Mode</code>
response header carries the vendor.
</p> </div> <div class="layer__cta" data-astro-cid-wv7vbxcc> <a class="btn" href="/agents.json" data-astro-cid-wv7vbxcc>→ /agents.json · the manifest</a> <a class="btn btn--ghost" href="/for-agents" data-astro-cid-wv7vbxcc>→ /for-agents · human-readable mirror</a> <a class="btn btn--ghost" href="/llms.txt" data-astro-cid-wv7vbxcc>→ /llms.txt</a> </div> </section> <section class="types" data-astro-cid-wv7vbxcc> <p class="types__title mono" data-astro-cid-wv7vbxcc>CONTENT SHAPE · ${BLOCK_TYPE_LIST.length} BLOCK TYPES</p> <ul class="types__list" data-astro-cid-wv7vbxcc> ${blocksByType.map((t) => renderTemplate`<li class="type" data-astro-cid-wv7vbxcc> <span class="type__code mono" data-astro-cid-wv7vbxcc>${t.code}</span> <span class="type__label" data-astro-cid-wv7vbxcc>${t.label}</span> <span class="type__count mono" data-astro-cid-wv7vbxcc>${t.count}</span> </li>`)} </ul> </section> <section class="closing" data-astro-cid-wv7vbxcc> <p class="closing__kicker mono" data-astro-cid-wv7vbxcc>READ NEXT</p> <ul class="closing__list" data-astro-cid-wv7vbxcc> <li data-astro-cid-wv7vbxcc><a href="/manifesto" data-astro-cid-wv7vbxcc>/manifesto</a> — the why</li> <li data-astro-cid-wv7vbxcc><a href="/for-agents" data-astro-cid-wv7vbxcc>/for-agents</a> — the agent-facing README</li> <li data-astro-cid-wv7vbxcc><a href="/glossary" data-astro-cid-wv7vbxcc>/glossary</a> — the 24 terms</li> <li data-astro-cid-wv7vbxcc><a href="/beacon" data-astro-cid-wv7vbxcc>/beacon</a> — the 25-mile map</li> <li data-astro-cid-wv7vbxcc><a href="/dao" data-astro-cid-wv7vbxcc>/dao</a> — the governance layer</li> <li data-astro-cid-wv7vbxcc><a href="/yield" data-astro-cid-wv7vbxcc>/yield</a> — the economics sandbox</li> <li data-astro-cid-wv7vbxcc><a href="/yee" data-astro-cid-wv7vbxcc>/yee</a> — the rhythm overlay</li> </ul> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/mesh.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/mesh.astro";
const $$url = "/mesh";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Mesh,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
