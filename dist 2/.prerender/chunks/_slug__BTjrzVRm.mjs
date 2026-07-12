import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { U as UNFURL_SHRINES, g as getShrineSet, a as absoluteUrl, b as absoluteImage, d as getMiniShrineDescription, S as SITE_URL } from './unfurl-shrines_CZAaG8nC.mjs';

function getStaticPaths() {
  return UNFURL_SHRINES.map((shrine) => ({
    params: { slug: shrine.slug },
    props: { shrine }
  }));
}
const $$slug = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$slug;
  const { shrine } = Astro2.props;
  const shrineSet = getShrineSet(shrine.slug);
  const targetUrl = absoluteUrl(shrine.path);
  const pageUrl = absoluteUrl(shrine.miniPath);
  const imageUrl = absoluteImage(shrine.image);
  const miniImagePath = `${shrine.miniPath}/og.png`;
  const miniImageUrl = absoluteUrl(miniImagePath);
  const title = `${shrine.title} · mini shrine`;
  const description = getMiniShrineDescription(shrine);
  const shrineBackground = shrineSet?.background ?? shrine.image;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": pageUrl,
    name: title,
    description,
    url: pageUrl,
    image: miniImageUrl,
    isPartOf: { "@type": "WebSite", name: "PointCast", url: SITE_URL },
    about: {
      "@type": "WebPage",
      name: shrine.title,
      url: targetUrl,
      image: imageUrl,
      description: shrine.description
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": miniImagePath, "imageAlt": `${shrine.title} mini shrine preview`, "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/unfurls.json", title: "PointCast unfurl shrine manifest" },
    { type: "text/html", href: shrine.path, title: shrine.title }
  ], "frame": {
    image: miniImageUrl,
    buttons: [
      { label: "Open URL", action: "link", target: targetUrl },
      { label: "Shrine wall", action: "link", target: absoluteUrl("/unfurls") },
      { label: "Manifest", action: "link", target: absoluteUrl("/unfurls.json") }
    ]
  }, "data-astro-cid-xpoxhcjc": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="mini-shrine"${addAttribute(`--shrine-bg: url('${shrineBackground}')`, "style")} data-astro-cid-xpoxhcjc> <nav class="mini-shrine__crumb mono" aria-label="Breadcrumb" data-astro-cid-xpoxhcjc> <a href="/unfurls" data-astro-cid-xpoxhcjc>Unfurls</a> <span data-astro-cid-xpoxhcjc>/</span> <span data-astro-cid-xpoxhcjc>${shrine.slug}</span> <a${addAttribute(shrine.path, "href")} data-astro-cid-xpoxhcjc>Open URL</a> </nav> <div class="mini-shrine__stage" data-astro-cid-xpoxhcjc> <img class="mini-shrine__background"${addAttribute(shrineBackground, "src")} alt="" width="1400" height="788" data-astro-cid-xpoxhcjc> <div class="mini-shrine__shade" data-astro-cid-xpoxhcjc></div> <div class="mini-shrine__card" data-astro-cid-xpoxhcjc> <div class="mini-shrine__media" data-astro-cid-xpoxhcjc> <img${addAttribute(shrine.image, "src")} alt="" width="1200" height="630" data-astro-cid-xpoxhcjc> </div> <div class="mini-shrine__copy" data-astro-cid-xpoxhcjc> <p class="kicker mono" data-astro-cid-xpoxhcjc>${shrineSet?.title ?? "URL Shrine"} · ${shrine.kind}</p> <h1 data-astro-cid-xpoxhcjc>${shrine.title}</h1> <p data-astro-cid-xpoxhcjc>${shrine.description}</p> <dl data-astro-cid-xpoxhcjc> <div data-astro-cid-xpoxhcjc> <dt data-astro-cid-xpoxhcjc>Target</dt> <dd data-astro-cid-xpoxhcjc><a${addAttribute(shrine.path, "href")} data-astro-cid-xpoxhcjc>${shrine.path}</a></dd> </div> <div data-astro-cid-xpoxhcjc> <dt data-astro-cid-xpoxhcjc>Audience</dt> <dd data-astro-cid-xpoxhcjc>${shrine.audience}</dd> </div> <div data-astro-cid-xpoxhcjc> <dt data-astro-cid-xpoxhcjc>Ritual</dt> <dd data-astro-cid-xpoxhcjc>${shrine.ritual}</dd> </div> </dl> <div class="mini-shrine__actions" data-astro-cid-xpoxhcjc> <a${addAttribute(shrine.path, "href")} data-astro-cid-xpoxhcjc>Open URL</a> <a href="/unfurls" data-astro-cid-xpoxhcjc>Shrine Wall</a> <a href="/shrines" data-astro-cid-xpoxhcjc>Sets</a> </div> </div> </div> </div> </article> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/u/[slug].astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/u/[slug].astro";
const $$url = "/u/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
