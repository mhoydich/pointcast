import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';
import { $ as $$PresenceBar, a as $$MoodChip } from './MoodChip_Bs_gV9ui.mjs';
import { $ as $$WalletChip } from './WalletChip_CCc3HKnc.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';

const $$Rooms = createComponent(async ($$result, $$props, $$slots) => {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime()).slice(0, 5);
  const rooms = [
    {
      href: "/bath",
      exe: "BATH.EXE",
      label: "BATH",
      name: "The Bath",
      meta: "8 palettes · web-audio drone · spotify sync",
      now: "▶ palette: SUNSET · drone D-flat",
      presence: "3 here",
      variant: "bath"
    },
    {
      href: "/drum-v8",
      exe: "DRUM.EXE — v8",
      label: "SYMPHONY",
      name: "The Drum Room",
      meta: "orchestra · trophies on-chain · loop studio",
      now: "▶ 42-piece orchestra · BPM 96",
      presence: "12 here",
      variant: "drum"
    },
    {
      href: "/anytime",
      exe: "ANYTIME.EXE",
      label: "LISTEN",
      name: "Anytime",
      meta: "listening room · one track · come and go",
      now: '▶ Harrison · "All Things Must Pass"',
      presence: "2 here",
      variant: "anytime"
    },
    {
      href: "/coffee",
      exe: "COFFEE.EXE",
      label: "CAFE",
      name: "Coffee Mugs",
      meta: "5 tiers · cup-count gated · live mint",
      now: "cup count: you have 3 · tier 2 unlocked",
      presence: "1 here",
      variant: "coffee"
    },
    {
      href: "/zen-cats",
      exe: "ZEN.EXE",
      label: "ZEN",
      name: "Zen Cats",
      meta: "genesis + world · daily ritual",
      now: "cat 002 awaits a ritual",
      presence: "0 here",
      cold: true,
      variant: "zen"
    },
    {
      href: "/taproom",
      exe: "TAPROOM.EXE",
      label: "TAPROOM",
      name: "Taproom",
      meta: "slow chatter · neon corner",
      now: "last visit: 11h ago",
      presence: "quiet",
      cold: true,
      variant: "taproom"
    },
    {
      href: "/window",
      exe: "WINDOW.EXE",
      label: "WINDOW",
      name: "Window Snapshots",
      meta: "painted rooms · pending mint",
      now: "3 painted interiors · not yet originated",
      presence: "staged",
      cold: true,
      variant: "window"
    },
    {
      href: "/cake",
      exe: "CAKE.EXE",
      label: "CAKE",
      name: "Cake",
      meta: "birthdays · soon",
      now: "scaffolded · awaiting first slice",
      presence: "birthdays",
      cold: true,
      variant: "cake"
    },
    {
      href: "#",
      exe: "DRAWING.EXE",
      label: "DRAWING",
      name: "Drawing Room",
      meta: "collab canvas · coming soon",
      now: "in review · not merged",
      presence: "PR open",
      cold: true,
      variant: "drawing"
    }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Rooms", "description": "PointCast rooms hub — a small internet town. Pick a door.", "hideNav": true, "data-astro-cid-h5cpthjk": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mood-ribbon" aria-hidden="true" data-astro-cid-h5cpthjk></div> <header class="masthead" data-astro-cid-h5cpthjk> <a href="/" class="logo" aria-label="PointCast home" data-astro-cid-h5cpthjk>POINTCAST<span class="dot" data-astro-cid-h5cpthjk>.</span>XYZ</a> <div class="marquee" aria-label="status" data-astro-cid-h5cpthjk> <span data-astro-cid-h5cpthjk>● drum-v8 SYMPHONY playing across the mesh · today's noun is on the auction block · marketplace v3 first sale closed · bath palette: SUNSET · zen cat 002 awaits a ritual · mood follows you between rooms ·</span> </div> <div class="ambient" data-astro-cid-h5cpthjk> <a class="app-link" href="/app" data-astro-cid-h5cpthjk>APP</a> ${renderComponent($$result2, "PresenceBar", $$PresenceBar, { "data-astro-cid-h5cpthjk": true })} ${renderComponent($$result2, "MoodChip", $$MoodChip, { "data-astro-cid-h5cpthjk": true })} ${renderComponent($$result2, "WalletChip", $$WalletChip, { "data-astro-cid-h5cpthjk": true })} </div> </header> <main class="stage" data-astro-cid-h5cpthjk> <section data-astro-cid-h5cpthjk> <h1 class="hub-title" data-astro-cid-h5cpthjk>Rooms</h1> <p class="hub-sub" data-astro-cid-h5cpthjk>A small internet town — pick a door</p> <div class="town" data-astro-cid-h5cpthjk> ${rooms.map((r) => renderTemplate`<a${addAttribute(r.href, "href")}${addAttribute(`room`, "class")} data-astro-cid-h5cpthjk> <div class="win" data-astro-cid-h5cpthjk> <div class="win-title" data-astro-cid-h5cpthjk> <span data-astro-cid-h5cpthjk>${r.exe}</span> <span class="dots" data-astro-cid-h5cpthjk><span data-astro-cid-h5cpthjk>_</span><span data-astro-cid-h5cpthjk>×</span></span> </div> <div class="win-body" data-astro-cid-h5cpthjk> <div${addAttribute(`iso room-${r.variant}`, "class")} data-astro-cid-h5cpthjk> <span class="iso-label" data-astro-cid-h5cpthjk>${r.label}</span> <span${addAttribute(`iso-live${r.cold ? " cold" : ""}`, "class")} data-astro-cid-h5cpthjk>${r.presence}</span> <div class="bldg" data-astro-cid-h5cpthjk></div> <div class="iso-now" data-astro-cid-h5cpthjk>${r.now}</div> </div> <p class="room-name" data-astro-cid-h5cpthjk>${r.name}</p> <p class="room-meta" data-astro-cid-h5cpthjk>${r.meta}</p> </div> </div> </a>`)} </div> </section> <aside class="rail" data-astro-cid-h5cpthjk> <div class="win you" data-astro-cid-h5cpthjk> <div class="win-title you-title" data-astro-cid-h5cpthjk> <span data-astro-cid-h5cpthjk>YOU.PROFILE</span> <span class="dots" data-astro-cid-h5cpthjk><span data-astro-cid-h5cpthjk>?</span><span data-astro-cid-h5cpthjk>×</span></span> </div> <div class="win-body" data-astro-cid-h5cpthjk> <h3 data-astro-cid-h5cpthjk>Your running total</h3> <div class="row" data-astro-cid-h5cpthjk><span data-astro-cid-h5cpthjk>blocks touched</span><span class="v" id="rh-blocks" data-astro-cid-h5cpthjk>—</span></div> <div class="row" data-astro-cid-h5cpthjk><span data-astro-cid-h5cpthjk>rooms visited</span><span class="v" id="rh-rooms" data-astro-cid-h5cpthjk>—</span></div> <div class="row" data-astro-cid-h5cpthjk><span data-astro-cid-h5cpthjk>bath saves</span><span class="v" id="rh-bath" data-astro-cid-h5cpthjk>—</span></div> <div class="row" data-astro-cid-h5cpthjk><span data-astro-cid-h5cpthjk>drum sessions</span><span class="v" id="rh-drum" data-astro-cid-h5cpthjk>—</span></div> <div class="row" data-astro-cid-h5cpthjk><span data-astro-cid-h5cpthjk>cup count</span><span class="v" id="rh-cups" data-astro-cid-h5cpthjk>—</span></div> <div class="row" data-astro-cid-h5cpthjk><span data-astro-cid-h5cpthjk>mood streak</span><span class="v" id="rh-mood" data-astro-cid-h5cpthjk>—</span></div> <h3 data-astro-cid-h5cpthjk>Collection</h3> <div class="collection-strip" data-astro-cid-h5cpthjk> <div class="col-tile mug" data-label="mugs" data-astro-cid-h5cpthjk></div> <div class="col-tile noun" data-label="nouns" data-astro-cid-h5cpthjk></div> <div class="col-tile trophy" data-label="trophies" data-astro-cid-h5cpthjk></div> <div class="col-tile snap" data-label="snaps" data-astro-cid-h5cpthjk></div> </div> <div class="profile-cta" data-astro-cid-h5cpthjk> <a href="/profile" class="open-profile" data-astro-cid-h5cpthjk>OPEN PROFILE →</a> </div> </div> </div> <div class="win ledger" data-astro-cid-h5cpthjk> <div class="win-title ledger-title" data-astro-cid-h5cpthjk> <span data-astro-cid-h5cpthjk>BLOCK LEDGER — last 5</span> <span class="dots" data-astro-cid-h5cpthjk><span data-astro-cid-h5cpthjk>↻</span><span data-astro-cid-h5cpthjk>×</span></span> </div> <ol data-astro-cid-h5cpthjk> ${blocks.map((b) => renderTemplate`<li data-astro-cid-h5cpthjk> <a${addAttribute(`/b/${b.data.id}`, "href")} data-astro-cid-h5cpthjk> <span class="id" data-astro-cid-h5cpthjk>№${b.data.id}</span> <span class="t" data-astro-cid-h5cpthjk>${b.data.title}</span> <span class="ch" data-astro-cid-h5cpthjk>${b.data.channel}</span> </a> </li>`)} </ol> </div> <div class="win" data-astro-cid-h5cpthjk> <div class="win-title now-title" data-astro-cid-h5cpthjk> <span data-astro-cid-h5cpthjk>NOW PLAYING — across the mesh</span> <span class="dots" data-astro-cid-h5cpthjk><span data-astro-cid-h5cpthjk>♪</span><span data-astro-cid-h5cpthjk>×</span></span> </div> <div class="win-body now-list" data-astro-cid-h5cpthjk> <div data-astro-cid-h5cpthjk>BATH ▸ drone D♭ · sunset palette</div> <div data-astro-cid-h5cpthjk>DRUM ▸ symphony · BPM 96</div> <div data-astro-cid-h5cpthjk>ANYTIME ▸ All Things Must Pass</div> <div class="now-foot" data-astro-cid-h5cpthjk>— mood follows you between rooms —</div> </div> </div> </aside> </main> <footer class="rooms-foot" data-astro-cid-h5cpthjk>
pointcast.xyz · /rooms · v0 · pixel-iso town
</footer> ` })} ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/rooms.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/rooms.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/rooms.astro";
const $$url = "/rooms";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Rooms,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
