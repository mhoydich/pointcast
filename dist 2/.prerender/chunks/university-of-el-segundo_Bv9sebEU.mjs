import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { c as UNIVERSITY_TRACKS, a as LOCAL_AREA_RADIUS, U as UNIVERSITY_PARTICIPATION_TIERS, F as FIRST_TIDE_FORMAT } from './localAreas_mKBCCGeN.mjs';

const $$UniversityOfElSegundo = createComponent(($$result, $$props, $$slots) => {
  const title = "University of El Segundo";
  const description = "The beginning of University of El Segundo: a local course framework, participation model, and first-session format for the PointCast 25-mile radius.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": "https://pointcast.xyz/university-of-el-segundo",
    name: title,
    description,
    url: "https://pointcast.xyz/university-of-el-segundo",
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: LOCAL_AREA_RADIUS.anchor.coords.latitude,
        longitude: LOCAL_AREA_RADIUS.anchor.coords.longitude
      },
      geoRadius: LOCAL_AREA_RADIUS.radiusMeters
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "University of El Segundo tracks",
      itemListElement: UNIVERSITY_TRACKS.map((track) => ({
        "@type": "Course",
        name: track.title,
        description: track.frame
      }))
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-mokqgx3c": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-mokqgx3c> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-mokqgx3c> <a href="/" data-astro-cid-mokqgx3c>Home</a> <span data-astro-cid-mokqgx3c>/</span> <a href="/areas" data-astro-cid-mokqgx3c>areas</a> <span data-astro-cid-mokqgx3c>/</span> <span data-astro-cid-mokqgx3c>university-of-el-segundo</span> </nav> <header class="hero" data-astro-cid-mokqgx3c> <div class="hero__copy" data-astro-cid-mokqgx3c> <p class="kicker" data-astro-cid-mokqgx3c>UNIVERSITY OF EL SEGUNDO · FIRST TIDE</p> <h1 data-astro-cid-mokqgx3c>A neighborhood learning club with receipts.</h1> <p data-astro-cid-mokqgx3c>
No tuition, no degrees, no campus costume. UES is a practical
          framework for local sessions where people teach what they actually
          know, then publish the note so the next person can join.
</p> </div> <div class="crest" aria-label="University of El Segundo crest" data-astro-cid-mokqgx3c> <span class="crest__sun" data-astro-cid-mokqgx3c></span> <span class="crest__line crest__line--one" data-astro-cid-mokqgx3c></span> <span class="crest__line crest__line--two" data-astro-cid-mokqgx3c></span> <span class="crest__book" data-astro-cid-mokqgx3c></span> <p data-astro-cid-mokqgx3c>FIRST TIDE</p> </div> </header> <section class="section" aria-labelledby="tracks-heading" data-astro-cid-mokqgx3c> <div class="section__head" data-astro-cid-mokqgx3c> <p class="kicker" data-astro-cid-mokqgx3c>COURSE TRACKS</p> <h2 id="tracks-heading" data-astro-cid-mokqgx3c>Six ways to practice local knowledge.</h2> </div> <div class="tracks" data-astro-cid-mokqgx3c> ${UNIVERSITY_TRACKS.map((track, index) => renderTemplate`<article class="track" data-astro-cid-mokqgx3c> <span data-astro-cid-mokqgx3c>TRACK ${index + 1}</span> <h3 data-astro-cid-mokqgx3c>${track.title}</h3> <p data-astro-cid-mokqgx3c>${track.frame}</p> <div class="track__first" data-astro-cid-mokqgx3c> <strong data-astro-cid-mokqgx3c>First session</strong> <small data-astro-cid-mokqgx3c>${track.firstSession}</small> </div> <ul data-astro-cid-mokqgx3c> ${track.connectsTo.map((item) => renderTemplate`<li data-astro-cid-mokqgx3c>${item}</li>`)} </ul> </article>`)} </div> </section> <section class="section participation" aria-labelledby="participation-heading" data-astro-cid-mokqgx3c> <div data-astro-cid-mokqgx3c> <p class="kicker" data-astro-cid-mokqgx3c>PARTICIPATION</p> <h2 id="participation-heading" data-astro-cid-mokqgx3c>Roles that keep the room alive.</h2> <p data-astro-cid-mokqgx3c>
The useful artifact is not a grade. It is a session note, a roster
          entry, a photo receipt, a paddle handoff, a garden source, or a next
          host. Participation should feel visible without becoming homework.
</p> </div> <ol class="tiers" data-astro-cid-mokqgx3c> ${UNIVERSITY_PARTICIPATION_TIERS.map((tier) => renderTemplate`<li data-astro-cid-mokqgx3c> <span data-astro-cid-mokqgx3c>${tier.threshold}</span> <h3 data-astro-cid-mokqgx3c>${tier.name}</h3> <p data-astro-cid-mokqgx3c>${tier.role}</p> </li>`)} </ol> </section> <section class="section first-tide" aria-labelledby="first-heading" data-astro-cid-mokqgx3c> <div class="section__head" data-astro-cid-mokqgx3c> <p class="kicker" data-astro-cid-mokqgx3c>FIRST SESSION</p> <h2 id="first-heading" data-astro-cid-mokqgx3c>First Tide, 75 minutes.</h2> </div> <ol class="run" data-astro-cid-mokqgx3c> ${FIRST_TIDE_FORMAT.map((item) => renderTemplate`<li data-astro-cid-mokqgx3c> <time data-astro-cid-mokqgx3c>${item.minutes}</time> <div data-astro-cid-mokqgx3c> <h3 data-astro-cid-mokqgx3c>${item.label}</h3> <p data-astro-cid-mokqgx3c>${item.detail}</p> </div> </li>`)} </ol> </section> <section class="section links" aria-label="Connected local areas" data-astro-cid-mokqgx3c> <a href="/meetups" data-astro-cid-mokqgx3c>List First Tide on Meetups</a> <a href="/paddle-exchange" data-astro-cid-mokqgx3c>Feed Court Craft from Paddle Tide</a> <a href="/honey-league" data-astro-cid-mokqgx3c>Cross-list Honey & Garden</a> <a href="/areas.json" data-astro-cid-mokqgx3c>Read the JSON framework</a> </section> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/university-of-el-segundo.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/university-of-el-segundo.astro";
const $$url = "/university-of-el-segundo";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$UniversityOfElSegundo,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
