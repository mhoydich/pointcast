import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { P as POINTCAST_CONNECTORS } from './pointcast-connectors_CtRpC8H_.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Connectors = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Connectors";
  const description = "Addable MCP links for PointCast and related apps. Copy a connector URL into an AI client and let the client enter the town.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/connectors",
    name: "PointCast Connectors",
    description,
    url: "https://pointcast.xyz/connectors",
    hasPart: POINTCAST_CONNECTORS.map((connector) => ({
      "@type": "SoftwareApplication",
      name: connector.name,
      description: connector.description,
      url: connector.endpoint,
      applicationCategory: "DeveloperApplication"
    }))
  };
  const alternates = [
    { type: "application/json", href: "/connectors.json", title: "PointCast connector links" }
  ];
  return renderTemplate(_a || (_a = __template(["", " <script>\n  document.querySelectorAll('[data-copy]').forEach(function (btn) {\n    btn.addEventListener('click', async function () {\n      var value = btn.getAttribute('data-copy') || '';\n      try {\n        await navigator.clipboard.writeText(value);\n        var old = btn.textContent;\n        btn.textContent = 'Copied';\n        window.setTimeout(function () { btn.textContent = old || 'Copy URL'; }, 1200);\n      } catch {\n        window.prompt('Copy connector URL', value);\n      }\n    });\n  });\n<\/script>"])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "alternates": alternates, "data-astro-cid-d4nu4sxh": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="page" data-astro-cid-d4nu4sxh> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-d4nu4sxh> <a href="/" data-astro-cid-d4nu4sxh>Home</a> <span aria-hidden="true" data-astro-cid-d4nu4sxh>/</span> <a href="/apps" data-astro-cid-d4nu4sxh>apps</a> <span aria-hidden="true" data-astro-cid-d4nu4sxh>/</span> <span data-astro-cid-d4nu4sxh>connectors</span> </nav> <header class="head" data-astro-cid-d4nu4sxh> <p class="kicker" data-astro-cid-d4nu4sxh>Connector links · add these to the client</p> <h1 data-astro-cid-d4nu4sxh>Paste the town into your AI app.</h1> <p class="dek" data-astro-cid-d4nu4sxh>
The first job is simple: give people links they can add. Once the
        connector is installed, PointCast becomes the place the client can
        read, search, navigate, and lightly participate in.
</p> </header> <section class="quick" aria-label="Priority connector" data-astro-cid-d4nu4sxh> <div data-astro-cid-d4nu4sxh> <p class="quick__label" data-astro-cid-d4nu4sxh>Priority link</p> <h2 data-astro-cid-d4nu4sxh>${POINTCAST_CONNECTORS[0].name}</h2> </div> <label class="copyline" data-astro-cid-d4nu4sxh> <span data-astro-cid-d4nu4sxh>Connector URL</span> <input readonly${addAttribute(POINTCAST_CONNECTORS[0].endpoint, "value")} data-astro-cid-d4nu4sxh> </label> <button type="button" class="copybtn"${addAttribute(POINTCAST_CONNECTORS[0].endpoint, "data-copy")} data-astro-cid-d4nu4sxh>
Copy URL
</button> </section> <section class="connectors" aria-label="Connector links" data-astro-cid-d4nu4sxh> ${POINTCAST_CONNECTORS.map((connector) => renderTemplate`<article class="connector" data-astro-cid-d4nu4sxh> <div class="connector__top" data-astro-cid-d4nu4sxh> <p class="connector__meta" data-astro-cid-d4nu4sxh>${connector.status} · ${connector.category} · priority ${connector.priority}</p> <h2 data-astro-cid-d4nu4sxh>${connector.name}</h2> <p data-astro-cid-d4nu4sxh>${connector.description}</p> </div> <label class="copyline copyline--card" data-astro-cid-d4nu4sxh> <span data-astro-cid-d4nu4sxh>MCP endpoint</span> <input readonly${addAttribute(connector.endpoint, "value")} data-astro-cid-d4nu4sxh> </label> <div class="connector__actions" data-astro-cid-d4nu4sxh> <button type="button" class="copybtn copybtn--small"${addAttribute(connector.endpoint, "data-copy")} data-astro-cid-d4nu4sxh>
Copy URL
</button> <a${addAttribute(connector.endpoint, "href")} data-astro-cid-d4nu4sxh>Open discovery</a> </div> <div class="client-list" data-astro-cid-d4nu4sxh> ${connector.clients.map((client) => renderTemplate`<section class="client" data-astro-cid-d4nu4sxh> <h3 data-astro-cid-d4nu4sxh>${client.name}</h3> <p data-astro-cid-d4nu4sxh>${client.label}</p> <small data-astro-cid-d4nu4sxh>${client.note}</small> </section>`)} </div> <p class="tool-label" data-astro-cid-d4nu4sxh>Client-visible tools</p> <ul class="tools" data-astro-cid-d4nu4sxh> ${connector.tools.slice(0, 9).map((tool) => renderTemplate`<li data-astro-cid-d4nu4sxh>${tool}</li>`)} </ul> </article>`)} </section> <aside class="machine" data-astro-cid-d4nu4sxh> <p data-astro-cid-d4nu4sxh>Machine-readable</p> <a href="/connectors.json" data-astro-cid-d4nu4sxh>/connectors.json</a> <a href="/apps.json" data-astro-cid-d4nu4sxh>/apps.json</a> ${POINTCAST_CONNECTORS.map((connector) => renderTemplate`<a${addAttribute(connector.endpoint.replace("https://pointcast.xyz", ""), "href")} data-astro-cid-d4nu4sxh> ${connector.endpoint.replace("https://pointcast.xyz", "")} </a>`)} </aside> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/connectors.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/connectors.astro";
const $$url = "/connectors";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Connectors,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
