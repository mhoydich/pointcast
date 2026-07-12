import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

const $$404 = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$404;
  const ch = CHANNELS.VST;
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Block not found", "description": "The block at this URL does not exist. Block IDs are monotonic and immutable — retired blocks stay retired.", "data-astro-cid-zetdm5md": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page"${addAttribute(`--ch-600: ${ch.color600}; --ch-800: ${ch.color800}; --ch-50: ${ch.color50};`, "style")} data-astro-cid-zetdm5md> <header class="head" data-astro-cid-zetdm5md> <p class="code" data-astro-cid-zetdm5md>CH.404 · BLOCK NOT FOUND</p> <h1 data-astro-cid-zetdm5md>No block at this address.</h1> <p class="dek" data-astro-cid-zetdm5md>
Block IDs are monotonic and immutable per
<a href="/BLOCKS.md" data-astro-cid-zetdm5md><code data-astro-cid-zetdm5md>BLOCKS.md</code></a> — if a block is retired,
        the ID does not get handed to something else.
</p> </header> <section class="doors" data-astro-cid-zetdm5md> <a class="door" href="/" data-astro-cid-zetdm5md>← All blocks</a> <a class="door" href="/for-agents" data-astro-cid-zetdm5md>/for-agents</a> <a class="door" href="/blocks.json" data-astro-cid-zetdm5md>/blocks.json</a> <a class="door" href="/status" data-astro-cid-zetdm5md>/status</a> </section> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/404.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/404.astro";
const $$url = "/404";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$404,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
