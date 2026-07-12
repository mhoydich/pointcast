import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';
import contracts from './contracts_B1zhgPPX.mjs';

const $$VisitNouns = createComponent(async ($$result, $$props, $$slots) => {
  const KT1 = contracts.visit_nouns?.mainnet;
  const CH = CHANNELS.FCT;
  let tokens = [];
  let fetchErr = null;
  try {
    if (KT1 && KT1.startsWith("KT1")) {
      const r = await fetch(`https://api.tzkt.io/v1/tokens?contract=${KT1}&limit=50&sort=firstTime`);
      if (r.ok) tokens = await r.json();
      else fetchErr = `TzKT returned ${r.status}`;
    } else {
      fetchErr = "contracts.visit_nouns.mainnet not set";
    }
  } catch (e) {
    fetchErr = e?.message || "tzkt fetch failed";
  }
  const holdersByTokenId = {};
  if (tokens.length > 0) {
    for (const t of tokens) {
      try {
        const r = await fetch(
          `https://api.tzkt.io/v1/tokens/balances?token.contract=${KT1}&token.tokenId=${t.tokenId}&balance.gt=0&limit=1`
        );
        if (r.ok) {
          const balances = await r.json();
          const owner = balances[0]?.account?.address;
          if (owner) holdersByTokenId[String(t.tokenId)] = owner;
        }
      } catch {
      }
    }
  }
  function short(addr) {
    if (!addr || addr.length <= 12) return addr ?? "—";
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  }
  const mintedAt = tokens[0]?.firstTime ?? null;
  const mintedAtFmt = mintedAt ? new Date(mintedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Collection",
    "@id": "https://pointcast.xyz/collection/visit-nouns",
    name: "PointCast Visit Nouns",
    description: "Visit Nouns FA2 on Tezos mainnet. One 1/1 per Noun seed. CC0 imagery via noun.pics.",
    url: "https://pointcast.xyz/collection/visit-nouns",
    hasPart: tokens.map((t) => ({
      "@type": "CreativeWork",
      name: `Visit Noun #${t.tokenId}`,
      url: `https://objkt.com/tokens/${KT1}/${t.tokenId}`,
      image: `https://noun.pics/${t.tokenId}.svg`,
      identifier: String(t.tokenId),
      datePublished: t.firstTime
    }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Visit Nouns collection", "description": `${tokens.length} Nouns minted on Tezos mainnet via the Visit Nouns FA2 at ${KT1}. Admin-minted starter batch; CC0 imagery via noun.pics.`, "jsonLd": jsonLd, "data-astro-cid-pfgq3gek": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page"${addAttribute(`--ch-600: ${CH.color600}; --ch-800: ${CH.color800}; --ch-50: ${CH.color50};`, "style")} data-astro-cid-pfgq3gek> <nav class="crumb" data-astro-cid-pfgq3gek> <a href="/" data-astro-cid-pfgq3gek>← Home</a> <span aria-hidden="true" data-astro-cid-pfgq3gek>/</span> <span data-astro-cid-pfgq3gek>collection</span> <span aria-hidden="true" data-astro-cid-pfgq3gek>/</span> <span data-astro-cid-pfgq3gek>visit-nouns</span> </nav> <header class="head" data-astro-cid-pfgq3gek> <p class="kicker" data-astro-cid-pfgq3gek>COLLECTION · VISIT NOUNS · FA2 · TEZOS MAINNET</p> <h1 data-astro-cid-pfgq3gek>Visit Nouns</h1> <p class="dek" data-astro-cid-pfgq3gek> ${tokens.length} Noun${tokens.length === 1 ? "" : "s"} minted on Tezos mainnet starting ${mintedAtFmt}.
        One 1/1 per Noun seed. CC0 imagery via noun.pics. Admin-minted starter batch;
        secondary market on objkt.
</p> <div class="meta" data-astro-cid-pfgq3gek> <p data-astro-cid-pfgq3gek><span data-astro-cid-pfgq3gek>contract</span> <code data-astro-cid-pfgq3gek>${KT1}</code></p> <p data-astro-cid-pfgq3gek><span data-astro-cid-pfgq3gek>standard</span> FA2 · SmartPy v0.24</p> <p data-astro-cid-pfgq3gek><span data-astro-cid-pfgq3gek>supply per token</span> 1</p> <p data-astro-cid-pfgq3gek><span data-astro-cid-pfgq3gek>royalties</span> 20% → admin</p> <p data-astro-cid-pfgq3gek><span data-astro-cid-pfgq3gek>tzkt</span> <a${addAttribute(`https://tzkt.io/${KT1}`, "href")} target="_blank" rel="noopener" data-astro-cid-pfgq3gek>view contract →</a></p> </div> </header> ${fetchErr && renderTemplate`<div class="error" data-astro-cid-pfgq3gek> <p class="error__label" data-astro-cid-pfgq3gek>TZKT FETCH FAILED AT BUILD</p> <p data-astro-cid-pfgq3gek>${fetchErr}. Rebuild to retry, or visit <a${addAttribute(`https://tzkt.io/${KT1}/operations`, "href")} target="_blank" rel="noopener" data-astro-cid-pfgq3gek>TzKT directly</a>.</p> </div>`} ${tokens.length > 0 && renderTemplate`<section class="grid" data-astro-cid-pfgq3gek> ${tokens.map((t, i) => {
    const blockId = String(230 + i).padStart(4, "0");
    const holder = holdersByTokenId[String(t.tokenId)] ?? "";
    return renderTemplate`<article class="card" data-astro-cid-pfgq3gek> <a class="card__art"${addAttribute(`/b/${blockId}`, "href")} data-astro-cid-pfgq3gek> <img${addAttribute(`https://noun.pics/${t.tokenId}.svg`, "src")}${addAttribute(`Noun #${t.tokenId}`, "alt")} loading="lazy" data-astro-cid-pfgq3gek> </a> <div class="card__body" data-astro-cid-pfgq3gek> <p class="card__code" data-astro-cid-pfgq3gek>№ <b data-astro-cid-pfgq3gek>${t.tokenId}</b></p> <p class="card__line" data-astro-cid-pfgq3gek><span data-astro-cid-pfgq3gek>minted</span> ${new Date(t.firstTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p> <p class="card__line" data-astro-cid-pfgq3gek><span data-astro-cid-pfgq3gek>held by</span> <b data-astro-cid-pfgq3gek>${short(holder)}</b></p> </div> <div class="card__actions" data-astro-cid-pfgq3gek> <a${addAttribute(`/b/${blockId}`, "href")} data-astro-cid-pfgq3gek>/b/${blockId}</a> <a${addAttribute(`https://objkt.com/tokens/${KT1}/${t.tokenId}`, "href")} target="_blank" rel="noopener" data-astro-cid-pfgq3gek>objkt ↗</a> <a${addAttribute(`https://tzkt.io/${KT1}/tokens/${t.tokenId}`, "href")} target="_blank" rel="noopener" data-astro-cid-pfgq3gek>tzkt ↗</a> </div> </article>`;
  })} </section>`} <aside class="agent-strip" data-astro-cid-pfgq3gek> <p class="agent-strip__label" data-astro-cid-pfgq3gek>MACHINE-READABLE</p> <ul data-astro-cid-pfgq3gek> <li data-astro-cid-pfgq3gek><a href="/c/faucet.json" data-astro-cid-pfgq3gek>/c/faucet.json</a></li> <li data-astro-cid-pfgq3gek><a${addAttribute(`https://api.tzkt.io/v1/tokens?contract=${KT1}`, "href")} target="_blank" rel="noopener" data-astro-cid-pfgq3gek>TzKT tokens ↗</a></li> <li data-astro-cid-pfgq3gek><a${addAttribute(`https://api.tzkt.io/v1/contracts/${KT1}`, "href")} target="_blank" rel="noopener" data-astro-cid-pfgq3gek>TzKT contract ↗</a></li> <li data-astro-cid-pfgq3gek><a href="/for-agents" data-astro-cid-pfgq3gek>/for-agents</a></li> </ul> </aside> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/collection/visit-nouns.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/collection/visit-nouns.astro";
const $$url = "/collection/visit-nouns";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$VisitNouns,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
