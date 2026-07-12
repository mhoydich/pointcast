import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$DrumLayout } from './DrumLayout_Dfyv0wmF.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';
import { $ as $$MintButton } from './MintButton_BMx003SY.mjs';
import contracts from './contracts_B1zhgPPX.mjs';

const $$DrumTrophies = createComponent(async ($$result, $$props, $$slots) => {
  const VISIT_NOUNS = (contracts.visit_nouns?.mainnet).trim();
  const TROPHIES = [
    {
      id: "first-tap",
      title: "First Tap",
      nounId: 666,
      eyebrow: "novice",
      desc: "Tap a drum on any /drum* page",
      surface: "/drum",
      threshold: 1,
      progressKey: "pc:drumLocalCount",
      progressType: "count"
    },
    {
      id: "true-drummer",
      title: "True Drummer",
      nounId: 700,
      eyebrow: "100 drums",
      desc: "Tap 100+ drums total across all surfaces",
      surface: "/drum-v2",
      threshold: 100,
      progressKey: "pc:drumLocalCount",
      progressType: "count"
    },
    {
      id: "master-drummer",
      title: "Master Drummer",
      nounId: 777,
      eyebrow: "1,000 drums",
      desc: "Tap 1,000+ drums total across all surfaces",
      surface: "/drum-v2",
      threshold: 1e3,
      progressKey: "pc:drumLocalCount",
      progressType: "count"
    },
    {
      id: "orchestra-master",
      title: "Orchestra Master",
      nounId: 808,
      eyebrow: "all 12 instruments",
      desc: "Tap every instrument on /drum-v4",
      surface: "/drum-v4",
      threshold: 12,
      progressKey: "pc:drum-v4:collected",
      progressType: "set"
    },
    {
      id: "choir-master",
      title: "Choir Master",
      nounId: 888,
      eyebrow: "all 12 voices",
      desc: "Sing every voice on /drum-v6",
      surface: "/drum-v6",
      threshold: 12,
      progressKey: "pc:drum-v6:sung",
      progressType: "set"
    },
    {
      id: "loop-creator",
      title: "Loop Creator",
      nounId: 909,
      eyebrow: "shared a loop",
      desc: "Build and share a loop URL on /drum-v5",
      surface: "/drum-v5",
      threshold: 1,
      progressKey: "pc:drum-v5:shared-count",
      progressType: "count"
    },
    {
      id: "spotify-jam",
      title: "Spotify Jam",
      nounId: 420,
      eyebrow: "set the room track",
      desc: "Set a track for the room on /drum-v3",
      surface: "/drum-v3",
      threshold: 1,
      progressKey: "pc:drum-v3:track-count",
      progressType: "count"
    },
    {
      id: "big-orchestra",
      title: "Big Orchestra",
      nounId: 808,
      eyebrow: "all 30 cells",
      desc: "Tap every cell on /drum-v7 (the 30-noun board)",
      surface: "/drum-v7",
      threshold: 30,
      progressKey: "pc:drum-v7:played",
      progressType: "set"
    },
    {
      id: "symphony-master",
      title: "Symphony Master",
      nounId: 88,
      eyebrow: "all 42 seats",
      desc: "Play every seat in /drum-v8 — strings, winds, brass, percussion, mallets, voice",
      surface: "/drum-v8",
      threshold: 42,
      progressKey: "pc:drum-v8:played",
      progressType: "set"
    },
    // ── Sprint 8 expansion (drum sprint 8/9, 2026-04-27) ─────────────
    // New trophies tied to the 2026-04-27 surfaces shipped during the
    // three-hour drum sprint (Theremin, Hot Potato, Pulse, Hall of Agents,
    // Bells, Daily, Visualizer).
    {
      id: "theremin-hand",
      title: "Theremin Hand",
      nounId: 121,
      eyebrow: "v10 · gesture",
      desc: "Play 50+ notes on the Theremin (Spacebar counts)",
      surface: "/drum-v10",
      threshold: 50,
      progressKey: "pc:drum-v10:notes",
      progressType: "count"
    },
    {
      id: "potato-champion",
      title: "Potato Champion",
      nounId: 234,
      eyebrow: "hot potato",
      desc: "Win 3 rounds of Hot Potato (luck of the toss)",
      surface: "/drum-potato",
      threshold: 3,
      progressKey: "pc:drum-potato:wins",
      progressType: "count"
    },
    {
      id: "pulse-witness",
      title: "Pulse Witness",
      nounId: 333,
      eyebrow: "milestone",
      desc: "Be present when a global drum-pulse milestone fires",
      surface: "/drum-pulse",
      threshold: 1,
      progressKey: "pc:drum-pulse:milestones-seen",
      progressType: "count"
    },
    {
      id: "agent-friend",
      title: "Agent Friend",
      nounId: 444,
      eyebrow: "mcp",
      desc: "Connect an MCP-aware agent to /api/mcp and tap from it",
      surface: "/drum-agents",
      threshold: 1,
      progressKey: "pc:drum-agents:connected",
      progressType: "count"
    },
    {
      id: "bell-ringer",
      title: "Bell Ringer",
      nounId: 555,
      eyebrow: "v11 · all 12",
      desc: "Ring every bell on /drum-v11 — all 12 in the temple beam",
      surface: "/drum-v11",
      threshold: 12,
      progressKey: "pc:drum-v11:rung",
      progressType: "set"
    },
    {
      id: "daily-faithful",
      title: "Daily Faithful",
      nounId: 678,
      eyebrow: "beat of day",
      desc: "Play /drum-daily on 7 different days (UTC)",
      surface: "/drum-daily",
      threshold: 7,
      progressKey: "pc:drum-daily:days",
      progressType: "set"
    },
    {
      id: "viz-witness",
      title: "Viz Witness",
      nounId: 711,
      eyebrow: "tv v3",
      desc: "Watch /drum-viz for 3 minutes (cumulative across visits)",
      surface: "/drum-viz",
      threshold: 180,
      progressKey: "pc:drum-viz:seconds",
      progressType: "count"
    },
    {
      id: "grand-master",
      title: "Grand Master",
      nounId: 999,
      eyebrow: "all trophies",
      desc: "Earn every other drum trophy",
      surface: "/drum-trophies",
      threshold: 16,
      progressKey: "_meta",
      progressType: "meta"
    }
  ];
  return renderTemplate`${renderComponent($$result, "DrumLayout", $$DrumLayout, { "title": "Drum Trophies", "description": "On-chain collectibles for the PointCast drum hub. Earn trophies across the seven drum surfaces, mint them as Visit Nouns FA2 NFTs on Tezos.", "image": "/images/og-drum.png" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="dt-root"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "v1" })} <header class="dt-hero"> <p class="dt-hero-eyebrow">trophies · on-chain · tezos</p> <h1 class="dt-hero-title">your drum collection</h1> <p class="dt-hero-dek">
ten trophies across the nine drum rooms. earn them by playing.
      claim each as a Nouns FA2 NFT on Tezos — free, gas only
      (~0.003 ꜩ). connect your wallet to see what you've already minted
      and to claim what you've earned.
</p> </header> <!-- ══ HUD ══ --> <div class="dt-hud"> <div class="dt-hud-card"> <div class="dt-hud-label">Earned</div> <div class="dt-hud-val"><span id="dt-earned">0</span> / 10</div> <div class="dt-hud-sub">localStorage state</div> </div> <div class="dt-hud-card"> <div class="dt-hud-label">Minted</div> <div class="dt-hud-val"><span id="dt-minted">—</span></div> <div class="dt-hud-sub">on-chain · TzKT</div> </div> <div class="dt-hud-card"> <div class="dt-hud-label">Total Drums</div> <div class="dt-hud-val" id="dt-total-drums">0</div> <div class="dt-hud-sub">across all surfaces</div> </div> <div class="dt-hud-card"> <div class="dt-hud-label">Wallet</div> <div class="dt-hud-val dt-hud-wallet" id="dt-wallet-state">not connected</div> <div class="dt-hud-sub" id="dt-wallet-sub">click connect in the header</div> </div> </div> <!-- ══ TROPHIES GRID ══ --> <section class="dt-grid"> ${TROPHIES.map((t) => renderTemplate`<article class="dt-card"${addAttribute(t.id, "data-trophy")}${addAttribute(String(t.nounId), "data-noun")}${addAttribute(String(t.threshold), "data-threshold")}${addAttribute(t.progressKey, "data-progress-key")}${addAttribute(t.progressType, "data-progress-type")}> <div class="dt-card-noun"> <img${addAttribute(`https://noun.pics/${t.nounId}.svg`, "src")}${addAttribute(t.title, "alt")} width="120" height="120" loading="lazy" style="image-rendering: pixelated;"> <div class="dt-card-state" data-state-pill>locked</div> </div> <div class="dt-card-text"> <p class="dt-card-eyebrow">${t.eyebrow}</p> <h2 class="dt-card-title">${t.title}</h2> <p class="dt-card-desc">${t.desc}</p> <div class="dt-card-progress"> <div class="dt-card-progress-bar"> <div class="dt-card-progress-fill" data-fill style="width: 0%"></div> </div> <div class="dt-card-progress-text" data-progress-text>0 / ${t.threshold}</div> </div> <div class="dt-card-meta"> <a class="dt-card-surface"${addAttribute(t.surface, "href")}>play ${t.surface} →</a> <a class="dt-card-tzkt"${addAttribute(`https://noun.pics/${t.nounId}.svg`, "href")} target="_blank" rel="noopener">noun #${t.nounId} ↗</a> </div> <div class="dt-card-mint" data-mint-slot> ${VISIT_NOUNS && renderTemplate`${renderComponent($$result2, "MintButton", $$MintButton, { "contract": VISIT_NOUNS, "tokenId": t.nounId, "priceMutez": 0, "kind": "mint", "label": `Claim trophy · noun #${t.nounId}` })}`} ${!VISIT_NOUNS && renderTemplate`<p class="dt-card-soon">contract not wired — coming soon</p>`} </div> </div> </article>`)} </section> <!-- ══ ON-CHAIN VIEWER ══ --> <section class="dt-onchain"> <div class="dt-onchain-head"> <h2 class="dt-onchain-title">your wallet's PointCast Visit Nouns</h2> <a href="/collection/visit-nouns" class="dt-onchain-link">full collection →</a> </div> <div id="dt-onchain-grid" class="dt-onchain-grid"> <p class="dt-onchain-empty">connect a wallet to see your on-chain Visit Nouns</p> </div> </section> <!-- ══ FOOTER ══ --> <footer class="dt-footer"> <span>⌐◨-◨ PointCast · Drum Trophies</span> <span>Visit Nouns FA2 · ${VISIT_NOUNS || "pending mainnet origination"}</span> <span>Signed: Michael Hoydich · Claude Opus 4.7 (1M Max) · 2026</span> </footer> </div>  ${renderScript($$result2, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-trophies.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-trophies.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-trophies.astro";
const $$url = "/drum-trophies";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumTrophies,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
