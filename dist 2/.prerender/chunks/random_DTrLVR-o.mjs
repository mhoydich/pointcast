import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, d as defineScriptVars, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Random = createComponent(async ($$result, $$props, $$slots) => {
  const blocks = await getCollection("blocks", ({ data }) => !data.draft);
  const pick = blocks[Math.floor(Math.random() * blocks.length)];
  const ch = CHANNELS[pick.data.channel];
  const targetUrl = `/b/${pick.data.id}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://pointcast.xyz/random",
    name: "PointCast · random",
    description: "A random PointCast Block. Redirects on every visit.",
    mainEntity: {
      "@type": "CreativeWork",
      name: pick.data.title,
      url: `https://pointcast.xyz${targetUrl}`,
      identifier: pick.data.id
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Random", "description": "A random PointCast Block. Redirects on load.", "jsonLd": jsonLd, "data-astro-cid-u6zr2uvj": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template(["   ", '<div class="page" data-astro-cid-u6zr2uvj> <p class="line mono" data-astro-cid-u6zr2uvj>RANDOM · REDIRECTING TO</p> <h1 class="dest" data-astro-cid-u6zr2uvj> <a', "", " data-astro-cid-u6zr2uvj>CH.", " · № ", " — ", `</a> </h1> <p class="line mono" data-astro-cid-u6zr2uvj>IF THE REDIRECT DOESN'T FIRE, TAP THE LINK ABOVE OR <a href="/random" data-astro-cid-u6zr2uvj>ROLL AGAIN</a></p> </div> <script>(function(){`, "\n    window.location.replace(targetUrl);\n  })();<\/script> "])), maybeRenderHead(), addAttribute(targetUrl, "href"), addAttribute(`color: ${ch.color800}`, "style"), ch.code, pick.data.id, pick.data.title, defineScriptVars({ targetUrl })), "head": async ($$result2) => renderTemplate`<meta http-equiv="refresh"${addAttribute(`0; url=${targetUrl}`, "content")}><link rel="canonical"${addAttribute(`https://pointcast.xyz${targetUrl}`, "href")}>` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/random.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/random.astro";
const $$url = "/random";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Random,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
