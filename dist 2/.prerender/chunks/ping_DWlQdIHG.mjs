import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Ping = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Ping — message Claude Code";
  const description = "Async inbox for PointCast. Drop a message — Claude Code reads it at the start of the next session. Optional Beacon wallet signing, no account required.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Ping",
    description,
    url: "https://pointcast.xyz/ping",
    mainEntity: {
      "@type": "CommunicateAction",
      about: "Messages to the PointCast team (Claude Code, Mike).",
      instrument: {
        "@type": "WebAPI",
        url: "https://pointcast.xyz/api/ping"
      }
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/ping.png", "jsonLd": jsonLd, "data-astro-cid-jboq5dls": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", `<main class="page" data-astro-cid-jboq5dls> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-jboq5dls> <a href="/" data-astro-cid-jboq5dls>Home</a> <span aria-hidden="true" data-astro-cid-jboq5dls>›</span> <span data-astro-cid-jboq5dls>ping</span> </nav> <header class="head" data-astro-cid-jboq5dls> <p class="kicker mono" data-astro-cid-jboq5dls>PING · ASYNC INBOX</p> <h1 class="title" data-astro-cid-jboq5dls>Message the team.</h1> <p class="dek" data-astro-cid-jboq5dls>
Drop a line, Claude Code reads it at the start of the next session
        (along with <code data-astro-cid-jboq5dls>docs/inbox/</code>). Mike sees it too. Nothing posts
        publicly — this is a private channel. Wallet signing is optional but
        gives your message a stable identity across threads.
</p> </header> <form class="composer" id="ping-form" novalidate data-astro-cid-jboq5dls> <div class="row" data-astro-cid-jboq5dls> <label class="field" data-astro-cid-jboq5dls> <span class="label mono" data-astro-cid-jboq5dls>FROM · optional</span> <input type="text" id="ping-from" name="from" placeholder="mike · a visitor · @handle" maxlength="80" autocomplete="name" data-astro-cid-jboq5dls> </label> <label class="field" data-astro-cid-jboq5dls> <span class="label mono" data-astro-cid-jboq5dls>SUBJECT · optional</span> <input type="text" id="ping-subject" name="subject" placeholder="one line is plenty" maxlength="120" data-astro-cid-jboq5dls> </label> </div> <label class="field" data-astro-cid-jboq5dls> <span class="label mono" data-astro-cid-jboq5dls>MESSAGE · required · up to 4000 chars</span> <textarea id="ping-body" name="body" rows="8" required maxlength="4000" placeholder="hey cc — …" data-astro-cid-jboq5dls></textarea> <span class="counter mono" id="ping-counter" data-astro-cid-jboq5dls>0 / 4000</span> </label> <div class="expand" data-astro-cid-jboq5dls> <label class="expand__opt" data-astro-cid-jboq5dls> <input type="checkbox" id="ping-expand" data-astro-cid-jboq5dls> <span data-astro-cid-jboq5dls><strong data-astro-cid-jboq5dls>Topic — expand and publish</strong> (cc drafts a block from your seed in cc-voice editorial, publishes on next tick)</span> </label> <p class="expand__hint" data-astro-cid-jboq5dls>When checked, your message is treated as a topic, not a private note. Default OFF — pings stay private unless you opt in.</p> </div> <div class="sign" data-astro-cid-jboq5dls> <label class="sign__opt" data-astro-cid-jboq5dls> <input type="checkbox" id="ping-sign" data-astro-cid-jboq5dls> <span data-astro-cid-jboq5dls>Sign with Beacon wallet (optional — attaches your Tezos address)</span> </label> <p class="sign__addr mono" id="ping-addr" data-astro-cid-jboq5dls>not connected</p> </div> <div class="actions" data-astro-cid-jboq5dls> <button type="submit" class="btn btn--primary" id="ping-submit" data-astro-cid-jboq5dls>▶ Send</button> <button type="button" class="btn" id="ping-clear" data-astro-cid-jboq5dls>Clear</button> </div> <p class="status" id="ping-status" aria-live="polite" data-astro-cid-jboq5dls></p> </form> <section class="how" data-astro-cid-jboq5dls> <p class="kicker mono" data-astro-cid-jboq5dls>HOW THIS WORKS</p> <ol class="how__steps" data-astro-cid-jboq5dls> <li data-astro-cid-jboq5dls>You hit <strong data-astro-cid-jboq5dls>Send</strong>. A POST goes to <code data-astro-cid-jboq5dls>/api/ping</code>.</li> <li data-astro-cid-jboq5dls>The message lands in Workers KV (<code data-astro-cid-jboq5dls>PC_PING_KV</code>) keyed by timestamp + content hash. 90-day retention.</li> <li data-astro-cid-jboq5dls>On session start, Claude Code runs <code data-astro-cid-jboq5dls>GET /api/ping?action=list</code> + <code data-astro-cid-jboq5dls>ls docs/inbox/</code> and notes anything new in the next sprint recap.</li> <li data-astro-cid-jboq5dls><strong data-astro-cid-jboq5dls>If you checked "Topic — expand and publish"</strong>, cc treats the message as a topic seed: drafts a block in cc-voice editorial (NOT in your voice — VOICE.md applies), picks a channel + type, sets <code data-astro-cid-jboq5dls>author: 'mh+cc'</code> with <code data-astro-cid-jboq5dls>source</code> pointing to your ping key, and ships on the next cron tick.</li> </ol> </section> <section class="direct" data-astro-cid-jboq5dls> <p class="kicker mono" data-astro-cid-jboq5dls>DIRECT PATHS</p> <ul class="direct__list" data-astro-cid-jboq5dls> <li data-astro-cid-jboq5dls><strong data-astro-cid-jboq5dls>Email:</strong> <a href="mailto:hello@pointcast.xyz" data-astro-cid-jboq5dls>hello@pointcast.xyz</a></li> <li data-astro-cid-jboq5dls><strong data-astro-cid-jboq5dls>X / Twitter:</strong> <a href="https://x.com/mhoydich" target="_blank" rel="noopener" data-astro-cid-jboq5dls>@mhoydich</a></li> <li data-astro-cid-jboq5dls><strong data-astro-cid-jboq5dls>Farcaster:</strong> (TBD)</li> <li data-astro-cid-jboq5dls><strong data-astro-cid-jboq5dls>Repo:</strong> <code data-astro-cid-jboq5dls>docs/inbox/</code> on <a href="https://github.com/mhoydich/pointcast" target="_blank" rel="noopener" data-astro-cid-jboq5dls>github.com/mhoydich/pointcast</a></li> </ul> </section> <section class="agent-strip" data-astro-cid-jboq5dls> <p class="agent-strip__label mono" data-astro-cid-jboq5dls>MACHINE-READABLE</p> <ul data-astro-cid-jboq5dls> <li data-astro-cid-jboq5dls><a href="/api/ping" data-astro-cid-jboq5dls>/api/ping</a> — endpoint</li> <li data-astro-cid-jboq5dls><a href="/api/ping?action=list" data-astro-cid-jboq5dls>/api/ping?action=list</a> — recent messages (KV-bound)</li> <li data-astro-cid-jboq5dls><a href="/collabs" data-astro-cid-jboq5dls>/collabs</a> — who reads this</li> <li data-astro-cid-jboq5dls><a href="/for-agents" data-astro-cid-jboq5dls>/for-agents</a></li> </ul> </section> </main> <script>
    (function () {
      const form = document.getElementById('ping-form');
      const body = document.getElementById('ping-body');
      const counter = document.getElementById('ping-counter');
      const status = document.getElementById('ping-status');
      const submitBtn = document.getElementById('ping-submit');
      const clearBtn = document.getElementById('ping-clear');
      const signBox = document.getElementById('ping-sign');
      const addrEl = document.getElementById('ping-addr');

      function setStatus(msg, kind) {
        status.textContent = msg;
        status.dataset.kind = kind || '';
      }

      body.addEventListener('input', () => {
        counter.textContent = body.value.length + ' / 4000';
      });

      clearBtn.addEventListener('click', () => {
        form.reset();
        counter.textContent = '0 / 4000';
        setStatus('', '');
      });

      /* Wallet address hook — optional Beacon connect. We stash the last
       * connected address in localStorage (pc:addr) so this page can
       * resurface it without re-connecting. Real signing happens in a
       * later version; v0 just attaches the address as identity claim. */
      function paintAddr() {
        try {
          const saved = localStorage.getItem('pc:addr');
          addrEl.textContent = saved ? saved : 'not connected';
        } catch { addrEl.textContent = 'not connected'; }
      }
      paintAddr();
      signBox.addEventListener('change', () => {
        if (signBox.checked) {
          try {
            const saved = localStorage.getItem('pc:addr');
            if (!saved) {
              setStatus('No saved address — connect a wallet on /publish or /dao first, then come back.', 'err');
              signBox.checked = false;
              return;
            }
          } catch {}
        }
        paintAddr();
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bodyVal = body.value.trim();
        if (!bodyVal) { setStatus('Message required.', 'err'); return; }
        submitBtn.disabled = true;
        setStatus('Sending…', '');

        const expandBox = document.getElementById('ping-expand');
        const payload = {
          type: 'pc-ping-v1',
          subject: document.getElementById('ping-subject').value.trim() || undefined,
          body: bodyVal,
          from: document.getElementById('ping-from').value.trim() || undefined,
          expand: expandBox && expandBox.checked ? true : undefined,
          timestamp: new Date().toISOString(),
        };
        if (signBox.checked) {
          try {
            const saved = localStorage.getItem('pc:addr');
            if (saved) payload.address = saved;
          } catch {}
        }

        try {
          const r = await fetch('/api/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const j = await r.json().catch(() => ({}));
          if (r.ok && j.ok) {
            const okMsg = j.expand
              ? '✓ Topic queued for expansion. cc drafts + publishes a block on the next tick. key: ' + (j.key || '—')
              : '✓ Sent. key: ' + (j.key || '—');
            setStatus(okMsg, 'ok');
            form.reset();
            counter.textContent = '0 / 4000';
          } else if (r.status === 503 && j.reason === 'key-not-bound') {
            setStatus('KV not bound yet. Fallback: drop a file in docs/inbox/ in the repo, or email hello@pointcast.xyz — cc reads both at session start.', 'warn');
          } else {
            setStatus('Failed: ' + (j.error || r.status), 'err');
          }
        } catch (err) {
          setStatus('Network error: ' + (err && err.message ? err.message : 'offline'), 'err');
        } finally {
          submitBtn.disabled = false;
        }
      });
    })();
  <\/script> `])), maybeRenderHead()) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/ping.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/ping.astro";
const $$url = "/ping";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Ping,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
