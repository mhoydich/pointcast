import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumBellFall = createComponent(($$result, $$props, $$slots) => {
  const title = "Bell Fall · Pentatonic Bell-Rain · PointCast";
  const description = "Click anywhere on the velvet field. A bell falls and chimes when it lands. Pentatonic — every position is its own note. Pure ambient, sized for any screen.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Bell Fall",
    url: "https://pointcast.xyz/drum-bell-fall",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="bf" id="bf-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "bell-fall" })} <header class="bf__header"> <div class="bf__chrome"> <span class="bf__chrome-label">PENTATONIC</span> <span class="bf__chrome-sep">·</span> <span class="bf__chrome-label">CLICK ANYWHERE</span> <span class="bf__chrome-sep">·</span> <span class="bf__chrome-label">RAINS WHEN IDLE</span> </div> <h1 class="bf__title">BELL FALL</h1> <p class="bf__tagline">tap the velvet · the bell rings when it lands</p> </header> <section class="bf__field" id="bf-field" aria-label="Bell-fall canvas — click anywhere to drop a bell"> <!-- Background tower silhouettes --> <svg class="bf__tower bf__tower--left" viewBox="0 0 100 600" preserveAspectRatio="xMinYMax meet" aria-hidden="true"> <rect x="20" y="200" width="60" height="400" fill="#3a1240" opacity="0.4"></rect> <rect x="32" y="180" width="36" height="20" fill="#3a1240" opacity="0.4"></rect> <polygon points="14,200 50,140 86,200" fill="#3a1240" opacity="0.4"></polygon> <rect x="42" y="280" width="16" height="40" fill="#0c0410" opacity="0.55"></rect> <rect x="42" y="380" width="16" height="40" fill="#0c0410" opacity="0.55"></rect> </svg> <svg class="bf__tower bf__tower--right" viewBox="0 0 100 600" preserveAspectRatio="xMaxYMax meet" aria-hidden="true"> <rect x="20" y="240" width="60" height="360" fill="#3a1240" opacity="0.4"></rect> <rect x="32" y="220" width="36" height="20" fill="#3a1240" opacity="0.4"></rect> <polygon points="14,240 50,180 86,240" fill="#3a1240" opacity="0.4"></polygon> <rect x="42" y="320" width="16" height="40" fill="#0c0410" opacity="0.55"></rect> </svg> <!-- Floor "ring line" — bells chime when they cross this line --> <div class="bf__floor"></div> </section> <footer class="bf__readout"> <div class="bf__stat"> <span class="bf__stat-num" id="bf-count">0</span> <span class="bf__stat-label">bells fallen</span> </div> <div class="bf__stat"> <span class="bf__stat-num" id="bf-streak">0</span> <span class="bf__stat-label">recent streak</span> </div> <div class="bf__stat"> <span class="bf__stat-num" id="bf-active">0</span> <span class="bf__stat-label">in flight</span> </div> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-bell-fall.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-bell-fall.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-bell-fall.astro";
const $$url = "/drum-bell-fall";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumBellFall,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
