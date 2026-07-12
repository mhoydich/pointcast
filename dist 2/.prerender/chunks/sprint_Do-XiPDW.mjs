import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { c as counts, S as SPRINT_BACKLOG } from './sprints_B_I6ZYlg.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Sprint = createComponent(async ($$result, $$props, $$slots) => {
  const c = counts();
  const ready = SPRINT_BACKLOG.filter((s) => s.status === "ready");
  const needsInput = SPRINT_BACKLOG.filter((s) => s.status === "needs-input");
  const done = SPRINT_BACKLOG.filter((s) => s.status === "done").slice(0, 3);
  const title = "Sprint — one-click directives for cc";
  const description = "Pick a sprint. Tap a card → cc executes on the next cron tick. Free-text feedback also accepted. Mobile-first, no login.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "PointCast Sprint Picker",
    description,
    url: "https://pointcast.xyz/sprint"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/sprint.png", "jsonLd": jsonLd, "data-astro-cid-e6toiaoc": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<main class="page" data-astro-cid-e6toiaoc> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-e6toiaoc> <a href="/" data-astro-cid-e6toiaoc>Home</a> <span aria-hidden="true" data-astro-cid-e6toiaoc>›</span> <span data-astro-cid-e6toiaoc>sprint</span> </nav> <header class="head" data-astro-cid-e6toiaoc> <p class="kicker mono" data-astro-cid-e6toiaoc>SPRINT · WHAT SHOULD CC WORK ON NEXT</p> <h1 class="title" data-astro-cid-e6toiaoc>Pick one. cc runs it next tick.</h1> <p class="dek" data-astro-cid-e6toiaoc>\ncc wakes hourly via <code data-astro-cid-e6toiaoc>CronCreate</code> (minute :11). On wake it reads\n        this queue, picks the highest-priority pick, ships it, recaps to\n<code data-astro-cid-e6toiaoc>docs/sprints/</code>, and idles. You can also chat-tick at any time.\n</p> <p class="state mono" data-astro-cid-e6toiaoc> <span class="state__chip" data-astro-cid-e6toiaoc>', ' ready</span> <span class="state__chip state__chip--blocked" data-astro-cid-e6toiaoc>', ' needs input</span> <span class="state__chip state__chip--done" data-astro-cid-e6toiaoc>', ' done</span> </p> </header> <section class="cards" aria-label="Ready sprints" data-astro-cid-e6toiaoc> <p class="section-title mono" data-astro-cid-e6toiaoc>READY · TAP TO PICK</p> <ul class="list" data-astro-cid-e6toiaoc> ', " </ul> </section> ", ` <section class="custom" aria-label="Custom directive" data-astro-cid-e6toiaoc> <p class="section-title mono" data-astro-cid-e6toiaoc>CUSTOM DIRECTIVE · OR FEEDBACK</p> <form id="custom-form" novalidate data-astro-cid-e6toiaoc> <label class="field" data-astro-cid-e6toiaoc> <textarea id="custom-body" rows="3" maxlength="1000" placeholder="anything else cc should pick up — e.g. 'audit blocks 0250-0260', 'add a Mythos block', or just feedback" required data-astro-cid-e6toiaoc></textarea> <span class="counter mono" id="custom-counter" data-astro-cid-e6toiaoc>0 / 1000</span> </label> <div class="actions" data-astro-cid-e6toiaoc> <button type="submit" class="btn btn--primary" id="custom-submit" data-astro-cid-e6toiaoc>▶ SEND DIRECTIVE</button> <button type="button" class="btn" id="custom-clear" data-astro-cid-e6toiaoc>Clear</button> </div> <p class="status" id="custom-status" aria-live="polite" data-astro-cid-e6toiaoc></p> </form> </section> `, ` <section class="agent-strip" data-astro-cid-e6toiaoc> <p class="agent-strip__label mono" data-astro-cid-e6toiaoc>MACHINE-READABLE</p> <ul data-astro-cid-e6toiaoc> <li data-astro-cid-e6toiaoc><a href="/api/queue" data-astro-cid-e6toiaoc>/api/queue</a></li> <li data-astro-cid-e6toiaoc><a href="/api/queue?action=list" data-astro-cid-e6toiaoc>/api/queue?action=list</a></li> <li data-astro-cid-e6toiaoc><a href="/ping" data-astro-cid-e6toiaoc>/ping</a></li> <li data-astro-cid-e6toiaoc><a href="/collabs" data-astro-cid-e6toiaoc>/collabs</a></li> <li data-astro-cid-e6toiaoc><a href="/for-agents" data-astro-cid-e6toiaoc>/for-agents</a></li> </ul> </section> </main> <script>
    (function () {
      function sendPick(payload) {
        return fetch('/api/queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));
      }

      /* ─── Card pick buttons ─── */
      const pickBtns = document.querySelectorAll('.pick-btn');
      pickBtns.forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-sprint-id');
          const tt = btn.getAttribute('data-sprint-title') || id;
          const orig = btn.textContent;
          btn.disabled = true;
          btn.textContent = '⏳ Sending…';
          const res = await sendPick({
            type: 'pc-queue-v1',
            sprintId: id,
            timestamp: new Date().toISOString(),
          });
          if (res.status === 200 && res.body.ok) {
            btn.textContent = '✓ PICKED';
            btn.classList.add('btn--done');
          } else if (res.status === 503 && res.body.reason === 'key-not-bound') {
            btn.textContent = '⚠ KV not bound — see fallback';
            btn.classList.add('btn--warn');
            alert('KV not bound yet. Fallback: drop a file in docs/queue/ in the repo with sprint id "' + id + '". cc reads on session start. — ' + (res.body.fallback || ''));
          } else {
            btn.textContent = '✗ ' + (res.body.error || res.status);
            btn.classList.add('btn--err');
          }
          setTimeout(() => {
            btn.disabled = false;
            btn.textContent = orig;
            btn.classList.remove('btn--done', 'btn--warn', 'btn--err');
          }, 4500);
        });
      });

      /* ─── Custom directive form ─── */
      const form = document.getElementById('custom-form');
      const body = document.getElementById('custom-body');
      const counter = document.getElementById('custom-counter');
      const status = document.getElementById('custom-status');
      const submitBtn = document.getElementById('custom-submit');
      const clearBtn = document.getElementById('custom-clear');

      function setStatus(msg, kind) { status.textContent = msg; status.dataset.kind = kind || ''; }
      body.addEventListener('input', () => { counter.textContent = body.value.length + ' / 1000'; });
      clearBtn.addEventListener('click', () => { form.reset(); counter.textContent = '0 / 1000'; setStatus('', ''); });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = body.value.trim();
        if (!text) { setStatus('Directive required.', 'err'); return; }
        submitBtn.disabled = true;
        setStatus('Sending…', '');
        const res = await sendPick({
          type: 'pc-queue-v1',
          custom: text,
          timestamp: new Date().toISOString(),
        });
        if (res.status === 200 && res.body.ok) {
          setStatus('✓ Sent. key: ' + (res.body.key || '—'), 'ok');
          form.reset();
          counter.textContent = '0 / 1000';
        } else if (res.status === 503 && res.body.reason === 'key-not-bound') {
          setStatus('KV not bound. Fallback: drop a file in docs/queue/{ts}-{slug}.md in the repo. cc reads on session start.', 'warn');
        } else {
          setStatus('Failed: ' + (res.body.error || res.status), 'err');
        }
        submitBtn.disabled = false;
      });
    })();
  <\/script> `])), maybeRenderHead(), c.ready, c["needs-input"], c.done, ready.map((s) => renderTemplate`<li class="card"${addAttribute(s.id, "id")} data-astro-cid-e6toiaoc> <div class="card__head" data-astro-cid-e6toiaoc> <h2 class="card__title" data-astro-cid-e6toiaoc>${s.title}</h2> <span class="card__est mono" data-astro-cid-e6toiaoc>~${s.estMin}m</span> </div> <p class="card__why" data-astro-cid-e6toiaoc>${s.why}</p> <p class="card__output mono" data-astro-cid-e6toiaoc><strong data-astro-cid-e6toiaoc>OUTPUT:</strong> ${s.output}</p> <div class="card__actions" data-astro-cid-e6toiaoc> <button class="btn btn--primary pick-btn" type="button"${addAttribute(s.id, "data-sprint-id")}${addAttribute(s.title, "data-sprint-title")} data-astro-cid-e6toiaoc>▶ PICK THIS</button> <a class="btn btn--ghost"${addAttribute(`#${s.id}`, "href")} data-astro-cid-e6toiaoc>#${s.id}</a> </div> </li>`), needsInput.length > 0 && renderTemplate`<section class="cards" aria-label="Needs-input sprints" data-astro-cid-e6toiaoc> <p class="section-title mono" data-astro-cid-e6toiaoc>NEEDS INPUT · NOT YET PICKABLE</p> <ul class="list" data-astro-cid-e6toiaoc> ${needsInput.map((s) => renderTemplate`<li class="card card--blocked"${addAttribute(s.id, "id")} data-astro-cid-e6toiaoc> <div class="card__head" data-astro-cid-e6toiaoc> <h2 class="card__title" data-astro-cid-e6toiaoc>${s.title}</h2> <span class="card__est mono" data-astro-cid-e6toiaoc>~${s.estMin}m</span> </div> <p class="card__why" data-astro-cid-e6toiaoc>${s.why}</p> ${s.needs && renderTemplate`<p class="card__needs" data-astro-cid-e6toiaoc><strong data-astro-cid-e6toiaoc>Needs:</strong> ${s.needs}</p>`} <p class="card__output mono" data-astro-cid-e6toiaoc><strong data-astro-cid-e6toiaoc>OUTPUT:</strong> ${s.output}</p> <div class="card__actions" data-astro-cid-e6toiaoc> <span class="btn btn--disabled" data-astro-cid-e6toiaoc>⊘ NEEDS INPUT</span> <a class="btn btn--ghost" href="/ping" data-astro-cid-e6toiaoc>→ /ping to send the input</a> </div> </li>`)} </ul> </section>`, done.length > 0 && renderTemplate`<section class="recent" data-astro-cid-e6toiaoc> <p class="section-title mono" data-astro-cid-e6toiaoc>RECENTLY SHIPPED</p> <ul class="recent__list" data-astro-cid-e6toiaoc> ${done.map((s) => renderTemplate`<li class="recent__item" data-astro-cid-e6toiaoc> <span class="recent__title" data-astro-cid-e6toiaoc>${s.title}</span> ${s.shippedAt && renderTemplate`<span class="recent__date mono" data-astro-cid-e6toiaoc>${s.shippedAt.slice(0, 10)}</span>`} ${s.shippedAs && renderTemplate`<span class="recent__ref mono" data-astro-cid-e6toiaoc>${s.shippedAs}</span>`} </li>`)} </ul> </section>`) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sprint.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sprint.astro";
const $$url = "/sprint";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Sprint,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
