import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$Demo = createComponent(async ($$result, $$props, $$slots) => {
  const description = "PCP/2 friend messaging demo: exchange friend cards, sign direct messages, and export the thread as JSONL.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": "https://pointcast.xyz/messages/demo",
    name: "PointCast Messages Friend Demo",
    applicationCategory: "CommunicationApplication",
    operatingSystem: "Web",
    description,
    url: "https://pointcast.xyz/messages/demo"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Messages Demo", "description": description, "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/protocol.json", title: "PointCast Peer Message Protocol" },
    { type: "application/json", href: "/.well-known/pointcast-peer.json", title: "PointCast peer discovery" }
  ], "data-astro-cid-xrsro6io": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="friend-demo" data-friend-demo data-astro-cid-xrsro6io> <header class="demo-head" data-astro-cid-xrsro6io> <nav class="breadcrumb" aria-label="Breadcrumb" data-astro-cid-xrsro6io> <a href="/" data-astro-cid-xrsro6io>Home</a> <span data-astro-cid-xrsro6io>/</span> <a href="/messages" data-astro-cid-xrsro6io>messages</a> <span data-astro-cid-xrsro6io>/</span> <strong data-astro-cid-xrsro6io>demo</strong> </nav> <div class="title-row" data-astro-cid-xrsro6io> <div data-astro-cid-xrsro6io> <p class="kicker" data-astro-cid-xrsro6io>PCP/2 DRAFT · SIMPLE FRIEND MESSAGING</p> <h1 data-astro-cid-xrsro6io>Friend Demo</h1> </div> <p data-astro-cid-xrsro6io>
Exchange a friend card, sign a direct packet, carry the thread by JSONL today,
          then swap in encrypted relay delivery when the relay KV is bound.
</p> </div> <div class="status-line" data-status data-astro-cid-xrsro6io>Ready.</div> </header> <section class="demo-grid" aria-label="Friend messaging demo" data-astro-cid-xrsro6io> <section class="panel setup-panel" aria-labelledby="setup-title" data-astro-cid-xrsro6io> <div class="panel-head" data-astro-cid-xrsro6io> <p class="kicker" data-astro-cid-xrsro6io>SETUP</p> <h2 id="setup-title" data-astro-cid-xrsro6io>Two peers</h2> </div> <div class="peer-pair" data-astro-cid-xrsro6io> <article class="peer-card" data-astro-cid-xrsro6io> <span data-astro-cid-xrsro6io>You</span> <strong data-me-name data-astro-cid-xrsro6io>not created</strong> <code data-me-peer data-astro-cid-xrsro6io>peer id appears here</code> </article> <article class="peer-card" data-astro-cid-xrsro6io> <span data-astro-cid-xrsro6io>Friend</span> <strong data-friend-name data-astro-cid-xrsro6io>not created</strong> <code data-friend-peer data-astro-cid-xrsro6io>peer id appears here</code> </article> </div> <div class="button-row" data-astro-cid-xrsro6io> <button type="button" data-run-demo data-astro-cid-xrsro6io>Run demo</button> <button type="button" data-reset-demo data-astro-cid-xrsro6io>Reset</button> </div> </section> <section class="panel cards-panel" aria-labelledby="cards-title" data-astro-cid-xrsro6io> <div class="panel-head" data-astro-cid-xrsro6io> <p class="kicker" data-astro-cid-xrsro6io>FRIEND CARDS</p> <h2 id="cards-title" data-astro-cid-xrsro6io>Copy / paste</h2> </div> <label data-astro-cid-xrsro6io> <span data-astro-cid-xrsro6io>Your card</span> <textarea data-me-card rows="5" spellcheck="false" readonly data-astro-cid-xrsro6io></textarea> </label> <label data-astro-cid-xrsro6io> <span data-astro-cid-xrsro6io>Friend card</span> <textarea data-friend-card rows="5" spellcheck="false" data-astro-cid-xrsro6io></textarea> </label> <div class="button-row" data-astro-cid-xrsro6io> <button type="button" data-copy-me-card data-astro-cid-xrsro6io>Copy your card</button> <button type="button" data-import-card data-astro-cid-xrsro6io>Parse friend card</button> </div> </section> <section class="panel compose-panel" aria-labelledby="compose-title" data-astro-cid-xrsro6io> <div class="panel-head" data-astro-cid-xrsro6io> <p class="kicker" data-astro-cid-xrsro6io>COMPOSE</p> <h2 id="compose-title" data-astro-cid-xrsro6io>Direct packet</h2> </div> <label data-astro-cid-xrsro6io> <span data-astro-cid-xrsro6io>Message</span> <textarea data-message rows="8" maxlength="4000" data-astro-cid-xrsro6io>hey, this is a signed PointCast packet from my browser.</textarea> </label> <div class="button-row" data-astro-cid-xrsro6io> <button type="button" data-send-me data-astro-cid-xrsro6io>Send as you</button> <button type="button" data-send-friend data-astro-cid-xrsro6io>Friend replies</button> </div> </section> <section class="panel thread-panel" aria-labelledby="thread-title" data-astro-cid-xrsro6io> <div class="panel-head" data-astro-cid-xrsro6io> <p class="kicker" data-astro-cid-xrsro6io>THREAD</p> <h2 id="thread-title" data-astro-cid-xrsro6io>Signed messages</h2> </div> <ol class="thread-list" data-thread-list data-astro-cid-xrsro6io></ol> </section> <section class="panel handoff-panel" aria-labelledby="handoff-title" data-astro-cid-xrsro6io> <div class="panel-head" data-astro-cid-xrsro6io> <p class="kicker" data-astro-cid-xrsro6io>HANDOFF</p> <h2 id="handoff-title" data-astro-cid-xrsro6io>JSONL bundle</h2> </div> <textarea data-jsonl rows="10" spellcheck="false" readonly data-astro-cid-xrsro6io></textarea> <div class="button-row" data-astro-cid-xrsro6io> <button type="button" data-export-jsonl data-astro-cid-xrsro6io>Refresh export</button> <button type="button" data-copy-jsonl data-astro-cid-xrsro6io>Copy JSONL</button> </div> </section> <section class="panel friend-steps" aria-labelledby="steps-title" data-astro-cid-xrsro6io> <div class="panel-head" data-astro-cid-xrsro6io> <p class="kicker" data-astro-cid-xrsro6io>WHAT A FRIEND DOES</p> <h2 id="steps-title" data-astro-cid-xrsro6io>Three moves</h2> </div> <ol data-astro-cid-xrsro6io> <li data-astro-cid-xrsro6io><strong data-astro-cid-xrsro6io>Open PointCast Messages.</strong><span data-astro-cid-xrsro6io>Create a local peer and copy the friend card.</span></li> <li data-astro-cid-xrsro6io><strong data-astro-cid-xrsro6io>Exchange cards.</strong><span data-astro-cid-xrsro6io>Send the card by text, QR, email, AirDrop, or a public profile link.</span></li> <li data-astro-cid-xrsro6io><strong data-astro-cid-xrsro6io>Sync packets.</strong><span data-astro-cid-xrsro6io>Today: JSONL handoff. Next: encrypted relay pickup.</span></li> </ol> </section> </section> </div> ` })} ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/messages/demo.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/messages/demo.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/messages/demo.astro";
const $$url = "/messages/demo";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Demo,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
