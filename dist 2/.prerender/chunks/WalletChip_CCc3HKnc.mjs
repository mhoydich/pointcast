import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { m as maybeRenderHead, a as renderTemplate } from './prerender_CmTjnOuJ.mjs';
import 'clsx';
import { r as renderScript } from './script_AUITBxpA.mjs';

const $$WalletChip = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="wallet-chip" id="wallet-chip" data-astro-cid-lwhs2ra5> <button type="button" class="wallet-chip__btn" id="wallet-chip-btn" aria-haspopup="menu" aria-expanded="false" aria-label="Connect wallet" data-astro-cid-lwhs2ra5> <span class="wallet-chip__dot" aria-hidden="true" data-astro-cid-lwhs2ra5></span> <span class="wallet-chip__label" id="wallet-chip-label" data-astro-cid-lwhs2ra5>connect wallet →</span> </button> <div class="wallet-chip__menu" id="wallet-chip-menu" role="menu" hidden data-astro-cid-lwhs2ra5> <!-- disconnected state --> <div class="wallet-chip__panel" id="wallet-chip-connect-panel" data-astro-cid-lwhs2ra5> <button type="button" class="wallet-chip__connect" id="wallet-chip-connect" data-astro-cid-lwhs2ra5>
Open Beacon picker →
</button> <p class="wallet-chip__footnote" data-astro-cid-lwhs2ra5>Connect any Tezos wallet. Social sign-in (Google / Apple / etc.) is available inside Kukai.</p> </div> <!-- connected state --> <div class="wallet-chip__panel" id="wallet-chip-connected-panel" hidden data-astro-cid-lwhs2ra5> <p class="wallet-chip__section" data-astro-cid-lwhs2ra5>active</p> <p class="wallet-chip__kv" data-astro-cid-lwhs2ra5><span data-astro-cid-lwhs2ra5>addr</span><b id="wallet-chip-addr" data-astro-cid-lwhs2ra5>—</b></p> <p class="wallet-chip__kv" data-astro-cid-lwhs2ra5><span data-astro-cid-lwhs2ra5>provider</span><b id="wallet-chip-prov" data-astro-cid-lwhs2ra5>—</b></p> <p class="wallet-chip__kv" data-astro-cid-lwhs2ra5><span data-astro-cid-lwhs2ra5>balance</span><b id="wallet-chip-balance" data-astro-cid-lwhs2ra5>—</b></p> <p class="wallet-chip__kv" data-astro-cid-lwhs2ra5><span data-astro-cid-lwhs2ra5>nfts</span><b id="wallet-chip-nfts" data-astro-cid-lwhs2ra5>—</b></p> <p class="wallet-chip__section" id="wallet-chip-others-label" hidden data-astro-cid-lwhs2ra5>remembered (<span id="wallet-chip-others-count" data-astro-cid-lwhs2ra5>0</span>)</p> <ul class="wallet-chip__others" id="wallet-chip-others" data-astro-cid-lwhs2ra5></ul> <a class="wallet-chip__profile" href="/profile" data-astro-cid-lwhs2ra5>View profile →</a> <button type="button" class="wallet-chip__add" id="wallet-chip-add" data-astro-cid-lwhs2ra5>
Connect another wallet →
</button> <button type="button" class="wallet-chip__disconnect" id="wallet-chip-disconnect" data-astro-cid-lwhs2ra5>
Disconnect active
</button> </div> </div> </div> ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/WalletChip.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/WalletChip.astro", void 0);

export { $$WalletChip as $ };
