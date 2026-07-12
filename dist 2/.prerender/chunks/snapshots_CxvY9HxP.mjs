import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, d as defineScriptVars, r as renderComponent, m as maybeRenderHead, b as addAttribute, F as Fragment } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import contracts from './contracts_B1zhgPPX.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Snapshots = createComponent(async ($$result, $$props, $$slots) => {
  const ws = contracts.window_snapshots ?? {};
  const wsKt1 = (ws.mainnet ?? "").trim();
  const wsLive = wsKt1.startsWith("KT1");
  const TOKENS = [
    {
      id: 0,
      slug: "galley",
      name: "Galley",
      file: "/images/window-snapshots/0-galley.jpg",
      note: "A small kitchen, painted at the hour the marine layer thins.",
      edition: 100
    },
    {
      id: 1,
      slug: "long-room",
      name: "Long Room",
      file: "/images/window-snapshots/1-long-room.jpg",
      note: "A long room with light pulled in slow from the west.",
      edition: 100
    },
    {
      id: 2,
      slug: "lamp-wall",
      name: "Lamp Wall",
      file: "/images/window-snapshots/2-lamp-wall.jpg",
      note: "A wall of lamps, all on, none of them too bright.",
      edition: 100
    }
  ];
  const title = "/snapshots — Window Snapshots · three painted interiors";
  const description = "Three painted-interior FA2 NFTs from PointCast. Free mint, 100 editions each. Galley · Long Room · Lamp Wall.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/snapshots",
    name: "Window Snapshots",
    description,
    url: "https://pointcast.xyz/snapshots",
    hasPart: TOKENS.map((t) => ({
      "@type": "VisualArtwork",
      name: t.name,
      image: "https://pointcast.xyz" + t.file,
      description: t.note
    }))
  };
  return renderTemplate(_a || (_a = __template(["", " <script>\n  (function () {\n    'use strict';\n    function tick() {\n      var el = document.getElementById('ws-clock');\n      if (!el) return;\n      var n = new Date();\n      el.textContent = String(n.getHours()).padStart(2, '0') + ':' +\n        String(n.getMinutes()).padStart(2, '0') + ' PT';\n    }\n    tick();\n    setInterval(tick, 60 * 1000);\n\n    // The mint button is rendered enabled/disabled at build time based on\n    // contracts.window_snapshots.mainnet. When live, this script will\n    // dynamically import Taquito + Beacon and call mint_snapshot(token_id).\n    document.querySelectorAll('.ws__claim:not([disabled])').forEach(function (btn) {\n      btn.addEventListener('click', async function () {\n        var tokenId = parseInt(btn.getAttribute('data-token-id') || '0', 10);\n        var origLabel = btn.textContent;\n        btn.disabled = true;\n        btn.textContent = 'AWAITING KUKAI…';\n        try {\n          var taquito = await import('@taquito/taquito');\n          var beacon = await import('@taquito/beacon-wallet');\n          var tezos = new taquito.TezosToolkit('https://mainnet.api.tez.ie');\n          var bw = new beacon.BeaconWallet({ name: 'PointCast Snapshots', network: { type: 'mainnet' } });\n          tezos.setWalletProvider(bw);\n          var active = await bw.client.getActiveAccount();\n          if (!active) await bw.client.requestPermissions();\n          var kt1 = btn.closest('[data-ws-kt1]') ? btn.closest('[data-ws-kt1]').getAttribute('data-ws-kt1') : null;\n          // KT1 read from contracts.json at build time, baked into a data attr\n          // via window.__pcWsKt1 (set below). Server-side render path.\n          kt1 = kt1 || (window.__pcWsKt1 || '');\n          if (!kt1) throw new Error('contract not yet originated');\n          var contract = await tezos.wallet.at(kt1);\n          var op = await contract.methodsObject.mint_snapshot(tokenId).send();\n          btn.textContent = 'BROADCAST · ' + (op.opHash || '').slice(0, 8) + '…';\n          await op.confirmation();\n          btn.textContent = 'MINTED ✓';\n        } catch (err) {\n          var msg = (err && err.message) ? err.message : String(err);\n          btn.textContent = /reject|cancel|abort/i.test(msg) ? 'CANCELLED' : 'ERROR · TRY AGAIN';\n          setTimeout(function () { btn.disabled = false; btn.textContent = origLabel; }, 2400);\n        }\n      });\n    });\n  })();\n<\/script> <script>(function(){", "\n  // Frontmatter-baked contract address. Empty string until originated.\n  window.__pcWsKt1 = wsKt1 || '';\n})();<\/script>"])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-jpcun4m3": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="ws" id="ws-main" data-astro-cid-jpcun4m3> <header class="ws__head" data-astro-cid-jpcun4m3> <p class="ws__kicker" data-astro-cid-jpcun4m3>ROOM · SPN · WINDOW SNAPSHOTS · EL SEGUNDO</p> <h1 class="ws__title" data-astro-cid-jpcun4m3><em data-astro-cid-jpcun4m3>Three windows. Three rooms. Three editions of one hundred.</em></h1> <p class="ws__dek" data-astro-cid-jpcun4m3>
Painted interiors of small rooms with light coming from somewhere
        out of frame. Free mint when the contract is live. Until then,
        a preview — same page, just with the mint button asleep.
</p> <p class="ws__status mono"${addAttribute(wsLive ? "live" : "pending", "data-state")} data-astro-cid-jpcun4m3> <span class="ws__status-dot" aria-hidden="true" data-astro-cid-jpcun4m3></span> ${wsLive ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-jpcun4m3": true }, { "default": async ($$result3) => renderTemplate`contract live · <code data-astro-cid-jpcun4m3>${wsKt1.slice(0, 12)}…${wsKt1.slice(-6)}</code> · free mint, gas only` })}` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-jpcun4m3": true }, { "default": async ($$result3) => renderTemplate`contract not yet originated · preview only · check back after the SmartPy IDE drive` })}`} </p> </header> <section class="ws__triptych" aria-label="Three paintings" data-astro-cid-jpcun4m3> ${TOKENS.map((t) => renderTemplate`<article class="ws__panel"${addAttribute(t.id, "data-token-id")}${addAttribute(t.slug, "data-slug")} data-astro-cid-jpcun4m3> <div class="ws__art" data-astro-cid-jpcun4m3> <img${addAttribute(t.file, "src")}${addAttribute(`${t.name} — Window Snapshot #${t.id}`, "alt")} loading="lazy" data-astro-cid-jpcun4m3> <span class="ws__art-tag mono" data-astro-cid-jpcun4m3>№${t.id} · ${t.edition} ED</span> </div> <div class="ws__caption" data-astro-cid-jpcun4m3> <h2 class="ws__name" data-astro-cid-jpcun4m3>${t.name}</h2> <p class="ws__note" data-astro-cid-jpcun4m3>${t.note}</p> <button type="button" class="ws__claim mono"${addAttribute(t.id, "data-token-id")}${addAttribute(t.slug, "data-slug")}${addAttribute(!wsLive, "disabled")}${addAttribute(`${wsLive ? "Mint" : "Mint (soon)"} — ${t.name}`, "aria-label")} data-astro-cid-jpcun4m3> ${wsLive ? "MINT · 0 ꜩ" : "ORIGINATING SOON"} </button> </div> </article>`)} </section> <section class="ws__texture" data-astro-cid-jpcun4m3> <p data-astro-cid-jpcun4m3>
Window Snapshots is the second mintable on PointCast after Coffee
        Mugs. Same FA2 contract pattern — multi-token, on-chain edition
        caps, public free mint gated only by gas. Royalties on secondary
        sales route through the marketplace at 7.5%.
</p> <p data-astro-cid-jpcun4m3>
Three paintings now. The collection stays small. If a fourth window
        opens, it'll get its own page and announcement.
</p> </section> <nav class="ws__links" aria-label="Other rooms" data-astro-cid-jpcun4m3> <a class="ws__link" href="/coffee" data-astro-cid-jpcun4m3> <span class="ws__link-label mono" data-astro-cid-jpcun4m3>/COFFEE</span> <span class="ws__link-desc" data-astro-cid-jpcun4m3>five mugs · pour to unlock</span> </a> <a class="ws__link" href="/visit-nouns" data-astro-cid-jpcun4m3> <span class="ws__link-label mono" data-astro-cid-jpcun4m3>/VISIT-NOUNS</span> <span class="ws__link-desc" data-astro-cid-jpcun4m3>noun-by-noun · one per visit</span> </a> <a class="ws__link" href="/market" data-astro-cid-jpcun4m3> <span class="ws__link-label mono" data-astro-cid-jpcun4m3>/MARKET</span> <span class="ws__link-desc" data-astro-cid-jpcun4m3>trade every PointCast FA2</span> </a> <a class="ws__link" href="/" data-astro-cid-jpcun4m3> <span class="ws__link-label mono" data-astro-cid-jpcun4m3>/</span> <span class="ws__link-desc" data-astro-cid-jpcun4m3>back to the broadcast</span> </a> </nav> <footer class="ws__foot mono" data-astro-cid-jpcun4m3> <span data-astro-cid-jpcun4m3>on air · el segundo · fm 96.1 · cc0</span> <span id="ws-clock" data-astro-cid-jpcun4m3>—</span> </footer> </main> ` }), defineScriptVars({ wsKt1 }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/snapshots.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/snapshots.astro";
const $$url = "/snapshots";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Snapshots,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
