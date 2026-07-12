import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { d as SHARE_KIT_UPDATED, S as SHARE_LANDING_PAGES, c as SHARE_CAMPAIGN_PACKETS, e as SHARE_AUDIENCES, a as SHARE_SNIPPETS, b as SHARE_LAUNCH_ASSETS, f as SHARE_ACTION_CHECKLIST, D as DISTRIBUTION_LOOP, g as SHARE_PLAN_PATH } from './share-kit_Z8-VWlGp.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Share = createComponent(($$result, $$props, $$slots) => {
  const SITE_URL = "https://pointcast.xyz";
  const repoUrl = (path) => `https://github.com/mhoydich/pointcast/blob/main/${path}`;
  const absolute = (path) => new URL(path, SITE_URL).href;
  function formatCampaignPacket(packet) {
    return [
      `${packet.title}`,
      `Target: ${absolute(packet.targetPath)}`,
      `Audience: ${packet.audience}`,
      `Goal: ${packet.goal}`,
      `Hook: ${packet.hook}`,
      "",
      "Proof links:",
      ...packet.proofLinks.map((link) => `- ${absolute(link)}`),
      "",
      "Channels:",
      ...packet.channels.map((channel) => `- ${channel}`),
      "",
      "Next steps:",
      ...packet.steps.map((step, index) => `${index + 1}. ${step}`)
    ].join("\n");
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://pointcast.xyz/share",
        name: "PointCast share kit",
        description: "Organic visitor plan, audience routers, copy snippets, and campaign packets for pointcast.xyz.",
        url: "https://pointcast.xyz/share",
        dateModified: SHARE_KIT_UPDATED,
        isPartOf: { "@type": "WebSite", "@id": "https://pointcast.xyz/#website" }
      },
      {
        "@type": "ItemList",
        "@id": "https://pointcast.xyz/share#landing-pages",
        name: "PointCast organic landing pages",
        itemListElement: SHARE_LANDING_PAGES.map((page, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absolute(page.path),
          name: page.title,
          description: page.hook
        }))
      },
      {
        "@type": "ItemList",
        "@id": "https://pointcast.xyz/share#campaigns",
        name: "PointCast campaign packets",
        itemListElement: SHARE_CAMPAIGN_PACKETS.map((packet, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absolute(packet.targetPath),
          name: packet.title,
          description: packet.goal
        }))
      }
    ]
  };
  return renderTemplate(_a || (_a = __template(["", " <script>\n  (function () {\n    function mark(button, text) {\n      var old = button.textContent;\n      button.textContent = text;\n      button.setAttribute('data-copied', 'true');\n      window.setTimeout(function () {\n        button.textContent = old;\n        button.removeAttribute('data-copied');\n      }, 1400);\n    }\n\n    function fallbackCopy(text) {\n      var area = document.createElement('textarea');\n      area.value = text;\n      area.setAttribute('readonly', '');\n      area.style.position = 'fixed';\n      area.style.top = '-9999px';\n      document.body.appendChild(area);\n      area.select();\n      document.execCommand('copy');\n      document.body.removeChild(area);\n    }\n\n    document.querySelectorAll('[data-copy]').forEach(function (button) {\n      button.addEventListener('click', function () {\n        var text = button.getAttribute('data-copy') || '';\n        if (navigator.clipboard && navigator.clipboard.writeText) {\n          navigator.clipboard.writeText(text).then(\n            function () { mark(button, 'Copied'); },\n            function () { fallbackCopy(text); mark(button, 'Copied'); },\n          );\n        } else {\n          fallbackCopy(text);\n          mark(button, 'Copied');\n        }\n      });\n    });\n\n    var key = 'pc:share-actions:v1';\n    var saved = {};\n    try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) {}\n\n    document.querySelectorAll('[data-action-check]').forEach(function (input) {\n      var id = input.getAttribute('data-action-check');\n      input.checked = Boolean(saved[id]);\n      input.addEventListener('change', function () {\n        saved[id] = input.checked;\n        try { localStorage.setItem(key, JSON.stringify(saved)); } catch (e) {}\n      });\n    });\n  })();\n<\/script>"])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Share kit", "description": "Organic visitor plan, audience routers, copy snippets, and campaign packets for pointcast.xyz.", "image": "/images/og-home-v3.png", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/share.json", title: "PointCast share kit JSON" }], "data-astro-cid-holfbhea": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="share-page" data-astro-cid-holfbhea> <nav class="crumb mono" aria-label="Breadcrumb" data-astro-cid-holfbhea> <a href="/" data-astro-cid-holfbhea>Home</a> <span data-astro-cid-holfbhea>/</span> <span data-astro-cid-holfbhea>share</span> <a href="/share.json" data-astro-cid-holfbhea>JSON</a> </nav> <header class="hero" data-astro-cid-holfbhea> <p class="kicker mono" data-astro-cid-holfbhea>ORGANIC VISITOR SPRINT · UPDATED ${SHARE_KIT_UPDATED}</p> <h1 data-astro-cid-holfbhea>Make PointCast easier to find, cite, and send.</h1> <p class="hero__lede" data-astro-cid-holfbhea>
The growth plan is not paid traffic. It is narrower and more useful:
        route each audience to the page that gives them a reason to care,
        keep the machine surface clean, and turn every deploy into a small
        distribution loop.
</p> <div class="hero__actions" data-astro-cid-holfbhea> <a class="button button--primary"${addAttribute(repoUrl(SHARE_PLAN_PATH), "href")} data-astro-cid-holfbhea>Read plan</a> <a class="button" href="/share.json" data-astro-cid-holfbhea>Fetch JSON</a> <button type="button" class="button"${addAttribute(absolute("/share"), "data-copy")} data-astro-cid-holfbhea>Copy URL</button> </div> <img class="hero__image" src="/images/og-home-v3.png" alt="PointCast home grid preview" width="1200" height="630" loading="eager" data-astro-cid-holfbhea> </header> <section class="section section--band" aria-labelledby="landing-pages" data-astro-cid-holfbhea> <div class="section__head" data-astro-cid-holfbhea> <p class="section__eyebrow mono" data-astro-cid-holfbhea>ROUTES</p> <h2 id="landing-pages" data-astro-cid-holfbhea>Send people to the right door.</h2> <p data-astro-cid-holfbhea>
The homepage can stay the living feed. These routes are the
          first-click options when someone arrives from a specific context.
</p> </div> <div class="route-grid" data-astro-cid-holfbhea> ${SHARE_LANDING_PAGES.map((page) => renderTemplate`<article class="route-card" data-astro-cid-holfbhea> <p class="route-card__audience mono" data-astro-cid-holfbhea>${page.audience}</p> <h3 data-astro-cid-holfbhea><a${addAttribute(page.path, "href")} data-astro-cid-holfbhea>${page.title}</a></h3> <p data-astro-cid-holfbhea>${page.hook}</p> <p class="route-card__proof" data-astro-cid-holfbhea>${page.proof}</p> <div class="route-card__actions" data-astro-cid-holfbhea> <a${addAttribute(page.path, "href")} data-astro-cid-holfbhea>Open</a> <button type="button"${addAttribute(absolute(page.path), "data-copy")} data-astro-cid-holfbhea>Copy</button> </div> </article>`)} </div> </section> <section class="section" aria-labelledby="audiences" data-astro-cid-holfbhea> <div class="section__head" data-astro-cid-holfbhea> <p class="section__eyebrow mono" data-astro-cid-holfbhea>AUDIENCES</p> <h2 id="audiences" data-astro-cid-holfbhea>Five lanes, five different asks.</h2> </div> <div class="audience-grid" data-astro-cid-holfbhea> ${SHARE_AUDIENCES.map((audience) => renderTemplate`<article class="audience" data-astro-cid-holfbhea> <h3 data-astro-cid-holfbhea>${audience.title}</h3> <p data-astro-cid-holfbhea>${audience.angle}</p> <p data-astro-cid-holfbhea><strong data-astro-cid-holfbhea>Ask:</strong> ${audience.ask}</p> <p class="chips" data-astro-cid-holfbhea> ${audience.channels.map((channel) => renderTemplate`<span data-astro-cid-holfbhea>${channel}</span>`)} </p> <a${addAttribute(audience.path, "href")} data-astro-cid-holfbhea>Use ${audience.path}</a> </article>`)} </div> </section> <section class="section section--band" aria-labelledby="snippets" data-astro-cid-holfbhea> <div class="section__head" data-astro-cid-holfbhea> <p class="section__eyebrow mono" data-astro-cid-holfbhea>COPY</p> <h2 id="snippets" data-astro-cid-holfbhea>Ready-to-send snippets.</h2> </div> <div class="snippet-grid" data-astro-cid-holfbhea> ${SHARE_SNIPPETS.map((snippet) => renderTemplate`<article class="snippet" data-astro-cid-holfbhea> <div class="snippet__top" data-astro-cid-holfbhea> <h3 data-astro-cid-holfbhea>${snippet.label}</h3> <button type="button"${addAttribute(snippet.text, "data-copy")} data-astro-cid-holfbhea>Copy</button> </div> <p data-astro-cid-holfbhea>${snippet.text}</p> <a${addAttribute(snippet.target, "href")} data-astro-cid-holfbhea>Open target</a> </article>`)} </div> </section> <section class="section" aria-labelledby="campaigns" data-astro-cid-holfbhea> <div class="section__head" data-astro-cid-holfbhea> <p class="section__eyebrow mono" data-astro-cid-holfbhea>CAMPAIGNS</p> <h2 id="campaigns" data-astro-cid-holfbhea>The board for the next sprint.</h2> <p data-astro-cid-holfbhea>
Each packet has one audience, one canonical URL, and one next step.
          Copy the packet, personalize it, then record what happens.
</p> </div> <div class="campaign-list" data-astro-cid-holfbhea> ${SHARE_CAMPAIGN_PACKETS.map((packet, index) => renderTemplate`<article class="campaign" data-astro-cid-holfbhea> <div class="campaign__num mono" data-astro-cid-holfbhea>${String(index + 1).padStart(2, "0")}</div> <div class="campaign__body" data-astro-cid-holfbhea> <p class="campaign__status mono" data-astro-cid-holfbhea>${packet.status}</p> <h3 data-astro-cid-holfbhea>${packet.title}</h3> <p class="campaign__goal" data-astro-cid-holfbhea>${packet.goal}</p> <p data-astro-cid-holfbhea><strong data-astro-cid-holfbhea>Hook:</strong> ${packet.hook}</p> <p data-astro-cid-holfbhea><strong data-astro-cid-holfbhea>Audience:</strong> ${packet.audience}</p> <div class="chips" data-astro-cid-holfbhea> ${packet.channels.map((channel) => renderTemplate`<span data-astro-cid-holfbhea>${channel}</span>`)} </div> <div class="proof-links" data-astro-cid-holfbhea> ${packet.proofLinks.map((link) => renderTemplate`<a${addAttribute(link, "href")} data-astro-cid-holfbhea>${link}</a>`)} </div> </div> <div class="campaign__actions" data-astro-cid-holfbhea> <a class="button button--small"${addAttribute(packet.targetPath, "href")} data-astro-cid-holfbhea>Open URL</a> <a class="button button--small"${addAttribute(repoUrl(packet.docPath), "href")} data-astro-cid-holfbhea>Doc</a> <button type="button" class="button button--small"${addAttribute(formatCampaignPacket(packet), "data-copy")} data-astro-cid-holfbhea>Copy packet</button> </div> </article>`)} </div> </section> <section class="section" aria-labelledby="launch-assets" data-astro-cid-holfbhea> <div class="section__head" data-astro-cid-holfbhea> <p class="section__eyebrow mono" data-astro-cid-holfbhea>LAUNCH DESK</p> <h2 id="launch-assets" data-astro-cid-holfbhea>Copy assets that are ready to use.</h2> <p data-astro-cid-holfbhea>
These are the next publishable artifacts: drafts, briefs, and pitch
          decks that turn the share plan into actual distribution work.
</p> </div> <div class="asset-grid" data-astro-cid-holfbhea> ${SHARE_LAUNCH_ASSETS.map((asset) => renderTemplate`<article class="asset" data-astro-cid-holfbhea> <p class="asset__kind mono" data-astro-cid-holfbhea>${asset.kind}</p> <h3 data-astro-cid-holfbhea>${asset.title}</h3> <p data-astro-cid-holfbhea>${asset.summary}</p> <p class="asset__audience" data-astro-cid-holfbhea><strong data-astro-cid-holfbhea>Audience:</strong> ${asset.audience}</p> <div class="asset__copy" data-astro-cid-holfbhea> <code data-astro-cid-holfbhea>${asset.primaryCopy}</code> <button type="button"${addAttribute(asset.primaryCopy, "data-copy")} data-astro-cid-holfbhea>Copy</button> </div> <div class="route-card__actions" data-astro-cid-holfbhea> <a${addAttribute(asset.url, "href")} data-astro-cid-holfbhea>Open URL</a> <a${addAttribute(repoUrl(asset.docPath), "href")} data-astro-cid-holfbhea>Open doc</a> </div> </article>`)} </div> </section> <section class="section section--split" aria-labelledby="next-ten" data-astro-cid-holfbhea> <div data-astro-cid-holfbhea> <p class="section__eyebrow mono" data-astro-cid-holfbhea>NEXT 10</p> <h2 id="next-ten" data-astro-cid-holfbhea>Checklist.</h2> <p data-astro-cid-holfbhea>
Browser-local state only. It is a sprint board, not an account.
</p> </div> <ol class="checklist" data-astro-cid-holfbhea> ${SHARE_ACTION_CHECKLIST.map((item) => renderTemplate`<li data-astro-cid-holfbhea> <input type="checkbox"${addAttribute(`action-${item.id}`, "id")}${addAttribute(item.id, "data-action-check")} data-astro-cid-holfbhea> <label${addAttribute(`action-${item.id}`, "for")} data-astro-cid-holfbhea> <span data-astro-cid-holfbhea>${item.label}</span> <small data-astro-cid-holfbhea>${item.detail}</small> </label> <a${addAttribute(item.url, "href")} data-astro-cid-holfbhea>open</a> </li>`)} </ol> </section> <section class="section section--band" aria-labelledby="loop" data-astro-cid-holfbhea> <div class="section__head" data-astro-cid-holfbhea> <p class="section__eyebrow mono" data-astro-cid-holfbhea>LOOP</p> <h2 id="loop" data-astro-cid-holfbhea>Repeat after every meaningful deploy.</h2> </div> <ol class="loop-list" data-astro-cid-holfbhea> ${DISTRIBUTION_LOOP.map((item) => renderTemplate`<li data-astro-cid-holfbhea>${item}</li>`)} </ol> </section> <aside class="machine" data-astro-cid-holfbhea> <div data-astro-cid-holfbhea> <p class="machine__label mono" data-astro-cid-holfbhea>MACHINE SURFACE</p> <h2 data-astro-cid-holfbhea>Same board as JSON.</h2> <p data-astro-cid-holfbhea>
Agents, crawlers, and future automation can read the campaign
          packet list directly from <code data-astro-cid-holfbhea>/share.json</code>.
</p> </div> <div class="machine__links" data-astro-cid-holfbhea> <a href="/share.json" data-astro-cid-holfbhea>/share.json</a> <a href="/agents.json" data-astro-cid-holfbhea>/agents.json</a> <a href="/llms.txt" data-astro-cid-holfbhea>/llms.txt</a> </div> </aside> </div> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/share.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/share.astro";
const $$url = "/share";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Share,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
