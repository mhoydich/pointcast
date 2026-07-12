import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';
import { $ as $$WalletConnect } from './WalletConnect_C-fpO83k.mjs';
import contracts from './contracts_B1zhgPPX.mjs';

const $$Wallet = createComponent(async ($$result, $$props, $$slots) => {
  const DEFAULT_WALLET = "tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw";
  const marketplaceKt1 = String(contracts.marketplace?.mainnet);
  const supportedSlugs = contracts.marketplace?.supportedCollections ?? [];
  const names = {
    coffee_mugs: "Coffee Mugs",
    visit_nouns: "Visit Nouns",
    window_snapshots: "Window Snapshots"
  };
  const collections = supportedSlugs.map((slug) => {
    const entry = contracts[slug] ?? {};
    const kt1 = String(entry.mainnet ?? "");
    return {
      slug,
      name: names[slug] ?? slug.replaceAll("_", " "),
      kt1,
      symbol: entry.symbol ?? "PC",
      royaltyBps: Number(entry.royalty_bps ?? 750)
    };
  }).filter((c) => c.kt1.startsWith("KT1"));
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Wallet · PointCast", "description": "A shareable PointCast wallet shelf for Tezos collectibles, live from TzKT.", "data-astro-cid-f4schyhq": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="wallet"${addAttribute(DEFAULT_WALLET, "data-default-wallet")}${addAttribute(marketplaceKt1, "data-marketplace")}${addAttribute(JSON.stringify(collections), "data-collections")} data-astro-cid-f4schyhq> <header class="topbar" data-astro-cid-f4schyhq> <a class="brand" href="/" data-astro-cid-f4schyhq>PointCast</a> <nav class="nav mono" aria-label="Wallet" data-astro-cid-f4schyhq> <a href="/marketplace" data-astro-cid-f4schyhq>Marketplace</a> <a href="/market" data-astro-cid-f4schyhq>Live asks</a> <a href="/profile" data-astro-cid-f4schyhq>Profile</a> </nav> ${renderComponent($$result2, "WalletConnect", $$WalletConnect, { "data-astro-cid-f4schyhq": true })} </header> <section class="hero" aria-labelledby="wallet-title" data-astro-cid-f4schyhq> <div data-astro-cid-f4schyhq> <p class="kicker mono" data-astro-cid-f4schyhq>Collector shelf · Tezos · shareable</p> <h1 id="wallet-title" data-astro-cid-f4schyhq>PointCast wallet view.</h1> <p class="dek" data-astro-cid-f4schyhq>
Paste any Tezos address, connect your own, or share the URL. This
          view filters live TzKT balances to PointCast collections and keeps
          every token one click from objkt, TzKT, and the PointCast market.
</p> </div> <aside class="summary" aria-label="Wallet summary" data-astro-cid-f4schyhq> <p class="mono" id="wallet-status" data-astro-cid-f4schyhq>ready</p> <strong id="wallet-total" data-astro-cid-f4schyhq>0 tokens</strong> <span id="wallet-owner" data-astro-cid-f4schyhq>no address loaded</span> </aside> </section> <section class="panel controls" aria-label="Wallet controls" data-astro-cid-f4schyhq> <label data-astro-cid-f4schyhq> <span class="mono" data-astro-cid-f4schyhq>wallet address</span> <input id="wallet-address" type="text" spellcheck="false"${addAttribute(DEFAULT_WALLET, "value")} data-astro-cid-f4schyhq> </label> <button class="button button--dark mono" type="button" id="load-wallet" data-astro-cid-f4schyhq>Load shelf</button> <button class="button mono" type="button" id="use-connected" data-astro-cid-f4schyhq>Use connected</button> <button class="button mono" type="button" id="share-wallet" data-astro-cid-f4schyhq>Share</button> <output class="share-output mono" id="share-output" data-astro-cid-f4schyhq>share link copies here</output> </section> <section class="panel" aria-labelledby="collections-title" data-astro-cid-f4schyhq> <div class="panel__head" data-astro-cid-f4schyhq> <div data-astro-cid-f4schyhq> <p class="kicker mono" data-astro-cid-f4schyhq>PointCast collections</p> <h2 id="collections-title" data-astro-cid-f4schyhq>Held here</h2> </div> <a class="text-link mono" href="/marketplace" data-astro-cid-f4schyhq>marketplace →</a> </div> <div class="collection-tabs mono" id="collection-tabs" data-astro-cid-f4schyhq></div> <div class="grid" id="wallet-grid" aria-live="polite" data-astro-cid-f4schyhq> <p class="empty mono" data-astro-cid-f4schyhq>load a wallet to see held PointCast tokens</p> </div> </section> <section class="panel lane-panel" aria-labelledby="lanes-title" data-astro-cid-f4schyhq> <div class="panel__head" data-astro-cid-f4schyhq> <div data-astro-cid-f4schyhq> <p class="kicker mono" data-astro-cid-f4schyhq>known lanes</p> <h2 id="lanes-title" data-astro-cid-f4schyhq>Mint, list, collect</h2> </div> </div> <div class="lanes" data-astro-cid-f4schyhq> ${collections.map((collection) => renderTemplate`<article class="lane" data-astro-cid-f4schyhq> <p class="mono" data-astro-cid-f4schyhq>${collection.symbol} · ${collection.royaltyBps / 100}% royalty</p> <h3 data-astro-cid-f4schyhq>${collection.name}</h3> <a class="text-link mono"${addAttribute(`/market?collection=${collection.kt1}`, "href")} data-astro-cid-f4schyhq>open floor →</a> </article>`)} </div> </section> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/wallet.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/wallet.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/wallet.astro";
const $$url = "/wallet";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Wallet,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
