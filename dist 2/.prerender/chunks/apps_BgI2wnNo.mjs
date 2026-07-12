import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { P as POINTCAST_APPS } from './pointcast-apps_DuRB6sfu.mjs';
import { P as POINTCAST_CONNECTORS } from './pointcast-connectors_CtRpC8H_.mjs';

const $$Apps = createComponent(($$result, $$props, $$slots) => {
  const title = "Apps";
  const description = "PointCast apps collected in one place: addable AI-client connectors, satellite rooms, local tools, collectible consoles, and small mintable worlds.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/apps",
    name: "PointCast Apps",
    description,
    url: "https://pointcast.xyz/apps",
    hasPart: POINTCAST_APPS.map((app) => ({
      "@type": "WebApplication",
      name: app.name,
      description: app.description,
      url: `https://pointcast.xyz/${app.slug}`,
      sameAs: [app.url, app.repo],
      applicationCategory: app.kind === "satellite" ? "CreativeWork" : "WebApplication"
    })).concat(POINTCAST_CONNECTORS.map((connector) => ({
      "@type": "SoftwareApplication",
      name: connector.name,
      description: connector.description,
      url: connector.endpoint,
      applicationCategory: "DeveloperApplication"
    })))
  };
  const alternates = [
    { type: "application/json", href: "/apps.json", title: "PointCast apps and connectors" }
  ];
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "alternates": alternates, "data-astro-cid-lo5sges7": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="page" data-astro-cid-lo5sges7> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-lo5sges7> <a href="/" data-astro-cid-lo5sges7>Home</a> <span aria-hidden="true" data-astro-cid-lo5sges7>/</span> <span data-astro-cid-lo5sges7>apps</span> </nav> <header class="head" data-astro-cid-lo5sges7> <p class="kicker" data-astro-cid-lo5sges7>Apps · connectors · client shelf</p> <h1 data-astro-cid-lo5sges7>Open the rooms from here.</h1> <p class="dek" data-astro-cid-lo5sges7>
Addable connector links come first. Then the client gets the app
        shelf: satellite apps, internal tools, collectible consoles, and
        small local ledgers with stable front doors inside PointCast.
</p> </header> <section class="connector-band" aria-label="Addable connectors" data-astro-cid-lo5sges7> <div class="connector-band__head" data-astro-cid-lo5sges7> <p class="kicker" data-astro-cid-lo5sges7>Add to client</p> <h2 data-astro-cid-lo5sges7>Connector links people can paste.</h2> <a href="/connectors" data-astro-cid-lo5sges7>All connector links</a> </div> <div class="connector-grid" data-astro-cid-lo5sges7> ${POINTCAST_CONNECTORS.map((connector) => renderTemplate`<article class="connector" data-astro-cid-lo5sges7> <p class="connector__kicker" data-astro-cid-lo5sges7>${connector.status} · priority ${connector.priority}</p> <h3 data-astro-cid-lo5sges7>${connector.name}</h3> <p data-astro-cid-lo5sges7>${connector.clientUse}</p> <label class="copyline" data-astro-cid-lo5sges7> <span data-astro-cid-lo5sges7>MCP URL</span> <input readonly${addAttribute(connector.endpoint, "value")} data-astro-cid-lo5sges7> </label> </article>`)} </div> </section> <section class="grid" aria-label="PointCast apps" data-astro-cid-lo5sges7> ${POINTCAST_APPS.map((app) => renderTemplate`<article class="app" data-astro-cid-lo5sges7> <p class="app__kicker" data-astro-cid-lo5sges7>${app.channel} · ${app.kind === "satellite" ? "SATELLITE" : "POINTCAST"} · ${app.kicker}</p> <h2 data-astro-cid-lo5sges7>${app.name}</h2> <p data-astro-cid-lo5sges7>${app.description}</p> <div class="app__actions" data-astro-cid-lo5sges7> <a${addAttribute(app.path, "href")} data-astro-cid-lo5sges7>Open on PointCast</a> <a${addAttribute(app.url, "href")} target="_blank" rel="noopener" data-astro-cid-lo5sges7>${app.kind === "satellite" ? "Open direct" : "Canonical"}</a> </div> </article>`)} </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/apps.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/apps.astro";
const $$url = "/apps";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Apps,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
