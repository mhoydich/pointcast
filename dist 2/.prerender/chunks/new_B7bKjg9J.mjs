import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';
import { $ as $$WalletConnect } from './WalletConnect_C-fpO83k.mjs';
import contracts from './contracts_B1zhgPPX.mjs';

const $$New = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$New;
  const slugs = Object.keys(contracts).filter((k) => !k.startsWith("_"));
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Publisher · Admin · Deploy", "description": "PointCast contract originator" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-[52rem] mx-auto px-4 pt-6 md:pt-10 pb-20"> <!-- Masthead band --> <div class="-mx-4 px-4 py-2.5 border-y border-rule/50 flex items-center justify-between gap-3 mb-6"> <div class="flex items-center gap-3"> <a href="/" class="font-mono text-sm md:text-base font-bold tracking-[0.28em] uppercase text-ink leading-none hover:text-warm transition-colors no-underline">
PointCast
</a> <a href="/admin/deploy" class="font-mono text-[0.58rem] tracking-[0.22em] uppercase text-warm hover:text-ink transition-colors no-underline">
/ admin / deploy /
</a> <span class="font-mono text-[0.58rem] tracking-[0.22em] uppercase text-ink-soft/70">
new
</span> </div> ${renderComponent($$result2, "WalletConnect", $$WalletConnect, {})} </div> <!-- Header --> <header class="mb-8"> <p class="font-mono text-[0.54rem] tracking-[0.22em] uppercase text-warm mb-2">
admin · publisher
</p> <h1 class="font-serif italic text-[1.8rem] md:text-[2.2rem] text-ink font-medium leading-[1.1] mb-3">
Originate a contract
</h1> <p class="text-[0.95rem] text-ink/70 leading-relaxed">
Paste compiled Michelson + initial storage below. Pick a network.
        Click <strong>Originate</strong>. Kukai pops a signing prompt; the
        origination lands on-chain a few seconds later and the contract
        address appears here. The admin field is auto-patched to your
        connected wallet before signing &mdash; no orphan originations.
</p> </header> <!-- Prefill-aware callouts. Hidden by default; the autoPrefill() effect
         unhides the relevant one when ?prefill=marketplace etc. is in the URL. --> <aside id="callout-marketplace" class="mb-6 p-4 border-l-[5px] border-l-warm bg-warm/5 rounded-md" hidden> <p class="font-mono text-[0.58rem] tracking-[0.22em] uppercase text-warm mb-2">
marketplace · v4 · ready to compile
</p> <h2 class="font-serif italic text-[1.15rem] text-ink leading-tight mb-2">
Drive SmartPy IDE first, then return here.
</h2> <ol class="text-[0.86rem] text-ink/80 leading-relaxed space-y-1 list-decimal list-inside mb-3"> <li>Open <a class="text-accent underline" href="https://smartpy.io/ide" target="_blank" rel="noopener">smartpy.io/ide</a></li> <li>Paste <code class="font-mono text-[0.78rem]">contracts/v2/marketplace.py</code> (v4 source already on disk)</li> <li>Click <strong>Run</strong> — verify all 7 tests pass</li> <li>Click <strong>Deploy contract</strong> &rarr; <strong>Continue</strong> (populates the /origination tab)</li> <li>Download <code class="font-mono text-[0.78rem]">step_*_cont_0_contract.json</code> + <code class="font-mono text-[0.78rem]">step_*_cont_0_storage.json</code></li> <li>Stage at <code class="font-mono text-[0.78rem]">${`public/admin/_artifacts/marketplace-{contract,storage}.json`}</code></li> <li>Reload this page &mdash; the layout safety check should go <span class="text-live">green ✓ canonical</span> before you can sign</li> </ol> <p class="font-mono text-[0.66rem] text-ink-soft/80 leading-relaxed">
runbook: <a class="text-accent underline" href="https://github.com/mhoydich/pointcast/blob/main/docs/plans/2026-04-29-marketplace-v4-runbook.md" target="_blank" rel="noopener">docs/plans/2026-04-29-marketplace-v4-runbook.md</a> · post-sign: paste KT1 + opHash into <code>contracts.json</code>, move v3 to <code>_legacy_marketplace</code>, bump <code>version: 4</code>.
</p> </aside> <aside id="callout-window-snapshots" class="mb-6 p-4 border-l-[5px] border-l-blue bg-card/40 rounded-md" hidden> <p class="font-mono text-[0.58rem] tracking-[0.22em] uppercase text-blue mb-2">
window snapshots · ready to compile
</p> <h2 class="font-serif italic text-[1.15rem] text-ink leading-tight mb-2">
Three painted-interior FA2s — same SmartPy IDE flow.
</h2> <ol class="text-[0.86rem] text-ink/80 leading-relaxed space-y-1 list-decimal list-inside mb-3"> <li>Paste <code class="font-mono text-[0.78rem]">contracts/v2/window_snapshots_fa2.py</code> in smartpy.io/ide</li> <li>Run + Deploy contract &rarr; Continue</li> <li>Stage artifacts at <code class="font-mono text-[0.78rem]">${`public/admin/_artifacts/window_snapshots-{contract,storage}.json`}</code></li> <li>Sign here &mdash; admin auto-patches to your wallet</li> <li>Post-sign: paste KT1 into <code>contracts.json</code>, run <code>register_tokens(...)</code> + <code>set_metadata_base_uri</code> admin ops</li> </ol> <p class="font-mono text-[0.66rem] text-ink-soft/80 leading-relaxed">
3 paintings ready in <code>public/images/window-snapshots/</code> · metadata endpoint at <code>functions/api/tezos-metadata/window-snapshots/[tokenId].ts</code> </p> </aside> <!-- Chain selector (Tezos for v1 — ETH/Sol surface here when ready) --> <section class="mb-5"> <p class="font-mono text-[0.54rem] tracking-[0.2em] uppercase text-ink-soft/60 mb-2">
chain
</p> <div class="flex gap-2"> <label class="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-md border border-warm bg-warm/10"> <input type="radio" name="chain" value="tezos" checked class="accent-warm"> <span class="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-ink">tezos</span> </label> <label class="flex items-center gap-2 px-3 py-1.5 rounded-md border border-rule/30 bg-card/40 opacity-50 cursor-not-allowed"> <input type="radio" name="chain" value="eth" disabled class="accent-warm"> <span class="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-ink-soft/60">
ethereum <span class="text-ink-soft/40">(soon)</span> </span> </label> <label class="flex items-center gap-2 px-3 py-1.5 rounded-md border border-rule/30 bg-card/40 opacity-50 cursor-not-allowed"> <input type="radio" name="chain" value="solana" disabled class="accent-warm"> <span class="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-ink-soft/60">
solana <span class="text-ink-soft/40">(soon)</span> </span> </label> </div> </section> <!-- Network selector --> <section class="mb-5"> <p class="font-mono text-[0.54rem] tracking-[0.2em] uppercase text-ink-soft/60 mb-2">
network
</p> <div class="flex gap-3" role="radiogroup"> <label class="flex items-center gap-2 cursor-pointer"> <input type="radio" name="network" value="shadownet" checked class="accent-warm"> <span class="font-mono text-[0.68rem] tracking-[0.14em] uppercase">
Shadownet <span class="text-ink-soft/50">(testnet · free faucet)</span> </span> </label> <label class="flex items-center gap-2 cursor-pointer"> <input type="radio" name="network" value="mainnet" class="accent-warm"> <span class="font-mono text-[0.68rem] tracking-[0.14em] uppercase">
Mainnet <span class="text-ink-soft/50">(real ꜩ · production)</span> </span> </label> </div> </section> <!-- Prefill picker --> <section class="mb-5 p-3 rounded-md border border-rule/30 bg-card/40"> <div class="flex items-center justify-between mb-2 gap-2"> <p class="font-mono text-[0.54rem] tracking-[0.2em] uppercase text-ink-soft/60">
quick load
</p> <p id="prefill-status" class="font-mono text-[0.5rem] tracking-[0.14em] uppercase text-ink-soft/50">
&mdash;
</p> </div> <div class="flex flex-wrap gap-1.5"> ${slugs.map((slug) => renderTemplate`<button type="button"${addAttribute(slug, "data-prefill")} class="prefill-btn inline-flex items-center px-2 py-1 rounded-sm bg-paper border border-rule/40 text-ink-soft font-mono text-[0.55rem] tracking-[0.14em] uppercase hover:border-warm hover:text-warm transition-colors cursor-pointer"> ${slug.replace(/_/g, " ")} </button>`)} </div> </section> <!-- Code textarea --> <section class="mb-5"> <label for="code-input" class="flex items-center justify-between mb-2"> <span class="font-mono text-[0.54rem] tracking-[0.2em] uppercase text-ink-soft/60">
michelson code <span class="text-warm">(json array OR michelson text — auto-detect)</span> </span> <span id="code-stats" class="font-mono text-[0.5rem] tracking-[0.16em] uppercase text-ink-soft/40">
0 B
</span> </label> <textarea id="code-input" rows="6" placeholder="[ { &quot;prim&quot;: &quot;parameter&quot;, &quot;args&quot;: [...] }, { &quot;prim&quot;: &quot;storage&quot;, ... }, { &quot;prim&quot;: &quot;code&quot;, ... } ]" class="w-full font-mono text-[0.7rem] p-3 rounded-md border border-rule/40 bg-card/60 text-ink focus:border-warm focus:outline-none"></textarea> </section> <!-- Storage textarea --> <section class="mb-5"> <label for="storage-input" class="flex items-center justify-between mb-2"> <span class="font-mono text-[0.54rem] tracking-[0.2em] uppercase text-ink-soft/60">
initial storage
<span class="text-warm">(json or michelson — admin field auto-patched)</span> </span> <span id="storage-stats" class="font-mono text-[0.5rem] tracking-[0.16em] uppercase text-ink-soft/40">
0 B
</span> </label> <textarea id="storage-input" rows="5" placeholder="{ &quot;prim&quot;: &quot;Pair&quot;, &quot;args&quot;: [ ... ] }" class="w-full font-mono text-[0.7rem] p-3 rounded-md border border-rule/40 bg-card/60 text-ink focus:border-warm focus:outline-none"></textarea> </section> <!-- Admin preview --> <section class="mb-5 p-3 rounded-md border border-rule/30 bg-card/40"> <p class="font-mono text-[0.54rem] tracking-[0.2em] uppercase text-ink-soft/60 mb-1">
admin field (will be patched on originate)
</p> <p id="admin-preview" class="font-mono text-[0.65rem] text-ink-soft break-all">
connect a wallet to preview &mdash; the storage's first <code class="bg-paper px-1 rounded text-warm">tz</code> address is replaced with your connected pkh.
</p> </section> <!-- FA2 transfer layout pre-flight check --> <!-- Walks the parsed Michelson code looking for every FA2-shaped transfer
         parameter type — both the contract's own %transfer entrypoint (if it's
         an FA2) and any CONTRACT %transfer dispatch instruction (if it's a
         marketplace calling into someone else's FA2). Verifies the inner record
         field order is canonical TZIP-12: (to_, token_id, amount).
         If any shape is alphabetical (amount, to_, token_id), the section turns
         red and the originate button is disabled — this is the safety net that
         would have caught both v1 (KT1SLFv2u…) and v2 (KT1ABfp7c…) marketplace
         orphans before they were signed. --> <section id="fa2-layout-check" class="mb-5 p-3 rounded-md border border-rule/30 bg-card/40 hidden" data-status=""> <p class="font-mono text-[0.54rem] tracking-[0.2em] uppercase mb-1" id="fa2-layout-title">
fa2 transfer dispatch layout
</p> <p id="fa2-layout-detail" class="font-mono text-[0.65rem] break-all">—</p> </section> <!-- Originate button + status --> <section class="mb-8"> <button id="deploy-btn" type="button" class="w-full inline-flex items-center justify-center px-5 py-3 rounded-md bg-ink text-paper font-mono text-[0.66rem] tracking-[0.16em] uppercase hover:bg-warm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"> <span id="deploy-btn-label">Originate &rarr;</span> </button> <p id="deploy-status" class="mt-3 font-mono text-[0.56rem] tracking-[0.14em] uppercase text-ink-soft/70 min-h-[0.9rem]" role="status" aria-live="polite"></p> </section> <!-- Result panel --> <section id="deploy-result" class="hidden mb-8 p-4 rounded-md border border-warm/40 bg-warm/5"> <p class="font-mono text-[0.54rem] tracking-[0.22em] uppercase text-warm mb-2">
✓ Contract originated
</p> <p class="font-mono text-[0.8rem] text-ink mb-3 break-all" id="deploy-address">
KT1…
</p> <div class="flex flex-wrap gap-2 mb-3" id="deploy-links"></div> <p class="font-mono text-[0.55rem] tracking-[0.14em] uppercase text-ink-soft mb-1">
next steps
</p> <p class="text-[0.85rem] text-ink-soft/80 leading-relaxed" id="deploy-next-steps">
Paste the KT1 into <code class="font-mono text-[0.78rem] bg-card px-1 py-0.5 rounded">src/data/contracts.json</code>
under the relevant slug, then redeploy the site.
</p> </section> <!-- Help --> <details class="mt-8 p-4 rounded-md border border-rule/30 bg-card/40"> <summary class="font-mono text-[0.58rem] tracking-[0.2em] uppercase text-ink-soft cursor-pointer">
How to compile a contract
</summary> <ol class="mt-3 text-[0.85rem] text-ink-soft/80 leading-relaxed space-y-1 list-decimal list-inside"> <li>Open <a href="https://smartpy.io/ide" target="_blank" rel="noopener" class="text-warm hover:underline">smartpy.io/ide</a>.</li> <li>Paste <code class="font-mono text-[0.78rem] bg-card px-1 py-0.5 rounded">contracts/v2/&lt;slug&gt;.py</code>.</li> <li>Click <strong>Run</strong>. When tests pass, the IDE generates Michelson under the build directory.</li> <li>Open the <strong>Deploy Michelson Contract</strong> tab &mdash; download <code class="font-mono text-[0.78rem] bg-card px-1 py-0.5 rounded">step_nnn_cont_0_contract.json</code> and <code class="font-mono text-[0.78rem] bg-card px-1 py-0.5 rounded">step_nnn_cont_0_storage.json</code>.</li> <li>Paste them into the textareas above.</li> <li>Pick Shadownet first (faucet: <a href="https://faucet.shadownet.teztnets.com" target="_blank" rel="noopener" class="text-warm hover:underline">faucet.shadownet.teztnets.com</a>).</li> <li>Confirm the admin patch preview shows your connected wallet.</li> <li>Click <strong>Originate</strong>, sign in Kukai, capture the KT1.</li> </ol> </details> </div> ` })} ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/admin/deploy/new.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/admin/deploy/new.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/admin/deploy/new.astro";
const $$url = "/admin/deploy/new";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$New,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
