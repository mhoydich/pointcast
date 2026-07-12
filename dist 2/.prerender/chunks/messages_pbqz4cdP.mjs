import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$Messages = createComponent(async ($$result, $$props, $$slots) => {
  const description = "Local-first PointCast Peer Message Protocol client: create a peer identity, sign Block Packets, export/import JSONL, draft public Blocks, and try chain-anchored messaging.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": "https://pointcast.xyz/messages",
    name: "PointCast Messages",
    applicationCategory: "CommunicationApplication",
    operatingSystem: "Web",
    description,
    url: "https://pointcast.xyz/messages"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Messages", "description": description, "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/protocol.json", title: "PointCast Peer Message Protocol" },
    { type: "application/json", href: "/.well-known/pointcast-peer.json", title: "PointCast peer discovery" }
  ], "data-astro-cid-t7e726a7": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="messages-page" data-pcp-app data-astro-cid-t7e726a7> <header class="app-head" data-astro-cid-t7e726a7> <nav class="breadcrumb" aria-label="Breadcrumb" data-astro-cid-t7e726a7> <a href="/" data-astro-cid-t7e726a7>Home</a> <span data-astro-cid-t7e726a7>/</span> <a href="/protocol" data-astro-cid-t7e726a7>protocol</a> <span data-astro-cid-t7e726a7>/</span> <strong data-astro-cid-t7e726a7>messages</strong> </nav> <div class="app-title" data-astro-cid-t7e726a7> <p class="kicker" data-astro-cid-t7e726a7>PCP/1 CLIENT · LOCAL-FIRST</p> <h1 data-astro-cid-t7e726a7>Messages</h1> <div class="app-copy" data-astro-cid-t7e726a7> <p data-astro-cid-t7e726a7>
Create a local peer, sign a Block Packet, keep it in your browser,
            export/import JSONL, and copy any packet into a public Block draft.
</p> <div class="app-links" data-astro-cid-t7e726a7> <a href="/messages/demo" data-astro-cid-t7e726a7>Open friend demo</a> <a href="/messages/chain" data-astro-cid-t7e726a7>Open chain messenger</a> </div> </div> </div> <div class="status-line" data-status data-astro-cid-t7e726a7>Loading local peer state.</div> </header> <section class="workspace" aria-label="PointCast peer message workspace" data-astro-cid-t7e726a7> <section class="panel identity-panel" aria-labelledby="identity-title" data-astro-cid-t7e726a7> <div class="panel-head" data-astro-cid-t7e726a7> <p class="kicker" data-astro-cid-t7e726a7>IDENTITY</p> <h2 id="identity-title" data-astro-cid-t7e726a7>Local peer</h2> </div> <label data-astro-cid-t7e726a7> <span data-astro-cid-t7e726a7>Name</span> <input data-display-name value="PointCast peer" autocomplete="nickname" data-astro-cid-t7e726a7> </label> <label data-astro-cid-t7e726a7> <span data-astro-cid-t7e726a7>Kind</span> <select data-peer-kind data-astro-cid-t7e726a7> <option value="human" data-astro-cid-t7e726a7>human</option> <option value="agent" data-astro-cid-t7e726a7>agent</option> </select> </label> <div class="peer-id-box" data-astro-cid-t7e726a7> <span data-astro-cid-t7e726a7>Peer id</span> <code data-peer-id data-astro-cid-t7e726a7>none yet</code> </div> <div class="button-row" data-astro-cid-t7e726a7> <button type="button" data-create-peer data-astro-cid-t7e726a7>Create / rotate key</button> <button type="button" data-copy-peer data-astro-cid-t7e726a7>Copy peer id</button> </div> <p class="fine-print" data-astro-cid-t7e726a7>
Prototype note: the private key is exportable and stays in this browser's localStorage.
          Do not use it for secrets yet.
</p> </section> <section class="panel compose-panel" aria-labelledby="compose-title" data-astro-cid-t7e726a7> <div class="panel-head" data-astro-cid-t7e726a7> <p class="kicker" data-astro-cid-t7e726a7>COMPOSE</p> <h2 id="compose-title" data-astro-cid-t7e726a7>Sign a Block Packet</h2> </div> <label data-astro-cid-t7e726a7> <span data-astro-cid-t7e726a7>To peer id</span> <input data-to-peer placeholder="peer:ed25519:..." autocomplete="off" data-astro-cid-t7e726a7> </label> <label data-astro-cid-t7e726a7> <span data-astro-cid-t7e726a7>Topic</span> <input data-topic value="pcp/pointcast/messages" autocomplete="off" data-astro-cid-t7e726a7> </label> <div class="compose-grid" data-astro-cid-t7e726a7> <label data-astro-cid-t7e726a7> <span data-astro-cid-t7e726a7>Visibility</span> <select data-visibility data-astro-cid-t7e726a7> <option value="local" data-astro-cid-t7e726a7>local proof</option> <option value="public" data-astro-cid-t7e726a7>public broadcast</option> <option value="private" data-astro-cid-t7e726a7>private intent</option> </select> </label> <label data-astro-cid-t7e726a7> <span data-astro-cid-t7e726a7>Agent readable</span> <select data-agent-readable data-astro-cid-t7e726a7> <option value="true" data-astro-cid-t7e726a7>yes</option> <option value="false" data-astro-cid-t7e726a7>no</option> </select> </label> </div> <label data-astro-cid-t7e726a7> <span data-astro-cid-t7e726a7>Message</span> <textarea data-body rows="7" maxlength="4000" placeholder="meet me on the block layer" data-astro-cid-t7e726a7></textarea> </label> <div class="button-row" data-astro-cid-t7e726a7> <button type="button" data-sign-store data-astro-cid-t7e726a7>Sign + store</button> <button type="button" data-clear-compose data-astro-cid-t7e726a7>Clear</button> </div> </section> <section class="panel log-panel" aria-labelledby="log-title" data-astro-cid-t7e726a7> <div class="panel-head" data-astro-cid-t7e726a7> <p class="kicker" data-astro-cid-t7e726a7>THREAD</p> <h2 id="log-title" data-astro-cid-t7e726a7>Local log</h2> </div> <div class="log-tabs" role="tablist" aria-label="Message filters" data-astro-cid-t7e726a7> <button type="button" data-filter="all" aria-pressed="true" data-astro-cid-t7e726a7>All</button> <button type="button" data-filter="outbox" aria-pressed="false" data-astro-cid-t7e726a7>Outbox</button> <button type="button" data-filter="inbox" aria-pressed="false" data-astro-cid-t7e726a7>Inbox</button> </div> <ol class="packet-list" data-packet-list data-astro-cid-t7e726a7></ol> </section> <section class="panel exchange-panel" aria-labelledby="exchange-title" data-astro-cid-t7e726a7> <div class="panel-head" data-astro-cid-t7e726a7> <p class="kicker" data-astro-cid-t7e726a7>JSONL</p> <h2 id="exchange-title" data-astro-cid-t7e726a7>Export / import</h2> </div> <textarea data-jsonl rows="11" spellcheck="false" placeholder="Exported packets appear here. Paste JSONL here to import." data-astro-cid-t7e726a7></textarea> <div class="button-row" data-astro-cid-t7e726a7> <button type="button" data-export-jsonl data-astro-cid-t7e726a7>Export log</button> <button type="button" data-import-jsonl data-astro-cid-t7e726a7>Import JSONL</button> <button type="button" data-clear-log data-astro-cid-t7e726a7>Clear local log</button> </div> </section> <section class="panel block-panel" aria-labelledby="block-title" data-astro-cid-t7e726a7> <div class="panel-head" data-astro-cid-t7e726a7> <p class="kicker" data-astro-cid-t7e726a7>PUBLIC BLOCK DRAFT</p> <h2 id="block-title" data-astro-cid-t7e726a7>Selected packet</h2> </div> <textarea data-block-draft rows="12" spellcheck="false" placeholder="Select a packet to generate Block copy." data-astro-cid-t7e726a7></textarea> <div class="button-row" data-astro-cid-t7e726a7> <button type="button" data-copy-block data-astro-cid-t7e726a7>Copy Block draft</button> <a href="/publish" data-astro-cid-t7e726a7>Open /publish</a> </div> </section> <section class="panel receipts-panel" aria-labelledby="receipts-title" data-astro-cid-t7e726a7> <div class="panel-head" data-astro-cid-t7e726a7> <p class="kicker" data-astro-cid-t7e726a7>RECEIPTS</p> <h2 id="receipts-title" data-astro-cid-t7e726a7>Local receipts</h2> </div> <ol class="receipt-list" data-receipt-list data-astro-cid-t7e726a7></ol> </section> </section> <aside class="relay-note" aria-label="Relay status" data-astro-cid-t7e726a7> <strong data-astro-cid-t7e726a7>Relay status</strong> <p data-astro-cid-t7e726a7>
The relay endpoint exists at <code data-astro-cid-t7e726a7>/api/pcp/relay</code>, but this client
        does not send plaintext to it. Relay delivery starts only with encrypted
        envelopes.
</p> </aside> </div> ` })} ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/messages.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/messages.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/messages.astro";
const $$url = "/messages";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Messages,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
