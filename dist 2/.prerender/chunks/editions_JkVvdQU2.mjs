import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';
import contracts from './contracts_B1zhgPPX.mjs';
import { m as market } from './market_tuD5rgVB.mjs';

const $$Editions = createComponent(async ($$result, $$props, $$slots) => {
  const visitNounsKt1 = (contracts.visit_nouns?.mainnet).trim();
  const drumTokenKt1 = (contracts.drum_token?.mainnet).trim();
  const prizeCastKt1 = (contracts.prize_cast?.mainnet).trim();
  let visitNounsSupply = null;
  let visitNounsError = null;
  if (visitNounsKt1.startsWith("KT1")) {
    try {
      const r = await fetch(`https://api.tzkt.io/v1/tokens?contract=${visitNounsKt1}&limit=10000&select=totalSupply,holdersCount`, {
        headers: { Accept: "application/json" }
      });
      if (r.ok) {
        const list = await r.json();
        const total = list.reduce((sum, t) => sum + Number(t.totalSupply ?? 0), 0);
        const holders = list.reduce((max, t) => Math.max(max, t.holdersCount ?? 0), 0);
        visitNounsSupply = { total, holders };
      } else {
        visitNounsError = `tzkt returned ${r.status}`;
      }
    } catch (e) {
      visitNounsError = e?.message || "tzkt fetch failed";
    }
  }
  const { tokens: marketTokens, contract: marketContract } = market;
  const listedTokens = (marketTokens || []).filter((t) => t.listed);
  const faucetBlocks = (await getCollection("blocks", ({ data }) => !data.draft && data.type === "FAUCET")).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const mintBlocks = (await getCollection("blocks", ({ data }) => !data.draft && data.type === "MINT")).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const totalLive = visitNounsSupply?.total ?? 0;
  const totalListed = listedTokens.length;
  const totalFaucet = faucetBlocks.length;
  mintBlocks.length;
  function fmtPrice(xtz) {
    if (xtz === null || xtz === void 0) return "—";
    if (xtz === 0) return "FREE";
    return `${xtz.toFixed(xtz < 1 ? 2 : 1)} ꜩ`;
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/editions",
    name: "PointCast editions — everything mintable",
    description: "Live dashboard of every mintable or claimable PointCast edition across Tezos.",
    url: "https://pointcast.xyz/editions"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Editions", "description": "Every mintable, claimable, and planned PointCast edition in one page. On-chain supply from TzKT, market inventory from objkt, faucet status from the blocks archive.", "image": "/images/og/editions.png", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/editions.json", title: "Editions (JSON)" }], "data-astro-cid-geew4cpv": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-geew4cpv> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-geew4cpv> <a href="/" data-astro-cid-geew4cpv>Home</a> <span aria-hidden="true" data-astro-cid-geew4cpv>›</span> <span data-astro-cid-geew4cpv>editions</span> </nav> <header class="hero" data-astro-cid-geew4cpv> <p class="kicker" data-astro-cid-geew4cpv>EDITIONS · MINT · CLAIM · COLLECT</p> <h1 class="display" data-astro-cid-geew4cpv>Everything mintable on PointCast.</h1> <p class="dek" data-astro-cid-geew4cpv>
On-chain supply live from TzKT. Market inventory from the cached objkt
        snapshot. Faucet status from the blocks archive. One page, four lanes,
        scan it and pick.
</p> </header> <section class="summary" aria-label="Summary" data-astro-cid-geew4cpv> <div class="sum" data-astro-cid-geew4cpv> <p class="sum__label" data-astro-cid-geew4cpv>ON-CHAIN · LIVE</p> <p class="sum__value" data-astro-cid-geew4cpv>${totalLive}</p> <p class="sum__note" data-astro-cid-geew4cpv>Visit Nouns FA2 minted</p> </div> <div class="sum" data-astro-cid-geew4cpv> <p class="sum__label" data-astro-cid-geew4cpv>LISTED · MARKET</p> <p class="sum__value" data-astro-cid-geew4cpv>${totalListed}</p> <p class="sum__note" data-astro-cid-geew4cpv>tokens on objkt</p> </div> <div class="sum" data-astro-cid-geew4cpv> <p class="sum__label" data-astro-cid-geew4cpv>FAUCET · CHANNELS</p> <p class="sum__value" data-astro-cid-geew4cpv>${totalFaucet}</p> <p class="sum__note" data-astro-cid-geew4cpv>free daily claims</p> </div> <div class="sum" data-astro-cid-geew4cpv> <p class="sum__label" data-astro-cid-geew4cpv>PLANNED · INCOMING</p> <p class="sum__value" data-astro-cid-geew4cpv>2</p> <p class="sum__note" data-astro-cid-geew4cpv>DRUM · Prize Cast</p> </div> </section>  <section class="lane" data-astro-cid-geew4cpv> <header class="lane__head" data-astro-cid-geew4cpv> <p class="kicker lane__kicker lane__kicker--live" data-astro-cid-geew4cpv>ON-CHAIN · LIVE</p> <h2 class="lane__title" data-astro-cid-geew4cpv>Visit Nouns FA2 <span class="pill pill--live" data-astro-cid-geew4cpv>LIVE · MAINNET</span></h2> <p class="lane__note" data-astro-cid-geew4cpv>
Open-supply FA2 — each Noun seed is a distinct tokenId (0 through 1199).
${visitNounsSupply ? `${visitNounsSupply.total} minted. ${visitNounsSupply.holders} distinct holders (max per tokenId).` : "Supply read pending."} ${visitNounsError && renderTemplate`<span class="lane__note-err" data-astro-cid-geew4cpv> TzKT: ${visitNounsError}.</span>`} </p> </header> <div class="cards" data-astro-cid-geew4cpv> <article class="card card--big" data-astro-cid-geew4cpv> <div class="card__body" data-astro-cid-geew4cpv> <p class="card__kicker" data-astro-cid-geew4cpv>COLLECTION · <code data-astro-cid-geew4cpv>${visitNounsKt1 || "—"}</code></p> <h3 class="card__title" data-astro-cid-geew4cpv>Every Noun is a Visit.</h3> <p class="card__note" data-astro-cid-geew4cpv>
Mint the Noun you want. Contract metadata base is pointcast.xyz's own
              TZIP-21 endpoint, so every id 0–1199 has working metadata.
</p> <dl class="card__stats" data-astro-cid-geew4cpv> <div data-astro-cid-geew4cpv> <dt data-astro-cid-geew4cpv>Type</dt> <dd data-astro-cid-geew4cpv>FA2 · Open edition</dd> </div> <div data-astro-cid-geew4cpv> <dt data-astro-cid-geew4cpv>Minted</dt> <dd data-astro-cid-geew4cpv>${visitNounsSupply?.total ?? "—"} / ∞</dd> </div> <div data-astro-cid-geew4cpv> <dt data-astro-cid-geew4cpv>Mint price</dt> <dd data-astro-cid-geew4cpv>FREE · gas only (~0.003 ꜩ)</dd> </div> <div data-astro-cid-geew4cpv> <dt data-astro-cid-geew4cpv>Marketplace</dt> <dd data-astro-cid-geew4cpv> <a${addAttribute(`https://objkt.com/collection/${visitNounsKt1}`, "href")} target="_blank" rel="noopener" data-astro-cid-geew4cpv>objkt ↗</a>
· <a${addAttribute(`https://tzkt.io/${visitNounsKt1}`, "href")} target="_blank" rel="noopener" data-astro-cid-geew4cpv>TzKT ↗</a> </dd> </div> </dl> </div> <div class="card__actions" data-astro-cid-geew4cpv> <a class="btn btn--primary" href="/collection/visit-nouns" data-astro-cid-geew4cpv>View mints</a> <a class="btn btn--ghost" href="/for-agents#visit-nouns" data-astro-cid-geew4cpv>Spec</a> </div> </article> </div> </section>  <section class="lane" data-astro-cid-geew4cpv> <header class="lane__head" data-astro-cid-geew4cpv> <p class="kicker lane__kicker lane__kicker--market" data-astro-cid-geew4cpv>LISTED · MARKET</p> <h2 class="lane__title" data-astro-cid-geew4cpv>Collector tokens <span class="pill pill--market" data-astro-cid-geew4cpv>${listedTokens.length} LISTED · objkt</span></h2> <p class="lane__note" data-astro-cid-geew4cpv>
Mike's editorial FA2 — photography, writing, signature moments.
          One listing per tokenId. Mint directly from <a href="/collect" data-astro-cid-geew4cpv>/collect</a>
with a Kukai wallet; the objkt ask is handled on-chain.
</p> </header> ${listedTokens.length > 0 ? renderTemplate`<div class="market-grid" data-astro-cid-geew4cpv> ${listedTokens.map((t) => renderTemplate`<a class="mkt"${addAttribute(`/collect/${t.tokenId}`, "href")} data-astro-cid-geew4cpv> <div class="mkt__art" data-astro-cid-geew4cpv> <img${addAttribute(t.imageThumb || t.imageDisplay, "src")}${addAttribute(t.name, "alt")} loading="lazy" data-astro-cid-geew4cpv> </div> <div class="mkt__body" data-astro-cid-geew4cpv> <p class="mkt__title" data-astro-cid-geew4cpv>${t.name}</p> <p class="mkt__meta mono" data-astro-cid-geew4cpv>
#${t.tokenId} · <span class="mkt__price" data-astro-cid-geew4cpv>${fmtPrice(t.priceXtz)}</span> · ${t.amountLeft ?? "?"} LEFT
</p> </div> </a>`)} </div>` : renderTemplate`<p class="lane__empty" data-astro-cid-geew4cpv>No listings right now. Check back soon.</p>`} <p class="lane__footnote mono" data-astro-cid-geew4cpv>
CONTRACT · <code data-astro-cid-geew4cpv>${marketContract}</code> · updated ${new Date(market.updatedAt).toISOString().slice(0, 10)} </p> </section>  <section class="lane" data-astro-cid-geew4cpv> <header class="lane__head" data-astro-cid-geew4cpv> <p class="kicker lane__kicker lane__kicker--faucet" data-astro-cid-geew4cpv>FAUCET · DAILY</p> <h2 class="lane__title" data-astro-cid-geew4cpv>Free daily claims <span class="pill pill--faucet" data-astro-cid-geew4cpv>GAS ONLY</span></h2> <p class="lane__note" data-astro-cid-geew4cpv>
One claim per wallet per day, no tez cost beyond gas. Visit the block,
          connect a wallet, claim. Mechanic lives on CH.FCT.
</p> </header> <div class="cards" data-astro-cid-geew4cpv> ${faucetBlocks.map((b) => {
    const ch = CHANNELS[b.data.channel];
    const ed = b.data.edition;
    return renderTemplate`<article class="card"${addAttribute(`--card-c: ${ch.color600}; --card-c50: ${ch.color50};`, "style")} data-astro-cid-geew4cpv> <div class="card__body" data-astro-cid-geew4cpv> <p class="card__kicker" data-astro-cid-geew4cpv>CH.${ch.code} · FAUCET · №${b.data.id}</p> <h3 class="card__title" data-astro-cid-geew4cpv>${b.data.title}</h3> ${b.data.dek && renderTemplate`<p class="card__note" data-astro-cid-geew4cpv>${b.data.dek}</p>`} ${ed && renderTemplate`<dl class="card__stats" data-astro-cid-geew4cpv> <div data-astro-cid-geew4cpv><dt data-astro-cid-geew4cpv>Supply today</dt><dd data-astro-cid-geew4cpv>${ed.supply}</dd></div> <div data-astro-cid-geew4cpv><dt data-astro-cid-geew4cpv>Claimed</dt><dd data-astro-cid-geew4cpv>${ed.minted}</dd></div> <div data-astro-cid-geew4cpv><dt data-astro-cid-geew4cpv>Price</dt><dd data-astro-cid-geew4cpv>${ed.price === "free" ? "FREE" : `${ed.price?.tez} ꜩ`}</dd></div> ${"resetAtPT" in (b.data.meta ?? {}) && renderTemplate`<div data-astro-cid-geew4cpv><dt data-astro-cid-geew4cpv>Resets</dt><dd data-astro-cid-geew4cpv>${b.data.meta.resetAtPT} PT</dd></div>`} </dl>`} </div> <div class="card__actions" data-astro-cid-geew4cpv> <a class="btn btn--primary"${addAttribute(`/b/${b.data.id}`, "href")} data-astro-cid-geew4cpv>Open block</a> </div> </article>`;
  })} ${faucetBlocks.length === 0 && renderTemplate`<p class="lane__empty" data-astro-cid-geew4cpv>No active faucet blocks right now.</p>`} </div> </section>  <section class="lane" data-astro-cid-geew4cpv> <header class="lane__head" data-astro-cid-geew4cpv> <p class="kicker lane__kicker lane__kicker--planned" data-astro-cid-geew4cpv>PLANNED · INCOMING</p> <h2 class="lane__title" data-astro-cid-geew4cpv>Coming online <span class="pill pill--planned" data-astro-cid-geew4cpv>BLOCKED ON COMPILE</span></h2> <p class="lane__note" data-astro-cid-geew4cpv>
Two editions are contract-complete but not yet originated. Both are
          sitting on the SmartPy compile step — once that's unblocked they go
          to ghostnet, then mainnet.
</p> </header> <div class="cards" data-astro-cid-geew4cpv> <article class="card card--planned" data-astro-cid-geew4cpv> <div class="card__body" data-astro-cid-geew4cpv> <p class="card__kicker" data-astro-cid-geew4cpv>CH.SPN · TOKEN · FA1.2</p> <h3 class="card__title" data-astro-cid-geew4cpv>DRUM · attention coin <span class="pill pill--soon" data-astro-cid-geew4cpv>SOON</span></h3> <p class="card__note" data-astro-cid-geew4cpv>
An FA1.2 token you earn by drumming on /drum. Signed-voucher claim
              flow: tap enough, claim via Beacon, mint on-chain. Targeting a 10:1
              drums→DRUM issuance rate at launch.
</p> <dl class="card__stats" data-astro-cid-geew4cpv> <div data-astro-cid-geew4cpv><dt data-astro-cid-geew4cpv>Contract</dt><dd data-astro-cid-geew4cpv>${drumTokenKt1 || "<em>pending origination</em>"}</dd></div> <div data-astro-cid-geew4cpv><dt data-astro-cid-geew4cpv>Spec</dt><dd data-astro-cid-geew4cpv><a href="/docs/pm-briefs/2026-04-17-drum-token-integration.md" data-astro-cid-geew4cpv>PM brief</a></dd></div> <div data-astro-cid-geew4cpv><dt data-astro-cid-geew4cpv>Source</dt><dd data-astro-cid-geew4cpv>contracts/v2/drum_token.py</dd></div> </dl> </div> <div class="card__actions" data-astro-cid-geew4cpv> <a class="btn btn--ghost" href="/drum" data-astro-cid-geew4cpv>Visit drum room</a> </div> </article> <article class="card card--planned" data-astro-cid-geew4cpv> <div class="card__body" data-astro-cid-geew4cpv> <p class="card__kicker" data-astro-cid-geew4cpv>CH.CST · NO-LOSS SAVINGS</p> <h3 class="card__title" data-astro-cid-geew4cpv>Prize Cast <span class="pill pill--soon" data-astro-cid-geew4cpv>SOON</span></h3> <p class="card__note" data-astro-cid-geew4cpv>
Pool tez, stake with a baker, weekly yield becomes the prize.
              Principal stays liquid. One winner every Sunday 18:00 UTC.
              PoolTogether-flavored, Tezos-native.
</p> <dl class="card__stats" data-astro-cid-geew4cpv> <div data-astro-cid-geew4cpv><dt data-astro-cid-geew4cpv>Contract</dt><dd data-astro-cid-geew4cpv>${prizeCastKt1 || "<em>pending origination</em>"}</dd></div> <div data-astro-cid-geew4cpv><dt data-astro-cid-geew4cpv>Spec</dt><dd data-astro-cid-geew4cpv><a href="/docs/pm-briefs/2026-04-17-prize-cast-on-tezos.md" data-astro-cid-geew4cpv>PM brief</a></dd></div> <div data-astro-cid-geew4cpv><dt data-astro-cid-geew4cpv>Draw day</dt><dd data-astro-cid-geew4cpv>Sunday 18:00 UTC</dd></div> </dl> </div> <div class="card__actions" data-astro-cid-geew4cpv> <a class="btn btn--primary" href="/cast" data-astro-cid-geew4cpv>Open /cast</a> </div> </article> </div> </section> <aside class="agent-strip" data-astro-cid-geew4cpv> <p class="kicker" data-astro-cid-geew4cpv>AGENT SURFACES</p> <ul class="agent-strip__list" data-astro-cid-geew4cpv> <li data-astro-cid-geew4cpv><a href="/editions.json" data-astro-cid-geew4cpv><span class="mono" data-astro-cid-geew4cpv>GET</span> /editions.json</a></li> <li data-astro-cid-geew4cpv><a href="/blocks.json" data-astro-cid-geew4cpv><span class="mono" data-astro-cid-geew4cpv>GET</span> /blocks.json</a></li> <li data-astro-cid-geew4cpv><a href="/for-agents" data-astro-cid-geew4cpv><span class="mono" data-astro-cid-geew4cpv>SEE</span> /for-agents</a></li> <li data-astro-cid-geew4cpv><a${addAttribute(`https://tzkt.io/${visitNounsKt1}`, "href")} target="_blank" rel="noopener" data-astro-cid-geew4cpv><span class="mono" data-astro-cid-geew4cpv>TZK</span> TzKT ↗</a></li> </ul> </aside> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/editions.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/editions.astro";
const $$url = "/editions";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Editions,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
