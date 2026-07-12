import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumRadioRoom = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Radio Room · Shared Dial · PointCast";
  const description = "Five-intention generative radio with a SHARED dial. Turn it; everyone in the room shifts station.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Drum Radio Room",
    url: "https://pointcast.xyz/drum-radio-room",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="drr" id="drr-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "radio-room" })} <header class="drr__header"> <div class="drr__chrome"> <span>RADIO ROOM</span> <span class="drr__chrome-sep">·</span> <span><span id="drr-here">0</span> HERE</span> <span class="drr__chrome-sep">·</span> <span id="drr-station">— —</span> </div> <h1 class="drr__title">RADIO ROOM</h1> <p class="drr__tagline">turn the dial · everyone shifts together</p> </header> <section class="drr__buttons"> <button class="drr__btn" data-station="focus" data-hue="0"><span class="drr__btn-marker" style="background:oklch(0.65 0.20 0)"></span><div><div class="drr__btn-label">FOCUS</div><div class="drr__btn-sub">C drone</div></div></button> <button class="drr__btn" data-station="work" data-hue="72"><span class="drr__btn-marker" style="background:oklch(0.65 0.20 72)"></span><div><div class="drr__btn-label">WORK</div><div class="drr__btn-sub">Cmaj9 60bpm</div></div></button> <button class="drr__btn" data-station="calm" data-hue="144"><span class="drr__btn-marker" style="background:oklch(0.65 0.20 144)"></span><div><div class="drr__btn-label">CALM</div><div class="drr__btn-sub">Em7 breath</div></div></button> <button class="drr__btn" data-station="energize" data-hue="216"><span class="drr__btn-marker" style="background:oklch(0.65 0.20 216)"></span><div><div class="drr__btn-label">ENERGIZE</div><div class="drr__btn-sub">Bbmaj7 90bpm</div></div></button> <button class="drr__btn" data-station="dream" data-hue="288"><span class="drr__btn-marker" style="background:oklch(0.65 0.20 288)"></span><div><div class="drr__btn-label">DREAM</div><div class="drr__btn-sub">arrhythmic swells</div></div></button> </section> <p class="drr__note">
The dial is shared. When any visitor turns it, everyone in the room shifts to the new station with
      a 1.2s crossfade. Audio gates on first interaction. Visit count refreshes every 2 seconds. Same
      five generative voices as <a href="/drum-station">/drum-station</a>.
</p> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-radio-room.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-radio-room.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-radio-room.astro";
const $$url = "/drum-radio-room";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumRadioRoom,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
