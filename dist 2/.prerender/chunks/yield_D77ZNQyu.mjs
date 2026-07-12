import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, d as defineScriptVars, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Yield = createComponent(($$result, $$props, $$slots) => {
  const MODELS = [
    {
      id: "attention",
      code: "A",
      color: "#185FA5",
      color50: "#EEF4FA",
      title: "Attention Yield",
      summary: "Drip small amounts to wallets that maintain active presence. Visit, drum, view blocks — your wallet ticks up.",
      mechanic: "Server aggregates session events per wallet-day (capped). Weekly job distributes a fixed pool of DRUM (or ꜩ) pro-rata to eligible wallets.",
      moderation: "Zero. Events are machine-generated, caps prevent farming.",
      tradeoffs: {
        label: "Farming risk vs. felt experience",
        notes: [
          'Headline upside: every visitor sees their wallet tick up — it is the exact feeling of "constant drip" Mike asked for.',
          "Farming risk: bots accumulate trivially. Mitigation: cap per-wallet-per-day, require a Visit Noun held (so farming cost = mint + gas).",
          "Visible: easy to explain and easy to show on /wallet or /now."
        ]
      },
      inputs: [
        { id: "pool", label: "Monthly pool", min: 10, max: 1e3, step: 10, default: 200, unit: "DRUM" },
        { id: "wallets", label: "Eligible wallets", min: 10, max: 5e3, step: 10, default: 200, unit: "wallets" },
        { id: "share", label: "Your activity share", min: 0.1, max: 5, step: 0.1, default: 1, unit: "×" }
      ],
      calcNote: "Your monthly = (pool / wallets) × activityShare. Cap: 3× pool/wallets average per wallet to prevent whale concentration."
    },
    {
      id: "reflow",
      code: "B",
      color: "#0F6E56",
      color50: "#E7F4EF",
      title: "Prize Cast Reflow",
      summary: "A fraction of each Prize Cast weekly draw skips the winner and drips to Visit Nouns holders pro-rata.",
      mechanic: "Contract withholds N% of the weekly prize pool. That slice is distributed to Visit Nouns FA2 holders weighted by holdings at snapshot.",
      moderation: "Zero. The split happens on-chain at draw time.",
      tradeoffs: {
        label: "Lottery purity vs. holder incentive",
        notes: [
          "Upside: Visit Nouns holders earn a recurring tiny amount whether they deposit to Cast or not. Turns the NFT into a passive yield instrument.",
          "Downside: reduces the jackpot, which is the whole marketing draw of no-loss lotteries.",
          "Balance: 10-20% reflow feels like the right ceiling. More and the prize feels diluted."
        ]
      },
      inputs: [
        { id: "tvl", label: "Prize Cast TVL", min: 100, max: 1e4, step: 100, default: 1e3, unit: "ꜩ" },
        { id: "apy", label: "Baker APY", min: 3, max: 7, step: 0.1, default: 5, unit: "%" },
        { id: "reflowPct", label: "Reflow slice", min: 0, max: 50, step: 5, default: 15, unit: "%" },
        { id: "holders", label: "Visit Noun holders", min: 10, max: 2e3, step: 10, default: 100, unit: "holders" }
      ],
      calcNote: "Weekly yield = TVL × APY / 52. Reflow = weekly × pct. Per holder (equal dist) = reflow / holders."
    },
    {
      id: "royalty",
      code: "C",
      color: "#993556",
      color50: "#FAEAF0",
      title: "Royalty Router",
      summary: "50% of Visit Nouns FA2 secondary-market royalties route back to holders, not the treasury.",
      mechanic: "At sale time the contract splits the royalty fee: half to the project treasury, half to current holders pro-rata. Accumulates into a claimable pool.",
      moderation: "Zero. All on-chain.",
      tradeoffs: {
        label: "Treasury depth vs. holder aligned incentive",
        notes: [
          "Upside: self-reinforcing. Holders want secondary volume because they earn from it — so they promote the collection.",
          "Downside: treasury gets less, which slows operational spending (ESREF seeding, gear pool for mesh internet, etc.)",
          "Note: activity-dependent. Months with no sales = zero payout from this model, so it pairs well with something steady like Attention Yield."
        ]
      },
      inputs: [
        { id: "volume", label: "Monthly secondary volume", min: 0, max: 500, step: 10, default: 40, unit: "ꜩ" },
        { id: "royalty", label: "Royalty rate", min: 2.5, max: 15, step: 0.5, default: 7.5, unit: "%" },
        { id: "split", label: "Holder split", min: 0, max: 100, step: 10, default: 50, unit: "%" },
        { id: "holders", label: "Visit Noun holders", min: 10, max: 2e3, step: 10, default: 100, unit: "holders" }
      ],
      calcNote: "Monthly royalty = volume × royalty%. Holder slice = × split%. Per holder (equal) = slice / holders."
    },
    {
      id: "stake",
      code: "D",
      color: "#993C1D",
      color50: "#FBEFEA",
      title: "DRUM Stake Yield",
      summary: "Hold DRUM tokens and they earn DRUM. Proportional to your held + staked balance. Rewards from a fixed weekly inflation budget.",
      mechanic: `Weekly contract mint of N DRUM. Distributed pro-rata to all holders at snapshot. Staking is just "don't sell" — no lock-ups.`,
      moderation: "Zero. Deterministic contract math.",
      tradeoffs: {
        label: "Inflation vs. long-tail holding",
        notes: [
          "Upside: simple, classic. Holders hold longer because exit = forfeit future drops.",
          "Downside: pure inflation. Without demand, token value dilutes.",
          "Balance: fixed weekly mint creates predictable drip; cap the total or halve the emission every N months to avoid runaway inflation."
        ]
      },
      inputs: [
        { id: "weeklyMint", label: "Weekly DRUM mint", min: 100, max: 1e4, step: 100, default: 1e3, unit: "DRUM" },
        { id: "totalSupply", label: "DRUM in circulation", min: 1e3, max: 2e5, step: 1e3, default: 2e4, unit: "DRUM" },
        { id: "yourBalance", label: "Your DRUM balance", min: 0, max: 1e4, step: 10, default: 100, unit: "DRUM" }
      ],
      calcNote: "Your weekly = weeklyMint × (yourBalance / totalSupply). Monthly = weekly × 4.33."
    },
    {
      id: "baker",
      code: "E",
      color: "#534AB7",
      color50: "#EEEDF7",
      title: "Baker Kickback",
      summary: "Prize Cast delegates staked tez to a baker. Some bakers kick back a % to the delegator. That kickback becomes additional yield.",
      mechanic: "Prize Cast contract's staking delegate is set to a kickback-friendly baker. Kickback routes to a separate pool, distributed to Visit Nouns holders weekly.",
      moderation: "Zero. Baker handles kickback off-protocol; distribution is on-chain.",
      tradeoffs: {
        label: "Extra yield vs. baker dependency",
        notes: [
          "Upside: free 0.3-0.7% APY on top of the base baking yield. Compositional with Prize Cast Reflow.",
          "Downside: dependent on a single baker being stable and honest. Baker risk = slashing or downtime = no kickback.",
          "Mitigation: rotate between 2-3 kickback-friendly bakers quarterly via DAO vote."
        ]
      },
      inputs: [
        { id: "tvl", label: "Prize Cast TVL", min: 100, max: 1e4, step: 100, default: 1e3, unit: "ꜩ" },
        { id: "kickback", label: "Baker kickback", min: 0, max: 2, step: 0.1, default: 0.5, unit: "%" },
        { id: "holders", label: "Visit Noun holders", min: 10, max: 2e3, step: 10, default: 100, unit: "holders" }
      ],
      calcNote: "Monthly kickback = TVL × kickback% / 12. Per holder = kickback / holders."
    }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": "https://pointcast.xyz/yield",
    name: "PointCast yield — token mechanic experiments",
    description: "Five candidate token/yield models for PointCast, presented side by side as interactive sandboxes.",
    url: "https://pointcast.xyz/yield"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Yield", "description": "PointCast's token/yield experiments sandbox. Five candidate mechanics side-by-side. Tune the sliders, see what works.", "image": "/images/og/yield.png", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/yield.json", title: "Yield models (JSON)" }], "data-astro-cid-n3tn3ng3": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", `<div class="page" data-astro-cid-n3tn3ng3> <nav class="crumb" data-astro-cid-n3tn3ng3> <a href="/" data-astro-cid-n3tn3ng3>Home</a> <span aria-hidden="true" data-astro-cid-n3tn3ng3>›</span> <span data-astro-cid-n3tn3ng3>yield</span> </nav> <header class="hero" data-astro-cid-n3tn3ng3> <p class="kicker" data-astro-cid-n3tn3ng3>YIELD · EXPERIMENTS · v1</p> <h1 class="display" data-astro-cid-n3tn3ng3>Five models. No commitments.</h1> <p class="dek" data-astro-cid-n3tn3ng3>
The DAO is deciding what "yield" looks like on PointCast. These
        are five candidate mechanics side-by-side. Each is a sandbox —
        tune the inputs, see monthly payouts, read the tradeoffs. None
        of them are live yet. Some will compose; some won't make it.
</p> </header> <section class="models" data-astro-cid-n3tn3ng3> `, ` </section> <section class="composition" data-astro-cid-n3tn3ng3> <p class="kicker" data-astro-cid-n3tn3ng3>COMPOSITION NOTE</p> <p data-astro-cid-n3tn3ng3>
These aren't mutually exclusive. The v3 strategy recommendation combines <a href="#attention" data-astro-cid-n3tn3ng3><strong data-astro-cid-n3tn3ng3>Model A (Attention Yield)</strong></a> as the headline mechanic (visible, constant, small drip) with <a href="#royalty" data-astro-cid-n3tn3ng3><strong data-astro-cid-n3tn3ng3>Model C (Royalty Router)</strong></a> as the funding source — so the yield you earn by visiting is literally paid for by the secondary-market activity that your collection drives. Self-reinforcing loop.
</p> <p data-astro-cid-n3tn3ng3> <a href="/dao" data-astro-cid-n3tn3ng3><strong data-astro-cid-n3tn3ng3>PC-0001</strong></a> at the DAO will be the first vote that binds real capital to any of these. Until then, this page exists to let everyone see the math.
</p> </section> <aside class="surfaces" data-astro-cid-n3tn3ng3> <p class="kicker" data-astro-cid-n3tn3ng3>RELATED</p> <ul class="surfaces__list" data-astro-cid-n3tn3ng3> <li data-astro-cid-n3tn3ng3><a href="/dao" data-astro-cid-n3tn3ng3><span class="mono" data-astro-cid-n3tn3ng3>DAO</span> /dao</a></li> <li data-astro-cid-n3tn3ng3><a href="/cast" data-astro-cid-n3tn3ng3><span class="mono" data-astro-cid-n3tn3ng3>PRIZE</span> /cast</a></li> <li data-astro-cid-n3tn3ng3><a href="/drum" data-astro-cid-n3tn3ng3><span class="mono" data-astro-cid-n3tn3ng3>DRUM</span> /drum</a></li> <li data-astro-cid-n3tn3ng3><a href="/yield.json" data-astro-cid-n3tn3ng3><span class="mono" data-astro-cid-n3tn3ng3>JSON</span> /yield.json</a></li> </ul> </aside> </div> <script>(function(){`, "\n    (function () {\n      /**\n       * Per-model payout calcs. Matches the `calcNote` on each model\n       * exactly. If the formula changes here, update the note.\n       */\n      const calcs = {\n        attention({ pool, wallets, share }) {\n          const base = pool / Math.max(1, wallets);\n          const capped = Math.min(share, 3);\n          return base * capped;\n        },\n        reflow({ tvl, apy, reflowPct, holders }) {\n          const weekly = (tvl * (apy / 100)) / 52;\n          const reflow = weekly * (reflowPct / 100);\n          const monthly = reflow * 4.33;\n          return monthly / Math.max(1, holders);\n        },\n        royalty({ volume, royalty, split, holders }) {\n          const fee = volume * (royalty / 100);\n          const holderPool = fee * (split / 100);\n          return holderPool / Math.max(1, holders);\n        },\n        stake({ weeklyMint, totalSupply, yourBalance }) {\n          const weekly = weeklyMint * (yourBalance / Math.max(1, totalSupply));\n          return weekly * 4.33;\n        },\n        baker({ tvl, kickback, holders }) {\n          const monthly = (tvl * (kickback / 100)) / 12;\n          return monthly / Math.max(1, holders);\n        },\n      };\n\n      const units = {\n        attention: { suffix: 'DRUM/mo', note: 'from the monthly pool, weighted by activity share, capped at 3× mean' },\n        reflow:    { suffix: 'ꜩ/mo',   note: 'your share of Prize Cast weekly yield reflowed to Visit Nouns holders' },\n        royalty:   { suffix: 'ꜩ/mo',   note: 'your slice of the royalty-router pool from secondary-market sales' },\n        stake:     { suffix: 'DRUM/mo', note: 'your pro-rata share of the weekly DRUM inflation' },\n        baker:     { suffix: 'ꜩ/mo',   note: 'your share of the baker kickback, distributed to holders weekly' },\n      };\n\n      function computeFor(modelId) {\n        const container = document.querySelector(`[data-model=\"${modelId}\"]`);\n        if (!container) return;\n        const inputs = {};\n        container.querySelectorAll('[data-input]').forEach(function (el) {\n          const k = el.getAttribute('data-input');\n          inputs[k] = Number(el.value);\n          const vEl = container.querySelector(`[data-value=\"${k}\"]`);\n          if (vEl) vEl.textContent = String(Number(el.value));\n        });\n\n        const calc = calcs[modelId];\n        if (!calc) return;\n        const result = calc(inputs);\n        const out = container.querySelector('[data-payout]');\n        const note = container.querySelector('[data-payout-note]');\n        const u = units[modelId];\n        if (out) {\n          const rounded = result >= 10 ? result.toFixed(2) : result.toFixed(3);\n          out.textContent = rounded + ' ' + u.suffix;\n        }\n        if (note) note.textContent = u.note;\n      }\n\n      document.querySelectorAll('[data-model]').forEach(function (container) {\n        const mid = container.getAttribute('data-model');\n        container.querySelectorAll('[data-input]').forEach(function (el) {\n          el.addEventListener('input', function () { computeFor(mid); });\n        });\n        computeFor(mid);\n      });\n    })();\n  })();<\/script> "], [" ", `<div class="page" data-astro-cid-n3tn3ng3> <nav class="crumb" data-astro-cid-n3tn3ng3> <a href="/" data-astro-cid-n3tn3ng3>Home</a> <span aria-hidden="true" data-astro-cid-n3tn3ng3>›</span> <span data-astro-cid-n3tn3ng3>yield</span> </nav> <header class="hero" data-astro-cid-n3tn3ng3> <p class="kicker" data-astro-cid-n3tn3ng3>YIELD · EXPERIMENTS · v1</p> <h1 class="display" data-astro-cid-n3tn3ng3>Five models. No commitments.</h1> <p class="dek" data-astro-cid-n3tn3ng3>
The DAO is deciding what "yield" looks like on PointCast. These
        are five candidate mechanics side-by-side. Each is a sandbox —
        tune the inputs, see monthly payouts, read the tradeoffs. None
        of them are live yet. Some will compose; some won't make it.
</p> </header> <section class="models" data-astro-cid-n3tn3ng3> `, ` </section> <section class="composition" data-astro-cid-n3tn3ng3> <p class="kicker" data-astro-cid-n3tn3ng3>COMPOSITION NOTE</p> <p data-astro-cid-n3tn3ng3>
These aren't mutually exclusive. The v3 strategy recommendation combines <a href="#attention" data-astro-cid-n3tn3ng3><strong data-astro-cid-n3tn3ng3>Model A (Attention Yield)</strong></a> as the headline mechanic (visible, constant, small drip) with <a href="#royalty" data-astro-cid-n3tn3ng3><strong data-astro-cid-n3tn3ng3>Model C (Royalty Router)</strong></a> as the funding source — so the yield you earn by visiting is literally paid for by the secondary-market activity that your collection drives. Self-reinforcing loop.
</p> <p data-astro-cid-n3tn3ng3> <a href="/dao" data-astro-cid-n3tn3ng3><strong data-astro-cid-n3tn3ng3>PC-0001</strong></a> at the DAO will be the first vote that binds real capital to any of these. Until then, this page exists to let everyone see the math.
</p> </section> <aside class="surfaces" data-astro-cid-n3tn3ng3> <p class="kicker" data-astro-cid-n3tn3ng3>RELATED</p> <ul class="surfaces__list" data-astro-cid-n3tn3ng3> <li data-astro-cid-n3tn3ng3><a href="/dao" data-astro-cid-n3tn3ng3><span class="mono" data-astro-cid-n3tn3ng3>DAO</span> /dao</a></li> <li data-astro-cid-n3tn3ng3><a href="/cast" data-astro-cid-n3tn3ng3><span class="mono" data-astro-cid-n3tn3ng3>PRIZE</span> /cast</a></li> <li data-astro-cid-n3tn3ng3><a href="/drum" data-astro-cid-n3tn3ng3><span class="mono" data-astro-cid-n3tn3ng3>DRUM</span> /drum</a></li> <li data-astro-cid-n3tn3ng3><a href="/yield.json" data-astro-cid-n3tn3ng3><span class="mono" data-astro-cid-n3tn3ng3>JSON</span> /yield.json</a></li> </ul> </aside> </div> <script>(function(){`, "\n    (function () {\n      /**\n       * Per-model payout calcs. Matches the \\`calcNote\\` on each model\n       * exactly. If the formula changes here, update the note.\n       */\n      const calcs = {\n        attention({ pool, wallets, share }) {\n          const base = pool / Math.max(1, wallets);\n          const capped = Math.min(share, 3);\n          return base * capped;\n        },\n        reflow({ tvl, apy, reflowPct, holders }) {\n          const weekly = (tvl * (apy / 100)) / 52;\n          const reflow = weekly * (reflowPct / 100);\n          const monthly = reflow * 4.33;\n          return monthly / Math.max(1, holders);\n        },\n        royalty({ volume, royalty, split, holders }) {\n          const fee = volume * (royalty / 100);\n          const holderPool = fee * (split / 100);\n          return holderPool / Math.max(1, holders);\n        },\n        stake({ weeklyMint, totalSupply, yourBalance }) {\n          const weekly = weeklyMint * (yourBalance / Math.max(1, totalSupply));\n          return weekly * 4.33;\n        },\n        baker({ tvl, kickback, holders }) {\n          const monthly = (tvl * (kickback / 100)) / 12;\n          return monthly / Math.max(1, holders);\n        },\n      };\n\n      const units = {\n        attention: { suffix: 'DRUM/mo', note: 'from the monthly pool, weighted by activity share, capped at 3× mean' },\n        reflow:    { suffix: 'ꜩ/mo',   note: 'your share of Prize Cast weekly yield reflowed to Visit Nouns holders' },\n        royalty:   { suffix: 'ꜩ/mo',   note: 'your slice of the royalty-router pool from secondary-market sales' },\n        stake:     { suffix: 'DRUM/mo', note: 'your pro-rata share of the weekly DRUM inflation' },\n        baker:     { suffix: 'ꜩ/mo',   note: 'your share of the baker kickback, distributed to holders weekly' },\n      };\n\n      function computeFor(modelId) {\n        const container = document.querySelector(\\`[data-model=\"\\${modelId}\"]\\`);\n        if (!container) return;\n        const inputs = {};\n        container.querySelectorAll('[data-input]').forEach(function (el) {\n          const k = el.getAttribute('data-input');\n          inputs[k] = Number(el.value);\n          const vEl = container.querySelector(\\`[data-value=\"\\${k}\"]\\`);\n          if (vEl) vEl.textContent = String(Number(el.value));\n        });\n\n        const calc = calcs[modelId];\n        if (!calc) return;\n        const result = calc(inputs);\n        const out = container.querySelector('[data-payout]');\n        const note = container.querySelector('[data-payout-note]');\n        const u = units[modelId];\n        if (out) {\n          const rounded = result >= 10 ? result.toFixed(2) : result.toFixed(3);\n          out.textContent = rounded + ' ' + u.suffix;\n        }\n        if (note) note.textContent = u.note;\n      }\n\n      document.querySelectorAll('[data-model]').forEach(function (container) {\n        const mid = container.getAttribute('data-model');\n        container.querySelectorAll('[data-input]').forEach(function (el) {\n          el.addEventListener('input', function () { computeFor(mid); });\n        });\n        computeFor(mid);\n      });\n    })();\n  })();<\/script> "])), maybeRenderHead(), MODELS.map((m) => renderTemplate`<article class="model"${addAttribute(m.id, "id")}${addAttribute(`--m-c: ${m.color}; --m-c50: ${m.color50};`, "style")} data-astro-cid-n3tn3ng3> <header class="model__head" data-astro-cid-n3tn3ng3> <span class="model__code mono" data-astro-cid-n3tn3ng3>MODEL ${m.code}</span> <h2 class="model__title" data-astro-cid-n3tn3ng3>${m.title}</h2> <span class="model__mod mono" data-astro-cid-n3tn3ng3>MOD · 0</span> </header> <p class="model__summary" data-astro-cid-n3tn3ng3>${m.summary}</p> <div class="model__mechanic" data-astro-cid-n3tn3ng3> <p class="kicker model__mechanic-label" data-astro-cid-n3tn3ng3>MECHANIC</p> <p class="model__mechanic-body" data-astro-cid-n3tn3ng3>${m.mechanic}</p> </div> <div class="model__sandbox"${addAttribute(m.id, "data-model")} data-astro-cid-n3tn3ng3> <p class="kicker" data-astro-cid-n3tn3ng3>SANDBOX · TUNE INPUTS</p> <div class="controls" data-astro-cid-n3tn3ng3> ${m.inputs.map((inp) => renderTemplate`<label class="ctrl" data-astro-cid-n3tn3ng3> <span class="ctrl__label mono" data-astro-cid-n3tn3ng3>${inp.label}</span> <div class="ctrl__row" data-astro-cid-n3tn3ng3> <input type="range"${addAttribute(inp.min, "min")}${addAttribute(inp.max, "max")}${addAttribute(inp.step, "step")}${addAttribute(inp.default, "value")}${addAttribute(inp.id, "data-input")} class="ctrl__slider" data-astro-cid-n3tn3ng3> <span class="ctrl__value mono"${addAttribute(inp.id, "data-value")} data-astro-cid-n3tn3ng3>${inp.default}</span> <span class="ctrl__unit mono" data-astro-cid-n3tn3ng3>${inp.unit}</span> </div> </label>`)} </div> <div class="readout" data-astro-cid-n3tn3ng3> <div class="readout__label mono" data-astro-cid-n3tn3ng3>MONTHLY PAYOUT · YOUR WALLET</div> <div class="readout__value" data-payout data-astro-cid-n3tn3ng3>—</div> <div class="readout__note mono" data-payout-note data-astro-cid-n3tn3ng3>computing…</div> </div> <p class="model__calc mono" data-astro-cid-n3tn3ng3>CALC · ${m.calcNote}</p> </div> <div class="model__tradeoffs" data-astro-cid-n3tn3ng3> <p class="kicker" data-astro-cid-n3tn3ng3>TRADEOFFS · ${m.tradeoffs.label.toUpperCase()}</p> <ul data-astro-cid-n3tn3ng3> ${m.tradeoffs.notes.map((n) => renderTemplate`<li data-astro-cid-n3tn3ng3>${n}</li>`)} </ul> </div> </article>`), defineScriptVars({ MODELS_DATA: MODELS.map((m) => ({ id: m.id, calc: m.id })) })) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/yield.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/yield.astro";
const $$url = "/yield";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Yield,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
