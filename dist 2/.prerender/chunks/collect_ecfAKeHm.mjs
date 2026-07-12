import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';
import { $ as $$WalletConnect } from './WalletConnect_C-fpO83k.mjs';
import { m as market } from './market_tuD5rgVB.mjs';

const $$Collect = createComponent(($$result, $$props, $$slots) => {
  const { tokens, updatedAt, count } = market;
  const listedTokens = tokens.filter((t) => t.listed);
  const listedCount = listedTokens.length;
  function fmtPrice(xtz) {
    if (xtz === null) return "";
    if (xtz === 0) return "free";
    if (xtz < 1) return `${xtz.toFixed(2)} ꜩ`;
    return `${xtz.toFixed(1)} ꜩ`;
  }
  function fmtSupply(s) {
    if (s >= 1e3) return `${(s / 1e3).toFixed(s % 1e3 === 0 ? 0 : 1)}k`;
    return String(s);
  }
  const updatedStr = new Date(updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).toUpperCase();
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Collect", "description": "Collect PointCast tokens on Tezos. CC0-flavored editorial art, broadcast cards, and visit nouns — mint directly with your Kukai wallet.", "image": "/images/og-collect.png", "data-astro-cid-ggobg22y": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-[60rem] mx-auto px-4 pt-6 md:pt-10 pb-20" data-astro-cid-ggobg22y> <!-- Masthead band — same treatment as homepage, plus wallet --> <div class="-mx-4 px-4 py-2.5 border-y border-rule/50 flex items-center justify-between gap-3 mb-4" data-astro-cid-ggobg22y> <div class="flex items-center gap-3" data-astro-cid-ggobg22y> <a href="/" class="font-mono text-sm md:text-base font-bold tracking-[0.28em] uppercase text-ink leading-none hover:text-warm transition-colors no-underline" data-astro-cid-ggobg22y>
PointCast
</a> <span class="font-mono text-[0.58rem] tracking-[0.22em] uppercase text-warm" data-astro-cid-ggobg22y>/ collect</span> </div> ${renderComponent($$result2, "WalletConnect", $$WalletConnect, { "data-astro-cid-ggobg22y": true })} </div> <!-- Page header --> <header class="mb-10" data-astro-cid-ggobg22y> <div class="flex flex-wrap items-end justify-between gap-4 mb-4" data-astro-cid-ggobg22y> <div data-astro-cid-ggobg22y> <h1 class="font-serif italic text-[2.2rem] md:text-[2.8rem] text-ink font-medium leading-[1.05] mb-2" data-astro-cid-ggobg22y>
Collect
</h1> <p class="text-[0.95rem] text-ink/70 leading-relaxed max-w-[36rem]" data-astro-cid-ggobg22y>
Editorial art on Tezos. Photographs, writing, signature moments.
            All minted to one FA2 contract — connect a Kukai wallet and the
            mint signs on-chain in a few seconds. Gas: fractions of a tez.
</p> </div> <div class="font-mono text-[0.54rem] tracking-[0.18em] uppercase text-ink-soft/60 leading-relaxed text-right shrink-0" data-astro-cid-ggobg22y> <p data-astro-cid-ggobg22y>${count} tokens · ${listedCount} listed</p> <p class="mt-1" data-astro-cid-ggobg22y>updated ${updatedStr}</p> </div> </div> <!-- Kukai helper line for first-timers --> <p class="font-mono text-[0.54rem] tracking-[0.16em] uppercase text-ink-soft/50 border-t border-rule/30 pt-4" data-astro-cid-ggobg22y>
new to tezos? grab
<a href="https://wallet.kukai.app" target="_blank" rel="noopener" class="text-warm hover:underline" data-astro-cid-ggobg22y>kukai wallet</a>
&middot; fund it with ~5 ꜩ via any exchange (kraken, bitvavo, etc.)
        &middot; you're in.
</p> </header> <!-- Token grid --> <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" data-astro-cid-ggobg22y> ${tokens.map((t) => renderTemplate`<a${addAttribute(`/collect/${t.tokenId}`, "href")} class="group flex flex-col rounded-xl overflow-hidden border border-rule/30 bg-card hover:bg-card-hover hover:border-warm/40 transition-colors" data-astro-cid-ggobg22y> <div class="aspect-square bg-paper overflow-hidden relative" data-astro-cid-ggobg22y> <img${addAttribute(t.imageThumb || t.imageDisplay, "src")}${addAttribute(t.name, "alt")} class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 token-img" loading="lazy"${addAttribute(t.imageDisplay.replace("/display", "/artifact"), "data-fallback")} data-astro-cid-ggobg22y> <!-- Subtle inset rule so light-on-paper artworks have a visible frame --> <div class="absolute inset-0 ring-1 ring-inset ring-rule/50 pointer-events-none" data-astro-cid-ggobg22y></div> </div> <div class="p-4" data-astro-cid-ggobg22y> <div class="flex items-start justify-between gap-3 mb-1" data-astro-cid-ggobg22y> <h3 class="font-serif italic text-[1.05rem] text-ink leading-tight group-hover:text-warm transition-colors" data-astro-cid-ggobg22y> ${t.name} </h3> ${t.listed && t.priceXtz !== null && renderTemplate`<span class="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-warm shrink-0 pt-1" data-astro-cid-ggobg22y> ${fmtPrice(t.priceXtz)} </span>`} </div> <p class="font-mono text-[0.52rem] tracking-[0.16em] uppercase text-ink-soft/60 mb-2" data-astro-cid-ggobg22y>
#${t.tokenId} &middot; ${fmtSupply(t.supply)} editions
${t.listed ? " · listed" : " · unlisted"} </p> ${t.description && renderTemplate`<p class="text-[0.85rem] text-ink-soft/80 leading-snug line-clamp-2" data-astro-cid-ggobg22y> ${t.description} </p>`} </div> </a>`)} </div> <!-- Contract footer --> <footer class="mt-16 pt-6 border-t border-rule/40" data-astro-cid-ggobg22y> <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-[0.54rem] tracking-[0.16em] uppercase text-ink-soft/50" data-astro-cid-ggobg22y> <div data-astro-cid-ggobg22y>
contract:
<a${addAttribute(`https://tzkt.io/${market.contract}/operations`, "href")} target="_blank" rel="noopener" class="hover:text-warm transition-colors break-all" data-astro-cid-ggobg22y> ${market.contract} </a> </div> <a href="/" class="hover:text-warm transition-colors" data-astro-cid-ggobg22y>&larr; back to broadcast</a> </div> </footer> </div> ` })} ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/collect.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/collect.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/collect.astro";
const $$url = "/collect";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Collect,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
