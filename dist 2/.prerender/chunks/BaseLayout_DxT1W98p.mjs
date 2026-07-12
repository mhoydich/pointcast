import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { m as maybeRenderHead, b as addAttribute, s as spreadAttributes, a as renderTemplate, r as renderComponent, c as renderSlot, e as renderHead, u as unescapeHTML, F as Fragment } from './prerender_CmTjnOuJ.mjs';
import 'clsx';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { M as MOOD_SOUNDTRACKS } from './moods-soundtracks_CEitMVRv.mjs';
/* empty css                          */
import { $ as $$FirstSee, a as $$FreshnessChip } from './FirstSee_CmhiKWAo.mjs';
import { $ as $$ClientRouter } from './ClientRouter_y7f2VO-c.mjs';
import { b as SITE_DESCRIPTION, c as buildIdentityJsonLd, D as DISCOVERY_LINKS, a as SITE_KEYWORDS } from './seo_kHbv1E1E.mjs';
/* empty css                 */

const $$Footer = createComponent(($$result, $$props, $$slots) => {
  const POINTCAST_NOUN_ID = 137;
  const stampNounIds = Array.from({ length: 4 }, () => Math.floor(Math.random() * 1200));
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const siteTiles = [
    { label: "Collect", href: "/collect", arrow: "→" },
    { label: "About", href: "/about", arrow: "→" },
    { label: "Drum Room", href: "/drum", arrow: "→" },
    { label: "RSS", href: "/rss.xml", arrow: "→" }
  ];
  const craftTiles = [
    { label: "Shop", href: "/shop", arrow: "→" },
    { label: "objkt", href: "https://objkt.com/users/tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw", arrow: "↗", external: true },
    { label: "fxhash", href: "https://www.fxhash.xyz/u/mhoydich", arrow: "↗", external: true },
    { label: "Are.na", href: "https://www.are.na/michael-hoydich/channels", arrow: "↗", external: true }
  ];
  const socialTiles = [
    { label: "X", href: "https://x.com/mhoydich", arrow: "↗", external: true },
    { label: "GitHub", href: "https://github.com/mhoydich", arrow: "↗", external: true },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/mhoydich/", arrow: "↗", external: true },
    { label: "SoundCloud", href: "https://soundcloud.com/mikeisnice", arrow: "↗", external: true }
  ];
  const allTiles = [...siteTiles, ...craftTiles, ...socialTiles];
  return renderTemplate`${maybeRenderHead()}<footer class="border-t-2 border-ink/80 mt-16 bg-paper" role="contentinfo"> <div class="max-w-[60rem] mx-auto px-4 py-10"> <!-- IDENTITY BAND — noun + wordmark on left, tagline on right.
         Block-y mid-century: chunky typography, pixel noun, warm accent rule. --> <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 md:gap-10 mb-6 pb-6 border-b border-rule/30"> <div class="flex items-center gap-4 shrink-0"> <img${addAttribute(`https://noun.pics/${POINTCAST_NOUN_ID}.svg`, "src")} alt="PointCast Noun" width="52" height="52" class="block rounded-md ring-1 ring-warm/50" style="image-rendering: pixelated; width: 52px; height: 52px;" loading="lazy"> <div> <p class="font-mono text-xl md:text-2xl font-bold tracking-[0.22em] uppercase text-ink leading-none">
PointCast
</p> <p class="font-mono text-[0.52rem] tracking-[0.22em] uppercase text-ink-soft/50 mt-2">
El Segundo &middot; 90245 &middot; Pacific
</p> </div> </div> <p class="font-serif italic text-[1.05rem] md:text-[1.2rem] text-ink-soft/80 leading-snug md:text-right md:max-w-[22rem]">
Where taste meets machine.
</p> </div> <!-- MURAL GRID — Mondrian-style tile layout.
         The gap-px on a bg-rule/40 parent renders 1px lines between cells.
         Each tile's bg-paper blocks the rule except in the gaps. Hover tints
         to warm/10 for a gentle, pixel-era rollover. --> <nav aria-label="Site navigation" class="grid grid-cols-2 md:grid-cols-4 gap-px bg-rule/40 border border-rule/40 mb-6"> ${allTiles.map((t) => renderTemplate`<a${addAttribute(t.href, "href")} class="relative flex items-center justify-between px-3 py-3.5 md:px-4 md:py-4 bg-paper hover:bg-warm/8 transition-colors group"${spreadAttributes(t.external ? { target: "_blank", rel: "noopener" } : {})}> <span class="font-mono text-[0.68rem] md:text-[0.72rem] font-bold tracking-[0.14em] uppercase text-ink group-hover:text-warm transition-colors"> ${t.label} </span> <span class="flex items-center gap-1.5"> ${t.soon && renderTemplate`<span class="font-mono text-[0.46rem] tracking-[0.18em] uppercase text-warm/80 px-1.5 py-0.5 rounded-sm bg-warm/10 border border-warm/20">
soon
</span>`} <span class="font-mono text-warm/60 group-hover:text-warm transition-colors"> ${t.arrow} </span> </span> </a>`)} </nav> <!-- BOTTOM STRIP — signature stamps (four tiny nouns) + legal line.
         The stamps act as a little "printed-by" mark in the corner of a
         midcentury poster. They rotate per-build. --> <div class="flex flex-col-reverse md:flex-row items-start md:items-center justify-between gap-4 pt-2 font-mono text-[0.54rem] tracking-[0.16em] uppercase text-ink-soft/45"> <span>
&copy; ${year} &middot; Mike Hoydich &times; Claude Cowork
</span> <div class="flex items-center gap-2"> <span class="text-ink-soft/30">signed</span> <div class="flex gap-1"> ${stampNounIds.map((id) => renderTemplate`<img${addAttribute(`https://noun.pics/${id}.svg`, "src")} alt="" aria-hidden="true" width="20" height="20" class="noun-img rounded-sm opacity-35 hover:opacity-80 transition-opacity" style="image-rendering: pixelated; width: 20px; height: 20px;" loading="lazy">`)} </div> <span class="text-warm/50">PC</span> </div> </div> </div> </footer>`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/Footer.astro", void 0);

const $$CoNavigator = createComponent(($$result, $$props, $$slots) => {
  const SOUNDTRACKS_JSON = JSON.stringify(MOOD_SOUNDTRACKS);
  return renderTemplate`${maybeRenderHead()}<aside class="conav" id="pc-conav" aria-label="PointCast co-navigator" data-astro-cid-pz5vcrbi> <div class="conav__bar" data-astro-cid-pz5vcrbi> <div class="conav__identity" data-astro-cid-pz5vcrbi> <a class="conav__brand mono" href="/" aria-label="PointCast home" data-astro-cid-pz5vcrbi> <span class="conav__brand-mark" aria-hidden="true" data-astro-cid-pz5vcrbi>PC</span> <span class="conav__brand-text" data-astro-cid-pz5vcrbi>PointCast</span> </a> <button type="button" class="conav__mood" id="pc-conav-mood-btn" aria-label="Current mood - open soundtrack dock" aria-expanded="false" aria-controls="pc-conav-drawer" data-astro-cid-pz5vcrbi> <span class="conav__mood-dot" id="pc-conav-mood-dot" aria-hidden="true" data-astro-cid-pz5vcrbi></span> <span class="conav__mood-copy" data-astro-cid-pz5vcrbi> <span class="conav__eyebrow mono" data-astro-cid-pz5vcrbi>mood</span> <span class="conav__mood-label mono" id="pc-conav-mood-label" data-astro-cid-pz5vcrbi>SET MOOD</span> </span> </button> </div> <div class="conav__sound" data-astro-cid-pz5vcrbi> <button type="button" class="conav__play" id="pc-conav-play" aria-label="Play mood soundtrack" aria-expanded="false" aria-disabled="true" aria-controls="pc-conav-drawer" data-astro-cid-pz5vcrbi> <span class="conav__play-icon" aria-hidden="true" data-astro-cid-pz5vcrbi></span> <span class="conav__play-copy" data-astro-cid-pz5vcrbi> <span class="conav__eyebrow mono" data-astro-cid-pz5vcrbi>soundtrack</span> <span class="conav__play-label mono" id="pc-conav-play-label" data-astro-cid-pz5vcrbi>CHOOSE MOOD</span> </span> </button> </div> <div class="conav__status" aria-label="Live PointCast state" data-astro-cid-pz5vcrbi> <span class="conav__status-led" aria-hidden="true" data-astro-cid-pz5vcrbi></span> <span class="conav__status-label mono" data-astro-cid-pz5vcrbi>live</span> <span class="conav__stat mono" data-astro-cid-pz5vcrbi> <strong id="pc-conav-here" data-astro-cid-pz5vcrbi>·</strong> <span data-astro-cid-pz5vcrbi>here</span> </span> <span class="conav__stat mono" data-astro-cid-pz5vcrbi> <strong id="pc-conav-hello" data-astro-cid-pz5vcrbi>·</strong> <span data-astro-cid-pz5vcrbi>hello</span> </span> <span class="conav__stat mono" data-astro-cid-pz5vcrbi> <strong id="pc-conav-streak" data-astro-cid-pz5vcrbi>·</strong> <span data-astro-cid-pz5vcrbi>streak</span> </span> </div> <nav class="conav__actions" aria-label="Quick nav" data-astro-cid-pz5vcrbi> <a class="conav__link mono" href="/here" data-conav-route="/here" data-astro-cid-pz5vcrbi>Here</a> <a class="conav__link mono" href="/apps" data-conav-route="/apps" data-astro-cid-pz5vcrbi>Apps</a> <a class="conav__link mono" href="/workbench" data-conav-route="/workbench" data-astro-cid-pz5vcrbi>Workbench</a> <a class="conav__link mono" href="/drop" data-conav-route="/drop" data-astro-cid-pz5vcrbi>Drop</a> </nav> </div> <div class="conav__drawer" id="pc-conav-drawer" hidden${addAttribute(SOUNDTRACKS_JSON, "data-soundtracks")} data-astro-cid-pz5vcrbi> <div class="conav__drawer-head" data-astro-cid-pz5vcrbi> <div data-astro-cid-pz5vcrbi> <p class="conav__drawer-kicker mono" data-astro-cid-pz5vcrbi>now playing</p> <p class="conav__drawer-title mono" id="pc-conav-drawer-title" data-astro-cid-pz5vcrbi>soundtrack</p> </div> <button type="button" class="conav__drawer-close mono" id="pc-conav-close" aria-label="Close soundtrack" data-astro-cid-pz5vcrbi>close</button> </div> <!-- transition:persist keeps this iframe alive across ClientRouter soft-navs --> <iframe data-astro-transition-persist="pc-soundtrack" id="pc-conav-iframe" src="about:blank" title="Mood soundtrack" loading="lazy" allow="autoplay; encrypted-media" referrerpolicy="no-referrer-when-downgrade" data-astro-cid-pz5vcrbi></iframe> </div> </aside> ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/CoNavigator.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/CoNavigator.astro", "self");

const $$PeerCursors = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$PeerCursors;
  return renderTemplate`${maybeRenderHead()}<div id="pc-peer-cursors" class="pc-peer-cursors" aria-hidden="true" data-astro-cid-eicx4j25></div>  <form id="pc-cursor-say" class="pc-cursor-say" hidden data-astro-cid-eicx4j25> <input type="text" id="pc-cursor-say-input" class="pc-cursor-say__input" placeholder="say something — enter to send · esc to cancel" maxlength="120" autocomplete="off" aria-label="Speak from cursor" data-astro-cid-eicx4j25> </form> ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/PeerCursors.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/PeerCursors.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$BaseLayout;
  const {
    title,
    description = SITE_DESCRIPTION,
    // Versioned filename busts iMessage's aggressive LinkPresentation cache —
    // any client that previously cached the old og-default.png treats this as
    // a different URL and refetches. Bump the suffix when we change the art.
    image = "/images/og-home-v3.png",
    hideNav = false,
    frame = void 0
  } = Astro2.props;
  const siteTitle = title === "Home" ? "PointCast" : `${title} | PointCast`;
  const siteBase = Astro2.site || "https://pointcast.xyz";
  const canonicalURL = new URL(Astro2.url.pathname, siteBase);
  const ogImage = image.startsWith("http") ? image : new URL(image, siteBase).href;
  const identityJsonLd = buildIdentityJsonLd();
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="generator"', '><meta name="description"', '><meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"><meta name="author" content="Mike Hoydich"><meta name="creator" content="Mike Hoydich"><meta name="publisher" content="PointCast"><meta name="keywords"', `><meta name="application-name" content="PointCast"><meta name="geo.region" content="US-CA"><meta name="geo.placename" content="El Segundo, California"><meta name="geo.position" content="33.9192;-118.4165"><meta name="ICBM" content="33.9192, -118.4165"><meta name="pc-agents-manifest" content="https://pointcast.xyz/agents.json"><meta name="pc-llms" content="https://pointcast.xyz/llms.txt"><meta name="llm:manifest" content="https://pointcast.xyz/agents.json"><meta name="llm:summary" content="https://pointcast.xyz/llms.txt"><meta name="llm:context" content="https://pointcast.xyz/llms-full.txt"><!-- Mood persistence — read pc:mood from localStorage BEFORE paint
         so the page renders in the visitor's chosen mood from the first
         frame, no flicker. Per Mike 2026-04-20 13:55 PT: "rolling thru
         the site in that mood." --><script>
      (function () {
        try {
          var m = localStorage.getItem('pc:mood');
          if (m) document.documentElement.setAttribute('data-pc-mood', m);
        } catch (e) {}
      })();
    <\/script><meta name="theme-color" content="#f5efe4" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#12110e" media="(prefers-color-scheme: dark)"><link rel="canonical"`, '><link rel="alternate" hreflang="en-US"', '><link rel="alternate" hreflang="x-default"', ">", `<!-- Open Graph — explicit dimensions + type + secure_url dramatically
         improve unfurl reliability in iMessage (Apple's LinkPresentation
         sometimes silently drops previews when these are missing). --><meta property="og:title"`, '><meta property="og:description"', '><meta property="og:image"', '><meta property="og:image:secure_url"', '><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt"', '><meta property="og:type" content="website"><meta property="og:site_name" content="PointCast"><meta property="og:url"', '><meta property="og:locale" content="en_US">', '<!-- Twitter --><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"', '><meta name="twitter:description"', '><meta name="twitter:image"', '><meta name="twitter:image:alt"', '><meta name="twitter:site" content="@mhoydich"><!-- Fonts — display swap, trimmed to 8 variants actually used --><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,500&family=Outfit:wght@400&family=Syne:wght@700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet"><title>', '</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="alternate" type="application/rss+xml" title="PointCast" href="/rss.xml"><link rel="manifest" href="/manifest.webmanifest"><!-- Structured data (JSON-LD) — helps search engines, LLM crawlers,\n         and generative-engine citations (GEO) understand who made this\n         and what it is. `@graph` pattern so all three entities (Website,\n         Organization, Person) are declared in a single script without\n         duplication across pages. --><script type="application/ld+json">', "<\/script><!-- Mood tint — site-wide, paired with the mood-persistence script\n         above. Moved out of MoodChip's scoped styles so the tint\n         applies on every page, not just home. -->", "", '</head> <body class="min-h-screen flex flex-col bg-paper text-ink font-body"> <!-- Skip to content (accessibility) --> <a href="#main-content" class="skip-link">Skip to content</a> <main id="main-content" class="flex-1" role="main"> ', " </main> ", " ", " ", " ", " ", " </body></html>"], ['<html lang="en"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="generator"', '><meta name="description"', '><meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"><meta name="author" content="Mike Hoydich"><meta name="creator" content="Mike Hoydich"><meta name="publisher" content="PointCast"><meta name="keywords"', `><meta name="application-name" content="PointCast"><meta name="geo.region" content="US-CA"><meta name="geo.placename" content="El Segundo, California"><meta name="geo.position" content="33.9192;-118.4165"><meta name="ICBM" content="33.9192, -118.4165"><meta name="pc-agents-manifest" content="https://pointcast.xyz/agents.json"><meta name="pc-llms" content="https://pointcast.xyz/llms.txt"><meta name="llm:manifest" content="https://pointcast.xyz/agents.json"><meta name="llm:summary" content="https://pointcast.xyz/llms.txt"><meta name="llm:context" content="https://pointcast.xyz/llms-full.txt"><!-- Mood persistence — read pc:mood from localStorage BEFORE paint
         so the page renders in the visitor's chosen mood from the first
         frame, no flicker. Per Mike 2026-04-20 13:55 PT: "rolling thru
         the site in that mood." --><script>
      (function () {
        try {
          var m = localStorage.getItem('pc:mood');
          if (m) document.documentElement.setAttribute('data-pc-mood', m);
        } catch (e) {}
      })();
    <\/script><meta name="theme-color" content="#f5efe4" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#12110e" media="(prefers-color-scheme: dark)"><link rel="canonical"`, '><link rel="alternate" hreflang="en-US"', '><link rel="alternate" hreflang="x-default"', ">", `<!-- Open Graph — explicit dimensions + type + secure_url dramatically
         improve unfurl reliability in iMessage (Apple's LinkPresentation
         sometimes silently drops previews when these are missing). --><meta property="og:title"`, '><meta property="og:description"', '><meta property="og:image"', '><meta property="og:image:secure_url"', '><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt"', '><meta property="og:type" content="website"><meta property="og:site_name" content="PointCast"><meta property="og:url"', '><meta property="og:locale" content="en_US">', '<!-- Twitter --><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"', '><meta name="twitter:description"', '><meta name="twitter:image"', '><meta name="twitter:image:alt"', '><meta name="twitter:site" content="@mhoydich"><!-- Fonts — display swap, trimmed to 8 variants actually used --><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,500&family=Outfit:wght@400&family=Syne:wght@700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet"><title>', '</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="alternate" type="application/rss+xml" title="PointCast" href="/rss.xml"><link rel="manifest" href="/manifest.webmanifest"><!-- Structured data (JSON-LD) — helps search engines, LLM crawlers,\n         and generative-engine citations (GEO) understand who made this\n         and what it is. \\`@graph\\` pattern so all three entities (Website,\n         Organization, Person) are declared in a single script without\n         duplication across pages. --><script type="application/ld+json">', "<\/script><!-- Mood tint — site-wide, paired with the mood-persistence script\n         above. Moved out of MoodChip's scoped styles so the tint\n         applies on every page, not just home. -->", "", '</head> <body class="min-h-screen flex flex-col bg-paper text-ink font-body"> <!-- Skip to content (accessibility) --> <a href="#main-content" class="skip-link">Skip to content</a> <main id="main-content" class="flex-1" role="main"> ', " </main> ", " ", " ", " ", " ", " </body></html>"])), addAttribute(Astro2.generator, "content"), addAttribute(description, "content"), addAttribute(SITE_KEYWORDS.join(", "), "content"), addAttribute(canonicalURL, "href"), addAttribute(canonicalURL, "href"), addAttribute(canonicalURL, "href"), DISCOVERY_LINKS.map((link) => renderTemplate`<link${addAttribute(link.rel, "rel")}${addAttribute(link.type, "type")}${addAttribute(link.href, "href")}${addAttribute(link.title, "title")}>`), addAttribute(siteTitle, "content"), addAttribute(description, "content"), addAttribute(ogImage, "content"), addAttribute(ogImage, "content"), addAttribute(siteTitle, "content"), addAttribute(canonicalURL, "content"), frame && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate`<meta property="fc:frame" content="vNext"><meta property="fc:frame:image"${addAttribute(frame.image, "content")}><meta property="fc:frame:image:aspect_ratio" content="1.91:1"><meta property="fc:frame:post_url"${addAttribute(frame.postUrl, "content")}><meta property="fc:frame:button:1"${addAttribute(frame.button1Label, "content")}>${frame.button2Label && frame.button2Target && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate`<meta property="fc:frame:button:2"${addAttribute(frame.button2Label, "content")}><meta property="fc:frame:button:2:action" content="link"><meta property="fc:frame:button:2:target"${addAttribute(frame.button2Target, "content")}>` })}`}` })}`, addAttribute(siteTitle, "content"), addAttribute(description, "content"), addAttribute(ogImage, "content"), addAttribute(siteTitle, "content"), siteTitle, unescapeHTML(JSON.stringify(identityJsonLd)), renderComponent($$result, "ClientRouter", $$ClientRouter, {}), renderHead(), renderSlot($$result, $$slots["default"]), renderComponent($$result, "Footer", $$Footer, {}), renderComponent($$result, "CoNavigator", $$CoNavigator, {}), renderComponent($$result, "FreshnessChip", $$FreshnessChip, {}), renderComponent($$result, "FirstSee", $$FirstSee, {}), renderComponent($$result, "PeerCursors", $$PeerCursors, {}));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/layouts/BaseLayout.astro", void 0);

export { $$BaseLayout as $ };
