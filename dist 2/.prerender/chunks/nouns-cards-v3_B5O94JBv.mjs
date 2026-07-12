import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$MintButton } from './MintButton_BMx003SY.mjs';
import contracts from './contracts_B1zhgPPX.mjs';

const $$NounsCardsV3 = createComponent(async ($$result, $$props, $$slots) => {
  const KT1 = contracts.visit_nouns?.mainnet;
  const mintPriceMutez = Number(contracts.visit_nouns?.mintPriceMutez);
  const description = "PointCast Nouns Cards v3: a 100-edition grit-art set with Tezos minting, local wallet view, and shareable cards.";
  const places = [
    "Brutalist Plaza",
    "Repair Shop",
    "Skate Park",
    "Forest Park",
    "Rec Court",
    "Basketball Hoops",
    "Rothko Wall",
    "Warhol Press",
    "Mondrian Yard",
    "Miro Lot",
    "Degas Room",
    "Monet Pond",
    "Picasso Alley",
    "Train Underpass",
    "Beach Ramp",
    "Civic Garage",
    "Night Market",
    "Backboard Garden",
    "Concrete Arcade",
    "Trail Kiosk"
  ];
  const tones = [
    "Charcoal",
    "Bone",
    "Faded Red",
    "Oxide Blue",
    "Park Green",
    "Old Gold",
    "Ink Black",
    "Dust Pink",
    "Teal Gray",
    "Concrete Lilac"
  ];
  const routes = [
    "/nouns-cards-v3",
    "/collection/visit-nouns",
    "/share",
    "/routes",
    "/walk",
    "/radio",
    "/play",
    "/room-weather",
    "/garden-yield",
    "/mesh"
  ];
  const notes = [
    "photocopied edge, gallery-safe grit",
    "monochrome filter, scuffed but tidy",
    "multi-noun scene, edition board energy",
    "place texture with clean mint rails",
    "art history nod, no fake Nouns"
  ];
  const nounIds = Array.from({ length: 100 }, (_, index) => (33 + index * 47) % 1200);
  const cards = nounIds.map((id, index) => ({
    id,
    edition: index + 1,
    title: `${places[index % places.length]} ${String(index + 1).padStart(2, "0")}`,
    place: places[index % places.length],
    tone: tones[index % tones.length],
    route: routes[index % routes.length],
    note: notes[index % notes.length],
    board: index % 3 + 1,
    panel: index % 4,
    multi: index % 7 === 0,
    partnerA: (id + 137) % 1200,
    partnerB: (id + 313) % 1200,
    filter: `filter-${index % 10}`
  }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/nouns-cards-v3",
    name: "PointCast Nouns Cards v3",
    description,
    url: "https://pointcast.xyz/nouns-cards-v3"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Nouns Cards v3", "description": description, "jsonLd": jsonLd, "data-astro-cid-pj6gvl2e": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="page"${addAttribute(KT1, "data-kt1")} data-astro-cid-pj6gvl2e> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-pj6gvl2e> <a href="/" data-astro-cid-pj6gvl2e>Home</a> <span data-astro-cid-pj6gvl2e>/</span> <a href="/nouns-cards-v2" data-astro-cid-pj6gvl2e>v2</a> <span data-astro-cid-pj6gvl2e>/</span> <span data-astro-cid-pj6gvl2e>v3</span> </nav> <header class="hero" data-astro-cid-pj6gvl2e> <p class="kicker" data-astro-cid-pj6gvl2e>Actual Nouns · 100 edition · Tezos mintable</p> <h1 data-astro-cid-pj6gvl2e>Grit boards for a global Nouns run.</h1> <p data-astro-cid-pj6gvl2e>
One hundred real <code data-astro-cid-pj6gvl2e>noun.pics</code> Nouns staged on PointCast boards:
        skate-mag texture, brutalist places, repair-shop dust, parks, courts, and
        art-history color systems. Conservative by default, rough at the edges.
</p> <div class="hero__actions" data-astro-cid-pj6gvl2e> <a href="#wallet" data-astro-cid-pj6gvl2e>Wallet view</a> <a href="#editions" data-astro-cid-pj6gvl2e>100 editions</a> <a href="#multi" data-astro-cid-pj6gvl2e>Multi-Noun scenes</a> <button type="button" data-share-page data-astro-cid-pj6gvl2e>Share v3</button> </div> </header> <section id="wallet" class="wallet" aria-labelledby="wallet-title" data-astro-cid-pj6gvl2e> <div data-astro-cid-pj6gvl2e> <p class="kicker" data-astro-cid-pj6gvl2e>Collected</p> <h2 id="wallet-title" data-astro-cid-pj6gvl2e>Your local mint wallet</h2> <p data-astro-cid-pj6gvl2e>
Successful mints from this browser are saved as receipts here. Each receipt links back to
          TzKT and can be shared as a small collector proof.
</p> </div> <div class="wallet__panel" data-astro-cid-pj6gvl2e> <p class="wallet__address" data-wallet-address data-astro-cid-pj6gvl2e>No wallet connected yet</p> <div class="wallet__grid" data-wallet-grid data-astro-cid-pj6gvl2e> <p class="wallet__empty" data-astro-cid-pj6gvl2e>Mint an edition below and it will appear here.</p> </div> </div> </section> <section id="multi" class="scene-strip" aria-label="Multi-Noun scene preview" data-astro-cid-pj6gvl2e> ${cards.filter((card) => card.multi).slice(0, 6).map((card) => renderTemplate`<article${addAttribute(`scene-strip__card ${card.filter}`, "class")} data-astro-cid-pj6gvl2e> <img${addAttribute(`https://noun.pics/${card.partnerA}.svg`, "src")}${addAttribute(`Noun ${card.partnerA}`, "alt")} loading="lazy" data-astro-cid-pj6gvl2e> <img${addAttribute(`https://noun.pics/${card.id}.svg`, "src")}${addAttribute(`Noun ${card.id}`, "alt")} loading="lazy" data-astro-cid-pj6gvl2e> <img${addAttribute(`https://noun.pics/${card.partnerB}.svg`, "src")}${addAttribute(`Noun ${card.partnerB}`, "alt")} loading="lazy" data-astro-cid-pj6gvl2e> <span data-astro-cid-pj6gvl2e>${card.place}</span> </article>`)} </section> <section id="editions" class="editions" aria-labelledby="editions-title" data-astro-cid-pj6gvl2e> <div class="section-head" data-astro-cid-pj6gvl2e> <p class="kicker" data-astro-cid-pj6gvl2e>Edition board</p> <h2 id="editions-title" data-astro-cid-pj6gvl2e>100 mintable cards</h2> </div> <div class="grid" data-astro-cid-pj6gvl2e> ${cards.map((card) => renderTemplate`<article${addAttribute(`card ${card.filter}`, "class")}${addAttribute(`edition-${card.edition}`, "id")}${addAttribute(`--board:url('/images/nouns-cards-v3/grit-board-0${card.board}.png'); --px:${card.panel % 2 * 100}%; --py:${card.panel > 1 ? 100 : 0}%;`, "style")}${addAttribute(card.edition, "data-edition")}${addAttribute(card.id, "data-token-id")}${addAttribute(card.title, "data-title")} data-astro-cid-pj6gvl2e> <header data-astro-cid-pj6gvl2e> <span data-astro-cid-pj6gvl2e>PCVN-GRIT</span> <span data-astro-cid-pj6gvl2e>${String(card.edition).padStart(3, "0")}/100</span> </header> <div class="art" data-astro-cid-pj6gvl2e> <div class="art__bg" data-astro-cid-pj6gvl2e></div> <div${addAttribute(`noun-stack ${card.multi ? "is-multi" : ""}`, "class")} data-astro-cid-pj6gvl2e> ${card.multi && renderTemplate`<img class="noun noun--side"${addAttribute(`https://noun.pics/${card.partnerA}.svg`, "src")}${addAttribute(`Noun ${card.partnerA}`, "alt")} loading="lazy" data-astro-cid-pj6gvl2e>`} <img class="noun noun--main"${addAttribute(`https://noun.pics/${card.id}.svg`, "src")}${addAttribute(`Noun ${card.id}`, "alt")} loading="lazy" data-astro-cid-pj6gvl2e> ${card.multi && renderTemplate`<img class="noun noun--side noun--right"${addAttribute(`https://noun.pics/${card.partnerB}.svg`, "src")}${addAttribute(`Noun ${card.partnerB}`, "alt")} loading="lazy" data-astro-cid-pj6gvl2e>`} </div> <span class="edition-badge" data-astro-cid-pj6gvl2e>${card.tone}</span> </div> <div class="copy" data-astro-cid-pj6gvl2e> <p data-astro-cid-pj6gvl2e>${card.place}</p> <h3 data-astro-cid-pj6gvl2e>${card.title}</h3> <span data-astro-cid-pj6gvl2e>Noun #${card.id} · ${card.note}</span> </div> <footer data-astro-cid-pj6gvl2e> <a${addAttribute(card.route, "href")} data-astro-cid-pj6gvl2e>Open</a> <a${addAttribute(`https://noun.pics/${card.id}.svg`, "href")} target="_blank" rel="noopener" data-astro-cid-pj6gvl2e>Noun</a> <a${addAttribute(`https://objkt.com/tokens/${KT1}/${card.id}`, "href")} target="_blank" rel="noopener" data-astro-cid-pj6gvl2e>objkt</a> <button type="button"${addAttribute(`#${card.edition} ${card.title}`, "data-share-card")} data-astro-cid-pj6gvl2e>Share</button> </footer> <div class="mint" data-astro-cid-pj6gvl2e> ${renderComponent($$result2, "MintButton", $$MintButton, { "contract": KT1, "tokenId": card.id, "priceMutez": mintPriceMutez, "label": "Mint edition", "data-astro-cid-pj6gvl2e": true })} </div> </article>`)} </div> </section> </main> ${renderScript($$result2, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-cards-v3.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-cards-v3.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-cards-v3.astro";
const $$url = "/nouns-cards-v3";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsCardsV3,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
