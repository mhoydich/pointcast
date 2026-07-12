import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';
import { $ as $$WalletConnect } from './WalletConnect_C-fpO83k.mjs';
import { m as market } from './market_tuD5rgVB.mjs';

async function getStaticPaths() {
  const { tokens } = market;
  return tokens.map((t) => ({ params: { tokenId: t.tokenId } }));
}
const $$tokenId = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$tokenId;
  const { tokenId } = Astro2.params;
  const token = market.tokens.find((t) => t.tokenId === tokenId);
  if (!token) {
    return Astro2.redirect("/collect");
  }
  function fmtPrice(xtz) {
    if (xtz === null) return "—";
    if (xtz === 0) return "free mint";
    if (xtz < 1) return `${xtz.toFixed(2)} ꜩ`;
    return `${xtz.toFixed(1)} ꜩ`;
  }
  const mintedAt = token.mintedAt ? new Date(token.mintedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }) : "";
  const description = token.description || "";
  const siteDesc = `${token.name} · ${token.supply} editions on Tezos · collect on PointCast`;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": `${token.name} · Collect`, "description": siteDesc, "image": token.imageDisplay, "data-astro-cid-vlmtjpyv": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-[60rem] mx-auto px-4 pt-6 md:pt-10 pb-20" data-astro-cid-vlmtjpyv> <!-- Masthead band --> <div class="-mx-4 px-4 py-2.5 border-y border-rule/50 flex items-center justify-between gap-3 mb-6" data-astro-cid-vlmtjpyv> <div class="flex items-center gap-3" data-astro-cid-vlmtjpyv> <a href="/" class="font-mono text-sm md:text-base font-bold tracking-[0.28em] uppercase text-ink leading-none hover:text-warm transition-colors no-underline" data-astro-cid-vlmtjpyv>
PointCast
</a> <a href="/collect" class="font-mono text-[0.58rem] tracking-[0.22em] uppercase text-warm hover:underline" data-astro-cid-vlmtjpyv>
&larr; / collect
</a> </div> ${renderComponent($$result2, "WalletConnect", $$WalletConnect, { "data-astro-cid-vlmtjpyv": true })} </div> <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-start" data-astro-cid-vlmtjpyv> <!-- Image --> <figure class="rounded-xl overflow-hidden border border-rule/30 bg-card" data-astro-cid-vlmtjpyv> <img id="token-hero"${addAttribute(token.imageDisplay, "src")}${addAttribute(token.name, "alt")} class="w-full h-auto block" loading="eager"${addAttribute(token.imageDisplay.replace("/display", "/artifact"), "data-fallback")} data-astro-cid-vlmtjpyv> </figure> <!-- Details --> <div data-astro-cid-vlmtjpyv> <p class="font-mono text-[0.54rem] tracking-[0.18em] uppercase text-warm/80 mb-2" data-astro-cid-vlmtjpyv>
PointCast · token #${token.tokenId} </p> <h1 class="font-serif italic text-[2rem] md:text-[2.4rem] text-ink font-medium leading-[1.05] mb-3" data-astro-cid-vlmtjpyv> ${token.name} </h1> ${description && renderTemplate`<p class="font-serif italic text-[1rem] text-ink-soft/85 leading-relaxed mb-6" data-astro-cid-vlmtjpyv> ${description} </p>`} <!-- Stats grid --> <div class="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-rule/40" data-astro-cid-vlmtjpyv> <div data-astro-cid-vlmtjpyv> <p class="font-mono text-[0.52rem] tracking-[0.18em] uppercase text-ink-soft/55 mb-1" data-astro-cid-vlmtjpyv>Supply</p> <p class="font-mono text-[0.95rem] text-ink" data-astro-cid-vlmtjpyv>${token.supply.toLocaleString()} editions</p> </div> <div data-astro-cid-vlmtjpyv> <p class="font-mono text-[0.52rem] tracking-[0.18em] uppercase text-ink-soft/55 mb-1" data-astro-cid-vlmtjpyv>Price</p> <p class="font-mono text-[0.95rem] text-warm" data-astro-cid-vlmtjpyv>${fmtPrice(token.priceXtz)}</p> </div> <div data-astro-cid-vlmtjpyv> <p class="font-mono text-[0.52rem] tracking-[0.18em] uppercase text-ink-soft/55 mb-1" data-astro-cid-vlmtjpyv>Status</p> <p class="font-mono text-[0.78rem] text-ink" data-astro-cid-vlmtjpyv> ${token.listed ? "listed · live" : "unlisted"} </p> </div> ${mintedAt && renderTemplate`<div data-astro-cid-vlmtjpyv> <p class="font-mono text-[0.52rem] tracking-[0.18em] uppercase text-ink-soft/55 mb-1" data-astro-cid-vlmtjpyv>Minted</p> <p class="font-mono text-[0.78rem] text-ink" data-astro-cid-vlmtjpyv>${mintedAt}</p> </div>`} ${token.artist?.alias && renderTemplate`<div class="col-span-2" data-astro-cid-vlmtjpyv> <p class="font-mono text-[0.52rem] tracking-[0.18em] uppercase text-ink-soft/55 mb-1" data-astro-cid-vlmtjpyv>Artist</p> <p class="font-mono text-[0.78rem] text-ink" data-astro-cid-vlmtjpyv> ${token.artist.alias} ${token.artist.address && renderTemplate`<span class="text-ink-soft/60 ml-2 text-[0.7rem]" data-astro-cid-vlmtjpyv>
(${token.artist.address.slice(0, 6)}…${token.artist.address.slice(-4)})
</span>`} </p> </div>`} </div> <!-- Collect flow --> <div class="space-y-3 mb-4" data-astro-cid-vlmtjpyv> ${token.listed ? renderTemplate`<button id="collect-btn" type="button"${addAttribute(token.objktUrl, "data-objkt-url")}${addAttribute(token.tokenId, "data-token-id")}${addAttribute(token.askId ?? "", "data-ask-id")}${addAttribute(token.marketplaceContract ?? "", "data-marketplace")}${addAttribute(token.priceMutez ?? 0, "data-price-mutez")}${addAttribute(token.seller ?? "", "data-seller")} class="w-full inline-flex items-center justify-center px-5 py-3 rounded-md bg-ink text-paper font-mono text-[0.66rem] tracking-[0.16em] uppercase hover:bg-warm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait" data-astro-cid-vlmtjpyv> <span id="collect-btn-label" data-astro-cid-vlmtjpyv>Collect on Tezos &rarr;</span> </button>` : renderTemplate`<div class="w-full px-5 py-3 rounded-md bg-card border border-rule/40 text-center" data-astro-cid-vlmtjpyv> <p class="font-mono text-[0.62rem] tracking-[0.16em] uppercase text-ink-soft/70" data-astro-cid-vlmtjpyv>
not listed yet
</p> <p class="font-mono text-[0.5rem] tracking-[0.16em] uppercase text-ink-soft/50 mt-1" data-astro-cid-vlmtjpyv>
this one's off the market &mdash; see below for others
</p> </div>`} <!-- Transaction status line — fills in while signing + confirming --> <p id="collect-status" class="font-mono text-[0.56rem] tracking-[0.14em] uppercase text-ink-soft/70 min-h-[0.9rem]" role="status" aria-live="polite" data-astro-cid-vlmtjpyv></p> <a${addAttribute(token.objktUrl, "href")} target="_blank" rel="noopener" class="w-full inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-card border border-rule/40 text-ink-soft hover:border-warm hover:text-warm font-mono text-[0.62rem] tracking-[0.14em] uppercase transition-colors" data-astro-cid-vlmtjpyv>
View on objkt &nearr;
</a> </div> <!-- Wallet helper --> <p class="font-mono text-[0.52rem] tracking-[0.16em] uppercase text-ink-soft/50 leading-relaxed" data-astro-cid-vlmtjpyv>
no wallet yet? get
<a href="https://wallet.kukai.app" target="_blank" rel="noopener" class="text-warm hover:underline" data-astro-cid-vlmtjpyv>kukai</a>
&middot; fund it with a few ꜩ &middot; you're good.
</p> </div> </div> <!-- Other tokens --> <section class="mt-16 pt-8 border-t border-rule/40" data-astro-cid-vlmtjpyv> <h2 class="font-mono text-[0.58rem] tracking-[0.22em] uppercase text-ink-soft/60 mb-4" data-astro-cid-vlmtjpyv>
more on the contract
</h2> <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" data-astro-cid-vlmtjpyv> ${market.tokens.filter((t) => t.tokenId !== token.tokenId).slice(0, 8).map((t) => renderTemplate`<a${addAttribute(`/collect/${t.tokenId}`, "href")} class="group flex flex-col rounded-lg overflow-hidden border border-rule/30 hover:border-warm/40 transition-colors" data-astro-cid-vlmtjpyv> <div class="aspect-square bg-card overflow-hidden" data-astro-cid-vlmtjpyv> <img${addAttribute(t.imageThumb || t.imageDisplay, "src")}${addAttribute(t.name, "alt")} class="w-full h-full object-cover token-img-tile" loading="lazy"${addAttribute(t.imageDisplay.replace("/display", "/artifact"), "data-fallback")} data-astro-cid-vlmtjpyv> </div> <div class="p-2" data-astro-cid-vlmtjpyv> <p class="font-serif italic text-[0.78rem] text-ink leading-tight group-hover:text-warm transition-colors line-clamp-1" data-astro-cid-vlmtjpyv> ${t.name} </p> <p class="font-mono text-[0.48rem] tracking-[0.16em] uppercase text-ink-soft/55 mt-0.5" data-astro-cid-vlmtjpyv>
#${t.tokenId} </p> </div> </a>`)} </div> </section> </div> ` })} ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/collect/[tokenId].astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/collect/[tokenId].astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/collect/[tokenId].astro";
const $$url = "/collect/[tokenId]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$tokenId,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
