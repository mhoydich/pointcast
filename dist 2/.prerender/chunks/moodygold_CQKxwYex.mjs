import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { g as getPointcastApp } from './pointcast-apps_DuRB6sfu.mjs';

const $$Moodygold = createComponent(($$result, $$props, $$slots) => {
  const app = getPointcastApp("moodygold");
  const title = app.name;
  const description = app.description;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/moodygold",
    name: app.name,
    description,
    url: "https://pointcast.xyz/moodygold",
    sameAs: [app.url, app.repo]
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-aujutwoq": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="app-page" data-astro-cid-aujutwoq> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-aujutwoq> <a href="/" data-astro-cid-aujutwoq>Home</a> <span aria-hidden="true" data-astro-cid-aujutwoq>/</span> <a href="/apps" data-astro-cid-aujutwoq>apps</a> <span aria-hidden="true" data-astro-cid-aujutwoq>/</span> <span data-astro-cid-aujutwoq>moodygold</span> </nav> <header class="bar" data-astro-cid-aujutwoq> <div data-astro-cid-aujutwoq> <p data-astro-cid-aujutwoq>${app.channel} · ${app.kicker}</p> <h1 data-astro-cid-aujutwoq>${app.name}</h1> </div> <div class="actions" data-astro-cid-aujutwoq> <a${addAttribute(app.url, "href")} target="_blank" rel="noopener" data-astro-cid-aujutwoq>Open direct</a> <a${addAttribute(app.repo, "href")} target="_blank" rel="noopener" data-astro-cid-aujutwoq>Repo</a> </div> </header> <iframe title="MoodyGold app"${addAttribute(app.url, "src")} loading="eager" referrerpolicy="no-referrer-when-downgrade" data-astro-cid-aujutwoq></iframe> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/moodygold.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/moodygold.astro";
const $$url = "/moodygold";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Moodygold,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
