import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, u as unescapeHTML, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Cannabis = createComponent(($$result, $$props, $$slots) => {
  const effects = [
    {
      id: "lift",
      name: "Lift",
      tone: "#f5b441",
      prompt: "Bright, caffeinated, social",
      notes: "Citrus-forward hybrids for the first half of the day: coffee, errands, open tabs, walkable plans.",
      terps: ["limonene", "terpinolene", "pinene"],
      pairings: ["single-origin coffee", "beach walk", "sketchbook warmup"]
    },
    {
      id: "focus",
      name: "Focus",
      tone: "#259e8a",
      prompt: "Clear, narrow, useful",
      notes: "Green, herbal, and pine profiles for building, editing, spreadsheets, and low-friction flow.",
      terps: ["pinene", "caryophyllene", "humulene"],
      pairings: ["cold brew", "climbing gym", "code review"]
    },
    {
      id: "move",
      name: "Move",
      tone: "#e86f3a",
      prompt: "Body-on, sun-on",
      notes: "Functional, upbeat cultivars for skating slow, stretching, pickleball, cycling paths, and cleaning the house.",
      terps: ["limonene", "ocimene", "myrcene"],
      pairings: ["sparkling water", "pickleball", "longboard cruise"]
    },
    {
      id: "create",
      name: "Create",
      tone: "#b854b8",
      prompt: "Associative, visual, weird",
      notes: "Fruit, candy, gas, and bakery aromatics for music, drawing, cooking, writing, and studio tangents.",
      terps: ["limonene", "linalool", "beta-caryophyllene"],
      pairings: ["jazz records", "collage hour", "taco night"]
    },
    {
      id: "connect",
      name: "Connect",
      tone: "#d94d68",
      prompt: "Warm, talky, present",
      notes: "Gelato, Z, and dessert lanes for dinner, porch hangs, movie choosing, and telling the longer version of the story.",
      terps: ["linalool", "limonene", "caryophyllene"],
      pairings: ["NA spritz", "low-ABV beer", "backyard BBQ"]
    },
    {
      id: "settle",
      name: "Settle",
      tone: "#4c6db8",
      prompt: "Soft landing, screen dim",
      notes: "Heavier kush, cake, and GMO gravity for night mode, stretching, ambient music, and turning the day down.",
      terps: ["myrcene", "linalool", "caryophyllene"],
      pairings: ["chamomile", "yin yoga", "slow cinema"]
    }
  ];
  const strains = [
    {
      brand: "710 Labs",
      name: "Cake Crasher",
      lane: "settle",
      format: "flower / rosin lane",
      profile: "Wedding Cake x Wedding Crasher energy: vanilla, frosting, grape gas, plush body.",
      use: "Dinner-to-couch, dessert run, late creative review.",
      signal: "Dessert aromatics, likely THC-forward batches, look for beta-caryophyllene and limonene on COAs.",
      tags: ["dessert", "body", "premium"]
    },
    {
      brand: "710 Labs",
      name: "Garlic Cocktail",
      lane: "create",
      format: "flower / persy lane",
      profile: "GMO funk braided with mimosa citrus; savory, loud, strangely sunny.",
      use: "Cooking, beat digging, weird-good brainstorms.",
      signal: "Savory GMO + citrus usually reads as gas, orange, sulfur, and appetite-friendly creative drift.",
      tags: ["gmo", "citrus", "savory"]
    },
    {
      brand: "710 Labs",
      name: "Moonbow",
      lane: "connect",
      format: "flower / hash lane",
      profile: "Zkittlez family sweetness with soft cookie depth and a bright fruit finish.",
      use: "Friend hangs, playlists, gallery walk, movie night.",
      signal: "Z-family fruit can feel softer than its THC number; aroma is the first useful clue.",
      tags: ["z", "fruit", "social"]
    },
    {
      brand: "710 Labs",
      name: "Papaya",
      lane: "move",
      format: "hash-forward classic",
      profile: "Tropical, ripe, resinous, and easygoing without feeling too sleepy too early.",
      use: "Beach walk, stretching, farmers market loop.",
      signal: "Tropical hash lines often reward low-dose daytime use, especially when myrcene stays moderate.",
      tags: ["tropical", "hash", "sunny"]
    },
    {
      brand: "Cannabiotix",
      name: "Cereal Milk",
      lane: "connect",
      format: "flower",
      profile: "Creamy berry cereal, vanilla sugar, and a balanced hybrid posture.",
      use: "Brunch, conversation, low-stakes games.",
      signal: "Dessert genetics with a softer social center; compare batch COAs before assuming the same ride.",
      tags: ["creamy", "balanced", "dessert"]
    },
    {
      brand: "Cannabiotix",
      name: "L’Orange",
      lane: "lift",
      format: "flower",
      profile: "Orange peel, tang, and daytime sparkle; one of the classic CBX citrus lanes.",
      use: "Coffee walk, inbox clearing, Sunday reset.",
      signal: "Limonene-led citrus is the obvious scan; watch for terpinolene if it feels racier.",
      tags: ["orange", "daytime", "bright"]
    },
    {
      brand: "Cannabiotix",
      name: "Kush Mountains",
      lane: "settle",
      format: "flower",
      profile: "Earth, pine, OG gravity, and that old-school Southern California exhale.",
      use: "After-dinner decompression, body care, late album listen.",
      signal: "OG lanes are a good place to learn body heaviness, pine, pepper, and dose sensitivity.",
      tags: ["og", "pine", "night"]
    },
    {
      brand: "Cannabiotix",
      name: "Tropicanna",
      lane: "move",
      format: "flower",
      profile: "Tangie-adjacent citrus, berry, and lift; good when the day still has legs.",
      use: "Bike path, creative chores, beach volleyball spectating.",
      signal: "Bright fruit + citrus can be active, but strong batches still deserve a short leash.",
      tags: ["citrus", "active", "fruit"]
    },
    {
      brand: "Fig Farms",
      name: "Blue Face",
      lane: "focus",
      format: "flower",
      profile: "Fig Farms flagship-feeling gas, berry, and polished hybrid clarity.",
      use: "Deep work, editing, vinyl sorting, focused hang.",
      signal: "Gas and berry with enough structure to make a focus lane; compare inhale clarity to body drag.",
      tags: ["gas", "berry", "clarity"]
    },
    {
      brand: "Fig Farms",
      name: "Dark Karma",
      lane: "create",
      format: "flower",
      profile: "Complex, dark fruit, spice, and incense; a good strain for following strange ideas.",
      use: "Writing, drawing, ambient set, night-market wandering.",
      signal: "Best treated as an aromatic exploration strain: journal smell, onset, and idea density.",
      tags: ["spice", "incense", "visual"]
    },
    {
      brand: "Fig Farms",
      name: "Holy Moly!",
      lane: "lift",
      format: "flower",
      profile: "Bright, expressive, and aromatic; a lively counterpoint to the heavier Fig lanes.",
      use: "Morning notes, cafe work, thrift route.",
      signal: "Use as a light-lift reference point against heavier Fig Farms gas and cookie profiles.",
      tags: ["bright", "aromatic", "hybrid"]
    },
    {
      brand: "Fig Farms",
      name: "Animal Face",
      lane: "settle",
      format: "flower",
      profile: "Dense gas and animal-cookie gravity with a confident evening shape.",
      use: "Post-sport recovery, hot shower, documentary mode.",
      signal: "Animal/cookie/gas language usually asks for evening testing before daytime trust.",
      tags: ["gas", "cookie", "body"]
    }
  ];
  const researchCards = [
    {
      title: "Strain names are handles, not guarantees.",
      label: "Chemovar over cultivar",
      copy: "Scientific and market literature keeps pointing to chemical profiles - cannabinoids, terpenes, and other metabolites - as more useful than old indica/sativa buckets."
    },
    {
      title: "Terpenes help map aroma and preference.",
      label: "Aroma as data",
      copy: "Terpene profiles vary widely between cultivars and even within plants sold under the same name. Use aroma, COA, and lived notes together."
    },
    {
      title: "The entourage story is still unsettled.",
      label: "Evidence humility",
      copy: "Some work supports whole-plant complexity; other controlled studies show limited differences once THC is equalized. The page keeps effects as hypotheses."
    },
    {
      title: "Alcohol plus cannabis deserves a red flag.",
      label: "Pairing guardrail",
      copy: "Cannabis and alcohol can combine into more impairment than either alone. Pairing notes here are flavor/context notes, not escalation advice."
    }
  ];
  const terpeneGlossary = [
    ["Myrcene", "Earth, mango, clove", "Common in many cultivars; often associated by consumers with heavier body feel, but not a standalone promise."],
    ["Limonene", "Citrus peel", "Bright aroma marker found across many uplifting or dessert strains; check the rest of the profile before calling it energizing."],
    ["Pinene", "Pine, rosemary", "Useful focus-lane clue when paired with moderate THC and a clean onset."],
    ["Linalool", "Lavender, floral", "A softening note in many rest and connect lanes; dose and cannabinoid ratio matter more than aroma alone."],
    ["Caryophyllene", "Pepper, clove, gas", "A spicy sesquiterpene that often shows up in OG, cookie, cake, and GMO families."],
    ["Terpinolene", "Herbal, lime, tea tree", "Can read bright, quick, and sometimes racy; nice for lift, less nice if the setting is anxious."]
  ];
  const fieldProtocol = [
    ["1", "Read the COA", "Capture THC, CBD, total cannabinoids, top three terpenes, harvest date, and batch number."],
    ["2", "Smell before story", "Write aroma first: citrus, gas, cream, pine, earth, fruit, spice, funk. Then compare to the label."],
    ["3", "Start small", "Use the smallest meaningful amount and wait. Especially with concentrates, edibles, high THC, or new batches."],
    ["4", "Log the setting", "Sleep, food, caffeine, mood, activity, and company all change the experience. The strain is only one variable."],
    ["5", "Score after two hours", "Rate lift, focus, body, social ease, anxiety, appetite, and next-day residue. Patterns beat memory."]
  ];
  const pairings = [
    ["Coffee", "Lift / focus", "Keep the coffee ritual small and flavor-led: citrus strains with espresso, piney focus strains with cold brew."],
    ["Beer", "Connect / settle", "Treat this as a tasting note, not a challenge: low-ABV, food nearby, no driving, and skip if either substance hits hard."],
    ["Sport", "Move", "Best as a light pre-walk or post-game body check, not for reaction-time sports or anything with wheels in traffic."],
    ["Creativity", "Create / focus", "Candy-gas and incense profiles pair well with sketching, sampling, outlining, and permissive first drafts."],
    ["Food", "Connect", "Dessert strains want salty snacks; citrus strains want tacos, fruit, or bright salads; GMO wants the kitchen."],
    ["Rest", "Settle", "Kush, cake, and linalool-heavy lanes belong with stretching, warm light, and one less screen."]
  ];
  const sourceLinks = [
    ["710 Labs California", "https://710labs.com/california"],
    ["Cannabiotix strains", "https://www.cannabiotix.com/cbx-home"],
    ["Fig Farms strains", "https://figfarms.com/strains/"],
    ["Leafly effects and terpenes guide", "https://www.leafly.com/learn/cannabis-glossary/terpenes"],
    ["PMC: chemovar classification", "https://pmc.ncbi.nlm.nih.gov/articles/PMC12763883/"],
    ["PMC: terpene variation in Cannabis sativa", "https://pmc.ncbi.nlm.nih.gov/articles/PMC7479917/"],
    ["PMC: chemovar extracts and THC equalization", "https://pmc.ncbi.nlm.nih.gov/articles/PMC7819338/"],
    ["PMC: cannabis plus alcohol driving impairment", "https://pmc.ncbi.nlm.nih.gov/articles/PMC2722956/"]
  ];
  const title = "Cannabis Atlas";
  const description = "A Southern California cannabis resource for browsing strain names, chemovar signals, effects, terpenes, COA literacy, and pairings across 710 Labs, Cannabiotix, and Fig Farms.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/cannabis",
    name: "PointCast Cannabis Atlas",
    description,
    url: "https://pointcast.xyz/cannabis",
    applicationCategory: "LifestyleApplication",
    featureList: [
      "Interactive cannabis effects wheel",
      "Craft strain and chemovar explorer",
      "Terpene glossary and batch-reading protocol",
      "Coffee, beer, sport, activity, and creativity pairings",
      "Southern California abstract field-guide layout"
    ],
    isPartOf: {
      "@type": "WebSite",
      name: "PointCast",
      url: "https://pointcast.xyz"
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/cannabis/chemovar-atlas.png", "jsonLd": jsonLd, "data-astro-cid-xwjq3x5k": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", '<main class="canna-shell" data-astro-cid-xwjq3x5k> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-xwjq3x5k> <a href="/" data-astro-cid-xwjq3x5k>PointCast</a> <span aria-hidden="true" data-astro-cid-xwjq3x5k>/</span> <span data-astro-cid-xwjq3x5k>cannabis</span> </nav> <header class="hero" data-astro-cid-xwjq3x5k> <img src="/images/cannabis/chemovar-atlas.png" alt="" loading="eager" decoding="async" data-astro-cid-xwjq3x5k> <div class="hero__shade" aria-hidden="true" data-astro-cid-xwjq3x5k></div> <div class="hero__copy" data-astro-cid-xwjq3x5k> <p class="mono kicker" data-astro-cid-xwjq3x5k>SOUTHERN CALIFORNIA STRAIN RESOURCE · 21+</p> <h1 data-astro-cid-xwjq3x5k>Cannabis Atlas</h1> <p data-astro-cid-xwjq3x5k>\nStrain names are the doorway. The map is effects, aroma,\n          cannabinoids, terpenes, batch notes, setting, and a little humility.\n</p> <div class="hero__actions" data-astro-cid-xwjq3x5k> <a href="#resource" data-astro-cid-xwjq3x5k>Read the map</a> <a href="#strains" data-astro-cid-xwjq3x5k>Browse strains</a> </div> </div> </header> <section class="notice" aria-label="Responsible-use note" data-astro-cid-xwjq3x5k> <strong data-astro-cid-xwjq3x5k>Field-guide note:</strong> <span data-astro-cid-xwjq3x5k>Effects are subjective and product availability changes. This is not medical advice. Adults 21+ only; do not drive impaired, and be extra conservative when pairing cannabis with alcohol.</span> </section> <section id="resource" class="resource-section" aria-labelledby="resource-title" data-astro-cid-xwjq3x5k> <div class="section-head" data-astro-cid-xwjq3x5k> <p class="mono kicker" data-astro-cid-xwjq3x5k>RESOURCE MODEL</p> <h2 id="resource-title" data-astro-cid-xwjq3x5k>Use the strain name, then keep reading.</h2> <p data-astro-cid-xwjq3x5k>A good cannabis resource should help you compare batches, not memorize folklore. The working model here is name + brand + chemovar + aroma + reported effect + setting.</p> </div> <div class="research-grid" data-astro-cid-xwjq3x5k> ', ' </div> </section> <section id="wheel" class="wheel-section" aria-labelledby="wheel-title" data-astro-cid-xwjq3x5k> <div class="section-head" data-astro-cid-xwjq3x5k> <p class="mono kicker" data-astro-cid-xwjq3x5k>EFFECTS WHEEL FIRST</p> <h2 id="wheel-title" data-astro-cid-xwjq3x5k>Pick the state you want to enter.</h2> <p data-astro-cid-xwjq3x5k>Each spoke is a useful starting mood, not a promise. Terpenes, dose, tolerance, food, sleep, and setting all move the needle.</p> </div> <div class="wheel-grid" data-astro-cid-xwjq3x5k> <div class="wheel-wrap" data-astro-cid-xwjq3x5k> <div class="wheel" aria-hidden="true" data-astro-cid-xwjq3x5k> ', ' <div class="wheel__center" data-astro-cid-xwjq3x5k> <span class="mono" data-astro-cid-xwjq3x5k>POINTCAST</span> <strong data-astro-cid-xwjq3x5k>Effects</strong> </div> </div> </div> <article class="effect-panel" id="effect-panel" data-astro-cid-xwjq3x5k> <p class="mono" data-effect-kicker data-astro-cid-xwjq3x5k>ACTIVE SPOKE</p> <h3 data-effect-name data-astro-cid-xwjq3x5k>', "</h3> <strong data-effect-prompt data-astro-cid-xwjq3x5k>", "</strong> <p data-effect-notes data-astro-cid-xwjq3x5k>", '</p> <div class="tag-row" data-effect-terps data-astro-cid-xwjq3x5k> ', " </div> <ul data-effect-pairings data-astro-cid-xwjq3x5k> ", ' </ul> </article> </div> </section> <section id="strains" class="strains" aria-labelledby="strains-title" data-astro-cid-xwjq3x5k> <div class="section-head section-head--row" data-astro-cid-xwjq3x5k> <div data-astro-cid-xwjq3x5k> <p class="mono kicker" data-astro-cid-xwjq3x5k>710 LABS · CBX · FIG FARMS</p> <h2 id="strains-title" data-astro-cid-xwjq3x5k>Craft lanes worth tracking.</h2> </div> <div class="controls" aria-label="Strain filters" data-astro-cid-xwjq3x5k> <button type="button" data-filter="all" aria-pressed="true" data-astro-cid-xwjq3x5k>All</button> ', ' </div> </div> <div class="strain-grid" data-astro-cid-xwjq3x5k> ', ' </div> </section> <section class="terpenes" aria-labelledby="terpenes-title" data-astro-cid-xwjq3x5k> <div class="section-head" data-astro-cid-xwjq3x5k> <p class="mono kicker" data-astro-cid-xwjq3x5k>TERPENE FIELD NOTES</p> <h2 id="terpenes-title" data-astro-cid-xwjq3x5k>Aroma is useful data, not destiny.</h2> <p data-astro-cid-xwjq3x5k>Terpenes shape aroma and may help differentiate chemovars. Consumer effects still depend on dose, cannabinoid ratio, tolerance, route, and setting.</p> </div> <div class="terpene-grid" data-astro-cid-xwjq3x5k> ', ' </div> </section> <section class="protocol" aria-labelledby="protocol-title" data-astro-cid-xwjq3x5k> <div data-astro-cid-xwjq3x5k> <p class="mono kicker" data-astro-cid-xwjq3x5k>PERSONAL RESEARCH PROTOCOL</p> <h2 id="protocol-title" data-astro-cid-xwjq3x5k>Build your own strain memory.</h2> <p data-astro-cid-xwjq3x5k>For a real resource, the explorer should eventually let visitors save structured tasting notes. This is the logging grammar.</p> </div> <ol data-astro-cid-xwjq3x5k> ', ' </ol> </section> <section class="pairings" aria-labelledby="pairings-title" data-astro-cid-xwjq3x5k> <div class="section-head" data-astro-cid-xwjq3x5k> <p class="mono kicker" data-astro-cid-xwjq3x5k>PAIRING MAP</p> <h2 id="pairings-title" data-astro-cid-xwjq3x5k>Coffee, beer, motion, making.</h2> </div> <div class="pairing-list" data-astro-cid-xwjq3x5k> ', ' </div> </section> <section class="sources" aria-labelledby="sources-title" data-astro-cid-xwjq3x5k> <div data-astro-cid-xwjq3x5k> <p class="mono kicker" data-astro-cid-xwjq3x5k>SOURCE NOTES</p> <h2 id="sources-title" data-astro-cid-xwjq3x5k>A living draft, grounded but not frozen.</h2> </div> <p data-astro-cid-xwjq3x5k>\nBrand lineups rotate by drop and dispensary. These notes were shaped\n        from current public brand surfaces, general terpene education, and\n        published chemovar research, then translated into a PointCast\n        effects-first browsing model.\n</p> <ul data-astro-cid-xwjq3x5k> ', " </ul> </section> </main> <script>", "<\/script> <script>\n    const effects = window.__pcCannabisEffects || [];\n    const byId = new Map(effects.map((effect) => [effect.id, effect]));\n    const wheelButtons = Array.from(document.querySelectorAll('[data-effect]'));\n    const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));\n    const cards = Array.from(document.querySelectorAll('[data-lane]'));\n    const panel = document.querySelector('#effect-panel');\n\n    function renderEffect(id) {\n      const effect = byId.get(id) || effects[0];\n      if (!effect || !panel) return;\n      panel.style.setProperty('--active-tone', effect.tone);\n      panel.querySelector('[data-effect-name]').textContent = effect.name;\n      panel.querySelector('[data-effect-prompt]').textContent = effect.prompt;\n      panel.querySelector('[data-effect-notes]').textContent = effect.notes;\n      panel.querySelector('[data-effect-terps]').innerHTML = effect.terps.map((terp) => `<span>${terp}</span>`).join('');\n      panel.querySelector('[data-effect-pairings]').innerHTML = effect.pairings.map((pairing) => `<li>${pairing}</li>`).join('');\n      wheelButtons.forEach((button) => button.setAttribute('aria-pressed', button.dataset.effect === effect.id ? 'true' : 'false'));\n    }\n\n    function filterStrains(id) {\n      filterButtons.forEach((button) => button.setAttribute('aria-pressed', button.dataset.filter === id ? 'true' : 'false'));\n      cards.forEach((card) => {\n        const visible = id === 'all' || card.dataset.lane === id;\n        card.toggleAttribute('hidden', !visible);\n      });\n    }\n\n    wheelButtons.forEach((button) => {\n      button.addEventListener('click', () => {\n        renderEffect(button.dataset.effect);\n        filterStrains(button.dataset.effect);\n      });\n    });\n\n    filterButtons.forEach((button) => {\n      button.addEventListener('click', () => filterStrains(button.dataset.filter));\n    });\n\n    renderEffect('lift');\n  <\/script> "], [" ", '<main class="canna-shell" data-astro-cid-xwjq3x5k> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-xwjq3x5k> <a href="/" data-astro-cid-xwjq3x5k>PointCast</a> <span aria-hidden="true" data-astro-cid-xwjq3x5k>/</span> <span data-astro-cid-xwjq3x5k>cannabis</span> </nav> <header class="hero" data-astro-cid-xwjq3x5k> <img src="/images/cannabis/chemovar-atlas.png" alt="" loading="eager" decoding="async" data-astro-cid-xwjq3x5k> <div class="hero__shade" aria-hidden="true" data-astro-cid-xwjq3x5k></div> <div class="hero__copy" data-astro-cid-xwjq3x5k> <p class="mono kicker" data-astro-cid-xwjq3x5k>SOUTHERN CALIFORNIA STRAIN RESOURCE · 21+</p> <h1 data-astro-cid-xwjq3x5k>Cannabis Atlas</h1> <p data-astro-cid-xwjq3x5k>\nStrain names are the doorway. The map is effects, aroma,\n          cannabinoids, terpenes, batch notes, setting, and a little humility.\n</p> <div class="hero__actions" data-astro-cid-xwjq3x5k> <a href="#resource" data-astro-cid-xwjq3x5k>Read the map</a> <a href="#strains" data-astro-cid-xwjq3x5k>Browse strains</a> </div> </div> </header> <section class="notice" aria-label="Responsible-use note" data-astro-cid-xwjq3x5k> <strong data-astro-cid-xwjq3x5k>Field-guide note:</strong> <span data-astro-cid-xwjq3x5k>Effects are subjective and product availability changes. This is not medical advice. Adults 21+ only; do not drive impaired, and be extra conservative when pairing cannabis with alcohol.</span> </section> <section id="resource" class="resource-section" aria-labelledby="resource-title" data-astro-cid-xwjq3x5k> <div class="section-head" data-astro-cid-xwjq3x5k> <p class="mono kicker" data-astro-cid-xwjq3x5k>RESOURCE MODEL</p> <h2 id="resource-title" data-astro-cid-xwjq3x5k>Use the strain name, then keep reading.</h2> <p data-astro-cid-xwjq3x5k>A good cannabis resource should help you compare batches, not memorize folklore. The working model here is name + brand + chemovar + aroma + reported effect + setting.</p> </div> <div class="research-grid" data-astro-cid-xwjq3x5k> ', ' </div> </section> <section id="wheel" class="wheel-section" aria-labelledby="wheel-title" data-astro-cid-xwjq3x5k> <div class="section-head" data-astro-cid-xwjq3x5k> <p class="mono kicker" data-astro-cid-xwjq3x5k>EFFECTS WHEEL FIRST</p> <h2 id="wheel-title" data-astro-cid-xwjq3x5k>Pick the state you want to enter.</h2> <p data-astro-cid-xwjq3x5k>Each spoke is a useful starting mood, not a promise. Terpenes, dose, tolerance, food, sleep, and setting all move the needle.</p> </div> <div class="wheel-grid" data-astro-cid-xwjq3x5k> <div class="wheel-wrap" data-astro-cid-xwjq3x5k> <div class="wheel" aria-hidden="true" data-astro-cid-xwjq3x5k> ', ' <div class="wheel__center" data-astro-cid-xwjq3x5k> <span class="mono" data-astro-cid-xwjq3x5k>POINTCAST</span> <strong data-astro-cid-xwjq3x5k>Effects</strong> </div> </div> </div> <article class="effect-panel" id="effect-panel" data-astro-cid-xwjq3x5k> <p class="mono" data-effect-kicker data-astro-cid-xwjq3x5k>ACTIVE SPOKE</p> <h3 data-effect-name data-astro-cid-xwjq3x5k>', "</h3> <strong data-effect-prompt data-astro-cid-xwjq3x5k>", "</strong> <p data-effect-notes data-astro-cid-xwjq3x5k>", '</p> <div class="tag-row" data-effect-terps data-astro-cid-xwjq3x5k> ', " </div> <ul data-effect-pairings data-astro-cid-xwjq3x5k> ", ' </ul> </article> </div> </section> <section id="strains" class="strains" aria-labelledby="strains-title" data-astro-cid-xwjq3x5k> <div class="section-head section-head--row" data-astro-cid-xwjq3x5k> <div data-astro-cid-xwjq3x5k> <p class="mono kicker" data-astro-cid-xwjq3x5k>710 LABS · CBX · FIG FARMS</p> <h2 id="strains-title" data-astro-cid-xwjq3x5k>Craft lanes worth tracking.</h2> </div> <div class="controls" aria-label="Strain filters" data-astro-cid-xwjq3x5k> <button type="button" data-filter="all" aria-pressed="true" data-astro-cid-xwjq3x5k>All</button> ', ' </div> </div> <div class="strain-grid" data-astro-cid-xwjq3x5k> ', ' </div> </section> <section class="terpenes" aria-labelledby="terpenes-title" data-astro-cid-xwjq3x5k> <div class="section-head" data-astro-cid-xwjq3x5k> <p class="mono kicker" data-astro-cid-xwjq3x5k>TERPENE FIELD NOTES</p> <h2 id="terpenes-title" data-astro-cid-xwjq3x5k>Aroma is useful data, not destiny.</h2> <p data-astro-cid-xwjq3x5k>Terpenes shape aroma and may help differentiate chemovars. Consumer effects still depend on dose, cannabinoid ratio, tolerance, route, and setting.</p> </div> <div class="terpene-grid" data-astro-cid-xwjq3x5k> ', ' </div> </section> <section class="protocol" aria-labelledby="protocol-title" data-astro-cid-xwjq3x5k> <div data-astro-cid-xwjq3x5k> <p class="mono kicker" data-astro-cid-xwjq3x5k>PERSONAL RESEARCH PROTOCOL</p> <h2 id="protocol-title" data-astro-cid-xwjq3x5k>Build your own strain memory.</h2> <p data-astro-cid-xwjq3x5k>For a real resource, the explorer should eventually let visitors save structured tasting notes. This is the logging grammar.</p> </div> <ol data-astro-cid-xwjq3x5k> ', ' </ol> </section> <section class="pairings" aria-labelledby="pairings-title" data-astro-cid-xwjq3x5k> <div class="section-head" data-astro-cid-xwjq3x5k> <p class="mono kicker" data-astro-cid-xwjq3x5k>PAIRING MAP</p> <h2 id="pairings-title" data-astro-cid-xwjq3x5k>Coffee, beer, motion, making.</h2> </div> <div class="pairing-list" data-astro-cid-xwjq3x5k> ', ' </div> </section> <section class="sources" aria-labelledby="sources-title" data-astro-cid-xwjq3x5k> <div data-astro-cid-xwjq3x5k> <p class="mono kicker" data-astro-cid-xwjq3x5k>SOURCE NOTES</p> <h2 id="sources-title" data-astro-cid-xwjq3x5k>A living draft, grounded but not frozen.</h2> </div> <p data-astro-cid-xwjq3x5k>\nBrand lineups rotate by drop and dispensary. These notes were shaped\n        from current public brand surfaces, general terpene education, and\n        published chemovar research, then translated into a PointCast\n        effects-first browsing model.\n</p> <ul data-astro-cid-xwjq3x5k> ', " </ul> </section> </main> <script>", "<\/script> <script>\n    const effects = window.__pcCannabisEffects || [];\n    const byId = new Map(effects.map((effect) => [effect.id, effect]));\n    const wheelButtons = Array.from(document.querySelectorAll('[data-effect]'));\n    const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));\n    const cards = Array.from(document.querySelectorAll('[data-lane]'));\n    const panel = document.querySelector('#effect-panel');\n\n    function renderEffect(id) {\n      const effect = byId.get(id) || effects[0];\n      if (!effect || !panel) return;\n      panel.style.setProperty('--active-tone', effect.tone);\n      panel.querySelector('[data-effect-name]').textContent = effect.name;\n      panel.querySelector('[data-effect-prompt]').textContent = effect.prompt;\n      panel.querySelector('[data-effect-notes]').textContent = effect.notes;\n      panel.querySelector('[data-effect-terps]').innerHTML = effect.terps.map((terp) => \\`<span>\\${terp}</span>\\`).join('');\n      panel.querySelector('[data-effect-pairings]').innerHTML = effect.pairings.map((pairing) => \\`<li>\\${pairing}</li>\\`).join('');\n      wheelButtons.forEach((button) => button.setAttribute('aria-pressed', button.dataset.effect === effect.id ? 'true' : 'false'));\n    }\n\n    function filterStrains(id) {\n      filterButtons.forEach((button) => button.setAttribute('aria-pressed', button.dataset.filter === id ? 'true' : 'false'));\n      cards.forEach((card) => {\n        const visible = id === 'all' || card.dataset.lane === id;\n        card.toggleAttribute('hidden', !visible);\n      });\n    }\n\n    wheelButtons.forEach((button) => {\n      button.addEventListener('click', () => {\n        renderEffect(button.dataset.effect);\n        filterStrains(button.dataset.effect);\n      });\n    });\n\n    filterButtons.forEach((button) => {\n      button.addEventListener('click', () => filterStrains(button.dataset.filter));\n    });\n\n    renderEffect('lift');\n  <\/script> "])), maybeRenderHead(), researchCards.map((card) => renderTemplate`<article data-astro-cid-xwjq3x5k> <span class="mono" data-astro-cid-xwjq3x5k>${card.label}</span> <h3 data-astro-cid-xwjq3x5k>${card.title}</h3> <p data-astro-cid-xwjq3x5k>${card.copy}</p> </article>`), effects.map((effect, index) => renderTemplate`<button class="wheel__spoke" type="button"${addAttribute(effect.id, "data-effect")}${addAttribute(`--i:${index}; --tone:${effect.tone};`, "style")}${addAttribute(`Show ${effect.name}`, "aria-label")} data-astro-cid-xwjq3x5k> <span data-astro-cid-xwjq3x5k>${effect.name}</span> </button>`), effects[0].name, effects[0].prompt, effects[0].notes, effects[0].terps.map((terp) => renderTemplate`<span data-astro-cid-xwjq3x5k>${terp}</span>`), effects[0].pairings.map((pairing) => renderTemplate`<li data-astro-cid-xwjq3x5k>${pairing}</li>`), effects.map((effect) => renderTemplate`<button type="button"${addAttribute(effect.id, "data-filter")} data-astro-cid-xwjq3x5k>${effect.name}</button>`), strains.map((strain) => renderTemplate`<article class="strain-card"${addAttribute(strain.lane, "data-lane")} data-astro-cid-xwjq3x5k> <div class="strain-card__top" data-astro-cid-xwjq3x5k> <span class="brand" data-astro-cid-xwjq3x5k>${strain.brand}</span> <span class="format" data-astro-cid-xwjq3x5k>${strain.format}</span> </div> <h3 data-astro-cid-xwjq3x5k>${strain.name}</h3> <p data-astro-cid-xwjq3x5k>${strain.profile}</p> <strong data-astro-cid-xwjq3x5k>${strain.use}</strong> <small data-astro-cid-xwjq3x5k>${strain.signal}</small> <div class="tag-row" data-astro-cid-xwjq3x5k> ${strain.tags.map((tag) => renderTemplate`<span data-astro-cid-xwjq3x5k>${tag}</span>`)} </div> </article>`), terpeneGlossary.map(([name, aroma, copy]) => renderTemplate`<article data-astro-cid-xwjq3x5k> <span class="mono" data-astro-cid-xwjq3x5k>${aroma}</span> <h3 data-astro-cid-xwjq3x5k>${name}</h3> <p data-astro-cid-xwjq3x5k>${copy}</p> </article>`), fieldProtocol.map(([step, name, copy]) => renderTemplate`<li data-astro-cid-xwjq3x5k> <span class="mono" data-astro-cid-xwjq3x5k>${step}</span> <strong data-astro-cid-xwjq3x5k>${name}</strong> <p data-astro-cid-xwjq3x5k>${copy}</p> </li>`), pairings.map(([name, lane, copy]) => renderTemplate`<article data-astro-cid-xwjq3x5k> <span class="mono" data-astro-cid-xwjq3x5k>${lane}</span> <h3 data-astro-cid-xwjq3x5k>${name}</h3> <p data-astro-cid-xwjq3x5k>${copy}</p> </article>`), sourceLinks.map(([label, href]) => renderTemplate`<li data-astro-cid-xwjq3x5k><a${addAttribute(href, "href")} target="_blank" rel="noopener" data-astro-cid-xwjq3x5k>${label}</a></li>`), unescapeHTML(`window.__pcCannabisEffects = ${JSON.stringify(effects)};`)) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cannabis.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cannabis.astro";
const $$url = "/cannabis";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Cannabis,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
