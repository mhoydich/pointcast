import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Index;
  const WALLET = "tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw";
  const TZKT = "https://api.tzkt.io/v1";
  const MAX_TOKENS = 120;
  let tokens = [];
  let fetchErr = null;
  try {
    const r = await fetch(
      `${TZKT}/tokens/balances?account=${WALLET}&balance.gt=0&limit=${MAX_TOKENS}&sort.desc=lastLevel&token.metadata.artifactUri.ne=null`
    );
    if (r.ok) tokens = await r.json();
    else fetchErr = `TzKT returned ${r.status}`;
  } catch (e) {
    fetchErr = e?.message || "tzkt fetch failed";
  }
  const byContract = {};
  for (const t of tokens) {
    const c = t.token.contract.address;
    byContract[c] = byContract[c] ?? [];
    byContract[c].push(t);
  }
  function contractLabel(addr, tokens2) {
    const alias = tokens2[0]?.token.contract.alias;
    if (alias) return alias;
    return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
  }
  const contractChips = Object.entries(byContract).map(([addr, ts]) => ({
    addr,
    label: contractLabel(addr, ts),
    count: ts.length,
    slug: addr.slice(3, 11).toLowerCase()
    // stable-ish id for the filter
  })).sort((a, b) => b.count - a.count);
  function imageFor(t) {
    const c = t.token.contract.address;
    const id = t.token.tokenId;
    return `https://assets.objkt.media/file/assets-003/${c}/${id}/thumb400`;
  }
  function ipfsGateway(uri) {
    if (!uri) return null;
    if (uri.startsWith("ipfs://")) return "https://ipfs.io/ipfs/" + uri.slice(7);
    return uri;
  }
  function shortAddr(a) {
    return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Collection",
    "@id": "https://pointcast.xyz/collection",
    name: "Mike Hoydich · Tezos holdings",
    description: `${tokens.length} Tezos NFTs across ${Object.keys(byContract).length} contracts. Live from TzKT at build time.`,
    url: "https://pointcast.xyz/collection",
    collectionSize: tokens.length,
    hasPart: tokens.slice(0, 30).map((t) => ({
      "@type": "CreativeWork",
      name: t.token.metadata?.name ?? `Token #${t.token.tokenId}`,
      url: `https://objkt.com/tokens/${t.token.contract.address}/${t.token.tokenId}`,
      image: imageFor(t),
      identifier: `${t.token.contract.address}:${t.token.tokenId}`
    }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Collection", "description": `Every Tezos NFT Mike holds on ${WALLET}. ${tokens.length} tokens across ${Object.keys(byContract).length} contracts.`, "image": "/images/og/collection.png", "jsonLd": jsonLd, "data-astro-cid-7w5nfjyj": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", `<div class="page" data-astro-cid-7w5nfjyj> <nav class="crumb" data-astro-cid-7w5nfjyj> <a href="/" data-astro-cid-7w5nfjyj>← Home</a> <span aria-hidden="true" data-astro-cid-7w5nfjyj>/</span> <span data-astro-cid-7w5nfjyj>collection</span> </nav> <header class="head" data-astro-cid-7w5nfjyj> <p class="kicker" data-astro-cid-7w5nfjyj>COLLECTION · TEZOS HOLDINGS</p> <h1 data-astro-cid-7w5nfjyj>Mike's Tezos NFTs</h1> <p class="dek" data-astro-cid-7w5nfjyj> `, " tokens held across ", ' contracts.\n        Live from TzKT at build time; refreshes on every deploy.\n        Drill down to <a href="/collection/visit-nouns" data-astro-cid-7w5nfjyj>/collection/visit-nouns</a>\nfor the PointCast-originated Visit Nouns FA2.\n</p> <div class="meta" data-astro-cid-7w5nfjyj> <p data-astro-cid-7w5nfjyj><span data-astro-cid-7w5nfjyj>wallet</span> <code data-astro-cid-7w5nfjyj>', "</code></p> <p data-astro-cid-7w5nfjyj><span data-astro-cid-7w5nfjyj>tokens</span> <b data-astro-cid-7w5nfjyj>", "</b></p> <p data-astro-cid-7w5nfjyj><span data-astro-cid-7w5nfjyj>contracts</span> <b data-astro-cid-7w5nfjyj>", "</b></p> <p data-astro-cid-7w5nfjyj><span data-astro-cid-7w5nfjyj>tzkt</span> <a", ' target="_blank" rel="noopener" data-astro-cid-7w5nfjyj>view wallet →</a></p> </div> </header> ', " ", " ", ` <script>
      // Client-side filter — toggles display of .card elements based on
      // the active chip. No reload, no router, just a classList flip.
      (function () {
        const filter = document.getElementById('contract-filter');
        const grid = document.getElementById('token-grid');
        if (!filter || !grid) return;

        const chips = filter.querySelectorAll('[data-filter]');
        const cards = grid.querySelectorAll('.card');

        chips.forEach((chip) => {
          chip.addEventListener('click', () => {
            chips.forEach((c) => c.classList.remove('chip--active'));
            chip.classList.add('chip--active');
            const f = chip.getAttribute('data-filter');
            cards.forEach((card) => {
              const match = f === 'all' || card.getAttribute('data-contract') === f;
              card.style.display = match ? '' : 'none';
            });
          });
        });
      })();
    <\/script> <aside class="agent-strip" data-astro-cid-7w5nfjyj> <p class="agent-strip__label" data-astro-cid-7w5nfjyj>MACHINE-READABLE</p> <ul data-astro-cid-7w5nfjyj> <li data-astro-cid-7w5nfjyj><a href="/collection/visit-nouns" data-astro-cid-7w5nfjyj>/collection/visit-nouns</a></li> <li data-astro-cid-7w5nfjyj><a`, ' target="_blank" rel="noopener" data-astro-cid-7w5nfjyj>TzKT balances ↗</a></li> <li data-astro-cid-7w5nfjyj><a', ' target="_blank" rel="noopener" data-astro-cid-7w5nfjyj>objkt profile ↗</a></li> <li data-astro-cid-7w5nfjyj><a href="/for-agents" data-astro-cid-7w5nfjyj>/for-agents</a></li> </ul> </aside> </div> '])), maybeRenderHead(), tokens.length, Object.keys(byContract).length, WALLET, tokens.length, Object.keys(byContract).length, addAttribute(`https://tzkt.io/${WALLET}/tokens`, "href"), fetchErr && renderTemplate`<div class="error" data-astro-cid-7w5nfjyj> <p class="error__label" data-astro-cid-7w5nfjyj>TZKT FETCH FAILED AT BUILD</p> <p data-astro-cid-7w5nfjyj>${fetchErr}. Rebuild to retry, or view the wallet directly on <a${addAttribute(`https://tzkt.io/${WALLET}`, "href")} target="_blank" rel="noopener" data-astro-cid-7w5nfjyj>TzKT</a>.</p> </div>`, contractChips.length > 1 && renderTemplate`<nav class="filter" aria-label="Filter by contract" id="contract-filter" data-astro-cid-7w5nfjyj> <span class="filter__label" data-astro-cid-7w5nfjyj>BY CONTRACT</span> <div class="filter__chips" data-astro-cid-7w5nfjyj> <button type="button" class="chip chip--active" data-filter="all" data-astro-cid-7w5nfjyj>
ALL <span class="chip__count" data-astro-cid-7w5nfjyj>${tokens.length}</span> </button> ${contractChips.slice(0, 12).map((c) => renderTemplate`<button type="button" class="chip"${addAttribute(c.addr, "data-filter")}${addAttribute(c.addr, "title")} data-astro-cid-7w5nfjyj> ${c.label} <span class="chip__count" data-astro-cid-7w5nfjyj>${c.count}</span> </button>`)} </div> </nav>`, tokens.length > 0 && renderTemplate`<section class="grid" id="token-grid" data-astro-cid-7w5nfjyj> ${tokens.map((t) => {
    const meta = t.token.metadata ?? {};
    const name = meta.name ?? `Token #${t.token.tokenId}`;
    const ipfsFallback = ipfsGateway(meta.displayUri ?? meta.thumbnailUri ?? meta.artifactUri);
    const contractAlias = t.token.contract.alias;
    return renderTemplate`<article class="card"${addAttribute(t.token.contract.address, "data-contract")} data-astro-cid-7w5nfjyj> <a class="card__art"${addAttribute(`https://objkt.com/tokens/${t.token.contract.address}/${t.token.tokenId}`, "href")} target="_blank" rel="noopener" data-astro-cid-7w5nfjyj> <img${addAttribute(imageFor(t), "src")}${addAttribute(name, "alt")} loading="lazy"${addAttribute(ipfsFallback ?? "", "data-fallback")} onerror="if(this.dataset.fallback && this.src!==this.dataset.fallback){this.src=this.dataset.fallback;}else{this.parentElement.style.display='none';}" data-astro-cid-7w5nfjyj> </a> <div class="card__body" data-astro-cid-7w5nfjyj> <p class="card__title"${addAttribute(name, "title")} data-astro-cid-7w5nfjyj>${name.length > 38 ? name.slice(0, 37) + "…" : name}</p> <p class="card__contract"${addAttribute(t.token.contract.address, "title")} data-astro-cid-7w5nfjyj> ${contractAlias ? contractAlias : shortAddr(t.token.contract.address)} <span class="card__tid" data-astro-cid-7w5nfjyj>№${t.token.tokenId}</span> </p> </div> </article>`;
  })} </section>`, addAttribute(`https://api.tzkt.io/v1/tokens/balances?account=${WALLET}&balance.gt=0`, "href"), addAttribute(`https://objkt.com/profile/${WALLET}/owned`, "href")) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/collection/index.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/collection/index.astro";
const $$url = "/collection";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
