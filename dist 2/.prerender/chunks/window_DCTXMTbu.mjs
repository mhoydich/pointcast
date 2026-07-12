import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';
import { $ as $$ShareThis } from './ShareThis_CLgipRxL.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Window = createComponent(async ($$result, $$props, $$slots) => {
  let weather = { ok: false };
  try {
    const res = await fetch("https://pointcast.xyz/api/weather?lat=33.92&lng=-118.42&label=el-segundo", {
      signal: AbortSignal.timeout(2500)
    });
    if (res.ok) weather = await res.json();
  } catch {
  }
  const tempF = weather.tempF ?? 62;
  const condition = (weather.condition ?? "overcast").toLowerCase();
  function timeOfDayFromHour(h) {
    if (h >= 5 && h < 7) return "dawn";
    if (h >= 7 && h < 11) return "morning";
    if (h >= 11 && h < 14) return "midday";
    if (h >= 14 && h < 17) return "afternoon";
    if (h >= 17 && h < 19) return "sunset";
    if (h >= 19 && h < 21) return "dusk";
    return "night";
  }
  const ptHourFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    hour12: false
  });
  const ptHour = parseInt(ptHourFmt.format(/* @__PURE__ */ new Date()), 10);
  const tod = timeOfDayFromHour(ptHour);
  function conditionTag(c) {
    if (/fog|mist|marine/.test(c)) return "foggy";
    if (/clear|sun/.test(c)) return "clear";
    if (/overcast/.test(c)) return "overcast";
    return "cloudy";
  }
  const cond = conditionTag(condition);
  return renderTemplate(_a || (_a = __template(["", " <script>\n  (function () {\n    'use strict';\n    var frame    = document.getElementById('window-frame');\n    var tempEl   = document.getElementById('window-temp');\n    var condEl   = document.getElementById('window-condition');\n    var todEl    = document.getElementById('window-tod');\n    if (!frame) return;\n\n    function ptHour() {\n      try {\n        var fmt = new Intl.DateTimeFormat('en-US', {\n          timeZone: 'America/Los_Angeles', hour: 'numeric', hour12: false,\n        });\n        return parseInt(fmt.format(new Date()), 10);\n      } catch (e) { return new Date().getHours(); }\n    }\n    function timeOfDay(h) {\n      if (h >=  5 && h <  7) return 'dawn';\n      if (h >=  7 && h < 11) return 'morning';\n      if (h >= 11 && h < 14) return 'midday';\n      if (h >= 14 && h < 17) return 'afternoon';\n      if (h >= 17 && h < 19) return 'sunset';\n      if (h >= 19 && h < 21) return 'dusk';\n      return 'night';\n    }\n    function conditionTag(c) {\n      c = (c || '').toLowerCase();\n      if (/fog|mist|marine/.test(c)) return 'foggy';\n      if (/clear|sun/.test(c))       return 'clear';\n      if (/overcast/.test(c))        return 'overcast';\n      return 'cloudy';\n    }\n    function refreshTod() {\n      var tod = timeOfDay(ptHour());\n      frame.setAttribute('data-tod', tod);\n      if (todEl) todEl.textContent = tod;\n    }\n    function refreshWeather() {\n      fetch('/api/weather?lat=33.92&lng=-118.42&label=el-segundo', { cache: 'no-store' })\n        .then(function (r) { return r.ok ? r.json() : null; })\n        .then(function (data) {\n          if (!data || !data.ok) return;\n          if (tempEl && data.tempF != null) tempEl.textContent = String(data.tempF);\n          if (condEl && data.condition)     condEl.textContent = String(data.condition).toLowerCase();\n          frame.setAttribute('data-cond', conditionTag(data.condition));\n        })\n        .catch(function () { /* keep current state */ });\n    }\n    refreshTod();\n    setInterval(refreshTod,     60_000);   // every minute\n    setInterval(refreshWeather, 300_000);  // every 5 min\n  })();\n<\/script>"])), renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "The window · PointCast", "description": "A small El Segundo window view that responds to live time-of-day and Open-Meteo conditions. Sun, moon, marine layer, stars.", "image": "/images/og/window.png", "data-astro-cid-tuduymb4": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="window-page" data-astro-cid-tuduymb4> <header class="window-page__head" data-astro-cid-tuduymb4> <p class="window-page__kicker mono" data-astro-cid-tuduymb4>El Segundo · 33.92°N 118.42°W</p> <h1 class="window-page__title" data-astro-cid-tuduymb4>The window.</h1> <p class="window-page__lede" id="window-lede" data-astro-cid-tuduymb4> <span id="window-temp" data-astro-cid-tuduymb4>${tempF}</span>°F · <span id="window-condition" data-astro-cid-tuduymb4>${condition}</span> · <span id="window-tod" data-astro-cid-tuduymb4>${tod}</span> </p> </header> <section class="window-stage" aria-label="A live window onto the sky" data-astro-cid-tuduymb4> <div class="window-frame"${addAttribute(tod, "data-tod")}${addAttribute(cond, "data-cond")} id="window-frame" data-astro-cid-tuduymb4> <div class="window-sky" data-astro-cid-tuduymb4> <!-- Sun — visible morning through sunset --> <div class="window-sun" aria-hidden="true" data-astro-cid-tuduymb4></div> <!-- Moon — visible dusk through dawn --> <div class="window-moon" aria-hidden="true" data-astro-cid-tuduymb4></div> <!-- Stars — visible after dusk --> <div class="window-stars" aria-hidden="true" data-astro-cid-tuduymb4> <span class="star" style="left:14%; top:18%; animation-delay: 0s;" data-astro-cid-tuduymb4></span> <span class="star" style="left:28%; top:32%; animation-delay: 1.4s;" data-astro-cid-tuduymb4></span> <span class="star" style="left:46%; top:12%; animation-delay: 0.6s;" data-astro-cid-tuduymb4></span> <span class="star" style="left:62%; top:24%; animation-delay: 2.1s;" data-astro-cid-tuduymb4></span> <span class="star" style="left:78%; top:40%; animation-delay: 0.9s;" data-astro-cid-tuduymb4></span> <span class="star" style="left:88%; top:14%; animation-delay: 1.7s;" data-astro-cid-tuduymb4></span> <span class="star" style="left:18%; top:48%; animation-delay: 2.5s;" data-astro-cid-tuduymb4></span> <span class="star" style="left:54%; top:54%; animation-delay: 0.3s;" data-astro-cid-tuduymb4></span> </div> <!-- Drifting clouds — opacity gated by data-cond --> <div class="window-cloud window-cloud--1" aria-hidden="true" data-astro-cid-tuduymb4></div> <div class="window-cloud window-cloud--2" aria-hidden="true" data-astro-cid-tuduymb4></div> <div class="window-cloud window-cloud--3" aria-hidden="true" data-astro-cid-tuduymb4></div> <!-- Marine layer — rises in foggy / morning conditions --> <div class="window-marine" aria-hidden="true" data-astro-cid-tuduymb4></div> <!-- Distant horizon — a thin band of warmer color --> <div class="window-horizon" aria-hidden="true" data-astro-cid-tuduymb4></div> </div> <!-- Window mullions — wood crossbars over the glass --> <div class="window-mullion window-mullion--v" aria-hidden="true" data-astro-cid-tuduymb4></div> <div class="window-mullion window-mullion--h" aria-hidden="true" data-astro-cid-tuduymb4></div> <!-- Inner sash shadow — gives the window depth --> <div class="window-sash" aria-hidden="true" data-astro-cid-tuduymb4></div> </div> </section> <section class="window-page__about" data-astro-cid-tuduymb4> <p data-astro-cid-tuduymb4>Live from El Segundo. Time-of-day decides the sky — dawn pinks, midday blues, sunset oranges, dusk purples, night navy with stars. The condition decides the clouds — overcast piles them on, foggy raises the marine layer, clear thins the sky out. The view refreshes every five minutes while the tab is open.</p> <p class="window-page__quiet" data-astro-cid-tuduymb4>Pair it with the <a href="/coffee" data-astro-cid-tuduymb4>coffee pot</a> at this hour. The pot is on, the sun is going, the air outside is sixty-two and grey.</p> </section> <nav class="window-page__exits" aria-label="Window exits" data-astro-cid-tuduymb4> <a href="/" class="window-page__exit mono" data-astro-cid-tuduymb4>← the front door</a> <a href="/coffee" class="window-page__exit mono" data-astro-cid-tuduymb4>the coffee pot</a> <a href="/mythos" class="window-page__exit mono" data-astro-cid-tuduymb4>the mythos</a> <a href="/wire" class="window-page__exit mono" data-astro-cid-tuduymb4>the wire</a> </nav> ${renderComponent($$result2, "ShareThis", $$ShareThis, { "url": "/window", "kind": "window", "data-astro-cid-tuduymb4": true })} </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/window.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/window.astro";
const $$url = "/window";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Window,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
