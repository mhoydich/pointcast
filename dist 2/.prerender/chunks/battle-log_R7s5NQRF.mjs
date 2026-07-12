import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

const $$BattleLog = createComponent(($$result, $$props, $$slots) => {
  const ch = CHANNELS.BTL;
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Battler Match Log", "description": "Local Nouns Battler match archive.", "data-astro-cid-amfxhrlk": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page"${addAttribute(`--ch-600: ${ch.color600}; --ch-800: ${ch.color800}; --ch-50: ${ch.color50};`, "style")} data-astro-cid-amfxhrlk> <nav class="crumb" data-astro-cid-amfxhrlk> <a href="/" data-astro-cid-amfxhrlk>← Home</a> <span aria-hidden="true" data-astro-cid-amfxhrlk>/</span> <a href="/battle" data-astro-cid-amfxhrlk>/battle</a> <span aria-hidden="true" data-astro-cid-amfxhrlk>/</span> <span data-astro-cid-amfxhrlk>local log</span> </nav> <header class="head" data-astro-cid-amfxhrlk> <p class="kicker" data-astro-cid-amfxhrlk>CH.BTL · LOCAL MATCH LOG</p> <h1 data-astro-cid-amfxhrlk>Browser-only battler archive.</h1> <p class="dek" data-astro-cid-amfxhrlk>
This page reads <code data-astro-cid-amfxhrlk>pc:battler-matches</code> from localStorage on
        this device only. Nothing is uploaded to the server.
</p> </header> <main class="panel" data-astro-cid-amfxhrlk> <div class="panel__head mono" data-astro-cid-amfxhrlk> <span data-astro-cid-amfxhrlk>LAST 50 MATCHES</span> <a href="/battle" data-astro-cid-amfxhrlk>Back to battle →</a> </div> <div class="panel__body" id="match-log" data-astro-cid-amfxhrlk> <div class="empty" data-astro-cid-amfxhrlk>No local matches recorded yet.</div> </div> </main> </div> ` })} ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/battle-log.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/battle-log.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/battle-log.astro";
const $$url = "/battle-log";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$BattleLog,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
