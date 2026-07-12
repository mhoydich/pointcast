import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';

const $$Feedback = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Feedback · Admin", "description": "PointCast feedback inbox" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-[52rem] mx-auto px-4 pt-6 md:pt-10 pb-20"> <div class="-mx-4 px-4 py-2.5 border-y border-rule/50 flex items-center justify-between gap-3 mb-6"> <div class="flex items-center gap-3"> <a href="/" class="font-mono text-sm md:text-base font-bold tracking-[0.28em] uppercase text-ink leading-none hover:text-warm transition-colors no-underline">
PointCast
</a> <span class="font-mono text-[0.58rem] tracking-[0.22em] uppercase text-warm">
/ admin / feedback
</span> </div> </div> <header class="mb-6"> <p class="font-mono text-[0.54rem] tracking-[0.22em] uppercase text-warm mb-2">
admin · feedback inbox
</p> <h1 class="font-serif italic text-[1.8rem] md:text-[2.2rem] text-ink font-medium leading-[1.1] mb-2">
Feedback
</h1> <p class="text-[0.88rem] text-ink/70">
Token-gated. Paste your <code class="font-mono">ADMIN_TOKEN</code> to load. Entries are stored 30 days.
</p> </header> <!-- Token input --> <div class="mb-6 flex flex-wrap items-end gap-2"> <label class="font-mono text-[0.54rem] tracking-[0.22em] uppercase text-ink-soft/60 w-full md:w-auto">
admin token
</label> <input id="token-input" type="password" placeholder="paste token here" class="flex-1 min-w-[10rem] px-2 py-1.5 rounded-sm border border-rule/40 bg-card font-mono text-[0.78rem] text-ink focus:border-warm focus:outline-none"> <button id="load-btn" type="button" class="px-3 py-1.5 rounded-sm bg-ink text-paper font-mono text-[0.58rem] tracking-[0.14em] uppercase hover:bg-warm transition-colors cursor-pointer">Load →</button> </div> <p id="status" class="font-mono text-[0.56rem] tracking-[0.14em] uppercase text-ink-soft/60 min-h-[0.9rem] mb-4"></p> <!-- Inbox list --> <div id="inbox" class="space-y-3"></div> </div> ` })} ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/admin/feedback.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/admin/feedback.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/admin/feedback.astro";
const $$url = "/admin/feedback";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Feedback,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
