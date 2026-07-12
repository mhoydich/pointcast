import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { N as NOC_FIXTURES, b as buildNocTacticsPacket, a as buildNocFixtureReceipt, n as nocClubBySlug, c as NOC_ENDPOINTS } from './nouns-open-circuit_BaZ8Hd0n.mjs';

async function getStaticPaths() {
  return NOC_FIXTURES.map((fixture) => {
    const packet = buildNocTacticsPacket({ clubSlug: fixture.home, fixtureId: fixture.id });
    const receipt = buildNocFixtureReceipt(packet);
    return {
      params: { id: fixture.id },
      props: { fixture, packet, receipt }
    };
  });
}
const $$id = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$id;
  const { fixture, packet, receipt } = Astro2.props;
  const home = nocClubBySlug(fixture.home);
  const away = nocClubBySlug(fixture.away);
  const winner = nocClubBySlug(receipt.winner);
  const title = `Nouns Open Circuit - ${fixture.id}`;
  const description = `${home.code} vs ${away.code}, seed ${fixture.seed}, receipt ${receipt.eventHash}.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `Nouns Open Circuit ${fixture.id}`,
    description,
    url: `${NOC_ENDPOINTS.human}/match/${fixture.id}`,
    competitor: [
      { "@type": "SportsTeam", name: home.name },
      { "@type": "SportsTeam", name: away.name }
    ],
    result: `${winner.name} ${receipt.score}`
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/battle.png", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/nouns-open-circuit.json", title: "Nouns Open Circuit manifest (JSON)" }], "frame": {
    image: "https://pointcast.xyz/images/og/battle.png",
    buttons: [
      { label: "League Desk", action: "link", target: NOC_ENDPOINTS.human },
      { label: "Circuit JSON", action: "link", target: NOC_ENDPOINTS.json },
      { label: "Nation Battler", action: "link", target: NOC_ENDPOINTS.incumbent }
    ]
  }, "data-astro-cid-wj5rseu6": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="match-page" data-astro-cid-wj5rseu6> <nav class="match-nav" aria-label="Nouns Open Circuit breadcrumb" data-astro-cid-wj5rseu6> <a href="/nouns-open-circuit" data-astro-cid-wj5rseu6>Nouns Open Circuit</a> <span data-astro-cid-wj5rseu6>/</span> <strong data-astro-cid-wj5rseu6>${fixture.id}</strong> </nav> <section class="match-hero" aria-label="Fixture receipt" data-astro-cid-wj5rseu6> <div data-astro-cid-wj5rseu6> <p class="kicker" data-astro-cid-wj5rseu6>${fixture.tag} / ${fixture.tempo}</p> <h1 data-astro-cid-wj5rseu6>${home.code} vs ${away.code}</h1> <p data-astro-cid-wj5rseu6>${fixture.label} resolves into a v2 receipt with packet hash, event hash, agent trail, and a stable citation.</p> </div> <div class="score-card" data-astro-cid-wj5rseu6> <span data-astro-cid-wj5rseu6>winner</span> <strong data-astro-cid-wj5rseu6>${winner.code}</strong> <b data-astro-cid-wj5rseu6>${receipt.score}</b> <small data-astro-cid-wj5rseu6>${receipt.eventHash}</small> </div> </section> <section class="team-row" aria-label="Fixture clubs" data-astro-cid-wj5rseu6> <article${addAttribute(`--club:${home.color};`, "style")} data-astro-cid-wj5rseu6> <img${addAttribute(home.image, "src")} alt="" loading="eager" data-astro-cid-wj5rseu6> <div data-astro-cid-wj5rseu6> <span data-astro-cid-wj5rseu6>${home.code}</span> <strong data-astro-cid-wj5rseu6>${home.name}</strong> <p data-astro-cid-wj5rseu6>${home.doctrine}</p> </div> </article> <article${addAttribute(`--club:${away.color};`, "style")} data-astro-cid-wj5rseu6> <img${addAttribute(away.image, "src")} alt="" loading="eager" data-astro-cid-wj5rseu6> <div data-astro-cid-wj5rseu6> <span data-astro-cid-wj5rseu6>${away.code}</span> <strong data-astro-cid-wj5rseu6>${away.name}</strong> <p data-astro-cid-wj5rseu6>${away.doctrine}</p> </div> </article> </section> <section class="receipt-grid" aria-label="Packet and receipt" data-astro-cid-wj5rseu6> <article data-astro-cid-wj5rseu6> <div class="panel-head" data-astro-cid-wj5rseu6> <span data-astro-cid-wj5rseu6>Tactics Packet</span> <strong data-astro-cid-wj5rseu6>${packet.formation}</strong> </div> <pre data-astro-cid-wj5rseu6>${JSON.stringify(packet, null, 2)}</pre> </article> <article data-astro-cid-wj5rseu6> <div class="panel-head" data-astro-cid-wj5rseu6> <span data-astro-cid-wj5rseu6>Fixture Receipt</span> <strong data-astro-cid-wj5rseu6>${receipt.packetHash}</strong> </div> <pre data-astro-cid-wj5rseu6>${JSON.stringify(receipt, null, 2)}</pre> </article> </section> <section class="timeline" aria-label="Agent timeline" data-astro-cid-wj5rseu6> <div class="panel-head" data-astro-cid-wj5rseu6> <span data-astro-cid-wj5rseu6>Agent Trail</span> <strong data-astro-cid-wj5rseu6>${receipt.agents.length} agents</strong> </div> ${receipt.timeline.map((event) => {
    const actor = nocClubBySlug(event.actor);
    return renderTemplate`<article data-astro-cid-wj5rseu6> <b data-astro-cid-wj5rseu6>${event.minute}' ${event.agent}</b> <strong data-astro-cid-wj5rseu6>${event.artifact}</strong> <span data-astro-cid-wj5rseu6>${actor.code} +${event.delta}</span> <p data-astro-cid-wj5rseu6>${event.note}</p> </article>`;
  })} </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-open-circuit/match/[id].astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-open-circuit/match/[id].astro";
const $$url = "/nouns-open-circuit/match/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
