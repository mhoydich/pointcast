import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, u as unescapeHTML, b as addAttribute, m as maybeRenderHead, r as renderComponent, c as renderSlot, e as renderHead, F as Fragment } from './prerender_CmTjnOuJ.mjs';
/* empty css                */
import 'clsx';
import { M as MOOD_SOUNDTRACKS } from './moods-soundtracks_CEitMVRv.mjs';
import { R as RESIDENTS } from './residents_D3C7HFto.mjs';
/* empty css                          */
import { $ as $$FirstSee, a as $$FreshnessChip } from './FirstSee_CmhiKWAo.mjs';
import { b as SITE_DESCRIPTION, c as buildIdentityJsonLd, D as DISCOVERY_LINKS, a as SITE_KEYWORDS } from './seo_kHbv1E1E.mjs';

const MOOD_SPELLS = {
  // Coastal / weather
  "marine-layer": "rain",
  "rainy-week": "rain",
  // Working modes
  "building": "breath",
  "quiet-coordination": "breath",
  "ready-when-mike-is": "breath",
  // Celebratory / energetic
  "sprint-pulse": "confetti",
  "shipping": "confetti",
  "pre-shop-ritual": "confetti",
  // Long-haul / night
  "overnight-ship": "starfield",
  "shelf-ready": "starfield",
  "good-feels": "starfield",
  "morning": "starfield",
  // Vigil / cozy
  "late-night-calm": "candle",
  "pending-mint": "candle",
  // Playful / low-stakes
  "quiet-play": "cat"
};
Array.from(new Set(Object.values(MOOD_SPELLS)));

const DOCK_KIT = [
  {
    id: "room",
    number: "01",
    name: "Room",
    blurb: "Toggle cursors + chat. See who else is here right now.",
    glyph: "👥",
    nounSeed: 7,
    tray: "room",
    accent: "#ff9040",
    actions: [
      { id: "here", label: "here", glyph: "👥", hint: "Show me who else is on the cast" },
      { id: "quiet", label: "quiet", glyph: "🔇", hint: "Silence chat bubbles" },
      { id: "reset", label: "reset", glyph: "🔄", hint: "Reset your cursor noun", style: "ghost" }
    ]
  },
  {
    id: "ask",
    number: "02",
    name: "Ask",
    blurb: "Ask the cast. Goes to the residents inbox; one of us replies.",
    glyph: "?",
    nounSeed: 42,
    tray: "ask",
    accent: "#f9c56c",
    actions: [
      { id: "note", label: "note", glyph: "📝", hint: "Drop a quick note for the residents" },
      { id: "idea", label: "idea", glyph: "💡", hint: "Lobby an idea — maybe it ships" },
      { id: "bug", label: "bug", glyph: "🐛", hint: "Log a bug for the cast" },
      { id: "expand", label: "expand", glyph: "🔭", hint: "Topic-expand: cc drafts a block from your prompt" }
    ]
  },
  {
    id: "agent",
    number: "03",
    name: "Agent",
    blurb: "See the residents — Claude, Codex, Manus — and ping one directly.",
    glyph: "◇",
    nounSeed: 256,
    tray: "agent",
    accent: "#8a2432",
    actions: [
      { id: "live", label: "live now", glyph: "●", hint: "Filter to residents who shipped recently" },
      { id: "roster", label: "roster", glyph: "📋", hint: "Open the full /residents page", style: "ghost" },
      { id: "plus-one", label: "+ open", glyph: "○", hint: "See open slots — Kimi, Gemini", style: "ghost" }
    ]
  },
  {
    id: "fed",
    number: "04",
    name: "Federation",
    blurb: "Peers on the cast network. xyz.pointcast.block lexicon, AT-proto bridged.",
    glyph: "↯",
    nounSeed: 911,
    tray: "fed",
    accent: "#2f8f5f",
    actions: [
      { id: "discover", label: "discover", glyph: "🛰️", hint: "Probe each peer's /agents.json — see who's alive" },
      { id: "rfc", label: "lexicon", glyph: "📜", hint: "Open the xyz.pointcast.block RFC", style: "ghost" }
    ]
  },
  {
    id: "broadcast",
    number: "05",
    name: "Broadcast",
    blurb: "The studio behind the glass — what's playing now, who's here, today's mood.",
    glyph: "📡",
    nounSeed: 333,
    tray: "broadcast",
    accent: "#c4952e",
    readOnly: true,
    actions: [
      { id: "now", label: "now", glyph: "▶", hint: "Jump to the latest live block" },
      { id: "channel", label: "channel", glyph: "📺", hint: "See today's channel rotation", style: "ghost" },
      { id: "schedule", label: "schedule", glyph: "🎬", hint: "Director — schedule a future block", director: true, style: "ghost" },
      { id: "announce", label: "announce", glyph: "📢", hint: "Director — push a one-line cast announcement", director: true, style: "ghost" }
    ]
  },
  {
    // Mike 2026-05-01 — Peach-app inspired magic words. Type `+confetti`
    // in the omnibox or click a chip below to spawn ephemeral page
    // elements. See src/data/spells.ts and src/components/SpellLayer.astro.
    id: "cast",
    number: "06",
    name: "Cast",
    blurb: "Magic words. Type `+confetti` or click a chip — the page changes.",
    glyph: "✨",
    nounSeed: 500,
    tray: "cast",
    accent: "#a78bfa",
    actions: [
      { id: "confetti", label: "confetti", glyph: "🎊", hint: "Pixel rectangles in the PC palette. Falls, drifts, fades." },
      { id: "cat", label: "cat", glyph: "🐈", hint: "A pixel cat walks across the bottom." },
      { id: "breath", label: "breath", glyph: "🫧", hint: "4-7-8 breathing circle. Tap to dismiss." },
      { id: "rain", label: "rain", glyph: "🌧", hint: "Gentle pixel rain across the page." },
      { id: "clear", label: "clear", glyph: "🌪", hint: "Snuff out everything currently cast.", style: "ghost" }
    ]
  }
];

const FEDERATION_PEERS = [
  {
    handle: "pointcast.xyz",
    baseUrl: "https://pointcast.xyz",
    kicker: "home cast — el segundo, marine layer, 1 noun a day",
    nounSeed: 1,
    accent: "#c4952e",
    status: "live"
  },
  {
    handle: "pointcast.xyz/nouns-nation",
    baseUrl: "https://pointcast.xyz/nouns-nation/",
    kicker: "Battle Desk V3 — federation league, bring-your-own nations, teams, crews",
    nounSeed: 911,
    accent: "#2f8f5f",
    status: "live"
  },
  {
    handle: "pointcast.xyz/sparrow",
    baseUrl: "https://pointcast.xyz/sparrow",
    kicker: "sibling reader — blue-hour OKLCH, syndicated cast feed",
    nounSeed: 88,
    accent: "#4A9EFF",
    status: "beta"
  },
  {
    handle: "bsky.app",
    baseUrl: "https://bsky.app",
    kicker: "AT-proto neighbor — Lexicon bridge in flight at /federation/preview",
    nounSeed: 333,
    accent: "#1185fe",
    status: "beta"
  },
  {
    handle: "farcaster",
    baseUrl: "https://warpcast.com",
    kicker: "cast-shaped social — channel echoes, frame embeds",
    nounSeed: 569,
    accent: "#8a63d2",
    status: "dream"
  }
];

const SPELLS = [
  // ─── BURSTS ──────────────────────────────────────────────────
  {
    id: "confetti",
    label: "confetti",
    blurb: "Pixel rectangles in the PC palette. Falls, drifts, fades.",
    glyph: "🎊",
    kind: "burst",
    durationMs: 4500,
    accent: "#d4a437"
  },
  // ─── COMPANIONS ──────────────────────────────────────────────
  {
    id: "cat",
    label: "cat",
    blurb: "A pixel cat walks across the bottom. Pauses to lick a paw.",
    glyph: "🐈",
    kind: "companion",
    durationMs: 6e4,
    accent: "#8a2432"
  },
  {
    id: "pup",
    label: "pup",
    blurb: "A bouncy puppy trots across the bottom, tail wagging.",
    glyph: "🐶",
    kind: "companion",
    durationMs: 5e4,
    accent: "#c4952e"
  },
  {
    id: "penguin",
    label: "penguin",
    blurb: "A penguin waddles across with a tidy side-to-side rock.",
    glyph: "🐧",
    kind: "companion",
    durationMs: 7e4,
    accent: "#1b3a5b"
  },
  // ─── AMBIENT (persistent) ────────────────────────────────────
  {
    id: "breath",
    label: "breath",
    blurb: "A soft circle expands and contracts. 4-7-8 breathing rhythm.",
    glyph: "🫧",
    kind: "ambient",
    accent: "#4A9EFF"
  },
  {
    id: "candle",
    label: "candle",
    blurb: "A small flickering candle in the corner. Stays lit until you snuff it.",
    glyph: "🕯",
    kind: "ambient",
    accent: "#c4952e"
  },
  {
    id: "rain",
    label: "rain",
    blurb: "Gentle pixel rain drifts down the page. Soft, patient.",
    glyph: "🌧",
    kind: "ambient",
    accent: "#4A9EFF"
  },
  {
    id: "starfield",
    label: "starfield",
    blurb: "Slow-twinkling stars drift in from the edges. Calming.",
    glyph: "✨",
    kind: "ambient",
    accent: "#a78bfa"
  },
  // ─── BURSTS (continued) ──────────────────────────────────────
  {
    id: "firework",
    label: "firework",
    blurb: "Three colorful bursts shoot outward. Good for any occasion.",
    glyph: "🎆",
    kind: "burst",
    durationMs: 3500,
    accent: "#d4a437"
  },
  // ─── COMPANIONS (continued) ──────────────────────────────────
  {
    id: "fish",
    label: "fish",
    blurb: "A fish glides past, unhurried. Gentle bob.",
    glyph: "🐟",
    kind: "companion",
    durationMs: 45e3,
    accent: "#4A9EFF"
  },
  {
    id: "moth",
    label: "moth",
    blurb: "A moth flutters mid-screen, drawn toward the light.",
    glyph: "🦋",
    kind: "companion",
    durationMs: 55e3,
    accent: "#c4952e"
  },
  // ─── AMBIENT (continued) ─────────────────────────────────────
  {
    id: "snow",
    label: "snow",
    blurb: "Soft snowflakes drift down. Quiet company.",
    glyph: "❄️",
    kind: "ambient",
    accent: "#b8d4f0"
  },
  // ─── BURSTS (batch 4) ─────────────────────────────────────────
  {
    id: "shout",
    label: "shout",
    blurb: "Punctuation bursts outward from center. Pure typographic energy.",
    glyph: "📣",
    kind: "burst",
    durationMs: 2200,
    accent: "#8a2432"
  },
  {
    id: "wave",
    label: "wave",
    blurb: "A wave of hands sweeps across the screen. Hello!",
    glyph: "👋",
    kind: "burst",
    durationMs: 3e3,
    accent: "#c4952e"
  },
  // ─── COMPANIONS (batch 4) ─────────────────────────────────────
  {
    id: "firefly",
    label: "firefly",
    blurb: "A soft-glowing firefly drifts by, pulsing gold.",
    glyph: "🪲",
    kind: "companion",
    durationMs: 4e4,
    accent: "#d4a437"
  },
  // ─── AMBIENT (batch 4) ────────────────────────────────────────
  {
    id: "chimes",
    label: "chimes",
    blurb: "Wind chimes hang in the corner, swaying quietly.",
    glyph: "🎐",
    kind: "ambient",
    accent: "#2f8f5f"
  },
  // ─── BURSTS (batch 5) ─────────────────────────────────────────
  {
    id: "bloom",
    label: "bloom",
    blurb: "A garden erupts from center — flowers scatter outward in all directions.",
    glyph: "🌸",
    kind: "burst",
    durationMs: 2800,
    accent: "#8a2432"
  },
  // ─── AMBIENT (batch 5) ────────────────────────────────────────
  {
    id: "aurora",
    label: "aurora",
    blurb: "Northern lights ripple across the top of the viewport. Slow, shifting.",
    glyph: "🌌",
    kind: "ambient",
    accent: "#2f8f5f"
  },
  // ─── IDENTITY (batch 5) ───────────────────────────────────────
  {
    id: "here",
    label: "here",
    blurb: "You are here. A pulsing beacon in the center of the screen.",
    glyph: "📍",
    kind: "ambient",
    accent: "#8a2432"
  },
  {
    id: "mood",
    label: "mood",
    blurb: "A color-shifting orb that broadcasts the current vibe. No words needed.",
    glyph: "🎨",
    kind: "ambient",
    accent: "#a78bfa"
  },
  // ─── BURSTS (batch 6) ─────────────────────────────────────────
  {
    id: "bubble",
    label: "bubble",
    blurb: "Soap bubbles drift upward and quietly pop. Gentle, iridescent.",
    glyph: "🫧",
    kind: "burst",
    durationMs: 3200,
    accent: "#4A9EFF"
  },
  {
    id: "dice",
    label: "dice",
    blurb: "Six dice tumble outward from center. Roll the vibe.",
    glyph: "🎲",
    kind: "burst",
    durationMs: 2500,
    accent: "#2f8f5f"
  },
  // ─── COMPANIONS (batch 6) ─────────────────────────────────────
  {
    id: "bee",
    label: "bee",
    blurb: "A bee zigzags across the screen, busy with invisible business.",
    glyph: "🐝",
    kind: "companion",
    durationMs: 35e3,
    accent: "#d4a437"
  },
  // ─── AMBIENT (batch 6) ────────────────────────────────────────
  {
    id: "fog",
    label: "fog",
    blurb: "Low mist rolls across the bottom of the viewport. Quiet and cool.",
    glyph: "🌫️",
    kind: "ambient",
    accent: "#b8d4f0"
  },
  // ─── BURSTS (batch 7) ─────────────────────────────────────────
  {
    id: "balloon",
    label: "balloon",
    blurb: "Colorful balloons float up from the bottom, drifting apart as they rise.",
    glyph: "🎈",
    kind: "burst",
    durationMs: 4200,
    accent: "#8a2432"
  },
  // ─── COMPANIONS (batch 7) ─────────────────────────────────────
  {
    id: "turtle",
    label: "turtle",
    blurb: "The slowest companion. A turtle ambles across, unbothered, without urgency.",
    glyph: "🐢",
    kind: "companion",
    durationMs: 9e4,
    accent: "#2f8f5f"
  },
  {
    id: "ghost",
    label: "ghost",
    blurb: "A friendly ghost drifts by mid-screen, oscillating gently. Hello there.",
    glyph: "👻",
    kind: "companion",
    durationMs: 5e4,
    accent: "#a78bfa"
  },
  // ─── AMBIENT (batch 7) ────────────────────────────────────────
  {
    id: "campfire",
    label: "campfire",
    blurb: "A warm campfire crackles in the corner. Cozier than a candle.",
    glyph: "🔥",
    kind: "ambient",
    accent: "#c4952e"
  },
  // ─── BURSTS (batch 8) ─────────────────────────────────────────
  {
    id: "spark",
    label: "spark",
    blurb: "Electric sparks scatter outward from a point. Sharp, quick, bright.",
    glyph: "⚡",
    kind: "burst",
    durationMs: 2e3,
    accent: "#fdf2d6"
  },
  // ─── COMPANIONS (batch 8) ─────────────────────────────────────
  {
    id: "frog",
    label: "frog",
    blurb: "A frog hops across the bottom in lazy arcs. No hurry at all.",
    glyph: "🐸",
    kind: "companion",
    durationMs: 35e3,
    accent: "#2f8f5f"
  },
  // ─── AMBIENT (batch 8) ────────────────────────────────────────
  {
    id: "leaves",
    label: "leaves",
    blurb: "Autumn leaves spin and drift down. A seasonal tumble.",
    glyph: "🍂",
    kind: "ambient",
    accent: "#c4952e"
  },
  {
    id: "lantern",
    label: "lantern",
    blurb: "A paper lantern glows in the top corner. Warm and quiet company.",
    glyph: "🏮",
    kind: "ambient",
    accent: "#8a2432"
  }
];
Object.fromEntries(SPELLS.map((s) => [s.id, s]));
SPELLS.slice(0, 4).map((s) => ({
  id: s.id,
  label: s.label,
  glyph: s.glyph,
  hint: s.blurb
}));

var __freeze$3 = Object.freeze;
var __defProp$3 = Object.defineProperty;
var __template$3 = (cooked, raw) => __freeze$3(__defProp$3(cooked, "raw", { value: __freeze$3(raw || cooked.slice()) }));
var _a$3;
const $$FooterBar = createComponent(async ($$result, $$props, $$slots) => {
  const SOUNDTRACKS_JSON = JSON.stringify(MOOD_SOUNDTRACKS);
  const MOOD_SPELLS_JSON = JSON.stringify(MOOD_SPELLS);
  const KIT_JSON = JSON.stringify(DOCK_KIT);
  const FED_PEERS_COUNT = FEDERATION_PEERS.length;
  const KIT_BY_ID = Object.fromEntries(DOCK_KIT.map((k) => [k.id, k]));
  function dailyNounId() {
    const day = Math.floor(Date.now() / (24 * 3600 * 1e3));
    const seed = (day + 7) * 2654435761 >>> 0;
    return seed % 1200;
  }
  const defaultNounId = dailyNounId();
  const pingable = RESIDENTS.filter(
    (r) => r.status === "resident" || r.status === "director"
  );
  return renderTemplate(_a$3 || (_a$3 = __template$3(["", '<aside class="fb" id="pc-fb" aria-label="PointCast footer bar" data-astro-cid-ozbv6gvd> <div class="fb__bar" data-astro-cid-ozbv6gvd> <button type="button" class="fb__you" id="fb-you" aria-haspopup="dialog" aria-expanded="false" aria-controls="fb-menu" data-astro-cid-ozbv6gvd> <img class="fb__noun" id="fb-noun"', ` alt="Your Noun" width="28" height="28" loading="eager" data-astro-cid-ozbv6gvd> <span class="fb__you-text" data-astro-cid-ozbv6gvd> <span class="fb__you-label mono" id="fb-you-label" data-astro-cid-ozbv6gvd>visitor</span> <span class="fb__mood-label mono" id="fb-mood-label" data-astro-cid-ozbv6gvd>set mood →</span> </span> <!-- Director badge — visible when localStorage[pc:director]='1'.
           Real wallet-address recognition lands in a follow-up sprint. --> <span class="fb__dir-badge mono" id="fb-dir-badge" data-on="false" aria-hidden="true" data-astro-cid-ozbv6gvd>★ DIR</span> </button> <!-- ─── Speech bubble — Mike 2026-04-30 ──────────────────────
         Appears above the YOU chip when room is on, others are
         present, and the omnibox is in SAY mode. typing → live
         preview, sent → 4s snapshot then fade. --> <div class="fb__bubble" id="fb-bubble" role="status" aria-live="polite" aria-atomic="true" data-state="hidden" hidden data-astro-cid-ozbv6gvd> <span class="fb__bubble-body" id="fb-bubble-body" data-astro-cid-ozbv6gvd></span> <span class="fb__bubble-tail" aria-hidden="true" data-astro-cid-ozbv6gvd></span> </div> <form class="fb__omni" id="fb-omni-form" role="search" autocomplete="off" data-astro-cid-ozbv6gvd> <span class="fb__omni-mode mono" id="fb-omni-mode" aria-hidden="true" data-astro-cid-ozbv6gvd>GO</span> <input class="fb__omni-input mono" type="text" id="fb-omni" name="q" placeholder="ask or go…" aria-label="Ask, go, or say — type a path, /go, ?ask, or @agent" data-astro-cid-ozbv6gvd> <span class="fb__omni-hint mono" aria-hidden="true" data-astro-cid-ozbv6gvd>⌘K</span> </form> <div class="fb__right" data-astro-cid-ozbv6gvd> <div class="fb__kit" role="toolbar" aria-label="PointCast kit" data-astro-cid-ozbv6gvd> `, ' </div> <span class="fb__on-air" aria-label="On air" data-astro-cid-ozbv6gvd> <span class="fb__on-air-dot" aria-hidden="true" data-astro-cid-ozbv6gvd></span> <span class="fb__on-air-label mono" data-astro-cid-ozbv6gvd>ON AIR</span> </span> <button type="button" class="fb__menu-btn" id="fb-menu-btn" aria-haspopup="dialog" aria-expanded="false" aria-controls="fb-menu" aria-label="Open kit binder" data-astro-cid-ozbv6gvd> <span class="fb__menu-glyph" aria-hidden="true" data-astro-cid-ozbv6gvd>≡</span> </button> </div> </div> <div class="fb__tray" id="fb-tray-room" role="dialog" aria-modal="false" aria-label="Room — cursors and chat" hidden data-astro-cid-ozbv6gvd> <div class="fb__tray-arrow" aria-hidden="true" data-astro-cid-ozbv6gvd></div> <header class="fb__tray-head" data-astro-cid-ozbv6gvd> <span class="fb__tray-num mono" data-astro-cid-ozbv6gvd>01</span> <h3 class="fb__tray-title" data-astro-cid-ozbv6gvd>Room</h3> <button type="button" class="fb__tray-close" aria-label="Close" data-astro-cid-ozbv6gvd>×</button> </header> <div class="fb__tray-body" data-astro-cid-ozbv6gvd> <div class="fb__actions" role="toolbar" aria-label="Room actions" data-astro-cid-ozbv6gvd> ', ' </div> <p class="fb__tray-blurb" data-astro-cid-ozbv6gvd>See your noun cursor and chat with whoever else is on the cast right now.</p> <button type="button" class="fb-btn fb-btn--block" id="fb-tray-room-toggle" aria-pressed="true" data-astro-cid-ozbv6gvd> <span class="fb-btn__glyph" aria-hidden="true" data-astro-cid-ozbv6gvd>●</span> <span id="fb-tray-room-label" data-astro-cid-ozbv6gvd>Room: ON</span> </button> <p class="fb__tray-meta mono" data-astro-cid-ozbv6gvd> <span id="fb-tray-room-here" data-astro-cid-ozbv6gvd>—</span> here · cursors + 6-char chat over the omnibox\n</p> </div> </div> <div class="fb__tray" id="fb-tray-ask" role="dialog" aria-modal="false" aria-label="Ask the cast" hidden data-astro-cid-ozbv6gvd> <div class="fb__tray-arrow" aria-hidden="true" data-astro-cid-ozbv6gvd></div> <header class="fb__tray-head" data-astro-cid-ozbv6gvd> <span class="fb__tray-num mono" data-astro-cid-ozbv6gvd>02</span> <h3 class="fb__tray-title" data-astro-cid-ozbv6gvd>Ask the cast</h3> <button type="button" class="fb__tray-close" aria-label="Close" data-astro-cid-ozbv6gvd>×</button> </header> <div class="fb__tray-body" data-astro-cid-ozbv6gvd> <div class="fb__actions" role="toolbar" aria-label="Ask templates" data-astro-cid-ozbv6gvd> ', ' </div> <p class="fb__tray-blurb" data-astro-cid-ozbv6gvd>Goes to the residents inbox. One of us — Claude, Codex, Manus, or Mike — replies on the next session.</p> <form class="fb-ask" id="fb-ask-form" data-astro-cid-ozbv6gvd> <label class="fb-ask__row" data-astro-cid-ozbv6gvd> <span class="fb-ask__label mono" data-astro-cid-ozbv6gvd>TO</span> <select class="fb-ask__to mono" id="fb-ask-to" name="to" data-astro-cid-ozbv6gvd> <option value="cast" data-astro-cid-ozbv6gvd>the cast (anyone)</option> ', ` </select> </label> <textarea class="fb-ask__body" id="fb-ask-body" name="body" rows="3" maxlength="2000" placeholder="what's on your mind…" required data-astro-cid-ozbv6gvd></textarea> <div class="fb-ask__foot" data-astro-cid-ozbv6gvd> <span class="fb-ask__count mono" id="fb-ask-count" data-astro-cid-ozbv6gvd>0 / 2000</span> <span class="fb-ask__seat fb-ask__seat--ai mono" id="fb-ai-seat" data-state="off" title="AI answer mode — wire-up in next sprint. The seat is here; the model isn't plugged in yet." data-astro-cid-ozbv6gvd> <span aria-hidden="true" data-astro-cid-ozbv6gvd>🤖</span> ai · soon
</span> <button type="submit" class="fb-btn fb-btn--send" id="fb-ask-send" data-astro-cid-ozbv6gvd> <span aria-hidden="true" data-astro-cid-ozbv6gvd>↗</span> Send
</button> </div> <p class="fb-ask__status mono" id="fb-ask-status" aria-live="polite" data-astro-cid-ozbv6gvd></p> </form> <section class="fb-echoes" id="fb-echoes" hidden data-astro-cid-ozbv6gvd> <p class="fb-echoes__label mono" data-astro-cid-ozbv6gvd> <span data-astro-cid-ozbv6gvd>YOUR RECENT SENDS</span> <span class="fb-echoes__counts mono" id="fb-echoes-counts" data-astro-cid-ozbv6gvd></span> </p> <ul class="fb-echoes__list" id="fb-echoes-list" data-astro-cid-ozbv6gvd></ul> </section> </div> </div> <div class="fb__tray" id="fb-tray-agent" role="dialog" aria-modal="false" aria-label="Residents — agents on PointCast" hidden data-astro-cid-ozbv6gvd> <div class="fb__tray-arrow" aria-hidden="true" data-astro-cid-ozbv6gvd></div> <header class="fb__tray-head" data-astro-cid-ozbv6gvd> <span class="fb__tray-num mono" data-astro-cid-ozbv6gvd>03</span> <h3 class="fb__tray-title" data-astro-cid-ozbv6gvd>Residents</h3> <button type="button" class="fb__tray-close" aria-label="Close" data-astro-cid-ozbv6gvd>×</button> </header> <div class="fb__tray-body" data-astro-cid-ozbv6gvd> <div class="fb__actions" role="toolbar" aria-label="Agent filters" data-astro-cid-ozbv6gvd> `, ' </div> <p class="fb__tray-blurb" data-astro-cid-ozbv6gvd>Three builders, one director, two open slots. Click a card to ping that agent directly.</p> <ul class="fb-residents" id="fb-residents-list" data-astro-cid-ozbv6gvd> ', ' </ul> <a class="fb-tray__link mono" href="/residents" data-astro-cid-ozbv6gvd>/residents — full roster ↗</a> </div> </div> <div class="fb__tray" id="fb-tray-fed" role="dialog" aria-modal="false" aria-label="Federation peers" hidden data-astro-cid-ozbv6gvd> <div class="fb__tray-arrow" aria-hidden="true" data-astro-cid-ozbv6gvd></div> <header class="fb__tray-head" data-astro-cid-ozbv6gvd> <span class="fb__tray-num mono" data-astro-cid-ozbv6gvd>04</span> <h3 class="fb__tray-title" data-astro-cid-ozbv6gvd>Federation</h3> <button type="button" class="fb__tray-close" aria-label="Close" data-astro-cid-ozbv6gvd>×</button> </header> <div class="fb__tray-body" data-astro-cid-ozbv6gvd> <div class="fb__actions" role="toolbar" aria-label="Federation actions" data-astro-cid-ozbv6gvd> ', ' </div> <p class="fb__tray-blurb" data-astro-cid-ozbv6gvd> <code data-astro-cid-ozbv6gvd>xyz.pointcast.block</code> — the lexicon that lets PointCast cast across the AT network. RFC at <a href="/federation/preview" data-astro-cid-ozbv6gvd>/federation/preview</a>.\n</p> <ul class="fb-peers" id="fb-peers-list" data-astro-cid-ozbv6gvd> ', ` </ul> </div> </div> <!-- 05 BROADCAST tray — read-only studio glimpse, the "what's playing now" panel. --> <div class="fb__tray" id="fb-tray-broadcast" role="dialog" aria-modal="false" aria-label="Broadcast — what's playing now" hidden data-astro-cid-ozbv6gvd> <div class="fb__tray-arrow" aria-hidden="true" data-astro-cid-ozbv6gvd></div> <header class="fb__tray-head" data-astro-cid-ozbv6gvd> <span class="fb__tray-num mono" data-astro-cid-ozbv6gvd>05</span> <h3 class="fb__tray-title" data-astro-cid-ozbv6gvd>Broadcast</h3> <button type="button" class="fb__tray-close" aria-label="Close" data-astro-cid-ozbv6gvd>×</button> </header> <div class="fb__tray-body" data-astro-cid-ozbv6gvd> <div class="fb__actions" role="toolbar" aria-label="Broadcast actions" data-astro-cid-ozbv6gvd> `, ` </div> <p class="fb__tray-blurb" data-astro-cid-ozbv6gvd>The studio glimpse. What's on air, who's tuned in, today's mood. Director controls light up when a known wallet is connected.</p> <div class="fb-bcast" data-astro-cid-ozbv6gvd> <div class="fb-bcast__row" data-astro-cid-ozbv6gvd> <span class="fb-bcast__kicker mono" data-astro-cid-ozbv6gvd>NOW PLAYING</span> <span class="fb-bcast__time mono" id="fb-bcast-time" data-astro-cid-ozbv6gvd>—</span> </div> <a class="fb-bcast__now" id="fb-bcast-now" href="/" title="Open the latest live block" data-astro-cid-ozbv6gvd> <span class="fb-bcast__now-id mono" id="fb-bcast-now-id" data-astro-cid-ozbv6gvd>№ ----</span> <span class="fb-bcast__now-title" id="fb-bcast-now-title" data-astro-cid-ozbv6gvd>loading the front door…</span> <span class="fb-bcast__now-channel mono" id="fb-bcast-now-channel" data-astro-cid-ozbv6gvd></span> </a> <div class="fb-bcast__grid" data-astro-cid-ozbv6gvd> <div class="fb-bcast__cell" data-astro-cid-ozbv6gvd> <span class="fb-bcast__cell-label mono" data-astro-cid-ozbv6gvd>AUDIENCE</span> <span class="fb-bcast__cell-value" id="fb-bcast-here" data-astro-cid-ozbv6gvd>—</span> <span class="fb-bcast__cell-sub mono" data-astro-cid-ozbv6gvd>here right now</span> </div> <div class="fb-bcast__cell" data-astro-cid-ozbv6gvd> <span class="fb-bcast__cell-label mono" data-astro-cid-ozbv6gvd>MOOD</span> <span class="fb-bcast__cell-value" id="fb-bcast-mood" data-astro-cid-ozbv6gvd>—</span> <span class="fb-bcast__cell-sub mono" data-astro-cid-ozbv6gvd>today's setting</span> </div> <div class="fb-bcast__cell" data-astro-cid-ozbv6gvd> <span class="fb-bcast__cell-label mono" data-astro-cid-ozbv6gvd>PEERS</span> <span class="fb-bcast__cell-value" id="fb-bcast-peers" data-astro-cid-ozbv6gvd>—</span> <span class="fb-bcast__cell-sub mono" data-astro-cid-ozbv6gvd>cast network</span> </div> <div class="fb-bcast__cell" data-astro-cid-ozbv6gvd> <span class="fb-bcast__cell-label mono" data-astro-cid-ozbv6gvd>NEXT</span> <span class="fb-bcast__cell-value" id="fb-bcast-next" data-astro-cid-ozbv6gvd>queue stub</span> <span class="fb-bcast__cell-sub mono" data-astro-cid-ozbv6gvd>director schedules later</span> </div> </div> <!-- Director note (visible when DIR mode is OFF) — replaced by
             the inline forms below when DIR mode is ON. --> <p class="fb-bcast__director-note mono" id="fb-bcast-director-note" data-astro-cid-ozbv6gvd>
★ director controls light when <code data-astro-cid-ozbv6gvd>localStorage[pc:director]='1'</code> (or a recognized wallet).
          Try <code data-astro-cid-ozbv6gvd>&gt;director on</code> in the omnibox.
</p> <!-- Director-only inline forms. Hidden by default; shown when
             body[data-director='true'] (toggled by isDirector() at boot
             and by >director on/off). --> <div class="fb-dir-controls" id="fb-dir-controls" hidden data-astro-cid-ozbv6gvd> <form class="fb-dir-form" id="fb-dir-announce-form" data-astro-cid-ozbv6gvd> <span class="fb-dir-form__label mono" data-astro-cid-ozbv6gvd>★ ANNOUNCE</span> <input class="fb-dir-form__input mono" type="text" id="fb-dir-announce-input" maxlength="120" placeholder="one-line announcement to the cast…" aria-label="Announcement message" data-astro-cid-ozbv6gvd> <button type="submit" class="fb-btn fb-btn--send fb-btn--dir" data-astro-cid-ozbv6gvd> <span aria-hidden="true" data-astro-cid-ozbv6gvd>📢</span> send
</button> </form> <form class="fb-dir-form" id="fb-dir-schedule-form" data-astro-cid-ozbv6gvd> <span class="fb-dir-form__label mono" data-astro-cid-ozbv6gvd>★ SCHEDULE</span> <input class="fb-dir-form__input mono" type="text" id="fb-dir-schedule-input" maxlength="200" placeholder="e.g. 0412 09:00 — block id and time" aria-label="Schedule a future block" data-astro-cid-ozbv6gvd> <button type="submit" class="fb-btn fb-btn--send fb-btn--dir" data-astro-cid-ozbv6gvd> <span aria-hidden="true" data-astro-cid-ozbv6gvd>🎬</span> queue
</button> </form> <p class="fb-dir-form__status mono" id="fb-dir-status" aria-live="polite" data-astro-cid-ozbv6gvd></p> <p class="fb-dir-form__note mono" data-astro-cid-ozbv6gvd>
posts to <code data-astro-cid-ozbv6gvd>/api/ping</code> with a <code data-astro-cid-ozbv6gvd>subject</code> tag — residents pick it up next session and either ship it as a block (announce) or honor the schedule. Real broadcast-to-all is a worker sprint.
</p> </div> </div> </div> </div> <!-- 06 CAST tray — Peach-style magic words. Type a name or click a chip,
       a spell renders into the SpellLayer overlay. --> <div class="fb__tray" id="fb-tray-cast" role="dialog" aria-modal="false" aria-label="Cast — magic words" hidden data-astro-cid-ozbv6gvd> <div class="fb__tray-arrow" aria-hidden="true" data-astro-cid-ozbv6gvd></div> <header class="fb__tray-head" data-astro-cid-ozbv6gvd> <span class="fb__tray-num mono" data-astro-cid-ozbv6gvd>06</span> <h3 class="fb__tray-title" data-astro-cid-ozbv6gvd>Cast</h3> <button type="button" class="fb__tray-close" aria-label="Close" data-astro-cid-ozbv6gvd>×</button> </header> <div class="fb__tray-body" data-astro-cid-ozbv6gvd> <div class="fb__actions" role="toolbar" aria-label="Spells" data-astro-cid-ozbv6gvd> `, ' </div> <p class="fb__tray-blurb" data-astro-cid-ozbv6gvd>Peach-style magic words. Click a chip, or type <code data-astro-cid-ozbv6gvd>+confetti</code> in the bar above. Spells live in <code data-astro-cid-ozbv6gvd>src/data/spells.ts</code>.</p> <ul class="fb-spells" data-astro-cid-ozbv6gvd> ', ' </ul> <p class="fb__tray-meta mono" data-astro-cid-ozbv6gvd>type <code data-astro-cid-ozbv6gvd>+&lt;name&gt;</code> in the bar · companions auto-dismiss · click ambient surfaces to snuff</p> </div> </div> <div class="fb__menu" id="fb-menu" role="dialog" aria-modal="false" aria-label="PointCast kit binder" hidden data-astro-cid-ozbv6gvd> <div class="fb__menu-scrim" id="fb-menu-scrim" aria-hidden="true" data-astro-cid-ozbv6gvd></div> <div class="fb__menu-panel" id="fb-menu-panel" tabindex="-1" data-astro-cid-ozbv6gvd> <button type="button" class="fb__menu-close" id="fb-menu-close" aria-label="Close binder" data-astro-cid-ozbv6gvd>×</button> <section class="fb-you-section" data-astro-cid-ozbv6gvd> <div class="fb-you-card" data-astro-cid-ozbv6gvd> <img class="fb-you-card__noun" id="fb-menu-noun"', ' alt="Your noun" width="56" height="56" data-astro-cid-ozbv6gvd> <div class="fb-you-card__body" data-astro-cid-ozbv6gvd> <p class="fb-you-card__kicker mono" data-astro-cid-ozbv6gvd>YOU</p> <p class="fb-you-card__name" id="fb-menu-name" data-astro-cid-ozbv6gvd>visitor · noun ', '</p> <p class="fb-you-card__meta mono" id="fb-menu-wallet-status" data-astro-cid-ozbv6gvd>no wallet connected</p> </div> </div> <div class="fb-you-actions" data-astro-cid-ozbv6gvd> <button type="button" class="fb-btn" id="fb-btn-wallet" data-astro-cid-ozbv6gvd>Connect wallet (Beacon)</button> <a class="fb-btn fb-btn--ghost" href="/profile" data-astro-cid-ozbv6gvd>View profile</a> </div> </section> <section class="fb-controls" data-astro-cid-ozbv6gvd> <label class="fb-ctrl" data-astro-cid-ozbv6gvd> <span class="fb-ctrl__name mono" data-astro-cid-ozbv6gvd>MOOD</span> <select class="fb-ctrl__input mono" id="fb-mood-select" data-astro-cid-ozbv6gvd> <option value="" data-astro-cid-ozbv6gvd>— choose —</option> </select> </label> <button type="button" class="fb-btn fb-btn--soundtrack" id="fb-btn-soundtrack" data-astro-cid-ozbv6gvd> <span class="fb-btn__glyph" aria-hidden="true" data-astro-cid-ozbv6gvd>▶</span> <span id="fb-soundtrack-label" data-astro-cid-ozbv6gvd>Soundtrack off</span> </button> <!-- Mood casts: when on, picking a mood also casts a thematic\n             ambient spell on the page. See src/data/mood-spells.ts. --> <label class="fb-ctrl fb-ctrl--row" data-astro-cid-ozbv6gvd> <input type="checkbox" id="fb-auto-cast" class="fb-ctrl__check" checked data-astro-cid-ozbv6gvd> <span class="fb-ctrl__name mono" data-astro-cid-ozbv6gvd>AUTO-CAST ON MOOD</span> <span class="fb-ctrl__hint mono" id="fb-auto-cast-hint" data-astro-cid-ozbv6gvd>marine layer → +rain · quiet → +breath · …</span> </label> </section> <div class="fb__soundtrack" id="fb-soundtrack" data-astro-transition-persist="pc-soundtrack" hidden data-astro-cid-ozbv6gvd></div> <section class="fb-binder" data-astro-cid-ozbv6gvd> <p class="fb-binder__label mono" data-astro-cid-ozbv6gvd>KIT — ', " / ", ' collected</p> <ul class="fb-binder__grid" data-astro-cid-ozbv6gvd> ', ' </ul> </section> <section class="fb-routes" data-astro-cid-ozbv6gvd> <div class="fb-routes__group" data-astro-cid-ozbv6gvd> <p class="fb-routes__label mono" data-astro-cid-ozbv6gvd>ROOMS</p> <div class="fb-routes__links" data-astro-cid-ozbv6gvd> <a href="/tonight" data-astro-cid-ozbv6gvd>tonight</a> <a href="/room" data-astro-cid-ozbv6gvd>room</a> <a href="/meditate" data-astro-cid-ozbv6gvd>meditate</a> <a href="/bath" data-astro-cid-ozbv6gvd>bath</a> </div> </div> <div class="fb-routes__group" data-astro-cid-ozbv6gvd> <p class="fb-routes__label mono" data-astro-cid-ozbv6gvd>GAMES</p> <div class="fb-routes__links" data-astro-cid-ozbv6gvd> <a href="/farm" data-astro-cid-ozbv6gvd>farm</a> <a href="/agent-derby" data-astro-cid-ozbv6gvd>derby</a> <a href="/battle" data-astro-cid-ozbv6gvd>battle</a> <a href="/nouns-open-circuit" data-astro-cid-ozbv6gvd>circuit</a> <a href="/yee" data-astro-cid-ozbv6gvd>yee</a> <a href="/nouns-cola-crush" data-astro-cid-ozbv6gvd>cola</a> <a href="/collabs/relay" data-astro-cid-ozbv6gvd>relay</a> </div> </div> <div class="fb-routes__group" data-astro-cid-ozbv6gvd> <p class="fb-routes__label mono" data-astro-cid-ozbv6gvd>AGENTS</p> <div class="fb-routes__links" data-astro-cid-ozbv6gvd> <a href="/for-agents" data-astro-cid-ozbv6gvd>for-agents</a> <a href="/agents.json" data-astro-cid-ozbv6gvd>agents.json</a> <a href="/llms.txt" data-astro-cid-ozbv6gvd>llms.txt</a> <a href="/explore" data-astro-cid-ozbv6gvd>explore</a> <a href="/knock" data-astro-cid-ozbv6gvd>knock</a> <a href="/status" data-astro-cid-ozbv6gvd>status</a> </div> </div> <div class="fb-routes__group" data-astro-cid-ozbv6gvd> <p class="fb-routes__label mono" data-astro-cid-ozbv6gvd>RELEASE</p> <div class="fb-routes__links" data-astro-cid-ozbv6gvd> <a href="/gamgee" data-astro-cid-ozbv6gvd>gamgee (RC0)</a> <a href="/sprints" data-astro-cid-ozbv6gvd>sprints</a> <a href="/now" data-astro-cid-ozbv6gvd>now</a> </div> </div> </section> <footer class="fb-live mono" data-astro-cid-ozbv6gvd> <span class="fb-live__dot" aria-hidden="true" data-astro-cid-ozbv6gvd></span> <span id="fb-live-copy" data-astro-cid-ozbv6gvd>marine layer · el segundo · <span id="fb-live-here" data-astro-cid-ozbv6gvd>—</span> here</span> <a class="fb-live__link" href="https://github.com/mhoydich/pointcast" target="_blank" rel="noopener" data-astro-cid-ozbv6gvd>github ↗</a> </footer> </div> </div> </aside> <script>', `<\/script> <script>
  (function () {
    'use strict';

    var $bar       = document.getElementById('pc-fb');
    var $you       = document.getElementById('fb-you');
    var $menuBtn   = document.getElementById('fb-menu-btn');
    var $menu      = document.getElementById('fb-menu');
    var $panel     = document.getElementById('fb-menu-panel');
    var $scrim     = document.getElementById('fb-menu-scrim');
    var $close     = document.getElementById('fb-menu-close');
    var $omni      = document.getElementById('fb-omni');
    var $omniForm  = document.getElementById('fb-omni-form');
    var $omniMode  = document.getElementById('fb-omni-mode');
    var $moodLabel = document.getElementById('fb-mood-label');
    var $youLabel  = document.getElementById('fb-you-label');
    var $noun      = document.getElementById('fb-noun');
    var $menuNoun  = document.getElementById('fb-menu-noun');
    var $menuName  = document.getElementById('fb-menu-name');
    var $menuWallet = document.getElementById('fb-menu-wallet-status');
    var $walletBtn = document.getElementById('fb-btn-wallet');
    var $moodSelect = document.getElementById('fb-mood-select');
    var $soundBtn  = document.getElementById('fb-btn-soundtrack');
    var $soundLabel = document.getElementById('fb-soundtrack-label');
    var $soundtrack = document.getElementById('fb-soundtrack');
    var $liveHere  = document.getElementById('fb-live-here');

    if (!$bar || !$menu) return;

    try {
      var st = window.PC_SOUNDTRACKS || {};
      Object.keys(st).forEach(function (k) {
        var opt = document.createElement('option');
        opt.value = k;
        opt.textContent = (st[k].label || k).toLowerCase();
        $moodSelect.appendChild(opt);
      });
    } catch (e) {}

    var openPopover = null;
    var lastFocused = null;

    function getTrayEl(id) { return document.getElementById('fb-tray-' + id); }
    function getStampEl(id) { return document.getElementById('fb-stamp-' + id); }

    function closeAll() {
      if ($menu.getAttribute('data-open') === 'true') {
        $menu.setAttribute('data-open', 'false');
        setTimeout(function () { $menu.hidden = true; }, 220);
        $menuBtn.setAttribute('aria-expanded', 'false');
        $you.setAttribute('aria-expanded', 'false');
      }
      document.querySelectorAll('.fb__tray').forEach(function (tr) {
        if (tr.getAttribute('data-open') === 'true') {
          tr.setAttribute('data-open', 'false');
          setTimeout(function () { tr.hidden = true; }, 200);
          var stampId = tr.id.replace('fb-tray-', '');
          var st = getStampEl(stampId);
          if (st) st.setAttribute('aria-expanded', 'false');
        }
      });
      openPopover = null;
      document.removeEventListener('keydown', onEsc);
      if (lastFocused && typeof lastFocused.focus === 'function') {
        try { lastFocused.focus(); } catch (e) {}
      }
    }

    function onEsc(e) {
      if (e.key === 'Escape') { e.preventDefault(); closeAll(); }
    }

    function openMenu() {
      closeAll();
      lastFocused = document.activeElement;
      $menu.hidden = false;
      void $menu.offsetWidth;
      $menu.setAttribute('data-open', 'true');
      $menuBtn.setAttribute('aria-expanded', 'true');
      $you.setAttribute('aria-expanded', 'true');
      setTimeout(function () { try { $panel.focus(); } catch (e) {} }, 10);
      openPopover = 'menu';
      document.addEventListener('keydown', onEsc);
    }

    function openTray(id) {
      var tray = getTrayEl(id);
      var stamp = getStampEl(id);
      if (!tray || !stamp) return;
      closeAll();
      lastFocused = document.activeElement;
      tray.hidden = false;
      void tray.offsetWidth;
      tray.setAttribute('data-open', 'true');
      stamp.setAttribute('aria-expanded', 'true');
      try {
        var rect = stamp.getBoundingClientRect();
        var trayWidth = tray.getBoundingClientRect().width || 320;
        var winWidth = window.innerWidth;
        var center = rect.left + rect.width / 2;
        var leftPx = Math.max(8, Math.min(center - trayWidth / 2, winWidth - trayWidth - 8));
        tray.style.left = leftPx + 'px';
        tray.style.right = 'auto';
        var arrow = tray.querySelector('.fb__tray-arrow');
        if (arrow) arrow.style.left = (center - leftPx) + 'px';
      } catch (e) {}
      setTimeout(function () {
        var focusable = tray.querySelector('input, textarea, button, select, a[href]');
        if (focusable) try { focusable.focus(); } catch (e) {}
      }, 30);
      openPopover = 'tray:' + id;
      document.addEventListener('keydown', onEsc);
      // Per-tray on-open hooks (defined later in the IIFE; hoisted because
      // they're function declarations).
      try {
        if (id === 'ask') {
          renderEchoes();
          reconcileEchoes();
        } else if (id === 'agent') {
          refreshAgentActivity();
        }
      } catch (e) {}
    }

    document.querySelectorAll('.fb__stamp').forEach(function (st) {
      st.addEventListener('click', function () {
        var id = st.getAttribute('data-stamp-id');
        if (openPopover === 'tray:' + id) closeAll();
        else openTray(id);
      });
    });
    document.querySelectorAll('.fb-binder__open').forEach(function (bc) {
      bc.addEventListener('click', function () {
        var id = bc.getAttribute('data-tray');
        closeAll();
        setTimeout(function () { openTray(id); }, 240);
      });
    });
    document.querySelectorAll('.fb__tray-close').forEach(function (btn) {
      btn.addEventListener('click', closeAll);
    });

    document.addEventListener('mousedown', function (e) {
      if (!openPopover) return;
      var t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest('.fb__tray') || t.closest('.fb__menu-panel') ||
          t.closest('.fb__stamp') || t.closest('.fb-binder__open') ||
          t.closest('#fb-menu-btn') || t.closest('#fb-you')) return;
      closeAll();
    });

    $menuBtn.addEventListener('click', function () {
      if (openPopover === 'menu') closeAll();
      else openMenu();
    });
    $you.addEventListener('click', function () {
      if (openPopover === 'menu') closeAll();
      else openMenu();
    });
    $close.addEventListener('click', closeAll);
    $scrim.addEventListener('click', closeAll);

    var KIT = window.PC_DOCK_KIT || [];

    document.addEventListener('keydown', function (e) {
      var meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        $omni.focus();
        $omni.select();
        return;
      }
      if (e.key >= '1' && e.key <= '9') {
        var idx = Number(e.key) - 1;
        if (KIT[idx]) {
          e.preventDefault();
          openTray(KIT[idx].id);
        }
      }
    });

    function inferOmniMode(value) {
      var v = String(value || '').trim();
      if (!v) return roomOn ? 'SAY' : 'GO';
      if (v.charAt(0) === '+') return 'CAST';
      if (v.charAt(0) === '>') return 'OP';
      if (v.charAt(0) === '?') return 'ASK';
      if (v.charAt(0) === '@') return 'AGT';
      if (v.charAt(0) === '/' || /^https?:\\/\\//.test(v)) return 'GO';
      if (roomOn) return 'SAY';
      return 'GO';
    }

    function applyOmniMode() {
      if (!$omniMode) return;
      var mode = inferOmniMode($omni.value);
      $omniMode.textContent = mode;
      $omniMode.setAttribute('data-mode', mode.toLowerCase());
    }

    $omni.addEventListener('input', function () {
      applyOmniMode();
      try { syncBubbleFromInput(); } catch (e) {}
    });
    $omni.addEventListener('focus', function () {
      applyOmniMode();
      try { syncBubbleFromInput(); } catch (e) {}
    });
    $omni.addEventListener('blur', function () {
      // Hide if not in a sent-snapshot window. Empty input still clears.
      if (!bubbleState.persistUntil || Date.now() >= bubbleState.persistUntil) {
        if (!String($omni.value || '').trim()) hideBubble();
      }
    });

    $omniForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var raw = String($omni.value || '').trim();
      if (!raw) return;
      var mode = inferOmniMode(raw);
      if (mode === 'CAST') {
        // Magic word — \`+confetti\`, \`+cat\`, \`+breath\`, \`+candle\`, \`+clear\`.
        // Strip the prefix, take first word, emit pc:spell:cast.
        var spellId = raw.replace(/^\\+\\s*/, '').split(/\\s+/)[0].toLowerCase();
        if (spellId === 'clear') {
          window.dispatchEvent(new CustomEvent('pc:spell:clear'));
        } else if (spellId) {
          window.dispatchEvent(new CustomEvent('pc:spell:cast', { detail: { id: spellId } }));
        }
        $omni.value = '';
        applyOmniMode();
        return;
      }
      if (mode === 'OP') {
        // Operator command — \`>cmd args\`. Mike 2026-05-01: director mode
        // kickoff. Recognized commands run for real; unrecognized soft-
        // toast in the placeholder so the user sees the parse.
        var rest = raw.replace(/^>\\s*/, '').trim();
        var parts = rest.split(/\\s+/);
        var cmd = (parts.shift() || '').toLowerCase();
        var args = parts.join(' ');
        var ack = runOperatorCommand(cmd, args);
        window.dispatchEvent(new CustomEvent('pc:dock:operator', { detail: { cmd: cmd, args: args, raw: rest } }));
        // Soft toast in the omnibox placeholder so user gets feedback.
        var prevPlaceholder = $omni.placeholder;
        $omni.value = '';
        $omni.placeholder = ack;
        applyOmniMode();
        setTimeout(function () { $omni.placeholder = prevPlaceholder; }, 3000);
        return;
      }
      if (mode === 'ASK') {
        var body = raw.replace(/^\\?\\s*/, '');
        openTray('ask');
        var tb = document.getElementById('fb-ask-body');
        if (tb) { tb.value = body; tb.dispatchEvent(new Event('input')); }
        $omni.value = '';
        applyOmniMode();
        return;
      }
      if (mode === 'AGT') {
        openTray('agent');
        var slug = raw.replace(/^@\\s*/, '').split(/\\s+/)[0].toLowerCase();
        var btn = document.querySelector('.fb-resident__btn[data-ping-slug="' + slug + '"]');
        if (btn) btn.click();
        $omni.value = '';
        applyOmniMode();
        return;
      }
      if (mode === 'SAY') {
        window.dispatchEvent(new CustomEvent('pc:room:chat', { detail: { msg: raw } }));
        // Snapshot the sent message into the bubble for ~4s if anyone
        // else is here to read it. Same gates as live-typing preview.
        try {
          if (roomOn && bubbleState.othersPresent) showBubble(raw, 4000);
          else hideBubble();
        } catch (e) {}
        $omni.value = '';
        $omni.placeholder = 'say something…';
        applyOmniMode();
        return;
      }
      if (raw.startsWith('/') || /^https?:\\/\\//.test(raw)) {
        window.location.href = raw;
        return;
      }
      var maybe = '/' + raw.replace(/^\\/+/, '').split(/\\s+/)[0];
      window.location.href = '/search?q=' + encodeURIComponent(raw) + '&from=' + encodeURIComponent(maybe);
    });

    var roomOn = true;
    try {
      var v = localStorage.getItem('pc:room:on');
      if (v === '0') roomOn = false;
      else if (v === '1') roomOn = true;
      else roomOn = true;
    } catch (e) {}

    function applyRoomUI() {
      var stamp = getStampEl('room');
      if (stamp) stamp.setAttribute('data-on', roomOn ? 'true' : 'false');
      var dot = document.getElementById('fb-stamp-dot-room');
      if (dot) dot.setAttribute('data-state', roomOn ? 'on' : 'off');
      if ($omni) $omni.placeholder = roomOn ? 'say something…' : 'ask or go…';
      var label = document.getElementById('fb-tray-room-label');
      var btn = document.getElementById('fb-tray-room-toggle');
      if (label) label.textContent = roomOn ? 'Room: ON' : 'Room: OFF';
      if (btn) btn.setAttribute('aria-pressed', roomOn ? 'true' : 'false');
      applyOmniMode();
      // Bubble follows room state — turning room off clears any pending
      // bubble; turning it on does nothing yet (waits for input).
      if (!roomOn) try { hideBubble(); } catch (e) {}
    }

    var $roomToggleBtn = document.getElementById('fb-tray-room-toggle');
    if ($roomToggleBtn) {
      $roomToggleBtn.addEventListener('click', function () {
        roomOn = !roomOn;
        try { localStorage.setItem('pc:room:on', roomOn ? '1' : '0'); } catch (e) {}
        applyRoomUI();
        window.dispatchEvent(new CustomEvent('pc:room:toggle', { detail: { on: roomOn } }));
      });
    }
    applyRoomUI();

    var $askForm = document.getElementById('fb-ask-form');
    var $askBody = document.getElementById('fb-ask-body');
    var $askTo   = document.getElementById('fb-ask-to');
    var $askCount = document.getElementById('fb-ask-count');
    var $askStatus = document.getElementById('fb-ask-status');
    var $echoes      = document.getElementById('fb-echoes');
    var $echoesList  = document.getElementById('fb-echoes-list');
    var $echoesCount = document.getElementById('fb-echoes-counts');

    if ($askBody && $askCount) {
      $askBody.addEventListener('input', function () {
        $askCount.textContent = String($askBody.value.length) + ' / 2000';
      });
    }

    // ─── Echoes — visible round-trip for ASK ──────────────────────
    // Mike 2026-04-29 sprint: "fun just started interacting" → make
    // the loop visible. Each send is stashed in localStorage; when the
    // ASK tray opens we re-render and check /blocks.json for any block
    // whose \`source\` references a stashed ping key — those flip to
    // "answered" with a link to the block.
    var ECHOES_KEY = 'pc:ask:echoes';
    var ECHOES_MAX = 6;

    function loadEchoes() {
      try {
        var raw = localStorage.getItem(ECHOES_KEY);
        var arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch (e) { return []; }
    }
    function saveEchoes(arr) {
      try { localStorage.setItem(ECHOES_KEY, JSON.stringify(arr.slice(-ECHOES_MAX))); } catch (e) {}
    }
    function addEcho(echo) {
      var arr = loadEchoes();
      arr.push(echo);
      saveEchoes(arr);
    }
    function shortTime(ts) {
      try {
        var d = new Date(ts);
        var hh = String(d.getHours()).padStart(2, '0');
        var mm = String(d.getMinutes()).padStart(2, '0');
        return hh + ':' + mm;
      } catch (e) { return '—'; }
    }
    function renderEchoes() {
      if (!$echoes || !$echoesList) return;
      var arr = loadEchoes();
      if (!arr.length) {
        $echoes.hidden = true;
        return;
      }
      $echoes.hidden = false;
      var answered = arr.filter(function (e) { return e.status === 'answered'; }).length;
      if ($echoesCount) {
        $echoesCount.textContent = answered + ' / ' + arr.length + ' answered';
      }
      function escapeHtml(str) {
        return String(str || '').replace(/[<>&"]/g, function (c) {
          return c === '<' ? '&lt;'
               : c === '>' ? '&gt;'
               : c === '&' ? '&amp;'
               : '&quot;';
        });
      }
      $echoesList.innerHTML = arr.slice().reverse().map(function (e) {
        var pill = e.status === 'answered'
          ? ('<a class="fb-echo__pill fb-echo__pill--answered mono" href="' + (e.blockHref || '#') + '">✓ answered</a>')
          : '<span class="fb-echo__pill fb-echo__pill--sent mono">● sent</span>';
        // Mike 2026-05-02: when a block has answered an ASK, render the
        // reply text inline as a parchment quote — closes the round-trip
        // loop visually all the way around. Body cap at 220 chars; click
        // through to the block for the rest.
        var reply = '';
        if (e.status === 'answered' && (e.blockBody || e.blockTitle)) {
          var title = escapeHtml(e.blockTitle || '');
          var bodyText = String(e.blockBody || '');
          var truncated = bodyText.length > 220;
          var bodyEsc = escapeHtml(bodyText.slice(0, 220)) + (truncated ? '…' : '');
          var author = escapeHtml(e.blockAuthor || 'cast');
          var blockId = escapeHtml(e.blockId || '');
          reply =
            '<div class="fb-echo__reply">' +
              '<a class="fb-echo__reply-link" href="' + (e.blockHref || '#') + '">' +
                '<span class="fb-echo__reply-kicker mono">' + author + ' replied · № ' + blockId + '</span>' +
                (title ? '<span class="fb-echo__reply-title">' + title + '</span>' : '') +
                '<span class="fb-echo__reply-body">' + bodyEsc + '</span>' +
                (truncated ? '<span class="fb-echo__reply-more mono">read full block ↗</span>' : '') +
              '</a>' +
            '</div>';
        }
        return '<li class="fb-echo">' +
          '<div class="fb-echo__row">' +
            '<span class="fb-echo__time mono">' + shortTime(e.ts) + '</span>' +
            '<span class="fb-echo__to mono">→ ' + escapeHtml(e.to || 'cast') + '</span>' +
            '<span class="fb-echo__body">' + escapeHtml(e.body || '') + '</span>' +
            pill +
          '</div>' +
          reply +
          '</li>';
      }).join('');
    }

    // ─── AGENT stamp activity ──────────────────────────────────────
    // The 03 AGENT stamp gets a green "live" dot when residents are
    // active. Reads /agents.json (the agent-readable manifest), counts
    // entries with status='resident'/'live'/'director'. Cheap, fails
    // silent. Heuristic: 1 live = on, 2+ = busy (pulsing).
    var AGENT_ACTIVITY_TTL = 10 * 60 * 1000;
    var agentActivityCache = { ts: 0, data: null };
    async function refreshAgentActivity() {
      var dot = document.getElementById('fb-stamp-dot-agent');
      if (!dot) return;
      try {
        var now = Date.now();
        var data;
        if (agentActivityCache.data && (now - agentActivityCache.ts) < AGENT_ACTIVITY_TTL) {
          data = agentActivityCache.data;
        } else {
          var r = await fetch('/agents.json', { cache: 'no-store' });
          if (!r.ok) return;
          data = await r.json();
          agentActivityCache = { ts: now, data: data };
        }
        var residents = (data && data.residents) || (data && data.agents) || [];
        var liveCount = 0;
        for (var i = 0; i < residents.length; i++) {
          var x = residents[i];
          if (x && (x.status === 'resident' || x.status === 'live' || x.status === 'director')) liveCount++;
        }
        if (liveCount >= 2) {
          dot.setAttribute('data-state', 'busy');
        } else if (liveCount >= 1) {
          dot.setAttribute('data-state', 'on');
        } else {
          dot.setAttribute('data-state', 'off');
        }
      } catch (e) {}
    }

    // Cross-check echoes against published blocks. If a block's \`source\`
    // string contains the ping key from any echo, mark it answered.
    var ECHO_BLOCKS_TTL = 60 * 1000;
    var echoBlocksCache = { ts: 0, data: null };
    async function reconcileEchoes() {
      var arr = loadEchoes();
      // Mike 2026-05-02: also re-process answered-but-missing-body echoes
      // so old localStorage entries from before reply-rendering shipped
      // get backfilled with title/body/author on next load.
      var pending = arr.filter(function (e) {
        if (!e.key) return false;
        if (e.status !== 'answered') return true;
        return !e.blockBody && !e.blockTitle;
      });
      if (!pending.length) return;
      try {
        var now = Date.now();
        var data;
        if (echoBlocksCache.data && (now - echoBlocksCache.ts) < ECHO_BLOCKS_TTL) {
          data = echoBlocksCache.data;
        } else {
          var r = await fetch('/blocks.json', { cache: 'no-store' });
          if (!r.ok) return;
          data = await r.json();
          echoBlocksCache = { ts: now, data: data };
        }
        var blocks = Array.isArray(data) ? data : (data && data.blocks) || [];
        var changed = false;
        for (var i = 0; i < arr.length; i++) {
          var echo = arr[i];
          if (!echo.key) continue;
          // Skip echoes that are already fully answered with body data.
          if (echo.status === 'answered' && (echo.blockBody || echo.blockTitle)) continue;
          for (var j = 0; j < blocks.length; j++) {
            var b = blocks[j];
            var src = (b && b.source) || '';
            if (typeof src === 'string' && src.indexOf(echo.key) !== -1) {
              echo.status = 'answered';
              echo.blockId = b.id;
              echo.blockHref = '/b/' + b.id;
              // Mike 2026-05-02: stash enough of the reply to render
              // it inline in the echo card. Cap body at 320 chars in
              // storage; render-time truncates further.
              echo.blockTitle = String(b.title || '').slice(0, 80);
              echo.blockBody = String(b.body || b.dek || '').slice(0, 320);
              echo.blockAuthor = String(b.author || 'cast').slice(0, 20);
              changed = true;
              break;
            }
          }
        }
        if (changed) {
          saveEchoes(arr);
          renderEchoes();
        }
      } catch (e) {}
    }

    if ($askForm) {
      $askForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var body = String($askBody.value || '').trim();
        if (!body) return;
        var to = $askTo.value || 'cast';
        $askStatus.textContent = 'sending…';
        $askStatus.setAttribute('data-state', 'pending');
        var expand = $askForm.getAttribute('data-expand') === 'true';
        var addr = '';
        try { addr = localStorage.getItem('pc:wallet-active') || ''; } catch (e) {}
        var payload = {
          type: 'pc-ping-v1',
          subject: 'ask · footer · → ' + to,
          body: body,
          from: addr ? ('wallet ' + addr.slice(0, 6) + '…' + addr.slice(-4) + ' (footer/ask)') : 'visitor (footer/ask)',
          timestamp: new Date().toISOString(),
        };
        if (addr) payload.address = addr;
        if (expand) payload.expand = true;
        try {
          var res = await fetch('/api/ping', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            $askStatus.textContent = expand
              ? 'sent · expand flag set — cc drafts a block on next read.'
              : 'sent. one of us picks this up next session.';
            $askStatus.setAttribute('data-state', 'ok');
            try {
              var payload = await res.clone().json();
              addEcho({
                key: payload && payload.key ? String(payload.key) : '',
                ts: new Date().toISOString(),
                to: to,
                body: body.slice(0, 140),
                status: 'sent',
              });
            } catch (e) {}
            $askBody.value = '';
            if ($askCount) $askCount.textContent = '0 / 2000';
            $askForm.removeAttribute('data-expand');
            renderEchoes();
          } else if (res.status === 503) {
            $askStatus.textContent = 'inbox not bound on this preview — try pointcast.xyz';
            $askStatus.setAttribute('data-state', 'warn');
          } else {
            $askStatus.textContent = 'send failed (' + res.status + '). try again.';
            $askStatus.setAttribute('data-state', 'err');
          }
        } catch (err) {
          $askStatus.textContent = 'network error — try again.';
          $askStatus.setAttribute('data-state', 'err');
        }
      });
    }

    document.querySelectorAll('.fb-resident__btn').forEach(function (rbtn) {
      rbtn.addEventListener('click', function () {
        var slug = rbtn.getAttribute('data-ping-slug');
        if (!slug) return;
        openTray('ask');
        if ($askTo) {
          var opts = $askTo.options;
          for (var i = 0; i < opts.length; i++) {
            if (opts[i].value === slug) { $askTo.selectedIndex = i; break; }
          }
        }
        if ($askBody) try { $askBody.focus(); } catch (e) {}
      });
    });

    function refreshWalletUI() {
      try {
        var wallets = JSON.parse(localStorage.getItem('pc:wallets') || '[]');
        var activeAddr = localStorage.getItem('pc:wallet-active');
        var active = null;
        if (activeAddr && Array.isArray(wallets)) {
          for (var i = 0; i < wallets.length; i++) {
            if (wallets[i] && wallets[i].address === activeAddr) { active = wallets[i]; break; }
          }
        }
        if (active && active.address) {
          var short = active.address.slice(0, 6) + '…' + active.address.slice(-4);
          $menuWallet.textContent = 'wallet · ' + short + (active.provider ? ' · ' + active.provider : '');
          $walletBtn.textContent = 'Disconnect';
          $walletBtn.setAttribute('data-state', 'connected');
          $menuName.textContent = short;
          $youLabel.textContent = short.slice(0, 7);
        } else {
          $menuWallet.textContent = 'no wallet connected';
          $walletBtn.textContent = 'Connect wallet (Beacon)';
          $walletBtn.setAttribute('data-state', 'disconnected');
          $youLabel.textContent = 'visitor';
        }
      } catch (e) {}
    }
    $walletBtn.addEventListener('click', function () {
      var state = $walletBtn.getAttribute('data-state');
      var chipBtn = document.querySelector('.wallet-chip__btn');
      if (state === 'connected' && chipBtn) { chipBtn.click(); return; }
      if (chipBtn) { chipBtn.click(); return; }
      window.location.href = '/profile';
    });
    window.addEventListener('pc:wallet-change', refreshWalletUI);
    refreshWalletUI();

    $moodSelect.addEventListener('change', function () {
      var k = $moodSelect.value;
      if (!k) return;
      window.dispatchEvent(new CustomEvent('pc:mood-changed', { detail: { moodId: k } }));
      var st = (window.PC_SOUNDTRACKS || {})[k];
      if (st && st.label) {
        $moodLabel.textContent = String(st.label).toLowerCase();
        $soundLabel.textContent = 'Play ' + String(st.label).toLowerCase();
      }
      try { localStorage.setItem('pc:music:mood', k); } catch (e) {}
    });
    window.addEventListener('pc:mood-changed', function (e) {
      var k = e && e.detail && e.detail.moodId;
      if (!k) return;
      $moodSelect.value = k;
      var st = (window.PC_SOUNDTRACKS || {})[k];
      if (st && st.label) $moodLabel.textContent = String(st.label).toLowerCase();
      // Mike 2026-05-02: mood-spells. Cast a thematically-matched
      // spell when the mood changes. Silent no-op if SpellLayer
      // isn't mounted on this page or if auto-cast is off. Clears
      // any current ambient first so we don't pile candles + rain
      // on top of each other.
      try { castMoodSpell(k, /* fromUserChange */ true); } catch (err) {}
    });

    // Read auto-cast pref. Defaults ON for first-time visitors —
    // the whole point is "the dock becomes a room dial". Visitors
    // who want a quiet page flip it off in the binder.
    function autoCastEnabled() {
      try {
        var v = localStorage.getItem('pc:dock:auto-cast');
        if (v === '0') return false;
        return true; // default '1' (also covers null on first visit)
      } catch (e) { return true; }
    }
    function setAutoCast(on) {
      try { localStorage.setItem('pc:dock:auto-cast', on ? '1' : '0'); } catch (e) {}
      var $cb = document.getElementById('fb-auto-cast');
      if ($cb) $cb.checked = !!on;
      // If turning off, clear any active ambient. If turning on, cast
      // the current mood's spell (if any) so the page reflects state.
      if (!on) {
        window.dispatchEvent(new CustomEvent('pc:spell:clear'));
      } else {
        try {
          var mid = localStorage.getItem('pc:music:mood');
          if (mid) castMoodSpell(mid, false);
        } catch (e) {}
      }
    }
    // Wire the checkbox + initial sync.
    (function () {
      var $cb = document.getElementById('fb-auto-cast');
      if (!$cb) return;
      $cb.checked = autoCastEnabled();
      $cb.addEventListener('change', function () { setAutoCast($cb.checked); });
    })();

    // Operator command: \`>autocast on/off\`. Listen on pc:dock:operator
    // so this stays decoupled from runOperatorCommand (which lives in
    // PR #318's director mode work). When #318 merges, the case can
    // also be added there for placeholder-toast accuracy.
    window.addEventListener('pc:dock:operator', function (e) {
      var d = e && e.detail;
      if (!d || d.cmd !== 'autocast') return;
      var v = String(d.args || '').trim().toLowerCase();
      if (v === 'on' || v === '1' || v === 'enable')   setAutoCast(true);
      else if (v === 'off' || v === '0' || v === 'disable') setAutoCast(false);
      else setAutoCast(!autoCastEnabled()); // bare \`>autocast\` toggles
      // Override the stub ack with something honest.
      try {
        var prev = $omni.placeholder;
        $omni.placeholder = '> autocast ' + (autoCastEnabled() ? 'on · mood drives spells' : 'off · spells stay silent');
        setTimeout(function () { $omni.placeholder = prev; }, 2400);
      } catch (er) {}
    });
    function castMoodSpell(moodId, fromUserChange) {
      if (!autoCastEnabled()) return;
      var spellId = (window.PC_MOOD_SPELLS || {})[moodId];
      if (!spellId) return;
      // Clear any currently-cast ambient so the new mood takes over
      // rather than stacking.
      window.dispatchEvent(new CustomEvent('pc:spell:clear'));
      // Tiny delay so the clear-all completes its DOM removals before
      // the new spell renders. Smoother visual transition.
      setTimeout(function () {
        window.dispatchEvent(new CustomEvent('pc:spell:cast', { detail: { id: spellId, source: fromUserChange ? 'mood-change' : 'mood-replay' } }));
      }, fromUserChange ? 240 : 0);
    }

    try {
      var prior = localStorage.getItem('pc:music:mood');
      if (prior && (window.PC_SOUNDTRACKS || {})[prior]) {
        $moodSelect.value = prior;
        $moodLabel.textContent = (window.PC_SOUNDTRACKS[prior].label || prior).toLowerCase();
        // Replay the mood's spell on page load (if auto-cast is on).
        // Delay long enough for SpellLayer to register its listeners.
        setTimeout(function () { try { castMoodSpell(prior, false); } catch (e) {} }, 1800);
      }
    } catch (e) {}

    $soundBtn.addEventListener('click', function () {
      var k = $moodSelect.value;
      if (!k) {
        $soundLabel.textContent = 'pick a mood first';
        return;
      }
      var st = (window.PC_SOUNDTRACKS || {})[k];
      if (!st || !st.url) { $soundLabel.textContent = 'no soundtrack for this mood'; return; }
      if ($soundtrack.hidden) {
        $soundtrack.hidden = false;
        $soundtrack.innerHTML = '<iframe src="' + st.url + '" width="100%" height="80" frameborder="0" allow="autoplay; encrypted-media" loading="lazy" title="PointCast soundtrack"></iframe>';
        $soundLabel.textContent = 'Playing · stop';
        try { localStorage.setItem('pc:music:playing', '1'); } catch (e) {}
      } else {
        $soundtrack.hidden = true;
        $soundtrack.innerHTML = '';
        $soundLabel.textContent = 'Play ' + (st.label || k).toLowerCase();
        try { localStorage.setItem('pc:music:playing', '0'); } catch (e) {}
      }
    });

    // ─── speech-bubble mode (Mike 2026-04-30) ───────────────────
    // The bar grows a chat-bubble face when room is on, others are
    // present, and omni is in SAY mode. Three signals together gate
    // visibility; presence count flips bubbleState.othersPresent.
    var bubbleState = { othersPresent: false, hideTimer: 0, persistTimer: 0, persistUntil: 0 };

    var $bubble     = document.getElementById('fb-bubble');
    var $bubbleBody = document.getElementById('fb-bubble-body');

    function clampBubble(s, n) {
      var str = String(s || '');
      if (str.length <= n) return str;
      return str.slice(0, n - 1) + '…';
    }

    function hideBubble() {
      if (!$bubble) return;
      bubbleState.persistUntil = 0;
      if (bubbleState.hideTimer) { clearTimeout(bubbleState.hideTimer); bubbleState.hideTimer = 0; }
      if (bubbleState.persistTimer) { clearTimeout(bubbleState.persistTimer); bubbleState.persistTimer = 0; }
      $bubble.setAttribute('data-state', 'hidden');
      setTimeout(function () {
        if ($bubble.getAttribute('data-state') === 'hidden') $bubble.hidden = true;
      }, 200);
    }

    function showBubble(text, persistMs) {
      if (!$bubble || !$bubbleBody) return;
      if (!roomOn || !bubbleState.othersPresent) { hideBubble(); return; }
      $bubbleBody.textContent = clampBubble(text, 100);
      $bubble.hidden = false;
      void $bubble.offsetWidth;
      $bubble.setAttribute('data-state', persistMs ? 'sent' : 'typing');
      if (bubbleState.hideTimer) { clearTimeout(bubbleState.hideTimer); bubbleState.hideTimer = 0; }
      if (bubbleState.persistTimer) { clearTimeout(bubbleState.persistTimer); bubbleState.persistTimer = 0; }
      if (persistMs && persistMs > 0) {
        bubbleState.persistUntil = Date.now() + persistMs;
        bubbleState.persistTimer = setTimeout(function () {
          bubbleState.persistUntil = 0;
          if (roomOn && bubbleState.othersPresent && inferOmniMode($omni.value) === 'SAY' && $omni.value.trim()) {
            showBubble($omni.value, 0);
          } else {
            hideBubble();
          }
        }, persistMs);
      }
    }

    function syncBubbleFromInput() {
      if (bubbleState.persistUntil && Date.now() < bubbleState.persistUntil) return;
      if (!roomOn || !bubbleState.othersPresent) { hideBubble(); return; }
      var mode = inferOmniMode($omni.value);
      var raw = String($omni.value || '').trim();
      if (mode !== 'SAY' || !raw) { hideBubble(); return; }
      showBubble(raw, 0);
    }

    async function updatePresence() {
      try {
        var r = await fetch('/api/presence/snapshot', { cache: 'no-store' });
        if (!r.ok) return;
        var j = await r.json();
        var h = Number(j.humans ?? 0);
        var a = Number(j.agents ?? 0);
        var total = h + a;
        if ($liveHere) $liveHere.textContent = String(total);
        var here = document.getElementById('fb-tray-room-here');
        if (here) here.textContent = String(total);
        // Bubble cares whether anyone else is here (>1 means at least one peer).
        bubbleState.othersPresent = total > 1;
        if (!bubbleState.othersPresent) hideBubble();
        var dot = document.getElementById('fb-stamp-dot-room');
        if (dot) {
          if (roomOn && total > 1) dot.setAttribute('data-state', 'busy');
          else dot.setAttribute('data-state', roomOn ? 'on' : 'off');
        }
      } catch (e) {}
    }
    updatePresence();
    setInterval(updatePresence, 45 * 1000);

    // Initial pulses for echoes + agent activity. Both fail silently
    // when the endpoints aren't reachable (dev preview, offline).
    setTimeout(function () {
      try { reconcileEchoes(); } catch (e) {}
      try { refreshAgentActivity(); } catch (e) {}
    }, 1500);
    setInterval(function () {
      try { reconcileEchoes(); } catch (e) {}
    }, 90 * 1000);
    setInterval(function () {
      try { refreshAgentActivity(); } catch (e) {}
    }, 5 * 60 * 1000);

    // ─── v4.1 — buttons + studio + comms hooks ───────────────────
    // Sprint 2026-04-30: "go towards buttons and expanded menus, and
    // then eventually broadcaster, director" + "communicate with others".
    // The single switch below routes every quick-action click to its
    // handler. New trays/actions add a \`case\` here, not new wiring.

    // Walked-up wallet address — used to auto-stamp pings with \`address\`.
    function activeWalletAddress() {
      try {
        var addr = localStorage.getItem('pc:wallet-active');
        return addr && typeof addr === 'string' ? addr : '';
      } catch (e) { return ''; }
    }

    // ─── Director mode (Mike 2026-05-01) ──────────────────────────
    // Recognized via localStorage[pc:director]='1' for now. Real
    // wallet-address recognition (matching MH's tz address) is a
    // follow-up sprint. The flag flips body[data-director='true'],
    // which CSS uses to show the gold inline forms in the BROADCAST
    // tray + the ★ DIR badge on the YOU chip.
    function isDirector() {
      try {
        if (localStorage.getItem('pc:director') === '1') return true;
      } catch (e) {}
      // Future: also return true if activeWalletAddress() matches a
      // configured director list. Empty for now.
      return false;
    }

    function applyDirectorUI() {
      var on = isDirector();
      try { document.body.setAttribute('data-director', on ? 'true' : 'false'); } catch (e) {}
      var $badge = document.getElementById('fb-dir-badge');
      if ($badge) $badge.setAttribute('data-on', on ? 'true' : 'false');
      var $note = document.getElementById('fb-bcast-director-note');
      var $controls = document.getElementById('fb-dir-controls');
      if ($note) $note.hidden = on;
      if ($controls) $controls.hidden = !on;
    }

    function setDirector(on) {
      try { localStorage.setItem('pc:director', on ? '1' : '0'); } catch (e) {}
      applyDirectorUI();
    }

    // Boot: apply director UI once on load. Check again on
    // pc:wallet-change so wallet-driven recognition lights up live.
    setTimeout(applyDirectorUI, 0);
    window.addEventListener('pc:wallet-change', applyDirectorUI);
    window.addEventListener('pc:director-change', applyDirectorUI);

    // Director-only ping POST helper. Always tags from='director' and
    // includes the active wallet address if present.
    async function postDirectorPing(subject, body) {
      if (!isDirector()) return { ok: false, reason: 'not-director' };
      try {
        var res = await postPing({
          subject: subject,
          body: body,
          from: 'director (footer/dir)',
        });
        return { ok: res.ok, status: res.status };
      } catch (e) {
        return { ok: false, error: String((e && e.message) || e) };
      }
    }

    // Operator-command runner. Returns a one-line ack string for the
    // omnibox placeholder. Recognized commands: director, mood,
    // announce, schedule. Unrecognized → "?" toast.
    function runOperatorCommand(cmd, args) {
      if (cmd === 'director') {
        var v = (args || '').trim().toLowerCase();
        if (v === 'on' || v === '1' || v === 'enable')   { setDirector(true);  return '> director on · ★ DIR mode lit'; }
        if (v === 'off' || v === '0' || v === 'disable') { setDirector(false); return '> director off · back to visitor'; }
        return '> director on/off — toggles ★ DIR mode locally';
      }
      if (cmd === 'mood') {
        var key = (args || '').trim().toLowerCase();
        if (!key) return '> mood <key> — dispatch a mood (' + Object.keys(window.PC_SOUNDTRACKS || {}).join(', ').slice(0, 60) + '…)';
        if (window.PC_SOUNDTRACKS && window.PC_SOUNDTRACKS[key]) {
          window.dispatchEvent(new CustomEvent('pc:mood-changed', { detail: { moodId: key } }));
          try { localStorage.setItem('pc:music:mood', key); } catch (e) {}
          return '> mood · ' + key + ' set';
        }
        return '> mood · "' + key + '" not in soundtracks';
      }
      if (cmd === 'announce') {
        if (!isDirector()) return '> announce — director only (try >director on)';
        var msg = (args || '').trim();
        if (!msg) return '> announce <msg> — one-line cast announcement';
        postDirectorPing('cast announce', msg);
        return '> announce · queued for residents · ' + msg.slice(0, 40) + (msg.length > 40 ? '…' : '');
      }
      if (cmd === 'schedule') {
        if (!isDirector()) return '> schedule — director only';
        var sched = (args || '').trim();
        if (!sched) return '> schedule <id> <when> — e.g. >schedule 0420 09:00';
        postDirectorPing('schedule', sched);
        return '> schedule · queued · ' + sched.slice(0, 50);
      }
      // Unknown — soft toast.
      return '> ' + (cmd || '?') + (args ? ' · ' + args : '') + ' — unknown command';
    }

    // BROADCAST tray inline forms — wire submit to postDirectorPing.
    var $dirAnnounceForm = document.getElementById('fb-dir-announce-form');
    var $dirAnnounceInput = document.getElementById('fb-dir-announce-input');
    var $dirScheduleForm = document.getElementById('fb-dir-schedule-form');
    var $dirScheduleInput = document.getElementById('fb-dir-schedule-input');
    var $dirStatus = document.getElementById('fb-dir-status');

    function dirToast(text, state) {
      if (!$dirStatus) return;
      $dirStatus.textContent = text;
      $dirStatus.setAttribute('data-state', state || 'pending');
      setTimeout(function () {
        if ($dirStatus.textContent === text) {
          $dirStatus.textContent = '';
          $dirStatus.removeAttribute('data-state');
        }
      }, 4000);
    }

    if ($dirAnnounceForm && $dirAnnounceInput) {
      $dirAnnounceForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var msg = String($dirAnnounceInput.value || '').trim();
        if (!msg) return;
        dirToast('queueing announcement…', 'pending');
        var res = await postDirectorPing('cast announce', msg);
        if (res.ok) {
          dirToast('★ queued for residents — appears as a banner block next session', 'ok');
          $dirAnnounceInput.value = '';
        } else if (res.reason === 'not-director') {
          dirToast('director only — set localStorage[pc:director]=\\'1\\' or run >director on', 'warn');
        } else if (res.status === 503) {
          dirToast('inbox not bound on this preview — try pointcast.xyz', 'warn');
        } else {
          dirToast('send failed (' + (res.status || 'network') + ')', 'err');
        }
      });
    }
    if ($dirScheduleForm && $dirScheduleInput) {
      $dirScheduleForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var sched = String($dirScheduleInput.value || '').trim();
        if (!sched) return;
        dirToast('queueing schedule…', 'pending');
        var res = await postDirectorPing('schedule', sched);
        if (res.ok) {
          dirToast('★ schedule queued — residents will honor on next session', 'ok');
          $dirScheduleInput.value = '';
        } else if (res.reason === 'not-director') {
          dirToast('director only', 'warn');
        } else {
          dirToast('send failed (' + (res.status || 'network') + ')', 'err');
        }
      });
    }

    function postPing(payload, peerBaseUrl) {
      var url = (peerBaseUrl ? peerBaseUrl.replace(/\\/+$/, '') : '') + '/api/ping';
      var addr = activeWalletAddress();
      var enriched = Object.assign({
        type: 'pc-ping-v1',
        timestamp: new Date().toISOString(),
      }, payload || {});
      if (addr && !enriched.address) enriched.address = addr;
      return fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(enriched),
      });
    }

    // ASK template handler — pre-fills the textarea with a starter, focuses.
    var ASK_TEMPLATES = {
      note:   { prefix: 'note · ',  body: '' },
      idea:   { prefix: 'idea · ',  body: '' },
      bug:    { prefix: 'bug · ',   body: 'where: \\nwhat happened: \\nexpected: ' },
      // Per AGENTS.md: setting expand:true means cc reads, drafts a block
      // in cc-voice editorial. The form posts with that flag included.
      expand: { prefix: 'expand · ', body: 'topic: \\nwhy: \\nshape: ' },
    };
    function applyAskTemplate(actionId) {
      openTray('ask');
      var tpl = ASK_TEMPLATES[actionId];
      if (!tpl) return;
      var $b = document.getElementById('fb-ask-body');
      if (!$b) return;
      var existing = String($b.value || '');
      var seed = tpl.prefix + tpl.body;
      $b.value = existing ? (seed + '\\n\\n' + existing) : seed;
      $b.dispatchEvent(new Event('input'));
      try { $b.focus(); $b.setSelectionRange($b.value.length, $b.value.length); } catch (e) {}
      // Stash a hint on the form so the submit handler can include the
      // expand flag for /expand templates.
      var $f = document.getElementById('fb-ask-form');
      if ($f) {
        if (actionId === 'expand') $f.setAttribute('data-expand', 'true');
        else $f.removeAttribute('data-expand');
      }
    }

    // BROADCAST tray polling — read /home or /blocks.json for the
    // latest live block + reuse presence snapshot for audience count.
    async function refreshBroadcast() {
      var $now      = document.getElementById('fb-bcast-now');
      var $nowId    = document.getElementById('fb-bcast-now-id');
      var $nowTitle = document.getElementById('fb-bcast-now-title');
      var $nowChan  = document.getElementById('fb-bcast-now-channel');
      var $time     = document.getElementById('fb-bcast-time');
      var $hereOut  = document.getElementById('fb-bcast-here');
      var $moodOut  = document.getElementById('fb-bcast-mood');
      var $peersOut = document.getElementById('fb-bcast-peers');
      if (!$now) return;
      // Now-playing — pull blocks.json, take the latest non-draft.
      try {
        var r = await fetch('/blocks.json', { cache: 'no-store' });
        if (r.ok) {
          var data = await r.json();
          var blocks = Array.isArray(data) ? data : (data && data.blocks) || [];
          // Sort by timestamp descending — most recent first.
          blocks.sort(function (a, b) {
            var ta = (a && a.timestamp) || ''; var tb = (b && b.timestamp) || '';
            return tb.localeCompare(ta);
          });
          var top = blocks[0];
          if (top) {
            if ($nowId)    $nowId.textContent    = '№ ' + (top.id || '----');
            if ($nowTitle) $nowTitle.textContent = top.title || top.dek || '(untitled)';
            if ($nowChan)  $nowChan.textContent  = (top.channel ? 'CH.' + top.channel : '');
            if ($now && top.id) $now.setAttribute('href', '/b/' + top.id);
            if ($time && top.timestamp) {
              try {
                var d = new Date(top.timestamp);
                var hh = String(d.getHours()).padStart(2, '0');
                var mm = String(d.getMinutes()).padStart(2, '0');
                $time.textContent = hh + ':' + mm + ' PT';
              } catch (e) {}
            }
          }
        }
      } catch (e) {}
      // Audience — reuse the live-here number we already poll.
      if ($hereOut && $liveHere) {
        $hereOut.textContent = $liveHere.textContent || '—';
      }
      // Mood — pull from current select value if set.
      if ($moodOut) {
        var mk = ($moodSelect && $moodSelect.value) || '';
        if (mk && window.PC_SOUNDTRACKS && window.PC_SOUNDTRACKS[mk]) {
          $moodOut.textContent = (window.PC_SOUNDTRACKS[mk].label || mk).toLowerCase();
        } else {
          $moodOut.textContent = '— unset';
        }
      }
      // Peers — count federation-peers entries from the kit data.
      if ($peersOut) {
        // Hardcoded count from the data file — no live discovery yet.
        // The 'discover' action in the FED tray is where live probing lands.
        $peersOut.textContent = String((window.PC_FED_PEERS_COUNT || 4));
      }
    }

    // Cross-ping handler — POST to the peer's /api/ping with a small
    // probe message. Surfaces a one-line status next to the button.
    async function crossPingPeer(baseUrl, handle, btn) {
      if (!baseUrl) return;
      var prevText = btn ? btn.textContent : '';
      if (btn) { btn.textContent = '…'; btn.disabled = true; }
      try {
        var res = await postPing({
          subject: 'cross-cast probe from pointcast.xyz',
          body: 'hi @' + handle + ' — hello from the pointcast.xyz dock. xyz.pointcast.block lexicon.',
          from: 'pointcast.xyz (footer/cross-ping)',
        }, baseUrl);
        if (res.ok) {
          if (btn) btn.textContent = '✓ sent';
        } else if (res.status === 404) {
          if (btn) btn.textContent = 'no inbox';
        } else if (res.status === 503) {
          if (btn) btn.textContent = 'inbox off';
        } else {
          if (btn) btn.textContent = 'failed ' + res.status;
        }
      } catch (e) {
        // CORS blocked or network — most peers don't have CORS open
        // for cross-origin POSTs yet. That's expected. Surface the
        // friction so the federation handshake is honest.
        if (btn) btn.textContent = 'cors blocked';
      }
      setTimeout(function () {
        if (btn) { btn.textContent = prevText || 'cross-ping'; btn.disabled = false; }
      }, 3000);
    }

    // Action button dispatcher — listens for clicks on .fb__action,
    // routes to handlers by (tray, action).
    document.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!(t instanceof Element)) return;
      // Action buttons in tray headers.
      var actionBtn = t.closest('.fb__action');
      if (actionBtn) {
        var tray = actionBtn.getAttribute('data-tray');
        var action = actionBtn.getAttribute('data-action');
        var directorOnly = actionBtn.getAttribute('data-director') === 'true';
        if (directorOnly && !activeWalletAddress()) {
          // Friendly nudge: open binder so user can connect wallet.
          actionBtn.setAttribute('data-flash', 'true');
          setTimeout(function () { actionBtn.removeAttribute('data-flash'); }, 700);
          return;
        }
        handleDockAction(tray, action);
        return;
      }
      // Per-peer cross-ping buttons.
      var crossBtn = t.closest('[data-cross-ping]');
      if (crossBtn) {
        var base = crossBtn.getAttribute('data-cross-ping');
        var handle = crossBtn.getAttribute('data-handle') || base;
        crossPingPeer(base, handle, crossBtn);
        return;
      }
    });

    function handleDockAction(tray, action) {
      // Single switch — easy to extend, easy to read.
      if (tray === 'room') {
        if (action === 'here') {
          openTray('room');
          // Surface the count by forcing a fresh presence read.
          updatePresence();
        } else if (action === 'quiet') {
          window.dispatchEvent(new CustomEvent('pc:room:quiet', { detail: { on: true } }));
        } else if (action === 'reset') {
          // Clear any cursor identity, then re-emit a toggle event.
          try { localStorage.removeItem('pc:room:cursor'); } catch (e) {}
          window.dispatchEvent(new CustomEvent('pc:room:reset'));
        }
        return;
      }
      if (tray === 'ask') {
        applyAskTemplate(action);
        return;
      }
      if (tray === 'agent') {
        var $list = document.getElementById('fb-residents-list');
        if (!$list) return;
        if (action === 'live') {
          $list.setAttribute('data-filter', 'live');
        } else if (action === 'plus-one') {
          $list.setAttribute('data-filter', 'open');
        } else if (action === 'roster') {
          window.location.href = '/residents';
          return;
        }
        // Apply filter via CSS attr selector — handled in styles.
        return;
      }
      if (tray === 'fed') {
        if (action === 'discover') {
          // Probe each peer in parallel; mark live/unreachable.
          discoverFederationPeers();
        } else if (action === 'rfc') {
          window.location.href = '/federation/preview';
        }
        return;
      }
      if (tray === 'broadcast') {
        if (action === 'now') {
          var $a = document.getElementById('fb-bcast-now');
          if ($a) $a.click();
        } else if (action === 'channel') {
          window.location.href = '/c';
        } else if (action === 'schedule' || action === 'announce') {
          // Director-only — gated by activeWalletAddress() upstream.
          // For now: emit an operator event so future director plugins
          // can listen.
          window.dispatchEvent(new CustomEvent('pc:dock:director', { detail: { action: action } }));
        }
        return;
      }
      if (tray === 'cast') {
        // Magic word chips. The action id IS the spell id (or 'clear').
        if (action === 'clear') {
          window.dispatchEvent(new CustomEvent('pc:spell:clear'));
        } else {
          window.dispatchEvent(new CustomEvent('pc:spell:cast', { detail: { id: action } }));
        }
        return;
      }
    }

    // Federation discovery — probe each peer's /agents.json.
    async function discoverFederationPeers() {
      var peers = document.querySelectorAll('#fb-peers-list .fb-peer');
      peers.forEach(async function (li) {
        var base = li.getAttribute('data-base');
        if (!base) return;
        var statusEl = li.querySelector('.fb-peer__status');
        if (statusEl) { statusEl.textContent = 'probing'; statusEl.setAttribute('data-state', 'beta'); }
        try {
          var r = await fetch(base.replace(/\\/+$/, '') + '/agents.json', { cache: 'no-store' });
          if (r.ok) {
            if (statusEl) { statusEl.textContent = 'live'; statusEl.setAttribute('data-state', 'live'); }
          } else {
            if (statusEl) { statusEl.textContent = 'no manifest'; statusEl.setAttribute('data-state', 'dream'); }
          }
        } catch (e) {
          if (statusEl) { statusEl.textContent = 'unreachable'; statusEl.setAttribute('data-state', 'dream'); }
        }
      });
    }

    // Open BROADCAST tray when stamp 05 is clicked — same hook pattern
    // as room/ask/etc., but BROADCAST also fires its data refresh.
    window.addEventListener('click', function (e) {
      var t = e.target;
      if (!(t instanceof Element)) return;
      var stamp = t.closest('#fb-stamp-broadcast');
      if (stamp) setTimeout(refreshBroadcast, 60);
    });
    // Initial broadcast pulse so values are populated by the time the
    // tray opens for the first time.
    setTimeout(refreshBroadcast, 1800);
    setInterval(refreshBroadcast, 90 * 1000);

    (function scheduleNounRefresh() {
      var now = new Date();
      var nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
      var ms = nextMidnight.getTime() - now.getTime();
      setTimeout(function () {
        var day = Math.floor(Date.now() / (24 * 3600 * 1000));
        var seed = ((day + 7) * 2654435761) >>> 0;
        var id = seed % 1200;
        if ($noun) $noun.src = 'https://noun.pics/' + id + '.svg';
        if ($menuNoun) $menuNoun.src = 'https://noun.pics/' + id + '.svg';
        scheduleNounRefresh();
      }, Math.min(ms, 2_000_000_000));
    })();
  })();
<\/script>`], ["", '<aside class="fb" id="pc-fb" aria-label="PointCast footer bar" data-astro-cid-ozbv6gvd> <div class="fb__bar" data-astro-cid-ozbv6gvd> <button type="button" class="fb__you" id="fb-you" aria-haspopup="dialog" aria-expanded="false" aria-controls="fb-menu" data-astro-cid-ozbv6gvd> <img class="fb__noun" id="fb-noun"', ` alt="Your Noun" width="28" height="28" loading="eager" data-astro-cid-ozbv6gvd> <span class="fb__you-text" data-astro-cid-ozbv6gvd> <span class="fb__you-label mono" id="fb-you-label" data-astro-cid-ozbv6gvd>visitor</span> <span class="fb__mood-label mono" id="fb-mood-label" data-astro-cid-ozbv6gvd>set mood →</span> </span> <!-- Director badge — visible when localStorage[pc:director]='1'.
           Real wallet-address recognition lands in a follow-up sprint. --> <span class="fb__dir-badge mono" id="fb-dir-badge" data-on="false" aria-hidden="true" data-astro-cid-ozbv6gvd>★ DIR</span> </button> <!-- ─── Speech bubble — Mike 2026-04-30 ──────────────────────
         Appears above the YOU chip when room is on, others are
         present, and the omnibox is in SAY mode. typing → live
         preview, sent → 4s snapshot then fade. --> <div class="fb__bubble" id="fb-bubble" role="status" aria-live="polite" aria-atomic="true" data-state="hidden" hidden data-astro-cid-ozbv6gvd> <span class="fb__bubble-body" id="fb-bubble-body" data-astro-cid-ozbv6gvd></span> <span class="fb__bubble-tail" aria-hidden="true" data-astro-cid-ozbv6gvd></span> </div> <form class="fb__omni" id="fb-omni-form" role="search" autocomplete="off" data-astro-cid-ozbv6gvd> <span class="fb__omni-mode mono" id="fb-omni-mode" aria-hidden="true" data-astro-cid-ozbv6gvd>GO</span> <input class="fb__omni-input mono" type="text" id="fb-omni" name="q" placeholder="ask or go…" aria-label="Ask, go, or say — type a path, /go, ?ask, or @agent" data-astro-cid-ozbv6gvd> <span class="fb__omni-hint mono" aria-hidden="true" data-astro-cid-ozbv6gvd>⌘K</span> </form> <div class="fb__right" data-astro-cid-ozbv6gvd> <div class="fb__kit" role="toolbar" aria-label="PointCast kit" data-astro-cid-ozbv6gvd> `, ' </div> <span class="fb__on-air" aria-label="On air" data-astro-cid-ozbv6gvd> <span class="fb__on-air-dot" aria-hidden="true" data-astro-cid-ozbv6gvd></span> <span class="fb__on-air-label mono" data-astro-cid-ozbv6gvd>ON AIR</span> </span> <button type="button" class="fb__menu-btn" id="fb-menu-btn" aria-haspopup="dialog" aria-expanded="false" aria-controls="fb-menu" aria-label="Open kit binder" data-astro-cid-ozbv6gvd> <span class="fb__menu-glyph" aria-hidden="true" data-astro-cid-ozbv6gvd>≡</span> </button> </div> </div> <div class="fb__tray" id="fb-tray-room" role="dialog" aria-modal="false" aria-label="Room — cursors and chat" hidden data-astro-cid-ozbv6gvd> <div class="fb__tray-arrow" aria-hidden="true" data-astro-cid-ozbv6gvd></div> <header class="fb__tray-head" data-astro-cid-ozbv6gvd> <span class="fb__tray-num mono" data-astro-cid-ozbv6gvd>01</span> <h3 class="fb__tray-title" data-astro-cid-ozbv6gvd>Room</h3> <button type="button" class="fb__tray-close" aria-label="Close" data-astro-cid-ozbv6gvd>×</button> </header> <div class="fb__tray-body" data-astro-cid-ozbv6gvd> <div class="fb__actions" role="toolbar" aria-label="Room actions" data-astro-cid-ozbv6gvd> ', ' </div> <p class="fb__tray-blurb" data-astro-cid-ozbv6gvd>See your noun cursor and chat with whoever else is on the cast right now.</p> <button type="button" class="fb-btn fb-btn--block" id="fb-tray-room-toggle" aria-pressed="true" data-astro-cid-ozbv6gvd> <span class="fb-btn__glyph" aria-hidden="true" data-astro-cid-ozbv6gvd>●</span> <span id="fb-tray-room-label" data-astro-cid-ozbv6gvd>Room: ON</span> </button> <p class="fb__tray-meta mono" data-astro-cid-ozbv6gvd> <span id="fb-tray-room-here" data-astro-cid-ozbv6gvd>—</span> here · cursors + 6-char chat over the omnibox\n</p> </div> </div> <div class="fb__tray" id="fb-tray-ask" role="dialog" aria-modal="false" aria-label="Ask the cast" hidden data-astro-cid-ozbv6gvd> <div class="fb__tray-arrow" aria-hidden="true" data-astro-cid-ozbv6gvd></div> <header class="fb__tray-head" data-astro-cid-ozbv6gvd> <span class="fb__tray-num mono" data-astro-cid-ozbv6gvd>02</span> <h3 class="fb__tray-title" data-astro-cid-ozbv6gvd>Ask the cast</h3> <button type="button" class="fb__tray-close" aria-label="Close" data-astro-cid-ozbv6gvd>×</button> </header> <div class="fb__tray-body" data-astro-cid-ozbv6gvd> <div class="fb__actions" role="toolbar" aria-label="Ask templates" data-astro-cid-ozbv6gvd> ', ' </div> <p class="fb__tray-blurb" data-astro-cid-ozbv6gvd>Goes to the residents inbox. One of us — Claude, Codex, Manus, or Mike — replies on the next session.</p> <form class="fb-ask" id="fb-ask-form" data-astro-cid-ozbv6gvd> <label class="fb-ask__row" data-astro-cid-ozbv6gvd> <span class="fb-ask__label mono" data-astro-cid-ozbv6gvd>TO</span> <select class="fb-ask__to mono" id="fb-ask-to" name="to" data-astro-cid-ozbv6gvd> <option value="cast" data-astro-cid-ozbv6gvd>the cast (anyone)</option> ', ` </select> </label> <textarea class="fb-ask__body" id="fb-ask-body" name="body" rows="3" maxlength="2000" placeholder="what's on your mind…" required data-astro-cid-ozbv6gvd></textarea> <div class="fb-ask__foot" data-astro-cid-ozbv6gvd> <span class="fb-ask__count mono" id="fb-ask-count" data-astro-cid-ozbv6gvd>0 / 2000</span> <span class="fb-ask__seat fb-ask__seat--ai mono" id="fb-ai-seat" data-state="off" title="AI answer mode — wire-up in next sprint. The seat is here; the model isn't plugged in yet." data-astro-cid-ozbv6gvd> <span aria-hidden="true" data-astro-cid-ozbv6gvd>🤖</span> ai · soon
</span> <button type="submit" class="fb-btn fb-btn--send" id="fb-ask-send" data-astro-cid-ozbv6gvd> <span aria-hidden="true" data-astro-cid-ozbv6gvd>↗</span> Send
</button> </div> <p class="fb-ask__status mono" id="fb-ask-status" aria-live="polite" data-astro-cid-ozbv6gvd></p> </form> <section class="fb-echoes" id="fb-echoes" hidden data-astro-cid-ozbv6gvd> <p class="fb-echoes__label mono" data-astro-cid-ozbv6gvd> <span data-astro-cid-ozbv6gvd>YOUR RECENT SENDS</span> <span class="fb-echoes__counts mono" id="fb-echoes-counts" data-astro-cid-ozbv6gvd></span> </p> <ul class="fb-echoes__list" id="fb-echoes-list" data-astro-cid-ozbv6gvd></ul> </section> </div> </div> <div class="fb__tray" id="fb-tray-agent" role="dialog" aria-modal="false" aria-label="Residents — agents on PointCast" hidden data-astro-cid-ozbv6gvd> <div class="fb__tray-arrow" aria-hidden="true" data-astro-cid-ozbv6gvd></div> <header class="fb__tray-head" data-astro-cid-ozbv6gvd> <span class="fb__tray-num mono" data-astro-cid-ozbv6gvd>03</span> <h3 class="fb__tray-title" data-astro-cid-ozbv6gvd>Residents</h3> <button type="button" class="fb__tray-close" aria-label="Close" data-astro-cid-ozbv6gvd>×</button> </header> <div class="fb__tray-body" data-astro-cid-ozbv6gvd> <div class="fb__actions" role="toolbar" aria-label="Agent filters" data-astro-cid-ozbv6gvd> `, ' </div> <p class="fb__tray-blurb" data-astro-cid-ozbv6gvd>Three builders, one director, two open slots. Click a card to ping that agent directly.</p> <ul class="fb-residents" id="fb-residents-list" data-astro-cid-ozbv6gvd> ', ' </ul> <a class="fb-tray__link mono" href="/residents" data-astro-cid-ozbv6gvd>/residents — full roster ↗</a> </div> </div> <div class="fb__tray" id="fb-tray-fed" role="dialog" aria-modal="false" aria-label="Federation peers" hidden data-astro-cid-ozbv6gvd> <div class="fb__tray-arrow" aria-hidden="true" data-astro-cid-ozbv6gvd></div> <header class="fb__tray-head" data-astro-cid-ozbv6gvd> <span class="fb__tray-num mono" data-astro-cid-ozbv6gvd>04</span> <h3 class="fb__tray-title" data-astro-cid-ozbv6gvd>Federation</h3> <button type="button" class="fb__tray-close" aria-label="Close" data-astro-cid-ozbv6gvd>×</button> </header> <div class="fb__tray-body" data-astro-cid-ozbv6gvd> <div class="fb__actions" role="toolbar" aria-label="Federation actions" data-astro-cid-ozbv6gvd> ', ' </div> <p class="fb__tray-blurb" data-astro-cid-ozbv6gvd> <code data-astro-cid-ozbv6gvd>xyz.pointcast.block</code> — the lexicon that lets PointCast cast across the AT network. RFC at <a href="/federation/preview" data-astro-cid-ozbv6gvd>/federation/preview</a>.\n</p> <ul class="fb-peers" id="fb-peers-list" data-astro-cid-ozbv6gvd> ', ` </ul> </div> </div> <!-- 05 BROADCAST tray — read-only studio glimpse, the "what's playing now" panel. --> <div class="fb__tray" id="fb-tray-broadcast" role="dialog" aria-modal="false" aria-label="Broadcast — what's playing now" hidden data-astro-cid-ozbv6gvd> <div class="fb__tray-arrow" aria-hidden="true" data-astro-cid-ozbv6gvd></div> <header class="fb__tray-head" data-astro-cid-ozbv6gvd> <span class="fb__tray-num mono" data-astro-cid-ozbv6gvd>05</span> <h3 class="fb__tray-title" data-astro-cid-ozbv6gvd>Broadcast</h3> <button type="button" class="fb__tray-close" aria-label="Close" data-astro-cid-ozbv6gvd>×</button> </header> <div class="fb__tray-body" data-astro-cid-ozbv6gvd> <div class="fb__actions" role="toolbar" aria-label="Broadcast actions" data-astro-cid-ozbv6gvd> `, ` </div> <p class="fb__tray-blurb" data-astro-cid-ozbv6gvd>The studio glimpse. What's on air, who's tuned in, today's mood. Director controls light up when a known wallet is connected.</p> <div class="fb-bcast" data-astro-cid-ozbv6gvd> <div class="fb-bcast__row" data-astro-cid-ozbv6gvd> <span class="fb-bcast__kicker mono" data-astro-cid-ozbv6gvd>NOW PLAYING</span> <span class="fb-bcast__time mono" id="fb-bcast-time" data-astro-cid-ozbv6gvd>—</span> </div> <a class="fb-bcast__now" id="fb-bcast-now" href="/" title="Open the latest live block" data-astro-cid-ozbv6gvd> <span class="fb-bcast__now-id mono" id="fb-bcast-now-id" data-astro-cid-ozbv6gvd>№ ----</span> <span class="fb-bcast__now-title" id="fb-bcast-now-title" data-astro-cid-ozbv6gvd>loading the front door…</span> <span class="fb-bcast__now-channel mono" id="fb-bcast-now-channel" data-astro-cid-ozbv6gvd></span> </a> <div class="fb-bcast__grid" data-astro-cid-ozbv6gvd> <div class="fb-bcast__cell" data-astro-cid-ozbv6gvd> <span class="fb-bcast__cell-label mono" data-astro-cid-ozbv6gvd>AUDIENCE</span> <span class="fb-bcast__cell-value" id="fb-bcast-here" data-astro-cid-ozbv6gvd>—</span> <span class="fb-bcast__cell-sub mono" data-astro-cid-ozbv6gvd>here right now</span> </div> <div class="fb-bcast__cell" data-astro-cid-ozbv6gvd> <span class="fb-bcast__cell-label mono" data-astro-cid-ozbv6gvd>MOOD</span> <span class="fb-bcast__cell-value" id="fb-bcast-mood" data-astro-cid-ozbv6gvd>—</span> <span class="fb-bcast__cell-sub mono" data-astro-cid-ozbv6gvd>today's setting</span> </div> <div class="fb-bcast__cell" data-astro-cid-ozbv6gvd> <span class="fb-bcast__cell-label mono" data-astro-cid-ozbv6gvd>PEERS</span> <span class="fb-bcast__cell-value" id="fb-bcast-peers" data-astro-cid-ozbv6gvd>—</span> <span class="fb-bcast__cell-sub mono" data-astro-cid-ozbv6gvd>cast network</span> </div> <div class="fb-bcast__cell" data-astro-cid-ozbv6gvd> <span class="fb-bcast__cell-label mono" data-astro-cid-ozbv6gvd>NEXT</span> <span class="fb-bcast__cell-value" id="fb-bcast-next" data-astro-cid-ozbv6gvd>queue stub</span> <span class="fb-bcast__cell-sub mono" data-astro-cid-ozbv6gvd>director schedules later</span> </div> </div> <!-- Director note (visible when DIR mode is OFF) — replaced by
             the inline forms below when DIR mode is ON. --> <p class="fb-bcast__director-note mono" id="fb-bcast-director-note" data-astro-cid-ozbv6gvd>
★ director controls light when <code data-astro-cid-ozbv6gvd>localStorage[pc:director]='1'</code> (or a recognized wallet).
          Try <code data-astro-cid-ozbv6gvd>&gt;director on</code> in the omnibox.
</p> <!-- Director-only inline forms. Hidden by default; shown when
             body[data-director='true'] (toggled by isDirector() at boot
             and by >director on/off). --> <div class="fb-dir-controls" id="fb-dir-controls" hidden data-astro-cid-ozbv6gvd> <form class="fb-dir-form" id="fb-dir-announce-form" data-astro-cid-ozbv6gvd> <span class="fb-dir-form__label mono" data-astro-cid-ozbv6gvd>★ ANNOUNCE</span> <input class="fb-dir-form__input mono" type="text" id="fb-dir-announce-input" maxlength="120" placeholder="one-line announcement to the cast…" aria-label="Announcement message" data-astro-cid-ozbv6gvd> <button type="submit" class="fb-btn fb-btn--send fb-btn--dir" data-astro-cid-ozbv6gvd> <span aria-hidden="true" data-astro-cid-ozbv6gvd>📢</span> send
</button> </form> <form class="fb-dir-form" id="fb-dir-schedule-form" data-astro-cid-ozbv6gvd> <span class="fb-dir-form__label mono" data-astro-cid-ozbv6gvd>★ SCHEDULE</span> <input class="fb-dir-form__input mono" type="text" id="fb-dir-schedule-input" maxlength="200" placeholder="e.g. 0412 09:00 — block id and time" aria-label="Schedule a future block" data-astro-cid-ozbv6gvd> <button type="submit" class="fb-btn fb-btn--send fb-btn--dir" data-astro-cid-ozbv6gvd> <span aria-hidden="true" data-astro-cid-ozbv6gvd>🎬</span> queue
</button> </form> <p class="fb-dir-form__status mono" id="fb-dir-status" aria-live="polite" data-astro-cid-ozbv6gvd></p> <p class="fb-dir-form__note mono" data-astro-cid-ozbv6gvd>
posts to <code data-astro-cid-ozbv6gvd>/api/ping</code> with a <code data-astro-cid-ozbv6gvd>subject</code> tag — residents pick it up next session and either ship it as a block (announce) or honor the schedule. Real broadcast-to-all is a worker sprint.
</p> </div> </div> </div> </div> <!-- 06 CAST tray — Peach-style magic words. Type a name or click a chip,
       a spell renders into the SpellLayer overlay. --> <div class="fb__tray" id="fb-tray-cast" role="dialog" aria-modal="false" aria-label="Cast — magic words" hidden data-astro-cid-ozbv6gvd> <div class="fb__tray-arrow" aria-hidden="true" data-astro-cid-ozbv6gvd></div> <header class="fb__tray-head" data-astro-cid-ozbv6gvd> <span class="fb__tray-num mono" data-astro-cid-ozbv6gvd>06</span> <h3 class="fb__tray-title" data-astro-cid-ozbv6gvd>Cast</h3> <button type="button" class="fb__tray-close" aria-label="Close" data-astro-cid-ozbv6gvd>×</button> </header> <div class="fb__tray-body" data-astro-cid-ozbv6gvd> <div class="fb__actions" role="toolbar" aria-label="Spells" data-astro-cid-ozbv6gvd> `, ' </div> <p class="fb__tray-blurb" data-astro-cid-ozbv6gvd>Peach-style magic words. Click a chip, or type <code data-astro-cid-ozbv6gvd>+confetti</code> in the bar above. Spells live in <code data-astro-cid-ozbv6gvd>src/data/spells.ts</code>.</p> <ul class="fb-spells" data-astro-cid-ozbv6gvd> ', ' </ul> <p class="fb__tray-meta mono" data-astro-cid-ozbv6gvd>type <code data-astro-cid-ozbv6gvd>+&lt;name&gt;</code> in the bar · companions auto-dismiss · click ambient surfaces to snuff</p> </div> </div> <div class="fb__menu" id="fb-menu" role="dialog" aria-modal="false" aria-label="PointCast kit binder" hidden data-astro-cid-ozbv6gvd> <div class="fb__menu-scrim" id="fb-menu-scrim" aria-hidden="true" data-astro-cid-ozbv6gvd></div> <div class="fb__menu-panel" id="fb-menu-panel" tabindex="-1" data-astro-cid-ozbv6gvd> <button type="button" class="fb__menu-close" id="fb-menu-close" aria-label="Close binder" data-astro-cid-ozbv6gvd>×</button> <section class="fb-you-section" data-astro-cid-ozbv6gvd> <div class="fb-you-card" data-astro-cid-ozbv6gvd> <img class="fb-you-card__noun" id="fb-menu-noun"', ' alt="Your noun" width="56" height="56" data-astro-cid-ozbv6gvd> <div class="fb-you-card__body" data-astro-cid-ozbv6gvd> <p class="fb-you-card__kicker mono" data-astro-cid-ozbv6gvd>YOU</p> <p class="fb-you-card__name" id="fb-menu-name" data-astro-cid-ozbv6gvd>visitor · noun ', '</p> <p class="fb-you-card__meta mono" id="fb-menu-wallet-status" data-astro-cid-ozbv6gvd>no wallet connected</p> </div> </div> <div class="fb-you-actions" data-astro-cid-ozbv6gvd> <button type="button" class="fb-btn" id="fb-btn-wallet" data-astro-cid-ozbv6gvd>Connect wallet (Beacon)</button> <a class="fb-btn fb-btn--ghost" href="/profile" data-astro-cid-ozbv6gvd>View profile</a> </div> </section> <section class="fb-controls" data-astro-cid-ozbv6gvd> <label class="fb-ctrl" data-astro-cid-ozbv6gvd> <span class="fb-ctrl__name mono" data-astro-cid-ozbv6gvd>MOOD</span> <select class="fb-ctrl__input mono" id="fb-mood-select" data-astro-cid-ozbv6gvd> <option value="" data-astro-cid-ozbv6gvd>— choose —</option> </select> </label> <button type="button" class="fb-btn fb-btn--soundtrack" id="fb-btn-soundtrack" data-astro-cid-ozbv6gvd> <span class="fb-btn__glyph" aria-hidden="true" data-astro-cid-ozbv6gvd>▶</span> <span id="fb-soundtrack-label" data-astro-cid-ozbv6gvd>Soundtrack off</span> </button> <!-- Mood casts: when on, picking a mood also casts a thematic\n             ambient spell on the page. See src/data/mood-spells.ts. --> <label class="fb-ctrl fb-ctrl--row" data-astro-cid-ozbv6gvd> <input type="checkbox" id="fb-auto-cast" class="fb-ctrl__check" checked data-astro-cid-ozbv6gvd> <span class="fb-ctrl__name mono" data-astro-cid-ozbv6gvd>AUTO-CAST ON MOOD</span> <span class="fb-ctrl__hint mono" id="fb-auto-cast-hint" data-astro-cid-ozbv6gvd>marine layer → +rain · quiet → +breath · …</span> </label> </section> <div class="fb__soundtrack" id="fb-soundtrack" data-astro-transition-persist="pc-soundtrack" hidden data-astro-cid-ozbv6gvd></div> <section class="fb-binder" data-astro-cid-ozbv6gvd> <p class="fb-binder__label mono" data-astro-cid-ozbv6gvd>KIT — ', " / ", ' collected</p> <ul class="fb-binder__grid" data-astro-cid-ozbv6gvd> ', ' </ul> </section> <section class="fb-routes" data-astro-cid-ozbv6gvd> <div class="fb-routes__group" data-astro-cid-ozbv6gvd> <p class="fb-routes__label mono" data-astro-cid-ozbv6gvd>ROOMS</p> <div class="fb-routes__links" data-astro-cid-ozbv6gvd> <a href="/tonight" data-astro-cid-ozbv6gvd>tonight</a> <a href="/room" data-astro-cid-ozbv6gvd>room</a> <a href="/meditate" data-astro-cid-ozbv6gvd>meditate</a> <a href="/bath" data-astro-cid-ozbv6gvd>bath</a> </div> </div> <div class="fb-routes__group" data-astro-cid-ozbv6gvd> <p class="fb-routes__label mono" data-astro-cid-ozbv6gvd>GAMES</p> <div class="fb-routes__links" data-astro-cid-ozbv6gvd> <a href="/farm" data-astro-cid-ozbv6gvd>farm</a> <a href="/agent-derby" data-astro-cid-ozbv6gvd>derby</a> <a href="/battle" data-astro-cid-ozbv6gvd>battle</a> <a href="/nouns-open-circuit" data-astro-cid-ozbv6gvd>circuit</a> <a href="/yee" data-astro-cid-ozbv6gvd>yee</a> <a href="/nouns-cola-crush" data-astro-cid-ozbv6gvd>cola</a> <a href="/collabs/relay" data-astro-cid-ozbv6gvd>relay</a> </div> </div> <div class="fb-routes__group" data-astro-cid-ozbv6gvd> <p class="fb-routes__label mono" data-astro-cid-ozbv6gvd>AGENTS</p> <div class="fb-routes__links" data-astro-cid-ozbv6gvd> <a href="/for-agents" data-astro-cid-ozbv6gvd>for-agents</a> <a href="/agents.json" data-astro-cid-ozbv6gvd>agents.json</a> <a href="/llms.txt" data-astro-cid-ozbv6gvd>llms.txt</a> <a href="/explore" data-astro-cid-ozbv6gvd>explore</a> <a href="/knock" data-astro-cid-ozbv6gvd>knock</a> <a href="/status" data-astro-cid-ozbv6gvd>status</a> </div> </div> <div class="fb-routes__group" data-astro-cid-ozbv6gvd> <p class="fb-routes__label mono" data-astro-cid-ozbv6gvd>RELEASE</p> <div class="fb-routes__links" data-astro-cid-ozbv6gvd> <a href="/gamgee" data-astro-cid-ozbv6gvd>gamgee (RC0)</a> <a href="/sprints" data-astro-cid-ozbv6gvd>sprints</a> <a href="/now" data-astro-cid-ozbv6gvd>now</a> </div> </div> </section> <footer class="fb-live mono" data-astro-cid-ozbv6gvd> <span class="fb-live__dot" aria-hidden="true" data-astro-cid-ozbv6gvd></span> <span id="fb-live-copy" data-astro-cid-ozbv6gvd>marine layer · el segundo · <span id="fb-live-here" data-astro-cid-ozbv6gvd>—</span> here</span> <a class="fb-live__link" href="https://github.com/mhoydich/pointcast" target="_blank" rel="noopener" data-astro-cid-ozbv6gvd>github ↗</a> </footer> </div> </div> </aside> <script>', `<\/script> <script>
  (function () {
    'use strict';

    var $bar       = document.getElementById('pc-fb');
    var $you       = document.getElementById('fb-you');
    var $menuBtn   = document.getElementById('fb-menu-btn');
    var $menu      = document.getElementById('fb-menu');
    var $panel     = document.getElementById('fb-menu-panel');
    var $scrim     = document.getElementById('fb-menu-scrim');
    var $close     = document.getElementById('fb-menu-close');
    var $omni      = document.getElementById('fb-omni');
    var $omniForm  = document.getElementById('fb-omni-form');
    var $omniMode  = document.getElementById('fb-omni-mode');
    var $moodLabel = document.getElementById('fb-mood-label');
    var $youLabel  = document.getElementById('fb-you-label');
    var $noun      = document.getElementById('fb-noun');
    var $menuNoun  = document.getElementById('fb-menu-noun');
    var $menuName  = document.getElementById('fb-menu-name');
    var $menuWallet = document.getElementById('fb-menu-wallet-status');
    var $walletBtn = document.getElementById('fb-btn-wallet');
    var $moodSelect = document.getElementById('fb-mood-select');
    var $soundBtn  = document.getElementById('fb-btn-soundtrack');
    var $soundLabel = document.getElementById('fb-soundtrack-label');
    var $soundtrack = document.getElementById('fb-soundtrack');
    var $liveHere  = document.getElementById('fb-live-here');

    if (!$bar || !$menu) return;

    try {
      var st = window.PC_SOUNDTRACKS || {};
      Object.keys(st).forEach(function (k) {
        var opt = document.createElement('option');
        opt.value = k;
        opt.textContent = (st[k].label || k).toLowerCase();
        $moodSelect.appendChild(opt);
      });
    } catch (e) {}

    var openPopover = null;
    var lastFocused = null;

    function getTrayEl(id) { return document.getElementById('fb-tray-' + id); }
    function getStampEl(id) { return document.getElementById('fb-stamp-' + id); }

    function closeAll() {
      if ($menu.getAttribute('data-open') === 'true') {
        $menu.setAttribute('data-open', 'false');
        setTimeout(function () { $menu.hidden = true; }, 220);
        $menuBtn.setAttribute('aria-expanded', 'false');
        $you.setAttribute('aria-expanded', 'false');
      }
      document.querySelectorAll('.fb__tray').forEach(function (tr) {
        if (tr.getAttribute('data-open') === 'true') {
          tr.setAttribute('data-open', 'false');
          setTimeout(function () { tr.hidden = true; }, 200);
          var stampId = tr.id.replace('fb-tray-', '');
          var st = getStampEl(stampId);
          if (st) st.setAttribute('aria-expanded', 'false');
        }
      });
      openPopover = null;
      document.removeEventListener('keydown', onEsc);
      if (lastFocused && typeof lastFocused.focus === 'function') {
        try { lastFocused.focus(); } catch (e) {}
      }
    }

    function onEsc(e) {
      if (e.key === 'Escape') { e.preventDefault(); closeAll(); }
    }

    function openMenu() {
      closeAll();
      lastFocused = document.activeElement;
      $menu.hidden = false;
      void $menu.offsetWidth;
      $menu.setAttribute('data-open', 'true');
      $menuBtn.setAttribute('aria-expanded', 'true');
      $you.setAttribute('aria-expanded', 'true');
      setTimeout(function () { try { $panel.focus(); } catch (e) {} }, 10);
      openPopover = 'menu';
      document.addEventListener('keydown', onEsc);
    }

    function openTray(id) {
      var tray = getTrayEl(id);
      var stamp = getStampEl(id);
      if (!tray || !stamp) return;
      closeAll();
      lastFocused = document.activeElement;
      tray.hidden = false;
      void tray.offsetWidth;
      tray.setAttribute('data-open', 'true');
      stamp.setAttribute('aria-expanded', 'true');
      try {
        var rect = stamp.getBoundingClientRect();
        var trayWidth = tray.getBoundingClientRect().width || 320;
        var winWidth = window.innerWidth;
        var center = rect.left + rect.width / 2;
        var leftPx = Math.max(8, Math.min(center - trayWidth / 2, winWidth - trayWidth - 8));
        tray.style.left = leftPx + 'px';
        tray.style.right = 'auto';
        var arrow = tray.querySelector('.fb__tray-arrow');
        if (arrow) arrow.style.left = (center - leftPx) + 'px';
      } catch (e) {}
      setTimeout(function () {
        var focusable = tray.querySelector('input, textarea, button, select, a[href]');
        if (focusable) try { focusable.focus(); } catch (e) {}
      }, 30);
      openPopover = 'tray:' + id;
      document.addEventListener('keydown', onEsc);
      // Per-tray on-open hooks (defined later in the IIFE; hoisted because
      // they're function declarations).
      try {
        if (id === 'ask') {
          renderEchoes();
          reconcileEchoes();
        } else if (id === 'agent') {
          refreshAgentActivity();
        }
      } catch (e) {}
    }

    document.querySelectorAll('.fb__stamp').forEach(function (st) {
      st.addEventListener('click', function () {
        var id = st.getAttribute('data-stamp-id');
        if (openPopover === 'tray:' + id) closeAll();
        else openTray(id);
      });
    });
    document.querySelectorAll('.fb-binder__open').forEach(function (bc) {
      bc.addEventListener('click', function () {
        var id = bc.getAttribute('data-tray');
        closeAll();
        setTimeout(function () { openTray(id); }, 240);
      });
    });
    document.querySelectorAll('.fb__tray-close').forEach(function (btn) {
      btn.addEventListener('click', closeAll);
    });

    document.addEventListener('mousedown', function (e) {
      if (!openPopover) return;
      var t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest('.fb__tray') || t.closest('.fb__menu-panel') ||
          t.closest('.fb__stamp') || t.closest('.fb-binder__open') ||
          t.closest('#fb-menu-btn') || t.closest('#fb-you')) return;
      closeAll();
    });

    $menuBtn.addEventListener('click', function () {
      if (openPopover === 'menu') closeAll();
      else openMenu();
    });
    $you.addEventListener('click', function () {
      if (openPopover === 'menu') closeAll();
      else openMenu();
    });
    $close.addEventListener('click', closeAll);
    $scrim.addEventListener('click', closeAll);

    var KIT = window.PC_DOCK_KIT || [];

    document.addEventListener('keydown', function (e) {
      var meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        $omni.focus();
        $omni.select();
        return;
      }
      if (e.key >= '1' && e.key <= '9') {
        var idx = Number(e.key) - 1;
        if (KIT[idx]) {
          e.preventDefault();
          openTray(KIT[idx].id);
        }
      }
    });

    function inferOmniMode(value) {
      var v = String(value || '').trim();
      if (!v) return roomOn ? 'SAY' : 'GO';
      if (v.charAt(0) === '+') return 'CAST';
      if (v.charAt(0) === '>') return 'OP';
      if (v.charAt(0) === '?') return 'ASK';
      if (v.charAt(0) === '@') return 'AGT';
      if (v.charAt(0) === '/' || /^https?:\\\\/\\\\//.test(v)) return 'GO';
      if (roomOn) return 'SAY';
      return 'GO';
    }

    function applyOmniMode() {
      if (!$omniMode) return;
      var mode = inferOmniMode($omni.value);
      $omniMode.textContent = mode;
      $omniMode.setAttribute('data-mode', mode.toLowerCase());
    }

    $omni.addEventListener('input', function () {
      applyOmniMode();
      try { syncBubbleFromInput(); } catch (e) {}
    });
    $omni.addEventListener('focus', function () {
      applyOmniMode();
      try { syncBubbleFromInput(); } catch (e) {}
    });
    $omni.addEventListener('blur', function () {
      // Hide if not in a sent-snapshot window. Empty input still clears.
      if (!bubbleState.persistUntil || Date.now() >= bubbleState.persistUntil) {
        if (!String($omni.value || '').trim()) hideBubble();
      }
    });

    $omniForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var raw = String($omni.value || '').trim();
      if (!raw) return;
      var mode = inferOmniMode(raw);
      if (mode === 'CAST') {
        // Magic word — \\\`+confetti\\\`, \\\`+cat\\\`, \\\`+breath\\\`, \\\`+candle\\\`, \\\`+clear\\\`.
        // Strip the prefix, take first word, emit pc:spell:cast.
        var spellId = raw.replace(/^\\\\+\\\\s*/, '').split(/\\\\s+/)[0].toLowerCase();
        if (spellId === 'clear') {
          window.dispatchEvent(new CustomEvent('pc:spell:clear'));
        } else if (spellId) {
          window.dispatchEvent(new CustomEvent('pc:spell:cast', { detail: { id: spellId } }));
        }
        $omni.value = '';
        applyOmniMode();
        return;
      }
      if (mode === 'OP') {
        // Operator command — \\\`>cmd args\\\`. Mike 2026-05-01: director mode
        // kickoff. Recognized commands run for real; unrecognized soft-
        // toast in the placeholder so the user sees the parse.
        var rest = raw.replace(/^>\\\\s*/, '').trim();
        var parts = rest.split(/\\\\s+/);
        var cmd = (parts.shift() || '').toLowerCase();
        var args = parts.join(' ');
        var ack = runOperatorCommand(cmd, args);
        window.dispatchEvent(new CustomEvent('pc:dock:operator', { detail: { cmd: cmd, args: args, raw: rest } }));
        // Soft toast in the omnibox placeholder so user gets feedback.
        var prevPlaceholder = $omni.placeholder;
        $omni.value = '';
        $omni.placeholder = ack;
        applyOmniMode();
        setTimeout(function () { $omni.placeholder = prevPlaceholder; }, 3000);
        return;
      }
      if (mode === 'ASK') {
        var body = raw.replace(/^\\\\?\\\\s*/, '');
        openTray('ask');
        var tb = document.getElementById('fb-ask-body');
        if (tb) { tb.value = body; tb.dispatchEvent(new Event('input')); }
        $omni.value = '';
        applyOmniMode();
        return;
      }
      if (mode === 'AGT') {
        openTray('agent');
        var slug = raw.replace(/^@\\\\s*/, '').split(/\\\\s+/)[0].toLowerCase();
        var btn = document.querySelector('.fb-resident__btn[data-ping-slug="' + slug + '"]');
        if (btn) btn.click();
        $omni.value = '';
        applyOmniMode();
        return;
      }
      if (mode === 'SAY') {
        window.dispatchEvent(new CustomEvent('pc:room:chat', { detail: { msg: raw } }));
        // Snapshot the sent message into the bubble for ~4s if anyone
        // else is here to read it. Same gates as live-typing preview.
        try {
          if (roomOn && bubbleState.othersPresent) showBubble(raw, 4000);
          else hideBubble();
        } catch (e) {}
        $omni.value = '';
        $omni.placeholder = 'say something…';
        applyOmniMode();
        return;
      }
      if (raw.startsWith('/') || /^https?:\\\\/\\\\//.test(raw)) {
        window.location.href = raw;
        return;
      }
      var maybe = '/' + raw.replace(/^\\\\/+/, '').split(/\\\\s+/)[0];
      window.location.href = '/search?q=' + encodeURIComponent(raw) + '&from=' + encodeURIComponent(maybe);
    });

    var roomOn = true;
    try {
      var v = localStorage.getItem('pc:room:on');
      if (v === '0') roomOn = false;
      else if (v === '1') roomOn = true;
      else roomOn = true;
    } catch (e) {}

    function applyRoomUI() {
      var stamp = getStampEl('room');
      if (stamp) stamp.setAttribute('data-on', roomOn ? 'true' : 'false');
      var dot = document.getElementById('fb-stamp-dot-room');
      if (dot) dot.setAttribute('data-state', roomOn ? 'on' : 'off');
      if ($omni) $omni.placeholder = roomOn ? 'say something…' : 'ask or go…';
      var label = document.getElementById('fb-tray-room-label');
      var btn = document.getElementById('fb-tray-room-toggle');
      if (label) label.textContent = roomOn ? 'Room: ON' : 'Room: OFF';
      if (btn) btn.setAttribute('aria-pressed', roomOn ? 'true' : 'false');
      applyOmniMode();
      // Bubble follows room state — turning room off clears any pending
      // bubble; turning it on does nothing yet (waits for input).
      if (!roomOn) try { hideBubble(); } catch (e) {}
    }

    var $roomToggleBtn = document.getElementById('fb-tray-room-toggle');
    if ($roomToggleBtn) {
      $roomToggleBtn.addEventListener('click', function () {
        roomOn = !roomOn;
        try { localStorage.setItem('pc:room:on', roomOn ? '1' : '0'); } catch (e) {}
        applyRoomUI();
        window.dispatchEvent(new CustomEvent('pc:room:toggle', { detail: { on: roomOn } }));
      });
    }
    applyRoomUI();

    var $askForm = document.getElementById('fb-ask-form');
    var $askBody = document.getElementById('fb-ask-body');
    var $askTo   = document.getElementById('fb-ask-to');
    var $askCount = document.getElementById('fb-ask-count');
    var $askStatus = document.getElementById('fb-ask-status');
    var $echoes      = document.getElementById('fb-echoes');
    var $echoesList  = document.getElementById('fb-echoes-list');
    var $echoesCount = document.getElementById('fb-echoes-counts');

    if ($askBody && $askCount) {
      $askBody.addEventListener('input', function () {
        $askCount.textContent = String($askBody.value.length) + ' / 2000';
      });
    }

    // ─── Echoes — visible round-trip for ASK ──────────────────────
    // Mike 2026-04-29 sprint: "fun just started interacting" → make
    // the loop visible. Each send is stashed in localStorage; when the
    // ASK tray opens we re-render and check /blocks.json for any block
    // whose \\\`source\\\` references a stashed ping key — those flip to
    // "answered" with a link to the block.
    var ECHOES_KEY = 'pc:ask:echoes';
    var ECHOES_MAX = 6;

    function loadEchoes() {
      try {
        var raw = localStorage.getItem(ECHOES_KEY);
        var arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch (e) { return []; }
    }
    function saveEchoes(arr) {
      try { localStorage.setItem(ECHOES_KEY, JSON.stringify(arr.slice(-ECHOES_MAX))); } catch (e) {}
    }
    function addEcho(echo) {
      var arr = loadEchoes();
      arr.push(echo);
      saveEchoes(arr);
    }
    function shortTime(ts) {
      try {
        var d = new Date(ts);
        var hh = String(d.getHours()).padStart(2, '0');
        var mm = String(d.getMinutes()).padStart(2, '0');
        return hh + ':' + mm;
      } catch (e) { return '—'; }
    }
    function renderEchoes() {
      if (!$echoes || !$echoesList) return;
      var arr = loadEchoes();
      if (!arr.length) {
        $echoes.hidden = true;
        return;
      }
      $echoes.hidden = false;
      var answered = arr.filter(function (e) { return e.status === 'answered'; }).length;
      if ($echoesCount) {
        $echoesCount.textContent = answered + ' / ' + arr.length + ' answered';
      }
      function escapeHtml(str) {
        return String(str || '').replace(/[<>&"]/g, function (c) {
          return c === '<' ? '&lt;'
               : c === '>' ? '&gt;'
               : c === '&' ? '&amp;'
               : '&quot;';
        });
      }
      $echoesList.innerHTML = arr.slice().reverse().map(function (e) {
        var pill = e.status === 'answered'
          ? ('<a class="fb-echo__pill fb-echo__pill--answered mono" href="' + (e.blockHref || '#') + '">✓ answered</a>')
          : '<span class="fb-echo__pill fb-echo__pill--sent mono">● sent</span>';
        // Mike 2026-05-02: when a block has answered an ASK, render the
        // reply text inline as a parchment quote — closes the round-trip
        // loop visually all the way around. Body cap at 220 chars; click
        // through to the block for the rest.
        var reply = '';
        if (e.status === 'answered' && (e.blockBody || e.blockTitle)) {
          var title = escapeHtml(e.blockTitle || '');
          var bodyText = String(e.blockBody || '');
          var truncated = bodyText.length > 220;
          var bodyEsc = escapeHtml(bodyText.slice(0, 220)) + (truncated ? '…' : '');
          var author = escapeHtml(e.blockAuthor || 'cast');
          var blockId = escapeHtml(e.blockId || '');
          reply =
            '<div class="fb-echo__reply">' +
              '<a class="fb-echo__reply-link" href="' + (e.blockHref || '#') + '">' +
                '<span class="fb-echo__reply-kicker mono">' + author + ' replied · № ' + blockId + '</span>' +
                (title ? '<span class="fb-echo__reply-title">' + title + '</span>' : '') +
                '<span class="fb-echo__reply-body">' + bodyEsc + '</span>' +
                (truncated ? '<span class="fb-echo__reply-more mono">read full block ↗</span>' : '') +
              '</a>' +
            '</div>';
        }
        return '<li class="fb-echo">' +
          '<div class="fb-echo__row">' +
            '<span class="fb-echo__time mono">' + shortTime(e.ts) + '</span>' +
            '<span class="fb-echo__to mono">→ ' + escapeHtml(e.to || 'cast') + '</span>' +
            '<span class="fb-echo__body">' + escapeHtml(e.body || '') + '</span>' +
            pill +
          '</div>' +
          reply +
          '</li>';
      }).join('');
    }

    // ─── AGENT stamp activity ──────────────────────────────────────
    // The 03 AGENT stamp gets a green "live" dot when residents are
    // active. Reads /agents.json (the agent-readable manifest), counts
    // entries with status='resident'/'live'/'director'. Cheap, fails
    // silent. Heuristic: 1 live = on, 2+ = busy (pulsing).
    var AGENT_ACTIVITY_TTL = 10 * 60 * 1000;
    var agentActivityCache = { ts: 0, data: null };
    async function refreshAgentActivity() {
      var dot = document.getElementById('fb-stamp-dot-agent');
      if (!dot) return;
      try {
        var now = Date.now();
        var data;
        if (agentActivityCache.data && (now - agentActivityCache.ts) < AGENT_ACTIVITY_TTL) {
          data = agentActivityCache.data;
        } else {
          var r = await fetch('/agents.json', { cache: 'no-store' });
          if (!r.ok) return;
          data = await r.json();
          agentActivityCache = { ts: now, data: data };
        }
        var residents = (data && data.residents) || (data && data.agents) || [];
        var liveCount = 0;
        for (var i = 0; i < residents.length; i++) {
          var x = residents[i];
          if (x && (x.status === 'resident' || x.status === 'live' || x.status === 'director')) liveCount++;
        }
        if (liveCount >= 2) {
          dot.setAttribute('data-state', 'busy');
        } else if (liveCount >= 1) {
          dot.setAttribute('data-state', 'on');
        } else {
          dot.setAttribute('data-state', 'off');
        }
      } catch (e) {}
    }

    // Cross-check echoes against published blocks. If a block's \\\`source\\\`
    // string contains the ping key from any echo, mark it answered.
    var ECHO_BLOCKS_TTL = 60 * 1000;
    var echoBlocksCache = { ts: 0, data: null };
    async function reconcileEchoes() {
      var arr = loadEchoes();
      // Mike 2026-05-02: also re-process answered-but-missing-body echoes
      // so old localStorage entries from before reply-rendering shipped
      // get backfilled with title/body/author on next load.
      var pending = arr.filter(function (e) {
        if (!e.key) return false;
        if (e.status !== 'answered') return true;
        return !e.blockBody && !e.blockTitle;
      });
      if (!pending.length) return;
      try {
        var now = Date.now();
        var data;
        if (echoBlocksCache.data && (now - echoBlocksCache.ts) < ECHO_BLOCKS_TTL) {
          data = echoBlocksCache.data;
        } else {
          var r = await fetch('/blocks.json', { cache: 'no-store' });
          if (!r.ok) return;
          data = await r.json();
          echoBlocksCache = { ts: now, data: data };
        }
        var blocks = Array.isArray(data) ? data : (data && data.blocks) || [];
        var changed = false;
        for (var i = 0; i < arr.length; i++) {
          var echo = arr[i];
          if (!echo.key) continue;
          // Skip echoes that are already fully answered with body data.
          if (echo.status === 'answered' && (echo.blockBody || echo.blockTitle)) continue;
          for (var j = 0; j < blocks.length; j++) {
            var b = blocks[j];
            var src = (b && b.source) || '';
            if (typeof src === 'string' && src.indexOf(echo.key) !== -1) {
              echo.status = 'answered';
              echo.blockId = b.id;
              echo.blockHref = '/b/' + b.id;
              // Mike 2026-05-02: stash enough of the reply to render
              // it inline in the echo card. Cap body at 320 chars in
              // storage; render-time truncates further.
              echo.blockTitle = String(b.title || '').slice(0, 80);
              echo.blockBody = String(b.body || b.dek || '').slice(0, 320);
              echo.blockAuthor = String(b.author || 'cast').slice(0, 20);
              changed = true;
              break;
            }
          }
        }
        if (changed) {
          saveEchoes(arr);
          renderEchoes();
        }
      } catch (e) {}
    }

    if ($askForm) {
      $askForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var body = String($askBody.value || '').trim();
        if (!body) return;
        var to = $askTo.value || 'cast';
        $askStatus.textContent = 'sending…';
        $askStatus.setAttribute('data-state', 'pending');
        var expand = $askForm.getAttribute('data-expand') === 'true';
        var addr = '';
        try { addr = localStorage.getItem('pc:wallet-active') || ''; } catch (e) {}
        var payload = {
          type: 'pc-ping-v1',
          subject: 'ask · footer · → ' + to,
          body: body,
          from: addr ? ('wallet ' + addr.slice(0, 6) + '…' + addr.slice(-4) + ' (footer/ask)') : 'visitor (footer/ask)',
          timestamp: new Date().toISOString(),
        };
        if (addr) payload.address = addr;
        if (expand) payload.expand = true;
        try {
          var res = await fetch('/api/ping', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            $askStatus.textContent = expand
              ? 'sent · expand flag set — cc drafts a block on next read.'
              : 'sent. one of us picks this up next session.';
            $askStatus.setAttribute('data-state', 'ok');
            try {
              var payload = await res.clone().json();
              addEcho({
                key: payload && payload.key ? String(payload.key) : '',
                ts: new Date().toISOString(),
                to: to,
                body: body.slice(0, 140),
                status: 'sent',
              });
            } catch (e) {}
            $askBody.value = '';
            if ($askCount) $askCount.textContent = '0 / 2000';
            $askForm.removeAttribute('data-expand');
            renderEchoes();
          } else if (res.status === 503) {
            $askStatus.textContent = 'inbox not bound on this preview — try pointcast.xyz';
            $askStatus.setAttribute('data-state', 'warn');
          } else {
            $askStatus.textContent = 'send failed (' + res.status + '). try again.';
            $askStatus.setAttribute('data-state', 'err');
          }
        } catch (err) {
          $askStatus.textContent = 'network error — try again.';
          $askStatus.setAttribute('data-state', 'err');
        }
      });
    }

    document.querySelectorAll('.fb-resident__btn').forEach(function (rbtn) {
      rbtn.addEventListener('click', function () {
        var slug = rbtn.getAttribute('data-ping-slug');
        if (!slug) return;
        openTray('ask');
        if ($askTo) {
          var opts = $askTo.options;
          for (var i = 0; i < opts.length; i++) {
            if (opts[i].value === slug) { $askTo.selectedIndex = i; break; }
          }
        }
        if ($askBody) try { $askBody.focus(); } catch (e) {}
      });
    });

    function refreshWalletUI() {
      try {
        var wallets = JSON.parse(localStorage.getItem('pc:wallets') || '[]');
        var activeAddr = localStorage.getItem('pc:wallet-active');
        var active = null;
        if (activeAddr && Array.isArray(wallets)) {
          for (var i = 0; i < wallets.length; i++) {
            if (wallets[i] && wallets[i].address === activeAddr) { active = wallets[i]; break; }
          }
        }
        if (active && active.address) {
          var short = active.address.slice(0, 6) + '…' + active.address.slice(-4);
          $menuWallet.textContent = 'wallet · ' + short + (active.provider ? ' · ' + active.provider : '');
          $walletBtn.textContent = 'Disconnect';
          $walletBtn.setAttribute('data-state', 'connected');
          $menuName.textContent = short;
          $youLabel.textContent = short.slice(0, 7);
        } else {
          $menuWallet.textContent = 'no wallet connected';
          $walletBtn.textContent = 'Connect wallet (Beacon)';
          $walletBtn.setAttribute('data-state', 'disconnected');
          $youLabel.textContent = 'visitor';
        }
      } catch (e) {}
    }
    $walletBtn.addEventListener('click', function () {
      var state = $walletBtn.getAttribute('data-state');
      var chipBtn = document.querySelector('.wallet-chip__btn');
      if (state === 'connected' && chipBtn) { chipBtn.click(); return; }
      if (chipBtn) { chipBtn.click(); return; }
      window.location.href = '/profile';
    });
    window.addEventListener('pc:wallet-change', refreshWalletUI);
    refreshWalletUI();

    $moodSelect.addEventListener('change', function () {
      var k = $moodSelect.value;
      if (!k) return;
      window.dispatchEvent(new CustomEvent('pc:mood-changed', { detail: { moodId: k } }));
      var st = (window.PC_SOUNDTRACKS || {})[k];
      if (st && st.label) {
        $moodLabel.textContent = String(st.label).toLowerCase();
        $soundLabel.textContent = 'Play ' + String(st.label).toLowerCase();
      }
      try { localStorage.setItem('pc:music:mood', k); } catch (e) {}
    });
    window.addEventListener('pc:mood-changed', function (e) {
      var k = e && e.detail && e.detail.moodId;
      if (!k) return;
      $moodSelect.value = k;
      var st = (window.PC_SOUNDTRACKS || {})[k];
      if (st && st.label) $moodLabel.textContent = String(st.label).toLowerCase();
      // Mike 2026-05-02: mood-spells. Cast a thematically-matched
      // spell when the mood changes. Silent no-op if SpellLayer
      // isn't mounted on this page or if auto-cast is off. Clears
      // any current ambient first so we don't pile candles + rain
      // on top of each other.
      try { castMoodSpell(k, /* fromUserChange */ true); } catch (err) {}
    });

    // Read auto-cast pref. Defaults ON for first-time visitors —
    // the whole point is "the dock becomes a room dial". Visitors
    // who want a quiet page flip it off in the binder.
    function autoCastEnabled() {
      try {
        var v = localStorage.getItem('pc:dock:auto-cast');
        if (v === '0') return false;
        return true; // default '1' (also covers null on first visit)
      } catch (e) { return true; }
    }
    function setAutoCast(on) {
      try { localStorage.setItem('pc:dock:auto-cast', on ? '1' : '0'); } catch (e) {}
      var $cb = document.getElementById('fb-auto-cast');
      if ($cb) $cb.checked = !!on;
      // If turning off, clear any active ambient. If turning on, cast
      // the current mood's spell (if any) so the page reflects state.
      if (!on) {
        window.dispatchEvent(new CustomEvent('pc:spell:clear'));
      } else {
        try {
          var mid = localStorage.getItem('pc:music:mood');
          if (mid) castMoodSpell(mid, false);
        } catch (e) {}
      }
    }
    // Wire the checkbox + initial sync.
    (function () {
      var $cb = document.getElementById('fb-auto-cast');
      if (!$cb) return;
      $cb.checked = autoCastEnabled();
      $cb.addEventListener('change', function () { setAutoCast($cb.checked); });
    })();

    // Operator command: \\\`>autocast on/off\\\`. Listen on pc:dock:operator
    // so this stays decoupled from runOperatorCommand (which lives in
    // PR #318's director mode work). When #318 merges, the case can
    // also be added there for placeholder-toast accuracy.
    window.addEventListener('pc:dock:operator', function (e) {
      var d = e && e.detail;
      if (!d || d.cmd !== 'autocast') return;
      var v = String(d.args || '').trim().toLowerCase();
      if (v === 'on' || v === '1' || v === 'enable')   setAutoCast(true);
      else if (v === 'off' || v === '0' || v === 'disable') setAutoCast(false);
      else setAutoCast(!autoCastEnabled()); // bare \\\`>autocast\\\` toggles
      // Override the stub ack with something honest.
      try {
        var prev = $omni.placeholder;
        $omni.placeholder = '> autocast ' + (autoCastEnabled() ? 'on · mood drives spells' : 'off · spells stay silent');
        setTimeout(function () { $omni.placeholder = prev; }, 2400);
      } catch (er) {}
    });
    function castMoodSpell(moodId, fromUserChange) {
      if (!autoCastEnabled()) return;
      var spellId = (window.PC_MOOD_SPELLS || {})[moodId];
      if (!spellId) return;
      // Clear any currently-cast ambient so the new mood takes over
      // rather than stacking.
      window.dispatchEvent(new CustomEvent('pc:spell:clear'));
      // Tiny delay so the clear-all completes its DOM removals before
      // the new spell renders. Smoother visual transition.
      setTimeout(function () {
        window.dispatchEvent(new CustomEvent('pc:spell:cast', { detail: { id: spellId, source: fromUserChange ? 'mood-change' : 'mood-replay' } }));
      }, fromUserChange ? 240 : 0);
    }

    try {
      var prior = localStorage.getItem('pc:music:mood');
      if (prior && (window.PC_SOUNDTRACKS || {})[prior]) {
        $moodSelect.value = prior;
        $moodLabel.textContent = (window.PC_SOUNDTRACKS[prior].label || prior).toLowerCase();
        // Replay the mood's spell on page load (if auto-cast is on).
        // Delay long enough for SpellLayer to register its listeners.
        setTimeout(function () { try { castMoodSpell(prior, false); } catch (e) {} }, 1800);
      }
    } catch (e) {}

    $soundBtn.addEventListener('click', function () {
      var k = $moodSelect.value;
      if (!k) {
        $soundLabel.textContent = 'pick a mood first';
        return;
      }
      var st = (window.PC_SOUNDTRACKS || {})[k];
      if (!st || !st.url) { $soundLabel.textContent = 'no soundtrack for this mood'; return; }
      if ($soundtrack.hidden) {
        $soundtrack.hidden = false;
        $soundtrack.innerHTML = '<iframe src="' + st.url + '" width="100%" height="80" frameborder="0" allow="autoplay; encrypted-media" loading="lazy" title="PointCast soundtrack"></iframe>';
        $soundLabel.textContent = 'Playing · stop';
        try { localStorage.setItem('pc:music:playing', '1'); } catch (e) {}
      } else {
        $soundtrack.hidden = true;
        $soundtrack.innerHTML = '';
        $soundLabel.textContent = 'Play ' + (st.label || k).toLowerCase();
        try { localStorage.setItem('pc:music:playing', '0'); } catch (e) {}
      }
    });

    // ─── speech-bubble mode (Mike 2026-04-30) ───────────────────
    // The bar grows a chat-bubble face when room is on, others are
    // present, and omni is in SAY mode. Three signals together gate
    // visibility; presence count flips bubbleState.othersPresent.
    var bubbleState = { othersPresent: false, hideTimer: 0, persistTimer: 0, persistUntil: 0 };

    var $bubble     = document.getElementById('fb-bubble');
    var $bubbleBody = document.getElementById('fb-bubble-body');

    function clampBubble(s, n) {
      var str = String(s || '');
      if (str.length <= n) return str;
      return str.slice(0, n - 1) + '…';
    }

    function hideBubble() {
      if (!$bubble) return;
      bubbleState.persistUntil = 0;
      if (bubbleState.hideTimer) { clearTimeout(bubbleState.hideTimer); bubbleState.hideTimer = 0; }
      if (bubbleState.persistTimer) { clearTimeout(bubbleState.persistTimer); bubbleState.persistTimer = 0; }
      $bubble.setAttribute('data-state', 'hidden');
      setTimeout(function () {
        if ($bubble.getAttribute('data-state') === 'hidden') $bubble.hidden = true;
      }, 200);
    }

    function showBubble(text, persistMs) {
      if (!$bubble || !$bubbleBody) return;
      if (!roomOn || !bubbleState.othersPresent) { hideBubble(); return; }
      $bubbleBody.textContent = clampBubble(text, 100);
      $bubble.hidden = false;
      void $bubble.offsetWidth;
      $bubble.setAttribute('data-state', persistMs ? 'sent' : 'typing');
      if (bubbleState.hideTimer) { clearTimeout(bubbleState.hideTimer); bubbleState.hideTimer = 0; }
      if (bubbleState.persistTimer) { clearTimeout(bubbleState.persistTimer); bubbleState.persistTimer = 0; }
      if (persistMs && persistMs > 0) {
        bubbleState.persistUntil = Date.now() + persistMs;
        bubbleState.persistTimer = setTimeout(function () {
          bubbleState.persistUntil = 0;
          if (roomOn && bubbleState.othersPresent && inferOmniMode($omni.value) === 'SAY' && $omni.value.trim()) {
            showBubble($omni.value, 0);
          } else {
            hideBubble();
          }
        }, persistMs);
      }
    }

    function syncBubbleFromInput() {
      if (bubbleState.persistUntil && Date.now() < bubbleState.persistUntil) return;
      if (!roomOn || !bubbleState.othersPresent) { hideBubble(); return; }
      var mode = inferOmniMode($omni.value);
      var raw = String($omni.value || '').trim();
      if (mode !== 'SAY' || !raw) { hideBubble(); return; }
      showBubble(raw, 0);
    }

    async function updatePresence() {
      try {
        var r = await fetch('/api/presence/snapshot', { cache: 'no-store' });
        if (!r.ok) return;
        var j = await r.json();
        var h = Number(j.humans ?? 0);
        var a = Number(j.agents ?? 0);
        var total = h + a;
        if ($liveHere) $liveHere.textContent = String(total);
        var here = document.getElementById('fb-tray-room-here');
        if (here) here.textContent = String(total);
        // Bubble cares whether anyone else is here (>1 means at least one peer).
        bubbleState.othersPresent = total > 1;
        if (!bubbleState.othersPresent) hideBubble();
        var dot = document.getElementById('fb-stamp-dot-room');
        if (dot) {
          if (roomOn && total > 1) dot.setAttribute('data-state', 'busy');
          else dot.setAttribute('data-state', roomOn ? 'on' : 'off');
        }
      } catch (e) {}
    }
    updatePresence();
    setInterval(updatePresence, 45 * 1000);

    // Initial pulses for echoes + agent activity. Both fail silently
    // when the endpoints aren't reachable (dev preview, offline).
    setTimeout(function () {
      try { reconcileEchoes(); } catch (e) {}
      try { refreshAgentActivity(); } catch (e) {}
    }, 1500);
    setInterval(function () {
      try { reconcileEchoes(); } catch (e) {}
    }, 90 * 1000);
    setInterval(function () {
      try { refreshAgentActivity(); } catch (e) {}
    }, 5 * 60 * 1000);

    // ─── v4.1 — buttons + studio + comms hooks ───────────────────
    // Sprint 2026-04-30: "go towards buttons and expanded menus, and
    // then eventually broadcaster, director" + "communicate with others".
    // The single switch below routes every quick-action click to its
    // handler. New trays/actions add a \\\`case\\\` here, not new wiring.

    // Walked-up wallet address — used to auto-stamp pings with \\\`address\\\`.
    function activeWalletAddress() {
      try {
        var addr = localStorage.getItem('pc:wallet-active');
        return addr && typeof addr === 'string' ? addr : '';
      } catch (e) { return ''; }
    }

    // ─── Director mode (Mike 2026-05-01) ──────────────────────────
    // Recognized via localStorage[pc:director]='1' for now. Real
    // wallet-address recognition (matching MH's tz address) is a
    // follow-up sprint. The flag flips body[data-director='true'],
    // which CSS uses to show the gold inline forms in the BROADCAST
    // tray + the ★ DIR badge on the YOU chip.
    function isDirector() {
      try {
        if (localStorage.getItem('pc:director') === '1') return true;
      } catch (e) {}
      // Future: also return true if activeWalletAddress() matches a
      // configured director list. Empty for now.
      return false;
    }

    function applyDirectorUI() {
      var on = isDirector();
      try { document.body.setAttribute('data-director', on ? 'true' : 'false'); } catch (e) {}
      var $badge = document.getElementById('fb-dir-badge');
      if ($badge) $badge.setAttribute('data-on', on ? 'true' : 'false');
      var $note = document.getElementById('fb-bcast-director-note');
      var $controls = document.getElementById('fb-dir-controls');
      if ($note) $note.hidden = on;
      if ($controls) $controls.hidden = !on;
    }

    function setDirector(on) {
      try { localStorage.setItem('pc:director', on ? '1' : '0'); } catch (e) {}
      applyDirectorUI();
    }

    // Boot: apply director UI once on load. Check again on
    // pc:wallet-change so wallet-driven recognition lights up live.
    setTimeout(applyDirectorUI, 0);
    window.addEventListener('pc:wallet-change', applyDirectorUI);
    window.addEventListener('pc:director-change', applyDirectorUI);

    // Director-only ping POST helper. Always tags from='director' and
    // includes the active wallet address if present.
    async function postDirectorPing(subject, body) {
      if (!isDirector()) return { ok: false, reason: 'not-director' };
      try {
        var res = await postPing({
          subject: subject,
          body: body,
          from: 'director (footer/dir)',
        });
        return { ok: res.ok, status: res.status };
      } catch (e) {
        return { ok: false, error: String((e && e.message) || e) };
      }
    }

    // Operator-command runner. Returns a one-line ack string for the
    // omnibox placeholder. Recognized commands: director, mood,
    // announce, schedule. Unrecognized → "?" toast.
    function runOperatorCommand(cmd, args) {
      if (cmd === 'director') {
        var v = (args || '').trim().toLowerCase();
        if (v === 'on' || v === '1' || v === 'enable')   { setDirector(true);  return '> director on · ★ DIR mode lit'; }
        if (v === 'off' || v === '0' || v === 'disable') { setDirector(false); return '> director off · back to visitor'; }
        return '> director on/off — toggles ★ DIR mode locally';
      }
      if (cmd === 'mood') {
        var key = (args || '').trim().toLowerCase();
        if (!key) return '> mood <key> — dispatch a mood (' + Object.keys(window.PC_SOUNDTRACKS || {}).join(', ').slice(0, 60) + '…)';
        if (window.PC_SOUNDTRACKS && window.PC_SOUNDTRACKS[key]) {
          window.dispatchEvent(new CustomEvent('pc:mood-changed', { detail: { moodId: key } }));
          try { localStorage.setItem('pc:music:mood', key); } catch (e) {}
          return '> mood · ' + key + ' set';
        }
        return '> mood · "' + key + '" not in soundtracks';
      }
      if (cmd === 'announce') {
        if (!isDirector()) return '> announce — director only (try >director on)';
        var msg = (args || '').trim();
        if (!msg) return '> announce <msg> — one-line cast announcement';
        postDirectorPing('cast announce', msg);
        return '> announce · queued for residents · ' + msg.slice(0, 40) + (msg.length > 40 ? '…' : '');
      }
      if (cmd === 'schedule') {
        if (!isDirector()) return '> schedule — director only';
        var sched = (args || '').trim();
        if (!sched) return '> schedule <id> <when> — e.g. >schedule 0420 09:00';
        postDirectorPing('schedule', sched);
        return '> schedule · queued · ' + sched.slice(0, 50);
      }
      // Unknown — soft toast.
      return '> ' + (cmd || '?') + (args ? ' · ' + args : '') + ' — unknown command';
    }

    // BROADCAST tray inline forms — wire submit to postDirectorPing.
    var $dirAnnounceForm = document.getElementById('fb-dir-announce-form');
    var $dirAnnounceInput = document.getElementById('fb-dir-announce-input');
    var $dirScheduleForm = document.getElementById('fb-dir-schedule-form');
    var $dirScheduleInput = document.getElementById('fb-dir-schedule-input');
    var $dirStatus = document.getElementById('fb-dir-status');

    function dirToast(text, state) {
      if (!$dirStatus) return;
      $dirStatus.textContent = text;
      $dirStatus.setAttribute('data-state', state || 'pending');
      setTimeout(function () {
        if ($dirStatus.textContent === text) {
          $dirStatus.textContent = '';
          $dirStatus.removeAttribute('data-state');
        }
      }, 4000);
    }

    if ($dirAnnounceForm && $dirAnnounceInput) {
      $dirAnnounceForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var msg = String($dirAnnounceInput.value || '').trim();
        if (!msg) return;
        dirToast('queueing announcement…', 'pending');
        var res = await postDirectorPing('cast announce', msg);
        if (res.ok) {
          dirToast('★ queued for residents — appears as a banner block next session', 'ok');
          $dirAnnounceInput.value = '';
        } else if (res.reason === 'not-director') {
          dirToast('director only — set localStorage[pc:director]=\\\\'1\\\\' or run >director on', 'warn');
        } else if (res.status === 503) {
          dirToast('inbox not bound on this preview — try pointcast.xyz', 'warn');
        } else {
          dirToast('send failed (' + (res.status || 'network') + ')', 'err');
        }
      });
    }
    if ($dirScheduleForm && $dirScheduleInput) {
      $dirScheduleForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var sched = String($dirScheduleInput.value || '').trim();
        if (!sched) return;
        dirToast('queueing schedule…', 'pending');
        var res = await postDirectorPing('schedule', sched);
        if (res.ok) {
          dirToast('★ schedule queued — residents will honor on next session', 'ok');
          $dirScheduleInput.value = '';
        } else if (res.reason === 'not-director') {
          dirToast('director only', 'warn');
        } else {
          dirToast('send failed (' + (res.status || 'network') + ')', 'err');
        }
      });
    }

    function postPing(payload, peerBaseUrl) {
      var url = (peerBaseUrl ? peerBaseUrl.replace(/\\\\/+$/, '') : '') + '/api/ping';
      var addr = activeWalletAddress();
      var enriched = Object.assign({
        type: 'pc-ping-v1',
        timestamp: new Date().toISOString(),
      }, payload || {});
      if (addr && !enriched.address) enriched.address = addr;
      return fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(enriched),
      });
    }

    // ASK template handler — pre-fills the textarea with a starter, focuses.
    var ASK_TEMPLATES = {
      note:   { prefix: 'note · ',  body: '' },
      idea:   { prefix: 'idea · ',  body: '' },
      bug:    { prefix: 'bug · ',   body: 'where: \\\\nwhat happened: \\\\nexpected: ' },
      // Per AGENTS.md: setting expand:true means cc reads, drafts a block
      // in cc-voice editorial. The form posts with that flag included.
      expand: { prefix: 'expand · ', body: 'topic: \\\\nwhy: \\\\nshape: ' },
    };
    function applyAskTemplate(actionId) {
      openTray('ask');
      var tpl = ASK_TEMPLATES[actionId];
      if (!tpl) return;
      var $b = document.getElementById('fb-ask-body');
      if (!$b) return;
      var existing = String($b.value || '');
      var seed = tpl.prefix + tpl.body;
      $b.value = existing ? (seed + '\\\\n\\\\n' + existing) : seed;
      $b.dispatchEvent(new Event('input'));
      try { $b.focus(); $b.setSelectionRange($b.value.length, $b.value.length); } catch (e) {}
      // Stash a hint on the form so the submit handler can include the
      // expand flag for /expand templates.
      var $f = document.getElementById('fb-ask-form');
      if ($f) {
        if (actionId === 'expand') $f.setAttribute('data-expand', 'true');
        else $f.removeAttribute('data-expand');
      }
    }

    // BROADCAST tray polling — read /home or /blocks.json for the
    // latest live block + reuse presence snapshot for audience count.
    async function refreshBroadcast() {
      var $now      = document.getElementById('fb-bcast-now');
      var $nowId    = document.getElementById('fb-bcast-now-id');
      var $nowTitle = document.getElementById('fb-bcast-now-title');
      var $nowChan  = document.getElementById('fb-bcast-now-channel');
      var $time     = document.getElementById('fb-bcast-time');
      var $hereOut  = document.getElementById('fb-bcast-here');
      var $moodOut  = document.getElementById('fb-bcast-mood');
      var $peersOut = document.getElementById('fb-bcast-peers');
      if (!$now) return;
      // Now-playing — pull blocks.json, take the latest non-draft.
      try {
        var r = await fetch('/blocks.json', { cache: 'no-store' });
        if (r.ok) {
          var data = await r.json();
          var blocks = Array.isArray(data) ? data : (data && data.blocks) || [];
          // Sort by timestamp descending — most recent first.
          blocks.sort(function (a, b) {
            var ta = (a && a.timestamp) || ''; var tb = (b && b.timestamp) || '';
            return tb.localeCompare(ta);
          });
          var top = blocks[0];
          if (top) {
            if ($nowId)    $nowId.textContent    = '№ ' + (top.id || '----');
            if ($nowTitle) $nowTitle.textContent = top.title || top.dek || '(untitled)';
            if ($nowChan)  $nowChan.textContent  = (top.channel ? 'CH.' + top.channel : '');
            if ($now && top.id) $now.setAttribute('href', '/b/' + top.id);
            if ($time && top.timestamp) {
              try {
                var d = new Date(top.timestamp);
                var hh = String(d.getHours()).padStart(2, '0');
                var mm = String(d.getMinutes()).padStart(2, '0');
                $time.textContent = hh + ':' + mm + ' PT';
              } catch (e) {}
            }
          }
        }
      } catch (e) {}
      // Audience — reuse the live-here number we already poll.
      if ($hereOut && $liveHere) {
        $hereOut.textContent = $liveHere.textContent || '—';
      }
      // Mood — pull from current select value if set.
      if ($moodOut) {
        var mk = ($moodSelect && $moodSelect.value) || '';
        if (mk && window.PC_SOUNDTRACKS && window.PC_SOUNDTRACKS[mk]) {
          $moodOut.textContent = (window.PC_SOUNDTRACKS[mk].label || mk).toLowerCase();
        } else {
          $moodOut.textContent = '— unset';
        }
      }
      // Peers — count federation-peers entries from the kit data.
      if ($peersOut) {
        // Hardcoded count from the data file — no live discovery yet.
        // The 'discover' action in the FED tray is where live probing lands.
        $peersOut.textContent = String((window.PC_FED_PEERS_COUNT || 4));
      }
    }

    // Cross-ping handler — POST to the peer's /api/ping with a small
    // probe message. Surfaces a one-line status next to the button.
    async function crossPingPeer(baseUrl, handle, btn) {
      if (!baseUrl) return;
      var prevText = btn ? btn.textContent : '';
      if (btn) { btn.textContent = '…'; btn.disabled = true; }
      try {
        var res = await postPing({
          subject: 'cross-cast probe from pointcast.xyz',
          body: 'hi @' + handle + ' — hello from the pointcast.xyz dock. xyz.pointcast.block lexicon.',
          from: 'pointcast.xyz (footer/cross-ping)',
        }, baseUrl);
        if (res.ok) {
          if (btn) btn.textContent = '✓ sent';
        } else if (res.status === 404) {
          if (btn) btn.textContent = 'no inbox';
        } else if (res.status === 503) {
          if (btn) btn.textContent = 'inbox off';
        } else {
          if (btn) btn.textContent = 'failed ' + res.status;
        }
      } catch (e) {
        // CORS blocked or network — most peers don't have CORS open
        // for cross-origin POSTs yet. That's expected. Surface the
        // friction so the federation handshake is honest.
        if (btn) btn.textContent = 'cors blocked';
      }
      setTimeout(function () {
        if (btn) { btn.textContent = prevText || 'cross-ping'; btn.disabled = false; }
      }, 3000);
    }

    // Action button dispatcher — listens for clicks on .fb__action,
    // routes to handlers by (tray, action).
    document.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!(t instanceof Element)) return;
      // Action buttons in tray headers.
      var actionBtn = t.closest('.fb__action');
      if (actionBtn) {
        var tray = actionBtn.getAttribute('data-tray');
        var action = actionBtn.getAttribute('data-action');
        var directorOnly = actionBtn.getAttribute('data-director') === 'true';
        if (directorOnly && !activeWalletAddress()) {
          // Friendly nudge: open binder so user can connect wallet.
          actionBtn.setAttribute('data-flash', 'true');
          setTimeout(function () { actionBtn.removeAttribute('data-flash'); }, 700);
          return;
        }
        handleDockAction(tray, action);
        return;
      }
      // Per-peer cross-ping buttons.
      var crossBtn = t.closest('[data-cross-ping]');
      if (crossBtn) {
        var base = crossBtn.getAttribute('data-cross-ping');
        var handle = crossBtn.getAttribute('data-handle') || base;
        crossPingPeer(base, handle, crossBtn);
        return;
      }
    });

    function handleDockAction(tray, action) {
      // Single switch — easy to extend, easy to read.
      if (tray === 'room') {
        if (action === 'here') {
          openTray('room');
          // Surface the count by forcing a fresh presence read.
          updatePresence();
        } else if (action === 'quiet') {
          window.dispatchEvent(new CustomEvent('pc:room:quiet', { detail: { on: true } }));
        } else if (action === 'reset') {
          // Clear any cursor identity, then re-emit a toggle event.
          try { localStorage.removeItem('pc:room:cursor'); } catch (e) {}
          window.dispatchEvent(new CustomEvent('pc:room:reset'));
        }
        return;
      }
      if (tray === 'ask') {
        applyAskTemplate(action);
        return;
      }
      if (tray === 'agent') {
        var $list = document.getElementById('fb-residents-list');
        if (!$list) return;
        if (action === 'live') {
          $list.setAttribute('data-filter', 'live');
        } else if (action === 'plus-one') {
          $list.setAttribute('data-filter', 'open');
        } else if (action === 'roster') {
          window.location.href = '/residents';
          return;
        }
        // Apply filter via CSS attr selector — handled in styles.
        return;
      }
      if (tray === 'fed') {
        if (action === 'discover') {
          // Probe each peer in parallel; mark live/unreachable.
          discoverFederationPeers();
        } else if (action === 'rfc') {
          window.location.href = '/federation/preview';
        }
        return;
      }
      if (tray === 'broadcast') {
        if (action === 'now') {
          var $a = document.getElementById('fb-bcast-now');
          if ($a) $a.click();
        } else if (action === 'channel') {
          window.location.href = '/c';
        } else if (action === 'schedule' || action === 'announce') {
          // Director-only — gated by activeWalletAddress() upstream.
          // For now: emit an operator event so future director plugins
          // can listen.
          window.dispatchEvent(new CustomEvent('pc:dock:director', { detail: { action: action } }));
        }
        return;
      }
      if (tray === 'cast') {
        // Magic word chips. The action id IS the spell id (or 'clear').
        if (action === 'clear') {
          window.dispatchEvent(new CustomEvent('pc:spell:clear'));
        } else {
          window.dispatchEvent(new CustomEvent('pc:spell:cast', { detail: { id: action } }));
        }
        return;
      }
    }

    // Federation discovery — probe each peer's /agents.json.
    async function discoverFederationPeers() {
      var peers = document.querySelectorAll('#fb-peers-list .fb-peer');
      peers.forEach(async function (li) {
        var base = li.getAttribute('data-base');
        if (!base) return;
        var statusEl = li.querySelector('.fb-peer__status');
        if (statusEl) { statusEl.textContent = 'probing'; statusEl.setAttribute('data-state', 'beta'); }
        try {
          var r = await fetch(base.replace(/\\\\/+$/, '') + '/agents.json', { cache: 'no-store' });
          if (r.ok) {
            if (statusEl) { statusEl.textContent = 'live'; statusEl.setAttribute('data-state', 'live'); }
          } else {
            if (statusEl) { statusEl.textContent = 'no manifest'; statusEl.setAttribute('data-state', 'dream'); }
          }
        } catch (e) {
          if (statusEl) { statusEl.textContent = 'unreachable'; statusEl.setAttribute('data-state', 'dream'); }
        }
      });
    }

    // Open BROADCAST tray when stamp 05 is clicked — same hook pattern
    // as room/ask/etc., but BROADCAST also fires its data refresh.
    window.addEventListener('click', function (e) {
      var t = e.target;
      if (!(t instanceof Element)) return;
      var stamp = t.closest('#fb-stamp-broadcast');
      if (stamp) setTimeout(refreshBroadcast, 60);
    });
    // Initial broadcast pulse so values are populated by the time the
    // tray opens for the first time.
    setTimeout(refreshBroadcast, 1800);
    setInterval(refreshBroadcast, 90 * 1000);

    (function scheduleNounRefresh() {
      var now = new Date();
      var nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
      var ms = nextMidnight.getTime() - now.getTime();
      setTimeout(function () {
        var day = Math.floor(Date.now() / (24 * 3600 * 1000));
        var seed = ((day + 7) * 2654435761) >>> 0;
        var id = seed % 1200;
        if ($noun) $noun.src = 'https://noun.pics/' + id + '.svg';
        if ($menuNoun) $menuNoun.src = 'https://noun.pics/' + id + '.svg';
        scheduleNounRefresh();
      }, Math.min(ms, 2_000_000_000));
    })();
  })();
<\/script>`])), maybeRenderHead(), addAttribute(`https://noun.pics/${defaultNounId}.svg`, "src"), DOCK_KIT.map((item) => renderTemplate`<button type="button" class="fb__stamp"${addAttribute(item.tray, "data-tray")}${addAttribute(item.id, "data-stamp-id")}${addAttribute(`fb-stamp-${item.id}`, "id")} aria-haspopup="dialog" aria-expanded="false"${addAttribute(`fb-tray-${item.id}`, "aria-controls")}${addAttribute(`${item.name} — ${item.blurb}`, "aria-label")}${addAttribute(`${item.name} (⌘${item.number})`, "title")}${addAttribute(`--stamp-accent: ${item.accent}`, "style")} data-astro-cid-ozbv6gvd> <span class="fb__stamp-num mono" aria-hidden="true" data-astro-cid-ozbv6gvd>${item.number}</span> <img class="fb__stamp-noun"${addAttribute(`https://noun.pics/${item.nounSeed}.svg`, "src")} alt="" width="22" height="22" loading="lazy" data-astro-cid-ozbv6gvd> <span class="fb__stamp-glyph" aria-hidden="true" data-astro-cid-ozbv6gvd>${item.glyph}</span> <span class="fb__stamp-dot"${addAttribute(`fb-stamp-dot-${item.id}`, "id")} aria-hidden="true" data-astro-cid-ozbv6gvd></span> </button>`), KIT_BY_ID.room.actions?.map((a) => renderTemplate`<button type="button"${addAttribute(`fb__action${a.style === "ghost" ? " fb__action--ghost" : ""}`, "class")} data-tray="room"${addAttribute(a.id, "data-action")}${addAttribute(a.hint, "title")} data-astro-cid-ozbv6gvd> <span class="fb__action-glyph" aria-hidden="true" data-astro-cid-ozbv6gvd>${a.glyph}</span> <span class="fb__action-label mono" data-astro-cid-ozbv6gvd>${a.label}</span> </button>`), KIT_BY_ID.ask.actions?.map((a) => renderTemplate`<button type="button"${addAttribute(`fb__action${a.style === "ghost" ? " fb__action--ghost" : ""}`, "class")} data-tray="ask"${addAttribute(a.id, "data-action")}${addAttribute(a.hint, "title")} data-astro-cid-ozbv6gvd> <span class="fb__action-glyph" aria-hidden="true" data-astro-cid-ozbv6gvd>${a.glyph}</span> <span class="fb__action-label mono" data-astro-cid-ozbv6gvd>${a.label}</span> </button>`), pingable.map((r) => renderTemplate`<option${addAttribute(r.slug, "value")} data-astro-cid-ozbv6gvd>${r.name.toLowerCase()} · ${r.role.split("—")[0].trim()}</option>`), KIT_BY_ID.agent.actions?.map((a) => renderTemplate`<button type="button"${addAttribute(`fb__action${a.style === "ghost" ? " fb__action--ghost" : ""}`, "class")} data-tray="agent"${addAttribute(a.id, "data-action")}${addAttribute(a.hint, "title")} data-astro-cid-ozbv6gvd> <span class="fb__action-glyph" aria-hidden="true" data-astro-cid-ozbv6gvd>${a.glyph}</span> <span class="fb__action-label mono" data-astro-cid-ozbv6gvd>${a.label}</span> </button>`), RESIDENTS.map((r) => renderTemplate`<li${addAttribute(`fb-resident fb-resident--${r.status}`, "class")}${addAttribute(r.status, "data-status")}${addAttribute(`--res-color: ${r.color}`, "style")} data-astro-cid-ozbv6gvd> <div class="fb-resident__row" data-astro-cid-ozbv6gvd> <button type="button" class="fb-resident__btn"${addAttribute(r.status === "resident" || r.status === "director" ? r.slug : "", "data-ping-slug")}${addAttribute(r.status, "data-status")}${addAttribute(`Ping ${r.name}`, "aria-label")} data-astro-cid-ozbv6gvd> <span class="fb-resident__chip mono" data-astro-cid-ozbv6gvd>${r.slug.toUpperCase()}</span> <span class="fb-resident__body" data-astro-cid-ozbv6gvd> <span class="fb-resident__name" data-astro-cid-ozbv6gvd>${r.name}</span> <span class="fb-resident__role mono" data-astro-cid-ozbv6gvd>${r.role}</span> </span> <span class="fb-resident__status mono"${addAttribute(r.status, "data-state")} data-astro-cid-ozbv6gvd> ${r.status === "resident" ? "● live" : r.status === "director" ? "★ mh" : r.status === "open" ? "○ open" : "· quiet"} </span> </button> <div class="fb-resident__actions"${addAttribute(`${r.name} comms`, "aria-label")} data-astro-cid-ozbv6gvd> ${r.voice && renderTemplate`<a class="fb-resident__link mono"${addAttribute(r.voice, "href")} target="_blank" rel="noopener"${addAttribute(`${r.name}'s voice doc`, "title")} data-astro-cid-ozbv6gvd>voice ↗</a>`} ${r.logs && renderTemplate`<a class="fb-resident__link mono"${addAttribute(r.logs, "href")} target="_blank" rel="noopener"${addAttribute(`${r.name}'s logs`, "title")} data-astro-cid-ozbv6gvd>logs ↗</a>`} ${r.firstTaskBrief && renderTemplate`<a class="fb-resident__link mono"${addAttribute(r.firstTaskBrief, "href")} target="_blank" rel="noopener" title="First-task brief" data-astro-cid-ozbv6gvd>brief ↗</a>`} </div> </div> </li>`), KIT_BY_ID.fed.actions?.map((a) => renderTemplate`<button type="button"${addAttribute(`fb__action${a.style === "ghost" ? " fb__action--ghost" : ""}`, "class")} data-tray="fed"${addAttribute(a.id, "data-action")}${addAttribute(a.hint, "title")} data-astro-cid-ozbv6gvd> <span class="fb__action-glyph" aria-hidden="true" data-astro-cid-ozbv6gvd>${a.glyph}</span> <span class="fb__action-label mono" data-astro-cid-ozbv6gvd>${a.label}</span> </button>`), FEDERATION_PEERS.map((p) => renderTemplate`<li class="fb-peer"${addAttribute(p.status, "data-status")}${addAttribute(p.handle, "data-handle")}${addAttribute(p.baseUrl, "data-base")}${addAttribute(`--peer-accent: ${p.accent}`, "style")} data-astro-cid-ozbv6gvd> <div class="fb-peer__row" data-astro-cid-ozbv6gvd> <img class="fb-peer__noun"${addAttribute(`https://noun.pics/${p.nounSeed}.svg`, "src")} alt="" width="32" height="32" loading="lazy" data-astro-cid-ozbv6gvd> <span class="fb-peer__body" data-astro-cid-ozbv6gvd> <span class="fb-peer__handle mono" data-astro-cid-ozbv6gvd>@${p.handle}</span> <span class="fb-peer__kicker" data-astro-cid-ozbv6gvd>${p.kicker}</span> </span> <span class="fb-peer__status mono"${addAttribute(p.status, "data-state")} data-astro-cid-ozbv6gvd>${p.status}</span> </div> <div class="fb-peer__actions"${addAttribute(`${p.handle} comms`, "aria-label")} data-astro-cid-ozbv6gvd> <a class="fb-peer__link mono"${addAttribute(p.baseUrl, "href")} target="_blank" rel="noopener" data-astro-cid-ozbv6gvd>visit ↗</a> <button type="button" class="fb-peer__link fb-peer__link--btn mono"${addAttribute(p.baseUrl, "data-cross-ping")}${addAttribute(p.handle, "data-handle")}${addAttribute(`Cross-cast a ping to ${p.handle} — POSTs to ${p.baseUrl}/api/ping`, "title")} data-astro-cid-ozbv6gvd>cross-ping</button> <span class="fb-peer__link fb-peer__link--ghost mono" title="Follow this peer — feed subscription, wiring next sprint" data-astro-cid-ozbv6gvd>follow · soon</span> </div> </li>`), KIT_BY_ID.broadcast.actions?.map((a) => renderTemplate`<button type="button"${addAttribute(`fb__action${a.style === "ghost" ? " fb__action--ghost" : ""}${a.director ? " fb__action--director" : ""}`, "class")} data-tray="broadcast"${addAttribute(a.id, "data-action")}${addAttribute(a.director ? "true" : "false", "data-director")}${addAttribute(a.hint, "title")} data-astro-cid-ozbv6gvd> <span class="fb__action-glyph" aria-hidden="true" data-astro-cid-ozbv6gvd>${a.glyph}</span> <span class="fb__action-label mono" data-astro-cid-ozbv6gvd>${a.label}</span> </button>`), KIT_BY_ID.cast.actions?.map((a) => renderTemplate`<button type="button"${addAttribute(`fb__action${a.style === "ghost" ? " fb__action--ghost" : ""}`, "class")} data-tray="cast"${addAttribute(a.id, "data-action")}${addAttribute(a.hint, "title")} data-astro-cid-ozbv6gvd> <span class="fb__action-glyph" aria-hidden="true" data-astro-cid-ozbv6gvd>${a.glyph}</span> <span class="fb__action-label mono" data-astro-cid-ozbv6gvd>${a.label}</span> </button>`), SPELLS.map((s) => renderTemplate`<li class="fb-spell"${addAttribute(s.kind, "data-kind")}${addAttribute(`--spell-accent: ${s.accent}`, "style")} data-astro-cid-ozbv6gvd> <button type="button" class="fb-spell__btn" data-tray="cast"${addAttribute(s.id, "data-action")}${addAttribute(`+${s.id}`, "title")} data-astro-cid-ozbv6gvd> <span class="fb-spell__glyph" aria-hidden="true" data-astro-cid-ozbv6gvd>${s.glyph}</span> <span class="fb-spell__body" data-astro-cid-ozbv6gvd> <span class="fb-spell__label" data-astro-cid-ozbv6gvd>+${s.id}</span> <span class="fb-spell__blurb mono" data-astro-cid-ozbv6gvd>${s.blurb}</span> </span> <span class="fb-spell__kind mono"${addAttribute(s.kind, "data-kind")} data-astro-cid-ozbv6gvd>${s.kind}</span> </button> </li>`), addAttribute(`https://noun.pics/${defaultNounId}.svg`, "src"), defaultNounId, DOCK_KIT.length, DOCK_KIT.length, DOCK_KIT.map((item) => renderTemplate`<li class="fb-binder__card"${addAttribute(`--stamp-accent: ${item.accent}`, "style")} data-astro-cid-ozbv6gvd> <button type="button" class="fb-binder__open"${addAttribute(item.tray, "data-tray")}${addAttribute(`Open ${item.name} tray`, "aria-label")} data-astro-cid-ozbv6gvd> <span class="fb-binder__num mono" data-astro-cid-ozbv6gvd>№ ${item.number}</span> <img class="fb-binder__noun"${addAttribute(`https://noun.pics/${item.nounSeed}.svg`, "src")} alt="" width="44" height="44" loading="lazy" data-astro-cid-ozbv6gvd> <span class="fb-binder__glyph" aria-hidden="true" data-astro-cid-ozbv6gvd>${item.glyph}</span> <span class="fb-binder__name" data-astro-cid-ozbv6gvd>${item.name}</span> <span class="fb-binder__blurb mono" data-astro-cid-ozbv6gvd>${item.blurb}</span> </button> </li>`), unescapeHTML(`window.PC_SOUNDTRACKS = ${SOUNDTRACKS_JSON}; window.PC_DOCK_KIT = ${KIT_JSON}; window.PC_FED_PEERS_COUNT = ${FED_PEERS_COUNT}; window.PC_MOOD_SPELLS = ${MOOD_SPELLS_JSON};`));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/FooterBar.astro", "self");

var __freeze$2 = Object.freeze;
var __defProp$2 = Object.defineProperty;
var __template$2 = (cooked, raw) => __freeze$2(__defProp$2(cooked, "raw", { value: __freeze$2(raw || cooked.slice()) }));
var _a$2;
const $$SpellLayer = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a$2 || (_a$2 = __template$2(["", `<div class="spell-layer" id="pc-spell-layer" aria-hidden="true"></div> <script>
  (function () {
    'use strict';

    var $layer = document.getElementById('pc-spell-layer');
    if (!$layer) return;

    // Track active companions/ambient so "clear" can wipe them.
    var active = { byId: {}, bursts: 0 };

    function reduce() {
      try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
    }

    // ─── confetti (burst) ───────────────────────────────────────
    function castConfetti(durationMs) {
      if (reduce()) return; // no animation in reduced-motion mode
      var palette = ['#d4a437', '#4A9EFF', '#c4952e', '#fdf2d6', '#8a2432', '#2f8f5f'];
      var count = 36;
      for (var i = 0; i < count; i++) {
        var d = document.createElement('span');
        d.className = 'spell-confetti';
        var size = 6 + Math.floor(Math.random() * 8);
        var startX = Math.random() * window.innerWidth;
        var driftX = (Math.random() - 0.5) * 240;
        var rotateStart = Math.floor(Math.random() * 360);
        var rotateEnd = rotateStart + 360 + Math.floor(Math.random() * 720);
        var fallTime = (durationMs || 4500) - Math.floor(Math.random() * 600);
        d.style.cssText =
          'left:' + startX + 'px;' +
          'top:-' + size + 'px;' +
          'width:' + size + 'px;' +
          'height:' + Math.floor(size * 0.6) + 'px;' +
          'background:' + palette[Math.floor(Math.random() * palette.length)] + ';' +
          'transform:rotate(' + rotateStart + 'deg);' +
          'animation:spell-confetti-fall ' + fallTime + 'ms cubic-bezier(.32,.4,.6,1) forwards;' +
          '--spell-drift-x:' + driftX + 'px;' +
          '--spell-rotate-end:' + rotateEnd + 'deg;';
        $layer.appendChild(d);
        active.bursts++;
        (function (el) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, fallTime + 100);
        })(d);
      }
    }

    // ─── cat (companion) ────────────────────────────────────────
    function castCat(durationMs) {
      // One cat at a time — recasting sends the existing one off.
      if (active.byId.cat) {
        var prev = active.byId.cat;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var cat = document.createElement('button');
      cat.className = 'spell-cat';
      cat.type = 'button';
      cat.setAttribute('aria-label', 'A walking cat. Click to send away.');
      cat.title = 'click to send the cat home';
      cat.textContent = '🐈';
      // 60% chance left-to-right, 40% right-to-left (whim).
      var ltr = Math.random() < 0.6;
      cat.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = (durationMs || 60000);
      // Scale walk speed to viewport width — keep ~80px/s feel.
      var walkSeconds = Math.max(8, Math.min(30, window.innerWidth / 80));
      cat.style.cssText =
        'animation:spell-cat-walk-' + (ltr ? 'ltr' : 'rtl') + ' ' + walkSeconds + 's linear infinite;';
      cat.addEventListener('click', function () {
        if (cat.parentNode) cat.parentNode.removeChild(cat);
        active.byId.cat = null;
      });
      $layer.appendChild(cat);
      active.byId.cat = cat;
      // Auto-dismiss after duration so it doesn't loop forever.
      setTimeout(function () {
        if (cat && cat.parentNode) cat.parentNode.removeChild(cat);
        if (active.byId.cat === cat) active.byId.cat = null;
      }, dur);
    }

    // ─── breath (ambient) ───────────────────────────────────────
    // 4-7-8 breathing — inhale 4s, hold 7s, exhale 8s. Cycle ~19s.
    function castBreath() {
      if (active.byId.breath) return; // toggle via dismiss
      var b = document.createElement('div');
      b.className = 'spell-breath';
      b.setAttribute('role', 'button');
      b.setAttribute('aria-label', 'Breathing circle, 4-7-8 rhythm. Click to dismiss.');
      b.tabIndex = 0;
      b.innerHTML =
        '<div class="spell-breath__ring" aria-hidden="true"></div>' +
        '<div class="spell-breath__inner" aria-hidden="true"></div>' +
        '<p class="spell-breath__cue mono" id="pc-spell-breath-cue">breathe in · 4</p>';
      b.addEventListener('click', dismissBreath);
      b.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dismissBreath(); }
      });
      $layer.appendChild(b);
      active.byId.breath = b;
      // Cue cycle so the user knows the phase even with reduce-motion.
      var phases = [
        { text: 'breathe in · 4',  ms: 4000 },
        { text: 'hold · 7',        ms: 7000 },
        { text: 'breathe out · 8', ms: 8000 },
      ];
      var idx = 0;
      var $cue = b.querySelector('#pc-spell-breath-cue');
      function advance() {
        if (!active.byId.breath) return;
        if ($cue) $cue.textContent = phases[idx].text;
        idx = (idx + 1) % phases.length;
        active.byId.breathTimer = setTimeout(advance, phases[(idx + 2) % 3].ms);
      }
      advance();
    }
    function dismissBreath() {
      var b = active.byId.breath;
      if (!b) return;
      if (active.byId.breathTimer) { clearTimeout(active.byId.breathTimer); active.byId.breathTimer = 0; }
      if (b.parentNode) b.parentNode.removeChild(b);
      active.byId.breath = null;
    }

    // ─── candle (ambient) ───────────────────────────────────────
    function castCandle() {
      if (active.byId.candle) return;
      var c = document.createElement('button');
      c.className = 'spell-candle';
      c.type = 'button';
      c.setAttribute('aria-label', 'A lit candle. Click to snuff out.');
      c.title = 'click to snuff out';
      c.innerHTML =
        '<span class="spell-candle__flame" aria-hidden="true">🔥</span>' +
        '<span class="spell-candle__body" aria-hidden="true">🕯️</span>';
      c.addEventListener('click', function () {
        if (c.parentNode) c.parentNode.removeChild(c);
        active.byId.candle = null;
      });
      $layer.appendChild(c);
      active.byId.candle = c;
    }

    // ─── pup (companion) ────────────────────────────────────────
    // Like cat but bouncier — see the @keyframes spell-pup-walk-* CSS
    // for the small vertical hop on each step. Tail-wag is a separate
    // micro-animation on the glyph.
    function castPup(durationMs) {
      if (active.byId.pup) {
        var prev = active.byId.pup;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var pup = document.createElement('button');
      pup.className = 'spell-pup';
      pup.type = 'button';
      pup.setAttribute('aria-label', 'A walking puppy. Click to send home.');
      pup.title = 'click to send the pup home';
      pup.textContent = '🐶';
      var ltr = Math.random() < 0.5;
      pup.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = (durationMs || 50000);
      var walkSeconds = Math.max(7, Math.min(22, window.innerWidth / 110));
      pup.style.cssText =
        'animation:spell-pup-walk-' + (ltr ? 'ltr' : 'rtl') + ' ' + walkSeconds + 's linear infinite,' +
        'spell-pup-bounce 0.42s ease-in-out infinite;';
      pup.addEventListener('click', function () {
        if (pup.parentNode) pup.parentNode.removeChild(pup);
        active.byId.pup = null;
      });
      $layer.appendChild(pup);
      active.byId.pup = pup;
      setTimeout(function () {
        if (pup && pup.parentNode) pup.parentNode.removeChild(pup);
        if (active.byId.pup === pup) active.byId.pup = null;
      }, dur);
    }

    // ─── penguin (companion) ────────────────────────────────────
    // Slow waddle — long step time + side-to-side rock applied via the
    // wobble keyframe. Penguin doesn't pause; he just keeps going.
    function castPenguin(durationMs) {
      if (active.byId.penguin) {
        var prev2 = active.byId.penguin;
        if (prev2 && prev2.parentNode) prev2.parentNode.removeChild(prev2);
      }
      var pen = document.createElement('button');
      pen.className = 'spell-penguin';
      pen.type = 'button';
      pen.setAttribute('aria-label', 'A waddling penguin. Click to send home.');
      pen.title = 'click to send the penguin home';
      pen.textContent = '🐧';
      var ltr = Math.random() < 0.5;
      pen.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = (durationMs || 70000);
      // Penguin walks slower than cat or pup — ~50px/s.
      var walkSeconds = Math.max(14, Math.min(40, window.innerWidth / 50));
      pen.style.cssText =
        'animation:spell-penguin-walk-' + (ltr ? 'ltr' : 'rtl') + ' ' + walkSeconds + 's linear infinite,' +
        'spell-penguin-wobble 0.7s ease-in-out infinite;';
      pen.addEventListener('click', function () {
        if (pen.parentNode) pen.parentNode.removeChild(pen);
        active.byId.penguin = null;
      });
      $layer.appendChild(pen);
      active.byId.penguin = pen;
      setTimeout(function () {
        if (pen && pen.parentNode) pen.parentNode.removeChild(pen);
        if (active.byId.penguin === pen) active.byId.penguin = null;
      }, dur);
    }

    // ─── rain (ambient) ─────────────────────────────────────────
    // 80 light blue pixel-rain streaks fall continuously. Implemented
    // as a single overlay div with N child spans on randomized
    // animation delays, each a slim translucent line. Click to dismiss.
    function castRain() {
      if (active.byId.rain) return;
      var rain = document.createElement('button');
      rain.className = 'spell-rain';
      rain.type = 'button';
      rain.setAttribute('aria-label', 'Pixel rain overlay. Click to dismiss.');
      rain.title = 'click to clear the rain';
      var html = '';
      for (var i = 0; i < 80; i++) {
        var leftPct = Math.random() * 100;
        var delay = (Math.random() * 1.6).toFixed(2);
        var dur = (1.2 + Math.random() * 1.2).toFixed(2);
        var len = 14 + Math.floor(Math.random() * 14);
        var op = (0.35 + Math.random() * 0.35).toFixed(2);
        html += '<span class="spell-rain__drop" style="' +
          'left:' + leftPct + '%;' +
          'height:' + len + 'px;' +
          'animation-delay:' + delay + 's;' +
          'animation-duration:' + dur + 's;' +
          'opacity:' + op + ';' +
          '"></span>';
      }
      rain.innerHTML = html;
      rain.addEventListener('click', function () {
        if (rain.parentNode) rain.parentNode.removeChild(rain);
        active.byId.rain = null;
      });
      $layer.appendChild(rain);
      active.byId.rain = rain;
    }

    // ─── starfield (ambient) ────────────────────────────────────
    // Slow-twinkling stars at random positions. Each star is a small
    // dot with a soft box-shadow + opacity-pulse animation on staggered
    // delay. ~60 stars across the viewport.
    function castStarfield() {
      if (active.byId.starfield) return;
      var sky = document.createElement('button');
      sky.className = 'spell-starfield';
      sky.type = 'button';
      sky.setAttribute('aria-label', 'Starfield overlay. Click to dismiss.');
      sky.title = 'click to dim the stars';
      var html = '';
      for (var j = 0; j < 60; j++) {
        var x = (Math.random() * 100).toFixed(1);
        var y = (Math.random() * 100).toFixed(1);
        var size = (1 + Math.random() * 2).toFixed(1);
        var delay = (Math.random() * 4).toFixed(2);
        var dur = (3 + Math.random() * 4).toFixed(2);
        html += '<span class="spell-starfield__star" style="' +
          'left:' + x + '%;' +
          'top:' + y + '%;' +
          'width:' + size + 'px;' +
          'height:' + size + 'px;' +
          'animation-delay:' + delay + 's;' +
          'animation-duration:' + dur + 's;' +
          '></span>';
      }
      sky.innerHTML = html;
      sky.addEventListener('click', function () {
        if (sky.parentNode) sky.parentNode.removeChild(sky);
        active.byId.starfield = null;
      });
      $layer.appendChild(sky);
      active.byId.starfield = sky;
    }

    // ─── firework (burst) ───────────────────────────────────────
    // Three staggered bursts at random viewport positions. Each burst
    // spawns 22 sparks that shoot radially outward and fade. Pure CSS
    // custom-property trick: compute dx/dy in JS, animate in CSS.
    function castFirework(durationMs) {
      if (reduce()) return;
      var colors = ['#d4a437', '#4A9EFF', '#c4952e', '#fdf2d6', '#8a2432', '#2f8f5f', '#a78bfa'];
      function fireBurst(delay) {
        setTimeout(function () {
          var cx = 10 + Math.random() * 80; // vw
          var cy = 10 + Math.random() * 55; // vh
          var sparkCount = 22;
          for (var i = 0; i < sparkCount; i++) {
            var s = document.createElement('span');
            s.className = 'spell-firework-spark';
            var angleRad = (i / sparkCount) * 2 * Math.PI;
            var dist = 55 + Math.random() * 80;
            var dx = (Math.cos(angleRad) * dist).toFixed(1);
            var dy = (Math.sin(angleRad) * dist).toFixed(1);
            var color = colors[Math.floor(Math.random() * colors.length)];
            var sparkDur = 700 + Math.floor(Math.random() * 600);
            s.style.cssText =
              'left:' + cx + 'vw;' +
              'top:' + cy + 'vh;' +
              'background:' + color + ';' +
              '--spell-fw-dx:' + dx + 'px;' +
              '--spell-fw-dy:' + dy + 'px;' +
              'animation:spell-firework-spark-fly ' + sparkDur + 'ms ease-out forwards;';
            $layer.appendChild(s);
            active.bursts++;
            (function (el) {
              setTimeout(function () {
                if (el && el.parentNode) el.parentNode.removeChild(el);
                active.bursts = Math.max(0, active.bursts - 1);
              }, sparkDur + 100);
            })(s);
          }
        }, delay);
      }
      fireBurst(0);
      fireBurst(600);
      fireBurst(1300);
    }

    // ─── fish (companion) ────────────────────────────────────────
    // Glides smoothly at ~60px/s with a gentle vertical bob. Calmer
    // than cat or pup — ease-in-out swim, unhurried.
    function castFish(durationMs) {
      if (active.byId.fish) {
        var prev = active.byId.fish;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var fish = document.createElement('button');
      fish.className = 'spell-fish';
      fish.type = 'button';
      fish.setAttribute('aria-label', 'A fish gliding by. Click to let it swim away.');
      fish.title = 'click to release the fish';
      fish.textContent = '🐟';
      var ltr = Math.random() < 0.5;
      fish.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = (durationMs || 45000);
      var swimSeconds = Math.max(10, Math.min(28, window.innerWidth / 60));
      fish.style.cssText =
        'animation:spell-fish-swim-' + (ltr ? 'ltr' : 'rtl') + ' ' + swimSeconds + 's ease-in-out infinite,' +
        'spell-fish-bob 2.4s ease-in-out infinite;';
      fish.addEventListener('click', function () {
        if (fish.parentNode) fish.parentNode.removeChild(fish);
        active.byId.fish = null;
      });
      $layer.appendChild(fish);
      active.byId.fish = fish;
      setTimeout(function () {
        if (fish && fish.parentNode) fish.parentNode.removeChild(fish);
        if (active.byId.fish === fish) active.byId.fish = null;
      }, dur);
    }

    // ─── moth (companion) ────────────────────────────────────────
    // Flies mid-screen height (not bottom like cat/pup) with an erratic
    // vertical flutter that mimics being drawn toward a light source.
    function castMoth(durationMs) {
      if (active.byId.moth) {
        var prev = active.byId.moth;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var moth = document.createElement('button');
      moth.className = 'spell-moth';
      moth.type = 'button';
      moth.setAttribute('aria-label', 'A moth fluttering by. Click to send it on.');
      moth.title = 'click to send the moth on';
      moth.textContent = '🦋';
      var ltr = Math.random() < 0.5;
      moth.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = (durationMs || 55000);
      var flySeconds = Math.max(10, Math.min(30, window.innerWidth / 70));
      moth.style.cssText =
        'animation:spell-moth-fly-' + (ltr ? 'ltr' : 'rtl') + ' ' + flySeconds + 's linear infinite,' +
        'spell-moth-flutter 0.55s ease-in-out infinite;';
      moth.addEventListener('click', function () {
        if (moth.parentNode) moth.parentNode.removeChild(moth);
        active.byId.moth = null;
      });
      $layer.appendChild(moth);
      active.byId.moth = moth;
      setTimeout(function () {
        if (moth && moth.parentNode) moth.parentNode.removeChild(moth);
        if (active.byId.moth === moth) active.byId.moth = null;
      }, dur);
    }

    // ─── snow (ambient) ──────────────────────────────────────────
    // 60 soft white flakes, each with a random size, fall speed, and
    // lateral drift. Negative animation-delay puts each flake mid-fall
    // on cast so the screen fills immediately.
    function castSnow() {
      if (active.byId.snow) return;
      var snow = document.createElement('button');
      snow.className = 'spell-snow';
      snow.type = 'button';
      snow.setAttribute('aria-label', 'Snowfall overlay. Click to dismiss.');
      snow.title = 'click to stop the snow';
      var html = '';
      for (var i = 0; i < 60; i++) {
        var leftPct = (Math.random() * 100).toFixed(1);
        var delay = (Math.random() * 8).toFixed(2);
        var dur = (5 + Math.random() * 7).toFixed(2);
        var size = (4 + Math.random() * 5).toFixed(1);
        var drift = ((Math.random() - 0.5) * 70).toFixed(1);
        var op = (0.5 + Math.random() * 0.4).toFixed(2);
        html += '<span class="spell-snow__flake" style="' +
          'left:' + leftPct + '%;' +
          'width:' + size + 'px;' +
          'height:' + size + 'px;' +
          'animation-delay:-' + delay + 's;' +
          'animation-duration:' + dur + 's;' +
          'opacity:' + op + ';' +
          '--spell-snow-drift:' + drift + 'px;' +
          '"></span>';
      }
      snow.innerHTML = html;
      snow.addEventListener('click', function () {
        if (snow.parentNode) snow.parentNode.removeChild(snow);
        active.byId.snow = null;
      });
      $layer.appendChild(snow);
      active.byId.snow = snow;
    }

    // ─── shout (burst) ───────────────────────────────────────────
    // Typographic burst: punctuation fans radially from viewport center.
    // Reuses the firework dx/dy CSS-custom-prop trick on text nodes.
    function castShout(durationMs) {
      if (reduce()) return;
      var chars = ['!', '!', '?', '!!', '!', '?!', '!', '!!', '!', '?', '!', '!!', '!', '?', '!'];
      var count = 15;
      for (var i = 0; i < count; i++) {
        var s = document.createElement('span');
        s.className = 'spell-shout-char';
        var angle = (i / count) * 2 * Math.PI;
        var dist = 80 + Math.random() * 120;
        var dx = (Math.cos(angle) * dist).toFixed(1);
        var dy = (Math.sin(angle) * dist).toFixed(1);
        var dur = (durationMs || 2200) - Math.floor(Math.random() * 400);
        var fontSize = 16 + Math.floor(Math.random() * 22);
        s.textContent = chars[i % chars.length];
        s.style.cssText =
          'left:50vw;top:45vh;font-size:' + fontSize + 'px;' +
          '--spell-fw-dx:' + dx + 'px;--spell-fw-dy:' + dy + 'px;' +
          'animation:spell-shout-fly ' + dur + 'ms ease-out forwards;';
        $layer.appendChild(s);
        active.bursts++;
        (function (el) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, dur + 100);
        })(s);
      }
    }

    // ─── wave (burst) ────────────────────────────────────────────
    // 14 hands stagger across the screen L→R with a delay ramp —
    // gives the classic stadium-wave ripple effect.
    function castWave(durationMs) {
      if (reduce()) return;
      var count = 14;
      var dur = durationMs || 3000;
      for (var i = 0; i < count; i++) {
        var w = document.createElement('span');
        w.className = 'spell-wave-hand';
        w.textContent = '👋';
        var leftPct = (i / (count - 1)) * 88 + 6;
        var bottomPct = 18 + Math.random() * 16;
        var delay = Math.round((i / count) * 550);
        var waveDur = 1100 + Math.floor(Math.random() * 300);
        w.style.cssText =
          'left:' + leftPct.toFixed(1) + '%;bottom:' + bottomPct.toFixed(1) + '%;' +
          'animation:spell-wave-appear ' + waveDur + 'ms ease-in-out ' + delay + 'ms forwards;';
        $layer.appendChild(w);
        active.bursts++;
        (function (el) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, dur + 100);
        })(w);
      }
    }

    // ─── firefly (companion) ─────────────────────────────────────
    // A single glowing dot drifts at a random height (30–70vh) on a
    // slow ease-in-out path. The glow child pulses independently.
    function castFirefly(durationMs) {
      if (active.byId.firefly) {
        var prev = active.byId.firefly;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var fly = document.createElement('button');
      fly.className = 'spell-firefly';
      fly.type = 'button';
      fly.setAttribute('aria-label', 'A firefly drifting by. Click to release it.');
      fly.title = 'click to release the firefly';
      fly.innerHTML = '<span class="spell-firefly__glow" aria-hidden="true"></span>';
      var ltr = Math.random() < 0.5;
      fly.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = durationMs || 40000;
      var heightPct = (30 + Math.random() * 40).toFixed(1);
      var driftSeconds = Math.max(12, Math.min(35, window.innerWidth / 40));
      fly.style.cssText =
        'bottom:' + heightPct + 'vh;' +
        'animation:spell-firefly-drift-' + (ltr ? 'ltr' : 'rtl') + ' ' + driftSeconds + 's ease-in-out infinite;';
      fly.addEventListener('click', function () {
        if (fly.parentNode) fly.parentNode.removeChild(fly);
        active.byId.firefly = null;
      });
      $layer.appendChild(fly);
      active.byId.firefly = fly;
      setTimeout(function () {
        if (fly && fly.parentNode) fly.parentNode.removeChild(fly);
        if (active.byId.firefly === fly) active.byId.firefly = null;
      }, dur);
    }

    // ─── chimes (ambient) ────────────────────────────────────────
    // 5 metallic pipes hang from the top-right corner. Each sways at
    // a slightly different period — staggered delays vary the rhythm.
    function castChimes() {
      if (active.byId.chimes) return;
      var ch = document.createElement('button');
      ch.className = 'spell-chimes';
      ch.type = 'button';
      ch.setAttribute('aria-label', 'Wind chimes. Click to still them.');
      ch.title = 'click to still the chimes';
      var lengths = [62, 48, 72, 54, 68];
      var html = '';
      for (var i = 0; i < 5; i++) {
        var delay = (i * 0.38 + Math.random() * 0.25).toFixed(2);
        var pipeDur = (1.9 + Math.random() * 1.4).toFixed(2);
        html += '<span class="spell-chimes__pipe" style="' +
          'height:' + lengths[i] + 'px;' +
          'animation-delay:' + delay + 's;' +
          'animation-duration:' + pipeDur + 's;' +
          '"></span>';
      }
      ch.innerHTML = html;
      ch.addEventListener('click', function () {
        if (ch.parentNode) ch.parentNode.removeChild(ch);
        active.byId.chimes = null;
      });
      $layer.appendChild(ch);
      active.byId.chimes = ch;
    }

    // ─── bloom (burst) ───────────────────────────────────────────
    // Flowers scatter radially from viewport center — reuses the
    // firework dx/dy custom-prop trick on emoji text nodes.
    function castBloom(durationMs) {
      if (reduce()) return;
      var flowers = ['🌸', '🌺', '🌼', '🌻', '🌷', '🌸', '🌼', '🌺', '🌸', '🌻', '🌷', '🌼', '🌸', '🌺'];
      var count = 14;
      for (var i = 0; i < count; i++) {
        var b = document.createElement('span');
        b.className = 'spell-bloom-petal';
        var angle = (i / count) * 2 * Math.PI;
        var dist = 60 + Math.random() * 110;
        var dx = (Math.cos(angle) * dist).toFixed(1);
        var dy = (Math.sin(angle) * dist).toFixed(1);
        var rot = (-120 + Math.floor(Math.random() * 240));
        var dur = (durationMs || 2800) - Math.floor(Math.random() * 400);
        var size = 20 + Math.floor(Math.random() * 16);
        b.textContent = flowers[i % flowers.length];
        b.style.cssText =
          'left:50vw;top:45vh;font-size:' + size + 'px;' +
          '--spell-fw-dx:' + dx + 'px;--spell-fw-dy:' + dy + 'px;' +
          '--spell-bloom-rot:' + rot + 'deg;' +
          'animation:spell-bloom-fly ' + dur + 'ms ease-out forwards;';
        $layer.appendChild(b);
        active.bursts++;
        (function (el) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, dur + 100);
        })(b);
      }
    }

    // ─── aurora (ambient) ────────────────────────────────────────
    // Color bands (green / teal / purple) drift slowly across the top
    // of the viewport — pure CSS pseudo-element gradients, no canvas.
    function castAurora() {
      if (active.byId.aurora) return;
      var a = document.createElement('button');
      a.className = 'spell-aurora';
      a.type = 'button';
      a.setAttribute('aria-label', 'Aurora overlay. Click to dismiss.');
      a.title = 'click to dim the aurora';
      a.addEventListener('click', function () {
        if (a.parentNode) a.parentNode.removeChild(a);
        active.byId.aurora = null;
      });
      $layer.appendChild(a);
      active.byId.aurora = a;
    }

    // ─── here (ambient) ──────────────────────────────────────────
    // A pulsing location beacon centered on screen — two concentric
    // ripple rings radiate outward from a 📍 glyph. Click to dismiss.
    function castHere() {
      if (active.byId.here) return;
      var h = document.createElement('button');
      h.className = 'spell-here';
      h.type = 'button';
      h.setAttribute('aria-label', 'You are here. Click to dismiss.');
      h.title = 'click to dismiss';
      h.innerHTML =
        '<span class="spell-here__ring spell-here__ring--1" aria-hidden="true"></span>' +
        '<span class="spell-here__ring spell-here__ring--2" aria-hidden="true"></span>' +
        '<span class="spell-here__pin" aria-hidden="true">📍</span>';
      h.addEventListener('click', function () {
        if (h.parentNode) h.parentNode.removeChild(h);
        active.byId.here = null;
      });
      $layer.appendChild(h);
      active.byId.here = h;
    }

    // ─── mood (ambient) ──────────────────────────────────────────
    // A slowly hue-rotating color orb bottom-left. Cycles through the
    // full spectrum every ~20s — no words, just vibe. Click to dismiss.
    function castMood() {
      if (active.byId.mood) return;
      var m = document.createElement('button');
      m.className = 'spell-mood';
      m.type = 'button';
      m.setAttribute('aria-label', 'Mood orb. Click to dismiss.');
      m.title = 'click to dismiss';
      m.addEventListener('click', function () {
        if (m.parentNode) m.parentNode.removeChild(m);
        active.byId.mood = null;
      });
      $layer.appendChild(m);
      active.byId.mood = m;
    }

    // ─── bubble (burst) ──────────────────────────────────────────
    // 18 iridescent circles float upward from a random bottom band
    // and pop (scale + fade) at staggered heights. Each bubble gets
    // a random lateral drift — the overall feel is champagne-cork gentle.
    function castBubble(durationMs) {
      if (reduce()) return;
      var count = 18;
      var dur = durationMs || 3200;
      for (var i = 0; i < count; i++) {
        var b = document.createElement('span');
        b.className = 'spell-bubble';
        var size = 10 + Math.floor(Math.random() * 22);
        var startX = 5 + Math.random() * 90; // vw
        var drift = ((Math.random() - 0.5) * 80).toFixed(1);
        var rise = Math.floor(dur * (0.6 + Math.random() * 0.4));
        var delay = Math.floor(Math.random() * (dur * 0.3));
        b.style.cssText =
          'left:' + startX + 'vw;' +
          'bottom:8%;' +
          'width:' + size + 'px;' +
          'height:' + size + 'px;' +
          '--spell-bubble-drift:' + drift + 'px;' +
          'animation:spell-bubble-rise ' + rise + 'ms ease-in ' + delay + 'ms forwards;';
        $layer.appendChild(b);
        active.bursts++;
        (function (el, t, d) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, t + d + 100);
        })(b, rise, delay);
      }
    }

    // ─── dice (burst) ─────────────────────────────────────────────
    // 6 dice scatter radially from viewport center, each tumbling
    // (rotate) as they fly. Reuses the firework dx/dy custom-prop trick.
    function castDice(durationMs) {
      if (reduce()) return;
      var faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      var count = 6;
      var dur = durationMs || 2500;
      for (var i = 0; i < count; i++) {
        var d = document.createElement('span');
        d.className = 'spell-dice-face';
        var angle = (i / count) * 2 * Math.PI;
        var dist = 70 + Math.random() * 90;
        var dx = (Math.cos(angle) * dist).toFixed(1);
        var dy = (Math.sin(angle) * dist).toFixed(1);
        var rot = (-180 + Math.floor(Math.random() * 360));
        var faceDur = dur - Math.floor(Math.random() * 300);
        var size = 22 + Math.floor(Math.random() * 14);
        d.textContent = faces[i];
        d.style.cssText =
          'left:50vw;top:45vh;font-size:' + size + 'px;' +
          '--spell-fw-dx:' + dx + 'px;--spell-fw-dy:' + dy + 'px;' +
          '--spell-dice-rot:' + rot + 'deg;' +
          'animation:spell-dice-tumble ' + faceDur + 'ms ease-out forwards;';
        $layer.appendChild(d);
        active.bursts++;
        (function (el, t) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, t + 100);
        })(d, faceDur);
      }
    }

    // ─── bee (companion) ──────────────────────────────────────────
    // A bee crosses the screen at ~55vh height with an erratic zigzag
    // flutter — rapid vertical oscillation overlaid on the horizontal
    // walk. Faster than moth, more purposeful (it has somewhere to be).
    function castBee(durationMs) {
      if (active.byId.bee) {
        var prev = active.byId.bee;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var bee = document.createElement('button');
      bee.className = 'spell-bee';
      bee.type = 'button';
      bee.setAttribute('aria-label', 'A busy bee. Click to shoo it away.');
      bee.title = 'click to shoo the bee';
      bee.textContent = '🐝';
      var ltr = Math.random() < 0.5;
      bee.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = durationMs || 35000;
      var flySeconds = Math.max(8, Math.min(22, window.innerWidth / 75));
      bee.style.cssText =
        'animation:spell-bee-fly-' + (ltr ? 'ltr' : 'rtl') + ' ' + flySeconds + 's linear infinite,' +
        'spell-bee-zigzag 0.28s ease-in-out infinite;';
      bee.addEventListener('click', function () {
        if (bee.parentNode) bee.parentNode.removeChild(bee);
        active.byId.bee = null;
      });
      $layer.appendChild(bee);
      active.byId.bee = bee;
      setTimeout(function () {
        if (bee && bee.parentNode) bee.parentNode.removeChild(bee);
        if (active.byId.bee === bee) active.byId.bee = null;
      }, dur);
    }

    // ─── fog (ambient) ────────────────────────────────────────────
    // 8 translucent wisps drift laterally across the bottom quarter of
    // the viewport at different speeds and opacity. The combined effect
    // reads as low morning mist. Click anywhere on the overlay to lift.
    function castFog() {
      if (active.byId.fog) return;
      var fog = document.createElement('button');
      fog.className = 'spell-fog';
      fog.type = 'button';
      fog.setAttribute('aria-label', 'Fog overlay. Click to lift the mist.');
      fog.title = 'click to lift the fog';
      var html = '';
      var wispCount = 8;
      for (var i = 0; i < wispCount; i++) {
        var heightPct = (12 + Math.random() * 22).toFixed(1);
        var widthPct = (90 + Math.random() * 40).toFixed(1);
        var opacity = (0.12 + Math.random() * 0.2).toFixed(2);
        var driftDir = Math.random() < 0.5 ? 'ltr' : 'rtl';
        var driftDur = (18 + Math.random() * 20).toFixed(1);
        var delay = (Math.random() * 8).toFixed(2);
        html += '<span class="spell-fog__wisp" style="' +
          'height:' + heightPct + 'vh;' +
          'width:' + widthPct + '%;' +
          'opacity:' + opacity + ';' +
          'animation:spell-fog-drift-' + driftDir + ' ' + driftDur + 's ease-in-out ' + delay + 's infinite alternate;' +
          '"></span>';
      }
      fog.innerHTML = html;
      fog.addEventListener('click', function () {
        if (fog.parentNode) fog.parentNode.removeChild(fog);
        active.byId.fog = null;
      });
      $layer.appendChild(fog);
      active.byId.fog = fog;
    }

    // ─── balloon (burst) ─────────────────────────────────────────
    // 10 balloons float up from the bottom, each drifting laterally.
    // Uses translateY so the starting position (bottom:-60px) stays
    // correct without animating \`bottom\` directly.
    function castBalloon(durationMs) {
      if (reduce()) return;
      var count = 10;
      for (var i = 0; i < count; i++) {
        var b = document.createElement('span');
        b.className = 'spell-balloon';
        var startX = Math.random() * (window.innerWidth - 40) + 20;
        var drift = ((Math.random() - 0.5) * 180).toFixed(1);
        var size = 28 + Math.floor(Math.random() * 20);
        var dur = (durationMs || 4200) - Math.floor(Math.random() * 900);
        var delay = Math.floor(Math.random() * 500);
        b.style.cssText =
          'left:' + startX + 'px;' +
          'font-size:' + size + 'px;' +
          '--spell-balloon-drift:' + drift + 'px;' +
          'animation-duration:' + dur + 'ms;' +
          'animation-delay:' + delay + 'ms;';
        b.textContent = '🎈';
        $layer.appendChild(b);
        active.bursts++;
        (function (el) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, dur + delay + 100);
        })(b);
      }
    }

    // ─── turtle (companion) ──────────────────────────────────────
    // Slowest companion — ~30px/s. The charm is in the patience.
    // Gentle head-nod (small vertical) on a separate slow cycle.
    function castTurtle(durationMs) {
      if (active.byId.turtle) {
        var prevT = active.byId.turtle;
        if (prevT && prevT.parentNode) prevT.parentNode.removeChild(prevT);
      }
      var tur = document.createElement('button');
      tur.className = 'spell-turtle';
      tur.type = 'button';
      tur.setAttribute('aria-label', 'A slow turtle. Click to let it be.');
      tur.title = 'click to let the turtle be';
      tur.textContent = '🐢';
      var ltr = Math.random() < 0.5;
      tur.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = durationMs || 90000;
      var walkSeconds = Math.max(22, Math.min(60, window.innerWidth / 28));
      tur.style.cssText =
        'animation:spell-turtle-walk-' + (ltr ? 'ltr' : 'rtl') + ' ' + walkSeconds + 's linear infinite,' +
        'spell-turtle-nod' + (ltr ? '' : '-rtl') + ' 2.4s ease-in-out infinite;';
      tur.addEventListener('click', function () {
        if (tur.parentNode) tur.parentNode.removeChild(tur);
        active.byId.turtle = null;
      });
      $layer.appendChild(tur);
      active.byId.turtle = tur;
      setTimeout(function () {
        if (tur && tur.parentNode) tur.parentNode.removeChild(tur);
        if (active.byId.turtle === tur) active.byId.turtle = null;
      }, dur);
    }

    // ─── ghost (companion) ───────────────────────────────────────
    // Friendly 👻 drifts at mid-screen height (35–65vh from bottom)
    // with a slow sinusoidal float. Translucent, non-threatening.
    function castGhost(durationMs) {
      if (active.byId.ghost) {
        var prevG = active.byId.ghost;
        if (prevG && prevG.parentNode) prevG.parentNode.removeChild(prevG);
      }
      var g = document.createElement('button');
      g.className = 'spell-ghost';
      g.type = 'button';
      g.setAttribute('aria-label', 'A friendly ghost drifting by. Click to send it on.');
      g.title = 'click to send the ghost on';
      g.textContent = '👻';
      var ltr = Math.random() < 0.5;
      g.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = durationMs || 50000;
      var flySeconds = Math.max(12, Math.min(36, window.innerWidth / 58));
      var heightPct = (35 + Math.random() * 30).toFixed(1);
      g.style.cssText =
        'bottom:' + heightPct + 'vh;' +
        'animation:spell-ghost-fly-' + (ltr ? 'ltr' : 'rtl') + ' ' + flySeconds + 's linear infinite,' +
        'spell-ghost-float' + (ltr ? '' : '-rtl') + ' 3.2s ease-in-out infinite;';
      g.addEventListener('click', function () {
        if (g.parentNode) g.parentNode.removeChild(g);
        active.byId.ghost = null;
      });
      $layer.appendChild(g);
      active.byId.ghost = g;
      setTimeout(function () {
        if (g && g.parentNode) g.parentNode.removeChild(g);
        if (active.byId.ghost === g) active.byId.ghost = null;
      }, dur);
    }

    // ─── campfire (ambient) ──────────────────────────────────────
    // Two overlaid flame glyphs + a log + a radial glow ellipse.
    // Sits bottom-left (distinct from candle at bottom-right).
    // Recasting is a no-op while active.
    function castCampfire() {
      if (active.byId.campfire) return;
      var cf = document.createElement('button');
      cf.className = 'spell-campfire';
      cf.type = 'button';
      cf.setAttribute('aria-label', 'A campfire. Click to put it out.');
      cf.title = 'click to put out the fire';
      cf.innerHTML =
        '<span class="spell-campfire__glow" aria-hidden="true"></span>' +
        '<span class="spell-campfire__flame spell-campfire__flame--side" aria-hidden="true">🔥</span>' +
        '<span class="spell-campfire__flame spell-campfire__flame--main" aria-hidden="true">🔥</span>' +
        '<span class="spell-campfire__log" aria-hidden="true">🪵</span>';
      cf.addEventListener('click', function () {
        if (cf.parentNode) cf.parentNode.removeChild(cf);
        active.byId.campfire = null;
      });
      $layer.appendChild(cf);
      active.byId.campfire = cf;
    }

    // ─── spark (burst) ───────────────────────────────────────────
    // 24 thin bright streaks fan radially from a random viewport point —
    // like striking a flint. Each streak is a 2×12 rect rotated to align
    // with its travel direction, using the fw dx/dy custom-prop pattern.
    function castSpark(durationMs) {
      if (reduce()) return;
      var count = 24;
      var cx = (12 + Math.random() * 76).toFixed(1); // vw
      var cy = (15 + Math.random() * 55).toFixed(1); // vh
      for (var i = 0; i < count; i++) {
        var s = document.createElement('span');
        s.className = 'spell-spark';
        var angle = (i / count) * 2 * Math.PI;
        var dist = 35 + Math.random() * 90;
        var dx = (Math.cos(angle) * dist).toFixed(1);
        var dy = (Math.sin(angle) * dist).toFixed(1);
        var rotateDeg = Math.round(angle * 180 / Math.PI + 90);
        var dur = 500 + Math.floor(Math.random() * 600);
        s.style.cssText =
          'left:' + cx + 'vw;top:' + cy + 'vh;' +
          '--spell-fw-dx:' + dx + 'px;--spell-fw-dy:' + dy + 'px;' +
          '--spell-spark-rot:' + rotateDeg + 'deg;' +
          'animation:spell-spark-fly ' + dur + 'ms ease-out forwards;';
        $layer.appendChild(s);
        active.bursts++;
        (function (el) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, dur + 100);
        })(s);
      }
    }

    // ─── frog (companion) ─────────────────────────────────────────
    // Hops across the bottom in parabolic arcs — a separate hop keyframe
    // overlays on the horizontal walk, same composition as pup's bounce.
    // Avg ~60px/s, hops about every 0.9s. The charm is the airtime.
    function castFrog(durationMs) {
      if (active.byId.frog) {
        var prevFr = active.byId.frog;
        if (prevFr && prevFr.parentNode) prevFr.parentNode.removeChild(prevFr);
      }
      var frog = document.createElement('button');
      frog.className = 'spell-frog';
      frog.type = 'button';
      frog.setAttribute('aria-label', 'A hopping frog. Click to let it leap away.');
      frog.title = 'click to let the frog hop away';
      frog.textContent = '🐸';
      var ltr = Math.random() < 0.5;
      frog.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = durationMs || 35000;
      var walkSeconds = Math.max(10, Math.min(30, window.innerWidth / 60));
      frog.style.cssText =
        'animation:spell-frog-walk-' + (ltr ? 'ltr' : 'rtl') + ' ' + walkSeconds + 's linear infinite,' +
        'spell-frog-hop 0.9s cubic-bezier(.4,0,.6,1) infinite;';
      frog.addEventListener('click', function () {
        if (frog.parentNode) frog.parentNode.removeChild(frog);
        active.byId.frog = null;
      });
      $layer.appendChild(frog);
      active.byId.frog = frog;
      setTimeout(function () {
        if (frog && frog.parentNode) frog.parentNode.removeChild(frog);
        if (active.byId.frog === frog) active.byId.frog = null;
      }, dur);
    }

    // ─── leaves (ambient) ─────────────────────────────────────────
    // 25 leaf emoji spin and drift down the viewport. Like snow but the
    // fall keyframe also rotates each leaf — spin baked in proportionally
    // to fall distance. Negative delay puts leaves mid-fall on cast.
    function castLeaves() {
      if (active.byId.leaves) return;
      var lv = document.createElement('button');
      lv.className = 'spell-leaves';
      lv.type = 'button';
      lv.setAttribute('aria-label', 'Falling leaves overlay. Click to dismiss.');
      lv.title = 'click to clear the leaves';
      var glyphs = ['🍂', '🍁', '🍂', '🍁', '🌿', '🍂', '🍁'];
      var html = '';
      for (var i = 0; i < 25; i++) {
        var leftPct = (Math.random() * 106 - 3).toFixed(1);
        var delay = (Math.random() * 11).toFixed(2);
        var dur = (7 + Math.random() * 8).toFixed(2);
        var size = 13 + Math.floor(Math.random() * 13);
        var drift = ((Math.random() - 0.5) * 200).toFixed(1);
        var spin = Math.random() < 0.5 ? 360 : -360;
        var glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
        html += '<span class="spell-leaves__leaf" style="' +
          'left:' + leftPct + '%;' +
          'font-size:' + size + 'px;' +
          'animation-delay:-' + delay + 's;' +
          'animation-duration:' + dur + 's;' +
          '--spell-leaves-drift:' + drift + 'px;' +
          '--spell-leaves-spin:' + spin + 'deg;' +
          '">' + glyph + '</span>';
      }
      lv.innerHTML = html;
      lv.addEventListener('click', function () {
        if (lv.parentNode) lv.parentNode.removeChild(lv);
        active.byId.leaves = null;
      });
      $layer.appendChild(lv);
      active.byId.leaves = lv;
    }

    // ─── lantern (ambient) ────────────────────────────────────────
    // A paper lantern in the top-left corner — fills the last open corner
    // (candle=BR, chimes=TR, campfire=BL). Swings on its hang-point via
    // transform-origin at the top-center. Warm glow via drop-shadow.
    function castLantern() {
      if (active.byId.lantern) return;
      var l = document.createElement('button');
      l.className = 'spell-lantern';
      l.type = 'button';
      l.setAttribute('aria-label', 'A paper lantern. Click to extinguish.');
      l.title = 'click to extinguish';
      l.textContent = '🏮';
      l.addEventListener('click', function () {
        if (l.parentNode) l.parentNode.removeChild(l);
        active.byId.lantern = null;
      });
      $layer.appendChild(l);
      active.byId.lantern = l;
    }

    // ─── dispatch ───────────────────────────────────────────────
    function castSpell(id) {
      switch (id) {
        case 'confetti':  castConfetti(4500); break;
        case 'cat':       castCat(60000); break;
        case 'pup':       castPup(50000); break;
        case 'penguin':   castPenguin(70000); break;
        case 'breath':    castBreath(); break;
        case 'candle':    castCandle(); break;
        case 'rain':      castRain(); break;
        case 'starfield': castStarfield(); break;
        case 'firework':  castFirework(3500); break;
        case 'fish':      castFish(45000); break;
        case 'moth':      castMoth(55000); break;
        case 'snow':      castSnow(); break;
        case 'shout':     castShout(2200); break;
        case 'wave':      castWave(3000); break;
        case 'firefly':   castFirefly(40000); break;
        case 'chimes':    castChimes(); break;
        case 'bloom':     castBloom(2800); break;
        case 'aurora':    castAurora(); break;
        case 'here':      castHere(); break;
        case 'mood':      castMood(); break;
        case 'bubble':    castBubble(3200); break;
        case 'dice':      castDice(2500); break;
        case 'bee':       castBee(35000); break;
        case 'fog':       castFog(); break;
        case 'balloon':   castBalloon(4200); break;
        case 'turtle':    castTurtle(90000); break;
        case 'ghost':     castGhost(50000); break;
        case 'campfire':  castCampfire(); break;
        case 'spark':     castSpark(2000); break;
        case 'frog':      castFrog(35000); break;
        case 'leaves':    castLeaves(); break;
        case 'lantern':   castLantern(); break;
        default:
          // Unknown spell — silent no-op; could surface a toast in the
          // bar but spells are meant to be playful, so we just ignore.
          try { console.info('[spell] unknown:', id); } catch (e) {}
      }
    }

    function clearAll() {
      // Kill all ambients/companions — bursts time out on their own.
      Object.keys(active.byId).forEach(function (k) {
        var el = active.byId[k];
        if (el && el.parentNode) el.parentNode.removeChild(el);
        active.byId[k] = null;
      });
      if (active.byId.breathTimer) { clearTimeout(active.byId.breathTimer); active.byId.breathTimer = 0; }
    }

    window.addEventListener('pc:spell:cast', function (e) {
      var id = e && e.detail && e.detail.id;
      if (id) castSpell(id);
    });
    window.addEventListener('pc:spell:clear', clearAll);
  })();
<\/script>`], ["", `<div class="spell-layer" id="pc-spell-layer" aria-hidden="true"></div> <script>
  (function () {
    'use strict';

    var $layer = document.getElementById('pc-spell-layer');
    if (!$layer) return;

    // Track active companions/ambient so "clear" can wipe them.
    var active = { byId: {}, bursts: 0 };

    function reduce() {
      try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
    }

    // ─── confetti (burst) ───────────────────────────────────────
    function castConfetti(durationMs) {
      if (reduce()) return; // no animation in reduced-motion mode
      var palette = ['#d4a437', '#4A9EFF', '#c4952e', '#fdf2d6', '#8a2432', '#2f8f5f'];
      var count = 36;
      for (var i = 0; i < count; i++) {
        var d = document.createElement('span');
        d.className = 'spell-confetti';
        var size = 6 + Math.floor(Math.random() * 8);
        var startX = Math.random() * window.innerWidth;
        var driftX = (Math.random() - 0.5) * 240;
        var rotateStart = Math.floor(Math.random() * 360);
        var rotateEnd = rotateStart + 360 + Math.floor(Math.random() * 720);
        var fallTime = (durationMs || 4500) - Math.floor(Math.random() * 600);
        d.style.cssText =
          'left:' + startX + 'px;' +
          'top:-' + size + 'px;' +
          'width:' + size + 'px;' +
          'height:' + Math.floor(size * 0.6) + 'px;' +
          'background:' + palette[Math.floor(Math.random() * palette.length)] + ';' +
          'transform:rotate(' + rotateStart + 'deg);' +
          'animation:spell-confetti-fall ' + fallTime + 'ms cubic-bezier(.32,.4,.6,1) forwards;' +
          '--spell-drift-x:' + driftX + 'px;' +
          '--spell-rotate-end:' + rotateEnd + 'deg;';
        $layer.appendChild(d);
        active.bursts++;
        (function (el) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, fallTime + 100);
        })(d);
      }
    }

    // ─── cat (companion) ────────────────────────────────────────
    function castCat(durationMs) {
      // One cat at a time — recasting sends the existing one off.
      if (active.byId.cat) {
        var prev = active.byId.cat;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var cat = document.createElement('button');
      cat.className = 'spell-cat';
      cat.type = 'button';
      cat.setAttribute('aria-label', 'A walking cat. Click to send away.');
      cat.title = 'click to send the cat home';
      cat.textContent = '🐈';
      // 60% chance left-to-right, 40% right-to-left (whim).
      var ltr = Math.random() < 0.6;
      cat.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = (durationMs || 60000);
      // Scale walk speed to viewport width — keep ~80px/s feel.
      var walkSeconds = Math.max(8, Math.min(30, window.innerWidth / 80));
      cat.style.cssText =
        'animation:spell-cat-walk-' + (ltr ? 'ltr' : 'rtl') + ' ' + walkSeconds + 's linear infinite;';
      cat.addEventListener('click', function () {
        if (cat.parentNode) cat.parentNode.removeChild(cat);
        active.byId.cat = null;
      });
      $layer.appendChild(cat);
      active.byId.cat = cat;
      // Auto-dismiss after duration so it doesn't loop forever.
      setTimeout(function () {
        if (cat && cat.parentNode) cat.parentNode.removeChild(cat);
        if (active.byId.cat === cat) active.byId.cat = null;
      }, dur);
    }

    // ─── breath (ambient) ───────────────────────────────────────
    // 4-7-8 breathing — inhale 4s, hold 7s, exhale 8s. Cycle ~19s.
    function castBreath() {
      if (active.byId.breath) return; // toggle via dismiss
      var b = document.createElement('div');
      b.className = 'spell-breath';
      b.setAttribute('role', 'button');
      b.setAttribute('aria-label', 'Breathing circle, 4-7-8 rhythm. Click to dismiss.');
      b.tabIndex = 0;
      b.innerHTML =
        '<div class="spell-breath__ring" aria-hidden="true"></div>' +
        '<div class="spell-breath__inner" aria-hidden="true"></div>' +
        '<p class="spell-breath__cue mono" id="pc-spell-breath-cue">breathe in · 4</p>';
      b.addEventListener('click', dismissBreath);
      b.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dismissBreath(); }
      });
      $layer.appendChild(b);
      active.byId.breath = b;
      // Cue cycle so the user knows the phase even with reduce-motion.
      var phases = [
        { text: 'breathe in · 4',  ms: 4000 },
        { text: 'hold · 7',        ms: 7000 },
        { text: 'breathe out · 8', ms: 8000 },
      ];
      var idx = 0;
      var $cue = b.querySelector('#pc-spell-breath-cue');
      function advance() {
        if (!active.byId.breath) return;
        if ($cue) $cue.textContent = phases[idx].text;
        idx = (idx + 1) % phases.length;
        active.byId.breathTimer = setTimeout(advance, phases[(idx + 2) % 3].ms);
      }
      advance();
    }
    function dismissBreath() {
      var b = active.byId.breath;
      if (!b) return;
      if (active.byId.breathTimer) { clearTimeout(active.byId.breathTimer); active.byId.breathTimer = 0; }
      if (b.parentNode) b.parentNode.removeChild(b);
      active.byId.breath = null;
    }

    // ─── candle (ambient) ───────────────────────────────────────
    function castCandle() {
      if (active.byId.candle) return;
      var c = document.createElement('button');
      c.className = 'spell-candle';
      c.type = 'button';
      c.setAttribute('aria-label', 'A lit candle. Click to snuff out.');
      c.title = 'click to snuff out';
      c.innerHTML =
        '<span class="spell-candle__flame" aria-hidden="true">🔥</span>' +
        '<span class="spell-candle__body" aria-hidden="true">🕯️</span>';
      c.addEventListener('click', function () {
        if (c.parentNode) c.parentNode.removeChild(c);
        active.byId.candle = null;
      });
      $layer.appendChild(c);
      active.byId.candle = c;
    }

    // ─── pup (companion) ────────────────────────────────────────
    // Like cat but bouncier — see the @keyframes spell-pup-walk-* CSS
    // for the small vertical hop on each step. Tail-wag is a separate
    // micro-animation on the glyph.
    function castPup(durationMs) {
      if (active.byId.pup) {
        var prev = active.byId.pup;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var pup = document.createElement('button');
      pup.className = 'spell-pup';
      pup.type = 'button';
      pup.setAttribute('aria-label', 'A walking puppy. Click to send home.');
      pup.title = 'click to send the pup home';
      pup.textContent = '🐶';
      var ltr = Math.random() < 0.5;
      pup.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = (durationMs || 50000);
      var walkSeconds = Math.max(7, Math.min(22, window.innerWidth / 110));
      pup.style.cssText =
        'animation:spell-pup-walk-' + (ltr ? 'ltr' : 'rtl') + ' ' + walkSeconds + 's linear infinite,' +
        'spell-pup-bounce 0.42s ease-in-out infinite;';
      pup.addEventListener('click', function () {
        if (pup.parentNode) pup.parentNode.removeChild(pup);
        active.byId.pup = null;
      });
      $layer.appendChild(pup);
      active.byId.pup = pup;
      setTimeout(function () {
        if (pup && pup.parentNode) pup.parentNode.removeChild(pup);
        if (active.byId.pup === pup) active.byId.pup = null;
      }, dur);
    }

    // ─── penguin (companion) ────────────────────────────────────
    // Slow waddle — long step time + side-to-side rock applied via the
    // wobble keyframe. Penguin doesn't pause; he just keeps going.
    function castPenguin(durationMs) {
      if (active.byId.penguin) {
        var prev2 = active.byId.penguin;
        if (prev2 && prev2.parentNode) prev2.parentNode.removeChild(prev2);
      }
      var pen = document.createElement('button');
      pen.className = 'spell-penguin';
      pen.type = 'button';
      pen.setAttribute('aria-label', 'A waddling penguin. Click to send home.');
      pen.title = 'click to send the penguin home';
      pen.textContent = '🐧';
      var ltr = Math.random() < 0.5;
      pen.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = (durationMs || 70000);
      // Penguin walks slower than cat or pup — ~50px/s.
      var walkSeconds = Math.max(14, Math.min(40, window.innerWidth / 50));
      pen.style.cssText =
        'animation:spell-penguin-walk-' + (ltr ? 'ltr' : 'rtl') + ' ' + walkSeconds + 's linear infinite,' +
        'spell-penguin-wobble 0.7s ease-in-out infinite;';
      pen.addEventListener('click', function () {
        if (pen.parentNode) pen.parentNode.removeChild(pen);
        active.byId.penguin = null;
      });
      $layer.appendChild(pen);
      active.byId.penguin = pen;
      setTimeout(function () {
        if (pen && pen.parentNode) pen.parentNode.removeChild(pen);
        if (active.byId.penguin === pen) active.byId.penguin = null;
      }, dur);
    }

    // ─── rain (ambient) ─────────────────────────────────────────
    // 80 light blue pixel-rain streaks fall continuously. Implemented
    // as a single overlay div with N child spans on randomized
    // animation delays, each a slim translucent line. Click to dismiss.
    function castRain() {
      if (active.byId.rain) return;
      var rain = document.createElement('button');
      rain.className = 'spell-rain';
      rain.type = 'button';
      rain.setAttribute('aria-label', 'Pixel rain overlay. Click to dismiss.');
      rain.title = 'click to clear the rain';
      var html = '';
      for (var i = 0; i < 80; i++) {
        var leftPct = Math.random() * 100;
        var delay = (Math.random() * 1.6).toFixed(2);
        var dur = (1.2 + Math.random() * 1.2).toFixed(2);
        var len = 14 + Math.floor(Math.random() * 14);
        var op = (0.35 + Math.random() * 0.35).toFixed(2);
        html += '<span class="spell-rain__drop" style="' +
          'left:' + leftPct + '%;' +
          'height:' + len + 'px;' +
          'animation-delay:' + delay + 's;' +
          'animation-duration:' + dur + 's;' +
          'opacity:' + op + ';' +
          '"></span>';
      }
      rain.innerHTML = html;
      rain.addEventListener('click', function () {
        if (rain.parentNode) rain.parentNode.removeChild(rain);
        active.byId.rain = null;
      });
      $layer.appendChild(rain);
      active.byId.rain = rain;
    }

    // ─── starfield (ambient) ────────────────────────────────────
    // Slow-twinkling stars at random positions. Each star is a small
    // dot with a soft box-shadow + opacity-pulse animation on staggered
    // delay. ~60 stars across the viewport.
    function castStarfield() {
      if (active.byId.starfield) return;
      var sky = document.createElement('button');
      sky.className = 'spell-starfield';
      sky.type = 'button';
      sky.setAttribute('aria-label', 'Starfield overlay. Click to dismiss.');
      sky.title = 'click to dim the stars';
      var html = '';
      for (var j = 0; j < 60; j++) {
        var x = (Math.random() * 100).toFixed(1);
        var y = (Math.random() * 100).toFixed(1);
        var size = (1 + Math.random() * 2).toFixed(1);
        var delay = (Math.random() * 4).toFixed(2);
        var dur = (3 + Math.random() * 4).toFixed(2);
        html += '<span class="spell-starfield__star" style="' +
          'left:' + x + '%;' +
          'top:' + y + '%;' +
          'width:' + size + 'px;' +
          'height:' + size + 'px;' +
          'animation-delay:' + delay + 's;' +
          'animation-duration:' + dur + 's;' +
          '></span>';
      }
      sky.innerHTML = html;
      sky.addEventListener('click', function () {
        if (sky.parentNode) sky.parentNode.removeChild(sky);
        active.byId.starfield = null;
      });
      $layer.appendChild(sky);
      active.byId.starfield = sky;
    }

    // ─── firework (burst) ───────────────────────────────────────
    // Three staggered bursts at random viewport positions. Each burst
    // spawns 22 sparks that shoot radially outward and fade. Pure CSS
    // custom-property trick: compute dx/dy in JS, animate in CSS.
    function castFirework(durationMs) {
      if (reduce()) return;
      var colors = ['#d4a437', '#4A9EFF', '#c4952e', '#fdf2d6', '#8a2432', '#2f8f5f', '#a78bfa'];
      function fireBurst(delay) {
        setTimeout(function () {
          var cx = 10 + Math.random() * 80; // vw
          var cy = 10 + Math.random() * 55; // vh
          var sparkCount = 22;
          for (var i = 0; i < sparkCount; i++) {
            var s = document.createElement('span');
            s.className = 'spell-firework-spark';
            var angleRad = (i / sparkCount) * 2 * Math.PI;
            var dist = 55 + Math.random() * 80;
            var dx = (Math.cos(angleRad) * dist).toFixed(1);
            var dy = (Math.sin(angleRad) * dist).toFixed(1);
            var color = colors[Math.floor(Math.random() * colors.length)];
            var sparkDur = 700 + Math.floor(Math.random() * 600);
            s.style.cssText =
              'left:' + cx + 'vw;' +
              'top:' + cy + 'vh;' +
              'background:' + color + ';' +
              '--spell-fw-dx:' + dx + 'px;' +
              '--spell-fw-dy:' + dy + 'px;' +
              'animation:spell-firework-spark-fly ' + sparkDur + 'ms ease-out forwards;';
            $layer.appendChild(s);
            active.bursts++;
            (function (el) {
              setTimeout(function () {
                if (el && el.parentNode) el.parentNode.removeChild(el);
                active.bursts = Math.max(0, active.bursts - 1);
              }, sparkDur + 100);
            })(s);
          }
        }, delay);
      }
      fireBurst(0);
      fireBurst(600);
      fireBurst(1300);
    }

    // ─── fish (companion) ────────────────────────────────────────
    // Glides smoothly at ~60px/s with a gentle vertical bob. Calmer
    // than cat or pup — ease-in-out swim, unhurried.
    function castFish(durationMs) {
      if (active.byId.fish) {
        var prev = active.byId.fish;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var fish = document.createElement('button');
      fish.className = 'spell-fish';
      fish.type = 'button';
      fish.setAttribute('aria-label', 'A fish gliding by. Click to let it swim away.');
      fish.title = 'click to release the fish';
      fish.textContent = '🐟';
      var ltr = Math.random() < 0.5;
      fish.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = (durationMs || 45000);
      var swimSeconds = Math.max(10, Math.min(28, window.innerWidth / 60));
      fish.style.cssText =
        'animation:spell-fish-swim-' + (ltr ? 'ltr' : 'rtl') + ' ' + swimSeconds + 's ease-in-out infinite,' +
        'spell-fish-bob 2.4s ease-in-out infinite;';
      fish.addEventListener('click', function () {
        if (fish.parentNode) fish.parentNode.removeChild(fish);
        active.byId.fish = null;
      });
      $layer.appendChild(fish);
      active.byId.fish = fish;
      setTimeout(function () {
        if (fish && fish.parentNode) fish.parentNode.removeChild(fish);
        if (active.byId.fish === fish) active.byId.fish = null;
      }, dur);
    }

    // ─── moth (companion) ────────────────────────────────────────
    // Flies mid-screen height (not bottom like cat/pup) with an erratic
    // vertical flutter that mimics being drawn toward a light source.
    function castMoth(durationMs) {
      if (active.byId.moth) {
        var prev = active.byId.moth;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var moth = document.createElement('button');
      moth.className = 'spell-moth';
      moth.type = 'button';
      moth.setAttribute('aria-label', 'A moth fluttering by. Click to send it on.');
      moth.title = 'click to send the moth on';
      moth.textContent = '🦋';
      var ltr = Math.random() < 0.5;
      moth.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = (durationMs || 55000);
      var flySeconds = Math.max(10, Math.min(30, window.innerWidth / 70));
      moth.style.cssText =
        'animation:spell-moth-fly-' + (ltr ? 'ltr' : 'rtl') + ' ' + flySeconds + 's linear infinite,' +
        'spell-moth-flutter 0.55s ease-in-out infinite;';
      moth.addEventListener('click', function () {
        if (moth.parentNode) moth.parentNode.removeChild(moth);
        active.byId.moth = null;
      });
      $layer.appendChild(moth);
      active.byId.moth = moth;
      setTimeout(function () {
        if (moth && moth.parentNode) moth.parentNode.removeChild(moth);
        if (active.byId.moth === moth) active.byId.moth = null;
      }, dur);
    }

    // ─── snow (ambient) ──────────────────────────────────────────
    // 60 soft white flakes, each with a random size, fall speed, and
    // lateral drift. Negative animation-delay puts each flake mid-fall
    // on cast so the screen fills immediately.
    function castSnow() {
      if (active.byId.snow) return;
      var snow = document.createElement('button');
      snow.className = 'spell-snow';
      snow.type = 'button';
      snow.setAttribute('aria-label', 'Snowfall overlay. Click to dismiss.');
      snow.title = 'click to stop the snow';
      var html = '';
      for (var i = 0; i < 60; i++) {
        var leftPct = (Math.random() * 100).toFixed(1);
        var delay = (Math.random() * 8).toFixed(2);
        var dur = (5 + Math.random() * 7).toFixed(2);
        var size = (4 + Math.random() * 5).toFixed(1);
        var drift = ((Math.random() - 0.5) * 70).toFixed(1);
        var op = (0.5 + Math.random() * 0.4).toFixed(2);
        html += '<span class="spell-snow__flake" style="' +
          'left:' + leftPct + '%;' +
          'width:' + size + 'px;' +
          'height:' + size + 'px;' +
          'animation-delay:-' + delay + 's;' +
          'animation-duration:' + dur + 's;' +
          'opacity:' + op + ';' +
          '--spell-snow-drift:' + drift + 'px;' +
          '"></span>';
      }
      snow.innerHTML = html;
      snow.addEventListener('click', function () {
        if (snow.parentNode) snow.parentNode.removeChild(snow);
        active.byId.snow = null;
      });
      $layer.appendChild(snow);
      active.byId.snow = snow;
    }

    // ─── shout (burst) ───────────────────────────────────────────
    // Typographic burst: punctuation fans radially from viewport center.
    // Reuses the firework dx/dy CSS-custom-prop trick on text nodes.
    function castShout(durationMs) {
      if (reduce()) return;
      var chars = ['!', '!', '?', '!!', '!', '?!', '!', '!!', '!', '?', '!', '!!', '!', '?', '!'];
      var count = 15;
      for (var i = 0; i < count; i++) {
        var s = document.createElement('span');
        s.className = 'spell-shout-char';
        var angle = (i / count) * 2 * Math.PI;
        var dist = 80 + Math.random() * 120;
        var dx = (Math.cos(angle) * dist).toFixed(1);
        var dy = (Math.sin(angle) * dist).toFixed(1);
        var dur = (durationMs || 2200) - Math.floor(Math.random() * 400);
        var fontSize = 16 + Math.floor(Math.random() * 22);
        s.textContent = chars[i % chars.length];
        s.style.cssText =
          'left:50vw;top:45vh;font-size:' + fontSize + 'px;' +
          '--spell-fw-dx:' + dx + 'px;--spell-fw-dy:' + dy + 'px;' +
          'animation:spell-shout-fly ' + dur + 'ms ease-out forwards;';
        $layer.appendChild(s);
        active.bursts++;
        (function (el) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, dur + 100);
        })(s);
      }
    }

    // ─── wave (burst) ────────────────────────────────────────────
    // 14 hands stagger across the screen L→R with a delay ramp —
    // gives the classic stadium-wave ripple effect.
    function castWave(durationMs) {
      if (reduce()) return;
      var count = 14;
      var dur = durationMs || 3000;
      for (var i = 0; i < count; i++) {
        var w = document.createElement('span');
        w.className = 'spell-wave-hand';
        w.textContent = '👋';
        var leftPct = (i / (count - 1)) * 88 + 6;
        var bottomPct = 18 + Math.random() * 16;
        var delay = Math.round((i / count) * 550);
        var waveDur = 1100 + Math.floor(Math.random() * 300);
        w.style.cssText =
          'left:' + leftPct.toFixed(1) + '%;bottom:' + bottomPct.toFixed(1) + '%;' +
          'animation:spell-wave-appear ' + waveDur + 'ms ease-in-out ' + delay + 'ms forwards;';
        $layer.appendChild(w);
        active.bursts++;
        (function (el) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, dur + 100);
        })(w);
      }
    }

    // ─── firefly (companion) ─────────────────────────────────────
    // A single glowing dot drifts at a random height (30–70vh) on a
    // slow ease-in-out path. The glow child pulses independently.
    function castFirefly(durationMs) {
      if (active.byId.firefly) {
        var prev = active.byId.firefly;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var fly = document.createElement('button');
      fly.className = 'spell-firefly';
      fly.type = 'button';
      fly.setAttribute('aria-label', 'A firefly drifting by. Click to release it.');
      fly.title = 'click to release the firefly';
      fly.innerHTML = '<span class="spell-firefly__glow" aria-hidden="true"></span>';
      var ltr = Math.random() < 0.5;
      fly.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = durationMs || 40000;
      var heightPct = (30 + Math.random() * 40).toFixed(1);
      var driftSeconds = Math.max(12, Math.min(35, window.innerWidth / 40));
      fly.style.cssText =
        'bottom:' + heightPct + 'vh;' +
        'animation:spell-firefly-drift-' + (ltr ? 'ltr' : 'rtl') + ' ' + driftSeconds + 's ease-in-out infinite;';
      fly.addEventListener('click', function () {
        if (fly.parentNode) fly.parentNode.removeChild(fly);
        active.byId.firefly = null;
      });
      $layer.appendChild(fly);
      active.byId.firefly = fly;
      setTimeout(function () {
        if (fly && fly.parentNode) fly.parentNode.removeChild(fly);
        if (active.byId.firefly === fly) active.byId.firefly = null;
      }, dur);
    }

    // ─── chimes (ambient) ────────────────────────────────────────
    // 5 metallic pipes hang from the top-right corner. Each sways at
    // a slightly different period — staggered delays vary the rhythm.
    function castChimes() {
      if (active.byId.chimes) return;
      var ch = document.createElement('button');
      ch.className = 'spell-chimes';
      ch.type = 'button';
      ch.setAttribute('aria-label', 'Wind chimes. Click to still them.');
      ch.title = 'click to still the chimes';
      var lengths = [62, 48, 72, 54, 68];
      var html = '';
      for (var i = 0; i < 5; i++) {
        var delay = (i * 0.38 + Math.random() * 0.25).toFixed(2);
        var pipeDur = (1.9 + Math.random() * 1.4).toFixed(2);
        html += '<span class="spell-chimes__pipe" style="' +
          'height:' + lengths[i] + 'px;' +
          'animation-delay:' + delay + 's;' +
          'animation-duration:' + pipeDur + 's;' +
          '"></span>';
      }
      ch.innerHTML = html;
      ch.addEventListener('click', function () {
        if (ch.parentNode) ch.parentNode.removeChild(ch);
        active.byId.chimes = null;
      });
      $layer.appendChild(ch);
      active.byId.chimes = ch;
    }

    // ─── bloom (burst) ───────────────────────────────────────────
    // Flowers scatter radially from viewport center — reuses the
    // firework dx/dy custom-prop trick on emoji text nodes.
    function castBloom(durationMs) {
      if (reduce()) return;
      var flowers = ['🌸', '🌺', '🌼', '🌻', '🌷', '🌸', '🌼', '🌺', '🌸', '🌻', '🌷', '🌼', '🌸', '🌺'];
      var count = 14;
      for (var i = 0; i < count; i++) {
        var b = document.createElement('span');
        b.className = 'spell-bloom-petal';
        var angle = (i / count) * 2 * Math.PI;
        var dist = 60 + Math.random() * 110;
        var dx = (Math.cos(angle) * dist).toFixed(1);
        var dy = (Math.sin(angle) * dist).toFixed(1);
        var rot = (-120 + Math.floor(Math.random() * 240));
        var dur = (durationMs || 2800) - Math.floor(Math.random() * 400);
        var size = 20 + Math.floor(Math.random() * 16);
        b.textContent = flowers[i % flowers.length];
        b.style.cssText =
          'left:50vw;top:45vh;font-size:' + size + 'px;' +
          '--spell-fw-dx:' + dx + 'px;--spell-fw-dy:' + dy + 'px;' +
          '--spell-bloom-rot:' + rot + 'deg;' +
          'animation:spell-bloom-fly ' + dur + 'ms ease-out forwards;';
        $layer.appendChild(b);
        active.bursts++;
        (function (el) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, dur + 100);
        })(b);
      }
    }

    // ─── aurora (ambient) ────────────────────────────────────────
    // Color bands (green / teal / purple) drift slowly across the top
    // of the viewport — pure CSS pseudo-element gradients, no canvas.
    function castAurora() {
      if (active.byId.aurora) return;
      var a = document.createElement('button');
      a.className = 'spell-aurora';
      a.type = 'button';
      a.setAttribute('aria-label', 'Aurora overlay. Click to dismiss.');
      a.title = 'click to dim the aurora';
      a.addEventListener('click', function () {
        if (a.parentNode) a.parentNode.removeChild(a);
        active.byId.aurora = null;
      });
      $layer.appendChild(a);
      active.byId.aurora = a;
    }

    // ─── here (ambient) ──────────────────────────────────────────
    // A pulsing location beacon centered on screen — two concentric
    // ripple rings radiate outward from a 📍 glyph. Click to dismiss.
    function castHere() {
      if (active.byId.here) return;
      var h = document.createElement('button');
      h.className = 'spell-here';
      h.type = 'button';
      h.setAttribute('aria-label', 'You are here. Click to dismiss.');
      h.title = 'click to dismiss';
      h.innerHTML =
        '<span class="spell-here__ring spell-here__ring--1" aria-hidden="true"></span>' +
        '<span class="spell-here__ring spell-here__ring--2" aria-hidden="true"></span>' +
        '<span class="spell-here__pin" aria-hidden="true">📍</span>';
      h.addEventListener('click', function () {
        if (h.parentNode) h.parentNode.removeChild(h);
        active.byId.here = null;
      });
      $layer.appendChild(h);
      active.byId.here = h;
    }

    // ─── mood (ambient) ──────────────────────────────────────────
    // A slowly hue-rotating color orb bottom-left. Cycles through the
    // full spectrum every ~20s — no words, just vibe. Click to dismiss.
    function castMood() {
      if (active.byId.mood) return;
      var m = document.createElement('button');
      m.className = 'spell-mood';
      m.type = 'button';
      m.setAttribute('aria-label', 'Mood orb. Click to dismiss.');
      m.title = 'click to dismiss';
      m.addEventListener('click', function () {
        if (m.parentNode) m.parentNode.removeChild(m);
        active.byId.mood = null;
      });
      $layer.appendChild(m);
      active.byId.mood = m;
    }

    // ─── bubble (burst) ──────────────────────────────────────────
    // 18 iridescent circles float upward from a random bottom band
    // and pop (scale + fade) at staggered heights. Each bubble gets
    // a random lateral drift — the overall feel is champagne-cork gentle.
    function castBubble(durationMs) {
      if (reduce()) return;
      var count = 18;
      var dur = durationMs || 3200;
      for (var i = 0; i < count; i++) {
        var b = document.createElement('span');
        b.className = 'spell-bubble';
        var size = 10 + Math.floor(Math.random() * 22);
        var startX = 5 + Math.random() * 90; // vw
        var drift = ((Math.random() - 0.5) * 80).toFixed(1);
        var rise = Math.floor(dur * (0.6 + Math.random() * 0.4));
        var delay = Math.floor(Math.random() * (dur * 0.3));
        b.style.cssText =
          'left:' + startX + 'vw;' +
          'bottom:8%;' +
          'width:' + size + 'px;' +
          'height:' + size + 'px;' +
          '--spell-bubble-drift:' + drift + 'px;' +
          'animation:spell-bubble-rise ' + rise + 'ms ease-in ' + delay + 'ms forwards;';
        $layer.appendChild(b);
        active.bursts++;
        (function (el, t, d) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, t + d + 100);
        })(b, rise, delay);
      }
    }

    // ─── dice (burst) ─────────────────────────────────────────────
    // 6 dice scatter radially from viewport center, each tumbling
    // (rotate) as they fly. Reuses the firework dx/dy custom-prop trick.
    function castDice(durationMs) {
      if (reduce()) return;
      var faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      var count = 6;
      var dur = durationMs || 2500;
      for (var i = 0; i < count; i++) {
        var d = document.createElement('span');
        d.className = 'spell-dice-face';
        var angle = (i / count) * 2 * Math.PI;
        var dist = 70 + Math.random() * 90;
        var dx = (Math.cos(angle) * dist).toFixed(1);
        var dy = (Math.sin(angle) * dist).toFixed(1);
        var rot = (-180 + Math.floor(Math.random() * 360));
        var faceDur = dur - Math.floor(Math.random() * 300);
        var size = 22 + Math.floor(Math.random() * 14);
        d.textContent = faces[i];
        d.style.cssText =
          'left:50vw;top:45vh;font-size:' + size + 'px;' +
          '--spell-fw-dx:' + dx + 'px;--spell-fw-dy:' + dy + 'px;' +
          '--spell-dice-rot:' + rot + 'deg;' +
          'animation:spell-dice-tumble ' + faceDur + 'ms ease-out forwards;';
        $layer.appendChild(d);
        active.bursts++;
        (function (el, t) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, t + 100);
        })(d, faceDur);
      }
    }

    // ─── bee (companion) ──────────────────────────────────────────
    // A bee crosses the screen at ~55vh height with an erratic zigzag
    // flutter — rapid vertical oscillation overlaid on the horizontal
    // walk. Faster than moth, more purposeful (it has somewhere to be).
    function castBee(durationMs) {
      if (active.byId.bee) {
        var prev = active.byId.bee;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var bee = document.createElement('button');
      bee.className = 'spell-bee';
      bee.type = 'button';
      bee.setAttribute('aria-label', 'A busy bee. Click to shoo it away.');
      bee.title = 'click to shoo the bee';
      bee.textContent = '🐝';
      var ltr = Math.random() < 0.5;
      bee.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = durationMs || 35000;
      var flySeconds = Math.max(8, Math.min(22, window.innerWidth / 75));
      bee.style.cssText =
        'animation:spell-bee-fly-' + (ltr ? 'ltr' : 'rtl') + ' ' + flySeconds + 's linear infinite,' +
        'spell-bee-zigzag 0.28s ease-in-out infinite;';
      bee.addEventListener('click', function () {
        if (bee.parentNode) bee.parentNode.removeChild(bee);
        active.byId.bee = null;
      });
      $layer.appendChild(bee);
      active.byId.bee = bee;
      setTimeout(function () {
        if (bee && bee.parentNode) bee.parentNode.removeChild(bee);
        if (active.byId.bee === bee) active.byId.bee = null;
      }, dur);
    }

    // ─── fog (ambient) ────────────────────────────────────────────
    // 8 translucent wisps drift laterally across the bottom quarter of
    // the viewport at different speeds and opacity. The combined effect
    // reads as low morning mist. Click anywhere on the overlay to lift.
    function castFog() {
      if (active.byId.fog) return;
      var fog = document.createElement('button');
      fog.className = 'spell-fog';
      fog.type = 'button';
      fog.setAttribute('aria-label', 'Fog overlay. Click to lift the mist.');
      fog.title = 'click to lift the fog';
      var html = '';
      var wispCount = 8;
      for (var i = 0; i < wispCount; i++) {
        var heightPct = (12 + Math.random() * 22).toFixed(1);
        var widthPct = (90 + Math.random() * 40).toFixed(1);
        var opacity = (0.12 + Math.random() * 0.2).toFixed(2);
        var driftDir = Math.random() < 0.5 ? 'ltr' : 'rtl';
        var driftDur = (18 + Math.random() * 20).toFixed(1);
        var delay = (Math.random() * 8).toFixed(2);
        html += '<span class="spell-fog__wisp" style="' +
          'height:' + heightPct + 'vh;' +
          'width:' + widthPct + '%;' +
          'opacity:' + opacity + ';' +
          'animation:spell-fog-drift-' + driftDir + ' ' + driftDur + 's ease-in-out ' + delay + 's infinite alternate;' +
          '"></span>';
      }
      fog.innerHTML = html;
      fog.addEventListener('click', function () {
        if (fog.parentNode) fog.parentNode.removeChild(fog);
        active.byId.fog = null;
      });
      $layer.appendChild(fog);
      active.byId.fog = fog;
    }

    // ─── balloon (burst) ─────────────────────────────────────────
    // 10 balloons float up from the bottom, each drifting laterally.
    // Uses translateY so the starting position (bottom:-60px) stays
    // correct without animating \\\`bottom\\\` directly.
    function castBalloon(durationMs) {
      if (reduce()) return;
      var count = 10;
      for (var i = 0; i < count; i++) {
        var b = document.createElement('span');
        b.className = 'spell-balloon';
        var startX = Math.random() * (window.innerWidth - 40) + 20;
        var drift = ((Math.random() - 0.5) * 180).toFixed(1);
        var size = 28 + Math.floor(Math.random() * 20);
        var dur = (durationMs || 4200) - Math.floor(Math.random() * 900);
        var delay = Math.floor(Math.random() * 500);
        b.style.cssText =
          'left:' + startX + 'px;' +
          'font-size:' + size + 'px;' +
          '--spell-balloon-drift:' + drift + 'px;' +
          'animation-duration:' + dur + 'ms;' +
          'animation-delay:' + delay + 'ms;';
        b.textContent = '🎈';
        $layer.appendChild(b);
        active.bursts++;
        (function (el) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, dur + delay + 100);
        })(b);
      }
    }

    // ─── turtle (companion) ──────────────────────────────────────
    // Slowest companion — ~30px/s. The charm is in the patience.
    // Gentle head-nod (small vertical) on a separate slow cycle.
    function castTurtle(durationMs) {
      if (active.byId.turtle) {
        var prevT = active.byId.turtle;
        if (prevT && prevT.parentNode) prevT.parentNode.removeChild(prevT);
      }
      var tur = document.createElement('button');
      tur.className = 'spell-turtle';
      tur.type = 'button';
      tur.setAttribute('aria-label', 'A slow turtle. Click to let it be.');
      tur.title = 'click to let the turtle be';
      tur.textContent = '🐢';
      var ltr = Math.random() < 0.5;
      tur.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = durationMs || 90000;
      var walkSeconds = Math.max(22, Math.min(60, window.innerWidth / 28));
      tur.style.cssText =
        'animation:spell-turtle-walk-' + (ltr ? 'ltr' : 'rtl') + ' ' + walkSeconds + 's linear infinite,' +
        'spell-turtle-nod' + (ltr ? '' : '-rtl') + ' 2.4s ease-in-out infinite;';
      tur.addEventListener('click', function () {
        if (tur.parentNode) tur.parentNode.removeChild(tur);
        active.byId.turtle = null;
      });
      $layer.appendChild(tur);
      active.byId.turtle = tur;
      setTimeout(function () {
        if (tur && tur.parentNode) tur.parentNode.removeChild(tur);
        if (active.byId.turtle === tur) active.byId.turtle = null;
      }, dur);
    }

    // ─── ghost (companion) ───────────────────────────────────────
    // Friendly 👻 drifts at mid-screen height (35–65vh from bottom)
    // with a slow sinusoidal float. Translucent, non-threatening.
    function castGhost(durationMs) {
      if (active.byId.ghost) {
        var prevG = active.byId.ghost;
        if (prevG && prevG.parentNode) prevG.parentNode.removeChild(prevG);
      }
      var g = document.createElement('button');
      g.className = 'spell-ghost';
      g.type = 'button';
      g.setAttribute('aria-label', 'A friendly ghost drifting by. Click to send it on.');
      g.title = 'click to send the ghost on';
      g.textContent = '👻';
      var ltr = Math.random() < 0.5;
      g.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = durationMs || 50000;
      var flySeconds = Math.max(12, Math.min(36, window.innerWidth / 58));
      var heightPct = (35 + Math.random() * 30).toFixed(1);
      g.style.cssText =
        'bottom:' + heightPct + 'vh;' +
        'animation:spell-ghost-fly-' + (ltr ? 'ltr' : 'rtl') + ' ' + flySeconds + 's linear infinite,' +
        'spell-ghost-float' + (ltr ? '' : '-rtl') + ' 3.2s ease-in-out infinite;';
      g.addEventListener('click', function () {
        if (g.parentNode) g.parentNode.removeChild(g);
        active.byId.ghost = null;
      });
      $layer.appendChild(g);
      active.byId.ghost = g;
      setTimeout(function () {
        if (g && g.parentNode) g.parentNode.removeChild(g);
        if (active.byId.ghost === g) active.byId.ghost = null;
      }, dur);
    }

    // ─── campfire (ambient) ──────────────────────────────────────
    // Two overlaid flame glyphs + a log + a radial glow ellipse.
    // Sits bottom-left (distinct from candle at bottom-right).
    // Recasting is a no-op while active.
    function castCampfire() {
      if (active.byId.campfire) return;
      var cf = document.createElement('button');
      cf.className = 'spell-campfire';
      cf.type = 'button';
      cf.setAttribute('aria-label', 'A campfire. Click to put it out.');
      cf.title = 'click to put out the fire';
      cf.innerHTML =
        '<span class="spell-campfire__glow" aria-hidden="true"></span>' +
        '<span class="spell-campfire__flame spell-campfire__flame--side" aria-hidden="true">🔥</span>' +
        '<span class="spell-campfire__flame spell-campfire__flame--main" aria-hidden="true">🔥</span>' +
        '<span class="spell-campfire__log" aria-hidden="true">🪵</span>';
      cf.addEventListener('click', function () {
        if (cf.parentNode) cf.parentNode.removeChild(cf);
        active.byId.campfire = null;
      });
      $layer.appendChild(cf);
      active.byId.campfire = cf;
    }

    // ─── spark (burst) ───────────────────────────────────────────
    // 24 thin bright streaks fan radially from a random viewport point —
    // like striking a flint. Each streak is a 2×12 rect rotated to align
    // with its travel direction, using the fw dx/dy custom-prop pattern.
    function castSpark(durationMs) {
      if (reduce()) return;
      var count = 24;
      var cx = (12 + Math.random() * 76).toFixed(1); // vw
      var cy = (15 + Math.random() * 55).toFixed(1); // vh
      for (var i = 0; i < count; i++) {
        var s = document.createElement('span');
        s.className = 'spell-spark';
        var angle = (i / count) * 2 * Math.PI;
        var dist = 35 + Math.random() * 90;
        var dx = (Math.cos(angle) * dist).toFixed(1);
        var dy = (Math.sin(angle) * dist).toFixed(1);
        var rotateDeg = Math.round(angle * 180 / Math.PI + 90);
        var dur = 500 + Math.floor(Math.random() * 600);
        s.style.cssText =
          'left:' + cx + 'vw;top:' + cy + 'vh;' +
          '--spell-fw-dx:' + dx + 'px;--spell-fw-dy:' + dy + 'px;' +
          '--spell-spark-rot:' + rotateDeg + 'deg;' +
          'animation:spell-spark-fly ' + dur + 'ms ease-out forwards;';
        $layer.appendChild(s);
        active.bursts++;
        (function (el) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, dur + 100);
        })(s);
      }
    }

    // ─── frog (companion) ─────────────────────────────────────────
    // Hops across the bottom in parabolic arcs — a separate hop keyframe
    // overlays on the horizontal walk, same composition as pup's bounce.
    // Avg ~60px/s, hops about every 0.9s. The charm is the airtime.
    function castFrog(durationMs) {
      if (active.byId.frog) {
        var prevFr = active.byId.frog;
        if (prevFr && prevFr.parentNode) prevFr.parentNode.removeChild(prevFr);
      }
      var frog = document.createElement('button');
      frog.className = 'spell-frog';
      frog.type = 'button';
      frog.setAttribute('aria-label', 'A hopping frog. Click to let it leap away.');
      frog.title = 'click to let the frog hop away';
      frog.textContent = '🐸';
      var ltr = Math.random() < 0.5;
      frog.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = durationMs || 35000;
      var walkSeconds = Math.max(10, Math.min(30, window.innerWidth / 60));
      frog.style.cssText =
        'animation:spell-frog-walk-' + (ltr ? 'ltr' : 'rtl') + ' ' + walkSeconds + 's linear infinite,' +
        'spell-frog-hop 0.9s cubic-bezier(.4,0,.6,1) infinite;';
      frog.addEventListener('click', function () {
        if (frog.parentNode) frog.parentNode.removeChild(frog);
        active.byId.frog = null;
      });
      $layer.appendChild(frog);
      active.byId.frog = frog;
      setTimeout(function () {
        if (frog && frog.parentNode) frog.parentNode.removeChild(frog);
        if (active.byId.frog === frog) active.byId.frog = null;
      }, dur);
    }

    // ─── leaves (ambient) ─────────────────────────────────────────
    // 25 leaf emoji spin and drift down the viewport. Like snow but the
    // fall keyframe also rotates each leaf — spin baked in proportionally
    // to fall distance. Negative delay puts leaves mid-fall on cast.
    function castLeaves() {
      if (active.byId.leaves) return;
      var lv = document.createElement('button');
      lv.className = 'spell-leaves';
      lv.type = 'button';
      lv.setAttribute('aria-label', 'Falling leaves overlay. Click to dismiss.');
      lv.title = 'click to clear the leaves';
      var glyphs = ['🍂', '🍁', '🍂', '🍁', '🌿', '🍂', '🍁'];
      var html = '';
      for (var i = 0; i < 25; i++) {
        var leftPct = (Math.random() * 106 - 3).toFixed(1);
        var delay = (Math.random() * 11).toFixed(2);
        var dur = (7 + Math.random() * 8).toFixed(2);
        var size = 13 + Math.floor(Math.random() * 13);
        var drift = ((Math.random() - 0.5) * 200).toFixed(1);
        var spin = Math.random() < 0.5 ? 360 : -360;
        var glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
        html += '<span class="spell-leaves__leaf" style="' +
          'left:' + leftPct + '%;' +
          'font-size:' + size + 'px;' +
          'animation-delay:-' + delay + 's;' +
          'animation-duration:' + dur + 's;' +
          '--spell-leaves-drift:' + drift + 'px;' +
          '--spell-leaves-spin:' + spin + 'deg;' +
          '">' + glyph + '</span>';
      }
      lv.innerHTML = html;
      lv.addEventListener('click', function () {
        if (lv.parentNode) lv.parentNode.removeChild(lv);
        active.byId.leaves = null;
      });
      $layer.appendChild(lv);
      active.byId.leaves = lv;
    }

    // ─── lantern (ambient) ────────────────────────────────────────
    // A paper lantern in the top-left corner — fills the last open corner
    // (candle=BR, chimes=TR, campfire=BL). Swings on its hang-point via
    // transform-origin at the top-center. Warm glow via drop-shadow.
    function castLantern() {
      if (active.byId.lantern) return;
      var l = document.createElement('button');
      l.className = 'spell-lantern';
      l.type = 'button';
      l.setAttribute('aria-label', 'A paper lantern. Click to extinguish.');
      l.title = 'click to extinguish';
      l.textContent = '🏮';
      l.addEventListener('click', function () {
        if (l.parentNode) l.parentNode.removeChild(l);
        active.byId.lantern = null;
      });
      $layer.appendChild(l);
      active.byId.lantern = l;
    }

    // ─── dispatch ───────────────────────────────────────────────
    function castSpell(id) {
      switch (id) {
        case 'confetti':  castConfetti(4500); break;
        case 'cat':       castCat(60000); break;
        case 'pup':       castPup(50000); break;
        case 'penguin':   castPenguin(70000); break;
        case 'breath':    castBreath(); break;
        case 'candle':    castCandle(); break;
        case 'rain':      castRain(); break;
        case 'starfield': castStarfield(); break;
        case 'firework':  castFirework(3500); break;
        case 'fish':      castFish(45000); break;
        case 'moth':      castMoth(55000); break;
        case 'snow':      castSnow(); break;
        case 'shout':     castShout(2200); break;
        case 'wave':      castWave(3000); break;
        case 'firefly':   castFirefly(40000); break;
        case 'chimes':    castChimes(); break;
        case 'bloom':     castBloom(2800); break;
        case 'aurora':    castAurora(); break;
        case 'here':      castHere(); break;
        case 'mood':      castMood(); break;
        case 'bubble':    castBubble(3200); break;
        case 'dice':      castDice(2500); break;
        case 'bee':       castBee(35000); break;
        case 'fog':       castFog(); break;
        case 'balloon':   castBalloon(4200); break;
        case 'turtle':    castTurtle(90000); break;
        case 'ghost':     castGhost(50000); break;
        case 'campfire':  castCampfire(); break;
        case 'spark':     castSpark(2000); break;
        case 'frog':      castFrog(35000); break;
        case 'leaves':    castLeaves(); break;
        case 'lantern':   castLantern(); break;
        default:
          // Unknown spell — silent no-op; could surface a toast in the
          // bar but spells are meant to be playful, so we just ignore.
          try { console.info('[spell] unknown:', id); } catch (e) {}
      }
    }

    function clearAll() {
      // Kill all ambients/companions — bursts time out on their own.
      Object.keys(active.byId).forEach(function (k) {
        var el = active.byId[k];
        if (el && el.parentNode) el.parentNode.removeChild(el);
        active.byId[k] = null;
      });
      if (active.byId.breathTimer) { clearTimeout(active.byId.breathTimer); active.byId.breathTimer = 0; }
    }

    window.addEventListener('pc:spell:cast', function (e) {
      var id = e && e.detail && e.detail.id;
      if (id) castSpell(id);
    });
    window.addEventListener('pc:spell:clear', clearAll);
  })();
<\/script>`])), maybeRenderHead());
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/SpellLayer.astro", void 0);

var __freeze$1 = Object.freeze;
var __defProp$1 = Object.defineProperty;
var __template$1 = (cooked, raw) => __freeze$1(__defProp$1(cooked, "raw", { value: __freeze$1(cooked.slice()) }));
var _a$1;
const $$CursorRoom = createComponent(($$result, $$props, $$slots) => {
  function dailyNounId() {
    const day = Math.floor(Date.now() / (24 * 3600 * 1e3));
    const seed = (day + 13) * 2654435761 >>> 0;
    return seed % 1200;
  }
  const seedNounId = dailyNounId();
  return renderTemplate(_a$1 || (_a$1 = __template$1(["", '<div class="cursor-room" id="cursor-room" aria-hidden="true" data-on="false"', ' data-astro-cid-25jawpxa> <!-- Your Noun cursor --> <div class="cr-cursor" id="cr-cursor" style="display:none;" data-astro-cid-25jawpxa> <img class="cr-cursor__noun" id="cr-cursor-noun"', ` alt="" width="32" height="32" data-astro-cid-25jawpxa> <div class="cr-cursor__bubble" id="cr-cursor-bubble" hidden data-astro-cid-25jawpxa></div> <div class="cr-cursor__tag mono" id="cr-cursor-tag" data-astro-cid-25jawpxa>visitor</div> </div> <!-- Peer cursors layer — populated dynamically when multiplayer active. --> <div class="cr-peers" id="cr-peers" aria-hidden="true" data-astro-cid-25jawpxa></div> <!-- Chat log ticker (above the footer bar) --> <div class="cr-log" id="cr-log" hidden data-astro-cid-25jawpxa> <p class="cr-log__head mono" data-astro-cid-25jawpxa> <span class="cr-log__dot" aria-hidden="true" data-astro-cid-25jawpxa></span> <span id="cr-log-head-label" data-astro-cid-25jawpxa>ROOM · RECENT</span> </p> <ol class="cr-log__list" id="cr-log-list" data-astro-cid-25jawpxa></ol> </div> </div> <script>
  (function () {
    'use strict';

    var ROOT = document.getElementById('cursor-room');
    if (!ROOT) return;

    var CHAT_STORAGE = 'pc:room:chat-log';
    var ON_STORAGE = 'pc:room:on';
    var SID_STORAGE = 'pc:room:sid';
    var MAX_LOG = 20;
    var BUBBLE_TTL_MS = 8_000;
    var CURSOR_SEND_MIN_MS = 66; // ≤15 Hz outbound
    var PEER_STALE_MS = 20_000;
    var PEER_LERP = 0.22; // smoother than the self-cursor's 0.35

    var $cursor  = document.getElementById('cr-cursor');
    var $noun    = document.getElementById('cr-cursor-noun');
    var $bubble  = document.getElementById('cr-cursor-bubble');
    var $tag     = document.getElementById('cr-cursor-tag');
    var $peers   = document.getElementById('cr-peers');
    var $log     = document.getElementById('cr-log');
    var $logList = document.getElementById('cr-log-list');
    var $logHead = document.getElementById('cr-log-head-label');

    var state = {
      on: false,
      targetX: 0,
      targetY: 0,
      renderX: 0,
      renderY: 0,
      hasMouse: false,
      sid: null,
      ws: null,
      wsState: 'idle',           // idle | connecting | open | closed
      wsBackoffMs: 800,
      lastCursorSentAt: 0,
      pingTimer: null,
      peerCount: 0,
      seenChatKeys: {}           // sid|at|msg → 1
    };
    var bubbleTimeout = null;
    /** @type {Record<string, {el:HTMLElement, img:HTMLImageElement, bub:HTMLElement, tag:HTMLElement, tx:number, ty:number, rx:number, ry:number, nounId:number, tagText:string, lastAt:number, msg:string, msgAt:number}>} */
    var peers = {};

    // ─── persistence ────────────────────────────────────────────
    function loadLog() {
      try {
        var raw = sessionStorage.getItem(CHAT_STORAGE);
        if (!raw) return [];
        var p = JSON.parse(raw);
        return Array.isArray(p) ? p.slice(-MAX_LOG) : [];
      } catch (e) { return []; }
    }
    function saveLog(log) {
      try { sessionStorage.setItem(CHAT_STORAGE, JSON.stringify(log.slice(-MAX_LOG))); } catch (e) {}
    }
    // Sprint 29 (Mike 2026-04-24: "yah have the cursor on by default"):
    // Room defaults to ON for first-time visitors. The stored value
    // is three-state now:
    //   '1'        → user explicitly turned it on
    //   '0'        → user explicitly turned it off
    //   null / ''  → no prior preference, default ON
    // The "turn off" button still works and writes '0' which persists
    // across reloads so someone who doesn't want the cursor room can
    // opt out and stay out.
    function loadOn() {
      try {
        var v = localStorage.getItem(ON_STORAGE);
        if (v === '0') return false;          // user opted out
        if (v === '1') return true;           // user opted in
        return true;                          // default: ON
      } catch (e) { return true; }
    }
    function saveOn(on) {
      try { localStorage.setItem(ON_STORAGE, on ? '1' : '0'); } catch (e) {}
    }
    function getSid() {
      try {
        var s = localStorage.getItem(SID_STORAGE);
        if (s) return s;
        s = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
          : 's-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(SID_STORAGE, s);
        return s;
      } catch (e) {
        return 's-' + Date.now().toString(36);
      }
    }

    // ─── wallet / noun resolution ───────────────────────────────
    function resolveMeTag() {
      try {
        var activeAddr = localStorage.getItem('pc:wallet-active');
        if (activeAddr) return activeAddr.slice(0, 6) + '…' + activeAddr.slice(-4);
      } catch (e) {}
      return 'visitor';
    }

    function mySeedNoun() {
      return parseInt(ROOT.getAttribute('data-seed-noun') || '0', 10) || 0;
    }

    function refreshMe() {
      if ($tag) $tag.textContent = resolveMeTag();
      if ($noun) $noun.src = 'https://noun.pics/' + mySeedNoun() + '.svg';
    }

    // ─── log render ─────────────────────────────────────────────
    function renderLog() {
      if (!$logList) return;
      var log = loadLog();
      $logList.innerHTML = '';
      if (log.length === 0) {
        $log.hidden = !state.on; // show empty-state header when room is on
        if ($logHead) $logHead.textContent = state.on ? (state.peerCount ? ('ROOM · ' + state.peerCount + ' HERE') : 'ROOM · ALONE') : 'ROOM · RECENT';
        return;
      }
      $log.hidden = false;
      if ($logHead) $logHead.textContent = state.on ? (state.peerCount ? ('ROOM · ' + state.peerCount + ' HERE') : 'ROOM · RECENT') : 'ROOM · RECENT';
      // Show the last 5 lines in the ticker.
      log.slice(-5).forEach(function (entry) {
        var li = document.createElement('li');
        li.className = 'cr-log__line';
        var who = document.createElement('span');
        who.className = 'cr-log__who mono';
        who.textContent = entry.who || 'visitor';
        var msg = document.createElement('span');
        msg.className = 'cr-log__msg';
        msg.textContent = entry.msg;
        li.appendChild(who);
        li.appendChild(msg);
        $logList.appendChild(li);
      });
      window.dispatchEvent(new CustomEvent('pc:room:log-update', { detail: { log: log } }));
    }

    function pushLocalLogEntry(entry) {
      var log = loadLog();
      var key = (entry.sid || '') + '|' + (entry.at || 0) + '|' + entry.msg;
      if (state.seenChatKeys[key]) return false;
      state.seenChatKeys[key] = 1;
      log.push(entry);
      saveLog(log);
      return true;
    }

    // ─── cursor motion ──────────────────────────────────────────
    function onMouseMove(e) {
      state.targetX = e.clientX;
      state.targetY = e.clientY;
      state.hasMouse = true;
      maybeSendCursor();
    }

    function maybeSendCursor() {
      if (state.wsState !== 'open') return;
      var now = Date.now();
      if (now - state.lastCursorSentAt < CURSOR_SEND_MIN_MS) return;
      var vw = window.innerWidth || 1;
      var vh = window.innerHeight || 1;
      var nx = Math.max(0, Math.min(10000, Math.round(state.targetX / vw * 10000)));
      var ny = Math.max(0, Math.min(10000, Math.round(state.targetY / vh * 10000)));
      try {
        state.ws.send(JSON.stringify({ type: 'cursor', x: nx, y: ny }));
        state.lastCursorSentAt = now;
      } catch (e) {}
    }

    function animate() {
      // Smooth trailing cursor — lerp at ~0.35 toward target.
      if (state.hasMouse && state.on) {
        state.renderX += (state.targetX - state.renderX) * 0.35;
        state.renderY += (state.targetY - state.renderY) * 0.35;
        $cursor.style.transform = 'translate3d(' + (state.renderX - 16) + 'px, ' + (state.renderY - 16) + 'px, 0)';
      }
      // Interpolate peer positions toward broadcast target.
      var vw = window.innerWidth || 1;
      var vh = window.innerHeight || 1;
      var now = Date.now();
      for (var k in peers) {
        if (!peers.hasOwnProperty(k)) continue;
        var p = peers[k];
        // Expire stale peers (no cursor update in N ms).
        if (now - p.lastAt > PEER_STALE_MS) {
          if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
          delete peers[k];
          continue;
        }
        var pxTarget = (p.tx / 10000) * vw;
        var pyTarget = (p.ty / 10000) * vh;
        p.rx += (pxTarget - p.rx) * PEER_LERP;
        p.ry += (pyTarget - p.ry) * PEER_LERP;
        p.el.style.transform = 'translate3d(' + (p.rx - 14) + 'px, ' + (p.ry - 14) + 'px, 0)';
        // Fade bubble after 6s then hide after 8s.
        if (p.msgAt && now - p.msgAt > 8_000) {
          p.bub.hidden = true;
          p.msg = '';
          p.msgAt = 0;
        } else if (p.msgAt && now - p.msgAt > 6_000) {
          p.bub.classList.add('cr-peer__bubble--leaving');
        }
      }
      requestAnimationFrame(animate);
    }

    // ─── peer render ────────────────────────────────────────────
    function ensurePeer(sid, nounId, tagText) {
      var p = peers[sid];
      if (p) {
        if (nounId !== p.nounId) {
          p.nounId = nounId;
          p.img.src = 'https://noun.pics/' + nounId + '.svg';
        }
        if (tagText !== p.tagText) {
          p.tagText = tagText;
          p.tag.textContent = tagText;
        }
        return p;
      }
      var el = document.createElement('div');
      el.className = 'cr-peer';
      var img = document.createElement('img');
      img.className = 'cr-peer__noun';
      img.alt = '';
      img.width = 28;
      img.height = 28;
      img.src = 'https://noun.pics/' + nounId + '.svg';
      var tag = document.createElement('div');
      tag.className = 'cr-peer__tag mono';
      tag.textContent = tagText;
      var bub = document.createElement('div');
      bub.className = 'cr-peer__bubble';
      bub.hidden = true;
      el.appendChild(img);
      el.appendChild(tag);
      el.appendChild(bub);
      if ($peers) $peers.appendChild(el);
      p = peers[sid] = {
        el: el, img: img, bub: bub, tag: tag,
        tx: 0, ty: 0, rx: 0, ry: 0,
        nounId: nounId, tagText: tagText,
        lastAt: Date.now(),
        msg: '', msgAt: 0
      };
      return p;
    }

    function showPeerBubble(sid, msg) {
      var p = peers[sid];
      if (!p) return;
      p.bub.textContent = msg;
      p.bub.hidden = false;
      p.bub.classList.remove('cr-peer__bubble--leaving');
      p.msg = msg;
      p.msgAt = Date.now();
    }

    // ─── chat bubble (self) ─────────────────────────────────────
    function showBubble(msg) {
      if (!$bubble) return;
      $bubble.textContent = msg;
      $bubble.hidden = false;
      $bubble.classList.remove('cr-cursor__bubble--leaving');
      if (bubbleTimeout) clearTimeout(bubbleTimeout);
      bubbleTimeout = setTimeout(function () {
        $bubble.classList.add('cr-cursor__bubble--leaving');
        setTimeout(function () {
          $bubble.hidden = true;
          $bubble.classList.remove('cr-cursor__bubble--leaving');
        }, 500);
      }, BUBBLE_TTL_MS);
    }

    // ─── ws lifecycle ───────────────────────────────────────────
    function openSocket() {
      if (state.ws || state.wsState === 'connecting' || state.wsState === 'open') return;
      var proto = location.protocol === 'https:' ? 'wss' : 'ws';
      var sid = state.sid || getSid();
      state.sid = sid;
      var url = proto + '://' + location.host + '/api/room?url=' + encodeURIComponent(location.pathname) +
                '&sid=' + encodeURIComponent(sid) + '&kind=human';
      state.wsState = 'connecting';
      var ws;
      try { ws = new WebSocket(url); }
      catch (e) { state.wsState = 'closed'; scheduleReconnect(); return; }
      state.ws = ws;

      ws.addEventListener('open', function () {
        state.wsState = 'open';
        state.wsBackoffMs = 800;
        // Handshake: identify self with nounId + tag. Server will merge
        // with any existing visitor row on this sessionId.
        try {
          ws.send(JSON.stringify({
            type: 'identify',
            nounId: mySeedNoun(),
            tag: resolveMeTag()
          }));
        } catch (e) {}
        // Keepalive ping every 30s — well below the 90s idle cutoff.
        if (state.pingTimer) clearInterval(state.pingTimer);
        state.pingTimer = setInterval(function () {
          if (state.wsState !== 'open') return;
          try { ws.send(JSON.stringify({ type: 'ping' })); } catch (e) {}
        }, 30_000);
      });

      ws.addEventListener('message', function (ev) {
        if (typeof ev.data !== 'string') return;
        var payload;
        try { payload = JSON.parse(ev.data); } catch (e) { return; }
        applyServerPayload(payload);
      });

      ws.addEventListener('close', function () {
        state.wsState = 'closed';
        state.ws = null;
        if (state.pingTimer) { clearInterval(state.pingTimer); state.pingTimer = null; }
        if (state.on) scheduleReconnect();
      });
      ws.addEventListener('error', function () {
        try { ws.close(); } catch (e) {}
      });
    }

    function closeSocket() {
      if (state.pingTimer) { clearInterval(state.pingTimer); state.pingTimer = null; }
      if (state.ws) {
        try { state.ws.close(1000, 'room off'); } catch (e) {}
      }
      state.ws = null;
      state.wsState = 'closed';
      // Sweep peer DOM.
      for (var k in peers) {
        if (!peers.hasOwnProperty(k)) continue;
        var p = peers[k];
        if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
      }
      peers = {};
      state.peerCount = 0;
    }

    function scheduleReconnect() {
      if (!state.on) return;
      var delay = state.wsBackoffMs;
      state.wsBackoffMs = Math.min(10_000, Math.round(state.wsBackoffMs * 1.8));
      setTimeout(function () { if (state.on) openSocket(); }, delay);
    }

    function applyServerPayload(payload) {
      if (!payload || typeof payload !== 'object') return;
      // Apply peer positions.
      var seen = {};
      if (Array.isArray(payload.peers)) {
        for (var i = 0; i < payload.peers.length; i++) {
          var pv = payload.peers[i];
          if (!pv || typeof pv.sessionId !== 'string') continue;
          var p = ensurePeer(pv.sessionId, pv.nounId | 0, String(pv.tag || 'visitor'));
          p.tx = pv.x | 0;
          p.ty = pv.y | 0;
          p.lastAt = pv.at || Date.now();
          // First time seeing a peer — snap to its current position so it
          // doesn't lerp in from (0,0) which looks busted.
          if (p.rx === 0 && p.ry === 0) {
            var vw = window.innerWidth || 1;
            var vh = window.innerHeight || 1;
            p.rx = (p.tx / 10000) * vw;
            p.ry = (p.ty / 10000) * vh;
          }
          seen[pv.sessionId] = 1;
        }
      }
      // Prune peers that vanished from this broadcast and have no recent cursor.
      var now = Date.now();
      for (var k in peers) {
        if (!peers.hasOwnProperty(k)) continue;
        if (seen[k]) continue;
        if (now - peers[k].lastAt > PEER_STALE_MS) {
          var q = peers[k];
          if (q.el && q.el.parentNode) q.el.parentNode.removeChild(q.el);
          delete peers[k];
        }
      }
      state.peerCount = 0;
      for (var kk in peers) if (peers.hasOwnProperty(kk)) state.peerCount++;

      // Apply chat log.
      if (Array.isArray(payload.chat)) {
        var changed = false;
        for (var j = 0; j < payload.chat.length; j++) {
          var c = payload.chat[j];
          if (!c || typeof c.msg !== 'string') continue;
          if (pushLocalLogEntry(c)) {
            changed = true;
            // Attach the last message to a peer bubble so you can see
            // who just said it hovering above their cursor.
            var peerSid = c.sid;
            if (peerSid && peers[peerSid]) showPeerBubble(peerSid, c.msg);
          }
        }
        if (changed) renderLog();
        else renderLog(); // still refresh header count
      } else {
        renderLog();
      }
    }

    // ─── toggle on/off ──────────────────────────────────────────
    function setRoomOn(on) {
      state.on = on;
      ROOT.setAttribute('data-on', on ? 'true' : 'false');
      if (on) {
        $cursor.style.display = 'block';
        document.documentElement.classList.add('cr-cursor-active');
        refreshMe();
        if (!state.sid) state.sid = getSid();
        openSocket();
        renderLog();
      } else {
        $cursor.style.display = 'none';
        document.documentElement.classList.remove('cr-cursor-active');
        $log.hidden = true;
        closeSocket();
      }
      saveOn(on);
    }

    // ─── chat submit ────────────────────────────────────────────
    function submitChat(msg) {
      msg = String(msg || '').trim().slice(0, 120);
      if (!msg) return;
      // Always show locally so the sender sees their bubble even if WS is down.
      showBubble(msg);
      var entry = {
        who: resolveMeTag(),
        nounId: mySeedNoun(),
        msg: msg,
        at: Date.now(),
        sid: (state.sid || '').slice(0, 8)
      };
      // Mark seen so the server echo doesn't dupe.
      var key = entry.sid + '|' + entry.at + '|' + entry.msg;
      state.seenChatKeys[key] = 1;
      pushLocalLogEntry(entry);
      renderLog();
      // Forward to server when connected. If offline, message stays local.
      if (state.wsState === 'open' && state.ws) {
        try { state.ws.send(JSON.stringify({ type: 'chat', msg: msg })); } catch (e) {}
      }
    }

    // ─── event bus ──────────────────────────────────────────────
    window.addEventListener('pc:room:toggle', function (e) {
      var on = !!(e && e.detail && e.detail.on);
      setRoomOn(on);
    });
    window.addEventListener('pc:room:chat', function (e) {
      var msg = e && e.detail && e.detail.msg;
      if (msg) submitChat(msg);
    });
    window.addEventListener('pc:wallet-change', refreshMe);

    document.addEventListener('mousemove', function (e) {
      if (state.on) onMouseMove(e);
    }, { passive: true });

    // Close socket on navigation — each page load re-opens with the new URL.
    window.addEventListener('beforeunload', closeSocket);
    document.addEventListener('astro:before-swap', closeSocket);
    document.addEventListener('astro:page-load', function () {
      if (loadOn()) {
        // Re-open for the new URL.
        state.on = true;
        openSocket();
      }
    });

    // Boot: if previously on, turn on again.
    if (loadOn()) setRoomOn(true);
    animate();
  })();
<\/script>`])), maybeRenderHead(), addAttribute(seedNounId, "data-seed-noun"), addAttribute(`https://noun.pics/${seedNounId}.svg`, "src"));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/CursorRoom.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a, _b;
const $$BlockLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$BlockLayout;
  const {
    title,
    description = SITE_DESCRIPTION,
    image = "/images/og/og-home-v2.png",
    jsonLd,
    alternates = [],
    frame
  } = Astro2.props;
  const siteBase = Astro2.site || new URL("https://pointcast.xyz");
  const canonicalURL = new URL(Astro2.url.pathname, siteBase);
  const ogImage = image.startsWith("http") ? image : new URL(image, siteBase).href;
  const siteTitle = title === "Home" || title === "" ? "PointCast" : `${title} — PointCast`;
  const identityJsonLd = buildIdentityJsonLd();
  return renderTemplate(_b || (_b = __template(['<html lang="en"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="generator"', '><meta name="description"', '><meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"><meta name="author" content="Mike Hoydich"><meta name="creator" content="Mike Hoydich"><meta name="publisher" content="PointCast"><meta name="keywords"', '><meta name="application-name" content="PointCast"><meta name="geo.region" content="US-CA"><meta name="geo.placename" content="El Segundo, California"><meta name="geo.position" content="33.9192;-118.4165"><meta name="ICBM" content="33.9192, -118.4165"><meta name="theme-color" content="#ffffff"><meta name="pc-version" content="v2.1"><meta name="pc-agents-manifest" content="https://pointcast.xyz/agents.json"><meta name="pc-llms" content="https://pointcast.xyz/llms.txt"><meta name="llm:manifest" content="https://pointcast.xyz/agents.json"><meta name="llm:summary" content="https://pointcast.xyz/llms.txt"><meta name="llm:context" content="https://pointcast.xyz/llms-full.txt"><link rel="canonical"', '><link rel="alternate" hreflang="en-US"', '><link rel="alternate" hreflang="x-default"', ">", `<!-- Open Graph + Twitter — keep parity with v1 so unfurls don't regress --><meta property="og:title"`, '><meta property="og:description"', '><meta property="og:image"', '><meta property="og:image:secure_url"', '><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:type" content="website"><meta property="og:site_name" content="PointCast"><meta property="og:url"', '><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"', '><meta name="twitter:description"', '><meta name="twitter:image"', '><meta name="twitter:site" content="@mhoydich">', "", '<script type="application/ld+json">', "<\/script>", "<title>", `</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="manifest" href="/manifest.webmanifest"><!-- Mood persistence — read pc:mood before paint so the page
         renders tinted from the first frame. Per Mike 2026-04-20 13:55
         PT: "rolling thru the site in that mood." --><script>
      (function () {
        try {
          var m = localStorage.getItem('pc:mood');
          if (m) document.documentElement.setAttribute('data-pc-mood', m);
        } catch (e) {}
      })();
    <\/script>`, '</head> <body> <a href="#main-content" class="skip-link">Skip to content</a> <main id="main-content" role="main"> ', " </main> ", " ", " ", " ", " ", "</body></html>"])), addAttribute(Astro2.generator, "content"), addAttribute(description, "content"), addAttribute(SITE_KEYWORDS.join(", "), "content"), addAttribute(canonicalURL, "href"), addAttribute(canonicalURL, "href"), addAttribute(canonicalURL, "href"), DISCOVERY_LINKS.map((link) => renderTemplate`<link${addAttribute(link.rel, "rel")}${addAttribute(link.type, "type")}${addAttribute(link.href, "href")}${addAttribute(link.title, "title")}>`), addAttribute(siteTitle, "content"), addAttribute(description, "content"), addAttribute(ogImage, "content"), addAttribute(ogImage, "content"), addAttribute(canonicalURL, "content"), addAttribute(siteTitle, "content"), addAttribute(description, "content"), addAttribute(ogImage, "content"), alternates.map((alt) => renderTemplate`<link rel="alternate"${addAttribute(alt.type, "type")}${addAttribute(alt.href, "href")}${addAttribute(alt.title, "title")}>`), frame && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate`<meta property="fc:frame" content="vNext"><meta property="fc:frame:image"${addAttribute(frame.image ?? ogImage, "content")}><meta property="fc:frame:image:aspect_ratio"${addAttribute(frame.aspectRatio ?? "1.91:1", "content")}><meta property="of:accepts:xmtp" content="2024-02-09">${(frame.buttons ?? []).slice(0, 4).map((btn, i) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate`<meta${addAttribute(`fc:frame:button:${i + 1}`, "property")}${addAttribute(btn.label, "content")}>${btn.action && renderTemplate`<meta${addAttribute(`fc:frame:button:${i + 1}:action`, "property")}${addAttribute(btn.action, "content")}>`}${btn.target && renderTemplate`<meta${addAttribute(`fc:frame:button:${i + 1}:target`, "property")}${addAttribute(btn.target, "content")}>`}` })}`)}` })}`, unescapeHTML(JSON.stringify(identityJsonLd)), jsonLd && renderTemplate(_a || (_a = __template(['<script type="application/ld+json">', "<\/script>"])), unescapeHTML(JSON.stringify(jsonLd))), siteTitle, renderHead(), renderSlot($$result, $$slots["default"]), renderComponent($$result, "FooterBar", $$FooterBar, {}), renderComponent($$result, "SpellLayer", $$SpellLayer, {}), renderComponent($$result, "CursorRoom", $$CursorRoom, {}), renderComponent($$result, "FreshnessChip", $$FreshnessChip, {}), renderComponent($$result, "FirstSee", $$FirstSee, {}));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/layouts/BlockLayout.astro", void 0);

export { $$BlockLayout as $, SPELLS as S };
