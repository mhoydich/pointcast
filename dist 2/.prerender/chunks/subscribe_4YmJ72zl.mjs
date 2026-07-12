import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { a as CHANNEL_LIST } from './channels_C2qW9mSV.mjs';

const $$Subscribe = createComponent(($$result, $$props, $$slots) => {
  const feeds = [
    {
      format: "RSS 2.0",
      label: "Every block · RSS",
      url: "/feed.xml",
      note: "Universal. Works in every RSS reader. Reader picks a title line + published time + description."
    },
    {
      format: "JSON Feed 1.1",
      label: "Every block · JSON Feed",
      url: "/feed.json",
      note: "Modern. Preferred by NetNewsWire, Reeder, Unread, Feedbin. Each item carries an image (per-block OG card) + PointCast extension with channel/type."
    },
    {
      format: "JSON",
      label: "Every block · raw JSON",
      url: "/blocks.json",
      note: "PointCast's native shape. Full archive, paginable later. Agent-friendly."
    },
    {
      format: "Atom / RSS",
      label: "Per channel",
      url: "/c/{slug}.rss",
      note: "One feed per channel. Subscribe to just /c/front-door.rss or /c/spinning.rss. Swap .rss for .json for JSON Feed."
    }
  ];
  const readers = [
    { name: "NetNewsWire", url: "https://netnewswire.com", note: "Free, open-source, macOS + iOS. The recommended default." },
    { name: "Reeder", url: "https://reederapp.com", note: "Paid, macOS/iOS. Polished if you like fine typography." },
    { name: "Feedbin", url: "https://feedbin.com", note: "Paid, web + sync. Good if you read across devices." },
    { name: "Feedly", url: "https://feedly.com", note: "Free tier, web + apps. Mainstream pick." },
    { name: "Inoreader", url: "https://www.inoreader.com", note: "Free tier, power-user features." }
  ];
  const socials = [
    { name: "Farcaster", url: "https://warpcast.com/mhoydich", handle: "@mhoydich", note: "Primary social — casts about new blocks + ops." },
    { name: "X", url: "https://x.com/mhoydich", handle: "@mhoydich", note: "Mirror of the Farcaster cadence." },
    { name: "GitHub", url: "https://github.com/mhoydich/pointcast", handle: "MikeHoydich/pointcast", note: "The whole site. Star = bookmark." },
    { name: "objkt.com", url: "https://objkt.com/collection/KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh", handle: "Visit Nouns FA2", note: "The NFT collection. Every mainnet mint appears here." }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://pointcast.xyz/subscribe",
    name: "PointCast · subscribe",
    description: "Follow PointCast: RSS, JSON Feed, Farcaster, X, GitHub. No email lists. No cookies.",
    url: "https://pointcast.xyz/subscribe"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Subscribe", "description": "Follow PointCast: RSS, JSON Feed, Farcaster, X, GitHub. No email lists, no tracking, no vendor lock-in.", "image": "/images/og/subscribe.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/rss+xml", href: "/feed.xml", title: "PointCast (RSS · all blocks)" },
    { type: "application/feed+json", href: "/feed.json", title: "PointCast (JSON Feed 1.1)" }
  ], "data-astro-cid-ajzedo7x": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-ajzedo7x> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-ajzedo7x> <a href="/" data-astro-cid-ajzedo7x>Home</a> <span aria-hidden="true" data-astro-cid-ajzedo7x>›</span> <span data-astro-cid-ajzedo7x>subscribe</span> </nav> <header class="hero" data-astro-cid-ajzedo7x> <p class="kicker" data-astro-cid-ajzedo7x>SUBSCRIBE · FEEDS + SOCIALS</p> <h1 class="display" data-astro-cid-ajzedo7x>Follow, don't sign up.</h1> <p class="dek" data-astro-cid-ajzedo7x>
PointCast runs no email list. No analytics, no pixel trackers, no
        cookies set by the site. To follow: pick an RSS reader, or watch
        Farcaster, X, or GitHub. All mirrors, no vendor.
</p> </header> <section class="panel" data-astro-cid-ajzedo7x> <p class="kicker panel__kicker" data-astro-cid-ajzedo7x>FEEDS · 4 FORMATS</p> <ul class="rows" data-astro-cid-ajzedo7x> ${feeds.map((f) => renderTemplate`<li class="row" data-astro-cid-ajzedo7x> <div class="row__head" data-astro-cid-ajzedo7x> <span class="row__tag mono" data-astro-cid-ajzedo7x>${f.format}</span> <h2 class="row__title" data-astro-cid-ajzedo7x>${f.label}</h2> <a class="row__url mono"${addAttribute(f.url === "/c/{slug}.rss" ? "/c/front-door.rss" : f.url, "href")} rel="alternate" data-astro-cid-ajzedo7x>${f.url}</a> </div> <p class="row__note" data-astro-cid-ajzedo7x>${f.note}</p> </li>`)} </ul> </section> <section class="panel" data-astro-cid-ajzedo7x> <p class="kicker panel__kicker" data-astro-cid-ajzedo7x>PER-CHANNEL · 9 STREAMS</p> <p class="panel__dek" data-astro-cid-ajzedo7x>Pick just the channels you want.</p> <div class="channel-grid" data-astro-cid-ajzedo7x> ${CHANNEL_LIST.map((ch) => renderTemplate`<div class="channel"${addAttribute(`--ch-600: ${ch.color600}; --ch-800: ${ch.color800}; --ch-50: ${ch.color50};`, "style")} data-astro-cid-ajzedo7x> <div class="channel__head" data-astro-cid-ajzedo7x> <span class="channel__code mono" data-astro-cid-ajzedo7x>CH.${ch.code}</span> <span class="channel__name" data-astro-cid-ajzedo7x>${ch.name}</span> </div> <div class="channel__feeds mono" data-astro-cid-ajzedo7x> <a${addAttribute(`/c/${ch.slug}.rss`, "href")} data-astro-cid-ajzedo7x>RSS</a> <span aria-hidden="true" data-astro-cid-ajzedo7x>·</span> <a${addAttribute(`/c/${ch.slug}.json`, "href")} data-astro-cid-ajzedo7x>JSON</a> <span aria-hidden="true" data-astro-cid-ajzedo7x>·</span> <a${addAttribute(`/c/${ch.slug}`, "href")} data-astro-cid-ajzedo7x>HTML</a> </div> </div>`)} </div> </section> <section class="panel" data-astro-cid-ajzedo7x> <p class="kicker panel__kicker" data-astro-cid-ajzedo7x>READERS · FREE + PAID</p> <p class="panel__dek" data-astro-cid-ajzedo7x>Pick any of these. Paste <code data-astro-cid-ajzedo7x>/feed.xml</code> or <code data-astro-cid-ajzedo7x>/feed.json</code> when they ask for a URL.</p> <ul class="rows rows--tight" data-astro-cid-ajzedo7x> ${readers.map((r) => renderTemplate`<li class="row row--tight" data-astro-cid-ajzedo7x> <div class="row__head" data-astro-cid-ajzedo7x> <h3 class="row__title row__title--sm" data-astro-cid-ajzedo7x><a${addAttribute(r.url, "href")} target="_blank" rel="noopener" data-astro-cid-ajzedo7x>${r.name} ↗</a></h3> </div> <p class="row__note" data-astro-cid-ajzedo7x>${r.note}</p> </li>`)} </ul> </section> <section class="panel" data-astro-cid-ajzedo7x> <p class="kicker panel__kicker" data-astro-cid-ajzedo7x>SOCIALS · MIRRORS</p> <p class="panel__dek" data-astro-cid-ajzedo7x>New blocks + operational updates. Same content as the feeds, aimed at the audience that prefers social.</p> <ul class="rows rows--tight" data-astro-cid-ajzedo7x> ${socials.map((s) => renderTemplate`<li class="row row--tight" data-astro-cid-ajzedo7x> <div class="row__head" data-astro-cid-ajzedo7x> <h3 class="row__title row__title--sm" data-astro-cid-ajzedo7x><a${addAttribute(s.url, "href")} target="_blank" rel="noopener" data-astro-cid-ajzedo7x>${s.name} ↗</a></h3> <span class="row__url mono" data-astro-cid-ajzedo7x>${s.handle}</span> </div> <p class="row__note" data-astro-cid-ajzedo7x>${s.note}</p> </li>`)} </ul> </section> <section class="panel panel--agents" data-astro-cid-ajzedo7x> <p class="kicker panel__kicker" data-astro-cid-ajzedo7x>FOR AGENTS · MACHINE PROTOCOLS</p> <p class="panel__dek" data-astro-cid-ajzedo7x>
If you're an AI agent or crawler, don't scrape. Use these.
</p> <dl class="agent-feeds" data-astro-cid-ajzedo7x> <div data-astro-cid-ajzedo7x> <dt class="mono" data-astro-cid-ajzedo7x>DISCOVERY</dt> <dd data-astro-cid-ajzedo7x><a href="/agents.json" data-astro-cid-ajzedo7x><code data-astro-cid-ajzedo7x>/agents.json</code></a> — every endpoint + contract + schema in one JSON</dd> </div> <div data-astro-cid-ajzedo7x> <dt class="mono" data-astro-cid-ajzedo7x>SUMMARY</dt> <dd data-astro-cid-ajzedo7x><a href="/llms.txt" data-astro-cid-ajzedo7x><code data-astro-cid-ajzedo7x>/llms.txt</code></a> (short) · <a href="/llms-full.txt" data-astro-cid-ajzedo7x><code data-astro-cid-ajzedo7x>/llms-full.txt</code></a> (long, with v3 surfaces)</dd> </div> <div data-astro-cid-ajzedo7x> <dt class="mono" data-astro-cid-ajzedo7x>CANONICAL</dt> <dd data-astro-cid-ajzedo7x><a href="/manifesto" data-astro-cid-ajzedo7x><code data-astro-cid-ajzedo7x>/manifesto</code></a> — FAQPage + DefinedTerm schema (14 Q&A pairs)</dd> </div> <div data-astro-cid-ajzedo7x> <dt class="mono" data-astro-cid-ajzedo7x>STRIPPED</dt> <dd data-astro-cid-ajzedo7x>Send UA prefixed <code data-astro-cid-ajzedo7x>ai:</code> or match known crawlers — server returns stripped HTML via middleware</dd> </div> <div data-astro-cid-ajzedo7x> <dt class="mono" data-astro-cid-ajzedo7x>LIVE STATE</dt> <dd data-astro-cid-ajzedo7x><a href="/now.json" data-astro-cid-ajzedo7x><code data-astro-cid-ajzedo7x>/now.json</code></a> — Card of the Day, latest blocks, contract state. Cache 60s.</dd> </div> <div data-astro-cid-ajzedo7x> <dt class="mono" data-astro-cid-ajzedo7x>WORK LOG</dt> <dd data-astro-cid-ajzedo7x><a href="/sprints.json" data-astro-cid-ajzedo7x><code data-astro-cid-ajzedo7x>/sprints.json</code></a> — every autonomous sprint cc has shipped (cron + chat). Updated each tick.</dd> </div> <div data-astro-cid-ajzedo7x> <dt class="mono" data-astro-cid-ajzedo7x>TEAM</dt> <dd data-astro-cid-ajzedo7x><a href="/collabs.json" data-astro-cid-ajzedo7x><code data-astro-cid-ajzedo7x>/collabs.json</code></a> — collaborators registry + 3-step federation spec to plug in a compatible site.</dd> </div> <div data-astro-cid-ajzedo7x> <dt class="mono" data-astro-cid-ajzedo7x>SHOP</dt> <dd data-astro-cid-ajzedo7x><a href="/shop.json" data-astro-cid-ajzedo7x><code data-astro-cid-ajzedo7x>/shop.json</code></a> + <a href="/products.json" data-astro-cid-ajzedo7x><code data-astro-cid-ajzedo7x>/products.json</code></a> — commerce catalog with schema.org Product markup. Checkout stays outbound at canonical shop URLs.</dd> </div> <div data-astro-cid-ajzedo7x> <dt class="mono" data-astro-cid-ajzedo7x>CONTROL</dt> <dd data-astro-cid-ajzedo7x><a href="/sprint.json" data-astro-cid-ajzedo7x><code data-astro-cid-ajzedo7x>/sprint.json</code></a> — current sprint backlog. POST a pick to <code data-astro-cid-ajzedo7x>/api/queue</code> (KV-backed).</dd> </div> <div data-astro-cid-ajzedo7x> <dt class="mono" data-astro-cid-ajzedo7x>INBOX</dt> <dd data-astro-cid-ajzedo7x>POST messages to <a href="/api/ping" data-astro-cid-ajzedo7x><code data-astro-cid-ajzedo7x>/api/ping</code></a> · POST URLs to <a href="/api/drop" data-astro-cid-ajzedo7x><code data-astro-cid-ajzedo7x>/api/drop</code></a>. cc reads both at session start.</dd> </div> </dl> <p class="agent-feeds__footer" data-astro-cid-ajzedo7x> <strong data-astro-cid-ajzedo7x>Three tiers:</strong> RSS / JSON Feed (for humans with readers), Farcaster / X / GitHub (for humans without), <em data-astro-cid-ajzedo7x>everything above</em> (for agents). All endpoints are CORS-open. No auth, no preflight.
</p> </section> <aside class="surfaces" data-astro-cid-ajzedo7x> <p class="kicker" data-astro-cid-ajzedo7x>RELATED</p> <ul class="surfaces__list" data-astro-cid-ajzedo7x> <li data-astro-cid-ajzedo7x><a href="/archive" data-astro-cid-ajzedo7x><span class="mono" data-astro-cid-ajzedo7x>READ</span> /archive</a></li> <li data-astro-cid-ajzedo7x><a href="/now" data-astro-cid-ajzedo7x><span class="mono" data-astro-cid-ajzedo7x>LIVE</span> /now</a></li> <li data-astro-cid-ajzedo7x><a href="/for-agents" data-astro-cid-ajzedo7x><span class="mono" data-astro-cid-ajzedo7x>AGENT</span> /for-agents</a></li> <li data-astro-cid-ajzedo7x><a href="/glossary" data-astro-cid-ajzedo7x><span class="mono" data-astro-cid-ajzedo7x>TERMS</span> /glossary</a></li> </ul> </aside> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/subscribe.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/subscribe.astro";
const $$url = "/subscribe";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Subscribe,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
