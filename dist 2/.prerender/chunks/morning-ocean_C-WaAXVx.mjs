import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, u as unescapeHTML, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import contracts from './contracts_B1zhgPPX.mjs';
import { b as buildMorningOceanManifest, M as MORNING_OCEAN_SYMBOL, a as MORNING_OCEAN_STORAGE_KEYS, c as MORNING_OCEAN_COVER_IMAGE } from './morning-ocean_0Dle8vCr.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$MorningOcean = createComponent(async ($$result, $$props, $$slots) => {
  const manifest = buildMorningOceanManifest();
  const tokens = manifest.tokens;
  const heroTokens = [tokens[0], tokens[1], tokens[5], tokens[7], tokens[16], tokens[19]].filter(Boolean);
  const config = contracts.morning_ocean ?? {};
  const mainnetAddress = String(config.mainnet ?? "").trim();
  const mintLive = mainnetAddress.startsWith("KT1");
  const metadataBase = String(config.metadataBaseUrl ?? config.metadata_base_uri ?? manifest.tezos.metadataBase).trim();
  const totalEditions = tokens.reduce((sum, token) => sum + token.editionSize, 0);
  const rarityCounts = ["common", "uncommon", "rare", "epic", "mythic"].map((rarity) => ({
    rarity,
    count: tokens.filter((token) => token.rarity === rarity).length
  }));
  const clientData = {
    tokens: tokens.map((token) => ({
      tokenId: token.tokenId,
      title: token.title,
      rarity: token.rarity,
      metadataUrl: token.metadataUrl
    })),
    storageKeys: MORNING_OCEAN_STORAGE_KEYS,
    contract: {
      network: "mainnet",
      address: mainnetAddress,
      live: mintLive,
      metadataBase,
      mintEntrypoint: config.mintEntrypoint ?? manifest.tezos.mintEntrypoint
    }
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWorkSeries",
    "@id": "https://pointcast.xyz/morning-ocean#series",
    name: "Morning Ocean",
    description: manifest.description,
    url: "https://pointcast.xyz/morning-ocean",
    image: manifest.coverImage,
    creator: {
      "@type": "Person",
      name: "Mike Hoydich"
    },
    numberOfItems: tokens.length,
    hasPart: tokens.map((token) => ({
      "@type": "VisualArtwork",
      name: token.title,
      image: token.imageUrl,
      identifier: `${MORNING_OCEAN_SYMBOL}-${token.tokenId}`,
      url: `https://pointcast.xyz/morning-ocean#token-${token.tokenId}`
    }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Morning Ocean", "description": "A 24-piece PointCast collectible NFT series: morning water, boats on the horizon, soft sun, planets, tankers, sailboats, and quiet luxury.", "image": MORNING_OCEAN_COVER_IMAGE, "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/morning-ocean.json", title: "Morning Ocean manifest" }], "frame": {
    image: "https://pointcast.xyz/images/morning-ocean/series-contact-sheet.png",
    buttons: [
      { label: "Open Series", action: "link", target: "https://pointcast.xyz/morning-ocean" },
      { label: "Manifest", action: "link", target: "https://pointcast.xyz/morning-ocean.json" },
      { label: "First Token", action: "link", target: "https://pointcast.xyz/api/morning-ocean-metadata/1.json" }
    ]
  }, "data-astro-cid-n5kiib5i": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<main class="morning-ocean" data-morning-ocean data-astro-cid-n5kiib5i> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-n5kiib5i> <a href="/" data-astro-cid-n5kiib5i>Home</a> <span aria-hidden="true" data-astro-cid-n5kiib5i>/</span> <a href="/play" data-astro-cid-n5kiib5i>play</a> <span aria-hidden="true" data-astro-cid-n5kiib5i>/</span> <span data-astro-cid-n5kiib5i>morning-ocean</span> </nav> <header class="ocean-hero" data-astro-cid-n5kiib5i> <figure class="ocean-hero__art" aria-label="Morning Ocean preview mosaic" data-astro-cid-n5kiib5i> <div class="ocean-hero__mosaic" data-astro-cid-n5kiib5i> ', ' </div> </figure> <div class="ocean-hero__copy" data-astro-cid-n5kiib5i> <p class="kicker" data-astro-cid-n5kiib5i>', ' · 24 art cards · Tezos-ready</p> <h1 data-astro-cid-n5kiib5i>Morning Ocean</h1> <p data-astro-cid-n5kiib5i>\nA calm maritime series for the PointCast shelf: oil tankers, sailboats, ferries,\n          crescent moons, sun disks, harbor fog, and enough open water to make the day slower.\n</p> <div class="hero-actions" aria-label="Morning Ocean routes" data-astro-cid-n5kiib5i> <a href="/morning-ocean.json" data-astro-cid-n5kiib5i>JSON</a> <a', " data-astro-cid-n5kiib5i>Metadata</a> <a", ' data-astro-cid-n5kiib5i>Collector sheet</a> <a href="/zen-cats" data-astro-cid-n5kiib5i>Zen Cats</a> </div> </div> </header> <section class="ocean-stats" aria-label="Series status" data-astro-cid-n5kiib5i> <article data-astro-cid-n5kiib5i> <span data-astro-cid-n5kiib5i>Tokens</span> <strong data-astro-cid-n5kiib5i>', "</strong> </article> <article data-astro-cid-n5kiib5i> <span data-astro-cid-n5kiib5i>Total editions</span> <strong data-astro-cid-n5kiib5i>", "</strong> </article> <article data-astro-cid-n5kiib5i> <span data-astro-cid-n5kiib5i>Mint</span> <strong data-astro-cid-n5kiib5i>", "</strong> </article> <article data-astro-cid-n5kiib5i> <span data-astro-cid-n5kiib5i>Royalties</span> <strong data-astro-cid-n5kiib5i>", '%</strong> </article> </section> <section class="mint-panel" aria-labelledby="mint-panel-title" data-astro-cid-n5kiib5i> <div data-astro-cid-n5kiib5i> <p class="kicker" data-astro-cid-n5kiib5i>NFT SERIES</p> <h2 id="mint-panel-title" data-astro-cid-n5kiib5i>Artifacts, metadata, and the FA2 path are staged.</h2> <p data-astro-cid-n5kiib5i>\nEach token has its own PNG artifact and TZIP-21 JSON. The Tezos button turns live\n          after the dedicated PCOCEAN contract is originated and its KT1 is added to the registry.\n</p> </div> <dl data-astro-cid-n5kiib5i> <div data-astro-cid-n5kiib5i><dt data-astro-cid-n5kiib5i>Contract</dt><dd data-astro-cid-n5kiib5i>', "</dd></div> <div data-astro-cid-n5kiib5i><dt data-astro-cid-n5kiib5i>Entrypoint</dt><dd data-astro-cid-n5kiib5i>", "</dd></div> <div data-astro-cid-n5kiib5i><dt data-astro-cid-n5kiib5i>Metadata base</dt><dd data-astro-cid-n5kiib5i><a", " data-astro-cid-n5kiib5i>", '</a></dd></div> </dl> </section> <section class="collection-tools" aria-label="Collection tools" data-astro-cid-n5kiib5i> <div data-astro-cid-n5kiib5i> <p class="kicker" data-astro-cid-n5kiib5i>LOCAL SHELF</p> <strong data-astro-cid-n5kiib5i><span data-ocean-count data-astro-cid-n5kiib5i>0</span> / ', '</strong> <span data-ocean-status data-astro-cid-n5kiib5i>Pick a first piece.</span> </div> <nav class="rarity-filter" aria-label="Filter by rarity" data-astro-cid-n5kiib5i> <button type="button" data-rarity-filter="all" aria-pressed="true" data-astro-cid-n5kiib5i>All</button> ', ' </nav> </section> <section class="token-grid" aria-label="Morning Ocean tokens" data-astro-cid-n5kiib5i> ', ' </section> <section class="agent-note" aria-labelledby="agent-note-title" data-astro-cid-n5kiib5i> <p class="kicker" data-astro-cid-n5kiib5i>AGENT HOOK</p> <h2 id="agent-note-title" data-astro-cid-n5kiib5i>The series is machine-readable.</h2> <p data-astro-cid-n5kiib5i>\nAgents can read <a href="/morning-ocean.json" data-astro-cid-n5kiib5i>/morning-ocean.json</a> for the full token list,\n        storage keys, contract status, metadata base, and mint readiness.\n</p> <pre data-astro-cid-n5kiib5i>', '</pre> </section> </main> <script type="application/json" id="morning-ocean-data">', "<\/script> ", " "])), maybeRenderHead(), heroTokens.map((token, index) => renderTemplate`<a${addAttribute(`ocean-hero__tile ocean-hero__tile--${index}`, "class")}${addAttribute(`#token-${token.tokenId}`, "href")}${addAttribute(`Open ${token.title} in the Morning Ocean collection`, "aria-label")} data-astro-cid-n5kiib5i> <img${addAttribute(token.localImageUrl, "src")}${addAttribute(`${token.title}: ${token.vessel} under ${token.celestial}`, "alt")} width="1024" height="1024"${addAttribute(index < 2 ? "eager" : "lazy", "loading")} decoding="async" data-astro-cid-n5kiib5i> <span data-astro-cid-n5kiib5i>No. ${String(token.tokenId).padStart(2, "0")}</span> </a>`), MORNING_OCEAN_SYMBOL, addAttribute(`${metadataBase}/1.json`, "href"), addAttribute(MORNING_OCEAN_COVER_IMAGE, "href"), tokens.length, totalEditions, mintLive ? "live" : "ready", Number(config.royalty_bps ?? 750) / 100, mintLive ? mainnetAddress : "pending PCOCEAN KT1", config.mintEntrypoint ?? manifest.tezos.mintEntrypoint, addAttribute(`${metadataBase}/1.json`, "href"), metadataBase, tokens.length, rarityCounts.map(({ rarity, count }) => renderTemplate`<button type="button"${addAttribute(rarity, "data-rarity-filter")} aria-pressed="false" data-astro-cid-n5kiib5i> ${rarity} <span data-astro-cid-n5kiib5i>${count}</span> </button>`), tokens.map((token, index) => renderTemplate`<article${addAttribute(`token-card token-card--${token.rarity}`, "class")}${addAttribute(`token-${token.tokenId}`, "id")} data-token-card${addAttribute(token.rarity, "data-rarity")} data-astro-cid-n5kiib5i> <a class="token-card__image"${addAttribute(token.localImageUrl, "href")}${addAttribute(`Open ${token.title} artwork`, "aria-label")} data-astro-cid-n5kiib5i> <img${addAttribute(token.localImageUrl, "src")}${addAttribute(`${token.title}: ${token.vessel} under ${token.celestial}`, "alt")} width="1024" height="1024"${addAttribute(index < 4 ? "eager" : "lazy", "loading")} decoding="async" data-astro-cid-n5kiib5i> </a> <div class="token-card__body" data-astro-cid-n5kiib5i> <div class="token-card__topline" data-astro-cid-n5kiib5i> <span data-astro-cid-n5kiib5i>No. ${String(token.tokenId).padStart(2, "0")}</span> <span data-astro-cid-n5kiib5i>${token.rarity}</span> </div> <h2 data-astro-cid-n5kiib5i>${token.title}</h2> <p data-astro-cid-n5kiib5i>${token.mood}</p> <dl data-astro-cid-n5kiib5i> <div data-astro-cid-n5kiib5i><dt data-astro-cid-n5kiib5i>Vessel</dt><dd data-astro-cid-n5kiib5i>${token.vessel}</dd></div> <div data-astro-cid-n5kiib5i><dt data-astro-cid-n5kiib5i>Sky</dt><dd data-astro-cid-n5kiib5i>${token.celestial}</dd></div> <div data-astro-cid-n5kiib5i><dt data-astro-cid-n5kiib5i>Edition</dt><dd data-astro-cid-n5kiib5i>${token.editionSize}</dd></div> </dl> <div class="token-actions" data-astro-cid-n5kiib5i> <button type="button"${addAttribute(token.tokenId, "data-collect-ocean")} data-astro-cid-n5kiib5i>Collect locally</button> <a${addAttribute(token.metadataUrl, "href")} data-astro-cid-n5kiib5i>Metadata</a> <button type="button"${addAttribute(token.tokenId, "data-mint-ocean")} disabled data-astro-cid-n5kiib5i> ${mintLive ? "Mint on Tezos" : "Mint pending"} </button> </div> </div> </article>`), JSON.stringify({
    count: manifest.count,
    tezos: manifest.tezos,
    firstToken: tokens[0]
  }, null, 2), unescapeHTML(JSON.stringify(clientData)), renderScript($$result2, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/morning-ocean.astro?astro&type=script&index=0&lang.ts")) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/morning-ocean.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/morning-ocean.astro";
const $$url = "/morning-ocean";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$MorningOcean,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
