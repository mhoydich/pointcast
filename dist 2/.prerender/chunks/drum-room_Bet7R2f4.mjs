import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';
import { $ as $$RoomPresenceChip } from './RoomPresenceChip_Dur7KbDI.mjs';

const $$DrumRoom = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Room · Shared Live Chamber · PointCast";
  const description = "Each visitor is a brass light. Tap to ring; everyone in the room hears it. Polled live presence.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Drum Room (live)",
    url: "https://pointcast.xyz/drum-room",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dr" id="dr-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "room" })} ${renderComponent($$result2, "RoomPresenceChip", $$RoomPresenceChip, { "surface": "drum-room" })} <header class="dr__header"> <div class="dr__chrome"> <span>ROOM</span> <span class="dr__chrome-sep">·</span> <span><span id="dr-count">0</span> HERE</span> <span class="dr__chrome-sep">·</span> <span><span id="dr-rings">0</span> RINGS</span> </div> <h1 class="dr__title">ROOM</h1> <p class="dr__tagline">each visitor is a brass light · click to ring · everyone hears it</p> </header> <section class="dr__field" id="dr-field" aria-label="Click anywhere to ring"> <div class="dr__lights" id="dr-lights"></div> <div class="dr__cue" id="dr-cue">click anywhere to ring</div> </section> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-room.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-room.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-room.astro";
const $$url = "/drum-room";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumRoom,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
