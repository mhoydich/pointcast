import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { m as maybeRenderHead, a as renderTemplate, r as renderComponent, c as renderSlot, e as renderHead, u as unescapeHTML, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
/* empty css                */
/* empty css                 */
import { $ as $$WalletChip } from './WalletChip_CCc3HKnc.mjs';
import 'clsx';
import { r as renderScript } from './script_AUITBxpA.mjs';

const $$NounsCursor = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div id="nouns-cursor" aria-hidden="true"> <img id="nouns-cursor-img" src="" alt="" width="32" height="32"> </div>  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/NounsCursor.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/NounsCursor.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$DrumLayout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$DrumLayout;
  const {
    title,
    description = "Multiplayer drum room on pointcast.xyz. Tap rhythms, chain combos, hear everyone else in real time. DRUM tokens on Tezos soon.",
    image = "/images/og-drum.png",
    jsonLd
  } = Astro2.props;
  const siteBase = Astro2.site || new URL("https://pointcast.xyz");
  const canonicalURL = new URL(Astro2.url.pathname, siteBase);
  const ogImage = image.startsWith("http") ? image : new URL(image, siteBase).href;
  const siteTitle = title === "Home" || title === "" ? "PointCast" : `${title} — PointCast`;
  const miniappLaunchUrl = new URL(Astro2.url.pathname, siteBase).href;
  const miniappImageUrl = new URL("/images/drum-og.png", siteBase).href;
  const miniappSplashUrl = new URL("/images/drum-splash.png", siteBase).href;
  const miniappEmbed = {
    version: "1",
    imageUrl: miniappImageUrl,
    button: {
      title: "Play drums",
      action: {
        type: "launch_miniapp",
        url: miniappLaunchUrl,
        name: "Noun Drum Rack",
        splashImageUrl: miniappSplashUrl,
        splashBackgroundColor: "#ffffff"
      }
    }
  };
  const legacyFrameEmbed = {
    ...miniappEmbed,
    button: {
      ...miniappEmbed.button,
      action: {
        ...miniappEmbed.button.action,
        type: "launch_frame"
      }
    }
  };
  const defaultJsonLd = jsonLd ?? {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${canonicalURL.href}#webapp`,
        name: siteTitle,
        url: canonicalURL.href,
        description,
        applicationCategory: "Game",
        applicationSubCategory: "Music",
        operatingSystem: "Any (web browser)",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        browserRequirements: "Requires JavaScript and Web Audio API support.",
        featureList: [
          "Multiplayer drum room",
          "Pentatonic voice assignment for harmonic collaboration",
          "Real-time peer drum events",
          "Tezos DRUM token rewards (Phase C)",
          "Spotify track sync (v3)"
        ],
        potentialAction: {
          "@type": "PlayAction",
          target: canonicalURL.href
        }
      },
      {
        "@type": "CreativeWork",
        "@id": `${canonicalURL.href}#creative`,
        name: "PointCast Drum Room",
        author: {
          "@type": "Person",
          name: "Mike Hoydich",
          url: "https://pointcast.xyz/about"
        },
        isPartOf: {
          "@type": "WebSite",
          name: "PointCast",
          url: "https://pointcast.xyz"
        },
        keywords: "collaborative drum machine, online drum, pentatonic, Tezos, Nouns, multiplayer music, real-time browser audio"
      }
    ]
  };
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="generator"', '><meta name="description"', '><meta name="theme-color" content="#ffffff"><link rel="canonical"', '><meta property="og:title"', '><meta property="og:description"', '><meta property="og:image"', '><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:type" content="website"><meta property="og:site_name" content="PointCast"><meta property="og:url"', '><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"', '><meta name="twitter:description"', '><meta name="twitter:image"', '><meta name="twitter:site" content="@mhoydich"><meta name="fc:miniapp"', '><meta name="fc:frame"', '><script type="application/ld+json">', "<\/script><title>", '</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="manifest" href="/manifest.webmanifest">', '</head> <body class="drum-body"> <a href="#main-content" class="skip-link">Skip to content</a> <header class="drum-header"> <nav class="drum-header__inner"> <a href="/" class="drum-header__wordmark" aria-label="PointCast home">POINTCAST</a> <span class="drum-header__sep" aria-hidden="true">·</span> <a href="/drum" class="drum-header__kicker">CH.SPN · DRUM ROOM</a> <span class="drum-header__spacer" aria-hidden="true"></span> ', ' </nav> </header> <main id="main-content" role="main"> ', " </main> ", " <script>\n      async function markMiniAppReady() {\n        try {\n          const { sdk } = await import(/* @vite-ignore */ '@farcaster/miniapp-sdk');\n          await sdk.actions.ready();\n          document.documentElement.dataset.farcasterMiniapp = 'ready';\n        } catch {\n          document.documentElement.dataset.farcasterMiniapp = 'unavailable';\n        }\n      }\n\n      if (document.readyState === 'loading') {\n        document.addEventListener('DOMContentLoaded', markMiniAppReady, { once: true });\n      } else {\n        markMiniAppReady();\n      }\n    <\/script> </body> </html> "])), addAttribute(Astro2.generator, "content"), addAttribute(description, "content"), addAttribute(canonicalURL, "href"), addAttribute(siteTitle, "content"), addAttribute(description, "content"), addAttribute(ogImage, "content"), addAttribute(canonicalURL, "content"), addAttribute(siteTitle, "content"), addAttribute(description, "content"), addAttribute(ogImage, "content"), addAttribute(JSON.stringify(miniappEmbed), "content"), addAttribute(JSON.stringify(legacyFrameEmbed), "content"), unescapeHTML(JSON.stringify(defaultJsonLd)), siteTitle, renderHead(), renderComponent($$result, "WalletChip", $$WalletChip, {}), renderSlot($$result, $$slots["default"]), renderComponent($$result, "NounsCursor", $$NounsCursor, {}));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/layouts/DrumLayout.astro", void 0);

export { $$DrumLayout as $ };
