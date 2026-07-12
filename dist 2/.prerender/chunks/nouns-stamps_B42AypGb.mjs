import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$NounsStamps = createComponent(($$result, $$props, $$slots) => {
  const title = "Stamps · Noun Postage · PointCast";
  const description = "A sheet of vintage Noun postage stamps. Click to cancel any stamp with a postmark.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Stamps",
    url: "https://pointcast.xyz/nouns-stamps",
    description,
    applicationCategory: "VisualArts"
  };
  const COLORS = [
    "#9c4a32",
    "#3a6f4a",
    "#5a3a18",
    "#3a4a6a",
    "#7a4a30",
    "#4a6a3a",
    "#7a3a52",
    "#5a5a2a",
    "#3a4a5a",
    "#7a5a32",
    "#4a3a6a",
    "#6a4a4a",
    "#3a5a3a",
    "#5a3a2a",
    "#3a3a5a",
    "#7a4a3a",
    "#4a4a4a",
    "#5a3a3a",
    "#3a5a4a",
    "#6a3a4a",
    "#4a3a3a",
    "#5a4a3a",
    "#3a4a4a",
    "#6a4a3a"
  ];
  const DENOMINATIONS = ["1¢", "3¢", "5¢", "10¢", "15¢", "25¢", "50¢", "$1", "$2"];
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="ns" id="ns-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "stamps" })} <header class="ns__header"> <div class="ns__chrome"> <span>STAMPS</span> <span class="ns__chrome-sep">·</span> <span>NOUN POSTAGE · EL SEGUNDO</span> <span class="ns__chrome-sep">·</span> <span id="ns-cancelled">0 CANCELLED</span> </div> <h1 class="ns__title">POSTAGE</h1> <p class="ns__tagline">a sheet of twenty-four · click to cancel each one</p> </header> <section class="ns__sheet" id="ns-sheet"> ${Array.from({ length: 24 }, (_, i) => i).map((i) => {
    const color = COLORS[i % COLORS.length];
    const denom = DENOMINATIONS[i % DENOMINATIONS.length];
    return renderTemplate`<button class="ns__stamp" type="button"${addAttribute(i, "data-idx")}${addAttribute(`--stamp-color: ${color};`, "style")}> <div class="ns__stamp-bg"></div> <div class="ns__stamp-inner"> <div class="ns__stamp-top"> <span class="ns__stamp-country">EL SEGUNDO</span> <span class="ns__stamp-denom">${denom}</span> </div> <img class="ns__stamp-noun" alt="" data-stamp-noun loading="lazy"> <div class="ns__stamp-bottom"> <span class="ns__stamp-num" data-stamp-num>—</span> <span class="ns__stamp-pc">P / C</span> </div> </div> <div class="ns__cancel" aria-hidden="true"> <svg viewBox="0 0 100 100" width="80" height="80"> <circle cx="50" cy="50" r="38" fill="none" stroke="#1a1a1a" stroke-width="2.5"></circle> <circle cx="50" cy="50" r="32" fill="none" stroke="#1a1a1a" stroke-width="1.2"></circle> <text x="50" y="38" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" font-weight="bold" letter-spacing="2" fill="#1a1a1a">PC POST</text> <text x="50" y="56" text-anchor="middle" font-family="Gloock, Lora, serif" font-size="14" font-weight="bold" fill="#1a1a1a" data-cancel-date>—</text> <text x="50" y="68" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="6" letter-spacing="1.5" fill="#1a1a1a">EL SEGUNDO</text> <line x1="22" y1="22" x2="78" y2="78" stroke="#1a1a1a" stroke-width="2" opacity="0.5"></line> </svg> </div> </button>`;
  })} </section> <footer class="ns__controls"> <button class="ns__btn ns__btn--primary" id="ns-refresh" type="button">FRESH SHEET</button> <p class="ns__instructions">
Click any stamp to apply a postmark cancellation. FRESH SHEET prints a new sheet of 24.
</p> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-stamps.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-stamps.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-stamps.astro";
const $$url = "/nouns-stamps";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsStamps,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
