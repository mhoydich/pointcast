import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$Stack = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Stack;
  const LAYERS = [
    {
      code: "RT",
      name: "Runtime",
      note: "Static site compiled once, served from the edge. No server processes, no databases — state lives in files + Cloudflare KV.",
      items: [
        { name: "Astro 6.1", url: "https://astro.build", role: "static-site framework", why: "Islands + file-based routing + content collections keep the Blocks primitive expressible without a CMS." },
        { name: "Cloudflare Pages", url: "https://pages.cloudflare.com", role: "static hosting + edge functions", why: "Global edge, Pages Functions for the middleware (agent-mode UA sniff, presence, metadata endpoint), and KV for presence counters." },
        { name: "Vite", url: "https://vitejs.dev", role: "bundler", why: "Ships with Astro. Zero config once the Inter/JetBrains Mono variable fonts are wired via @fontsource-variable." },
        { name: "TypeScript", url: "https://www.typescriptlang.org", role: "types", why: "Blocks schema is type-checked, channel codes are a union type, no drift between docs and code." }
      ]
    },
    {
      code: "CT",
      name: "Content",
      note: "Every block is a JSON file in src/content/blocks/. The BLOCKS.md schema is the source of truth; the repo is the CMS.",
      items: [
        { name: "Astro Content Collections", url: "https://docs.astro.build/en/guides/content-collections/", role: "typed content layer", why: "getCollection() gives schema-validated blocks at build time. Zero runtime content lookup." },
        { name: "Markdown", url: "https://daringfireball.net/projects/markdown/", role: "long-form body format", why: "Body text on READ-type blocks; posts/ directory for long-form Cowork essays." },
        { name: "Inter (Variable)", url: "https://rsms.me/inter/", role: "sans-serif display + body", why: "Self-hosted via @fontsource-variable/inter. No Google Fonts request." },
        { name: "JetBrains Mono (Variable)", url: "https://www.jetbrains.com/lp/mono/", role: "monospace", why: "Self-hosted variable. Every BlockCard header + footer line uses it; kickers, IDs, timestamps." }
      ]
    },
    {
      code: "TZ",
      name: "On-chain (Tezos)",
      note: "Free mainnet FA2 + planned FA1.2 + Prize Cast. Signer keys are throwaways; admin is Mike's wallet post-transfer.",
      items: [
        { name: "SmartPy 0.24", url: "https://smartpy.io", role: "contract language", why: "Python-flavored Michelson compiler. contracts/v2/*.py → Michelson JSON → originated via Taquito." },
        { name: "Taquito 24.2", url: "https://tezostaquito.io", role: "Tezos JS SDK", why: "Originates contracts, calls entrypoints, reads storage. Beacon-integrated for wallet-signed ops." },
        { name: "Beacon SDK 24.2", url: "https://walletbeacon.io", role: "wallet connector", why: "Kukai, Temple, Umami, Altme — one protocol, any wallet. 24.2 required network at DAppClient instantiation, not requestPermissions (a footgun we hit in v4)." },
        { name: "TzKT", url: "https://tzkt.io", role: "indexer + REST API", why: "Live totalSupply, token metadata, account balances. Polled at build time for /collection, /editions, /now." },
        { name: "objkt.com", url: "https://objkt.com", role: "marketplace", why: "Every Visit Nouns mint surfaces in the collection page. /collect tokens list via objkt CDN." },
        { name: "noun.pics", url: "https://noun.pics", role: "CC0 Nouns avatars", why: "Source for all Noun glyphs on the site. Seed IDs 0-1199; CC0 per nouns.wtf." }
      ]
    },
    {
      code: "AG",
      name: "Agent layer",
      note: "Four ways for machines to consume PointCast without scraping HTML.",
      items: [
        { name: "/agents.json", url: "https://pointcast.xyz/agents.json", role: "discovery manifest", why: "One request → every endpoint, contract, channel, type, agent-mode spec. Aliased at .well-known/agents.json." },
        { name: "JSON Feed v1.1", url: "https://pointcast.xyz/feed.json", role: "standards feed", why: "Every block in jsonfeed.org v1.1 format. Most modern readers speak it." },
        { name: "JSON-LD (schema.org)", url: "https://schema.org", role: "inline structured data", why: "Every page carries JSON-LD: CreativeWork on blocks, CollectionPage on indexes, WebApplication on /battle." },
        { name: "Stripped HTML mode", role: "UA-based CSS/JS strip", why: "ai:* User-Agents + GPTBot/ClaudeBot/etc get CSS and JS removed at the edge via HTMLRewriter. ~12% payload savings." },
        { name: "llms.txt", url: "https://pointcast.xyz/llms.txt", role: "LLM summary", why: "Emerging convention: a markdown doc summarizing the site for LLMs." }
      ]
    },
    {
      code: "TM",
      name: "Team",
      note: "Multi-agent workflow. Mike is the director; the rest are hands.",
      items: [
        { name: "Mike Hoydich", url: "https://pointcast.xyz/about", role: "director · strategy · content · approvals", why: "Writes the dispatches, makes brand/aesthetic/GTM calls, approves merges + contract deploys." },
        { name: "Claude Code", url: "https://claude.com/claude-code", role: "primary engineer", why: "Architecture, schema, rendering, routing, contracts, deploys. Default to sonnet; 1M-context for multi-hour sessions." },
        { name: "Codex", url: "https://openai.com/codex", role: "specialist reviewer", why: "Code review before main merges; alternative UI passes; second opinions. Medium reasoning, serial runs — xhigh concurrent hangs observed." },
        { name: "Manus", url: "https://manus.im", role: "operations + computer-use", why: "Behind-login ops: deploy settings, DNS, objkt collection admin, end-to-end mint testing as a real user." }
      ]
    },
    {
      code: "NO",
      name: "Deliberately not using",
      note: "Things we skipped on purpose. Not exhaustive — just the interesting no's.",
      items: [
        { name: "Google Analytics / GA4", role: "no analytics", why: "Privacy by default. No telemetry, no cookie banners, no fingerprinting. If we add analytics later it will be Plausible or Fathom, first-party, self-hosted." },
        { name: "React / Next.js / SPA framework", role: "static-first", why: "Hydrating JSX is overkill for a content site. Astro ships HTML + tiny islands; typical page is under 20KB of JS." },
        { name: "WalletConnect / Rainbow Kit", role: "Tezos-only wallets", why: "Beacon is the native Tezos standard. We don't pretend to be multichain." },
        { name: "Search-as-a-service", role: "client-side search", why: "/search bakes the index into the page (~6KB). No Algolia, no Meilisearch, no network round-trip." },
        { name: "Cookie banner", role: "no tracking cookies", why: "No cookies set by PointCast. Wallets set their own. Nothing to consent to." }
      ]
    }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": "https://pointcast.xyz/stack",
    name: "PointCast · stack",
    description: "Technical disclosure: runtime, content, Tezos, agent-layer, team.",
    url: "https://pointcast.xyz/stack"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Stack", "description": "What PointCast is built on — Astro, Cloudflare Pages, SmartPy, Taquito, Beacon, TzKT, noun.pics. And what we deliberately skipped.", "image": "/images/og/stack.png", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/stack.json", title: "Stack (JSON)" }], "data-astro-cid-mbzyqcdw": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-mbzyqcdw> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-mbzyqcdw> <a href="/" data-astro-cid-mbzyqcdw>Home</a> <span aria-hidden="true" data-astro-cid-mbzyqcdw>›</span> <span data-astro-cid-mbzyqcdw>stack</span> </nav> <header class="hero" data-astro-cid-mbzyqcdw> <p class="kicker" data-astro-cid-mbzyqcdw>STACK · TECHNICAL DISCLOSURE</p> <h1 class="display" data-astro-cid-mbzyqcdw>How this is built.</h1> <p class="dek" data-astro-cid-mbzyqcdw>
PointCast is a static site compiled once and served from the edge.
        This page documents every layer — runtime, content, on-chain, agent,
        team — so agents can reason about the system and humans can trust it.
</p> </header> ${LAYERS.map((layer) => renderTemplate`<section class="layer" data-astro-cid-mbzyqcdw> <header class="layer__head" data-astro-cid-mbzyqcdw> <div class="layer__head-top" data-astro-cid-mbzyqcdw> <p class="layer__code mono" data-astro-cid-mbzyqcdw>${layer.code}</p> <h2 class="layer__title" data-astro-cid-mbzyqcdw>${layer.name}</h2> </div> <p class="layer__note" data-astro-cid-mbzyqcdw>${layer.note}</p> </header> <ul class="items" data-astro-cid-mbzyqcdw> ${layer.items.map((item) => renderTemplate`<li class="item" data-astro-cid-mbzyqcdw> <div class="item__head" data-astro-cid-mbzyqcdw> ${item.url ? renderTemplate`<a class="item__name"${addAttribute(item.url, "href")}${addAttribute(item.url.startsWith("http") ? "_blank" : "_self", "target")}${addAttribute(item.url.startsWith("http") ? "noopener" : void 0, "rel")} data-astro-cid-mbzyqcdw> ${item.name} ${item.url.startsWith("http") && renderTemplate`<span aria-hidden="true" data-astro-cid-mbzyqcdw> ↗</span>`} </a>` : renderTemplate`<span class="item__name" data-astro-cid-mbzyqcdw>${item.name}</span>`} <span class="item__role mono" data-astro-cid-mbzyqcdw>${item.role}</span> </div> <p class="item__why" data-astro-cid-mbzyqcdw>${item.why}</p> </li>`)} </ul> </section>`)} <aside class="surfaces" data-astro-cid-mbzyqcdw> <p class="kicker" data-astro-cid-mbzyqcdw>AGENT SURFACES</p> <ul class="surfaces__list" data-astro-cid-mbzyqcdw> <li data-astro-cid-mbzyqcdw><a href="/stack.json" data-astro-cid-mbzyqcdw><span class="mono" data-astro-cid-mbzyqcdw>GET</span> /stack.json</a></li> <li data-astro-cid-mbzyqcdw><a href="/agents.json" data-astro-cid-mbzyqcdw><span class="mono" data-astro-cid-mbzyqcdw>GET</span> /agents.json</a></li> <li data-astro-cid-mbzyqcdw><a href="/for-agents" data-astro-cid-mbzyqcdw><span class="mono" data-astro-cid-mbzyqcdw>SEE</span> /for-agents</a></li> <li data-astro-cid-mbzyqcdw><a href="https://github.com/mhoydich/pointcast" target="_blank" rel="noopener" data-astro-cid-mbzyqcdw><span class="mono" data-astro-cid-mbzyqcdw>REPO</span> GitHub ↗</a></li> </ul> </aside> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/stack.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/stack.astro";
const $$url = "/stack";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Stack,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
