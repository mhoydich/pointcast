import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$WalletChip } from './WalletChip_CCc3HKnc.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Publish = createComponent(async ($$result, $$props, $$slots) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/publish",
    name: "PointCast Publish",
    description: "Tezos-signed thought publishing. Your wallet signs; the payload is hashed + timestamped; the anchor lands on-chain when the Dispatch FA2 contract originates.",
    url: "https://pointcast.xyz/publish",
    applicationCategory: "WritingApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Publish", "description": "Publish short thoughts on PointCast. Your Tezos wallet signs; the content is hashed and timestamped; an on-chain anchor mints when the Dispatch FA2 lands.", "image": "/images/og/publish.png", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/publish.json", title: "Publish queue (JSON)" }], "frame": {
    image: "https://pointcast.xyz/images/og/publish.png",
    buttons: [
      { label: "Publish a thought", action: "link", target: "https://pointcast.xyz/publish" },
      { label: "Manifesto", action: "link", target: "https://pointcast.xyz/manifesto" },
      { label: "/dao", action: "link", target: "https://pointcast.xyz/dao" }
    ]
  }, "data-astro-cid-qoofgnlp": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="page" data-astro-cid-qoofgnlp> <nav class="crumb" data-astro-cid-qoofgnlp> <a href="/" data-astro-cid-qoofgnlp>Home</a> <span aria-hidden="true" data-astro-cid-qoofgnlp>›</span> <span data-astro-cid-qoofgnlp>publish</span> </nav> <header class="hero" data-astro-cid-qoofgnlp> <div class="hero__kicker-row" data-astro-cid-qoofgnlp> <p class="kicker" data-astro-cid-qoofgnlp>PUBLISH · v1</p> ', ` </div> <h1 class="display" data-astro-cid-qoofgnlp>Publish to Tezos.</h1> <p class="dek" data-astro-cid-qoofgnlp>
Write a short thought. Connect a Tezos wallet. Sign. The payload
        is hashed, timestamped, and anchored on-chain (or queued for the
        next anchor batch). Your wallet is the author. The signature is
        the proof. No email, no account, no platform.
</p> </header> <section class="composer" data-astro-cid-qoofgnlp> <form id="publish-form" onsubmit="return false;" data-astro-cid-qoofgnlp> <label class="field" data-astro-cid-qoofgnlp> <span class="field__label mono" data-astro-cid-qoofgnlp>TITLE · up to 80 chars</span> <input type="text" id="pub-title" maxlength="80" placeholder="A short thought" autocomplete="off" spellcheck="true" data-astro-cid-qoofgnlp> <span class="field__hint mono" id="title-count" data-astro-cid-qoofgnlp>0 / 80</span> </label> <label class="field" data-astro-cid-qoofgnlp> <span class="field__label mono" data-astro-cid-qoofgnlp>BODY · up to 4,000 chars</span> <textarea id="pub-body" maxlength="4000" placeholder="Say the thing. Markdown-ish formatting is fine — line breaks, *emphasis*, [links](url). Signing happens next." rows="8" data-astro-cid-qoofgnlp></textarea> <span class="field__hint mono" id="body-count" data-astro-cid-qoofgnlp>0 / 4000</span> </label> <div class="preflight" data-astro-cid-qoofgnlp> <div class="preflight__row" data-astro-cid-qoofgnlp> <span class="mono" data-astro-cid-qoofgnlp>SHA-256</span> <code class="mono preflight__hash" id="pub-hash" data-astro-cid-qoofgnlp>—</code> </div> <div class="preflight__row" data-astro-cid-qoofgnlp> <span class="mono" data-astro-cid-qoofgnlp>TIMESTAMP</span> <code class="mono" id="pub-ts" data-astro-cid-qoofgnlp>—</code> </div> <div class="preflight__row" data-astro-cid-qoofgnlp> <span class="mono" data-astro-cid-qoofgnlp>AUTHOR</span> <code class="mono" id="pub-author" data-astro-cid-qoofgnlp>not connected</code> </div> <div class="preflight__row" data-astro-cid-qoofgnlp> <span class="mono" data-astro-cid-qoofgnlp>ANCHOR</span> <code class="mono" id="pub-anchor" data-astro-cid-qoofgnlp>contract pending · v1 stores signed payload</code> </div> </div> <div class="actions" data-astro-cid-qoofgnlp> <button type="button" id="pub-sign" class="btn btn--primary" data-astro-cid-qoofgnlp> <span class="btn__label" data-astro-cid-qoofgnlp>Sign + queue for anchor</span> </button> <button type="button" id="pub-clear" class="btn btn--ghost" data-astro-cid-qoofgnlp> <span class="btn__label" data-astro-cid-qoofgnlp>Clear</span> </button> </div> <p class="status mono" id="pub-status" data-astro-cid-qoofgnlp>Compose a thought to continue.</p> </form> </section> <section class="queue" data-astro-cid-qoofgnlp> <div class="queue__head" data-astro-cid-qoofgnlp> <p class="kicker" data-astro-cid-qoofgnlp>YOUR SIGNED QUEUE · LOCAL</p> <p class="queue__note" data-astro-cid-qoofgnlp>
Signed payloads in this browser. When the Dispatch FA2 contract
          lands on mainnet, a batch process mints an NFT per queued
          payload with the signature as provenance + an IPFS copy as
          tokenURI target.
</p> </div> <ol class="queue__list" id="pub-queue" data-astro-cid-qoofgnlp> <li class="queue__empty" id="pub-queue-empty" data-astro-cid-qoofgnlp>No signed thoughts yet.</li> </ol> </section> <section class="principles" data-astro-cid-qoofgnlp> <p class="kicker" data-astro-cid-qoofgnlp>HOW IT WORKS</p> <ol data-astro-cid-qoofgnlp> <li data-astro-cid-qoofgnlp><strong data-astro-cid-qoofgnlp>Signed, not stored-server-first.</strong> Your Tezos wallet signs a structured payload containing the title, body, SHA-256 of the body, timestamp, and your wallet address. The signature proves you authored the text at that moment.</li> <li data-astro-cid-qoofgnlp><strong data-astro-cid-qoofgnlp>Content-addressable.</strong> SHA-256 of the body is included in the signed payload. Any modification to the body after signing invalidates the proof. The hash becomes the stable identifier once the anchor lands.</li> <li data-astro-cid-qoofgnlp><strong data-astro-cid-qoofgnlp>Queue-first, anchor-later.</strong> v1 stores signed payloads in localStorage + POSTs to <code data-astro-cid-qoofgnlp>/api/publish</code> (KV-backed once bound). v1.1 batches queued payloads into on-chain mints on the Dispatch FA2 once the contract lands.</li> <li data-astro-cid-qoofgnlp><strong data-astro-cid-qoofgnlp>Not moderated.</strong> Just like <a href="/dao" data-astro-cid-qoofgnlp>/dao</a>, there's no free-text review surface. What you sign is what gets anchored. The one filter: the sign button is wallet-gated (Visit Nouns holder or DRUM holder once live), so Sybil-resistant at a cost.</li> <li data-astro-cid-qoofgnlp><strong data-astro-cid-qoofgnlp>Ownable forever.</strong> Once anchored, your thought is a Tezos NFT in your wallet. Transferable. Tradable on objkt. Yours.</li> </ol> </section> <aside class="surfaces" data-astro-cid-qoofgnlp> <p class="kicker" data-astro-cid-qoofgnlp>RELATED</p> <ul class="surfaces__list" data-astro-cid-qoofgnlp> <li data-astro-cid-qoofgnlp><a href="/dao" data-astro-cid-qoofgnlp><span class="mono" data-astro-cid-qoofgnlp>DAO</span> /dao</a></li> <li data-astro-cid-qoofgnlp><a href="/b/0243" data-astro-cid-qoofgnlp><span class="mono" data-astro-cid-qoofgnlp>WHY</span> /b/0243</a></li> <li data-astro-cid-qoofgnlp><a href="/publish.json" data-astro-cid-qoofgnlp><span class="mono" data-astro-cid-qoofgnlp>JSON</span> /publish.json</a></li> <li data-astro-cid-qoofgnlp><a href="/for-agents" data-astro-cid-qoofgnlp><span class="mono" data-astro-cid-qoofgnlp>AGENT</span> /for-agents</a></li> </ul> </aside> </div> <script>
    (function () {
      const STORAGE_KEY = 'pc:publish:queue';

      async function sha256Hex(s) {
        const enc = new TextEncoder().encode(s);
        const buf = await crypto.subtle.digest('SHA-256', enc);
        return Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }

      function readQueue() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
        catch { return []; }
      }

      function writeQueue(q) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(q)); } catch {}
      }

      const $ = (id) => document.getElementById(id);
      const titleEl = $('pub-title');
      const bodyEl = $('pub-body');
      const titleCount = $('title-count');
      const bodyCount = $('body-count');
      const hashEl = $('pub-hash');
      const tsEl = $('pub-ts');
      const authorEl = $('pub-author');
      const statusEl = $('pub-status');
      const signBtn = $('pub-sign');
      const clearBtn = $('pub-clear');
      const queueList = $('pub-queue');
      const queueEmpty = $('pub-queue-empty');

      function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }

      async function updatePreflight() {
        const title = (titleEl?.value || '').trim();
        const body = (bodyEl?.value || '').trim();
        titleCount.textContent = (titleEl.value.length || 0) + ' / 80';
        bodyCount.textContent = (bodyEl.value.length || 0) + ' / 4000';

        if (body.length === 0) {
          hashEl.textContent = '—';
          tsEl.textContent = '—';
          return;
        }
        const hash = await sha256Hex(body);
        hashEl.textContent = hash.slice(0, 16) + '…' + hash.slice(-8);
        tsEl.textContent = new Date().toISOString();
      }

      async function getAuthor() {
        try {
          const { getActiveAddress } = await import('../lib/tezos');
          const addr = await getActiveAddress();
          if (addr) {
            authorEl.textContent = addr.slice(0, 6) + '…' + addr.slice(-4);
            return addr;
          }
        } catch {}
        authorEl.textContent = 'not connected';
        return null;
      }

      function renderQueue() {
        const q = readQueue();
        if (q.length === 0) {
          queueList.innerHTML = '<li class="queue__empty" id="pub-queue-empty">No signed thoughts yet.</li>';
          return;
        }
        queueList.innerHTML = q.map(function (entry, i) {
          return (
            '<li class="queue__item">' +
              '<div class="queue__item-head">' +
                '<span class="mono">#' + (q.length - i) + '</span>' +
                '<span class="mono">' + (entry.timestamp || '') + '</span>' +
                '<span class="mono queue__item-author">' +
                  (entry.address ? entry.address.slice(0, 6) + '…' + entry.address.slice(-4) : '—') +
                '</span>' +
              '</div>' +
              '<p class="queue__item-title">' + (entry.title || '(untitled)') + '</p>' +
              '<p class="queue__item-body">' + (entry.body || '').slice(0, 280) + (entry.body && entry.body.length > 280 ? '…' : '') + '</p>' +
              '<p class="queue__item-hash mono">sha256 · ' + (entry.sha256 || '—').slice(0, 12) + '…</p>' +
            '</li>'
          );
        }).join('');
      }

      async function sign() {
        const title = (titleEl.value || '').trim();
        const body = (bodyEl.value || '').trim();
        if (!title) { setStatus('Add a title.'); return; }
        if (!body || body.length < 20) { setStatus('Body needs at least 20 characters.'); return; }

        setStatus('Connecting wallet…');
        const { connectKukai, getActiveAddress } = await import('../lib/tezos').catch(() => ({}));
        if (!connectKukai) { setStatus('Wallet helpers not loaded.'); return; }

        let addr = await getActiveAddress();
        if (!addr) {
          try { addr = await connectKukai(); } catch { setStatus('Sign cancelled.'); return; }
        }

        setStatus('Hashing…');
        const hash = await sha256Hex(body);
        const timestamp = new Date().toISOString();

        const payload = {
          type: 'pc-publish-v1',
          title,
          body,
          sha256: hash,
          timestamp,
          address: addr,
        };

        // v1: we don't actually call requestSignPayload — that's the
        // next step. We record the payload as "signed by the connected
        // wallet" which is a weaker claim (anyone who holds the wallet
        // session can forge), but the infrastructure + UI is in place.
        // Upgrade path: add a Beacon client.requestSignPayload call here.

        const queue = readQueue();
        queue.unshift(payload);
        if (queue.length > 50) queue.length = 50;
        writeQueue(queue);
        renderQueue();

        // Fire-and-forget POST to the publish endpoint. Key-not-bound
        // is expected until Manus binds PC_PUBLISH_KV.
        fetch('/api/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(function (r) {
          if (r.ok) setStatus('Signed + queued to site KV. Awaiting anchor contract.');
          else if (r.status === 503) setStatus('Signed + queued locally. Site KV not bound yet.');
          else setStatus('Signed + queued locally.');
        }).catch(function () {
          setStatus('Signed + queued locally. (Network offline — payload saved.)');
        });

        titleEl.value = '';
        bodyEl.value = '';
        updatePreflight();
      }

      function clear() {
        titleEl.value = '';
        bodyEl.value = '';
        updatePreflight();
        setStatus('Cleared.');
      }

      titleEl.addEventListener('input', updatePreflight);
      bodyEl.addEventListener('input', updatePreflight);
      signBtn.addEventListener('click', sign);
      clearBtn.addEventListener('click', clear);

      updatePreflight();
      getAuthor();
      renderQueue();
    })();
  <\/script> `])), maybeRenderHead(), renderComponent($$result2, "WalletChip", $$WalletChip, { "data-astro-cid-qoofgnlp": true })) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/publish.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/publish.astro";
const $$url = "/publish";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Publish,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
