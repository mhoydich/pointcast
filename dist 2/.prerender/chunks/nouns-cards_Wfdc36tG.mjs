import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import contracts from './contracts_B1zhgPPX.mjs';

const $$NounsCards = createComponent(($$result, $$props, $$slots) => {
  const KT1 = contracts.visit_nouns?.mainnet;
  const description = "Ten real Nouns cards using noun.pics artwork, generated PointCast frames, and Tezos collection links.";
  const cards = [
    { id: 313, title: "Marine Layer", route: "/now", channel: "Front Door", asset: "01", note: "Morning signal from El Segundo." },
    { id: 523, title: "Night Broadcast", route: "/tv", channel: "Broadcast", asset: "02", note: "A late-screen card for the live surface." },
    { id: 742, title: "Main Street", route: "/dao", channel: "El Segundo", asset: "03", note: "Civic card, property-dream edition." },
    { id: 1042, title: "Garden Node", route: "/garden-yield", channel: "Garden", asset: "04", note: "Native planting, local yield, calm data." },
    { id: 1189, title: "Mint Console", route: "/collection/visit-nouns", channel: "Tezos", asset: "05", note: "Visit Nouns FA2, ready to collect." },
    { id: 284, title: "Radio Room", route: "/radio", channel: "Sound", asset: "06", note: "PointCast as a room you can hear." },
    { id: 387, title: "Arcade Signal", route: "/nouns-cola-crush", channel: "Play", asset: "07", note: "Game-night card for playful loops." },
    { id: 601, title: "Ocean Sit", route: "/meditate", channel: "Meditate", asset: "08", note: "Quiet card for a softer return." },
    { id: 808, title: "Agent Desk", route: "/for-agents", channel: "Agents", asset: "09", note: "Machine-readable, human-friendly." },
    { id: 925, title: "Court Lights", route: "/play", channel: "Sports", asset: "10", note: "Fast taps, clean frames, shared play." }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/nouns-cards",
    name: "PointCast Nouns Cards",
    description,
    url: "https://pointcast.xyz/nouns-cards",
    hasPart: cards.map((card) => ({
      "@type": "ImageObject",
      name: `${card.title} · Noun #${card.id}`,
      contentUrl: `https://pointcast.xyz/images/nouns-cards/pointcast-noun-card-${card.asset}.png`,
      about: `PointCast ${card.channel}`
    }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Nouns Cards", "description": description, "jsonLd": jsonLd, "data-astro-cid-bv4uflpl": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="page" data-astro-cid-bv4uflpl> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-bv4uflpl> <a href="/" data-astro-cid-bv4uflpl>Home</a> <span aria-hidden="true" data-astro-cid-bv4uflpl>/</span> <span data-astro-cid-bv4uflpl>Nouns Cards</span> </nav> <header class="head" data-astro-cid-bv4uflpl> <p class="kicker" data-astro-cid-bv4uflpl>Generated backgrounds · PointCast card lab</p> <h1 data-astro-cid-bv4uflpl>Ten Nouns cards for the front door.</h1> <p data-astro-cid-bv4uflpl>
Real Noun artwork from noun.pics, generated PointCast frames behind it,
        exact HTML labels on top, and live links into the Visit Nouns Tezos collection.
</p> <div class="actions" data-astro-cid-bv4uflpl> <a href="/nouns-portraits" data-astro-cid-bv4uflpl>Mint portraits</a> <a href="/collection/visit-nouns" data-astro-cid-bv4uflpl>Visit Nouns collection</a> <a${addAttribute(`https://tzkt.io/${KT1}`, "href")} target="_blank" rel="noopener" data-astro-cid-bv4uflpl>TzKT contract</a> </div> </header> <section class="grid" aria-label="Generated PointCast Nouns cards" data-astro-cid-bv4uflpl> ${cards.map((card, index) => renderTemplate`<article class="card" data-astro-cid-bv4uflpl> <img class="card__bg"${addAttribute(`/images/nouns-cards/pointcast-noun-card-${card.asset}.png`, "src")} alt="" width="1024" height="1024"${addAttribute(index < 4 ? "eager" : "lazy", "loading")} data-astro-cid-bv4uflpl> <div class="card__mat" data-astro-cid-bv4uflpl> <div class="card__top" data-astro-cid-bv4uflpl> <span data-astro-cid-bv4uflpl>POINTCAST</span> <span data-astro-cid-bv4uflpl>PCVN-${card.asset}</span> </div> <div class="card__noun" data-astro-cid-bv4uflpl> <img${addAttribute(`https://noun.pics/${card.id}.svg`, "src")}${addAttribute(`Noun ${card.id}`, "alt")} width="132" height="132" loading="lazy" data-astro-cid-bv4uflpl> </div> <div class="card__info" data-astro-cid-bv4uflpl> <p data-astro-cid-bv4uflpl>${card.channel}</p> <h2 data-astro-cid-bv4uflpl>${card.title}</h2> <span data-astro-cid-bv4uflpl>Noun #${card.id} · Visit Nouns FA2</span> <small data-astro-cid-bv4uflpl>${card.note}</small> </div> </div> <footer class="card__links" data-astro-cid-bv4uflpl> <a${addAttribute(card.route, "href")} data-astro-cid-bv4uflpl>Open route</a> <a${addAttribute(`https://objkt.com/tokens/${KT1}/${card.id}`, "href")} target="_blank" rel="noopener" data-astro-cid-bv4uflpl>objkt</a> <a${addAttribute(`/images/nouns-cards/pointcast-noun-card-${card.asset}.png`, "href")} data-astro-cid-bv4uflpl>Background</a> </footer> </article>`)} </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-cards.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-cards.astro";
const $$url = "/nouns-cards";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsCards,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
