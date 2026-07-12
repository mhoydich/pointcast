import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { m as maybeRenderHead, b as addAttribute, a as renderTemplate } from './prerender_CmTjnOuJ.mjs';
import 'clsx';
import { r as renderScript } from './script_AUITBxpA.mjs';

const $$MintButton = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$MintButton;
  const { contract, tokenId, priceMutez = 0, kind = "mint", label } = Astro2.props;
  const displayLabel = label ?? (kind === "faucet" ? "Claim →" : priceMutez > 0 ? `Mint · ${(priceMutez / 1e6).toFixed(2)} ꜩ →` : "Mint → free");
  return renderTemplate`${maybeRenderHead()}<div class="mint-wrap"${addAttribute(contract, "data-contract")}${addAttribute(tokenId, "data-token-id")}${addAttribute(priceMutez, "data-price-mutez")}${addAttribute(kind, "data-kind")} data-astro-cid-jl2lsl7j> <button type="button" class="mint-btn" data-mint-button data-astro-cid-jl2lsl7j> <span class="mint-btn__label" data-astro-cid-jl2lsl7j>${displayLabel}</span> </button> <p class="mint-status" role="status" aria-live="polite" data-astro-cid-jl2lsl7j></p> </div> ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/MintButton.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/MintButton.astro", void 0);

export { $$MintButton as $ };
