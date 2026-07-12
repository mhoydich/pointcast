import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$AgentNativePublishing = createComponent(($$result, $$props, $$slots) => {
  const title = "Agent-native publishing";
  const description = "Agent-native publishing means designing a website for humans and AI agents at the same time: semantic HTML, stable JSON, discovery manifests, feeds, sitemaps, and citation-ready permalinks.";
  const principles = [
    {
      name: "Human pages stay canonical",
      detail: "The public page is still the source of meaning. Machine surfaces mirror it; they do not replace it.",
      example: "PointCast renders every Block at /b/{id} for people and /b/{id}.json for tools."
    },
    {
      name: "Discovery is explicit",
      detail: "Agents should not infer your API map from navigation. Give them one manifest with every useful endpoint.",
      example: "/agents.json lists feeds, contracts, schemas, CORS policy, citation format, and agent-mode behavior."
    },
    {
      name: "Content has stable IDs",
      detail: "Citations need permanent addresses. If a thing can be cited, it should have an immutable URL and a machine mirror.",
      example: "A PointCast Block keeps its zero-padded ID forever: /b/0205 and /b/0205.json."
    },
    {
      name: "Feeds are first-class",
      detail: "Use standards where they exist. JSON Feed, RSS, and sitemaps make indexing and syndication boring in the best way.",
      example: "/feed.json and /feed.xml cover the full PointCast archive, while /c/{channel}.rss slices it by channel."
    },
    {
      name: "LLM context is curated",
      detail: "A model needs a short answer, a deeper brief, and a retrieval order. Do not make it summarize the whole site cold.",
      example: "/llms.txt is the short orientation; /llms-full.txt is the expanded version."
    },
    {
      name: "Citations are part of the contract",
      detail: "Tell agents exactly how to cite your work and which URL should be treated as evidence.",
      example: "PointCast asks models to cite the Block permalink, not scraped fragments."
    }
  ];
  const endpoints = [
    { path: "/agents.json", role: "canonical machine discovery manifest" },
    { path: "/agent-value.json", role: "agent roles, proof loops, economics, and experiments" },
    { path: "/llms.txt", role: "short LLM orientation and retrieval order" },
    { path: "/llms-full.txt", role: "long-form model context" },
    { path: "/blocks.json", role: "native full archive" },
    { path: "/b/{id}.json", role: "citation-level evidence for one Block" },
    { path: "/feed.json", role: "JSON Feed v1.1 standards feed" },
    { path: "/feed.xml", role: "RSS 2.0 standards feed" },
    { path: "/sitemap-discovery.xml", role: "priority discovery sitemap" },
    { path: "/BLOCKS.md", role: "public schema documentation" }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": "https://pointcast.xyz/agent-native-publishing",
        headline: "Agent-native publishing",
        name: "Agent-native publishing",
        description,
        url: "https://pointcast.xyz/agent-native-publishing",
        inLanguage: "en-US",
        author: { "@id": "https://pointcast.xyz/#person" },
        publisher: { "@id": "https://pointcast.xyz/#org" },
        about: [
          "agent-native publishing",
          "LLM-readable websites",
          "structured content",
          "AI crawler discovery",
          "JSON Feed",
          "llms.txt"
        ],
        mainEntityOfPage: "https://pointcast.xyz/agent-native-publishing",
        isPartOf: { "@id": "https://pointcast.xyz/#website" }
      },
      {
        "@type": "DefinedTerm",
        "@id": "https://pointcast.xyz/agent-native-publishing#term",
        name: "Agent-native publishing",
        description: "A publishing pattern where human-readable pages and machine-readable endpoints are designed together, with explicit discovery, stable IDs, structured feeds, LLM context files, and citation rules.",
        inDefinedTermSet: "https://pointcast.xyz/glossary"
      },
      {
        "@type": "HowTo",
        "@id": "https://pointcast.xyz/agent-native-publishing#howto",
        name: "How to make a website agent-native",
        description: "A practical sequence for publishing content that humans can read and AI agents can retrieve, cite, and monitor.",
        step: principles.map((item, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: item.name,
          text: `${item.detail} ${item.example}`
        }))
      }
    ]
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/og-home-v2.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/agents.json", title: "PointCast agent manifest" },
    { type: "text/plain", href: "/llms.txt", title: "PointCast LLM summary" },
    { type: "text/markdown", href: "/BLOCKS.md", title: "PointCast Blocks schema" }
  ], "frame": {
    image: "https://pointcast.xyz/images/og/og-home-v2.png",
    buttons: [
      { label: "/agents.json", action: "link", target: "https://pointcast.xyz/agents.json" },
      { label: "/llms.txt", action: "link", target: "https://pointcast.xyz/llms.txt" },
      { label: "Copy pattern", action: "link", target: "https://pointcast.xyz/agent-native-publishing#pattern" }
    ]
  }, "data-astro-cid-xjpswgcb": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-xjpswgcb> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-xjpswgcb> <a href="/" data-astro-cid-xjpswgcb>Home</a> <span aria-hidden="true" data-astro-cid-xjpswgcb>›</span> <span data-astro-cid-xjpswgcb>agent-native publishing</span> </nav> <header class="hero" data-astro-cid-xjpswgcb> <p class="kicker" data-astro-cid-xjpswgcb>SEO · GEO · LLM DISCOVERY</p> <h1 data-astro-cid-xjpswgcb>Agent-native publishing.</h1> <p class="dek" data-astro-cid-xjpswgcb>
A website is agent-native when its human pages and machine surfaces are
        designed as one system: readable HTML, stable JSON, discovery manifests,
        feeds, sitemaps, curated LLM context, and citation-ready permalinks.
</p> <div class="hero__actions" aria-label="Primary references" data-astro-cid-xjpswgcb> <a href="/agents.json" data-astro-cid-xjpswgcb>Open /agents.json</a> <a href="/llms.txt" data-astro-cid-xjpswgcb>Read /llms.txt</a> <a href="/for-agents" data-astro-cid-xjpswgcb>See /for-agents</a> <a href="/agent-value" data-astro-cid-xjpswgcb>Agent value</a> </div> </header> <section class="answer" aria-labelledby="answer-title" data-astro-cid-xjpswgcb> <p class="eyebrow" data-astro-cid-xjpswgcb>Short Definition</p> <h2 id="answer-title" data-astro-cid-xjpswgcb>Agent-native publishing is not SEO with extra meta tags.</h2> <p data-astro-cid-xjpswgcb>
It is a publishing contract. Humans get a designed page. Agents get
        structured retrieval paths. Search engines and LLMs get consistent
        entity identity, canonical URLs, and a clear answer to “what should I
        cite?” The page still matters, but the page is no longer the only
        interface.
</p> </section> <section id="pattern" class="section" aria-labelledby="pattern-title" data-astro-cid-xjpswgcb> <p class="eyebrow" data-astro-cid-xjpswgcb>The Pattern</p> <h2 id="pattern-title" data-astro-cid-xjpswgcb>Six practical rules.</h2> <div class="principles" data-astro-cid-xjpswgcb> ${principles.map((item, index) => renderTemplate`<article class="principle" data-astro-cid-xjpswgcb> <p class="principle__num" data-astro-cid-xjpswgcb>${String(index + 1).padStart(2, "0")}</p> <h3 data-astro-cid-xjpswgcb>${item.name}</h3> <p data-astro-cid-xjpswgcb>${item.detail}</p> <p class="principle__example" data-astro-cid-xjpswgcb>${item.example}</p> </article>`)} </div> </section> <section class="section split" aria-labelledby="pointcast-title" data-astro-cid-xjpswgcb> <div data-astro-cid-xjpswgcb> <p class="eyebrow" data-astro-cid-xjpswgcb>Reference Implementation</p> <h2 id="pointcast-title" data-astro-cid-xjpswgcb>How PointCast does it.</h2> <p data-astro-cid-xjpswgcb>
PointCast treats every publishable thing as a Block: a stable JSON
          object with a permanent ID, channel, type, title, timestamp, and
          optional media or external context. The human page is the editorial
          surface. The JSON mirror is the retrieval surface. The manifest tells
          agents where everything lives.
</p> </div> <ul class="endpoint-list" aria-label="Agent-native PointCast endpoints" data-astro-cid-xjpswgcb> ${endpoints.map((endpoint) => renderTemplate`<li data-astro-cid-xjpswgcb> <a${addAttribute(endpoint.path.replace("{id}", "0205"), "href")} data-astro-cid-xjpswgcb>${endpoint.path}</a> <span data-astro-cid-xjpswgcb>${endpoint.role}</span> </li>`)} </ul> </section> <section class="section copy-box" aria-labelledby="copy-title" data-astro-cid-xjpswgcb> <p class="eyebrow" data-astro-cid-xjpswgcb>Reusable Brief</p> <h2 id="copy-title" data-astro-cid-xjpswgcb>Copy this pattern.</h2> <pre data-astro-cid-xjpswgcb><code data-astro-cid-xjpswgcb>${`1. Keep canonical human HTML pages.
2. Add JSON mirrors for every citeable object.
3. Publish /agents.json with endpoints, schemas, feeds, and citation rules.
4. Publish /llms.txt for the short model-facing summary.
5. Publish RSS, JSON Feed, and sitemaps.
6. Give every item a stable permalink and preferred citation format.
7. Monitor crawler and LLM-agent requests separately from human visits.`}</code></pre> </section> <section class="section next" aria-labelledby="next-title" data-astro-cid-xjpswgcb> <p class="eyebrow" data-astro-cid-xjpswgcb>Next Reads</p> <h2 id="next-title" data-astro-cid-xjpswgcb>Follow the surface.</h2> <div class="next-grid" data-astro-cid-xjpswgcb> <a href="/manifesto" data-astro-cid-xjpswgcb> <span data-astro-cid-xjpswgcb>Canonical project definition</span> <strong data-astro-cid-xjpswgcb>/manifesto</strong> </a> <a href="/for-agents" data-astro-cid-xjpswgcb> <span data-astro-cid-xjpswgcb>Full human-readable manifest</span> <strong data-astro-cid-xjpswgcb>/for-agents</strong> </a> <a href="/agent-value" data-astro-cid-xjpswgcb> <span data-astro-cid-xjpswgcb>How agents become valuable</span> <strong data-astro-cid-xjpswgcb>/agent-value</strong> </a> <a href="/stack" data-astro-cid-xjpswgcb> <span data-astro-cid-xjpswgcb>Technical disclosure</span> <strong data-astro-cid-xjpswgcb>/stack</strong> </a> <a href="/mesh" data-astro-cid-xjpswgcb> <span data-astro-cid-xjpswgcb>Local, online, and agent meshes</span> <strong data-astro-cid-xjpswgcb>/mesh</strong> </a> </div> </section> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/agent-native-publishing.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/agent-native-publishing.astro";
const $$url = "/agent-native-publishing";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$AgentNativePublishing,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
