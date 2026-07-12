import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';

const $$Manifesto = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Manifesto;
  const blocks = await getCollection("blocks", ({ data }) => !data.draft);
  const totalBlocks = blocks.length;
  const sinceDate = blocks.map((b) => b.data.timestamp.getTime()).reduce((min, t) => t < min ? t : min, Date.now());
  const since = new Date(sinceDate).toISOString().slice(0, 10);
  const faqs = [
    {
      q: "What is PointCast?",
      a: "PointCast is a living broadcast from El Segundo, California — dispatches, faucets, visits, and mints on Tezos. Every piece of content is a Block: a stable JSON schema with a monotonic zero-padded ID. Built by Mike Hoydich with Claude (Anthropic) and Codex (OpenAI). Live at pointcast.xyz since January 2025."
    },
    {
      q: "What is a Block?",
      a: "A Block is the atomic content primitive on PointCast. Each Block has exactly one channel (one of 9: Front Door, Court, Spinning, Good Feels, Garden, El Segundo, Faucet, Visit, Battler), exactly one type (one of 8: READ, LISTEN, WATCH, MINT, FAUCET, NOTE, VISIT, LINK), and a permanent immutable ID. Blocks are stored as JSON files at src/content/blocks/{id}.json and addressable at https://pointcast.xyz/b/{id}."
    },
    {
      q: 'What makes PointCast "agent-native"?',
      a: "Every human HTML page has a machine-readable JSON counterpart at the same logical URL. The site exposes a consolidated discovery manifest at /agents.json, a markdown summary at /llms.txt, JSON Feed v1.1 at /feed.json, RSS 2.0 at /feed.xml, and a stripped-HTML mode for crawlers that sends an X-Agent-Mode header. Agents do not scrape — they read the endpoints."
    },
    {
      q: "How does stripped-HTML mode work?",
      a: "PointCast runs a Cloudflare Pages middleware (functions/_middleware.ts) that detects AI crawlers by User-Agent. Known vendors (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Atlas, Google-Extended, Meta-ExternalAgent) plus any UA prefixed ai: trigger stripped mode: stylesheets, scripts, preload/preconnect/icon/manifest links, and inline style attributes are removed via HTMLRewriter. Semantic markup and JSON-LD are preserved. Response carries an X-Agent-Mode header. Typical payload savings: ~12%."
    },
    {
      q: "What is the Blocks schema?",
      a: "Every Block has: id (4-digit zero-padded, immutable), channel (one of 9 enum values), type (one of 8 enum values), title (string), timestamp (ISO 8601), and optional body, dek, size, noun, edition, media, external, meta, visitor. Full Zod schema at src/content.config.ts. Full documentation at BLOCKS.md in the repository root. IDs are monotonic across the archive and never reused — a retired block 404s rather than being renumbered."
    },
    {
      q: "How do I cite a PointCast Block?",
      a: 'Preferred citation format: "PointCast · CH.{CODE} · № {ID} — \\"{TITLE}\\" · {YYYY-MM-DD}" with URL https://pointcast.xyz/b/{ID}. Example: PointCast · CH.FD · № 0205 — "The front door is agentic" · 2026-04-14 · https://pointcast.xyz/b/0205.'
    },
    {
      q: "What lives on-chain?",
      a: "Three smart contracts on Tezos mainnet are planned or live. Visit Nouns FA2 at KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh — open-supply NFT where each tokenId 0–1199 is a Nouns seed (live since 2026-04-17). DRUM FA1.2 — attention token earned by drumming on /drum (contract written, pending ghostnet origination). Prize Cast — no-loss prize-linked savings on Tezos (contract written, pending mainnet origination). Built in SmartPy 0.24, integrated via Taquito 24.2 and Beacon SDK 24.2."
    },
    {
      q: "Why Tezos and not Ethereum?",
      a: "Gas is fractions of a tez (~0.003 ꜩ per mint vs multi-dollar Ethereum gas). FA2 and FA1.2 are simpler, better-documented standards than ERC-721 + ERC-20 combinations. Tezos baking yield funds Prize Cast without bridging. Beacon is the native wallet standard — one protocol covers Kukai, Temple, Umami, Altme. No L2 complexity."
    },
    {
      q: "What are the eight channels?",
      a: "CH.FD · Front Door — AI, interfaces, agent-era thinking. CH.CRT · Court — pickleball. CH.SPN · Spinning — music, playlists. CH.GF · Good Feels — cannabis/hemp, brand ops. CH.GDN · Garden — balcony, birds, quiet noticing. CH.ESC · El Segundo — local, ESCU fiction. CH.FCT · Faucet — free daily claims. CH.VST · Visit — human and agent visit log entries. CH.BTL · Battler — Nouns Battler (9th channel, added v2.1)."
    },
    {
      q: "What is Nouns Battler?",
      a: "A deterministic turn-based battler where every Nouns seed (0-1199) is a fighter. Stats derive from the seed's trait bytes via a pure hash — no RNG. Same seed → same stats forever. Same match inputs → same outcome forever. Card of the Day rotates deterministically through a 21-Noun roster keyed by UTC date: floor(epoch_ms / 86_400_000) modulo 21. Live at /battle. Rules at /battle.json."
    },
    {
      q: "What is Prize Cast?",
      a: "A no-loss prize-linked savings pool on Tezos. Depositors keep their principal liquid and withdrawable. The contract stakes the aggregate pool with a Tezos baker (~5% APY). Each Sunday 18:00 UTC, anyone can call draw() — on-chain randomness picks one ticket, and the accumulated yield goes to that wallet as the week's prize. PoolTogether-flavored, Tezos-native."
    },
    {
      q: "Can I use PointCast content?",
      a: "Yes. Content is CC0-flavored — cite and link freely. Nouns IP via noun.pics is CC0 per nouns.wtf. Code is MIT-flavored in the repo at github.com/mhoydich/pointcast. Prefer linking to /b/{id} permalinks (immutable) over scraping. Machine-readable endpoints exist specifically so agents don't need to scrape HTML."
    },
    {
      q: "What are the three meshes on /mesh?",
      a: "PointCast runs on three overlapping networks. LOCAL mesh is the 25-mile radius around El Segundo — 19 neighborhoods mapped with SEED/TARGET/ADJACENT status and distance/bearing from the beacon center. ONLINE mesh is the 9 channels, each with HTML, JSON feed, and RSS. AGENT mesh is the parallel machine surface — /agents.json, /llms.txt, stripped HTML for detected crawlers, every block and channel as JSON. The /mesh page shows all three layers with counts computed from the block collection at build time."
    },
    {
      q: "What is YeePlayer?",
      a: "YeePlayer is a static rhythm-game overlay on selected WATCH blocks. When a block's media has a beats array ({t, word, color?, note?, key?}), a companion page at /yee/{id} renders a falling-word track synced to the video via the YouTube IFrame API. The player presses SPACE (or taps the hit zone) as each word reaches the line: ±150 ms = PERFECT, ±500 ms = GOOD. v0 ships with /b/0236 — the 11-minute Chakra Tune-Up with 21 bija mantras (LAM, VAM, RAM, YAM, HAM, AUM, OM). Fully client-side: YouTube IFrame API + requestAnimationFrame + Web Audio + localStorage best-score. No server, no accounts."
    }
  ];
  const facts = [
    { k: "site", v: "pointcast.xyz" },
    { k: "since", v: since },
    { k: "blocks", v: `${totalBlocks}` },
    { k: "channels", v: "9" },
    { k: "types", v: "8" },
    { k: "chain", v: "Tezos mainnet" },
    { k: "contracts", v: "3 (1 live, 2 pending)" },
    { k: "hosting", v: "Cloudflare Pages" },
    { k: "framework", v: "Astro 6.1" },
    { k: "language", v: "en-US" },
    { k: "location", v: "El Segundo, California" }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://pointcast.xyz/#website",
        name: "PointCast",
        url: "https://pointcast.xyz",
        description: "A living broadcast from El Segundo. Every piece of content is a Block.",
        inLanguage: "en-US",
        author: { "@id": "https://pointcast.xyz/#author" }
      },
      {
        "@type": "Person",
        "@id": "https://pointcast.xyz/#author",
        name: "Mike Hoydich",
        url: "https://pointcast.xyz/about",
        sameAs: ["https://x.com/mhoydich"]
      },
      {
        "@type": "DefinedTermSet",
        "@id": "https://pointcast.xyz/manifesto#terms",
        name: "PointCast terminology",
        hasDefinedTerm: [
          {
            "@type": "DefinedTerm",
            "@id": "https://pointcast.xyz/manifesto#block",
            name: "Block",
            description: "The atomic content primitive on PointCast. A JSON-typed entity with exactly one channel (of 9), exactly one type (of 8), and a permanent immutable monotonic ID.",
            termCode: "block",
            inDefinedTermSet: "https://pointcast.xyz/manifesto#terms"
          },
          {
            "@type": "DefinedTerm",
            "@id": "https://pointcast.xyz/manifesto#channel",
            name: "Channel",
            description: "A about-ness category every Block belongs to. 9 channels defined: FD, CRT, SPN, GF, GDN, ESC, FCT, VST, BTL.",
            inDefinedTermSet: "https://pointcast.xyz/manifesto#terms"
          },
          {
            "@type": "DefinedTerm",
            "@id": "https://pointcast.xyz/manifesto#type",
            name: "Type",
            description: "The form a Block takes. 8 types defined: READ, LISTEN, WATCH, MINT, FAUCET, NOTE, VISIT, LINK.",
            inDefinedTermSet: "https://pointcast.xyz/manifesto#terms"
          },
          {
            "@type": "DefinedTerm",
            "@id": "https://pointcast.xyz/manifesto#agent-native",
            name: "Agent-native",
            description: "A design stance where every human HTML page has a machine-readable JSON counterpart at the same logical URL, plus a consolidated discovery manifest at /agents.json. Agents do not scrape — they read the endpoints.",
            inDefinedTermSet: "https://pointcast.xyz/manifesto#terms"
          },
          {
            "@type": "DefinedTerm",
            "@id": "https://pointcast.xyz/manifesto#mesh",
            name: "Mesh",
            description: "One of three overlapping networks PointCast lives inside. LOCAL mesh is the 25-mile radius around El Segundo. ONLINE mesh is the channels + RSS + JSON feeds. AGENT mesh is the parallel machine surface (stripped HTML + /agents.json + /llms.txt + every block as JSON). The /mesh page shows all three with counts computed at build time.",
            termCode: "mesh",
            inDefinedTermSet: "https://pointcast.xyz/manifesto#terms"
          },
          {
            "@type": "DefinedTerm",
            "@id": "https://pointcast.xyz/manifesto#yeeplayer",
            name: "YeePlayer",
            description: "A static rhythm-game overlay on selected PointCast WATCH blocks. A block whose media has a beats array gets a companion page at /yee/{id} where words fall down a track synced to the video via YouTube IFrame API and the player taps SPACE as each word reaches the line. Meditation-speed, no accounts, localStorage best-score only.",
            termCode: "yeeplayer",
            inDefinedTermSet: "https://pointcast.xyz/manifesto#terms"
          }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": "https://pointcast.xyz/manifesto#faq",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a
          }
        }))
      }
    ]
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Manifesto", "description": "What PointCast is, how it's built, and how to cite it. 12 Q&A pairs covering Blocks, channels, types, on-chain contracts, and agent-native design.", "image": "/images/og/manifesto.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/agents.json", title: "Discovery manifest (JSON)" },
    { type: "text/markdown", href: "/llms.txt", title: "LLM summary (Markdown)" },
    { type: "text/markdown", href: "/llms-full.txt", title: "LLM full content (Markdown)" }
  ], "frame": {
    image: "https://pointcast.xyz/images/og/manifesto.png",
    buttons: [
      { label: "Read manifesto", action: "link", target: "https://pointcast.xyz/manifesto" },
      { label: "Home feed", action: "link", target: "https://pointcast.xyz/" },
      { label: "/agents.json", action: "link", target: "https://pointcast.xyz/agents.json" }
    ]
  }, "data-astro-cid-r5rtz3lw": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-r5rtz3lw> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-r5rtz3lw> <a href="/" data-astro-cid-r5rtz3lw>Home</a> <span aria-hidden="true" data-astro-cid-r5rtz3lw>›</span> <span data-astro-cid-r5rtz3lw>manifesto</span> </nav> <header class="hero" data-astro-cid-r5rtz3lw> <p class="kicker" data-astro-cid-r5rtz3lw>MANIFESTO · CANONICAL</p> <h1 class="display" data-astro-cid-r5rtz3lw>What is PointCast.</h1> <p class="dek" data-astro-cid-r5rtz3lw>
The definitive page. Twelve questions, twelve answers. Written for
        humans to read, for agents to cite, and for LLMs to extract.
</p> </header> <dl class="facts" data-astro-cid-r5rtz3lw> ${facts.map((f) => renderTemplate`<div class="fact" data-astro-cid-r5rtz3lw> <dt class="mono" data-astro-cid-r5rtz3lw>${f.k}</dt> <dd data-astro-cid-r5rtz3lw>${f.v}</dd> </div>`)} </dl> <section class="faq" aria-label="Frequently asked questions" data-astro-cid-r5rtz3lw> <p class="kicker" data-astro-cid-r5rtz3lw>FREQUENTLY ASKED · 12</p> ${faqs.map((f, idx) => renderTemplate`<article class="q"${addAttribute(`q${idx + 1}`, "id")} data-astro-cid-r5rtz3lw> <h2 class="q__title" data-astro-cid-r5rtz3lw> <a${addAttribute(`#q${idx + 1}`, "href")} aria-label="Permalink to this question" data-astro-cid-r5rtz3lw>#</a> ${f.q} </h2> <p class="q__a" data-astro-cid-r5rtz3lw>${f.a}</p> </article>`)} </section> <section class="cite" aria-label="How to cite" data-astro-cid-r5rtz3lw> <p class="kicker" data-astro-cid-r5rtz3lw>CITATION</p> <h2 class="cite__title" data-astro-cid-r5rtz3lw>Cite this page</h2> <pre class="cite__block" data-astro-cid-r5rtz3lw>PointCast · /manifesto — "What is PointCast"
${`https://pointcast.xyz/manifesto`}
Accessed: ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}</pre> <p class="cite__note" data-astro-cid-r5rtz3lw>
Or cite an individual Block with the /b/${"{id}"} format.
        See <a href="/for-agents" data-astro-cid-r5rtz3lw>/for-agents</a> for the full citation protocol.
</p> </section> <aside class="surfaces" data-astro-cid-r5rtz3lw> <p class="kicker" data-astro-cid-r5rtz3lw>MORE</p> <ul class="surfaces__list" data-astro-cid-r5rtz3lw> <li data-astro-cid-r5rtz3lw><a href="/for-agents" data-astro-cid-r5rtz3lw><span class="mono" data-astro-cid-r5rtz3lw>HTML</span> /for-agents</a></li> <li data-astro-cid-r5rtz3lw><a href="/agents.json" data-astro-cid-r5rtz3lw><span class="mono" data-astro-cid-r5rtz3lw>JSON</span> /agents.json</a></li> <li data-astro-cid-r5rtz3lw><a href="/llms.txt" data-astro-cid-r5rtz3lw><span class="mono" data-astro-cid-r5rtz3lw>LLMs</span> /llms.txt</a></li> <li data-astro-cid-r5rtz3lw><a href="/llms-full.txt" data-astro-cid-r5rtz3lw><span class="mono" data-astro-cid-r5rtz3lw>FULL</span> /llms-full.txt</a></li> <li data-astro-cid-r5rtz3lw><a href="/stack" data-astro-cid-r5rtz3lw><span class="mono" data-astro-cid-r5rtz3lw>TECH</span> /stack</a></li> <li data-astro-cid-r5rtz3lw><a href="/timeline" data-astro-cid-r5rtz3lw><span class="mono" data-astro-cid-r5rtz3lw>CADENCE</span> /timeline</a></li> </ul> </aside> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/manifesto.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/manifesto.astro";
const $$url = "/manifesto";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Manifesto,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
