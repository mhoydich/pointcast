import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
async function getStaticPaths() {
  const polls = await getCollection("polls", ({ data }) => !data.draft);
  return polls.map((p) => ({ params: { slug: p.data.slug }, props: { poll: p } }));
}
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$slug;
  const { poll } = Astro2.props;
  const d = poll.data;
  const allPolls = await getCollection("polls", ({ data }) => !data.draft);
  const pollBySlug = new Map(allPolls.map((p) => [p.data.slug, p]));
  const followUps = Object.entries(d.followUps ?? {}).flatMap(([optionId, nextSlug]) => {
    const opt = d.options.find((o) => o.id === optionId);
    const next = pollBySlug.get(nextSlug);
    if (!opt || !next) return [];
    return [{
      optionId,
      optionLabel: opt.label,
      nextSlug,
      nextQuestion: next.data.question,
      nextDek: next.data.dek,
      nextOptionCount: next.data.options.length
    }];
  });
  const related = (d.related ?? []).flatMap((slug) => {
    const p = pollBySlug.get(slug);
    return p ? [{
      slug: p.data.slug,
      question: p.data.question,
      dek: p.data.dek,
      optionCount: p.data.options.length,
      zeitgeist: p.data.zeitgeist ?? false
    }] : [];
  });
  const backRefs = [];
  for (const parent of allPolls) {
    if (parent.data.slug === d.slug) continue;
    const fu = parent.data.followUps ?? {};
    for (const [optId, childSlug] of Object.entries(fu)) {
      if (childSlug === d.slug) {
        const opt = parent.data.options.find((o) => o.id === optId);
        backRefs.push({
          parentSlug: parent.data.slug,
          parentQuestion: parent.data.question,
          viaOptionId: optId,
          viaOptionLabel: opt?.label ?? optId
        });
      }
    }
  }
  const title = `Poll · ${d.question}`;
  const description = d.dek || `${d.options.length}-option Schelling-point poll on PointCast. Pick the option you think most other readers will pick.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Question",
    name: d.question,
    text: d.question,
    url: `https://pointcast.xyz/poll/${d.slug}`,
    dateCreated: d.openedAt.toISOString(),
    suggestedAnswer: d.options.map((o) => ({
      "@type": "Answer",
      text: o.label
    }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/polls.png", "jsonLd": jsonLd, "data-astro-cid-kpqwmfeh": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<main class="page" data-astro-cid-kpqwmfeh> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-kpqwmfeh> <a href="/" data-astro-cid-kpqwmfeh>Home</a> <span aria-hidden="true" data-astro-cid-kpqwmfeh>›</span> <a href="/polls" data-astro-cid-kpqwmfeh>polls</a> <span aria-hidden="true" data-astro-cid-kpqwmfeh>›</span> <span data-astro-cid-kpqwmfeh>', "</span> </nav> ", ' <article class="poll"', ' data-astro-cid-kpqwmfeh> <header class="poll__head" data-astro-cid-kpqwmfeh> <p class="kicker mono" data-astro-cid-kpqwmfeh>SCHELLING POINT · ', ' OPTIONS</p> <h1 class="question" data-astro-cid-kpqwmfeh>', "</h1> ", ' </header> <ol class="options" id="poll-options" data-astro-cid-kpqwmfeh> ', ` </ol> <p class="status mono" id="poll-status" data-astro-cid-kpqwmfeh>tap an option to lock in your pick</p> <details class="details" data-astro-cid-kpqwmfeh> <summary data-astro-cid-kpqwmfeh>How is this counted?</summary> <p data-astro-cid-kpqwmfeh>Vote goes to <code data-astro-cid-kpqwmfeh>/api/poll</code> → KV namespace <code data-astro-cid-kpqwmfeh>PC_POLLS_KV</code>. Per-address dedup; anonymous voters dedup by User-Agent + IP fingerprint. After your vote lands, the bar chart shows the live distribution. You can't change your vote without clearing your browser data + connecting from a different IP.</p> </details> <p class="meta mono" data-astro-cid-kpqwmfeh>
opened `, " ", " ", " </p> </article> ", " ", ' <section class="agent-strip" data-astro-cid-kpqwmfeh> <p class="agent-strip__label mono" data-astro-cid-kpqwmfeh>MACHINE-READABLE</p> <ul data-astro-cid-kpqwmfeh> <li data-astro-cid-kpqwmfeh><a', " data-astro-cid-kpqwmfeh>/api/poll?slug=", `</a></li> <li data-astro-cid-kpqwmfeh><a href="/polls" data-astro-cid-kpqwmfeh>/polls</a></li> <li data-astro-cid-kpqwmfeh><a href="/for-agents" data-astro-cid-kpqwmfeh>/for-agents</a></li> </ul> </section> </main> <script>
    (function () {
      const article = document.querySelector('.poll[data-slug]');
      if (!article) return;
      const slug = article.getAttribute('data-slug');
      const status = document.getElementById('poll-status');
      const buttons = Array.from(document.querySelectorAll('.option__btn'));

      // Read cohort tag from URL (?via=kana). Slug-shape the value so
      // pasted marketing UTMs don't get stored as cohort labels.
      const urlParams = new URLSearchParams(window.location.search);
      const rawVia = (urlParams.get('via') || '').toLowerCase().trim();
      const via = /^[a-z0-9][a-z0-9-]{0,40}$/.test(rawVia) ? rawVia : '';

      // Surface cohort context to voters when present — builds trust + reminds
      // them who shared the link.
      if (via) {
        const hint = document.createElement('p');
        hint.className = 'cohort-hint mono';
        hint.textContent = 'INVITED VIA · ' + via.toUpperCase();
        article.insertBefore(hint, article.querySelector('.options'));
      }

      function setStatus(msg, kind) {
        status.textContent = msg;
        status.dataset.kind = kind || '';
      }

      function paintTally(tally, total, votedFor) {
        const safeTotal = Math.max(total || 0, 1);
        // Find max for relative-to-leader bar scaling.
        let max = 0;
        for (const k in tally) if (tally[k] > max) max = tally[k];
        max = Math.max(max, 1);
        buttons.forEach((b) => {
          const id = b.dataset.optionId;
          const count = tally[id] || 0;
          const pct = total ? Math.round((count / total) * 100) : 0;
          const fillWidth = (count / max) * 100;
          b.querySelector('.option__bar-fill').style.width = fillWidth + '%';
          b.querySelector('.option__pct').textContent = pct + '%';
          b.classList.toggle('option--leader', count === max && count > 0);
          b.classList.toggle('option--voted', id === votedFor);
        });
      }

      async function fetchTally(votedFor) {
        try {
          const r = await fetch('/api/poll?slug=' + encodeURIComponent(slug), { cache: 'no-store' });
          const j = await r.json();
          if (j && j.ok) paintTally(j.tally || {}, j.total || 0, votedFor);
        } catch {}
      }

      // Personalized trail: if the viewer voted on a parent poll whose
      // followUps point here, show the breadcrumb linking back.
      (function () {
        var trail = document.getElementById('poll-trail');
        if (!trail) return;
        var links = Array.from(trail.querySelectorAll('[data-parent-slug]'));
        var revealed = false;
        links.forEach(function (link) {
          var parentSlug = link.getAttribute('data-parent-slug');
          var parentOption = link.getAttribute('data-parent-option');
          try {
            var voted = localStorage.getItem('pc:poll:voted:' + parentSlug);
            if (voted === parentOption) {
              link.hidden = false;
              revealed = true;
            }
          } catch (e) {}
        });
        if (revealed) trail.hidden = false;
      })();

      // Reveal the pathway card matching the picked option (if any mapped).
      function revealPathway(optionId) {
        const container = document.getElementById('pathway-cards');
        if (!container) return;
        const card = container.querySelector('[data-for-option="' + optionId + '"]');
        if (!card) return;
        container.hidden = false;
        card.hidden = false;
      }

      const lsKey = 'pc:poll:voted:' + slug;
      const priorVote = (function () { try { return localStorage.getItem(lsKey); } catch { return null; } })();

      if (priorVote) {
        buttons.forEach((b) => { b.disabled = true; b.classList.add('option--locked'); });
        setStatus('your pick: ' + priorVote + ' · live distribution below', 'voted');
        fetchTally(priorVote);
        revealPathway(priorVote);
      } else {
        // Show the current distribution lightly even before voting (helps the
        // Schelling intuition — you can see where momentum is).
        fetchTally(null);
      }

      // JUICE helpers (mirror of PollsOnHome) — chime, vibrate, ripple, XP float
      var actx = null;
      function chime(freq, dur) {
        try {
          if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
          var o = actx.createOscillator(), g = actx.createGain();
          o.type = 'sine'; o.frequency.value = freq || 720;
          g.gain.setValueAtTime(0, actx.currentTime);
          g.gain.linearRampToValueAtTime(0.09, actx.currentTime + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0005, actx.currentTime + (dur || 0.18));
          o.connect(g).connect(actx.destination);
          o.start(); o.stop(actx.currentTime + (dur || 0.18) + 0.05);
        } catch(e) {}
      }
      function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch(e) {} }
      function ripple(btn, ev) {
        try {
          var r = document.createElement('span');
          r.className = 'juice-ripple';
          var rect = btn.getBoundingClientRect();
          var x = ev && ev.clientX ? ev.clientX - rect.left : rect.width / 2;
          var y = ev && ev.clientY ? ev.clientY - rect.top : rect.height / 2;
          r.style.left = x + 'px';
          r.style.top = y + 'px';
          btn.style.position = 'relative';
          btn.style.overflow = 'hidden';
          btn.appendChild(r);
          setTimeout(function() { if (r.parentNode) r.parentNode.removeChild(r); }, 700);
        } catch(e) {}
      }
      function xpFloat(btn, text) {
        try {
          var x = document.createElement('span');
          x.className = 'juice-xp';
          x.textContent = text || '+1 XP';
          var rect = btn.getBoundingClientRect();
          x.style.left = (rect.width / 2) + 'px';
          x.style.top = '0';
          btn.style.position = 'relative';
          btn.appendChild(x);
          setTimeout(function() { if (x.parentNode) x.parentNode.removeChild(x); }, 950);
        } catch(e) {}
      }
      // Mode inference — zeitgeist / forecast / coordination / etc.
      function inferMode() {
        if (document.querySelector('.purpose-chip--zeitgeist')) return 'zeitgeist';
        if (document.querySelector('.purpose-chip--forecast')) return 'forecast';
        return 'coordination';
      }

      buttons.forEach((b) => {
        b.addEventListener('click', async (ev) => {
          if (b.disabled) return;
          const optionId = b.dataset.optionId;
          buttons.forEach((x) => { x.disabled = true; });
          ripple(b, ev);
          chime(720, 0.14);
          buzz(10);
          setStatus('locking in ' + optionId + '…', '');
          try {
            const r = await fetch('/api/poll', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'pc-poll-v1',
                slug: slug,
                optionId: optionId,
                via: via || undefined,
                timestamp: new Date().toISOString(),
              }),
            });
            const j = await r.json();
            if (r.status === 200 && j.ok) {
              try { localStorage.setItem(lsKey, optionId); } catch {}
              xpFloat(b, '+1 XP');
              chime(880, 0.16);
              if (window.pcVoter && window.pcVoter.record) {
                window.pcVoter.record({ slug: slug, mode: inferMode() });
              } else {
                try { window.dispatchEvent(new CustomEvent('pc:voter-updated')); } catch(e) {}
              }
              setStatus('locked: ' + optionId + ' · live distribution below', 'voted');
              fetchTally(optionId);
              revealPathway(optionId);
            } else if (r.status === 409 && j.error === 'already-voted') {
              try { localStorage.setItem(lsKey, j.votedFor); } catch {}
              setStatus('already voted: ' + j.votedFor + ' · live distribution below', 'warn');
              fetchTally(j.votedFor);
              revealPathway(j.votedFor);
            } else if (r.status === 503) {
              setStatus('KV not bound — vote not recorded yet', 'err');
              buttons.forEach((x) => { x.disabled = false; });
            } else {
              setStatus('vote failed: ' + (j.error || r.status), 'err');
              buttons.forEach((x) => { x.disabled = false; });
            }
          } catch (err) {
            setStatus('network error: ' + (err && err.message ? err.message : 'offline'), 'err');
            buttons.forEach((x) => { x.disabled = false; });
          }
        });
      });
    })();
  <\/script> `])), maybeRenderHead(), d.slug, backRefs.length > 0 && renderTemplate`<aside class="trail" id="poll-trail" hidden data-astro-cid-kpqwmfeh> ${backRefs.map((b) => renderTemplate`<a class="trail__link"${addAttribute(`/poll/${b.parentSlug}`, "href")}${addAttribute(b.parentSlug, "data-parent-slug")}${addAttribute(b.viaOptionId, "data-parent-option")} hidden data-astro-cid-kpqwmfeh> <span class="trail__kicker mono" data-astro-cid-kpqwmfeh>← YOU CAME FROM · ${b.viaOptionLabel.split(" · ")[0]}</span> <span class="trail__q" data-astro-cid-kpqwmfeh>${b.parentQuestion}</span> </a>`)} </aside>`, addAttribute(d.slug, "data-slug"), d.options.length, d.question, d.dek && renderTemplate`<p class="dek" data-astro-cid-kpqwmfeh>${d.dek}</p>`, d.options.map((o, i) => renderTemplate`<li class="option" data-astro-cid-kpqwmfeh> <button type="button" class="option__btn"${addAttribute(o.id, "data-option-id")}${addAttribute(d.slug, "data-poll-slug")} data-astro-cid-kpqwmfeh> <span class="option__rank mono" data-astro-cid-kpqwmfeh>${String(i + 1).padStart(2, "0")}</span> <span class="option__label" data-astro-cid-kpqwmfeh> <span class="option__title" data-astro-cid-kpqwmfeh>${o.label}</span> ${o.hint && renderTemplate`<span class="option__hint" data-astro-cid-kpqwmfeh>${o.hint}</span>`} </span> <span class="option__bar" aria-hidden="true" data-astro-cid-kpqwmfeh><span class="option__bar-fill" style="width: 0%" data-astro-cid-kpqwmfeh></span></span> <span class="option__pct mono" data-astro-cid-kpqwmfeh>—</span> </button> </li>`), new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(d.openedAt), d.closesAt ? ` · closes ${new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(d.closesAt)}` : " · open", d.author && d.author !== "cc" ? ` · author: ${d.author}` : "", followUps.length > 0 && renderTemplate`<aside class="pathway" id="pathway-cards" aria-live="polite" hidden data-astro-cid-kpqwmfeh> ${followUps.map((fu) => renderTemplate`<article class="pathway__card"${addAttribute(fu.optionId, "data-for-option")} hidden data-astro-cid-kpqwmfeh> <p class="pathway__kicker mono" data-astro-cid-kpqwmfeh>YOU PICKED · ${fu.optionLabel.split(" · ")[0]}</p> <h2 class="pathway__q" data-astro-cid-kpqwmfeh>${fu.nextQuestion}</h2> ${fu.nextDek && renderTemplate`<p class="pathway__dek" data-astro-cid-kpqwmfeh>${fu.nextDek}</p>`} <a class="pathway__cta mono"${addAttribute(`/poll/${fu.nextSlug}`, "href")} data-astro-cid-kpqwmfeh>
continue → ${fu.nextOptionCount} options
</a> </article>`)} </aside>`, related.length > 0 && renderTemplate`<section class="related" data-astro-cid-kpqwmfeh> <p class="related__label mono" data-astro-cid-kpqwmfeh>OTHER WAYS IN</p> <ul class="related__list" data-astro-cid-kpqwmfeh> ${related.map((r) => renderTemplate`<li data-astro-cid-kpqwmfeh> <a class="related__card"${addAttribute(`/poll/${r.slug}`, "href")} data-astro-cid-kpqwmfeh> <span class="related__q" data-astro-cid-kpqwmfeh>${r.question}</span> ${r.dek && renderTemplate`<span class="related__dek" data-astro-cid-kpqwmfeh>${r.dek}</span>`} <span class="related__meta mono" data-astro-cid-kpqwmfeh> ${r.zeitgeist ? "ZEITGEIST · " : ""}${r.optionCount} OPTIONS
</span> </a> </li>`)} </ul> </section>`, addAttribute(`/api/poll?slug=${d.slug}`, "href"), d.slug) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/poll/[slug].astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/poll/[slug].astro";
const $$url = "/poll/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
