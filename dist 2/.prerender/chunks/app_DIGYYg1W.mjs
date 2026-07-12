import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';

const $$App = createComponent(async ($$result, $$props, $$slots) => {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const latest = blocks[0];
  const recent = blocks.slice(0, 4);
  const blockCount = blocks.length;
  const appTabs = [
    { href: "/now", label: "Now", note: "live state", glyph: "N" },
    { href: "/chart", label: "Chart", note: "daily pulse", glyph: "T" },
    { href: "/chartmaker", label: "Maker", note: "data lab", glyph: "M" },
    { href: "/rooms", label: "Rooms", note: "town map", glyph: "R" },
    { href: "/drum-fives", label: "Drum", note: "wing hub", glyph: "D" },
    { href: "/profile", label: "Profile", note: "passport", glyph: "P" },
    { href: "/editions", label: "Collect", note: "mint shelf", glyph: "C" },
    { href: "/for-agents", label: "Agents", note: "manifest", glyph: "A" }
  ];
  const roomCards = [
    { href: "/chart", title: "Chart", meta: "daily ledger pulse", state: "data" },
    { href: "/chartmaker", title: "Chartmaker", meta: "feeds + cross-charts", state: "lab" },
    { href: "/drum-fives", title: "Fives & Bells", meta: "eight drum surfaces", state: "live" },
    { href: "/rooms", title: "Rooms", meta: "small internet town", state: "map" },
    { href: "/now", title: "Now", meta: "latest block + contracts", state: "fresh" },
    { href: "/profile", title: "Profile", meta: "wallet-local passport", state: "local" }
  ];
  const todayAction = latest ? {
    label: "Open latest receipt",
    href: `/b/${latest.data.id}`,
    title: latest.data.title,
    note: latest.data.dek
  } : {
    label: "Open Now",
    href: "/now",
    title: "See what is current",
    note: "PointCast exposes the live snapshot at /now and /now.json."
  };
  const generatedAt = /* @__PURE__ */ new Date();
  const generatedLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short"
  }).format(generatedAt);
  const description = "PointCast Native Shell: an installable app home for Now, Rooms, Drum, Profile, Collect, and Agents.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/app",
    name: "PointCast Native Shell",
    url: "https://pointcast.xyz/app",
    description,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any modern browser"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "App", "description": description, "image": "/images/og/og-home-v2.png", "jsonLd": jsonLd, "data-astro-cid-fqt3mzrt": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="native-shell" id="native-shell" data-astro-cid-fqt3mzrt> <header class="app-top" data-astro-cid-fqt3mzrt> <a class="app-top__brand" href="/" data-astro-cid-fqt3mzrt>POINTCAST</a> <div class="app-top__meta" data-astro-cid-fqt3mzrt> <span data-astro-cid-fqt3mzrt>${blockCount} blocks</span> <span data-astro-cid-fqt3mzrt>${generatedLabel}</span> </div> </header> <section class="phone-hero" aria-labelledby="app-title" data-astro-cid-fqt3mzrt> <div class="phone-hero__copy" data-astro-cid-fqt3mzrt> <p class="kicker" data-astro-cid-fqt3mzrt>POINTCAST NATIVE · PWA SHELL</p> <h1 id="app-title" data-astro-cid-fqt3mzrt>One home screen for the live broadcast.</h1> <p data-astro-cid-fqt3mzrt>
Install this route and come back to the useful doors: what is live,
          today's chart, where the rooms are, what to collect, and what agents can read.
</p> </div> <aside class="install-card" aria-label="Install status" data-astro-cid-fqt3mzrt> <span class="install-card__dot" aria-hidden="true" data-astro-cid-fqt3mzrt></span> <strong id="install-title" data-astro-cid-fqt3mzrt>Installable web app</strong> <span id="install-note" data-astro-cid-fqt3mzrt>Use your browser's Add to Home Screen or Install command.</span> </aside> </section> <nav class="app-tabs" aria-label="PointCast app tabs" data-astro-cid-fqt3mzrt> ${appTabs.map((tab) => renderTemplate`<a${addAttribute(tab.href, "href")} class="app-tab" data-astro-cid-fqt3mzrt> <span class="app-tab__glyph" aria-hidden="true" data-astro-cid-fqt3mzrt>${tab.glyph}</span> <span data-astro-cid-fqt3mzrt> <strong data-astro-cid-fqt3mzrt>${tab.label}</strong> <em data-astro-cid-fqt3mzrt>${tab.note}</em> </span> </a>`)} </nav> <section class="action-card" aria-labelledby="today-action-title" data-astro-cid-fqt3mzrt> <div data-astro-cid-fqt3mzrt> <p class="kicker" data-astro-cid-fqt3mzrt>TODAY'S APP ACTION</p> <h2 id="today-action-title" data-astro-cid-fqt3mzrt>${todayAction.title}</h2> <p data-astro-cid-fqt3mzrt>${todayAction.note}</p> </div> <a${addAttribute(todayAction.href, "href")} data-astro-cid-fqt3mzrt>${todayAction.label}</a> </section> <section class="dashboard" aria-label="Native dashboard" data-astro-cid-fqt3mzrt> <article class="panel panel--latest" data-astro-cid-fqt3mzrt> <p class="kicker" data-astro-cid-fqt3mzrt>LATEST RECEIPTS</p> <ol class="receipt-list" data-astro-cid-fqt3mzrt> ${recent.map((block) => renderTemplate`<li data-astro-cid-fqt3mzrt> <a${addAttribute(`/b/${block.data.id}`, "href")} data-astro-cid-fqt3mzrt> <span data-astro-cid-fqt3mzrt>№${block.data.id} · CH.${block.data.channel}</span> <strong data-astro-cid-fqt3mzrt>${block.data.title}</strong> </a> </li>`)} </ol> </article> <article class="panel" data-astro-cid-fqt3mzrt> <p class="kicker" data-astro-cid-fqt3mzrt>RESUME</p> <h2 id="resume-title" data-astro-cid-fqt3mzrt>Pick up where this browser left off.</h2> <p id="resume-note" data-astro-cid-fqt3mzrt>Local memory appears here after you visit rooms, connect a wallet, or save a daily drop.</p> <div class="mini-stats" aria-label="Browser-local profile hints" data-astro-cid-fqt3mzrt> <span data-astro-cid-fqt3mzrt><strong id="visited-count" data-astro-cid-fqt3mzrt>—</strong><em data-astro-cid-fqt3mzrt>rooms</em></span> <span data-astro-cid-fqt3mzrt><strong id="wallet-count" data-astro-cid-fqt3mzrt>—</strong><em data-astro-cid-fqt3mzrt>wallets</em></span> <span data-astro-cid-fqt3mzrt><strong id="daily-count" data-astro-cid-fqt3mzrt>—</strong><em data-astro-cid-fqt3mzrt>drops</em></span> </div> </article> </section> <section class="room-grid" aria-label="App rooms" data-astro-cid-fqt3mzrt> ${roomCards.map((room) => renderTemplate`<a class="room-card"${addAttribute(room.href, "href")} data-astro-cid-fqt3mzrt> <span data-astro-cid-fqt3mzrt>${room.state}</span> <strong data-astro-cid-fqt3mzrt>${room.title}</strong> <em data-astro-cid-fqt3mzrt>${room.meta}</em> </a>`)} </section> <footer class="app-foot" data-astro-cid-fqt3mzrt> <a href="/apps.json" data-astro-cid-fqt3mzrt>/apps.json</a> <a href="/chart.json" data-astro-cid-fqt3mzrt>/chart.json</a> <a href="/chartmaker.json" data-astro-cid-fqt3mzrt>/chartmaker.json</a> <a href="/now.json" data-astro-cid-fqt3mzrt>/now.json</a> <a href="/agents.json" data-astro-cid-fqt3mzrt>/agents.json</a> </footer> </main> ` })} ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/app.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/app.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/app.astro";
const $$url = "/app";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$App,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
