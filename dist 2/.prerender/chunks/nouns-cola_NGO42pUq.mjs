import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$NounsCola = createComponent(($$result, $$props, $$slots) => {
  const FORMULA = [
    { label: "Serving", value: "12 oz can", note: "Carbonated cola, chilled" },
    { label: "Sweetness", value: "10.8 Brix", note: "Classic cane profile, not syrup-heavy" },
    { label: "Acid target", value: "pH 2.8-3.2", note: "Cola snap with citrus lift" },
    { label: "Caffeine", value: "34 mg", note: "Per 12 oz pilot can" },
    { label: "Sodium", value: "35 mg", note: "Small salt line for finish" },
    { label: "QA gate", value: "3 rounds", note: "Bench, forced-carb, co-packer sample" }
  ];
  const ADAPTOGEN_LANES = [
    {
      lane: "Formula 01",
      profile: "Classic cola pilot",
      effect: "Taste, nostalgia, clean operating proof",
      evidence: "Strongest launch case",
      note: "Best first run. Simplest regulatory and sensory story."
    },
    {
      lane: "Formula 02",
      profile: "Calm-focus cola",
      effect: "Stress-support angle via ashwagandha",
      evidence: "Most supported adaptogen lane, but safety-sensitive",
      note: "Requires ingredient review, dosage discipline, and claims restraint."
    },
    {
      lane: "Formula 03",
      profile: "Daytime stamina cola",
      effect: "Fatigue/focus angle via rhodiola or ginseng",
      evidence: "Mixed evidence",
      note: "More speculative. Better as a later R&D branch than the opening pitch."
    }
  ];
  const FUNDABLE_RULES = [
    "Fund the beverage pilot first: formula lock, co-packer quote, compliance review, and purchase order packet.",
    "Treat adaptogen work as a gated R&D lane, not the thing the whole raise depends on.",
    "Do not make disease, anxiety, cortisol, cognition, or performance claims that trigger a bigger regulatory burden.",
    "Only advance an adaptogen SKU after counsel, formulator, and label review agree on ingredient, dose, and packaging language."
  ];
  const STAGES = [
    {
      id: "formulation",
      title: "Formulation",
      kicker: "FORMULA 01",
      copy: "Crisp cola, cane sugar, light citrus, gentle salt, and a Nouns label system. Final recipe still needs a beverage scientist and co-packer validation before sale.",
      metric: "3 QA rounds"
    },
    {
      id: "fundraising",
      title: "Fundraising",
      kicker: "RAISE",
      copy: "Preorder crates, sponsor pallets, and one DAO-style proposal. Capital funds R&D, pilot inventory, legal/compliance review, launch media, and reserve.",
      metric: "$120k target"
    },
    {
      id: "financing",
      title: "Contribute",
      kicker: "STACK",
      copy: "Taste panel, case preorder, crate sponsor, retail door, pallet sponsor, or a legal-reviewed inventory facility.",
      metric: "6 lanes"
    },
    {
      id: "production",
      title: "Production",
      kicker: "BUILD",
      copy: "Pilot through a beverage co-packer: formula lock, label approval, cans, carbonation, pack-out, freight, and PointCast shipment updates.",
      metric: "2.4k case pilot"
    },
    {
      id: "profit",
      title: "Profit",
      kicker: "MODEL",
      copy: "Blend direct-to-community cases with wholesale doors. The model below exposes unit economics instead of hiding them.",
      metric: "live calculator"
    },
    {
      id: "yield",
      title: "Yield",
      kicker: "SURPLUS",
      copy: "Yield here means project surplus routing: replenish production, fund the PointCast treasury, bonus the team, and seed the next drop. Not an investment product.",
      metric: "split by policy"
    }
  ];
  const RAISE = [
    { item: "Recipe R&D and lab validation", amount: "$12,000" },
    { item: "Pilot can run deposit", amount: "$38,000" },
    { item: "Inventory, freight, cold storage", amount: "$44,000" },
    { item: "PointCast launch media and sampling", amount: "$16,000" },
    { item: "Compliance, reserve, surprises", amount: "$10,000" }
  ];
  const CONTRIBUTIONS = [
    { lane: "Taste panel", ask: "$0 / time", unlocks: "Formula feedback, blind tasting notes, reorder signal", status: "open" },
    { lane: "Case preorder", ask: "$72", unlocks: "One 24-can case reserved from the pilot run", status: "draft" },
    { lane: "Crate sponsor", ask: "$576", unlocks: "Eight cases for team, studio, shop, event, or local door", status: "draft" },
    { lane: "Retail door", ask: "10-case PO", unlocks: "Wholesale demand proof before production cash is locked", status: "target" },
    { lane: "Pallet sponsor", ask: "$3,456", unlocks: "Forty-eight cases plus sponsor credit on PointCast", status: "target" },
    { lane: "Inventory facility", ask: "$5k+ draft", unlocks: "Short-term inventory float repaid from receipts if approved", status: "legal review" }
  ];
  const INVENTORY_FINANCING = [
    { use: "Co-packer deposit", amount: "$38,000", source: "facility + crate sponsors" },
    { use: "Landed inventory", amount: "$44,000", source: "facility + case preorders" },
    { use: "Fulfillment float", amount: "$14,000", source: "case preorders" },
    { use: "Retail terms buffer", amount: "$14,000", source: "facility reserve" },
    { use: "First-loss reserve", amount: "$10,000", source: "treasury / sponsor holdback" }
  ];
  const WATERFALL = [
    "Preorders and sponsor crates reserve product, not financial upside.",
    "Inventory facility funds are released only after formula lock, co-packer quote, label review, and purchase order packet.",
    "Sales receipts first replenish fulfillment costs and pay supplier balances.",
    "If counsel approves an inventory facility, receipts then repay approved facility principal before surplus routing.",
    "Remaining surplus follows the yield policy: next run, PointCast treasury, growth, and team pool."
  ];
  const PRODUCTION = [
    { step: "01", title: "Bench formula", detail: "Taste map, caffeine target, acid balance, shelf-life questions." },
    { step: "02", title: "Co-packer sample", detail: "Forced-carbonated samples, ingredient substitutions, process notes." },
    { step: "03", title: "Label and carton", detail: "Nouns Cola can art, nutrition panel placeholder, barcode, shipper." },
    { step: "04", title: "Pilot run", detail: "Can, pack, palletize, QC holds, freight release." },
    { step: "05", title: "PointCast drop", detail: "Preorders, sponsor crates, shop handoff, weekly production updates." }
  ];
  const DEFAULTS = {
    cases: 2400,
    directShare: 64,
    directPrice: 3.75,
    wholesalePrice: 1.85,
    productionCost: 0.82,
    fixedCost: 42e3,
    raiseTarget: 12e4,
    yieldSplit: 30
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://pointcast.xyz/nouns-cola",
        name: "Nouns Cola",
        description: "A PointCast operating page for Nouns Cola: formulation, contributions, inventory financing, production, profit, and yield.",
        url: "https://pointcast.xyz/nouns-cola",
        inLanguage: "en-US"
      },
      {
        "@type": "Product",
        "@id": "https://pointcast.xyz/nouns-cola#product",
        name: "Nouns Cola",
        brand: { "@type": "Brand", name: "Nouns Cola" },
        category: "Carbonated soft drink concept",
        image: "https://pointcast.xyz/images/nouns-cola/nouns-cola-pack.png",
        description: "A concept cola pilot using Nouns-inspired CC0 art language and a transparent PointCast production model."
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://pointcast.xyz/nouns-cola#breadcrumb",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://pointcast.xyz/" },
          { "@type": "ListItem", position: 2, name: "Nouns Cola", item: "https://pointcast.xyz/nouns-cola" }
        ]
      }
    ]
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Nouns Cola", "description": "Nouns Cola on PointCast: formulation, contributions, inventory financing, production, profit, and yield in one operating page.", "image": "/images/og/nouns-cola.png", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/nouns-cola.json", title: "Nouns Cola operating plan (JSON)" }], "frame": {
    image: "https://pointcast.xyz/images/og/nouns-cola.png",
    buttons: [
      { label: "Open Nouns Cola", action: "link", target: "https://pointcast.xyz/nouns-cola" },
      { label: "Play game", action: "link", target: "https://pointcast.xyz/nouns-cola-crush" },
      { label: "Run the model", action: "link", target: "https://pointcast.xyz/nouns-cola#model" },
      { label: "Agent JSON", action: "link", target: "https://pointcast.xyz/nouns-cola.json" }
    ]
  }, "data-astro-cid-shmtiewe": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="cola-page" data-astro-cid-shmtiewe> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-shmtiewe> <a href="/" data-astro-cid-shmtiewe>Home</a> <span aria-hidden="true" data-astro-cid-shmtiewe>/</span> <span data-astro-cid-shmtiewe>Nouns Cola</span> </nav> <header class="hero" data-astro-cid-shmtiewe> <div class="hero__copy" data-astro-cid-shmtiewe> <p class="kicker" data-astro-cid-shmtiewe>NOUNS COLA / POINTCAST PILOT</p> <h1 class="display" data-astro-cid-shmtiewe>Nouns Cola</h1> <p class="dek" data-astro-cid-shmtiewe>\nA working operating page for the drink: formulation, contributions,\n          inventory financing, production, profit, and surplus yield. One place\n          to tune the can run, see the economics, and get the team pointed at\n          the same board.\n</p> <div class="hero__actions" aria-label="Primary actions" data-astro-cid-shmtiewe> <a class="btn btn--primary" href="#model" data-astro-cid-shmtiewe>Run model</a> <a class="btn btn--ghost" href="/next-sprint" data-astro-cid-shmtiewe>Next sprint</a> <a class="btn btn--ghost" href="/nouns-cola-crush" data-astro-cid-shmtiewe>Play game</a> <a class="btn btn--ghost" href="/nouns-cola-fundraise" data-astro-cid-shmtiewe>Fundable brief</a> <a class="btn btn--ghost" href="#financing" data-astro-cid-shmtiewe>Financing plan</a> <a class="btn btn--ghost" href="/nouns-cola.json" data-astro-cid-shmtiewe>Agent JSON</a> </div> </div> <figure class="hero__visual" data-astro-cid-shmtiewe> <img src="/images/nouns-cola/nouns-cola-pack.png" alt="Nouns Cola cans and pilot pack" width="1600" height="1200" data-astro-cid-shmtiewe> <figcaption class="mono" data-astro-cid-shmtiewe>FORMULA 01 / 12 OZ CAN / GO TEAM</figcaption> </figure> </header> <section class="status" aria-label="Pilot status" data-astro-cid-shmtiewe> <div data-astro-cid-shmtiewe><span class="mono" data-astro-cid-shmtiewe>STATUS</span><strong data-astro-cid-shmtiewe>Alpha board</strong></div> <div data-astro-cid-shmtiewe><span class="mono" data-astro-cid-shmtiewe>PILOT</span><strong data-astro-cid-shmtiewe>2,400 cases</strong></div> <div data-astro-cid-shmtiewe><span class="mono" data-astro-cid-shmtiewe>RAISE</span><strong data-astro-cid-shmtiewe>$120k target</strong></div> <div data-astro-cid-shmtiewe><span class="mono" data-astro-cid-shmtiewe>INVENTORY</span><strong data-astro-cid-shmtiewe>$120k stack</strong></div> <div data-astro-cid-shmtiewe><span class="mono" data-astro-cid-shmtiewe>ROUTE</span><strong data-astro-cid-shmtiewe>PointCast</strong></div> </section> <section class="sprint-callout" aria-label="Current sprint" data-astro-cid-shmtiewe> <div data-astro-cid-shmtiewe> <p class="kicker" data-astro-cid-shmtiewe>NEXT SPRINT</p> <h2 data-astro-cid-shmtiewe>Collect proof before the can run.</h2> <p data-astro-cid-shmtiewe>\nThe launch sprint turns this board and the game into measurable signal:\n          taste-panel slots, preorder intent, sponsor leads, retail doors, and\n          co-packer quotes.\n</p> </div> <a class="btn btn--primary" href="/next-sprint" data-astro-cid-shmtiewe>Open sprint board</a> </section> <section class="flow" aria-label="Operating flow" data-astro-cid-shmtiewe> ', ' </section> <section class="band" id="formulation" data-astro-cid-shmtiewe> <div class="section-head" data-astro-cid-shmtiewe> <p class="kicker" data-astro-cid-shmtiewe>FORMULATION</p> <h2 data-astro-cid-shmtiewe>Cola target, not mystery syrup.</h2> <p data-astro-cid-shmtiewe>\nFormula 01 is a practical pilot spec: a familiar cola body, a crisp\n          acid line, a little citrus, and a can identity that feels native to\n          Nouns without needing permission. Final ingredient and nutrition\n          details should be locked with a qualified beverage formulator.\n</p> </div> <div class="formula-grid" data-astro-cid-shmtiewe> ', ' </div> </section> <section class="band" id="fundable-formulation" data-astro-cid-shmtiewe> <div class="section-head" data-astro-cid-shmtiewe> <p class="kicker" data-astro-cid-shmtiewe>FUNDABLE FORMULATION</p> <h2 data-astro-cid-shmtiewe>Make the raise legible, then earn the functional lane.</h2> <p data-astro-cid-shmtiewe>\nThe investor-clean move is a classic cola pilot with an explicit\n          adaptogen research branch. That keeps the first run pitchable while\n          still leaving room for a calm-focus or stamina SKU after validation.\n</p> </div> <div class="contribution-grid" aria-label="Formula lanes" data-astro-cid-shmtiewe> ', ' </div> <div class="finance__split" data-astro-cid-shmtiewe> <div class="finance-stack" data-astro-cid-shmtiewe> <p class="kicker" data-astro-cid-shmtiewe>WHY THIS IS FUNDABLE</p> ', ' </div> <div class="waterfall" data-astro-cid-shmtiewe> <p class="kicker" data-astro-cid-shmtiewe>RULES OF THE ROAD</p> <ol data-astro-cid-shmtiewe> ', ' </ol> <p class="finance-note" data-astro-cid-shmtiewe>\nCurrent evidence read: ashwagandha is the strongest stress-support\n            candidate, while rhodiola and ginseng remain more mixed. That makes\n            adaptogens a real R&D branch, not a free marketing claim.\n</p> </div> </div> </section> <section class="band band--split" id="fundraising" data-astro-cid-shmtiewe> <div class="section-head" data-astro-cid-shmtiewe> <p class="kicker" data-astro-cid-shmtiewe>FUNDRAISING</p> <h2 data-astro-cid-shmtiewe>Raise only what the pilot can explain.</h2> <p data-astro-cid-shmtiewe>\nThe clean raise is operational: prove the formula, buy the run, ship\n          the cans, and report back through PointCast. No vague hype pool.\n          Every dollar has a job before the first pallet moves.\n</p> </div> <div class="raise-table" aria-label="Fundraising uses" data-astro-cid-shmtiewe> ', ' <div class="raise-row raise-row--total" data-astro-cid-shmtiewe> <span data-astro-cid-shmtiewe>Total target</span> <strong data-astro-cid-shmtiewe>$120,000</strong> </div> </div> </section> <section class="band finance" id="financing" data-astro-cid-shmtiewe> <div class="section-head" data-astro-cid-shmtiewe> <p class="kicker" data-astro-cid-shmtiewe>CONTRIBUTION / INVENTORY FINANCING</p> <h2 data-astro-cid-shmtiewe>Separate the help from the float.</h2> <p data-astro-cid-shmtiewe>\nContributions should be simple: taste, preorder, sponsor, open a door,\n          or help move product. Inventory financing is a separate draft facility\n          that only moves after quotes, compliance, and legal review.\n</p> </div> <div class="contribution-grid" aria-label="Contribution lanes" data-astro-cid-shmtiewe> ', ' </div> <div class="finance__split" data-astro-cid-shmtiewe> <div class="finance-stack" data-astro-cid-shmtiewe> <p class="kicker" data-astro-cid-shmtiewe>USES OF CAPITAL</p> ', ' </div> <div class="waterfall" data-astro-cid-shmtiewe> <p class="kicker" data-astro-cid-shmtiewe>RECEIPT WATERFALL</p> <ol data-astro-cid-shmtiewe> ', ' </ol> <p class="finance-note" data-astro-cid-shmtiewe>\nDraft only: no inventory note, repayment premium, revenue share, or\n            contributor return is live until reviewed and approved by qualified\n            counsel. Product preorders can ship product; they do not create a\n            financial claim.\n</p> </div> </div> </section> <section class="band" id="production" data-astro-cid-shmtiewe> <div class="section-head" data-astro-cid-shmtiewe> <p class="kicker" data-astro-cid-shmtiewe>PRODUCTION</p> <h2 data-astro-cid-shmtiewe>Five moves from bench to broadcast.</h2> </div> <ol class="timeline" data-astro-cid-shmtiewe> ', ' </ol> </section> <section class="model" id="model" data-calculator data-astro-cid-shmtiewe> <div class="section-head" data-astro-cid-shmtiewe> <p class="kicker" data-astro-cid-shmtiewe>PROFIT / YIELD MODEL</p> <h2 data-astro-cid-shmtiewe>Move the sliders. Watch the run breathe.</h2> <p data-astro-cid-shmtiewe>\nPlanning math only. Revenue, margin, and surplus routing are estimates,\n          not an offering, investment promise, or final production quote.\n</p> </div> <div class="model__grid" data-astro-cid-shmtiewe> <div class="controls" aria-label="Pilot model controls" data-astro-cid-shmtiewe> <label class="ctrl" data-astro-cid-shmtiewe> <span class="ctrl__label mono" data-astro-cid-shmtiewe>Pilot cases</span> <input type="range" min="600" max="10000" step="100"', ' data-input="cases" data-astro-cid-shmtiewe> <output class="ctrl__value mono" data-value="cases" data-astro-cid-shmtiewe>', '</output> </label> <label class="ctrl" data-astro-cid-shmtiewe> <span class="ctrl__label mono" data-astro-cid-shmtiewe>Direct sell-through %</span> <input type="range" min="0" max="100" step="1"', ' data-input="directShare" data-astro-cid-shmtiewe> <output class="ctrl__value mono" data-value="directShare" data-astro-cid-shmtiewe>', '%</output> </label> <label class="ctrl" data-astro-cid-shmtiewe> <span class="ctrl__label mono" data-astro-cid-shmtiewe>Direct price / can</span> <input type="range" min="2.5" max="6" step="0.05"', ' data-input="directPrice" data-astro-cid-shmtiewe> <output class="ctrl__value mono" data-value="directPrice" data-astro-cid-shmtiewe>$', '</output> </label> <label class="ctrl" data-astro-cid-shmtiewe> <span class="ctrl__label mono" data-astro-cid-shmtiewe>Wholesale price / can</span> <input type="range" min="1.1" max="3.25" step="0.05"', ' data-input="wholesalePrice" data-astro-cid-shmtiewe> <output class="ctrl__value mono" data-value="wholesalePrice" data-astro-cid-shmtiewe>$', '</output> </label> <label class="ctrl" data-astro-cid-shmtiewe> <span class="ctrl__label mono" data-astro-cid-shmtiewe>Production cost / can</span> <input type="range" min="0.45" max="1.8" step="0.01"', ' data-input="productionCost" data-astro-cid-shmtiewe> <output class="ctrl__value mono" data-value="productionCost" data-astro-cid-shmtiewe>$', '</output> </label> <label class="ctrl" data-astro-cid-shmtiewe> <span class="ctrl__label mono" data-astro-cid-shmtiewe>Fixed launch cost</span> <input type="range" min="10000" max="100000" step="1000"', ' data-input="fixedCost" data-astro-cid-shmtiewe> <output class="ctrl__value mono" data-value="fixedCost" data-astro-cid-shmtiewe>$', '</output> </label> <label class="ctrl" data-astro-cid-shmtiewe> <span class="ctrl__label mono" data-astro-cid-shmtiewe>Raise target</span> <input type="range" min="40000" max="250000" step="5000"', ' data-input="raiseTarget" data-astro-cid-shmtiewe> <output class="ctrl__value mono" data-value="raiseTarget" data-astro-cid-shmtiewe>$', '</output> </label> <label class="ctrl" data-astro-cid-shmtiewe> <span class="ctrl__label mono" data-astro-cid-shmtiewe>Surplus yield split %</span> <input type="range" min="0" max="60" step="1"', ' data-input="yieldSplit" data-astro-cid-shmtiewe> <output class="ctrl__value mono" data-value="yieldSplit" data-astro-cid-shmtiewe>', `%</output> </label> </div> <div class="readouts" aria-live="polite" data-astro-cid-shmtiewe> <article class="readout readout--hero" data-astro-cid-shmtiewe> <span class="mono" data-astro-cid-shmtiewe>PROJECTED PROFIT</span> <strong data-out="profit" data-astro-cid-shmtiewe>$0</strong> <p data-out="profitNote" data-astro-cid-shmtiewe>After production, freight, fees, and fixed launch costs.</p> </article> <article class="readout" data-astro-cid-shmtiewe> <span class="mono" data-astro-cid-shmtiewe>CANS</span> <strong data-out="cans" data-astro-cid-shmtiewe>0</strong> </article> <article class="readout" data-astro-cid-shmtiewe> <span class="mono" data-astro-cid-shmtiewe>REVENUE</span> <strong data-out="revenue" data-astro-cid-shmtiewe>$0</strong> </article> <article class="readout" data-astro-cid-shmtiewe> <span class="mono" data-astro-cid-shmtiewe>TOTAL COST</span> <strong data-out="cost" data-astro-cid-shmtiewe>$0</strong> </article> <article class="readout" data-astro-cid-shmtiewe> <span class="mono" data-astro-cid-shmtiewe>GROSS MARGIN</span> <strong data-out="margin" data-astro-cid-shmtiewe>0%</strong> </article> <article class="readout" data-astro-cid-shmtiewe> <span class="mono" data-astro-cid-shmtiewe>RAISE GAP</span> <strong data-out="raiseGap" data-astro-cid-shmtiewe>$0</strong> </article> <article class="readout" data-astro-cid-shmtiewe> <span class="mono" data-astro-cid-shmtiewe>SURPLUS YIELD POOL</span> <strong data-out="yieldPool" data-astro-cid-shmtiewe>$0</strong> </article> <article class="readout" data-astro-cid-shmtiewe> <span class="mono" data-astro-cid-shmtiewe>BREAK-EVEN</span> <strong data-out="breakEven" data-astro-cid-shmtiewe>0 cases</strong> </article> </div> </div> </section> <section class="band" id="yield" data-astro-cid-shmtiewe> <div class="section-head" data-astro-cid-shmtiewe> <p class="kicker" data-astro-cid-shmtiewe>YIELD POLICY</p> <h2 data-astro-cid-shmtiewe>Surplus routes before vibes.</h2> <p data-astro-cid-shmtiewe>
If the pilot clears its costs, the default policy splits the upside
          into working capital and community-visible pools. This keeps Nouns
          Cola from becoming a one-run novelty.
</p> </div> <div class="policy" data-astro-cid-shmtiewe> <div data-astro-cid-shmtiewe><span class="mono" data-astro-cid-shmtiewe>40%</span><strong data-astro-cid-shmtiewe>Next production run</strong><p data-astro-cid-shmtiewe>Cans, ingredients, freight, storage.</p></div> <div data-astro-cid-shmtiewe><span class="mono" data-astro-cid-shmtiewe>30%</span><strong data-astro-cid-shmtiewe>PointCast treasury</strong><p data-astro-cid-shmtiewe>Broadcast ops, blocks, creative proofs.</p></div> <div data-astro-cid-shmtiewe><span class="mono" data-astro-cid-shmtiewe>20%</span><strong data-astro-cid-shmtiewe>Nouns Cola growth</strong><p data-astro-cid-shmtiewe>Sampling, wholesale doors, collabs.</p></div> <div data-astro-cid-shmtiewe><span class="mono" data-astro-cid-shmtiewe>10%</span><strong data-astro-cid-shmtiewe>Team bonus pool</strong><p data-astro-cid-shmtiewe>Formulation, operations, design, sales.</p></div> </div> </section> <section class="team" data-astro-cid-shmtiewe> <div data-astro-cid-shmtiewe> <p class="kicker" data-astro-cid-shmtiewe>GO TEAM</p> <h2 data-astro-cid-shmtiewe>PointCast gets the board moving.</h2> </div> <ul data-astro-cid-shmtiewe> <li data-astro-cid-shmtiewe><strong data-astro-cid-shmtiewe>Formulator</strong><span data-astro-cid-shmtiewe>lock taste and QA gates</span></li> <li data-astro-cid-shmtiewe><strong data-astro-cid-shmtiewe>Fundraiser</strong><span data-astro-cid-shmtiewe>preorders, sponsors, DAO brief</span></li> <li data-astro-cid-shmtiewe><strong data-astro-cid-shmtiewe>Producer</strong><span data-astro-cid-shmtiewe>co-packer, cans, freight</span></li> <li data-astro-cid-shmtiewe><strong data-astro-cid-shmtiewe>PointCast</strong><span data-astro-cid-shmtiewe>updates, JSON, public operating log</span></li> </ul> </section> </div> <script>
    (function () {
      const root = document.querySelector('[data-calculator]');
      if (!root) return;

      const money = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      });
      const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

      const valueFormats = {
        cases: (v) => number.format(v),
        directShare: (v) => v.toFixed(0) + '%',
        directPrice: (v) => '$' + v.toFixed(2),
        wholesalePrice: (v) => '$' + v.toFixed(2),
        productionCost: (v) => '$' + v.toFixed(2),
        fixedCost: (v) => money.format(v),
        raiseTarget: (v) => money.format(v),
        yieldSplit: (v) => v.toFixed(0) + '%',
      };

      function getInputs() {
        const values = {};
        root.querySelectorAll('[data-input]').forEach(function (input) {
          const key = input.getAttribute('data-input');
          values[key] = Number(input.value);
          const out = root.querySelector('[data-value="' + key + '"]');
          if (out && valueFormats[key]) out.textContent = valueFormats[key](values[key]);
        });
        return values;
      }

      function setOut(key, value) {
        const el = root.querySelector('[data-out="' + key + '"]');
        if (el) el.textContent = value;
      }

      function recalc() {
        const v = getInputs();
        const cansPerCase = 24;
        const freightPerCase = 4.2;
        const paymentAndSpoilagePerCan = 0.16;
        const cans = v.cases * cansPerCase;
        const direct = v.directShare / 100;
        const blendedPrice = direct * v.directPrice + (1 - direct) * v.wholesalePrice;
        const revenue = cans * blendedPrice;
        const variableCost = cans * (v.productionCost + paymentAndSpoilagePerCan) + v.cases * freightPerCase;
        const cost = variableCost + v.fixedCost;
        const profit = revenue - cost;
        const margin = revenue > 0 ? profit / revenue : 0;
        const yieldPool = Math.max(0, profit) * (v.yieldSplit / 100);
        const raiseGap = Math.max(0, v.raiseTarget - revenue * 0.35);
        const perCaseContribution = cansPerCase * blendedPrice - cansPerCase * (v.productionCost + paymentAndSpoilagePerCan) - freightPerCase;
        const breakEven = perCaseContribution > 0 ? Math.ceil(v.fixedCost / perCaseContribution) : Infinity;

        setOut('cans', number.format(cans));
        setOut('revenue', money.format(revenue));
        setOut('cost', money.format(cost));
        setOut('profit', money.format(profit));
        setOut('margin', (margin * 100).toFixed(1) + '%');
        setOut('yieldPool', money.format(yieldPool));
        setOut('raiseGap', money.format(raiseGap));
        setOut('breakEven', Number.isFinite(breakEven) ? number.format(breakEven) + ' cases' : 'no break-even');
        setOut('profitNote', profit >= 0
          ? 'Positive run. Surplus can route to treasury, next production, growth, and team pool.'
          : 'Negative run. Lower fixed cost, raise price, improve direct sales, or resize the pilot.');
      }

      root.querySelectorAll('[data-input]').forEach(function (input) {
        input.addEventListener('input', recalc);
      });
      recalc();
    })();
  <\/script> `])), maybeRenderHead(), STAGES.map((stage) => renderTemplate`<a class="flow__item"${addAttribute(`#${stage.id}`, "href")} data-astro-cid-shmtiewe> <span class="flow__kicker mono" data-astro-cid-shmtiewe>${stage.kicker}</span> <strong data-astro-cid-shmtiewe>${stage.title}</strong> <span data-astro-cid-shmtiewe>${stage.metric}</span> </a>`), FORMULA.map((item) => renderTemplate`<article class="spec" data-astro-cid-shmtiewe> <span class="mono" data-astro-cid-shmtiewe>${item.label}</span> <strong data-astro-cid-shmtiewe>${item.value}</strong> <p data-astro-cid-shmtiewe>${item.note}</p> </article>`), ADAPTOGEN_LANES.map((item) => renderTemplate`<article class="contribution" data-astro-cid-shmtiewe> <span class="mono" data-astro-cid-shmtiewe>${item.lane}</span> <strong data-astro-cid-shmtiewe>${item.profile}</strong> <p data-astro-cid-shmtiewe>${item.effect}</p> <em data-astro-cid-shmtiewe>${item.evidence}</em> <small data-astro-cid-shmtiewe>${item.note}</small> </article>`), [
    ["Pilot story", "Simple cola is easier to taste, quote, label, and reorder."],
    ["Risk control", "Adaptogen work stays behind review gates instead of infecting the whole launch."],
    ["Optional upside", "If Formula 02 lands, it becomes a second SKU, not a rescue mission for SKU one."],
    ["Operator honesty", "The board shows what is proved now and what still needs evidence."]
  ].map(([label, copy]) => renderTemplate`<div class="finance-row" data-astro-cid-shmtiewe> <span data-astro-cid-shmtiewe>${label}</span> <strong data-astro-cid-shmtiewe>${copy}</strong> </div>`), FUNDABLE_RULES.map((step) => renderTemplate`<li data-astro-cid-shmtiewe>${step}</li>`), RAISE.map((row) => renderTemplate`<div class="raise-row" data-astro-cid-shmtiewe> <span data-astro-cid-shmtiewe>${row.item}</span> <strong data-astro-cid-shmtiewe>${row.amount}</strong> </div>`), CONTRIBUTIONS.map((item) => renderTemplate`<article class="contribution" data-astro-cid-shmtiewe> <span class="mono" data-astro-cid-shmtiewe>${item.status}</span> <strong data-astro-cid-shmtiewe>${item.lane}</strong> <p data-astro-cid-shmtiewe>${item.unlocks}</p> <em data-astro-cid-shmtiewe>${item.ask}</em> </article>`), INVENTORY_FINANCING.map((row) => renderTemplate`<div class="finance-row" data-astro-cid-shmtiewe> <span data-astro-cid-shmtiewe>${row.use}</span> <strong data-astro-cid-shmtiewe>${row.amount}</strong> <small data-astro-cid-shmtiewe>${row.source}</small> </div>`), WATERFALL.map((step) => renderTemplate`<li data-astro-cid-shmtiewe>${step}</li>`), PRODUCTION.map((item) => renderTemplate`<li data-astro-cid-shmtiewe> <span class="timeline__step mono" data-astro-cid-shmtiewe>${item.step}</span> <div data-astro-cid-shmtiewe> <strong data-astro-cid-shmtiewe>${item.title}</strong> <p data-astro-cid-shmtiewe>${item.detail}</p> </div> </li>`), addAttribute(DEFAULTS.cases, "value"), DEFAULTS.cases, addAttribute(DEFAULTS.directShare, "value"), DEFAULTS.directShare, addAttribute(DEFAULTS.directPrice, "value"), DEFAULTS.directPrice, addAttribute(DEFAULTS.wholesalePrice, "value"), DEFAULTS.wholesalePrice, addAttribute(DEFAULTS.productionCost, "value"), DEFAULTS.productionCost, addAttribute(DEFAULTS.fixedCost, "value"), DEFAULTS.fixedCost, addAttribute(DEFAULTS.raiseTarget, "value"), DEFAULTS.raiseTarget, addAttribute(DEFAULTS.yieldSplit, "value"), DEFAULTS.yieldSplit) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-cola.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-cola.astro";
const $$url = "/nouns-cola";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsCola,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
