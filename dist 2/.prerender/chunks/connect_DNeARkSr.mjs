import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, u as unescapeHTML } from './prerender_CmTjnOuJ.mjs';
import { $ as $$SparrowLayout } from './SparrowLayout_VSvjr4EN.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';

const prerender = true;
const $$Connect = createComponent(async ($$result, $$props, $$slots) => {
  const blocks = await getCollection("blocks", ({ data }) => !data.draft);
  const totalBlocks = blocks.length;
  const features = [
    { kicker: "menu bar", title: "✦ in the status bar", body: 'A single glyph. Grows an ember "new" count when fresh blocks land.' },
    { kicker: "polling", title: "Quiet, on a cadence", body: "Hits /sparrow/api/latest.json every 5 minutes by default (30 s floor, 1 h ceiling)." },
    { kicker: "notifications", title: "One per block · digest beyond three", body: "Notification Center alerts for arrivals; a single digest when more than three land at once." },
    { kicker: "preferences", title: "Endpoint, interval, notifications", body: "A small AppKit panel — no onboarding flow, no account. Point it at a fork or local dev if you want." },
    { kicker: "privacy", title: "One URL, no telemetry", body: "Sparrow.app opens exactly one network connection: the feed URL you chose. Nothing else leaves the device." },
    { kicker: "footprint", title: "No dock icon, no cmd-tab", body: "LSUIElement = true. Lives in the menu bar and the menu bar only." }
  ];
  const steps = [
    {
      kicker: "one",
      title: "Clone or download the source",
      body: "github.com/mhoydich/sparrow-app — self-contained Swift package, no external dependencies."
    },
    {
      kicker: "two",
      title: "Build with Xcode or SPM",
      body: "`open Package.swift` for a proper bundled `.app` (recommended), or `swift run SparrowApp` for a quick menu-bar-visible test from the terminal."
    },
    {
      kicker: "three",
      title: "Grant notification permission",
      body: "On first run macOS asks once. Decline safely — the app still works, it just stops posting alerts."
    },
    {
      kicker: "four",
      title: "Open Preferences if you want",
      body: "⌘, from the menu. Feed URL defaults to https://pointcast.xyz/sparrow/api/latest.json; change it if you're running a fork."
    }
  ];
  return renderTemplate`${renderComponent($$result, "SparrowLayout", $$SparrowLayout, { "title": "Connect — native companion", "description": "Get the native macOS menu-bar companion for Sparrow. Swift 5.9+, macOS 13+, no external dependencies.", "canonicalPath": "/sparrow/connect", "homeHref": "/sparrow", "data-astro-cid-k5o3gqao": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="sp-connect-hero" data-astro-cid-k5o3gqao> <span class="sp-kicker" data-astro-cid-k5o3gqao>✦ sparrow.app · native companion · v0.6</span> <h1 class="sp-connect-title" data-astro-cid-k5o3gqao>
A second ✦ in the menu bar<br data-astro-cid-k5o3gqao> <em data-astro-cid-k5o3gqao>that pulses when new blocks land.</em> </h1> <p class="sp-connect-dek" data-astro-cid-k5o3gqao>
Sparrow.app is a small macOS menu-bar app that polls
<code data-astro-cid-k5o3gqao>/sparrow/api/latest.json</code> at a cadence you choose, shows
      the latest block and a "new since last open" count, and posts a
      Notification Center alert when fresh broadcasts arrive. No Dock
      icon, no Cmd-Tab entry — just <code data-astro-cid-k5o3gqao>✦</code> in the status bar,
      same glyph as the hosted HUD.
</p> <div class="sp-connect-cta" data-astro-cid-k5o3gqao> <a href="https://github.com/mhoydich/sparrow-app" class="sp-connect-cta-primary" data-astro-cid-k5o3gqao>
github.com/mhoydich/sparrow-app →
</a> <a href="/sparrow/api/latest.json" class="sp-connect-cta-ghost" data-astro-cid-k5o3gqao>api/latest.json →</a> </div> </section> <section class="sp-about-section" data-astro-cid-k5o3gqao> <header class="sp-reel-head" data-astro-cid-k5o3gqao> <span class="sp-kicker" data-astro-cid-k5o3gqao>✦ what it does</span> </header> <ul class="sp-about-features" data-astro-cid-k5o3gqao> ${features.map((f) => renderTemplate`<li class="sp-feature" data-astro-cid-k5o3gqao> <span class="sp-feature-kbd" data-astro-cid-k5o3gqao>${f.kicker}</span> <div class="sp-feature-text" data-astro-cid-k5o3gqao> <h3 class="sp-feature-title" data-astro-cid-k5o3gqao>${f.title}</h3> <p class="sp-feature-body" data-astro-cid-k5o3gqao>${f.body}</p> </div> </li>`)} </ul> </section> <section class="sp-about-section" data-astro-cid-k5o3gqao> <header class="sp-reel-head" data-astro-cid-k5o3gqao> <span class="sp-kicker" data-astro-cid-k5o3gqao>✦ build + run</span> </header> <ol class="sp-connect-steps" data-astro-cid-k5o3gqao> ${steps.map((s) => renderTemplate`<li data-astro-cid-k5o3gqao> <span class="sp-connect-step-n" data-astro-cid-k5o3gqao>${s.kicker}</span> <div data-astro-cid-k5o3gqao> <h3 data-astro-cid-k5o3gqao>${s.title}</h3> <p data-astro-cid-k5o3gqao>${unescapeHTML(s.body.replace(/`([^`]+)`/g, "<code>$1</code>"))}</p> </div> </li>`)} </ol> <pre class="sp-connect-shell" data-astro-cid-k5o3gqao><code data-astro-cid-k5o3gqao>cd sparrow-app
open Package.swift       # Xcode — recommended, signs + bundles
# or
swift run SparrowApp     # terminal — live menu-bar item, no bundle</code></pre> <p class="sp-aside-mono" style="color: var(--sp-mute); margin-top: 14px;" data-astro-cid-k5o3gqao>
Tiny package — one executable target, one Resources/Info.plist,
      about 500 lines of Swift split across seven files. Reads in one
      sitting. Source: <a class="sp-link" href="https://github.com/mhoydich/sparrow-app" data-astro-cid-k5o3gqao>mhoydich/sparrow-app</a>.
</p> </section> <section class="sp-about-section" data-astro-cid-k5o3gqao> <header class="sp-reel-head" data-astro-cid-k5o3gqao> <span class="sp-kicker" data-astro-cid-k5o3gqao>✦ the feed it polls</span> </header> <p style="margin: 0 0 12px; color: var(--sp-ash);" data-astro-cid-k5o3gqao>
The endpoint at <code data-astro-cid-k5o3gqao>/sparrow/api/latest.json</code> is a
      polling-shaped companion to the Atom feed: snake_case keys,
      summary-only fields, last 24 blocks, cache-friendly. The native
      app decodes it directly into the same <code data-astro-cid-k5o3gqao>Block</code> struct
      the menu bar renders.
</p> <pre class="sp-connect-shell" data-astro-cid-k5o3gqao><code data-astro-cid-k5o3gqao>${`{
  "total": ${totalBlocks},
  "updated_at": "2026-04-21T...",
  "window": 24,
  "origin": "https://pointcast.xyz",
  "blocks": [
    {
      "id": "0362",
      "title": "AgarChat — instant messenger meets agar.io",
      "dek": "...",
      "channel": "FD",
      "type": "LINK",
      "mood": null,
      "timestamp": "2026-04-21T12:00:00-08:00",
      "author": "mh+cc",
      "url": "/b/0362",
      "sparrow_url": "/sparrow/b/0362"
    }
  ]
}`}</code></pre> </section> <aside class="sp-beacon" data-astro-cid-k5o3gqao> <span class="sp-beacon-sweep" aria-hidden="true" data-astro-cid-k5o3gqao></span> <span class="sp-beacon-kicker" data-astro-cid-k5o3gqao>✦ sibling projects</span> <span class="sp-beacon-body" data-astro-cid-k5o3gqao> <a class="sp-link" href="/" data-astro-cid-k5o3gqao>pointcast</a> broadcasts ·
<a class="sp-link" href="/magpie" data-astro-cid-k5o3gqao>magpie</a> publishes ·
      sparrow reads · sparrow.app perches in the menu bar
</span> <a href="/sparrow" class="sp-link sp-beacon-cta" data-astro-cid-k5o3gqao>back to reel →</a> </aside> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sparrow/connect.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sparrow/connect.astro";
const $$url = "/sparrow/connect";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Connect,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
