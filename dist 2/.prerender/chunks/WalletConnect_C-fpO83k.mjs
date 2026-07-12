import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { m as maybeRenderHead, a as renderTemplate } from './prerender_CmTjnOuJ.mjs';
import 'clsx';
import { r as renderScript } from './script_AUITBxpA.mjs';

const $$WalletConnect = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div id="wallet-connect" class="relative inline-flex"> <button id="wallet-connect-btn" type="button" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-rule/50 bg-card/80 hover:border-warm hover:bg-card transition-colors font-mono text-[0.58rem] tracking-[0.16em] uppercase text-ink-soft hover:text-ink cursor-pointer" aria-haspopup="menu" aria-expanded="false"> <svg id="wallet-connect-icon" class="w-3 h-3 text-warm" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"> <circle cx="6" cy="6" r="3"></circle> </svg> <span id="wallet-connect-label">connect wallet</span> </button> <div id="wallet-menu" class="hidden absolute top-full right-0 mt-2 w-64 bg-paper border border-rule rounded-lg shadow-xl z-50 overflow-hidden" role="menu"> <!-- When disconnected: list of wallets --> <div id="wallet-menu-connect" class="divide-y divide-rule/30"> <button data-wallet="kukai" type="button" class="w-full flex items-start gap-3 p-3 hover:bg-card transition-colors text-left cursor-pointer" role="menuitem"> <span class="font-mono text-[0.58rem] tracking-[0.16em] uppercase text-warm mt-0.5 shrink-0">tz</span> <div class="flex-1 min-w-0"> <p class="text-[0.9rem] text-ink font-medium leading-tight">Kukai</p> <p class="font-mono text-[0.5rem] tracking-[0.16em] uppercase text-ink-soft/60 mt-0.5">Tezos · browser wallet</p> </div> </button> <!-- Tezos-only for now. MetaMask + Phantom hidden per diagnosis in
           docs/wallet-metamask-diagnosis.md (Manus task 9MSNEGn8CCtFzsYG8UsmUt).
           The window.ethereum path is brittle on mobile Safari and WalletConnect
           v2 deep-links drop silently; all current PointCast tokens are on Tezos,
           so surfacing EVM/Solana options creates broken paths without utility.
           Re-enable when Zora (Base) integration is scoped with Wagmi or the
           Zora SDK. The handler code below (data-wallet cases) is preserved so
           uncomment + deploy flips them back on. --> <div class="p-3 bg-card/60 border-b border-rule/30"> <p class="font-mono text-[0.5rem] tracking-[0.18em] uppercase text-ink-soft/60 mb-1">Other chains</p> <p class="text-[0.78rem] text-ink-soft leading-snug italic">
Tezos only for now &mdash; Ethereum + Solana arrive with the Zora drop.
</p> </div> <!--
      <button
        data-wallet="metamask"
        type="button"
        class="w-full flex items-start gap-3 p-3 hover:bg-card transition-colors text-left cursor-pointer"
        role="menuitem"
      >
        <span class="font-mono text-[0.58rem] tracking-[0.16em] uppercase text-warm mt-0.5 shrink-0">eth</span>
        <div class="flex-1 min-w-0">
          <p class="text-[0.9rem] text-ink font-medium leading-tight">MetaMask</p>
          <p class="font-mono text-[0.5rem] tracking-[0.16em] uppercase text-ink-soft/60 mt-0.5">Ethereum · Base · L2s</p>
        </div>
      </button>
      <button
        data-wallet="phantom"
        type="button"
        class="w-full flex items-start gap-3 p-3 hover:bg-card transition-colors text-left cursor-pointer"
        role="menuitem"
      >
        <span class="font-mono text-[0.58rem] tracking-[0.16em] uppercase text-warm mt-0.5 shrink-0">sol</span>
        <div class="flex-1 min-w-0">
          <p class="text-[0.9rem] text-ink font-medium leading-tight">Phantom</p>
          <p class="font-mono text-[0.5rem] tracking-[0.16em] uppercase text-ink-soft/60 mt-0.5">Solana</p>
        </div>
      </button>
      --> </div> <!-- When connected: shows address + disconnect --> <div id="wallet-menu-connected" class="hidden p-3"> <p class="font-mono text-[0.5rem] tracking-[0.18em] uppercase text-ink-soft/60">connected to</p> <p id="wallet-menu-chain" class="font-mono text-[0.58rem] tracking-[0.16em] uppercase text-warm mt-0.5">—</p> <p id="wallet-menu-address" class="font-mono text-[0.7rem] text-ink mt-2 break-all leading-snug">—</p> <button id="wallet-disconnect" type="button" class="mt-3 w-full px-3 py-2 rounded-md bg-card border border-rule/40 hover:border-warm text-ink-soft hover:text-warm font-mono text-[0.58rem] tracking-[0.14em] uppercase cursor-pointer transition-colors">
Disconnect
</button> </div> </div> </div> ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/WalletConnect.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/WalletConnect.astro", void 0);

export { $$WalletConnect as $ };
