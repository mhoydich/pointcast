import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { g as getPointcastApp } from './pointcast-apps_DuRB6sfu.mjs';

const $$Offbalance = createComponent(($$result, $$props, $$slots) => {
  const app = getPointcastApp("offbalance");
  const title = app.name;
  const description = app.description;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/offbalance",
    name: app.name,
    description,
    url: "https://pointcast.xyz/offbalance",
    sameAs: [app.url, app.repo]
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-hbpjkfbl": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="app-page" data-astro-cid-hbpjkfbl> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-hbpjkfbl> <a href="/" data-astro-cid-hbpjkfbl>Home</a> <span aria-hidden="true" data-astro-cid-hbpjkfbl>/</span> <a href="/apps" data-astro-cid-hbpjkfbl>apps</a> <span aria-hidden="true" data-astro-cid-hbpjkfbl>/</span> <span data-astro-cid-hbpjkfbl>offbalance</span> </nav> <header class="bar" data-astro-cid-hbpjkfbl> <div data-astro-cid-hbpjkfbl> <p data-astro-cid-hbpjkfbl>${app.channel} · ${app.kicker}</p> <h1 data-astro-cid-hbpjkfbl>${app.name}</h1> </div> <div class="actions" data-astro-cid-hbpjkfbl> <a${addAttribute(app.url, "href")} target="_blank" rel="noopener" data-astro-cid-hbpjkfbl>Open direct</a> <a${addAttribute(app.repo, "href")} target="_blank" rel="noopener" data-astro-cid-hbpjkfbl>Repo</a> </div> </header> <iframe title="Offbalance app"${addAttribute(app.url, "src")} loading="eager" referrerpolicy="no-referrer-when-downgrade" data-astro-cid-hbpjkfbl></iframe> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/offbalance.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/offbalance.astro";
const $$url = "/offbalance";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Offbalance,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
