import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$MintButton } from './MintButton_BMx003SY.mjs';
import contracts from './contracts_B1zhgPPX.mjs';

const $$NounsCardsV2 = createComponent(($$result, $$props, $$slots) => {
  const KT1 = contracts.visit_nouns?.mainnet;
  const mintPriceMutez = Number(contracts.visit_nouns?.mintPriceMutez);
  const description = "A global set of 33 mintable PointCast Nouns cards: clean real Nouns and real Nouns staged with 3D depth.";
  const cards = [
    { id: 33, title: "Tokyo Dawn", route: "/tv", channel: "Tokyo", asset: "01", note: "Transit glow, vending light, first train signal." },
    { id: 88, title: "Seoul Switchboard", route: "/for-agents", channel: "Seoul", asset: "02", note: "Fast chat, bright rooms, agent-ready rhythm." },
    { id: 137, title: "Mexico City Air", route: "/now", channel: "Mexico City", asset: "03", note: "Morning traffic, museum colors, wide avenue pulse." },
    { id: 205, title: "Lagos Market", route: "/publish", channel: "Lagos", asset: "04", note: "Open-air commerce with a broadcast backbone." },
    { id: 217, title: "Nairobi Mesh", route: "/mesh", channel: "Nairobi", asset: "05", note: "Local nodes, open air, network heat." },
    { id: 284, title: "Mumbai Monsoon", route: "/room-weather", channel: "Mumbai", asset: "06", note: "Rain-bright streets and practical coordination." },
    { id: 313, title: "El Segundo Signal", route: "/local", channel: "El Segundo", asset: "07", note: "PointCast home base, coastal and operational." },
    { id: 354, title: "Dubai Nightline", route: "/timeline", channel: "Dubai", asset: "08", note: "Glass, desert, airport-time cadence." },
    { id: 387, title: "Singapore Ledger", route: "/editions", channel: "Singapore", asset: "09", note: "Clean rails, clean receipts, clean mint flow." },
    { id: 420, title: "Bangkok Orchard", route: "/garden-yield", channel: "Bangkok", asset: "10", note: "Street fruit, garden notes, humid evening light." },
    { id: 447, title: "Jakarta Dispatch", route: "/feed.xml", channel: "Jakarta", asset: "01", note: "Many islands, one signal surface." },
    { id: 501, title: "Sydney Current", route: "/new-ocean", channel: "Sydney", asset: "02", note: "Harbor motion and blue-hour collection energy." },
    { id: 523, title: "London Late Show", route: "/tv", channel: "London", asset: "03", note: "Rain on glass, borough-by-borough signal." },
    { id: 557, title: "Paris Archive", route: "/archive", channel: "Paris", asset: "04", note: "A card for notes, cafes, and tiny histories." },
    { id: 601, title: "Berlin Room", route: "/radio", channel: "Berlin", asset: "05", note: "Club-adjacent radio with sober tooling." },
    { id: 642, title: "Lisbon Light", route: "/walk", channel: "Lisbon", asset: "06", note: "Hill paths, tiled edges, a soft walking route." },
    { id: 689, title: "Reykjavik Beacon", route: "/beacon", channel: "Reykjavik", asset: "07", note: "North Atlantic quiet with a bright on-chain mark." },
    { id: 742, title: "New York Stack", route: "/stack", channel: "New York", asset: "08", note: "Dense blocks, faster publishing, louder proof." },
    { id: 777, title: "Toronto Commons", route: "/dao", channel: "Toronto", asset: "09", note: "Civic calm, public notes, shared mint rails." },
    { id: 808, title: "Vancouver Rain", route: "/moods", channel: "Vancouver", asset: "10", note: "Soft weather card for the evergreen loop." },
    { id: 842, title: "Los Angeles Field", route: "/tv/los-angeles", channel: "Los Angeles", asset: "01", note: "Wide signal, many neighborhoods, one card." },
    { id: 888, title: "Honolulu Drift", route: "/meditate", channel: "Honolulu", asset: "02", note: "Ocean rest, slower attention, mintable memory." },
    { id: 925, title: "Sao Paulo Pulse", route: "/sprint", channel: "Sao Paulo", asset: "03", note: "City-scale velocity with a clean collector layer." },
    { id: 969, title: "Buenos Aires Night", route: "/collabs", channel: "Buenos Aires", asset: "04", note: "Late dinner, bright rooms, collaborative dispatch." },
    { id: 1001, title: "Santiago Ridge", route: "/nature", channel: "Santiago", asset: "05", note: "Mountain line, clear sky, grounded proof." },
    { id: 1042, title: "Bogota Altitude", route: "/garden-yield", channel: "Bogota", asset: "06", note: "High city air and native-plant intelligence." },
    { id: 1077, title: "Cairo Sun", route: "/glossary", channel: "Cairo", asset: "07", note: "Old stone, new index, durable definitions." },
    { id: 1111, title: "Marrakech Courtyard", route: "/products", channel: "Marrakech", asset: "08", note: "Color, shade, objects with a collecting story." },
    { id: 1138, title: "Accra Broadcast", route: "/share", channel: "Accra", asset: "09", note: "Music, makers, outbound social signal." },
    { id: 1164, title: "Johannesburg Gold", route: "/collection", channel: "Johannesburg", asset: "10", note: "Marketplace energy and a clean Tezos path." },
    { id: 1189, title: "Istanbul Crossing", route: "/routes", channel: "Istanbul", asset: "01", note: "Two continents, one route map, mintable proof." },
    { id: 1193, title: "Taipei Packet", route: "/ai-stack", channel: "Taipei", asset: "02", note: "Silicon weather, small tools, bright packets." },
    { id: 1199, title: "Auckland Return", route: "/today", channel: "Auckland", asset: "03", note: "Tomorrow-facing card at the edge of the map." }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/nouns-cards-v2",
    name: "PointCast Nouns Cards v2",
    description,
    url: "https://pointcast.xyz/nouns-cards-v2"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Nouns Cards v2", "description": description, "jsonLd": jsonLd, "data-astro-cid-jg6zmvib": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="page" data-astro-cid-jg6zmvib> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-jg6zmvib> <a href="/" data-astro-cid-jg6zmvib>Home</a> <span aria-hidden="true" data-astro-cid-jg6zmvib>/</span> <span data-astro-cid-jg6zmvib>Nouns Cards v2</span> </nav> <header class="head" data-astro-cid-jg6zmvib> <p class="kicker" data-astro-cid-jg6zmvib>Actual Nouns · global 33 · Tezos mintable</p> <h1 data-astro-cid-jg6zmvib>Thirty-three real Nouns, wired for the world.</h1> <p data-astro-cid-jg6zmvib>
No generated fake Nouns. Every subject below is loaded directly from
<code data-astro-cid-jg6zmvib>noun.pics</code>. Direction A is clean and card-like. Direction B
        uses the generated PointCast backgrounds with 3D staging around the same real Noun art.
        Each card can mint through the Visit Nouns FA2 on Tezos mainnet.
</p> <div class="actions" data-astro-cid-jg6zmvib> <a href="#actual" data-astro-cid-jg6zmvib>Global 33</a> <a href="#depth" data-astro-cid-jg6zmvib>3D creative</a> <a${addAttribute(`https://objkt.com/collection/${KT1}`, "href")} target="_blank" rel="noopener" data-astro-cid-jg6zmvib>objkt collection</a> <a href="/collection/visit-nouns" data-astro-cid-jg6zmvib>Visit Nouns collection</a> <a href="/nouns-cards-v3" data-astro-cid-jg6zmvib>v3 grit edition</a> </div> </header> <section id="actual" class="section" aria-labelledby="actual-title" data-astro-cid-jg6zmvib> <div class="section__head" data-astro-cid-jg6zmvib> <p class="kicker" data-astro-cid-jg6zmvib>Direction A</p> <h2 id="actual-title" data-astro-cid-jg6zmvib>Global Nouns cards</h2> </div> <div class="clean-grid" data-astro-cid-jg6zmvib> ${cards.map((card) => renderTemplate`<article class="clean-card" data-astro-cid-jg6zmvib> <header data-astro-cid-jg6zmvib> <span data-astro-cid-jg6zmvib>POINTCAST</span> <span data-astro-cid-jg6zmvib>PCVN-${card.asset}</span> </header> <div class="clean-card__noun" data-astro-cid-jg6zmvib> <img${addAttribute(`https://noun.pics/${card.id}.svg`, "src")}${addAttribute(`Noun ${card.id}`, "alt")} width="320" height="320" loading="lazy" data-astro-cid-jg6zmvib> </div> <div class="clean-card__copy" data-astro-cid-jg6zmvib> <p data-astro-cid-jg6zmvib>${card.channel}</p> <h3 data-astro-cid-jg6zmvib>${card.title}</h3> <span data-astro-cid-jg6zmvib>Noun #${card.id} · real noun.pics SVG</span> <small data-astro-cid-jg6zmvib>${card.note}</small> </div> <footer data-astro-cid-jg6zmvib> <a${addAttribute(card.route, "href")} data-astro-cid-jg6zmvib>Route</a> <a${addAttribute(`https://objkt.com/tokens/${KT1}/${card.id}`, "href")} target="_blank" rel="noopener" data-astro-cid-jg6zmvib>objkt</a> <a${addAttribute(`https://noun.pics/${card.id}.svg`, "href")} target="_blank" rel="noopener" data-astro-cid-jg6zmvib>Noun SVG</a> </footer> <div class="mint-row" data-astro-cid-jg6zmvib> ${renderComponent($$result2, "MintButton", $$MintButton, { "contract": KT1, "tokenId": card.id, "priceMutez": mintPriceMutez, "label": "Mint on Tezos", "data-astro-cid-jg6zmvib": true })} </div> </article>`)} </div> </section> <section id="depth" class="section" aria-labelledby="depth-title" data-astro-cid-jg6zmvib> <div class="section__head" data-astro-cid-jg6zmvib> <p class="kicker" data-astro-cid-jg6zmvib>Direction B</p> <h2 id="depth-title" data-astro-cid-jg6zmvib>Global Nouns, 3D PointCast stages</h2> </div> <div class="depth-grid" data-astro-cid-jg6zmvib> ${cards.map((card, index) => renderTemplate`<article class="depth-card" data-astro-cid-jg6zmvib> <img class="depth-card__bg"${addAttribute(`/images/nouns-cards/pointcast-noun-card-${card.asset}.png`, "src")} alt="" width="1024" height="1024"${addAttribute(index < 3 ? "eager" : "lazy", "loading")} data-astro-cid-jg6zmvib> <div class="depth-card__scene" data-astro-cid-jg6zmvib> <header data-astro-cid-jg6zmvib> <span data-astro-cid-jg6zmvib>POINTCAST</span> <span data-astro-cid-jg6zmvib>NOUN #${card.id}</span> </header> <div class="depth-card__noun"${addAttribute(`Noun ${card.id}`, "aria-label")} data-astro-cid-jg6zmvib> <span class="depth-card__shadow" aria-hidden="true" data-astro-cid-jg6zmvib></span> <span class="depth-card__slab depth-card__slab--back" aria-hidden="true" data-astro-cid-jg6zmvib></span> <span class="depth-card__slab depth-card__slab--mid" aria-hidden="true" data-astro-cid-jg6zmvib></span> <img${addAttribute(`https://noun.pics/${card.id}.svg`, "src")}${addAttribute(`Noun ${card.id}`, "alt")} width="320" height="320" loading="lazy" data-astro-cid-jg6zmvib> </div> <div class="depth-card__copy" data-astro-cid-jg6zmvib> <p data-astro-cid-jg6zmvib>${card.channel}</p> <h3 data-astro-cid-jg6zmvib>${card.title}</h3> <span data-astro-cid-jg6zmvib>${card.note}</span> </div> </div> <footer data-astro-cid-jg6zmvib> <a${addAttribute(card.route, "href")} data-astro-cid-jg6zmvib>Open</a> <a${addAttribute(`https://noun.pics/${card.id}.svg`, "href")} target="_blank" rel="noopener" data-astro-cid-jg6zmvib>Real Noun</a> <a${addAttribute(`https://objkt.com/tokens/${KT1}/${card.id}`, "href")} target="_blank" rel="noopener" data-astro-cid-jg6zmvib>Tezos</a> </footer> <div class="depth-card__mint" data-astro-cid-jg6zmvib> ${renderComponent($$result2, "MintButton", $$MintButton, { "contract": KT1, "tokenId": card.id, "priceMutez": mintPriceMutez, "label": "Mint", "data-astro-cid-jg6zmvib": true })} </div> </article>`)} </div> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-cards-v2.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-cards-v2.astro";
const $$url = "/nouns-cards-v2";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsCardsV2,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
