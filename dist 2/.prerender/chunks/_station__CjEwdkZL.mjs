import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, d as defineScriptVars, e as renderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import 'clsx';
import { S as STATIONS } from './local_DC-fTB3e.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
async function getStaticPaths() {
  return STATIONS.map((station) => ({
    params: { station: station.slug }
  }));
}
const $$station = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$station;
  const station = Astro2.params.station ?? "";
  const target = `/tv?station=${encodeURIComponent(station)}`;
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="utf-8"><meta http-equiv="refresh"', '><meta name="viewport" content="width=device-width, initial-scale=1"><title>PointCast · TV Station</title>', "</head> <body> <script>(function(){", "\n    window.location.replace(target);\n  })();<\/script> </body> </html>"])), addAttribute(`0;url=${target}`, "content"), renderHead(), defineScriptVars({ target }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/tv/[station].astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/tv/[station].astro";
const $$url = "/tv/[station]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$station,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
