import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { P as POINTCAST_PETS_ROSTER, a as POINTCAST_PETS_VERSION, b as POINTCAST_SITE_PET_NAME_POLL, c as POINTCAST_PETS_SURFACES, d as POINTCAST_SITE_PET_MOOD_LADDER, e as POINTCAST_PETS_PHASES, f as POINTCAST_PETS_QUEUE, g as POINTCAST_PETS_DECISIONS, h as POINTCAST_PETS_DESCRIPTION } from './pets_B2SFpmWd.mjs';

const $$Pets = createComponent(($$result, $$props, $$slots) => {
  const title = "PointCast Pets";
  const description = POINTCAST_PETS_DESCRIPTION;
  const statusCounts = POINTCAST_PETS_ROSTER.reduce((acc, pet) => {
    acc[pet.status] = (acc[pet.status] ?? 0) + 1;
    return acc;
  }, {});
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/pets#plan",
    name: title,
    description,
    url: "https://pointcast.xyz/pets",
    inLanguage: "en-US",
    hasPart: POINTCAST_PETS_ROSTER.map((pet) => ({
      "@type": "CreativeWork",
      name: pet.name,
      url: `https://pointcast.xyz${pet.habitat}`,
      description: pet.careLoop
    }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/pets.json", title: "PointCast Pets manifest" },
    { type: "application/json", href: "/play.json", title: "PointCast play layer manifest" },
    { type: "application/json", href: "/zen-cats.json", title: "Zen Cats manifest" }
  ], "frame": {
    image: "https://pointcast.xyz/images/og/og-home-v2.png",
    buttons: [
      { label: "Open Pets", action: "link", target: "https://pointcast.xyz/pets" },
      { label: "Pets JSON", action: "link", target: "https://pointcast.xyz/pets.json" },
      { label: "Site Pet", action: "link", target: "https://pointcast.xyz/pet" }
    ]
  }, "data-astro-cid-2i7vrzx3": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="pets-page" data-astro-cid-2i7vrzx3> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-2i7vrzx3> <a href="/" data-astro-cid-2i7vrzx3>Home</a> <span aria-hidden="true" data-astro-cid-2i7vrzx3>/</span> <a href="/play" data-astro-cid-2i7vrzx3>play</a> <span aria-hidden="true" data-astro-cid-2i7vrzx3>/</span> <span data-astro-cid-2i7vrzx3>pets</span> </nav> <header class="pets-hero" data-astro-cid-2i7vrzx3> <div class="pets-hero__copy" data-astro-cid-2i7vrzx3> <p class="kicker" data-astro-cid-2i7vrzx3>POINTCAST PETS / v${POINTCAST_PETS_VERSION} / PUBLIC PLAN</p> <h1 data-astro-cid-2i7vrzx3>Pets become a small, readable layer of the site.</h1> <p data-astro-cid-2i7vrzx3>
The existing <a href="/pet" data-astro-cid-2i7vrzx3>site pet</a> stays local-first. <a href="/zen-cats" data-astro-cid-2i7vrzx3>Zen Cats</a>
keep the daily collectible lane. The rest of the plan turns room companions,
          care receipts, and mint decisions into one coherent surface.
</p> <div class="hero-actions" aria-label="Primary pet routes" data-astro-cid-2i7vrzx3> <a href="/pet" data-astro-cid-2i7vrzx3>Site Pet</a> <a${addAttribute(POINTCAST_SITE_PET_NAME_POLL.href, "href")} data-astro-cid-2i7vrzx3>Name Poll</a> <a href="/zen-cats" data-astro-cid-2i7vrzx3>Zen Cats</a> <a href="/pets.json" data-astro-cid-2i7vrzx3>JSON</a> </div> </div> <aside class="pets-signal" aria-label="Pets system status" data-astro-cid-2i7vrzx3> <img src="https://noun.pics/404.svg" alt="Noun 404 visual anchor for the PointCast site pet" width="116" height="116" data-astro-cid-2i7vrzx3> <dl data-astro-cid-2i7vrzx3> <div data-astro-cid-2i7vrzx3><dt data-astro-cid-2i7vrzx3>Live</dt><dd data-astro-cid-2i7vrzx3>${statusCounts.live ?? 0}</dd></div> <div data-astro-cid-2i7vrzx3><dt data-astro-cid-2i7vrzx3>Planned</dt><dd data-astro-cid-2i7vrzx3>${statusCounts.planned ?? 0}</dd></div> <div data-astro-cid-2i7vrzx3><dt data-astro-cid-2i7vrzx3>Storage</dt><dd data-astro-cid-2i7vrzx3>local-first</dd></div> <div data-astro-cid-2i7vrzx3><dt data-astro-cid-2i7vrzx3>Name poll</dt><dd data-astro-cid-2i7vrzx3>${POINTCAST_SITE_PET_NAME_POLL.status}</dd></div> <div data-astro-cid-2i7vrzx3><dt data-astro-cid-2i7vrzx3>Archive</dt><dd data-astro-cid-2i7vrzx3>Block 0399</dd></div> </dl> </aside> </header> <section class="system-strip" aria-label="Pets routes" data-astro-cid-2i7vrzx3> ${POINTCAST_PETS_SURFACES.map((surface) => renderTemplate`<a${addAttribute(surface.href, "href")} class="surface-tile" data-astro-cid-2i7vrzx3> <span data-astro-cid-2i7vrzx3>${surface.status}</span> <strong data-astro-cid-2i7vrzx3>${surface.title}</strong> <em data-astro-cid-2i7vrzx3>${surface.role}</em> <small data-astro-cid-2i7vrzx3>${surface.jsonHref}</small> </a>`)} </section> <section class="phase-one-strip" aria-labelledby="phase-one-title" data-astro-cid-2i7vrzx3> <div class="phase-one-strip__copy" data-astro-cid-2i7vrzx3> <p class="kicker" data-astro-cid-2i7vrzx3>PHASE 1 / SHIPPING</p> <h2 id="phase-one-title" data-astro-cid-2i7vrzx3>The site pet now has a live name vote and a richer local mood loop.</h2> <p data-astro-cid-2i7vrzx3>
The vote offers ${POINTCAST_SITE_PET_NAME_POLL.options.map((option) => option.label).join(", ")}.
          The winner can become the public label after review; browser-local care stays private.
</p> <nav aria-label="Phase 1 pet routes" data-astro-cid-2i7vrzx3> <a href="/pet" data-astro-cid-2i7vrzx3>Open /pet</a> <a${addAttribute(POINTCAST_SITE_PET_NAME_POLL.href, "href")} data-astro-cid-2i7vrzx3>Vote on name</a> <a href="/pets.json" data-astro-cid-2i7vrzx3>Read JSON</a> </nav> </div> <ol class="mood-ladder" aria-label="Site pet mood ladder" data-astro-cid-2i7vrzx3> ${POINTCAST_SITE_PET_MOOD_LADDER.map((mood) => renderTemplate`<li data-astro-cid-2i7vrzx3> <span data-astro-cid-2i7vrzx3>${mood.min}-${mood.max}</span> <strong data-astro-cid-2i7vrzx3>${mood.label}</strong> <small data-astro-cid-2i7vrzx3>${mood.summary}</small> </li>`)} </ol> </section> <section class="section" aria-labelledby="roster-title" data-astro-cid-2i7vrzx3> <div class="section-head" data-astro-cid-2i7vrzx3> <p class="kicker" data-astro-cid-2i7vrzx3>ROSTER</p> <h2 id="roster-title" data-astro-cid-2i7vrzx3>Start with what is alive. Plan only what earns return visits.</h2> </div> <div class="roster-grid" data-astro-cid-2i7vrzx3> ${POINTCAST_PETS_ROSTER.map((pet) => renderTemplate`<article${addAttribute(`pet-card pet-card--${pet.status}`, "class")} data-astro-cid-2i7vrzx3> <div class="pet-card__media" data-astro-cid-2i7vrzx3> <img${addAttribute(pet.image, "src")}${addAttribute(`${pet.name} visual marker`, "alt")} width="84" height="84" loading="lazy" data-astro-cid-2i7vrzx3> <span data-astro-cid-2i7vrzx3>${pet.status}</span> </div> <div class="pet-card__copy" data-astro-cid-2i7vrzx3> <h3 data-astro-cid-2i7vrzx3>${pet.name}</h3> <p data-astro-cid-2i7vrzx3>${pet.careLoop}</p> <dl data-astro-cid-2i7vrzx3> <div data-astro-cid-2i7vrzx3><dt data-astro-cid-2i7vrzx3>Habitat</dt><dd data-astro-cid-2i7vrzx3><a${addAttribute(pet.habitat, "href")} data-astro-cid-2i7vrzx3>${pet.habitat}</a></dd></div> <div data-astro-cid-2i7vrzx3><dt data-astro-cid-2i7vrzx3>Storage</dt><dd data-astro-cid-2i7vrzx3>${pet.storage}</dd></div> <div data-astro-cid-2i7vrzx3><dt data-astro-cid-2i7vrzx3>Mint path</dt><dd data-astro-cid-2i7vrzx3>${pet.mintPath}</dd></div> </dl> <strong data-astro-cid-2i7vrzx3>${pet.nextMove}</strong> </div> </article>`)} </div> </section> <section class="section" aria-labelledby="phase-title" data-astro-cid-2i7vrzx3> <div class="section-head" data-astro-cid-2i7vrzx3> <p class="kicker" data-astro-cid-2i7vrzx3>PLAN</p> <h2 id="phase-title" data-astro-cid-2i7vrzx3>Four phases keep the cut small and honest.</h2> </div> <ol class="phase-list" data-astro-cid-2i7vrzx3> ${POINTCAST_PETS_PHASES.map((phase) => renderTemplate`<li data-astro-cid-2i7vrzx3> <span data-astro-cid-2i7vrzx3>${phase.label}</span> <div data-astro-cid-2i7vrzx3> <strong data-astro-cid-2i7vrzx3>${phase.title}</strong> <p data-astro-cid-2i7vrzx3>${phase.summary}</p> <small data-astro-cid-2i7vrzx3>${phase.deliverables.join(" / ")}</small> </div> <em data-astro-cid-2i7vrzx3>${phase.status}</em> </li>`)} </ol> </section> <section class="section split-section" aria-label="Pets queue and decisions" data-astro-cid-2i7vrzx3> <div data-astro-cid-2i7vrzx3> <div class="section-head" data-astro-cid-2i7vrzx3> <p class="kicker" data-astro-cid-2i7vrzx3>QUEUE</p> <h2 data-astro-cid-2i7vrzx3>Next useful moves</h2> </div> <div class="queue-list" data-astro-cid-2i7vrzx3> ${POINTCAST_PETS_QUEUE.map((item) => renderTemplate`<article data-astro-cid-2i7vrzx3> <span data-astro-cid-2i7vrzx3>${item.priority} / ${item.owner} / ${item.status}</span> <strong data-astro-cid-2i7vrzx3>${item.task}</strong> </article>`)} </div> </div> <div data-astro-cid-2i7vrzx3> <div class="section-head" data-astro-cid-2i7vrzx3> <p class="kicker" data-astro-cid-2i7vrzx3>DECISIONS</p> <h2 data-astro-cid-2i7vrzx3>Open calls</h2> </div> <div class="decision-list" data-astro-cid-2i7vrzx3> ${POINTCAST_PETS_DECISIONS.map((decision) => renderTemplate`<article data-astro-cid-2i7vrzx3> <span data-astro-cid-2i7vrzx3>${decision.owner} / ${decision.status}</span> <strong data-astro-cid-2i7vrzx3>${decision.question}</strong> <p data-astro-cid-2i7vrzx3>${decision.recommendation}</p> </article>`)} </div> </div> </section> <section class="agent-contract" aria-labelledby="agent-title" data-astro-cid-2i7vrzx3> <div data-astro-cid-2i7vrzx3> <p class="kicker" data-astro-cid-2i7vrzx3>AGENT CONTRACT</p> <h2 id="agent-title" data-astro-cid-2i7vrzx3>Read the plan, do not invent ownership.</h2> <p data-astro-cid-2i7vrzx3>
Agents can cite public routes, rules, storage keys, and queue status. Browser-local
          care history is private unless a visitor supplies it directly.
</p> </div> <ul data-astro-cid-2i7vrzx3> <li data-astro-cid-2i7vrzx3><a href="/pets.json" data-astro-cid-2i7vrzx3>/pets.json</a> is the planning manifest.</li> <li data-astro-cid-2i7vrzx3><a href="/play.json" data-astro-cid-2i7vrzx3>/play.json</a> defines the current site pet care actions.</li> <li data-astro-cid-2i7vrzx3><a href="/zen-cats.json" data-astro-cid-2i7vrzx3>/zen-cats.json</a> defines daily cat metadata and PCCAT status.</li> </ul> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/pets.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/pets.astro";
const $$url = "/pets";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Pets,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
