import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Magpie = createComponent(async ($$result, $$props, $$slots) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/magpie",
    name: "Magpie",
    description: "A macOS clipboard peer-node + multi-publisher broadcaster. Local-first capture, CC0 unfurls, block-type detection, and a composer that fans one clip out to PointCast (canonical), Mastodon, Farcaster, and bitchat (Nostr + BLE mesh) with per-destination previews.",
    url: "https://pointcast.xyz/magpie",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "macOS 13+",
    downloadUrl: "https://github.com/Good-Feels/magpie/releases/latest"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Magpie", "description": "A field companion to PointCast. Copy anything — Magpie captures, unfurls, and broadcasts it to PointCast (canonical home), Mastodon, Farcaster, and bitchat (Nostr + BLE mesh) in one compose.", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/magpie.json", title: "Magpie manifest (JSON)" }], "frame": {
    image: "https://pointcast.xyz/images/og/og-home-v2.png",
    buttons: [
      { label: "Open Magpie", action: "link", target: "https://pointcast.xyz/magpie" },
      { label: "Install", action: "link", target: "https://github.com/Good-Feels/magpie/releases/latest" },
      { label: "Source", action: "link", target: "https://github.com/Good-Feels/magpie" }
    ]
  }, "data-astro-cid-7of5oa5s": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", `<div class="magpie-root" data-astro-cid-7of5oa5s> <nav class="mg-crumb" data-astro-cid-7of5oa5s> <a href="/" data-astro-cid-7of5oa5s>← Home</a> </nav> <header class="mg-bar" data-astro-cid-7of5oa5s> <div class="mg-masthead" data-astro-cid-7of5oa5s> <div class="mg-brand" data-astro-cid-7of5oa5s> <span class="mg-kicker" data-astro-cid-7of5oa5s>Field clippings · from your machine</span> <div class="mg-wordmark" data-astro-cid-7of5oa5s> <span class="mg-logo" aria-hidden="true" data-astro-cid-7of5oa5s>🐦‍⬛</span> <strong data-astro-cid-7of5oa5s>Magpie</strong> </div> <div class="mg-tagline" data-astro-cid-7of5oa5s>A specimen book for things worth keeping — pressed at home on PointCast, broadcast from there to Mastodon, Farcaster, and out to bitchat's mesh.</div> </div> <div class="mg-controls" data-astro-cid-7of5oa5s> <input id="mg-q" type="search" placeholder="search the archive" autocomplete="off" data-astro-cid-7of5oa5s> <label class="mg-chk" data-astro-cid-7of5oa5s><input id="mg-pinnedOnly" type="checkbox" data-astro-cid-7of5oa5s> pressed only</label> <button id="mg-refresh" type="button" title="reload" data-astro-cid-7of5oa5s>↻</button> </div> </div> </header> <section class="mg-meta" data-astro-cid-7of5oa5s> <div data-astro-cid-7of5oa5s> <span class="mg-k" data-astro-cid-7of5oa5s>node</span> <code id="mg-node" data-astro-cid-7of5oa5s>127.0.0.1:38473</code> <span class="mg-dot" data-astro-cid-7of5oa5s>·</span> <span class="mg-k" data-astro-cid-7of5oa5s>pointcast</span> <code id="mg-pcEndpoint" data-astro-cid-7of5oa5s>—</code> <span class="mg-dot" data-astro-cid-7of5oa5s>·</span> <span class="mg-k" data-astro-cid-7of5oa5s>from</span> <code id="mg-pcFrom" data-astro-cid-7of5oa5s>—</code> </div> <div data-astro-cid-7of5oa5s> <span id="mg-status" class="mg-pill checking" data-astro-cid-7of5oa5s><span class="mg-pill-dot" data-astro-cid-7of5oa5s></span>checking</span> </div> </section> <section id="mg-install" class="mg-install" hidden data-astro-cid-7of5oa5s> <div class="mg-install-card" data-astro-cid-7of5oa5s> <p class="mg-kicker mg-install-kicker" data-astro-cid-7of5oa5s>Magpie · not reachable</p> <h2 class="mg-install-title" data-astro-cid-7of5oa5s>
Bring this page to life by running Magpie on your Mac.
</h2> <p class="mg-install-dek" data-astro-cid-7of5oa5s>
This is the hosted window into a clipboard app that lives on your
          own machine. Nothing leaves the device unless you press <em data-astro-cid-7of5oa5s>push</em>.
          Set-up takes about sixty seconds.
</p> <ol class="mg-install-steps" data-astro-cid-7of5oa5s> <li data-astro-cid-7of5oa5s> <span class="mg-step-n" data-astro-cid-7of5oa5s>1</span> <div data-astro-cid-7of5oa5s> <strong data-astro-cid-7of5oa5s>Download the latest build.</strong> <a href="https://github.com/Good-Feels/magpie/releases/latest" target="_blank" rel="noopener" data-astro-cid-7of5oa5s>
github.com/Good-Feels/magpie/releases
</a>
— drag <code data-astro-cid-7of5oa5s>Magpie.app</code> to Applications.
</div> </li> <li data-astro-cid-7of5oa5s> <span class="mg-step-n" data-astro-cid-7of5oa5s>2</span> <div data-astro-cid-7of5oa5s> <strong data-astro-cid-7of5oa5s>Launch it.</strong> Look for the clipboard icon in your
              menu bar. Grant clipboard access when prompted.
</div> </li> <li data-astro-cid-7of5oa5s> <span class="mg-step-n" data-astro-cid-7of5oa5s>3</span> <div data-astro-cid-7of5oa5s> <strong data-astro-cid-7of5oa5s>Turn on the peer node.</strong> Settings →
<em data-astro-cid-7of5oa5s>PointCast</em> → <em data-astro-cid-7of5oa5s>Serve local web UI</em>. This page will
              connect automatically.
</div> </li> <li data-astro-cid-7of5oa5s> <span class="mg-step-n" data-astro-cid-7of5oa5s>4</span> <div data-astro-cid-7of5oa5s> <strong data-astro-cid-7of5oa5s>Point it at PointCast.</strong> Magpie ships pre-pointed
              at <code data-astro-cid-7of5oa5s>pointcast.xyz/api/ping</code>, so this is usually
              zero work — but if you're running a fork or a local broadcast,
              set the endpoint under <em data-astro-cid-7of5oa5s>Preferences → PointCast → Connection</em>.
              Use the <em data-astro-cid-7of5oa5s>Test Connection</em> button to confirm; Magpie
              persists the endpoint + your <em data-astro-cid-7of5oa5s>From</em> name + optional
              Tezos address and the hosted UI reads them from the peer-node's
<code data-astro-cid-7of5oa5s>/config.json</code>.
<div class="mg-endpoint-copy" data-astro-cid-7of5oa5s> <span class="mg-kicker mg-endpoint-copy-kicker" data-astro-cid-7of5oa5s>canonical endpoint</span> <code class="mg-endpoint-copy-url" id="mg-pc-endpoint-display" data-astro-cid-7of5oa5s>https://pointcast.xyz/api/ping</code> <button class="mg-btn ghost mg-endpoint-copy-btn" type="button" id="mg-pc-endpoint-copy" data-mg-copy="https://pointcast.xyz/api/ping" data-astro-cid-7of5oa5s>copy</button> </div> </div> </li> <li data-astro-cid-7of5oa5s> <span class="mg-step-n" data-astro-cid-7of5oa5s>5</span> <div data-astro-cid-7of5oa5s> <strong data-astro-cid-7of5oa5s>Copy something.</strong> Come back here. Every URL
              unfurls; every clip can be broadcast to PointCast <em data-astro-cid-7of5oa5s>and</em>
your other homes with a title, a dek, and a chosen channel.
</div> </li> </ol> <div class="mg-destinations" data-astro-cid-7of5oa5s> <p class="mg-kicker mg-destinations-kicker" data-astro-cid-7of5oa5s>v1.0 · broadcast destinations</p> <p class="mg-destinations-dek" data-astro-cid-7of5oa5s>
One compose, many homes. Eleven destinations behind one
            protocol — social, mesh, and on-chain. PointCast is your
            canonical home; the rest carry the same clip to the feeds
            you already tend + the mesh you take with you.
</p> <ul class="mg-destinations-grid" data-astro-cid-7of5oa5s> <li data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>PC</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>PointCast</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>canonical · 4000</span></li> <li data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>MA</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>Mastodon</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>any instance · 500 · threads</span></li> <li data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>FC</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>Farcaster</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>Neynar · 320 · IPFS embeds</span></li> <li data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>BC</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>bitchat</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>Nostr + BLE mesh · 280</span></li> <li data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>BS</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>Bluesky</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>AT Proto · 300 · rich cards</span></li> <li data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>TW</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>Twitter / X</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>OAuth 2.0 · 280 · threads</span></li> <li data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>LI</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>LinkedIn</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>UGC posts · 3000</span></li> </ul> <p class="mg-kicker mg-destinations-subkicker" data-astro-cid-7of5oa5s>shipping next · v1.0 · skeletons in place, real paths activate with crypto deps</p> <ul class="mg-destinations-grid" data-astro-cid-7of5oa5s> <li class="mg-dest-future" data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>IG</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>Instagram</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>Graph API · Business account</span></li> <li class="mg-dest-future" data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>ZO</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>Zora</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>MINT on Base · EVMSigner</span></li> <li class="mg-dest-future" data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>OB</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>Objkt</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>MINT on Tezos · Teia FA2</span></li> <li class="mg-dest-future" data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>OS</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>OpenSea</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>Seaport listings · post-mint reach</span></li> </ul> </div> <div class="mg-install-cta" data-astro-cid-7of5oa5s> <a class="mg-btn primary" href="https://github.com/Good-Feels/magpie/releases/latest" target="_blank" rel="noopener" data-astro-cid-7of5oa5s>Download · macOS 13+</a> <a class="mg-btn ghost" href="https://github.com/Good-Feels/magpie" target="_blank" rel="noopener" data-astro-cid-7of5oa5s>Source</a> <button class="mg-btn ghost" type="button" id="mg-retry" data-astro-cid-7of5oa5s>Retry connection</button> <button class="mg-btn ghost mg-demo-btn" type="button" id="mg-demo" data-astro-cid-7of5oa5s>Try demo mode ↝</button> </div> <details class="mg-settings" data-astro-cid-7of5oa5s> <summary data-astro-cid-7of5oa5s>Advanced · change local node endpoint</summary> <div class="mg-settings-body" data-astro-cid-7of5oa5s> <label class="mg-label" for="mg-endpoint" data-astro-cid-7of5oa5s>Peer-node URL</label> <div class="mg-endpoint-row" data-astro-cid-7of5oa5s> <input type="text" id="mg-endpoint" placeholder="http://127.0.0.1:38473" autocomplete="off" spellcheck="false" data-astro-cid-7of5oa5s> <button class="mg-btn ghost" type="button" id="mg-endpoint-save" data-astro-cid-7of5oa5s>Save</button> <button class="mg-btn ghost" type="button" id="mg-endpoint-reset" data-astro-cid-7of5oa5s>Reset</button> </div> <p class="mg-settings-hint" data-astro-cid-7of5oa5s>
Default is <code data-astro-cid-7of5oa5s>http://127.0.0.1:38473</code>. If you changed the
              port in Magpie Preferences or you're running on a non-default
              loopback, set it here. Stored in this browser only.
</p> </div> </details> </div> </section> <div id="mg-demo-banner" class="mg-demo-banner" hidden data-astro-cid-7of5oa5s> <span class="mg-kicker" data-astro-cid-7of5oa5s>❧ Demo mode</span> <span class="mg-demo-copy" data-astro-cid-7of5oa5s>Browsing sample specimens. Push is disabled — install Magpie locally to capture your own clipboard.</span> <button class="mg-btn ghost" type="button" id="mg-demo-exit" data-astro-cid-7of5oa5s>Exit demo</button> </div> <main id="mg-grid" class="mg-grid" aria-live="polite" hidden data-astro-cid-7of5oa5s></main> <footer class="mg-foot" data-astro-cid-7of5oa5s> <span id="mg-count" data-astro-cid-7of5oa5s>—</span> <span class="mg-dot" data-astro-cid-7of5oa5s>·</span> <span data-astro-cid-7of5oa5s>peer node · v0.4</span> <span class="mg-dot" data-astro-cid-7of5oa5s>·</span> <a href="/magpie.json" data-astro-cid-7of5oa5s>magpie.json</a> <span class="mg-dot" data-astro-cid-7of5oa5s>·</span> <a href="https://github.com/Good-Feels/magpie" target="_blank" rel="noopener" data-astro-cid-7of5oa5s>github</a> </footer> <template id="mg-tpl-clip" data-astro-cid-7of5oa5s> <article class="mg-clip" data-astro-cid-7of5oa5s> <header class="mg-clip-head" data-astro-cid-7of5oa5s> <span class="mg-block-code" data-astro-cid-7of5oa5s></span> <span class="mg-sep" data-astro-cid-7of5oa5s>·</span> <span class="mg-src" data-astro-cid-7of5oa5s></span> <span class="mg-count-badge" hidden data-astro-cid-7of5oa5s></span> <time class="mg-ts" data-astro-cid-7of5oa5s></time> <span class="mg-pin" hidden data-astro-cid-7of5oa5s>❋</span> </header> <div class="mg-body" data-astro-cid-7of5oa5s></div> <footer class="mg-clip-foot" data-astro-cid-7of5oa5s> <button class="mg-act mg-copy" type="button" title="copy text" data-astro-cid-7of5oa5s>copy</button> <button class="mg-act mg-push" type="button" title="push to PointCast inbox" data-astro-cid-7of5oa5s>push →</button> <button class="mg-act mg-push-expand" type="button" title="expand into a block" data-astro-cid-7of5oa5s>expand ✤</button> <span class="mg-result" data-astro-cid-7of5oa5s></span> </footer> </article> </template> <div id="mg-expandBackdrop" class="mg-expand-backdrop" hidden data-astro-cid-7of5oa5s> <div class="mg-expand-modal" role="dialog" aria-labelledby="mg-expandTitle" data-astro-cid-7of5oa5s> <header class="mg-expand-head" data-astro-cid-7of5oa5s> <div class="mg-kicker mg-expand-kicker" data-astro-cid-7of5oa5s>Expand into a block</div> <div class="mg-expand-title" id="mg-expandTitle" data-astro-cid-7of5oa5s>Publish this clip to PointCast</div> <button class="mg-close" type="button" aria-label="close" data-mg-close data-astro-cid-7of5oa5s>✕</button> </header> <div class="mg-expand-body" data-astro-cid-7of5oa5s> <div class="mg-field-row" data-astro-cid-7of5oa5s> <div class="mg-field" data-astro-cid-7of5oa5s> <label class="mg-label" for="mg-xChannel" data-astro-cid-7of5oa5s>Channel <span class="mg-hint" data-astro-cid-7of5oa5s>where this lives</span></label> <select id="mg-xChannel" data-astro-cid-7of5oa5s></select> </div> <div class="mg-field" data-astro-cid-7of5oa5s> <label class="mg-label" for="mg-xBlockType" data-astro-cid-7of5oa5s>Type</label> <select id="mg-xBlockType" data-astro-cid-7of5oa5s> <option value="READ" data-astro-cid-7of5oa5s>READ</option> <option value="NOTE" data-astro-cid-7of5oa5s>NOTE</option> <option value="LISTEN" data-astro-cid-7of5oa5s>LISTEN</option> <option value="WATCH" data-astro-cid-7of5oa5s>WATCH</option> <option value="LINK" data-astro-cid-7of5oa5s>LINK</option> <option value="VISIT" data-astro-cid-7of5oa5s>VISIT</option> <option value="MINT" data-astro-cid-7of5oa5s>MINT</option> </select> </div> </div> <div class="mg-field" data-astro-cid-7of5oa5s> <label class="mg-label" for="mg-xTitle" data-astro-cid-7of5oa5s>Title</label> <input type="text" id="mg-xTitle" maxlength="120" placeholder="Title of this block" data-astro-cid-7of5oa5s> </div> <div class="mg-field" data-astro-cid-7of5oa5s> <label class="mg-label" for="mg-xDek" data-astro-cid-7of5oa5s>Dek <span class="mg-hint" data-astro-cid-7of5oa5s>a line of framing — optional</span></label> <textarea id="mg-xDek" maxlength="280" placeholder="A short description, a dek, what should a reader know?" data-astro-cid-7of5oa5s></textarea> </div> <div class="mg-field" data-astro-cid-7of5oa5s> <label class="mg-label" for="mg-xBody" data-astro-cid-7of5oa5s>Body <span class="mg-hint" data-astro-cid-7of5oa5s>what actually lives in the block</span></label> <textarea id="mg-xBody" maxlength="4000" data-astro-cid-7of5oa5s></textarea> </div> <div class="mg-citation" data-astro-cid-7of5oa5s> <span class="mg-cite-head" data-astro-cid-7of5oa5s>Citation preview</span> <span class="mg-cite-line" data-astro-cid-7of5oa5s>PointCast · <strong data-astro-cid-7of5oa5s><span id="mg-xCiteChannel" data-astro-cid-7of5oa5s>CH.FD</span></strong> · № —</span> <div class="mg-cite-title" id="mg-xCiteTitle" data-astro-cid-7of5oa5s>—</div> <span class="mg-cite-line" id="mg-xCiteDate" data-astro-cid-7of5oa5s>—</span> </div> </div> <footer class="mg-expand-foot" data-astro-cid-7of5oa5s> <span class="mg-note" data-astro-cid-7of5oa5s>Expansion runs on Claude Code's next tick · edits go in as hints</span> <div class="mg-buttons" data-astro-cid-7of5oa5s> <button class="mg-btn ghost" type="button" data-mg-close data-astro-cid-7of5oa5s>cancel</button> <button class="mg-btn primary" type="button" id="mg-xPublish" data-astro-cid-7of5oa5s>publish block ⇝</button> </div> </footer> </div> </div> </div> <script>
    (function () {
      const NODE_DEFAULT = "http://127.0.0.1:38473";
      const PC_PING      = "https://pointcast.xyz/api/ping";
      const POLL_MS      = 5000;
      const NODE_STORAGE_KEY = "magpie:node";

      function readNodeBase() {
        try {
          const v = localStorage.getItem(NODE_STORAGE_KEY);
          if (v && /^https?:\\/\\//i.test(v)) return v.replace(/\\/$/, "");
        } catch {}
        return NODE_DEFAULT;
      }
      let NODE_BASE = readNodeBase();

      const DEMO_CLIPS = [
        {
          id: 612, type: "text", pinned: true,
          createdAt: new Date(Date.now() - 43 * 60 * 1000).toISOString(),
          lastCopiedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          copyCount: 5,
          sourceApp: "Google Chrome",
          text: "https://pointcast.xyz/b/0205",
          preview: "https://pointcast.xyz/b/0205",
          unfurl: {
            host: "pointcast.xyz",
            title: "The front door is agentic",
            description: "A living broadcast from El Segundo. Dispatches, art drops, and coordination infrastructure from Mike Hoydich.",
            favicon: "https://pointcast.xyz/favicon.ico",
            image: "https://pointcast.xyz/images/og/og-home-v2.png"
          }
        },
        {
          id: 611, type: "text", pinned: false,
          createdAt: new Date(Date.now() - 49 * 60 * 1000).toISOString(),
          sourceApp: "Slack",
          text: "ok so the DRUM voucher flow — we'll want the ghostnet origination before the cookie-clicker launch. target sunday.",
          preview: "ok so the DRUM voucher flow — we'll want the ghostnet origination before the cookie-clicker launch. target sunday."
        },
        {
          id: 610, type: "text", pinned: false,
          createdAt: new Date(Date.now() - 62 * 60 * 1000).toISOString(),
          sourceApp: "Google Chrome",
          text: "https://x.com/mhoydich",
          preview: "https://x.com/mhoydich",
          unfurl: {
            host: "x.com",
            title: "Mike Hoydich on X",
            description: "shipping magpie v0.5 — local clipboard peer-node with a push-to-pointcast pipeline. built in an afternoon w/ claude code.",
            favicon: "https://abs.twimg.com/favicons/twitter.3.ico"
          }
        },
        {
          id: 609, type: "text", pinned: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          sourceApp: "Spotify",
          text: "https://open.spotify.com/track/19SN5mb0gs0ze9PYBIVANZ",
          preview: "https://open.spotify.com/track/19SN5mb0gs0ze9PYBIVANZ",
          unfurl: {
            host: "open.spotify.com",
            title: "Copland: Appalachian Spring: VII. Variations on a Shaker Hymn",
            description: "By Aaron Copland, Aurora Orchestra, Nicholas Collon · Spotify",
            favicon: "https://open.spotifycdn.com/cdn/images/favicon32.b64ecc03.png",
            image: "https://i.scdn.co/image/ab67616d0000b2733259047b02cd2fd4ecf6479b"
          }
        },
        {
          id: 608, type: "text", pinned: false,
          createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
          sourceApp: "Notes",
          text: "TODO: write up the Selkirk paddle face pattern notes before the Saturday drill session",
          preview: "TODO: write up the Selkirk paddle face pattern notes before the Saturday drill session"
        },
        {
          id: 607, type: "text", pinned: false,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          sourceApp: "Google Chrome",
          text: "https://github.com/Good-Feels/magpie",
          preview: "https://github.com/Good-Feels/magpie",
          unfurl: {
            host: "github.com",
            title: "Good-Feels/magpie",
            description: "A fast, searchable clipboard manager for macOS. Copy freely. Everything is saved.",
            favicon: "https://github.githubassets.com/favicons/favicon.png"
          }
        },
        {
          id: 606, type: "text", pinned: false,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          lastCopiedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          copyCount: 3,
          sourceApp: "Terminal",
          text: "KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh",
          preview: "KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh"
        },
        {
          id: 605, type: "text", pinned: false,
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          sourceApp: "Messages",
          text: "morgan: court 3 at 930? bringing the new project 002 — want to try the dead-hand rolls",
          preview: "morgan: court 3 at 930? bringing the new project 002 — want to try the dead-hand rolls"
        },
        {
          id: 604, type: "filePath", pinned: false,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          sourceApp: "Finder",
          text: "/Users/mhoydich/pointcast/docs/briefs/sprint-6.md",
          preview: "sprint-6.md",
          filePath: "/Users/mhoydich/pointcast/docs/briefs/sprint-6.md"
        }
      ];

      const CHANNELS = [
        { code: "FD",  name: "Front Door" },
        { code: "CRT", name: "Court" },
        { code: "SPN", name: "Spinning" },
        { code: "GF",  name: "Good Feels" },
        { code: "GDN", name: "Garden" },
        { code: "ESC", name: "El Segundo" },
        { code: "VST", name: "Visit" },
        { code: "BTL", name: "Battler" },
      ];

      const state = {
        connected: false,
        demo: false,
        config: null,
        allClips: [],
        clips: [],
        query: "",
        pinnedOnly: false,
        modalClip: null,
      };

      const $ = (s) => document.querySelector(s);

      function setStatus(text, cls) {
        const el = $("#mg-status");
        el.innerHTML = '<span class="mg-pill-dot"></span>' + text;
        el.className = "mg-pill " + (cls || "checking");
      }

      async function probe() {
        if (state.demo) return true; // skip health checks while in demo mode
        try {
          const ctl = new AbortController();
          const t = setTimeout(() => ctl.abort(), 2500);
          const res = await fetch(NODE_BASE + "/health", { signal: ctl.signal });
          clearTimeout(t);
          if (!res.ok) throw new Error("bad status");
          const data = await res.json();
          onConnected(data);
          return true;
        } catch (e) {
          onDisconnected();
          return false;
        }
      }

      async function onConnected(health) {
        if (state.connected) return; // already live
        state.connected = true;
        state.demo = false;
        $("#mg-install").hidden = true;
        $("#mg-demo-banner").hidden = true;
        $("#mg-grid").hidden = false;
        $("#mg-node").textContent = (NODE_BASE.replace(/^https?:\\/\\//, "") || NODE_DEFAULT);
        await loadConfig();
        await loadClips();
      }

      function onDisconnected() {
        if (state.demo) return; // never fall back to offline while demo is active
        state.connected = false;
        state.allClips = [];
        state.clips = [];
        $("#mg-install").hidden = false;
        $("#mg-demo-banner").hidden = true;
        $("#mg-grid").hidden = true;
        $("#mg-count").textContent = "local node offline";
        setStatus("offline", "err");
        $("#mg-pcEndpoint").textContent = "—";
        $("#mg-pcFrom").textContent = "—";
      }

      function enterDemo() {
        state.demo = true;
        state.connected = false;
        state.allClips = DEMO_CLIPS.slice();
        state.config = { endpoint: PC_PING, fromName: "demo", address: "" };
        $("#mg-install").hidden = true;
        $("#mg-demo-banner").hidden = false;
        $("#mg-grid").hidden = false;
        $("#mg-pcEndpoint").textContent = PC_PING;
        $("#mg-pcFrom").textContent = "demo";
        $("#mg-pcAddress") && ($("#mg-pcAddress").textContent = "—");
        setStatus("demo", "checking");
        applyFilters();
      }

      function exitDemo() {
        state.demo = false;
        state.allClips = [];
        state.clips = [];
        $("#mg-demo-banner").hidden = true;
        $("#mg-grid").hidden = true;
        $("#mg-install").hidden = false;
        setStatus("checking", "checking");
        probe();
      }

      async function loadConfig() {
        try {
          const r = await fetch(NODE_BASE + "/config.json");
          const d = await r.json();
          state.config = d.pointcast || {};
        } catch { state.config = {}; }
        const endpoint = state.config.endpoint || "";
        const pcEl = $("#mg-pcEndpoint");
        pcEl.textContent = endpoint || "⚠ set in Preferences → PointCast";
        // Three visual states so users can see at a glance whether
        // the local Magpie is actually pointed at pointcast.xyz:
        //   match  → default, no class
        //   custom → .custom (blue-ish, "running a fork?")
        //   unset  → .missing (oxblood warning — needs config)
        pcEl.classList.remove("missing", "custom");
        if (!endpoint) pcEl.classList.add("missing");
        else if (endpoint !== PC_PING) pcEl.classList.add("custom");
        $("#mg-pcFrom").textContent = state.config.fromName || "(anon)";
      }

      // Copy-button delegate for data-mg-copy="<url>" on the install
      // screen. Stays a tiny convenience — nothing stored, nothing sent.
      document.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-mg-copy]");
        if (!btn) return;
        const text = btn.getAttribute("data-mg-copy") || "";
        if (!text) return;
        navigator.clipboard?.writeText(text).then(() => {
          const original = btn.textContent;
          btn.textContent = "copied ✓";
          btn.classList.add("is-copied");
          setTimeout(() => {
            btn.textContent = original;
            btn.classList.remove("is-copied");
          }, 1400);
        }).catch(() => {
          btn.textContent = "copy failed";
          setTimeout(() => { btn.textContent = "copy"; }, 1400);
        });
      });

      async function loadClips() {
        try {
          const r = await fetch(NODE_BASE + "/clips.json");
          const d = await r.json();
          state.allClips = d.clips || [];
          applyFilters();
          setStatus((state.allClips.length) + " clippings", "ok");
        } catch {
          onDisconnected();
        }
      }

      function applyFilters() {
        let c = state.allClips;
        if (state.pinnedOnly) c = c.filter(x => x.pinned);
        if (state.query) {
          const q = state.query.toLowerCase();
          c = c.filter(x =>
            (x.text || "").toLowerCase().includes(q)
            || (x.preview || "").toLowerCase().includes(q)
            || (x.sourceApp || "").toLowerCase().includes(q)
            || (x.unfurl && x.unfurl.title && x.unfurl.title.toLowerCase().includes(q))
            || (x.unfurl && x.unfurl.host && x.unfurl.host.toLowerCase().includes(q))
          );
        }
        state.clips = c;
        render();
      }

      function render() {
        const grid = $("#mg-grid");
        grid.innerHTML = "";
        $("#mg-count").textContent = state.clips.length + " clip" + (state.clips.length === 1 ? "" : "s");
        if (state.clips.length === 0) {
          const d = document.createElement("div");
          d.className = "mg-empty";
          d.textContent = state.allClips.length === 0 ? "— no specimens collected yet —" : "— no clippings match that filter —";
          grid.appendChild(d);
          return;
        }
        const tpl = $("#mg-tpl-clip");
        for (const clip of state.clips) {
          const node = tpl.content.cloneNode(true);
          const article = node.querySelector(".mg-clip");
          article.dataset.id = clip.id;

          node.querySelector(".mg-src").textContent = clip.sourceApp || "clipboard";
          node.querySelector(".mg-ts").textContent = formatTime(clip.lastCopiedAt || clip.createdAt);
          node.querySelector(".mg-block-code").textContent = detectBlockType(clip);
          const count = clip.copyCount || 1;
          if (count > 1) {
            const badge = node.querySelector(".mg-count-badge");
            badge.textContent = "×" + count;
            badge.hidden = false;
          }
          if (clip.pinned) {
            node.querySelector(".mg-pin").hidden = false;
            article.classList.add("pinned");
          }

          const body = node.querySelector(".mg-body");
          if (clip.type === "image") {
            body.textContent = "[image · " + (clip.imageBytes || "?") + " bytes]";
            body.classList.add("plain");
          } else if (clip.type === "filePath") {
            body.textContent = "📄 " + (clip.filePath || clip.preview || "");
            body.classList.add("plain");
          } else if (clip.unfurl && (clip.unfurl.title || clip.unfurl.description || clip.unfurl.image)) {
            body.classList.add("unfurled");
            body.innerHTML = renderUnfurl(clip);
          } else {
            body.innerHTML = linkify(clip.text || clip.preview || "");
            body.classList.add("plain");
          }

          node.querySelector(".mg-copy").addEventListener("click", (e) => copyText(clip.text || clip.preview || "", e.target));
          node.querySelector(".mg-push").addEventListener("click", (e) => publish(clip, false, null, e.target.parentElement.querySelector(".mg-result")));
          node.querySelector(".mg-push-expand").addEventListener("click", (e) => openExpandModal(clip, e.target.parentElement.querySelector(".mg-result")));

          grid.appendChild(node);
        }
      }

      function formatTime(iso) {
        try {
          const d = new Date(iso);
          const diff = (Date.now() - d.getTime()) / 1000;
          if (diff < 60) return "just now";
          if (diff < 3600) return Math.floor(diff / 60) + "m ago";
          if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
          if (diff < 86400 * 7) return Math.floor(diff / 86400) + "d ago";
          return d.toLocaleDateString();
        } catch { return iso; }
      }

      function detectBlockType(clip) {
        if (clip.type === "image") return "IMG";
        if (clip.type === "filePath") return "FILE";
        const host = (clip.unfurl && clip.unfurl.host) || extractHost(clip.text || clip.preview || "");
        if (!host) return ((clip.text || clip.preview || "").length > 240) ? "READ" : "NOTE";
        const h = host.toLowerCase();
        if (/spotify|soundcloud|music\\.apple|bandcamp|tidal|anchor\\.fm/.test(h)) return "LISTEN";
        if (/youtube|youtu\\.be|vimeo|twitch|loom\\.com|tiktok\\.com/.test(h)) return "WATCH";
        if (/x\\.com|twitter\\.com|warpcast|bsky\\.app|threads\\.net|mastodon|farcaster/.test(h)) return "NOTE";
        if (/objkt|teia\\.art|fxhash|zora\\.co|manifold|opensea|foundation\\.app/.test(h)) return "MINT";
        if (/maps\\.google|google\\.com\\/maps|apple\\.com\\/maps|yelp\\.com/.test(h)) return "VISIT";
        if (/github|medium|substack|nytimes|bloomberg|wsj|wired|theverge|stratechery|pointcast/.test(h)) return "READ";
        return "LINK";
      }

      function defaultChannelFor(clip, blockType) {
        const host = ((clip.unfurl && clip.unfurl.host) || "").toLowerCase();
        const src = (clip.sourceApp || "").toLowerCase();
        if (blockType === "LISTEN") return "SPN";
        if (blockType === "VISIT") return "VST";
        if (/good[\\s-]?feels|cannabis|hemp|leafly/.test((clip.text || "") + " " + host)) return "GF";
        if (/pickleball|selkirk|paddle|court/.test((clip.text || "") + " " + host)) return "CRT";
        if (/el.segundo|escu|neighborhood/.test(clip.text || "")) return "ESC";
        if (/garden|bird|wildlife|balcony/.test(clip.text || "")) return "GDN";
        if (src.includes("spotify")) return "SPN";
        return "FD";
      }

      function extractHost(s) {
        try { return new URL(s.trim().split(/\\s+/)[0]).host || null; } catch { return null; }
      }

      function renderUnfurl(clip) {
        const u = clip.unfurl || {};
        const url = clip.text || clip.preview || "";
        const esc = (s) => (s || "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
        const image = u.image ? '<div class="mg-unfurl-plate"><img src="' + esc(u.image) + '" alt="" loading="lazy" onerror="this.parentElement.style.display=\\'none\\'"></div>' : "";
        const favicon = u.favicon ? '<img class="mg-favicon" src="' + esc(u.favicon) + '" alt="" loading="lazy" onerror="this.style.display=\\'none\\'">' : "";
        const host = u.host ? '<span class="mg-host">' + esc(u.host) + '</span>' : "";
        const title = u.title ? '<div class="mg-unfurl-title">' + esc(u.title) + '</div>' : "";
        const desc = u.description ? '<div class="mg-unfurl-desc">' + esc(u.description) + '</div>' : "";
        const urlLine = url ? '<a class="mg-unfurl-url" href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(url) + '</a>' : "";
        return '<div class="mg-unfurl">' + image + '<div class="mg-unfurl-host-row">' + favicon + host + '</div>' + title + desc + urlLine + '</div>';
      }

      function linkify(s) {
        const escaped = s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
        return escaped.replace(/(https?:\\/\\/[^\\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
      }

      async function copyText(text, btn) {
        try {
          await navigator.clipboard.writeText(text);
          const o = btn.textContent;
          btn.textContent = "copied ✓";
          setTimeout(() => { btn.textContent = o; }, 900);
        } catch { btn.textContent = "copy failed"; }
      }

      /* Modal */
      function initChannelOptions() {
        const sel = $("#mg-xChannel");
        sel.innerHTML = "";
        for (const c of CHANNELS) {
          const opt = document.createElement("option");
          opt.value = c.code;
          opt.textContent = "CH." + c.code + " — " + c.name;
          sel.appendChild(opt);
        }
      }

      function openExpandModal(clip, resultEl) {
        state.modalClip = { clip, resultEl };
        const bt = detectBlockType(clip);
        const ch = defaultChannelFor(clip, bt);
        const u = clip.unfurl || {};
        $("#mg-xBlockType").value = bt;
        $("#mg-xChannel").value = ch;
        $("#mg-xTitle").value = u.title || deriveFallbackTitle(clip);
        $("#mg-xDek").value = u.description || "";
        $("#mg-xBody").value = clip.text || clip.preview || "";
        updateCitation();
        const back = $("#mg-expandBackdrop");
        back.hidden = false;
        void back.offsetWidth;
        back.classList.add("open");
        setTimeout(() => $("#mg-xTitle").focus(), 50);
      }

      function closeExpandModal() {
        const back = $("#mg-expandBackdrop");
        back.classList.remove("open");
        setTimeout(() => { back.hidden = true; }, 200);
        state.modalClip = null;
      }

      function deriveFallbackTitle(clip) {
        const t = (clip.text || clip.preview || "").trim();
        if (!t) return "";
        const first = t.split("\\n", 1)[0].trim();
        return first.length > 100 ? first.slice(0, 97) + "…" : first;
      }

      function updateCitation() {
        $("#mg-xCiteChannel").textContent = "CH." + $("#mg-xChannel").value;
        $("#mg-xCiteTitle").textContent = '"' + ($("#mg-xTitle").value.trim() || "—") + '"';
        $("#mg-xCiteDate").textContent = new Date().toISOString().slice(0, 10);
      }

      async function publishFromModal() {
        if (!state.modalClip) return;
        const { clip, resultEl } = state.modalClip;
        const ch = $("#mg-xChannel").value;
        const bt = $("#mg-xBlockType").value;
        const title = $("#mg-xTitle").value.trim();
        const dek = $("#mg-xDek").value.trim();
        const body = $("#mg-xBody").value.trim();
        if (!title || !body) {
          $("#mg-xPublish").textContent = "title + body required";
          setTimeout(() => { $("#mg-xPublish").textContent = "publish block ⇝"; }, 1400);
          return;
        }
        $("#mg-xPublish").disabled = true;
        $("#mg-xPublish").textContent = "publishing…";
        try {
          await publish(clip, true, {
            subject: title,
            body: body,
            channel: ch,
            blockType: bt,
            dek: dek || undefined,
          }, resultEl);
          closeExpandModal();
        } catch {
          $("#mg-xPublish").disabled = false;
          $("#mg-xPublish").textContent = "retry ⇝";
        }
      }

      async function publish(clip, expand, override, resultEl) {
        if (state.demo) {
          if (resultEl) { resultEl.textContent = "demo · push disabled"; resultEl.className = "mg-result err"; }
          throw new Error("demo mode");
        }
        const endpoint = (state.config && state.config.endpoint) || PC_PING;
        if (resultEl) { resultEl.textContent = "sending…"; resultEl.className = "mg-result"; }
        const body = (override && override.body) || clip.text || clip.preview || "";
        if (!body) {
          if (resultEl) { resultEl.textContent = "empty"; resultEl.className = "mg-result err"; }
          throw new Error("empty");
        }
        const subject = (override && override.subject) || deriveSubject(clip, body);
        const payload = {
          type: "pc-ping-v1",
          body: body.slice(0, 4000),
          timestamp: new Date().toISOString(),
          expand: !!expand,
        };
        if (subject) payload.subject = subject.slice(0, 120);
        if (state.config && state.config.fromName) payload.from = state.config.fromName.slice(0, 80);
        if (state.config && state.config.address) payload.address = state.config.address;
        // Structured expansion hints (pc-ping-v1 v0.5+)
        if (override && override.channel) payload.channel = override.channel;
        if (override && override.blockType) payload.blockType = override.blockType;
        if (override && override.dek) payload.dek = override.dek.slice(0, 280);
        // Always attach source context when we have it — helps cc infer
        // even when expand=false.
        const sourceUrl = (clip.text || clip.preview || "").trim();
        if (/^https?:\\/\\//i.test(sourceUrl)) payload.sourceUrl = sourceUrl.slice(0, 2048);
        if (clip.sourceApp) payload.sourceApp = clip.sourceApp.slice(0, 120);

        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.ok) {
            if (resultEl) { resultEl.textContent = expand ? "expanded ✓" : "pushed ✓"; resultEl.className = "mg-result ok"; }
            return data;
          } else {
            const reason = data.reason || data.error || ("HTTP " + res.status);
            if (resultEl) { resultEl.textContent = reason; resultEl.className = "mg-result err"; }
            throw new Error(reason);
          }
        } catch (e) {
          if (resultEl) { resultEl.textContent = "network err"; resultEl.className = "mg-result err"; }
          throw e;
        }
      }

      function deriveSubject(clip, body) {
        if (clip.unfurl && clip.unfurl.title) return clip.unfurl.title;
        const first = body.split("\\n", 1)[0].trim();
        try { const u = new URL(first); if (u.host) return clip.sourceApp ? clip.sourceApp + ": " + u.host : u.host; } catch {}
        return clip.sourceApp ? "magpie clip from " + clip.sourceApp : "magpie clip";
      }

      /* wire up */
      $("#mg-q").addEventListener("input", (e) => { state.query = e.target.value; applyFilters(); });
      $("#mg-pinnedOnly").addEventListener("change", (e) => { state.pinnedOnly = e.target.checked; applyFilters(); });
      $("#mg-refresh").addEventListener("click", () => {
        if (state.demo) { state.allClips = DEMO_CLIPS.slice(); applyFilters(); return; }
        state.connected ? loadClips() : probe();
      });
      $("#mg-retry").addEventListener("click", () => probe());
      $("#mg-demo").addEventListener("click", enterDemo);
      $("#mg-demo-exit").addEventListener("click", exitDemo);

      const endpointInput = $("#mg-endpoint");
      if (endpointInput) endpointInput.value = NODE_BASE === NODE_DEFAULT ? "" : NODE_BASE;
      $("#mg-endpoint-save") && $("#mg-endpoint-save").addEventListener("click", () => {
        const v = ($("#mg-endpoint").value || "").trim().replace(/\\/$/, "");
        if (v && /^https?:\\/\\//i.test(v)) {
          try { localStorage.setItem(NODE_STORAGE_KEY, v); } catch {}
          NODE_BASE = v;
        } else if (!v) {
          try { localStorage.removeItem(NODE_STORAGE_KEY); } catch {}
          NODE_BASE = NODE_DEFAULT;
        } else {
          $("#mg-endpoint").style.borderColor = "var(--mg-leaf-red)";
          setTimeout(() => { $("#mg-endpoint").style.borderColor = ""; }, 1400);
          return;
        }
        setStatus("checking", "checking");
        probe();
      });
      $("#mg-endpoint-reset") && $("#mg-endpoint-reset").addEventListener("click", () => {
        try { localStorage.removeItem(NODE_STORAGE_KEY); } catch {}
        NODE_BASE = NODE_DEFAULT;
        $("#mg-endpoint").value = "";
        setStatus("checking", "checking");
        probe();
      });

      document.querySelectorAll("[data-mg-close]").forEach(el => el.addEventListener("click", closeExpandModal));
      $("#mg-expandBackdrop").addEventListener("click", (e) => { if (e.target.id === "mg-expandBackdrop") closeExpandModal(); });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !$("#mg-expandBackdrop").hidden) closeExpandModal();
        if (e.key === "Enter" && e.metaKey && state.modalClip) publishFromModal();
      });

      $("#mg-xChannel").addEventListener("change", updateCitation);
      $("#mg-xTitle").addEventListener("input", updateCitation);
      $("#mg-xPublish").addEventListener("click", publishFromModal);

      initChannelOptions();
      probe();
      setInterval(() => { state.connected ? loadClips() : probe(); }, POLL_MS);
    })();
  <\/script> `], [" ", `<div class="magpie-root" data-astro-cid-7of5oa5s> <nav class="mg-crumb" data-astro-cid-7of5oa5s> <a href="/" data-astro-cid-7of5oa5s>← Home</a> </nav> <header class="mg-bar" data-astro-cid-7of5oa5s> <div class="mg-masthead" data-astro-cid-7of5oa5s> <div class="mg-brand" data-astro-cid-7of5oa5s> <span class="mg-kicker" data-astro-cid-7of5oa5s>Field clippings · from your machine</span> <div class="mg-wordmark" data-astro-cid-7of5oa5s> <span class="mg-logo" aria-hidden="true" data-astro-cid-7of5oa5s>🐦‍⬛</span> <strong data-astro-cid-7of5oa5s>Magpie</strong> </div> <div class="mg-tagline" data-astro-cid-7of5oa5s>A specimen book for things worth keeping — pressed at home on PointCast, broadcast from there to Mastodon, Farcaster, and out to bitchat's mesh.</div> </div> <div class="mg-controls" data-astro-cid-7of5oa5s> <input id="mg-q" type="search" placeholder="search the archive" autocomplete="off" data-astro-cid-7of5oa5s> <label class="mg-chk" data-astro-cid-7of5oa5s><input id="mg-pinnedOnly" type="checkbox" data-astro-cid-7of5oa5s> pressed only</label> <button id="mg-refresh" type="button" title="reload" data-astro-cid-7of5oa5s>↻</button> </div> </div> </header> <section class="mg-meta" data-astro-cid-7of5oa5s> <div data-astro-cid-7of5oa5s> <span class="mg-k" data-astro-cid-7of5oa5s>node</span> <code id="mg-node" data-astro-cid-7of5oa5s>127.0.0.1:38473</code> <span class="mg-dot" data-astro-cid-7of5oa5s>·</span> <span class="mg-k" data-astro-cid-7of5oa5s>pointcast</span> <code id="mg-pcEndpoint" data-astro-cid-7of5oa5s>—</code> <span class="mg-dot" data-astro-cid-7of5oa5s>·</span> <span class="mg-k" data-astro-cid-7of5oa5s>from</span> <code id="mg-pcFrom" data-astro-cid-7of5oa5s>—</code> </div> <div data-astro-cid-7of5oa5s> <span id="mg-status" class="mg-pill checking" data-astro-cid-7of5oa5s><span class="mg-pill-dot" data-astro-cid-7of5oa5s></span>checking</span> </div> </section> <section id="mg-install" class="mg-install" hidden data-astro-cid-7of5oa5s> <div class="mg-install-card" data-astro-cid-7of5oa5s> <p class="mg-kicker mg-install-kicker" data-astro-cid-7of5oa5s>Magpie · not reachable</p> <h2 class="mg-install-title" data-astro-cid-7of5oa5s>
Bring this page to life by running Magpie on your Mac.
</h2> <p class="mg-install-dek" data-astro-cid-7of5oa5s>
This is the hosted window into a clipboard app that lives on your
          own machine. Nothing leaves the device unless you press <em data-astro-cid-7of5oa5s>push</em>.
          Set-up takes about sixty seconds.
</p> <ol class="mg-install-steps" data-astro-cid-7of5oa5s> <li data-astro-cid-7of5oa5s> <span class="mg-step-n" data-astro-cid-7of5oa5s>1</span> <div data-astro-cid-7of5oa5s> <strong data-astro-cid-7of5oa5s>Download the latest build.</strong> <a href="https://github.com/Good-Feels/magpie/releases/latest" target="_blank" rel="noopener" data-astro-cid-7of5oa5s>
github.com/Good-Feels/magpie/releases
</a>
— drag <code data-astro-cid-7of5oa5s>Magpie.app</code> to Applications.
</div> </li> <li data-astro-cid-7of5oa5s> <span class="mg-step-n" data-astro-cid-7of5oa5s>2</span> <div data-astro-cid-7of5oa5s> <strong data-astro-cid-7of5oa5s>Launch it.</strong> Look for the clipboard icon in your
              menu bar. Grant clipboard access when prompted.
</div> </li> <li data-astro-cid-7of5oa5s> <span class="mg-step-n" data-astro-cid-7of5oa5s>3</span> <div data-astro-cid-7of5oa5s> <strong data-astro-cid-7of5oa5s>Turn on the peer node.</strong> Settings →
<em data-astro-cid-7of5oa5s>PointCast</em> → <em data-astro-cid-7of5oa5s>Serve local web UI</em>. This page will
              connect automatically.
</div> </li> <li data-astro-cid-7of5oa5s> <span class="mg-step-n" data-astro-cid-7of5oa5s>4</span> <div data-astro-cid-7of5oa5s> <strong data-astro-cid-7of5oa5s>Point it at PointCast.</strong> Magpie ships pre-pointed
              at <code data-astro-cid-7of5oa5s>pointcast.xyz/api/ping</code>, so this is usually
              zero work — but if you're running a fork or a local broadcast,
              set the endpoint under <em data-astro-cid-7of5oa5s>Preferences → PointCast → Connection</em>.
              Use the <em data-astro-cid-7of5oa5s>Test Connection</em> button to confirm; Magpie
              persists the endpoint + your <em data-astro-cid-7of5oa5s>From</em> name + optional
              Tezos address and the hosted UI reads them from the peer-node's
<code data-astro-cid-7of5oa5s>/config.json</code>.
<div class="mg-endpoint-copy" data-astro-cid-7of5oa5s> <span class="mg-kicker mg-endpoint-copy-kicker" data-astro-cid-7of5oa5s>canonical endpoint</span> <code class="mg-endpoint-copy-url" id="mg-pc-endpoint-display" data-astro-cid-7of5oa5s>https://pointcast.xyz/api/ping</code> <button class="mg-btn ghost mg-endpoint-copy-btn" type="button" id="mg-pc-endpoint-copy" data-mg-copy="https://pointcast.xyz/api/ping" data-astro-cid-7of5oa5s>copy</button> </div> </div> </li> <li data-astro-cid-7of5oa5s> <span class="mg-step-n" data-astro-cid-7of5oa5s>5</span> <div data-astro-cid-7of5oa5s> <strong data-astro-cid-7of5oa5s>Copy something.</strong> Come back here. Every URL
              unfurls; every clip can be broadcast to PointCast <em data-astro-cid-7of5oa5s>and</em>
your other homes with a title, a dek, and a chosen channel.
</div> </li> </ol> <div class="mg-destinations" data-astro-cid-7of5oa5s> <p class="mg-kicker mg-destinations-kicker" data-astro-cid-7of5oa5s>v1.0 · broadcast destinations</p> <p class="mg-destinations-dek" data-astro-cid-7of5oa5s>
One compose, many homes. Eleven destinations behind one
            protocol — social, mesh, and on-chain. PointCast is your
            canonical home; the rest carry the same clip to the feeds
            you already tend + the mesh you take with you.
</p> <ul class="mg-destinations-grid" data-astro-cid-7of5oa5s> <li data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>PC</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>PointCast</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>canonical · 4000</span></li> <li data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>MA</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>Mastodon</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>any instance · 500 · threads</span></li> <li data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>FC</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>Farcaster</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>Neynar · 320 · IPFS embeds</span></li> <li data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>BC</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>bitchat</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>Nostr + BLE mesh · 280</span></li> <li data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>BS</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>Bluesky</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>AT Proto · 300 · rich cards</span></li> <li data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>TW</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>Twitter / X</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>OAuth 2.0 · 280 · threads</span></li> <li data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>LI</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>LinkedIn</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>UGC posts · 3000</span></li> </ul> <p class="mg-kicker mg-destinations-subkicker" data-astro-cid-7of5oa5s>shipping next · v1.0 · skeletons in place, real paths activate with crypto deps</p> <ul class="mg-destinations-grid" data-astro-cid-7of5oa5s> <li class="mg-dest-future" data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>IG</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>Instagram</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>Graph API · Business account</span></li> <li class="mg-dest-future" data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>ZO</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>Zora</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>MINT on Base · EVMSigner</span></li> <li class="mg-dest-future" data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>OB</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>Objkt</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>MINT on Tezos · Teia FA2</span></li> <li class="mg-dest-future" data-astro-cid-7of5oa5s><span class="mg-dest-code" data-astro-cid-7of5oa5s>OS</span><span class="mg-dest-name" data-astro-cid-7of5oa5s>OpenSea</span><span class="mg-dest-note" data-astro-cid-7of5oa5s>Seaport listings · post-mint reach</span></li> </ul> </div> <div class="mg-install-cta" data-astro-cid-7of5oa5s> <a class="mg-btn primary" href="https://github.com/Good-Feels/magpie/releases/latest" target="_blank" rel="noopener" data-astro-cid-7of5oa5s>Download · macOS 13+</a> <a class="mg-btn ghost" href="https://github.com/Good-Feels/magpie" target="_blank" rel="noopener" data-astro-cid-7of5oa5s>Source</a> <button class="mg-btn ghost" type="button" id="mg-retry" data-astro-cid-7of5oa5s>Retry connection</button> <button class="mg-btn ghost mg-demo-btn" type="button" id="mg-demo" data-astro-cid-7of5oa5s>Try demo mode ↝</button> </div> <details class="mg-settings" data-astro-cid-7of5oa5s> <summary data-astro-cid-7of5oa5s>Advanced · change local node endpoint</summary> <div class="mg-settings-body" data-astro-cid-7of5oa5s> <label class="mg-label" for="mg-endpoint" data-astro-cid-7of5oa5s>Peer-node URL</label> <div class="mg-endpoint-row" data-astro-cid-7of5oa5s> <input type="text" id="mg-endpoint" placeholder="http://127.0.0.1:38473" autocomplete="off" spellcheck="false" data-astro-cid-7of5oa5s> <button class="mg-btn ghost" type="button" id="mg-endpoint-save" data-astro-cid-7of5oa5s>Save</button> <button class="mg-btn ghost" type="button" id="mg-endpoint-reset" data-astro-cid-7of5oa5s>Reset</button> </div> <p class="mg-settings-hint" data-astro-cid-7of5oa5s>
Default is <code data-astro-cid-7of5oa5s>http://127.0.0.1:38473</code>. If you changed the
              port in Magpie Preferences or you're running on a non-default
              loopback, set it here. Stored in this browser only.
</p> </div> </details> </div> </section> <div id="mg-demo-banner" class="mg-demo-banner" hidden data-astro-cid-7of5oa5s> <span class="mg-kicker" data-astro-cid-7of5oa5s>❧ Demo mode</span> <span class="mg-demo-copy" data-astro-cid-7of5oa5s>Browsing sample specimens. Push is disabled — install Magpie locally to capture your own clipboard.</span> <button class="mg-btn ghost" type="button" id="mg-demo-exit" data-astro-cid-7of5oa5s>Exit demo</button> </div> <main id="mg-grid" class="mg-grid" aria-live="polite" hidden data-astro-cid-7of5oa5s></main> <footer class="mg-foot" data-astro-cid-7of5oa5s> <span id="mg-count" data-astro-cid-7of5oa5s>—</span> <span class="mg-dot" data-astro-cid-7of5oa5s>·</span> <span data-astro-cid-7of5oa5s>peer node · v0.4</span> <span class="mg-dot" data-astro-cid-7of5oa5s>·</span> <a href="/magpie.json" data-astro-cid-7of5oa5s>magpie.json</a> <span class="mg-dot" data-astro-cid-7of5oa5s>·</span> <a href="https://github.com/Good-Feels/magpie" target="_blank" rel="noopener" data-astro-cid-7of5oa5s>github</a> </footer> <template id="mg-tpl-clip" data-astro-cid-7of5oa5s> <article class="mg-clip" data-astro-cid-7of5oa5s> <header class="mg-clip-head" data-astro-cid-7of5oa5s> <span class="mg-block-code" data-astro-cid-7of5oa5s></span> <span class="mg-sep" data-astro-cid-7of5oa5s>·</span> <span class="mg-src" data-astro-cid-7of5oa5s></span> <span class="mg-count-badge" hidden data-astro-cid-7of5oa5s></span> <time class="mg-ts" data-astro-cid-7of5oa5s></time> <span class="mg-pin" hidden data-astro-cid-7of5oa5s>❋</span> </header> <div class="mg-body" data-astro-cid-7of5oa5s></div> <footer class="mg-clip-foot" data-astro-cid-7of5oa5s> <button class="mg-act mg-copy" type="button" title="copy text" data-astro-cid-7of5oa5s>copy</button> <button class="mg-act mg-push" type="button" title="push to PointCast inbox" data-astro-cid-7of5oa5s>push →</button> <button class="mg-act mg-push-expand" type="button" title="expand into a block" data-astro-cid-7of5oa5s>expand ✤</button> <span class="mg-result" data-astro-cid-7of5oa5s></span> </footer> </article> </template> <div id="mg-expandBackdrop" class="mg-expand-backdrop" hidden data-astro-cid-7of5oa5s> <div class="mg-expand-modal" role="dialog" aria-labelledby="mg-expandTitle" data-astro-cid-7of5oa5s> <header class="mg-expand-head" data-astro-cid-7of5oa5s> <div class="mg-kicker mg-expand-kicker" data-astro-cid-7of5oa5s>Expand into a block</div> <div class="mg-expand-title" id="mg-expandTitle" data-astro-cid-7of5oa5s>Publish this clip to PointCast</div> <button class="mg-close" type="button" aria-label="close" data-mg-close data-astro-cid-7of5oa5s>✕</button> </header> <div class="mg-expand-body" data-astro-cid-7of5oa5s> <div class="mg-field-row" data-astro-cid-7of5oa5s> <div class="mg-field" data-astro-cid-7of5oa5s> <label class="mg-label" for="mg-xChannel" data-astro-cid-7of5oa5s>Channel <span class="mg-hint" data-astro-cid-7of5oa5s>where this lives</span></label> <select id="mg-xChannel" data-astro-cid-7of5oa5s></select> </div> <div class="mg-field" data-astro-cid-7of5oa5s> <label class="mg-label" for="mg-xBlockType" data-astro-cid-7of5oa5s>Type</label> <select id="mg-xBlockType" data-astro-cid-7of5oa5s> <option value="READ" data-astro-cid-7of5oa5s>READ</option> <option value="NOTE" data-astro-cid-7of5oa5s>NOTE</option> <option value="LISTEN" data-astro-cid-7of5oa5s>LISTEN</option> <option value="WATCH" data-astro-cid-7of5oa5s>WATCH</option> <option value="LINK" data-astro-cid-7of5oa5s>LINK</option> <option value="VISIT" data-astro-cid-7of5oa5s>VISIT</option> <option value="MINT" data-astro-cid-7of5oa5s>MINT</option> </select> </div> </div> <div class="mg-field" data-astro-cid-7of5oa5s> <label class="mg-label" for="mg-xTitle" data-astro-cid-7of5oa5s>Title</label> <input type="text" id="mg-xTitle" maxlength="120" placeholder="Title of this block" data-astro-cid-7of5oa5s> </div> <div class="mg-field" data-astro-cid-7of5oa5s> <label class="mg-label" for="mg-xDek" data-astro-cid-7of5oa5s>Dek <span class="mg-hint" data-astro-cid-7of5oa5s>a line of framing — optional</span></label> <textarea id="mg-xDek" maxlength="280" placeholder="A short description, a dek, what should a reader know?" data-astro-cid-7of5oa5s></textarea> </div> <div class="mg-field" data-astro-cid-7of5oa5s> <label class="mg-label" for="mg-xBody" data-astro-cid-7of5oa5s>Body <span class="mg-hint" data-astro-cid-7of5oa5s>what actually lives in the block</span></label> <textarea id="mg-xBody" maxlength="4000" data-astro-cid-7of5oa5s></textarea> </div> <div class="mg-citation" data-astro-cid-7of5oa5s> <span class="mg-cite-head" data-astro-cid-7of5oa5s>Citation preview</span> <span class="mg-cite-line" data-astro-cid-7of5oa5s>PointCast · <strong data-astro-cid-7of5oa5s><span id="mg-xCiteChannel" data-astro-cid-7of5oa5s>CH.FD</span></strong> · № —</span> <div class="mg-cite-title" id="mg-xCiteTitle" data-astro-cid-7of5oa5s>—</div> <span class="mg-cite-line" id="mg-xCiteDate" data-astro-cid-7of5oa5s>—</span> </div> </div> <footer class="mg-expand-foot" data-astro-cid-7of5oa5s> <span class="mg-note" data-astro-cid-7of5oa5s>Expansion runs on Claude Code's next tick · edits go in as hints</span> <div class="mg-buttons" data-astro-cid-7of5oa5s> <button class="mg-btn ghost" type="button" data-mg-close data-astro-cid-7of5oa5s>cancel</button> <button class="mg-btn primary" type="button" id="mg-xPublish" data-astro-cid-7of5oa5s>publish block ⇝</button> </div> </footer> </div> </div> </div> <script>
    (function () {
      const NODE_DEFAULT = "http://127.0.0.1:38473";
      const PC_PING      = "https://pointcast.xyz/api/ping";
      const POLL_MS      = 5000;
      const NODE_STORAGE_KEY = "magpie:node";

      function readNodeBase() {
        try {
          const v = localStorage.getItem(NODE_STORAGE_KEY);
          if (v && /^https?:\\\\/\\\\//i.test(v)) return v.replace(/\\\\/$/, "");
        } catch {}
        return NODE_DEFAULT;
      }
      let NODE_BASE = readNodeBase();

      const DEMO_CLIPS = [
        {
          id: 612, type: "text", pinned: true,
          createdAt: new Date(Date.now() - 43 * 60 * 1000).toISOString(),
          lastCopiedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          copyCount: 5,
          sourceApp: "Google Chrome",
          text: "https://pointcast.xyz/b/0205",
          preview: "https://pointcast.xyz/b/0205",
          unfurl: {
            host: "pointcast.xyz",
            title: "The front door is agentic",
            description: "A living broadcast from El Segundo. Dispatches, art drops, and coordination infrastructure from Mike Hoydich.",
            favicon: "https://pointcast.xyz/favicon.ico",
            image: "https://pointcast.xyz/images/og/og-home-v2.png"
          }
        },
        {
          id: 611, type: "text", pinned: false,
          createdAt: new Date(Date.now() - 49 * 60 * 1000).toISOString(),
          sourceApp: "Slack",
          text: "ok so the DRUM voucher flow — we'll want the ghostnet origination before the cookie-clicker launch. target sunday.",
          preview: "ok so the DRUM voucher flow — we'll want the ghostnet origination before the cookie-clicker launch. target sunday."
        },
        {
          id: 610, type: "text", pinned: false,
          createdAt: new Date(Date.now() - 62 * 60 * 1000).toISOString(),
          sourceApp: "Google Chrome",
          text: "https://x.com/mhoydich",
          preview: "https://x.com/mhoydich",
          unfurl: {
            host: "x.com",
            title: "Mike Hoydich on X",
            description: "shipping magpie v0.5 — local clipboard peer-node with a push-to-pointcast pipeline. built in an afternoon w/ claude code.",
            favicon: "https://abs.twimg.com/favicons/twitter.3.ico"
          }
        },
        {
          id: 609, type: "text", pinned: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          sourceApp: "Spotify",
          text: "https://open.spotify.com/track/19SN5mb0gs0ze9PYBIVANZ",
          preview: "https://open.spotify.com/track/19SN5mb0gs0ze9PYBIVANZ",
          unfurl: {
            host: "open.spotify.com",
            title: "Copland: Appalachian Spring: VII. Variations on a Shaker Hymn",
            description: "By Aaron Copland, Aurora Orchestra, Nicholas Collon · Spotify",
            favicon: "https://open.spotifycdn.com/cdn/images/favicon32.b64ecc03.png",
            image: "https://i.scdn.co/image/ab67616d0000b2733259047b02cd2fd4ecf6479b"
          }
        },
        {
          id: 608, type: "text", pinned: false,
          createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
          sourceApp: "Notes",
          text: "TODO: write up the Selkirk paddle face pattern notes before the Saturday drill session",
          preview: "TODO: write up the Selkirk paddle face pattern notes before the Saturday drill session"
        },
        {
          id: 607, type: "text", pinned: false,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          sourceApp: "Google Chrome",
          text: "https://github.com/Good-Feels/magpie",
          preview: "https://github.com/Good-Feels/magpie",
          unfurl: {
            host: "github.com",
            title: "Good-Feels/magpie",
            description: "A fast, searchable clipboard manager for macOS. Copy freely. Everything is saved.",
            favicon: "https://github.githubassets.com/favicons/favicon.png"
          }
        },
        {
          id: 606, type: "text", pinned: false,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          lastCopiedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          copyCount: 3,
          sourceApp: "Terminal",
          text: "KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh",
          preview: "KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh"
        },
        {
          id: 605, type: "text", pinned: false,
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          sourceApp: "Messages",
          text: "morgan: court 3 at 930? bringing the new project 002 — want to try the dead-hand rolls",
          preview: "morgan: court 3 at 930? bringing the new project 002 — want to try the dead-hand rolls"
        },
        {
          id: 604, type: "filePath", pinned: false,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          sourceApp: "Finder",
          text: "/Users/mhoydich/pointcast/docs/briefs/sprint-6.md",
          preview: "sprint-6.md",
          filePath: "/Users/mhoydich/pointcast/docs/briefs/sprint-6.md"
        }
      ];

      const CHANNELS = [
        { code: "FD",  name: "Front Door" },
        { code: "CRT", name: "Court" },
        { code: "SPN", name: "Spinning" },
        { code: "GF",  name: "Good Feels" },
        { code: "GDN", name: "Garden" },
        { code: "ESC", name: "El Segundo" },
        { code: "VST", name: "Visit" },
        { code: "BTL", name: "Battler" },
      ];

      const state = {
        connected: false,
        demo: false,
        config: null,
        allClips: [],
        clips: [],
        query: "",
        pinnedOnly: false,
        modalClip: null,
      };

      const $ = (s) => document.querySelector(s);

      function setStatus(text, cls) {
        const el = $("#mg-status");
        el.innerHTML = '<span class="mg-pill-dot"></span>' + text;
        el.className = "mg-pill " + (cls || "checking");
      }

      async function probe() {
        if (state.demo) return true; // skip health checks while in demo mode
        try {
          const ctl = new AbortController();
          const t = setTimeout(() => ctl.abort(), 2500);
          const res = await fetch(NODE_BASE + "/health", { signal: ctl.signal });
          clearTimeout(t);
          if (!res.ok) throw new Error("bad status");
          const data = await res.json();
          onConnected(data);
          return true;
        } catch (e) {
          onDisconnected();
          return false;
        }
      }

      async function onConnected(health) {
        if (state.connected) return; // already live
        state.connected = true;
        state.demo = false;
        $("#mg-install").hidden = true;
        $("#mg-demo-banner").hidden = true;
        $("#mg-grid").hidden = false;
        $("#mg-node").textContent = (NODE_BASE.replace(/^https?:\\\\/\\\\//, "") || NODE_DEFAULT);
        await loadConfig();
        await loadClips();
      }

      function onDisconnected() {
        if (state.demo) return; // never fall back to offline while demo is active
        state.connected = false;
        state.allClips = [];
        state.clips = [];
        $("#mg-install").hidden = false;
        $("#mg-demo-banner").hidden = true;
        $("#mg-grid").hidden = true;
        $("#mg-count").textContent = "local node offline";
        setStatus("offline", "err");
        $("#mg-pcEndpoint").textContent = "—";
        $("#mg-pcFrom").textContent = "—";
      }

      function enterDemo() {
        state.demo = true;
        state.connected = false;
        state.allClips = DEMO_CLIPS.slice();
        state.config = { endpoint: PC_PING, fromName: "demo", address: "" };
        $("#mg-install").hidden = true;
        $("#mg-demo-banner").hidden = false;
        $("#mg-grid").hidden = false;
        $("#mg-pcEndpoint").textContent = PC_PING;
        $("#mg-pcFrom").textContent = "demo";
        $("#mg-pcAddress") && ($("#mg-pcAddress").textContent = "—");
        setStatus("demo", "checking");
        applyFilters();
      }

      function exitDemo() {
        state.demo = false;
        state.allClips = [];
        state.clips = [];
        $("#mg-demo-banner").hidden = true;
        $("#mg-grid").hidden = true;
        $("#mg-install").hidden = false;
        setStatus("checking", "checking");
        probe();
      }

      async function loadConfig() {
        try {
          const r = await fetch(NODE_BASE + "/config.json");
          const d = await r.json();
          state.config = d.pointcast || {};
        } catch { state.config = {}; }
        const endpoint = state.config.endpoint || "";
        const pcEl = $("#mg-pcEndpoint");
        pcEl.textContent = endpoint || "⚠ set in Preferences → PointCast";
        // Three visual states so users can see at a glance whether
        // the local Magpie is actually pointed at pointcast.xyz:
        //   match  → default, no class
        //   custom → .custom (blue-ish, "running a fork?")
        //   unset  → .missing (oxblood warning — needs config)
        pcEl.classList.remove("missing", "custom");
        if (!endpoint) pcEl.classList.add("missing");
        else if (endpoint !== PC_PING) pcEl.classList.add("custom");
        $("#mg-pcFrom").textContent = state.config.fromName || "(anon)";
      }

      // Copy-button delegate for data-mg-copy="<url>" on the install
      // screen. Stays a tiny convenience — nothing stored, nothing sent.
      document.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-mg-copy]");
        if (!btn) return;
        const text = btn.getAttribute("data-mg-copy") || "";
        if (!text) return;
        navigator.clipboard?.writeText(text).then(() => {
          const original = btn.textContent;
          btn.textContent = "copied ✓";
          btn.classList.add("is-copied");
          setTimeout(() => {
            btn.textContent = original;
            btn.classList.remove("is-copied");
          }, 1400);
        }).catch(() => {
          btn.textContent = "copy failed";
          setTimeout(() => { btn.textContent = "copy"; }, 1400);
        });
      });

      async function loadClips() {
        try {
          const r = await fetch(NODE_BASE + "/clips.json");
          const d = await r.json();
          state.allClips = d.clips || [];
          applyFilters();
          setStatus((state.allClips.length) + " clippings", "ok");
        } catch {
          onDisconnected();
        }
      }

      function applyFilters() {
        let c = state.allClips;
        if (state.pinnedOnly) c = c.filter(x => x.pinned);
        if (state.query) {
          const q = state.query.toLowerCase();
          c = c.filter(x =>
            (x.text || "").toLowerCase().includes(q)
            || (x.preview || "").toLowerCase().includes(q)
            || (x.sourceApp || "").toLowerCase().includes(q)
            || (x.unfurl && x.unfurl.title && x.unfurl.title.toLowerCase().includes(q))
            || (x.unfurl && x.unfurl.host && x.unfurl.host.toLowerCase().includes(q))
          );
        }
        state.clips = c;
        render();
      }

      function render() {
        const grid = $("#mg-grid");
        grid.innerHTML = "";
        $("#mg-count").textContent = state.clips.length + " clip" + (state.clips.length === 1 ? "" : "s");
        if (state.clips.length === 0) {
          const d = document.createElement("div");
          d.className = "mg-empty";
          d.textContent = state.allClips.length === 0 ? "— no specimens collected yet —" : "— no clippings match that filter —";
          grid.appendChild(d);
          return;
        }
        const tpl = $("#mg-tpl-clip");
        for (const clip of state.clips) {
          const node = tpl.content.cloneNode(true);
          const article = node.querySelector(".mg-clip");
          article.dataset.id = clip.id;

          node.querySelector(".mg-src").textContent = clip.sourceApp || "clipboard";
          node.querySelector(".mg-ts").textContent = formatTime(clip.lastCopiedAt || clip.createdAt);
          node.querySelector(".mg-block-code").textContent = detectBlockType(clip);
          const count = clip.copyCount || 1;
          if (count > 1) {
            const badge = node.querySelector(".mg-count-badge");
            badge.textContent = "×" + count;
            badge.hidden = false;
          }
          if (clip.pinned) {
            node.querySelector(".mg-pin").hidden = false;
            article.classList.add("pinned");
          }

          const body = node.querySelector(".mg-body");
          if (clip.type === "image") {
            body.textContent = "[image · " + (clip.imageBytes || "?") + " bytes]";
            body.classList.add("plain");
          } else if (clip.type === "filePath") {
            body.textContent = "📄 " + (clip.filePath || clip.preview || "");
            body.classList.add("plain");
          } else if (clip.unfurl && (clip.unfurl.title || clip.unfurl.description || clip.unfurl.image)) {
            body.classList.add("unfurled");
            body.innerHTML = renderUnfurl(clip);
          } else {
            body.innerHTML = linkify(clip.text || clip.preview || "");
            body.classList.add("plain");
          }

          node.querySelector(".mg-copy").addEventListener("click", (e) => copyText(clip.text || clip.preview || "", e.target));
          node.querySelector(".mg-push").addEventListener("click", (e) => publish(clip, false, null, e.target.parentElement.querySelector(".mg-result")));
          node.querySelector(".mg-push-expand").addEventListener("click", (e) => openExpandModal(clip, e.target.parentElement.querySelector(".mg-result")));

          grid.appendChild(node);
        }
      }

      function formatTime(iso) {
        try {
          const d = new Date(iso);
          const diff = (Date.now() - d.getTime()) / 1000;
          if (diff < 60) return "just now";
          if (diff < 3600) return Math.floor(diff / 60) + "m ago";
          if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
          if (diff < 86400 * 7) return Math.floor(diff / 86400) + "d ago";
          return d.toLocaleDateString();
        } catch { return iso; }
      }

      function detectBlockType(clip) {
        if (clip.type === "image") return "IMG";
        if (clip.type === "filePath") return "FILE";
        const host = (clip.unfurl && clip.unfurl.host) || extractHost(clip.text || clip.preview || "");
        if (!host) return ((clip.text || clip.preview || "").length > 240) ? "READ" : "NOTE";
        const h = host.toLowerCase();
        if (/spotify|soundcloud|music\\\\.apple|bandcamp|tidal|anchor\\\\.fm/.test(h)) return "LISTEN";
        if (/youtube|youtu\\\\.be|vimeo|twitch|loom\\\\.com|tiktok\\\\.com/.test(h)) return "WATCH";
        if (/x\\\\.com|twitter\\\\.com|warpcast|bsky\\\\.app|threads\\\\.net|mastodon|farcaster/.test(h)) return "NOTE";
        if (/objkt|teia\\\\.art|fxhash|zora\\\\.co|manifold|opensea|foundation\\\\.app/.test(h)) return "MINT";
        if (/maps\\\\.google|google\\\\.com\\\\/maps|apple\\\\.com\\\\/maps|yelp\\\\.com/.test(h)) return "VISIT";
        if (/github|medium|substack|nytimes|bloomberg|wsj|wired|theverge|stratechery|pointcast/.test(h)) return "READ";
        return "LINK";
      }

      function defaultChannelFor(clip, blockType) {
        const host = ((clip.unfurl && clip.unfurl.host) || "").toLowerCase();
        const src = (clip.sourceApp || "").toLowerCase();
        if (blockType === "LISTEN") return "SPN";
        if (blockType === "VISIT") return "VST";
        if (/good[\\\\s-]?feels|cannabis|hemp|leafly/.test((clip.text || "") + " " + host)) return "GF";
        if (/pickleball|selkirk|paddle|court/.test((clip.text || "") + " " + host)) return "CRT";
        if (/el.segundo|escu|neighborhood/.test(clip.text || "")) return "ESC";
        if (/garden|bird|wildlife|balcony/.test(clip.text || "")) return "GDN";
        if (src.includes("spotify")) return "SPN";
        return "FD";
      }

      function extractHost(s) {
        try { return new URL(s.trim().split(/\\\\s+/)[0]).host || null; } catch { return null; }
      }

      function renderUnfurl(clip) {
        const u = clip.unfurl || {};
        const url = clip.text || clip.preview || "";
        const esc = (s) => (s || "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
        const image = u.image ? '<div class="mg-unfurl-plate"><img src="' + esc(u.image) + '" alt="" loading="lazy" onerror="this.parentElement.style.display=\\\\'none\\\\'"></div>' : "";
        const favicon = u.favicon ? '<img class="mg-favicon" src="' + esc(u.favicon) + '" alt="" loading="lazy" onerror="this.style.display=\\\\'none\\\\'">' : "";
        const host = u.host ? '<span class="mg-host">' + esc(u.host) + '</span>' : "";
        const title = u.title ? '<div class="mg-unfurl-title">' + esc(u.title) + '</div>' : "";
        const desc = u.description ? '<div class="mg-unfurl-desc">' + esc(u.description) + '</div>' : "";
        const urlLine = url ? '<a class="mg-unfurl-url" href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(url) + '</a>' : "";
        return '<div class="mg-unfurl">' + image + '<div class="mg-unfurl-host-row">' + favicon + host + '</div>' + title + desc + urlLine + '</div>';
      }

      function linkify(s) {
        const escaped = s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
        return escaped.replace(/(https?:\\\\/\\\\/[^\\\\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
      }

      async function copyText(text, btn) {
        try {
          await navigator.clipboard.writeText(text);
          const o = btn.textContent;
          btn.textContent = "copied ✓";
          setTimeout(() => { btn.textContent = o; }, 900);
        } catch { btn.textContent = "copy failed"; }
      }

      /* Modal */
      function initChannelOptions() {
        const sel = $("#mg-xChannel");
        sel.innerHTML = "";
        for (const c of CHANNELS) {
          const opt = document.createElement("option");
          opt.value = c.code;
          opt.textContent = "CH." + c.code + " — " + c.name;
          sel.appendChild(opt);
        }
      }

      function openExpandModal(clip, resultEl) {
        state.modalClip = { clip, resultEl };
        const bt = detectBlockType(clip);
        const ch = defaultChannelFor(clip, bt);
        const u = clip.unfurl || {};
        $("#mg-xBlockType").value = bt;
        $("#mg-xChannel").value = ch;
        $("#mg-xTitle").value = u.title || deriveFallbackTitle(clip);
        $("#mg-xDek").value = u.description || "";
        $("#mg-xBody").value = clip.text || clip.preview || "";
        updateCitation();
        const back = $("#mg-expandBackdrop");
        back.hidden = false;
        void back.offsetWidth;
        back.classList.add("open");
        setTimeout(() => $("#mg-xTitle").focus(), 50);
      }

      function closeExpandModal() {
        const back = $("#mg-expandBackdrop");
        back.classList.remove("open");
        setTimeout(() => { back.hidden = true; }, 200);
        state.modalClip = null;
      }

      function deriveFallbackTitle(clip) {
        const t = (clip.text || clip.preview || "").trim();
        if (!t) return "";
        const first = t.split("\\\\n", 1)[0].trim();
        return first.length > 100 ? first.slice(0, 97) + "…" : first;
      }

      function updateCitation() {
        $("#mg-xCiteChannel").textContent = "CH." + $("#mg-xChannel").value;
        $("#mg-xCiteTitle").textContent = '"' + ($("#mg-xTitle").value.trim() || "—") + '"';
        $("#mg-xCiteDate").textContent = new Date().toISOString().slice(0, 10);
      }

      async function publishFromModal() {
        if (!state.modalClip) return;
        const { clip, resultEl } = state.modalClip;
        const ch = $("#mg-xChannel").value;
        const bt = $("#mg-xBlockType").value;
        const title = $("#mg-xTitle").value.trim();
        const dek = $("#mg-xDek").value.trim();
        const body = $("#mg-xBody").value.trim();
        if (!title || !body) {
          $("#mg-xPublish").textContent = "title + body required";
          setTimeout(() => { $("#mg-xPublish").textContent = "publish block ⇝"; }, 1400);
          return;
        }
        $("#mg-xPublish").disabled = true;
        $("#mg-xPublish").textContent = "publishing…";
        try {
          await publish(clip, true, {
            subject: title,
            body: body,
            channel: ch,
            blockType: bt,
            dek: dek || undefined,
          }, resultEl);
          closeExpandModal();
        } catch {
          $("#mg-xPublish").disabled = false;
          $("#mg-xPublish").textContent = "retry ⇝";
        }
      }

      async function publish(clip, expand, override, resultEl) {
        if (state.demo) {
          if (resultEl) { resultEl.textContent = "demo · push disabled"; resultEl.className = "mg-result err"; }
          throw new Error("demo mode");
        }
        const endpoint = (state.config && state.config.endpoint) || PC_PING;
        if (resultEl) { resultEl.textContent = "sending…"; resultEl.className = "mg-result"; }
        const body = (override && override.body) || clip.text || clip.preview || "";
        if (!body) {
          if (resultEl) { resultEl.textContent = "empty"; resultEl.className = "mg-result err"; }
          throw new Error("empty");
        }
        const subject = (override && override.subject) || deriveSubject(clip, body);
        const payload = {
          type: "pc-ping-v1",
          body: body.slice(0, 4000),
          timestamp: new Date().toISOString(),
          expand: !!expand,
        };
        if (subject) payload.subject = subject.slice(0, 120);
        if (state.config && state.config.fromName) payload.from = state.config.fromName.slice(0, 80);
        if (state.config && state.config.address) payload.address = state.config.address;
        // Structured expansion hints (pc-ping-v1 v0.5+)
        if (override && override.channel) payload.channel = override.channel;
        if (override && override.blockType) payload.blockType = override.blockType;
        if (override && override.dek) payload.dek = override.dek.slice(0, 280);
        // Always attach source context when we have it — helps cc infer
        // even when expand=false.
        const sourceUrl = (clip.text || clip.preview || "").trim();
        if (/^https?:\\\\/\\\\//i.test(sourceUrl)) payload.sourceUrl = sourceUrl.slice(0, 2048);
        if (clip.sourceApp) payload.sourceApp = clip.sourceApp.slice(0, 120);

        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.ok) {
            if (resultEl) { resultEl.textContent = expand ? "expanded ✓" : "pushed ✓"; resultEl.className = "mg-result ok"; }
            return data;
          } else {
            const reason = data.reason || data.error || ("HTTP " + res.status);
            if (resultEl) { resultEl.textContent = reason; resultEl.className = "mg-result err"; }
            throw new Error(reason);
          }
        } catch (e) {
          if (resultEl) { resultEl.textContent = "network err"; resultEl.className = "mg-result err"; }
          throw e;
        }
      }

      function deriveSubject(clip, body) {
        if (clip.unfurl && clip.unfurl.title) return clip.unfurl.title;
        const first = body.split("\\\\n", 1)[0].trim();
        try { const u = new URL(first); if (u.host) return clip.sourceApp ? clip.sourceApp + ": " + u.host : u.host; } catch {}
        return clip.sourceApp ? "magpie clip from " + clip.sourceApp : "magpie clip";
      }

      /* wire up */
      $("#mg-q").addEventListener("input", (e) => { state.query = e.target.value; applyFilters(); });
      $("#mg-pinnedOnly").addEventListener("change", (e) => { state.pinnedOnly = e.target.checked; applyFilters(); });
      $("#mg-refresh").addEventListener("click", () => {
        if (state.demo) { state.allClips = DEMO_CLIPS.slice(); applyFilters(); return; }
        state.connected ? loadClips() : probe();
      });
      $("#mg-retry").addEventListener("click", () => probe());
      $("#mg-demo").addEventListener("click", enterDemo);
      $("#mg-demo-exit").addEventListener("click", exitDemo);

      const endpointInput = $("#mg-endpoint");
      if (endpointInput) endpointInput.value = NODE_BASE === NODE_DEFAULT ? "" : NODE_BASE;
      $("#mg-endpoint-save") && $("#mg-endpoint-save").addEventListener("click", () => {
        const v = ($("#mg-endpoint").value || "").trim().replace(/\\\\/$/, "");
        if (v && /^https?:\\\\/\\\\//i.test(v)) {
          try { localStorage.setItem(NODE_STORAGE_KEY, v); } catch {}
          NODE_BASE = v;
        } else if (!v) {
          try { localStorage.removeItem(NODE_STORAGE_KEY); } catch {}
          NODE_BASE = NODE_DEFAULT;
        } else {
          $("#mg-endpoint").style.borderColor = "var(--mg-leaf-red)";
          setTimeout(() => { $("#mg-endpoint").style.borderColor = ""; }, 1400);
          return;
        }
        setStatus("checking", "checking");
        probe();
      });
      $("#mg-endpoint-reset") && $("#mg-endpoint-reset").addEventListener("click", () => {
        try { localStorage.removeItem(NODE_STORAGE_KEY); } catch {}
        NODE_BASE = NODE_DEFAULT;
        $("#mg-endpoint").value = "";
        setStatus("checking", "checking");
        probe();
      });

      document.querySelectorAll("[data-mg-close]").forEach(el => el.addEventListener("click", closeExpandModal));
      $("#mg-expandBackdrop").addEventListener("click", (e) => { if (e.target.id === "mg-expandBackdrop") closeExpandModal(); });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !$("#mg-expandBackdrop").hidden) closeExpandModal();
        if (e.key === "Enter" && e.metaKey && state.modalClip) publishFromModal();
      });

      $("#mg-xChannel").addEventListener("change", updateCitation);
      $("#mg-xTitle").addEventListener("input", updateCitation);
      $("#mg-xPublish").addEventListener("click", publishFromModal);

      initChannelOptions();
      probe();
      setInterval(() => { state.connected ? loadClips() : probe(); }, POLL_MS);
    })();
  <\/script> `])), maybeRenderHead()) })} `;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/magpie.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/magpie.astro";
const $$url = "/magpie";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Magpie,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
