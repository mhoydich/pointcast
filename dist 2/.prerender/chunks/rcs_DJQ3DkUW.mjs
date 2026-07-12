import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$Rcs = createComponent(async ($$result, $$props, $$slots) => {
  const CONTRACT = "KT1HZVd9Cjc2CMe3sQvXgbxhpJkdena21pih";
  const OBJKT_COLLECTION_URL = `https://objkt.com/collections/tezos/${CONTRACT}`;
  const TZKT_CONTRACT_URL = `https://tzkt.io/${CONTRACT}/tokens`;
  const TZKT_TOKENS_API = `https://api.tzkt.io/v1/tokens?contract=${CONTRACT}&limit=48&select=tokenId,metadata`;
  const OBJKT_GRAPHQL = "https://data.objkt.com/v3/graphql";
  const fallbackStats = {
    items: 37802,
    owners: 5712,
    floorMutez: 959e4,
    volume24hMutez: 7204990,
    volumeTotalMutez: 412916549713
  };
  function tez(mutez) {
    if (mutez === null || Number.isNaN(mutez)) return "—";
    const value = mutez / 1e6;
    return `${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: value >= 100 ? 0 : 2,
      maximumFractionDigits: value >= 100 ? 0 : 2
    }).format(value)} ꜩ`;
  }
  function count(value) {
    return new Intl.NumberFormat("en-US").format(value);
  }
  function ipfsToGateway(uri) {
    if (!uri) return "";
    return uri.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}` : uri;
  }
  async function getCollectionStats() {
    const query = `
    query Collection($address:String!) {
      fa(where:{contract:{_eq:$address}}) {
        editions
        items
        owners
        floor_price
        volume_24h
        volume_total
      }
    }
  `;
    try {
      const res = await fetch(OBJKT_GRAPHQL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, variables: { address: CONTRACT } })
      });
      if (!res.ok) return fallbackStats;
      const json = await res.json();
      const fa = json?.data?.fa?.[0];
      if (!fa) return fallbackStats;
      return {
        items: Number(fa.items ?? fa.editions ?? fallbackStats.items),
        owners: Number(fa.owners ?? fallbackStats.owners),
        floorMutez: fa.floor_price === null ? null : Number(fa.floor_price),
        volume24hMutez: fa.volume_24h === null ? null : Number(fa.volume_24h),
        volumeTotalMutez: fa.volume_total === null ? null : Number(fa.volume_total)
      };
    } catch {
      return fallbackStats;
    }
  }
  async function getTokens() {
    try {
      const res = await fetch(TZKT_TOKENS_API);
      if (!res.ok) return [];
      const rows = await res.json();
      return rows.map((row) => {
        const tokenId = String(row.tokenId);
        const metadata = row.metadata ?? {};
        const fallback = ipfsToGateway(metadata.thumbnailUri) || ipfsToGateway(metadata.displayUri) || ipfsToGateway(metadata.artifactUri);
        return {
          tokenId,
          name: metadata.name ?? `Skele ${tokenId}`,
          traits: Array.isArray(metadata.attributes) ? metadata.attributes : [],
          cdn: `https://assets.objkt.media/file/assets-003/${CONTRACT}/${tokenId}/thumb400`,
          fallback,
          objkt: `https://objkt.com/tokens/${CONTRACT}/${tokenId}`
        };
      });
    } catch {
      return [];
    }
  }
  const [stats, tokens] = await Promise.all([getCollectionStats(), getTokens()]);
  const traitAnatomy = [
    { name: "Hat", examples: "🎧 💀 👑 🧢" },
    { name: "Glasses", examples: "🧡 🤓 😎 🥽" },
    { name: "Body", examples: "🏆 🥝 🍄 🧊" },
    { name: "Arm", examples: "🍎 🥚 ⚡ 🪩" },
    { name: "Hand", examples: "🍆 🧹 🦴 🔑" },
    { name: "Bottom", examples: "🎉 💀 👖 🛼" },
    { name: "Top", examples: "🟡 🌭 🌈 🧃" },
    { name: "Background", examples: "👻 🥶 🌊 🔥" }
  ];
  const description = "A PointCast-native room for randomly common skeles, the 37,802-piece animated FA2 collection by John Karel on Tezos.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/rcs",
    name: "randomly common skeles",
    description,
    url: "https://pointcast.xyz/rcs",
    mainEntity: {
      "@type": "VisualArtwork",
      name: "randomly common skeles",
      creator: { "@type": "Person", name: "John Karel" },
      artform: "Animated GIF generative collection",
      identifier: CONTRACT,
      url: OBJKT_COLLECTION_URL
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "RCS", "description": description, "jsonLd": jsonLd, "data-astro-cid-3xepjyex": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="page" data-astro-cid-3xepjyex> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-3xepjyex> <a href="/" data-astro-cid-3xepjyex>Home</a> <span aria-hidden="true" data-astro-cid-3xepjyex>/</span> <span data-astro-cid-3xepjyex>rcs</span> </nav> <header class="hero" data-astro-cid-3xepjyex> <div data-astro-cid-3xepjyex> <p class="kicker" data-astro-cid-3xepjyex>POINTCAST · TEZOS COLLECTION</p> <h1 data-astro-cid-3xepjyex>randomly common skeles</h1> <p class="dek" data-astro-cid-3xepjyex>
Thirty-seven thousand animated skeletons, each built from eight emoji
          traits and sealed as an FA2 token on Tezos. Common by name, wildly
          specific in the hand.
</p> </div> <figure class="hero-card" data-astro-cid-3xepjyex> <img${addAttribute(tokens[0]?.cdn, "src")}${addAttribute(tokens[0]?.fallback, "data-fallback")}${addAttribute(tokens[0]?.name ?? "randomly common skele", "alt")} data-astro-cid-3xepjyex> <figcaption data-astro-cid-3xepjyex>${tokens[0]?.name ?? "RCS"}</figcaption> </figure> </header> <section class="stats" aria-label="Collection stats" data-astro-cid-3xepjyex> <article data-astro-cid-3xepjyex> <span data-astro-cid-3xepjyex>items</span> <strong data-astro-cid-3xepjyex>${count(stats.items)}</strong> </article> <article data-astro-cid-3xepjyex> <span data-astro-cid-3xepjyex>owners</span> <strong data-astro-cid-3xepjyex>${count(stats.owners)}</strong> </article> <article data-astro-cid-3xepjyex> <span data-astro-cid-3xepjyex>floor</span> <strong data-astro-cid-3xepjyex>${tez(stats.floorMutez)}</strong> </article> <article data-astro-cid-3xepjyex> <span data-astro-cid-3xepjyex>24h vol</span> <strong data-astro-cid-3xepjyex>${tez(stats.volume24hMutez)}</strong> </article> <article data-astro-cid-3xepjyex> <span data-astro-cid-3xepjyex>total vol</span> <strong data-astro-cid-3xepjyex>${tez(stats.volumeTotalMutez)}</strong> </article> <article class="contract" data-astro-cid-3xepjyex> <span data-astro-cid-3xepjyex>contract</span> <strong data-astro-cid-3xepjyex>${CONTRACT.slice(0, 8)}…${CONTRACT.slice(-6)}</strong> </article> </section> <section class="grid-head" data-astro-cid-3xepjyex> <div data-astro-cid-3xepjyex> <p class="kicker" data-astro-cid-3xepjyex>LIVE GRID</p> <h2 data-astro-cid-3xepjyex>48 skeles from the contract</h2> </div> <a class="button"${addAttribute(OBJKT_COLLECTION_URL, "href")} target="_blank" rel="noopener" data-astro-cid-3xepjyex>
Browse all ${count(stats.items)} </a> </section> <section class="token-grid" aria-label="randomly common skeles token grid" data-astro-cid-3xepjyex> ${tokens.map((token) => renderTemplate`<a class="token"${addAttribute(token.objkt, "href")} target="_blank" rel="noopener" data-astro-cid-3xepjyex> <img${addAttribute(token.cdn, "src")}${addAttribute(token.fallback, "data-fallback")}${addAttribute(token.name, "alt")} loading="lazy" data-astro-cid-3xepjyex> <span class="token__name" data-astro-cid-3xepjyex>${token.name}</span> <span class="token__id" data-astro-cid-3xepjyex>#${token.tokenId.slice(0, 8)}…</span> </a>`)} </section> <section class="story" data-astro-cid-3xepjyex> <article data-astro-cid-3xepjyex> <p class="kicker" data-astro-cid-3xepjyex>ABOUT</p> <h2 data-astro-cid-3xepjyex>Skeletons as a common language.</h2> <p data-astro-cid-3xepjyex>
Randomly common skeles are randomly generated skeleton GIFs by John
          Karel, coded through objkt and minted on Tezos. The collection has the
          feeling of a tiny toybox with a very large population: every skele
          shares the same dance, but the emoji anatomy turns each one into a
          small character read.
</p> <p data-astro-cid-3xepjyex>
PointCast keeps this page as a clean front door for humans and agents:
          one contract, current market stats, a fast visual sample, and direct
          links back to the canonical marketplaces and indexers.
</p> </article> <article class="traits" data-astro-cid-3xepjyex> <p class="kicker" data-astro-cid-3xepjyex>ANATOMY</p> <h2 data-astro-cid-3xepjyex>Eight traits, infinite attitude.</h2> <div class="trait-grid" data-astro-cid-3xepjyex> ${traitAnatomy.map((trait) => renderTemplate`<div class="trait" data-astro-cid-3xepjyex> <span data-astro-cid-3xepjyex>${trait.name}</span> <strong data-astro-cid-3xepjyex>${trait.examples}</strong> </div>`)} </div> </article> </section> <section class="agent-strip" aria-label="Machine-readable resources" data-astro-cid-3xepjyex> <p class="kicker" data-astro-cid-3xepjyex>MACHINE-READABLE</p> <ul data-astro-cid-3xepjyex> <li data-astro-cid-3xepjyex><a${addAttribute(TZKT_TOKENS_API, "href")} data-astro-cid-3xepjyex>TzKT token API</a></li> <li data-astro-cid-3xepjyex><a${addAttribute(OBJKT_COLLECTION_URL, "href")} data-astro-cid-3xepjyex>objkt collection</a></li> <li data-astro-cid-3xepjyex><a${addAttribute(TZKT_CONTRACT_URL, "href")} data-astro-cid-3xepjyex>contract on TzKT</a></li> <li data-astro-cid-3xepjyex><a href="/for-agents" data-astro-cid-3xepjyex>/for-agents</a></li> </ul> </section> </main> ` })} ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/rcs.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/rcs.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/rcs.astro";
const $$url = "/rcs";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Rcs,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
