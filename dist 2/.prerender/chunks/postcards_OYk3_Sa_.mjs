import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, d as defineScriptVars, r as renderComponent, m as maybeRenderHead, b as addAttribute, F as Fragment } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import contracts from './contracts_B1zhgPPX.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Postcards = createComponent(async ($$result, $$props, $$slots) => {
  const pc = contracts.postcards ?? {};
  const pcKt1 = (pc.mainnet ?? "").trim();
  const pcLive = pcKt1.startsWith("KT1");
  const TOKENS = [
    { id: 0, slug: "marine-layer-main-street", name: "Marine Layer · Main Street", file: "/images/postcards/0-marine-layer-main-street.svg", note: "Foggy mid-morning on Main Street. Power lines, palms, a sun trying to burn through.", edition: 100 },
    { id: 1, slug: "el-porto-pier", name: "El Porto Pier", file: "/images/postcards/1-el-porto-pier.svg", note: "The pier at El Porto, north end of the strand. Surfers paddling out, gulls overhead.", edition: 100 },
    { id: 2, slug: "dunes-at-sunset", name: "Dunes at Sunset", file: "/images/postcards/2-dunes-at-sunset.svg", note: "The El Segundo Dunes — only intact coastal dune ecosystem in LA County. Ice plant in flower.", edition: 100 },
    { id: 3, slug: "ralphs-at-3pm", name: "Ralphs · 3pm Tuesday", file: "/images/postcards/3-ralphs-at-3pm.svg", note: "Sepulveda and Mariposa, 3pm Tuesday. Five cars in the lot. The neon sign you don't notice unless you live here.", edition: 100 },
    { id: 4, slug: "refinery-night", name: "Refinery · Eleven PM", file: "/images/postcards/4-refinery-night.svg", note: "The Chevron refinery, eleven pm. Flare on the stack. The town that runs all night.", edition: 100 },
    { id: 5, slug: "manhattan-pier", name: "Manhattan Pier · Golden Hour", file: "/images/postcards/5-manhattan-pier.svg", note: "Manhattan Beach Pier from the south. Roundhouse glowing, sun on the water.", edition: 100 },
    { id: 6, slug: "marine-layer-thinning", name: "Marine Layer · Thinning", file: "/images/postcards/6-marine-layer-thinning.svg", note: "Mid-morning, fog drifting away, sun cutting through. The moment the town wakes up.", edition: 100 }
  ];
  const title = "/postcards — PointCast Postcards · El Segundo Set 1";
  const description = "Seven painted postcards from El Segundo as FA2 NFTs. Free open-edition mint, 100 editions each. Marine layer, the pier, the dunes, Ralphs at 3pm, the refinery at eleven pm, Manhattan pier at golden hour, and the moment the fog thins.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/postcards",
    name: "PointCast Postcards",
    description,
    url: "https://pointcast.xyz/postcards",
    hasPart: TOKENS.map((t) => ({
      "@type": "VisualArtwork",
      name: t.name,
      image: "https://pointcast.xyz" + t.file,
      description: t.note
    }))
  };
  return renderTemplate(_a || (_a = __template(["", " <script>\n  (function () {\n    'use strict';\n    function tick() {\n      var el = document.getElementById('pc-clock');\n      if (!el) return;\n      var n = new Date();\n      el.textContent = String(n.getHours()).padStart(2, '0') + ':' +\n        String(n.getMinutes()).padStart(2, '0') + ' PT';\n    }\n    tick();\n    setInterval(tick, 60 * 1000);\n\n    // Mint flow lights up only when contracts.postcards.mainnet is populated.\n    document.querySelectorAll('.pc__claim:not([disabled])').forEach(function (btn) {\n      btn.addEventListener('click', async function () {\n        var tokenId = parseInt(btn.getAttribute('data-token-id') || '0', 10);\n        var origLabel = btn.textContent;\n        btn.disabled = true;\n        btn.textContent = 'AWAITING KUKAI…';\n        try {\n          var taquito = await import('@taquito/taquito');\n          var beacon = await import('@taquito/beacon-wallet');\n          var tezos = new taquito.TezosToolkit('https://mainnet.api.tez.ie');\n          var bw = new beacon.BeaconWallet({ name: 'PointCast Postcards', network: { type: 'mainnet' } });\n          tezos.setWalletProvider(bw);\n          var active = await bw.client.getActiveAccount();\n          if (!active) await bw.client.requestPermissions();\n          var kt1 = window.__pcPcKt1 || '';\n          if (!kt1) throw new Error('contract not yet originated');\n          var contract = await tezos.wallet.at(kt1);\n          var op = await contract.methodsObject.mint_postcard(tokenId).send();\n          btn.textContent = 'BROADCAST · ' + (op.opHash || '').slice(0, 8) + '…';\n          await op.confirmation();\n          btn.textContent = 'MINTED ✓';\n        } catch (err) {\n          var msg = (err && err.message) ? err.message : String(err);\n          btn.textContent = /reject|cancel|abort/i.test(msg) ? 'CANCELLED' : 'ERROR · TRY AGAIN';\n          setTimeout(function () { btn.disabled = false; btn.textContent = origLabel; }, 2400);\n        }\n      });\n    });\n  })();\n<\/script> <script>(function(){", "\n  window.__pcPcKt1 = pcKt1 || '';\n})();<\/script>"])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-gpxvna44": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="pc" id="pc-main" data-astro-cid-gpxvna44> <header class="pc__head" data-astro-cid-gpxvna44> <p class="pc__kicker mono" data-astro-cid-gpxvna44>CH.ESC · POINTCAST POSTCARDS · EL SEGUNDO · SET 1</p> <h1 class="pc__title" data-astro-cid-gpxvna44><em data-astro-cid-gpxvna44>Seven postcards from a small beach town.</em></h1> <p class="pc__dek" data-astro-cid-gpxvna44>
Painted scenes of El Segundo as FA2 NFTs. Free open-edition mint when the contract lands. Until then a preview — same page, mint button asleep.
</p> <p class="pc__status mono"${addAttribute(pcLive ? "live" : "pending", "data-state")} data-astro-cid-gpxvna44> <span class="pc__status-dot" aria-hidden="true" data-astro-cid-gpxvna44></span> ${pcLive ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-gpxvna44": true }, { "default": async ($$result3) => renderTemplate`contract live · <code data-astro-cid-gpxvna44>${pcKt1.slice(0, 12)}…${pcKt1.slice(-6)}</code> · free mint, gas only` })}` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-gpxvna44": true }, { "default": async ($$result3) => renderTemplate`contract not yet originated · preview only · check back after the SmartPy IDE drive` })}`} </p> </header> <section class="pc__grid" aria-label="Seven postcards" data-astro-cid-gpxvna44> ${TOKENS.map((t) => renderTemplate`<article class="pc__card"${addAttribute(t.id, "data-token-id")}${addAttribute(t.slug, "data-slug")} data-astro-cid-gpxvna44> <div class="pc__art" data-astro-cid-gpxvna44> <img${addAttribute(t.file, "src")}${addAttribute(`${t.name} — Postcard №${t.id}`, "alt")} loading="lazy" data-astro-cid-gpxvna44> <span class="pc__art-tag mono" data-astro-cid-gpxvna44>№${t.id} · ${t.edition} ED</span> </div> <div class="pc__caption" data-astro-cid-gpxvna44> <h2 class="pc__name" data-astro-cid-gpxvna44>${t.name}</h2> <p class="pc__note" data-astro-cid-gpxvna44>${t.note}</p> <button type="button" class="pc__claim mono"${addAttribute(t.id, "data-token-id")}${addAttribute(t.slug, "data-slug")}${addAttribute(!pcLive, "disabled")}${addAttribute(`${pcLive ? "Mint" : "Mint (soon)"} — ${t.name}`, "aria-label")} data-astro-cid-gpxvna44> ${pcLive ? "MINT · 0 ꜩ" : "ORIGINATING SOON"} </button> </div> </article>`)} </section> <section class="pc__texture" data-astro-cid-gpxvna44> <p data-astro-cid-gpxvna44>
Postcards is the third mintable on PointCast after Coffee Mugs and Window Snapshots. Same FA2 pattern — multi-token, on-chain edition caps, public free mint gated only by gas. 7.5% royalty on secondary sales routes through the marketplace.
</p> <p data-astro-cid-gpxvna44>
Seven scenes is the first set. If El Segundo keeps showing up, a Set 2 follows: dawn at the strand, the airport at midnight, the wind farm in the hills, the quiet Saturday at Smoky Hollow.
</p> </section> <nav class="pc__links" aria-label="Other rooms" data-astro-cid-gpxvna44> <a class="pc__link" href="/snapshots" data-astro-cid-gpxvna44><span class="pc__link-label mono" data-astro-cid-gpxvna44>/SNAPSHOTS</span><span class="pc__link-desc" data-astro-cid-gpxvna44>three painted interiors</span></a> <a class="pc__link" href="/coffee" data-astro-cid-gpxvna44><span class="pc__link-label mono" data-astro-cid-gpxvna44>/COFFEE</span><span class="pc__link-desc" data-astro-cid-gpxvna44>five mugs · pour to unlock</span></a> <a class="pc__link" href="/visit-nouns" data-astro-cid-gpxvna44><span class="pc__link-label mono" data-astro-cid-gpxvna44>/VISIT-NOUNS</span><span class="pc__link-desc" data-astro-cid-gpxvna44>noun-by-noun · one per visit</span></a> <a class="pc__link" href="/market" data-astro-cid-gpxvna44><span class="pc__link-label mono" data-astro-cid-gpxvna44>/MARKET</span><span class="pc__link-desc" data-astro-cid-gpxvna44>trade every PointCast FA2</span></a> <a class="pc__link" href="/town" data-astro-cid-gpxvna44><span class="pc__link-label mono" data-astro-cid-gpxvna44>/TOWN</span><span class="pc__link-desc" data-astro-cid-gpxvna44>the iso town map</span></a> <a class="pc__link" href="/" data-astro-cid-gpxvna44><span class="pc__link-label mono" data-astro-cid-gpxvna44>/</span><span class="pc__link-desc" data-astro-cid-gpxvna44>back to the broadcast</span></a> </nav> <footer class="pc__foot mono" data-astro-cid-gpxvna44> <span data-astro-cid-gpxvna44>on air · el segundo · fm 96.1 · cc0</span> <span id="pc-clock" data-astro-cid-gpxvna44>—</span> </footer> </main> ` }), defineScriptVars({ pcKt1 }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/postcards.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/postcards.astro";
const $$url = "/postcards";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Postcards,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
