import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';
import { $ as $$WalletConnect } from './WalletConnect_C-fpO83k.mjs';
import contracts from './contracts_B1zhgPPX.mjs';

async function getStaticPaths() {
  const mugNames = ["ceramic", "espresso", "latte", "paper", "bistro"];
  const coffee = contracts.coffee_mugs;
  const coffeeContract = String(coffee?.mainnet);
  const coffeePages = Object.keys(coffee?.tokens ?? {}).map((id) => ({
    routeSlug: "coffee-mugs",
    slug: "coffee_mugs",
    collectionName: "Coffee Mugs",
    symbol: String(coffee?.symbol),
    contract: coffeeContract,
    tokenId: id,
    name: coffee?.tokens?.[id],
    art: `/images/coffee-mugs/${mugNames[Number(id)] || "ceramic"}.svg`,
    royaltyBps: Number(coffee?.royalty_bps),
    edition: `${coffee?.edition_caps?.[id] ?? "open"} edition cap`,
    source: "PointCast Coffee Mugs FA2"
  })).filter((token) => token.contract.startsWith("KT1") && token.name);
  const visit = contracts.visit_nouns;
  const visitContract = String(visit?.mainnet);
  const visitIds = /* @__PURE__ */ new Set(["88", "557"]);
  if (visitContract.startsWith("KT1")) {
    try {
      const r = await fetch(`https://api.tzkt.io/v1/tokens?contract=${visitContract}&limit=200&sort=firstTime`);
      if (r.ok) {
        const rows = await r.json();
        rows.forEach((row) => {
          if (row?.tokenId !== void 0) visitIds.add(String(row.tokenId));
        });
      }
    } catch {
    }
  }
  const visitPages = [...visitIds].sort((a, b) => Number(a) - Number(b)).map((id) => ({
    routeSlug: "visit-nouns",
    slug: "visit_nouns",
    collectionName: "Visit Nouns",
    symbol: String(visit?.symbol),
    contract: visitContract,
    tokenId: id,
    name: `Visit Noun #${id}`,
    art: `https://noun.pics/${id}.svg`,
    royaltyBps: 2e3,
    edition: "1/1 Noun seed",
    source: "CC0 Noun art via noun.pics"
  })).filter((token) => token.contract.startsWith("KT1"));
  const pages = [...coffeePages, ...visitPages];
  return pages.map((token) => ({
    params: { collection: token.routeSlug, tokenId: token.tokenId },
    props: { token }
  }));
}
const $$tokenId = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$tokenId;
  const { token } = Astro2.props;
  const marketplace = String(contracts.marketplace?.mainnet);
  const platformFeeBps = Number(contracts.marketplace?.platformFeeBps);
  const objkt = `https://objkt.com/tokens/${token.contract}/${token.tokenId}`;
  const tzkt = `https://tzkt.io/${token.contract}/tokens/${token.tokenId}`;
  const market = `/market?collection=${encodeURIComponent(token.contract)}&token_id=${encodeURIComponent(token.tokenId)}`;
  const wallet = `/wallet/?address=tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw`;
  const desc = `${token.name} from ${token.collectionName} on Tezos. PointCast detail page with holders, market links, objkt, and TzKT provenance.`;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": `${token.name} · PointCast token`, "description": desc, "image": token.art, "data-astro-cid-vknergz5": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="token-page"${addAttribute(token.contract, "data-contract")}${addAttribute(token.tokenId, "data-token-id")}${addAttribute(marketplace, "data-marketplace")} data-astro-cid-vknergz5> <header class="topbar" data-astro-cid-vknergz5> <a class="brand" href="/" data-astro-cid-vknergz5>PointCast</a> <nav class="nav mono" aria-label="Token" data-astro-cid-vknergz5> <a href="/wallet" data-astro-cid-vknergz5>Wallet</a> <a href="/marketplace" data-astro-cid-vknergz5>Marketplace</a> <a href="/market" data-astro-cid-vknergz5>Live asks</a> </nav> ${renderComponent($$result2, "WalletConnect", $$WalletConnect, { "data-astro-cid-vknergz5": true })} </header> <section class="hero" aria-labelledby="token-title" data-astro-cid-vknergz5> <figure class="art-frame" data-astro-cid-vknergz5> <img${addAttribute(token.art, "src")}${addAttribute(token.name, "alt")} loading="eager" data-astro-cid-vknergz5> </figure> <div class="copy" data-astro-cid-vknergz5> <p class="kicker mono" data-astro-cid-vknergz5>${token.symbol} · Tezos · PointCast collectible</p> <h1 id="token-title" data-astro-cid-vknergz5>${token.name}</h1> <p class="dek" data-astro-cid-vknergz5>
A PointCast-native token page for sharing, collecting, listing, and checking provenance.
          The contract data stays Tezos-native; the presentation gets a shelf, a frame, and a little room to breathe.
</p> <div class="actions mono" data-astro-cid-vknergz5> <a class="primary"${addAttribute(market, "href")} data-astro-cid-vknergz5>Market lane</a> <a${addAttribute(wallet, "href")} data-astro-cid-vknergz5>Wallet shelf</a> <a${addAttribute(objkt, "href")} target="_blank" rel="noopener" data-astro-cid-vknergz5>objkt</a> <a${addAttribute(tzkt, "href")} target="_blank" rel="noopener" data-astro-cid-vknergz5>TzKT</a> </div> </div> </section> <section class="details" aria-label="Token details" data-astro-cid-vknergz5> <article class="panel" data-astro-cid-vknergz5> <p class="kicker mono" data-astro-cid-vknergz5>Provenance</p> <dl class="facts" data-astro-cid-vknergz5> <div data-astro-cid-vknergz5><dt data-astro-cid-vknergz5>Collection</dt><dd data-astro-cid-vknergz5>${token.collectionName}</dd></div> <div data-astro-cid-vknergz5><dt data-astro-cid-vknergz5>Token id</dt><dd data-astro-cid-vknergz5>#${token.tokenId}</dd></div> <div data-astro-cid-vknergz5><dt data-astro-cid-vknergz5>Contract</dt><dd data-astro-cid-vknergz5><a${addAttribute(`https://tzkt.io/${token.contract}`, "href")} target="_blank" rel="noopener" data-astro-cid-vknergz5>${token.contract}</a></dd></div> <div data-astro-cid-vknergz5><dt data-astro-cid-vknergz5>Edition</dt><dd data-astro-cid-vknergz5>${token.edition}</dd></div> <div data-astro-cid-vknergz5><dt data-astro-cid-vknergz5>Source</dt><dd data-astro-cid-vknergz5>${token.source}</dd></div> </dl> </article> <article class="panel" data-astro-cid-vknergz5> <p class="kicker mono" data-astro-cid-vknergz5>Market terms</p> <dl class="facts" data-astro-cid-vknergz5> <div data-astro-cid-vknergz5><dt data-astro-cid-vknergz5>Platform</dt><dd data-astro-cid-vknergz5>${platformFeeBps / 100}% to PointCast</dd></div> <div data-astro-cid-vknergz5><dt data-astro-cid-vknergz5>Royalty</dt><dd data-astro-cid-vknergz5>${token.royaltyBps / 100}% creator/originator lane</dd></div> <div data-astro-cid-vknergz5><dt data-astro-cid-vknergz5>Marketplace</dt><dd data-astro-cid-vknergz5>${marketplace.startsWith("KT1") ? marketplace : "pending contract"}</dd></div> <div data-astro-cid-vknergz5><dt data-astro-cid-vknergz5>Trade path</dt><dd data-astro-cid-vknergz5><a${addAttribute(market, "href")} data-astro-cid-vknergz5>Open PointCast listing form</a></dd></div> </dl> </article> <article class="panel live-panel" data-astro-cid-vknergz5> <p class="kicker mono" data-astro-cid-vknergz5>Held now</p> <div id="holders" class="holders mono" aria-live="polite" data-astro-cid-vknergz5>loading holders from TzKT...</div> </article> <article class="panel live-panel" data-astro-cid-vknergz5> <p class="kicker mono" data-astro-cid-vknergz5>Listed now</p> <div id="listing" class="listing mono" aria-live="polite" data-astro-cid-vknergz5>checking PointCast market...</div> </article> </section> <section class="share panel" aria-labelledby="share-title" data-astro-cid-vknergz5> <div data-astro-cid-vknergz5> <p class="kicker mono" data-astro-cid-vknergz5>Share card</p> <h2 id="share-title" data-astro-cid-vknergz5>Send the PointCast page, keep the chain links close.</h2> </div> <button class="copy-button mono" type="button" id="copy-link" data-astro-cid-vknergz5>Copy token link</button> <output class="share-output mono" id="share-output" data-astro-cid-vknergz5>link copies here</output> </section> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/token/[collection]/[tokenId].astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/token/[collection]/[tokenId].astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/token/[collection]/[tokenId].astro";
const $$url = "/token/[collection]/[tokenId]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$tokenId,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
