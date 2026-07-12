import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';
import { $ as $$WalletConnect } from './WalletConnect_C-fpO83k.mjs';
import contracts from './contracts_B1zhgPPX.mjs';

const $$Market = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Market;
  const marketplaceKt1 = (contracts.marketplace?.mainnet).trim();
  const marketplaceLive = marketplaceKt1.startsWith("KT1");
  const platformFeeBps = contracts.marketplace?.platformFeeBps;
  const legacyMarketplaceKt1s = (contracts.marketplace?._legacy_marketplace ?? []).filter((s) => typeof s === "string" && s.trim().startsWith("KT1")).map((s) => s.trim());
  const marketplaceVersion = Number(contracts.marketplace?.version);
  const marketplaceV4Plus = marketplaceVersion >= 4;
  const defaultRoyaltyReceiver = (contracts.marketplace?.royaltyReceiver).trim();
  const supported = contracts.marketplace?.supportedCollections ?? [];
  const SLUG_NAMES = {
    coffee_mugs: "Coffee Mugs",
    visit_nouns: "Visit Nouns",
    birthdays: "Birthdays",
    drum_token: "Drum Token",
    window_snapshots: "Window Snapshots"
  };
  const collections = supported.map((slug) => {
    const entry = contracts[slug];
    const kt1 = entry?.mainnet?.trim?.() || "";
    return {
      slug,
      name: SLUG_NAMES[slug] || slug,
      kt1,
      live: kt1.startsWith("KT1")
    };
  }).filter((c) => c.live);
  const collectionsRegistry = collections.map((c) => ({ slug: c.slug, name: c.name, kt1: c.kt1 }));
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Market · PointCast", "description": "PointCast NFT marketplace — buy and list Coffee Mugs, Visit Nouns, and every PointCast FA2 collection on Tezos.", "data-astro-cid-vlsggw6o": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="market" data-astro-cid-vlsggw6o> <!-- Masthead — same warm-mono treatment as /coffee + /drum + /admin. --> <header class="market__masthead" data-astro-cid-vlsggw6o> <a href="/" class="market__home" data-astro-cid-vlsggw6o>PointCast</a> <span class="market__path" data-astro-cid-vlsggw6o>/ market</span> <span class="market__masthead-spacer" data-astro-cid-vlsggw6o></span> ${renderComponent($$result2, "WalletConnect", $$WalletConnect, { "data-astro-cid-vlsggw6o": true })} </header> <header class="market__hero" data-astro-cid-vlsggw6o> <p class="market__kicker mono" data-astro-cid-vlsggw6o>PointCast Market · Tezos · multi-collection</p> <h1 class="market__title" data-astro-cid-vlsggw6o>Trade every mug, noun, and card on PointCast.</h1> <p class="market__dek" data-astro-cid-vlsggw6o>
One marketplace, every collection. Sellers list with a price they pick.
        Buyers fill the ask with one signature. ${platformFeeBps / 100}% platform
        fee, royalty per-listing, payment splits at fulfill time.
</p> <div class="market__status-row mono" id="market-status-row" data-mode="loading" data-astro-cid-vlsggw6o> <span class="market__status-dot" aria-hidden="true" data-astro-cid-vlsggw6o></span> <span class="market__status-label" id="market-status-label" data-astro-cid-vlsggw6o>checking marketplace status…</span> </div> <p class="market__hero-link mono" data-astro-cid-vlsggw6o>
Need the whole desk? <a href="/marketplace" data-astro-cid-vlsggw6o>Open /marketplace</a> for royalties, referral links, trade tickets, and share cards.
</p> </header> <!-- Browse grid — populated from tzkt at runtime. --> <section class="market__section" aria-labelledby="market-browse-title" data-astro-cid-vlsggw6o> <header class="market__section-head" data-astro-cid-vlsggw6o> <h2 id="market-browse-title" class="market__section-title" data-astro-cid-vlsggw6o>Listings</h2> <p class="market__section-dek mono" id="market-browse-summary" data-astro-cid-vlsggw6o>loading…</p> </header> <ul class="market__grid" id="market-grid" role="list" data-astro-cid-vlsggw6o> <li class="market__empty mono" id="market-empty" data-astro-cid-vlsggw6o>no listings yet · be the first to list below</li> </ul> </section> <!-- Your tokens — surfaces FA2 holdings from supported collections so
         the user can list anything they own with a one-click form pre-fill. --> <section class="market__section" aria-labelledby="market-mine-title" data-astro-cid-vlsggw6o> <header class="market__section-head" data-astro-cid-vlsggw6o> <h2 id="market-mine-title" class="market__section-title" data-astro-cid-vlsggw6o>Your tokens</h2> <p class="market__section-dek mono" id="market-mine-summary" data-astro-cid-vlsggw6o>connect a wallet to see what you can list</p> </header> <ul class="market__grid market__grid--mine" id="market-mine-grid" role="list" hidden data-astro-cid-vlsggw6o></ul> <p class="market__mine-empty mono" id="market-mine-empty" hidden data-astro-cid-vlsggw6o>connected wallet holds no tokens from supported collections yet · pour a cup at <a href="/coffee" data-astro-cid-vlsggw6o>/coffee</a> or visit <a href="/visit-nouns" data-astro-cid-vlsggw6o>/visit-nouns</a> to claim one</p> </section> <!-- List a token — only meaningful when a wallet is connected. --> <section class="market__section" aria-labelledby="market-list-title" data-astro-cid-vlsggw6o> <header class="market__section-head" data-astro-cid-vlsggw6o> <h2 id="market-list-title" class="market__section-title" data-astro-cid-vlsggw6o>List your token</h2> <p class="market__section-dek mono" data-astro-cid-vlsggw6o>connect a wallet that owns a PointCast NFT · pick the collection + token + price · sign once.</p> </header> <form class="market__list-form" id="market-list-form" action="javascript:void(0)"${addAttribute(marketplaceKt1, "data-marketplace-kt1")}${addAttribute(String(marketplaceVersion), "data-marketplace-version")}${addAttribute(defaultRoyaltyReceiver, "data-default-royalty-receiver")}${addAttribute(JSON.stringify(legacyMarketplaceKt1s), "data-legacy-marketplace")}${addAttribute(JSON.stringify(collectionsRegistry), "data-collections")} data-astro-cid-vlsggw6o> <label class="market__field" data-astro-cid-vlsggw6o> <span class="market__field-label mono" data-astro-cid-vlsggw6o>collection</span> <select name="collection" id="market-list-collection" required data-astro-cid-vlsggw6o> ${collections.length === 0 ? renderTemplate`<option value="" disabled selected data-astro-cid-vlsggw6o>no live collections yet</option>` : collections.map((c) => renderTemplate`<option${addAttribute(c.kt1, "value")}${addAttribute(c.slug, "data-slug")} data-astro-cid-vlsggw6o>${c.name}</option>`)} </select> </label> <label class="market__field" data-astro-cid-vlsggw6o> <span class="market__field-label mono" data-astro-cid-vlsggw6o>token id</span> <input type="number" name="token_id" id="market-list-token-id" min="0" placeholder="0" required data-astro-cid-vlsggw6o> </label> <label class="market__field" data-astro-cid-vlsggw6o> <span class="market__field-label mono" data-astro-cid-vlsggw6o>price (ꜩ)</span> <input type="number" name="price_xtz" id="market-list-price" min="0" step="0.000001" placeholder="1.0" required data-astro-cid-vlsggw6o> </label> <label class="market__field" data-astro-cid-vlsggw6o> <span class="market__field-label mono" data-astro-cid-vlsggw6o>royalty (bps · 750 = 7.5%)</span> <input type="number" name="royalty_bps" id="market-list-royalty" min="0" max="10000" value="750" required data-astro-cid-vlsggw6o> </label> ${marketplaceV4Plus && renderTemplate`<label class="market__field market__field--royalty-recv" data-astro-cid-vlsggw6o> <span class="market__field-label mono" data-astro-cid-vlsggw6o>royalty receiver</span> <input type="text" name="royalty_receiver" id="market-list-royalty-receiver" pattern="^tz[123][A-Za-z0-9]{33}$"${addAttribute(defaultRoyaltyReceiver || "tz1… or tz2…", "placeholder")}${addAttribute(defaultRoyaltyReceiver, "value")}${addAttribute(false, "spellcheck")} autocomplete="off" required data-astro-cid-vlsggw6o> <span class="market__field-hint mono" data-astro-cid-vlsggw6o>defaults to the original creator for known PointCast collections · override to send royalties anywhere</span> </label>`} <div class="market__list-actions" data-astro-cid-vlsggw6o> <button type="submit" id="market-list-btn" class="market__btn mono" disabled data-astro-cid-vlsggw6o> <span id="market-list-label" data-astro-cid-vlsggw6o>awaiting marketplace contract</span> </button> <p class="market__list-status mono" id="market-list-status" role="status" aria-live="polite" data-astro-cid-vlsggw6o></p> </div> </form> <p class="market__list-foot mono" data-astro-cid-vlsggw6o>
listing fires two ops in one Kukai signature: <code data-astro-cid-vlsggw6o>update_operators</code> on the FA2 (gives the marketplace permission to transfer your token) + <code data-astro-cid-vlsggw6o>list_ask</code> on the marketplace (creates the listing). cancel or update price anytime from the card.
</p> </section> <!-- Recent sales feed — fulfill_ask ops (visitor-facing social proof) --> <aside class="market__sales-wrap" id="market-sales-wrap" hidden aria-labelledby="market-sales-title" data-astro-cid-vlsggw6o> <header class="market__section-head" data-astro-cid-vlsggw6o> <h2 id="market-sales-title" class="market__section-title" data-astro-cid-vlsggw6o>Recent sales</h2> <p class="market__section-dek mono" data-astro-cid-vlsggw6o>live tzkt feed · last 8 fulfilled asks</p> </header> <ol class="market__sales mono" id="market-sales" role="list" data-astro-cid-vlsggw6o></ol> </aside> <!-- About / spec --> <section class="market__section" aria-labelledby="market-about-title" data-astro-cid-vlsggw6o> <h2 id="market-about-title" class="market__section-title" data-astro-cid-vlsggw6o>How it works</h2> <dl class="market__about" data-astro-cid-vlsggw6o> <div data-astro-cid-vlsggw6o> <dt data-astro-cid-vlsggw6o>Contract</dt> <dd data-astro-cid-vlsggw6o> ${marketplaceLive ? renderTemplate`<a class="market__link"${addAttribute(`https://tzkt.io/${marketplaceKt1}`, "href")} target="_blank" rel="noopener" data-astro-cid-vlsggw6o>${marketplaceKt1}</a>` : renderTemplate`<span class="market__pending-pill" data-astro-cid-vlsggw6o>awaiting origination · /admin/deploy/marketplace</span>`} </dd> </div> <div data-astro-cid-vlsggw6o> <dt data-astro-cid-vlsggw6o>Platform fee</dt> <dd data-astro-cid-vlsggw6o>${platformFeeBps / 100}% per sale · routes to PointCast treasury</dd> </div> <div data-astro-cid-vlsggw6o> <dt data-astro-cid-vlsggw6o>Royalty</dt> <dd data-astro-cid-vlsggw6o>seller-set per listing · default 7.5% · routes to creator on each sale</dd> </div> <div data-astro-cid-vlsggw6o> <dt data-astro-cid-vlsggw6o>Supported collections</dt> <dd data-astro-cid-vlsggw6o> ${collections.length > 0 ? collections.map((c) => c.name).join(" · ") : "awaiting at least one live collection"} </dd> </div> <div data-astro-cid-vlsggw6o> <dt data-astro-cid-vlsggw6o>Source</dt> <dd data-astro-cid-vlsggw6o> <a class="market__link" href="https://github.com/mhoydich/pointcast/blob/main/contracts/v2/marketplace.py" target="_blank" rel="noopener" data-astro-cid-vlsggw6o>contracts/v2/marketplace.py &nearr;</a> </dd> </div> <div data-astro-cid-vlsggw6o> <dt data-astro-cid-vlsggw6o>Admin</dt> <dd data-astro-cid-vlsggw6o> <a class="market__link" href="/admin/deploy/marketplace/" data-astro-cid-vlsggw6o>/admin/deploy/marketplace &rarr;</a> </dd> </div> </dl> </section> </div> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/market.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/market.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/market.astro";
const $$url = "/market";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Market,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
