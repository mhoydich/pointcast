import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, d as defineScriptVars, b as addAttribute, m as maybeRenderHead, r as renderComponent } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$BlockCard } from './BlockCard_BfWFl5A7.mjs';
import { $ as $$MintButton } from './MintButton_BMx003SY.mjs';
import 'clsx';
import { $ as $$ShareThis } from './ShareThis_CLgipRxL.mjs';
import { $ as $$NativePlantingYield } from './NativePlantingYield_2uQExJY3.mjs';
import { $ as $$BuddhaHeadRotator } from './BuddhaHeadRotator_CrqbxwyL.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

var __freeze$1 = Object.freeze;
var __defProp$1 = Object.defineProperty;
var __template$1 = (cooked, raw) => __freeze$1(__defProp$1(cooked, "raw", { value: __freeze$1(raw || cooked.slice()) }));
var _a$1;
const $$BirthdayCelebrate = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$BirthdayCelebrate;
  const { blockId, recipientName } = Astro2.props;
  return renderTemplate(_a$1 || (_a$1 = __template$1(["", '<section class="bcel"', ' aria-label="Celebrate this birthday" data-astro-cid-wpifw2ff> <header class="bcel__header" data-astro-cid-wpifw2ff> <p class="bcel__kicker mono" data-astro-cid-wpifw2ff>★ CELEBRATE · GUESTBOOK</p> <p class="bcel__lede" data-astro-cid-wpifw2ff>\nDrop confetti for <strong data-astro-cid-wpifw2ff>', '</strong>. One celebration per\n      visitor — yours stays on the block forever.\n</p> </header> <button type="button" class="bcel__btn mono"', ' data-astro-cid-wpifw2ff>\n🎉 CELEBRATE →\n</button> <form class="bcel__form"', ' hidden novalidate data-astro-cid-wpifw2ff> <div class="bcel__field" data-astro-cid-wpifw2ff> <label', ' class="bcel__label mono" data-astro-cid-wpifw2ff>YOUR NAME *</label> <input', ' name="handle" type="text" required minlength="1" maxlength="40" placeholder="anyone — first name, handle, or initials" autocomplete="given-name" data-astro-cid-wpifw2ff> </div> <div class="bcel__field" data-astro-cid-wpifw2ff> <label', ' class="bcel__label mono" data-astro-cid-wpifw2ff>MESSAGE · OPTIONAL</label> <input', ' name="message" type="text" maxlength="200" placeholder="happy birthday!" data-astro-cid-wpifw2ff> </div> <div class="bcel__actions" data-astro-cid-wpifw2ff> <button type="submit" class="bcel__submit mono" data-astro-cid-wpifw2ff>DROP CONFETTI →</button> <button type="button" class="bcel__cancel mono" data-cancel data-astro-cid-wpifw2ff>cancel</button> </div> <p class="bcel__status mono" role="status" aria-live="polite" data-astro-cid-wpifw2ff></p> </form> <div class="bcel__guestbook" aria-live="polite" data-astro-cid-wpifw2ff> <p class="bcel__count mono"', ' data-astro-cid-wpifw2ff>· loading guestbook…</p> <ol class="bcel__list"', " data-astro-cid-wpifw2ff></ol> </div> </section> <script>(function(){", "\n  (() => {\n    const trigger = document.getElementById(`bcel-trigger-${blockId}`);\n    const form = document.getElementById(`bcel-form-${blockId}`);\n    const handleInput = document.getElementById(`bcel-handle-${blockId}`);\n    const messageInput = document.getElementById(`bcel-message-${blockId}`);\n    const status = form?.querySelector('.bcel__status');\n    const submit = form?.querySelector('.bcel__submit');\n    const cancel = form?.querySelector('[data-cancel]');\n    const countEl = document.getElementById(`bcel-count-${blockId}`);\n    const listEl = document.getElementById(`bcel-list-${blockId}`);\n\n    if (!trigger || !form || !handleInput || !submit || !countEl || !listEl) return;\n\n    trigger.addEventListener('click', () => {\n      form.hidden = false;\n      trigger.style.display = 'none';\n      handleInput.focus();\n    });\n\n    cancel?.addEventListener('click', () => {\n      form.hidden = true;\n      trigger.style.display = '';\n    });\n\n    form.addEventListener('submit', async (e) => {\n      e.preventDefault();\n      if (status) { status.textContent = 'sending…'; status.className = 'bcel__status mono'; }\n\n      const handle = handleInput.value.trim();\n      const message = (messageInput?.value || '').trim();\n      if (!handle) {\n        if (status) { status.textContent = '✗ name required'; status.className = 'bcel__status mono bcel__status--bad'; }\n        return;\n      }\n\n      submit.disabled = true;\n      const orig = submit.textContent;\n      submit.textContent = 'DROPPING…';\n\n      try {\n        const res = await fetch('/api/cake/celebrate', {\n          method: 'POST',\n          headers: { 'Content-Type': 'application/json' },\n          body: JSON.stringify({\n            type: 'pc-cake-celebrate-v1',\n            blockId,\n            handle,\n            message: message || undefined,\n            timestamp: new Date().toISOString(),\n          }),\n        });\n        const j = await res.json();\n        if (j.ok) {\n          if (status) { status.textContent = '✓ added — see your signature below'; status.className = 'bcel__status mono bcel__status--good'; }\n          burst();\n          await loadGuestbook();\n          form.hidden = true;\n          trigger.textContent = '✓ CELEBRATED';\n          trigger.disabled = true;\n          trigger.style.display = '';\n        } else if (j.error === 'already-celebrated') {\n          if (status) { status.textContent = `· you already celebrated this block (as ${j.priorHandle})`; status.className = 'bcel__status mono bcel__status--soft'; }\n          submit.disabled = false;\n          submit.textContent = orig;\n        } else if (j.reason === 'kv-unbound') {\n          if (status) { status.textContent = '· guestbook coming soon (KV unbound)'; status.className = 'bcel__status mono bcel__status--soft'; }\n          submit.disabled = false;\n          submit.textContent = orig;\n        } else {\n          if (status) { status.textContent = '✗ ' + (j.error || 'unknown error'); status.className = 'bcel__status mono bcel__status--bad'; }\n          submit.disabled = false;\n          submit.textContent = orig;\n        }\n      } catch (err) {\n        if (status) { status.textContent = '✗ network error — try again'; status.className = 'bcel__status mono bcel__status--bad'; }\n        submit.disabled = false;\n        submit.textContent = orig;\n      }\n    });\n\n    async function loadGuestbook() {\n      try {\n        const res = await fetch(`/api/cake/celebrate?blockId=${blockId}`);\n        const j = await res.json();\n        if (!j.ok) {\n          if (j.reason === 'kv-unbound') {\n            countEl.textContent = '· guestbook coming soon';\n            return;\n          }\n          countEl.textContent = '· guestbook unavailable';\n          return;\n        }\n        const n = j.count || 0;\n        countEl.textContent = n === 0\n          ? '· no celebrations yet — be the first'\n          : `· ${n} ${n === 1 ? 'celebration' : 'celebrations'}`;\n        listEl.innerHTML = '';\n        for (const e of j.entries || []) {\n          const li = document.createElement('li');\n          li.className = 'bcel__entry';\n          const ts = new Date(e.at);\n          const tsStr = isFinite(+ts) ? ts.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';\n          li.innerHTML = `\n            <span class=\"bcel__entry-handle\">${escapeHtml(e.handle)}</span>\n            ${e.message ? `<span class=\"bcel__entry-msg\">\"${escapeHtml(e.message)}\"</span>` : ''}\n            <span class=\"bcel__entry-ts mono\">${escapeHtml(tsStr)}</span>\n          `;\n          listEl.appendChild(li);\n        }\n      } catch {\n        countEl.textContent = '· guestbook unavailable (offline?)';\n      }\n    }\n\n    function escapeHtml(s) {\n      return String(s).replace(/[&<>\"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', \"'\": '&#39;' }[c]));\n    }\n\n    function burst() {\n      const overlay = document.createElement('div');\n      overlay.className = 'confetti-overlay';\n      document.body.appendChild(overlay);\n      const colors = ['#D86440', '#8E3F25', '#FCEEE8', '#185FA5', '#3B6D11', '#993556', '#BA7517', '#534AB7'];\n      for (let i = 0; i < 90; i++) {\n        const p = document.createElement('span');\n        p.className = 'confetti-particle';\n        const left = Math.random() * 100;\n        const dx = (Math.random() - 0.5) * 240;\n        const rot = Math.random() * 720;\n        const dur = 1500 + Math.random() * 1800;\n        const delay = Math.random() * 250;\n        p.style.left = left + '%';\n        p.style.background = colors[i % colors.length];\n        p.style.setProperty('--dx', dx + 'px');\n        p.style.setProperty('--rot', rot + 'deg');\n        p.style.animationDuration = dur + 'ms';\n        p.style.animationDelay = delay + 'ms';\n        overlay.appendChild(p);\n      }\n      setTimeout(() => overlay.remove(), 4500);\n    }\n\n    // Load on mount.\n    loadGuestbook();\n  })();\n})();<\/script> "], ["", '<section class="bcel"', ' aria-label="Celebrate this birthday" data-astro-cid-wpifw2ff> <header class="bcel__header" data-astro-cid-wpifw2ff> <p class="bcel__kicker mono" data-astro-cid-wpifw2ff>★ CELEBRATE · GUESTBOOK</p> <p class="bcel__lede" data-astro-cid-wpifw2ff>\nDrop confetti for <strong data-astro-cid-wpifw2ff>', '</strong>. One celebration per\n      visitor — yours stays on the block forever.\n</p> </header> <button type="button" class="bcel__btn mono"', ' data-astro-cid-wpifw2ff>\n🎉 CELEBRATE →\n</button> <form class="bcel__form"', ' hidden novalidate data-astro-cid-wpifw2ff> <div class="bcel__field" data-astro-cid-wpifw2ff> <label', ' class="bcel__label mono" data-astro-cid-wpifw2ff>YOUR NAME *</label> <input', ' name="handle" type="text" required minlength="1" maxlength="40" placeholder="anyone — first name, handle, or initials" autocomplete="given-name" data-astro-cid-wpifw2ff> </div> <div class="bcel__field" data-astro-cid-wpifw2ff> <label', ' class="bcel__label mono" data-astro-cid-wpifw2ff>MESSAGE · OPTIONAL</label> <input', ' name="message" type="text" maxlength="200" placeholder="happy birthday!" data-astro-cid-wpifw2ff> </div> <div class="bcel__actions" data-astro-cid-wpifw2ff> <button type="submit" class="bcel__submit mono" data-astro-cid-wpifw2ff>DROP CONFETTI →</button> <button type="button" class="bcel__cancel mono" data-cancel data-astro-cid-wpifw2ff>cancel</button> </div> <p class="bcel__status mono" role="status" aria-live="polite" data-astro-cid-wpifw2ff></p> </form> <div class="bcel__guestbook" aria-live="polite" data-astro-cid-wpifw2ff> <p class="bcel__count mono"', ' data-astro-cid-wpifw2ff>· loading guestbook…</p> <ol class="bcel__list"', " data-astro-cid-wpifw2ff></ol> </div> </section> <script>(function(){", "\n  (() => {\n    const trigger = document.getElementById(\\`bcel-trigger-\\${blockId}\\`);\n    const form = document.getElementById(\\`bcel-form-\\${blockId}\\`);\n    const handleInput = document.getElementById(\\`bcel-handle-\\${blockId}\\`);\n    const messageInput = document.getElementById(\\`bcel-message-\\${blockId}\\`);\n    const status = form?.querySelector('.bcel__status');\n    const submit = form?.querySelector('.bcel__submit');\n    const cancel = form?.querySelector('[data-cancel]');\n    const countEl = document.getElementById(\\`bcel-count-\\${blockId}\\`);\n    const listEl = document.getElementById(\\`bcel-list-\\${blockId}\\`);\n\n    if (!trigger || !form || !handleInput || !submit || !countEl || !listEl) return;\n\n    trigger.addEventListener('click', () => {\n      form.hidden = false;\n      trigger.style.display = 'none';\n      handleInput.focus();\n    });\n\n    cancel?.addEventListener('click', () => {\n      form.hidden = true;\n      trigger.style.display = '';\n    });\n\n    form.addEventListener('submit', async (e) => {\n      e.preventDefault();\n      if (status) { status.textContent = 'sending…'; status.className = 'bcel__status mono'; }\n\n      const handle = handleInput.value.trim();\n      const message = (messageInput?.value || '').trim();\n      if (!handle) {\n        if (status) { status.textContent = '✗ name required'; status.className = 'bcel__status mono bcel__status--bad'; }\n        return;\n      }\n\n      submit.disabled = true;\n      const orig = submit.textContent;\n      submit.textContent = 'DROPPING…';\n\n      try {\n        const res = await fetch('/api/cake/celebrate', {\n          method: 'POST',\n          headers: { 'Content-Type': 'application/json' },\n          body: JSON.stringify({\n            type: 'pc-cake-celebrate-v1',\n            blockId,\n            handle,\n            message: message || undefined,\n            timestamp: new Date().toISOString(),\n          }),\n        });\n        const j = await res.json();\n        if (j.ok) {\n          if (status) { status.textContent = '✓ added — see your signature below'; status.className = 'bcel__status mono bcel__status--good'; }\n          burst();\n          await loadGuestbook();\n          form.hidden = true;\n          trigger.textContent = '✓ CELEBRATED';\n          trigger.disabled = true;\n          trigger.style.display = '';\n        } else if (j.error === 'already-celebrated') {\n          if (status) { status.textContent = \\`· you already celebrated this block (as \\${j.priorHandle})\\`; status.className = 'bcel__status mono bcel__status--soft'; }\n          submit.disabled = false;\n          submit.textContent = orig;\n        } else if (j.reason === 'kv-unbound') {\n          if (status) { status.textContent = '· guestbook coming soon (KV unbound)'; status.className = 'bcel__status mono bcel__status--soft'; }\n          submit.disabled = false;\n          submit.textContent = orig;\n        } else {\n          if (status) { status.textContent = '✗ ' + (j.error || 'unknown error'); status.className = 'bcel__status mono bcel__status--bad'; }\n          submit.disabled = false;\n          submit.textContent = orig;\n        }\n      } catch (err) {\n        if (status) { status.textContent = '✗ network error — try again'; status.className = 'bcel__status mono bcel__status--bad'; }\n        submit.disabled = false;\n        submit.textContent = orig;\n      }\n    });\n\n    async function loadGuestbook() {\n      try {\n        const res = await fetch(\\`/api/cake/celebrate?blockId=\\${blockId}\\`);\n        const j = await res.json();\n        if (!j.ok) {\n          if (j.reason === 'kv-unbound') {\n            countEl.textContent = '· guestbook coming soon';\n            return;\n          }\n          countEl.textContent = '· guestbook unavailable';\n          return;\n        }\n        const n = j.count || 0;\n        countEl.textContent = n === 0\n          ? '· no celebrations yet — be the first'\n          : \\`· \\${n} \\${n === 1 ? 'celebration' : 'celebrations'}\\`;\n        listEl.innerHTML = '';\n        for (const e of j.entries || []) {\n          const li = document.createElement('li');\n          li.className = 'bcel__entry';\n          const ts = new Date(e.at);\n          const tsStr = isFinite(+ts) ? ts.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';\n          li.innerHTML = \\`\n            <span class=\"bcel__entry-handle\">\\${escapeHtml(e.handle)}</span>\n            \\${e.message ? \\`<span class=\"bcel__entry-msg\">\"\\${escapeHtml(e.message)}\"</span>\\` : ''}\n            <span class=\"bcel__entry-ts mono\">\\${escapeHtml(tsStr)}</span>\n          \\`;\n          listEl.appendChild(li);\n        }\n      } catch {\n        countEl.textContent = '· guestbook unavailable (offline?)';\n      }\n    }\n\n    function escapeHtml(s) {\n      return String(s).replace(/[&<>\"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', \"'\": '&#39;' }[c]));\n    }\n\n    function burst() {\n      const overlay = document.createElement('div');\n      overlay.className = 'confetti-overlay';\n      document.body.appendChild(overlay);\n      const colors = ['#D86440', '#8E3F25', '#FCEEE8', '#185FA5', '#3B6D11', '#993556', '#BA7517', '#534AB7'];\n      for (let i = 0; i < 90; i++) {\n        const p = document.createElement('span');\n        p.className = 'confetti-particle';\n        const left = Math.random() * 100;\n        const dx = (Math.random() - 0.5) * 240;\n        const rot = Math.random() * 720;\n        const dur = 1500 + Math.random() * 1800;\n        const delay = Math.random() * 250;\n        p.style.left = left + '%';\n        p.style.background = colors[i % colors.length];\n        p.style.setProperty('--dx', dx + 'px');\n        p.style.setProperty('--rot', rot + 'deg');\n        p.style.animationDuration = dur + 'ms';\n        p.style.animationDelay = delay + 'ms';\n        overlay.appendChild(p);\n      }\n      setTimeout(() => overlay.remove(), 4500);\n    }\n\n    // Load on mount.\n    loadGuestbook();\n  })();\n})();<\/script> "])), maybeRenderHead(), addAttribute(blockId, "data-block-id"), recipientName ?? "this birthday", addAttribute(`bcel-trigger-${blockId}`, "id"), addAttribute(`bcel-form-${blockId}`, "id"), addAttribute(`bcel-handle-${blockId}`, "for"), addAttribute(`bcel-handle-${blockId}`, "id"), addAttribute(`bcel-message-${blockId}`, "for"), addAttribute(`bcel-message-${blockId}`, "id"), addAttribute(`bcel-count-${blockId}`, "id"), addAttribute(`bcel-list-${blockId}`, "id"), defineScriptVars({ blockId }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/BirthdayCelebrate.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$FeedbackStrip = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$FeedbackStrip;
  const { blockId } = Astro2.props;
  return renderTemplate(_a || (_a = __template(["", '<aside class="fb"', ` aria-label="Per-block feedback" data-astro-cid-rr7kcvtq> <p class="fb__kicker mono" data-astro-cid-rr7kcvtq> <span class="fb__label" data-astro-cid-rr7kcvtq>FEEDBACK · PRIVATE TO MIKE</span> <span class="fb__sub" data-astro-cid-rr7kcvtq>· one tap, optional line</span> </p> <div class="fb__row" role="group" aria-label="Reaction" data-astro-cid-rr7kcvtq> <button type="button" class="fb__btn" data-fb-mood="loving" aria-label="This resonated" data-astro-cid-rr7kcvtq> <span class="fb__glyph" data-astro-cid-rr7kcvtq>✓</span> <span class="fb__word" data-astro-cid-rr7kcvtq>RESONATED</span> </button> <button type="button" class="fb__btn" data-fb-mood="confused" aria-label="I'm confused" data-astro-cid-rr7kcvtq> <span class="fb__glyph" data-astro-cid-rr7kcvtq>?</span> <span class="fb__word" data-astro-cid-rr7kcvtq>CONFUSED</span> </button> <button type="button" class="fb__btn" data-fb-mood="annoyed" aria-label="This missed" data-astro-cid-rr7kcvtq> <span class="fb__glyph" data-astro-cid-rr7kcvtq>✗</span> <span class="fb__word" data-astro-cid-rr7kcvtq>MISSED</span> </button> </div> <details class="fb__more" data-astro-cid-rr7kcvtq> <summary class="fb__more-summary mono" data-astro-cid-rr7kcvtq>+ add a line (optional)</summary> <div class="fb__more-body" data-astro-cid-rr7kcvtq> <input type="text" class="fb__input"`, ' placeholder="one line of texture — up to 280 chars" maxlength="280" aria-label="Optional one-line comment" data-astro-cid-rr7kcvtq> <button type="button" class="fb__btn fb__btn--send" data-fb-send data-astro-cid-rr7kcvtq>\nSEND\n</button> </div> </details> <p class="fb__status mono" data-fb-status aria-live="polite" data-astro-cid-rr7kcvtq></p> </aside> <script>(function(){', `
  (function () {
    var root = document.querySelector('.fb[data-block-id="' + blockId + '"]');
    if (!root) return;
    var status = root.querySelector('[data-fb-status]');
    var buttons = Array.from(root.querySelectorAll('.fb__btn[data-fb-mood]'));
    var sendBtn = root.querySelector('[data-fb-send]');
    var input = root.querySelector('.fb__input');
    var lsKey = 'pc:fb:' + blockId;

    function setStatus(msg, kind) {
      if (!status) return;
      status.textContent = msg;
      status.dataset.kind = kind || '';
    }

    // If user already gave feedback on this block in this browser, soften the UI.
    (function paintPrior() {
      try {
        var prior = localStorage.getItem(lsKey);
        if (!prior) return;
        buttons.forEach(function (b) {
          if (b.getAttribute('data-fb-mood') === prior) {
            b.classList.add('fb__btn--voted');
          }
        });
        setStatus('you reacted: ' + prior + ' · tap again to update', 'prior');
      } catch (e) {}
    })();

    function post(mood, message) {
      setStatus('sending…', '');
      return fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: mood || undefined,
          message: message || undefined,
          blockId: blockId,
          path: location.pathname,
        }),
      })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }).then(function (j) { return { ok: r.ok && j.ok, status: r.status, body: j }; }); })
        .catch(function () { return { ok: false, status: 0, body: null }; });
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var mood = b.getAttribute('data-fb-mood');
        buttons.forEach(function (x) { x.classList.remove('fb__btn--voted'); });
        b.classList.add('fb__btn--voted');
        post(mood, '').then(function (res) {
          if (res.ok) {
            try { localStorage.setItem(lsKey, mood); } catch (e) {}
            setStatus('✓ thanks · private to Mike', 'ok');
          } else if (res.status === 429) {
            setStatus('rate-limited · give it a minute', 'warn');
          } else {
            setStatus('couldn\\'t send · try again', 'err');
          }
        });
      });
    });

    if (sendBtn) {
      sendBtn.addEventListener('click', function () {
        var msg = input && input.value.trim();
        if (!msg) { setStatus('type a line first', 'warn'); return; }
        // Find current mood (last clicked or prior) if any
        var mood = '';
        for (var i = 0; i < buttons.length; i++) {
          if (buttons[i].classList.contains('fb__btn--voted')) {
            mood = buttons[i].getAttribute('data-fb-mood') || '';
            break;
          }
        }
        post(mood, msg).then(function (res) {
          if (res.ok) {
            if (input) input.value = '';
            setStatus('✓ line sent · private to Mike', 'ok');
          } else if (res.status === 429) {
            setStatus('rate-limited · give it a minute', 'warn');
          } else {
            setStatus('couldn\\'t send · try again', 'err');
          }
        });
      });
    }
  })();
})();<\/script>`], ["", '<aside class="fb"', ` aria-label="Per-block feedback" data-astro-cid-rr7kcvtq> <p class="fb__kicker mono" data-astro-cid-rr7kcvtq> <span class="fb__label" data-astro-cid-rr7kcvtq>FEEDBACK · PRIVATE TO MIKE</span> <span class="fb__sub" data-astro-cid-rr7kcvtq>· one tap, optional line</span> </p> <div class="fb__row" role="group" aria-label="Reaction" data-astro-cid-rr7kcvtq> <button type="button" class="fb__btn" data-fb-mood="loving" aria-label="This resonated" data-astro-cid-rr7kcvtq> <span class="fb__glyph" data-astro-cid-rr7kcvtq>✓</span> <span class="fb__word" data-astro-cid-rr7kcvtq>RESONATED</span> </button> <button type="button" class="fb__btn" data-fb-mood="confused" aria-label="I'm confused" data-astro-cid-rr7kcvtq> <span class="fb__glyph" data-astro-cid-rr7kcvtq>?</span> <span class="fb__word" data-astro-cid-rr7kcvtq>CONFUSED</span> </button> <button type="button" class="fb__btn" data-fb-mood="annoyed" aria-label="This missed" data-astro-cid-rr7kcvtq> <span class="fb__glyph" data-astro-cid-rr7kcvtq>✗</span> <span class="fb__word" data-astro-cid-rr7kcvtq>MISSED</span> </button> </div> <details class="fb__more" data-astro-cid-rr7kcvtq> <summary class="fb__more-summary mono" data-astro-cid-rr7kcvtq>+ add a line (optional)</summary> <div class="fb__more-body" data-astro-cid-rr7kcvtq> <input type="text" class="fb__input"`, ' placeholder="one line of texture — up to 280 chars" maxlength="280" aria-label="Optional one-line comment" data-astro-cid-rr7kcvtq> <button type="button" class="fb__btn fb__btn--send" data-fb-send data-astro-cid-rr7kcvtq>\nSEND\n</button> </div> </details> <p class="fb__status mono" data-fb-status aria-live="polite" data-astro-cid-rr7kcvtq></p> </aside> <script>(function(){', `
  (function () {
    var root = document.querySelector('.fb[data-block-id="' + blockId + '"]');
    if (!root) return;
    var status = root.querySelector('[data-fb-status]');
    var buttons = Array.from(root.querySelectorAll('.fb__btn[data-fb-mood]'));
    var sendBtn = root.querySelector('[data-fb-send]');
    var input = root.querySelector('.fb__input');
    var lsKey = 'pc:fb:' + blockId;

    function setStatus(msg, kind) {
      if (!status) return;
      status.textContent = msg;
      status.dataset.kind = kind || '';
    }

    // If user already gave feedback on this block in this browser, soften the UI.
    (function paintPrior() {
      try {
        var prior = localStorage.getItem(lsKey);
        if (!prior) return;
        buttons.forEach(function (b) {
          if (b.getAttribute('data-fb-mood') === prior) {
            b.classList.add('fb__btn--voted');
          }
        });
        setStatus('you reacted: ' + prior + ' · tap again to update', 'prior');
      } catch (e) {}
    })();

    function post(mood, message) {
      setStatus('sending…', '');
      return fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: mood || undefined,
          message: message || undefined,
          blockId: blockId,
          path: location.pathname,
        }),
      })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }).then(function (j) { return { ok: r.ok && j.ok, status: r.status, body: j }; }); })
        .catch(function () { return { ok: false, status: 0, body: null }; });
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var mood = b.getAttribute('data-fb-mood');
        buttons.forEach(function (x) { x.classList.remove('fb__btn--voted'); });
        b.classList.add('fb__btn--voted');
        post(mood, '').then(function (res) {
          if (res.ok) {
            try { localStorage.setItem(lsKey, mood); } catch (e) {}
            setStatus('✓ thanks · private to Mike', 'ok');
          } else if (res.status === 429) {
            setStatus('rate-limited · give it a minute', 'warn');
          } else {
            setStatus('couldn\\\\'t send · try again', 'err');
          }
        });
      });
    });

    if (sendBtn) {
      sendBtn.addEventListener('click', function () {
        var msg = input && input.value.trim();
        if (!msg) { setStatus('type a line first', 'warn'); return; }
        // Find current mood (last clicked or prior) if any
        var mood = '';
        for (var i = 0; i < buttons.length; i++) {
          if (buttons[i].classList.contains('fb__btn--voted')) {
            mood = buttons[i].getAttribute('data-fb-mood') || '';
            break;
          }
        }
        post(mood, msg).then(function (res) {
          if (res.ok) {
            if (input) input.value = '';
            setStatus('✓ line sent · private to Mike', 'ok');
          } else if (res.status === 429) {
            setStatus('rate-limited · give it a minute', 'warn');
          } else {
            setStatus('couldn\\\\'t send · try again', 'err');
          }
        });
      });
    }
  })();
})();<\/script>`])), maybeRenderHead(), addAttribute(blockId, "data-block-id"), addAttribute(`fb-msg-${blockId}`, "id"), defineScriptVars({ blockId }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/FeedbackStrip.astro", void 0);

async function getStaticPaths() {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  return blocks.map((block, idx) => ({
    params: { id: block.data.id },
    props: {
      block,
      // Adjacent blocks in reverse-chronological order — "prev" = next older
      // (scroll forward in the feed), "next" = next newer (scroll backward).
      // Naming matches the /b/[id] visitor's mental model: "next block" is
      // the one that was published more recently.
      prev: blocks[idx + 1] ?? null,
      next: blocks[idx - 1] ?? null,
      // Up to 4 related blocks from the same channel, excluding self.
      related: blocks.filter((b, i) => i !== idx && b.data.channel === block.data.channel).slice(0, 4)
    }
  }));
}
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$id;
  const { block, prev, next, related } = Astro2.props;
  const ch = CHANNELS[block.data.channel];
  function shortTitle(t, max = 40) {
    return t.length > max ? t.slice(0, max - 1) + "…" : t;
  }
  const title = `CH.${ch.code} · ${block.data.id} — ${block.data.title}`;
  const description = block.data.dek ?? block.data.body?.slice(0, 180) ?? block.data.title;
  const ogImage = `/images/og/b/${block.data.id}.png`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `https://pointcast.xyz/b/${block.data.id}`,
        identifier: block.data.id,
        name: block.data.title,
        description,
        datePublished: block.data.timestamp.toISOString(),
        inLanguage: "en-US",
        isPartOf: {
          "@type": "Collection",
          name: ch.name,
          url: `https://pointcast.xyz/c/${ch.slug}`
        },
        encodingFormat: "application/json",
        ...block.data.external?.url ? { mainEntity: { "@type": "URL", url: block.data.external.url } } : {},
        ...block.data.edition ? { offers: { "@type": "Offer", price: block.data.edition.price === "free" ? 0 : block.data.edition.price?.tez, priceCurrency: "XTZ" } } : {}
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://pointcast.xyz/b/${block.data.id}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://pointcast.xyz/" },
          { "@type": "ListItem", position: 2, name: `CH.${ch.code} · ${ch.name}`, item: `https://pointcast.xyz/c/${ch.slug}` },
          { "@type": "ListItem", position: 3, name: `№ ${block.data.id}`, item: `https://pointcast.xyz/b/${block.data.id}` }
        ]
      }
    ]
  };
  const alternates = [
    { type: "application/json", href: `/b/${block.data.id}.json`, title: "Machine-readable block" },
    { type: "application/json", href: `/c/${ch.slug}.json`, title: `${ch.name} (JSON feed)` },
    { type: "application/rss+xml", href: `/c/${ch.slug}.rss`, title: `${ch.name} (RSS)` }
  ];
  if (block.data.id === "0331") {
    alternates.push({
      type: "application/json",
      href: "/nature-yield.json",
      title: "Native planting value system (JSON)"
    });
  }
  const frameButtons = [
    { label: "Open on PointCast", action: "link", target: `https://pointcast.xyz/b/${block.data.id}` }
  ];
  if ((block.data.type === "MINT" || block.data.type === "FAUCET") && block.data.edition?.contract?.startsWith("KT1") && block.data.edition?.marketplace === "objkt") {
    frameButtons.push({
      label: "View on objkt",
      action: "link",
      target: `https://objkt.com/tokens/${block.data.edition.contract}/${block.data.edition.tokenId}`
    });
  }
  if (block.data.external?.url) {
    const pretty = (() => {
      try {
        return new URL(block.data.external.url, "https://pointcast.xyz").host.replace(/^www\./, "");
      } catch {
        return "";
      }
    })();
    if (pretty && pretty !== "pointcast.xyz" && frameButtons.length < 4) {
      frameButtons.push({
        label: `→ ${pretty}`,
        action: "link",
        target: block.data.external.url
      });
    }
  }
  const frame = {
    image: `https://pointcast.xyz/images/og/b/${block.data.id}.png`,
    aspectRatio: "1.91:1",
    buttons: frameButtons
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": ogImage, "jsonLd": jsonLd, "alternates": alternates, "frame": frame, "data-astro-cid-gu7yyn7r": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-gu7yyn7r> <h1 class="sr-only" data-astro-cid-gu7yyn7r>CH.${ch.code} · Block № ${block.data.id} — ${block.data.title}</h1> <nav class="breadcrumb" aria-label="Breadcrumb" data-astro-cid-gu7yyn7r> <a href="/" data-astro-cid-gu7yyn7r>← All blocks</a> <span aria-hidden="true" data-astro-cid-gu7yyn7r>/</span> <a${addAttribute(`/c/${ch.slug}`, "href")}${addAttribute(`color: ${ch.color800}`, "style")} data-astro-cid-gu7yyn7r>CH.${ch.code} · ${ch.name}</a> <span aria-hidden="true" data-astro-cid-gu7yyn7r>/</span> <span data-astro-cid-gu7yyn7r>№ ${block.data.id}</span> </nav> ${block.data.mood && renderTemplate`<div class="mood-strip" data-astro-cid-gu7yyn7r> <a${addAttribute(`/mood/${block.data.mood}`, "href")} class="mood-chip mono"${addAttribute(`Mood: ${block.data.mood}`, "aria-label")} data-astro-cid-gu7yyn7r> <span class="mood-chip__label" data-astro-cid-gu7yyn7r>MOOD</span> <span class="mood-chip__sep" aria-hidden="true" data-astro-cid-gu7yyn7r>·</span> <span class="mood-chip__slug" data-astro-cid-gu7yyn7r>${block.data.mood.replace(/-/g, " ")}</span> <span class="mood-chip__arrow" aria-hidden="true" data-astro-cid-gu7yyn7r>→</span> </a> </div>`} <div class="detail-frame" data-astro-cid-gu7yyn7r> ${renderComponent($$result2, "BlockCard", $$BlockCard, { "block": block, "detail": true, "data-astro-cid-gu7yyn7r": true })} </div>  ${block.data.external && !(block.data.type === "MINT" || block.data.type === "FAUCET") && (() => {
    const url = block.data.external.url;
    const isInternal = (() => {
      try {
        const u = new URL(url, "https://pointcast.xyz");
        return u.host.replace(/^www\./, "") === "pointcast.xyz";
      } catch {
        return false;
      }
    })();
    const label = block.data.external.label || "Open";
    const pretty = (() => {
      try {
        const u = new URL(url, "https://pointcast.xyz");
        const h = u.host.replace(/^www\./, "");
        return h === "pointcast.xyz" ? u.pathname : h;
      } catch {
        return "";
      }
    })();
    return renderTemplate`<a class="external-cta"${addAttribute(url, "href")}${addAttribute(isInternal ? "_self" : "_blank", "target")}${addAttribute(isInternal ? void 0 : "noopener noreferrer", "rel")}${addAttribute(`--ch-600: ${ch.color600}; --ch-800: ${ch.color800}; --ch-50: ${ch.color50};`, "style")} data-astro-cid-gu7yyn7r> <span class="external-cta__label" data-astro-cid-gu7yyn7r>→ ${label}</span> <span class="external-cta__host" data-astro-cid-gu7yyn7r>${pretty}</span> </a>`;
  })()}  ${(block.data.type === "MINT" || block.data.type === "FAUCET") && block.data.edition && renderTemplate`<div class="mint-strip" data-astro-cid-gu7yyn7r> ${renderComponent($$result2, "MintButton", $$MintButton, { "contract": block.data.edition.contract, "tokenId": block.data.edition.tokenId, "priceMutez": block.data.edition.price === "free" ? 0 : Math.round((block.data.edition.price?.tez ?? 0) * 1e6), "kind": block.data.type === "FAUCET" ? "faucet" : "mint", "data-astro-cid-gu7yyn7r": true })} ${block.data.edition.marketplace && block.data.edition.contract.startsWith("KT1") && renderTemplate`<a class="mint-strip__secondary"${addAttribute(`https://objkt.com/tokens/${block.data.edition.contract}/${block.data.edition.tokenId}`, "href")} target="_blank" rel="noopener" data-astro-cid-gu7yyn7r>View on objkt ↗</a>`} </div>`} ${block.data.id === "0331" && renderTemplate`${renderComponent($$result2, "NativePlantingYield", $$NativePlantingYield, { "context": "block", "data-astro-cid-gu7yyn7r": true })}`} ${block.data.id === "0340" && renderTemplate`${renderComponent($$result2, "BuddhaHeadRotator", $$BuddhaHeadRotator, { "context": "block", "data-astro-cid-gu7yyn7r": true })}`}  ${block.data.type === "BIRTHDAY" && (() => {
    parseInt(block.data.id, 10);
    return renderTemplate`<div class="mint-strip mint-strip--birthday" data-astro-cid-gu7yyn7r> ${renderTemplate`<p class="mint-pending mono" data-astro-cid-gu7yyn7r>
★ MINT COMING SOON · contracts/v2/birthdays_fa2.py awaiting origination
              · until then, send the URL or drop confetti below
</p>`} <a class="mint-strip__secondary"${addAttribute(`https://objkt.com/collections/${""}`, "href")} target="_blank" rel="noopener"${addAttribute("display: none;", "style")} data-astro-cid-gu7yyn7r>View collection on objkt ↗</a> </div>`;
  })()}  ${block.data.type === "BIRTHDAY" && renderTemplate`${renderComponent($$result2, "BirthdayCelebrate", $$BirthdayCelebrate, { "blockId": block.data.id, "recipientName": block.data.meta?.for?.replace(/^./, (c) => c.toUpperCase()) ?? null, "data-astro-cid-gu7yyn7r": true })}`}  ${block.data.spend?.agent_id && renderTemplate`<section class="agent-id-strip" aria-label="Agent identity" data-astro-cid-gu7yyn7r> <p class="agent-id-strip__kicker mono" data-astro-cid-gu7yyn7r>AGENT IDENTITY</p> <ul class="agent-id-strip__list" data-astro-cid-gu7yyn7r> <li class="agent-id-pill" data-astro-cid-gu7yyn7r> <span class="agent-id-pill__lbl mono" data-astro-cid-gu7yyn7r>spender</span> <span class="agent-id-pill__val mono" data-astro-cid-gu7yyn7r>${block.data.spend.agent_id}</span> </li> ${block.data.spend?.payee_agent_id && renderTemplate`<li class="agent-id-pill agent-id-pill--payee" data-astro-cid-gu7yyn7r> <span class="agent-id-pill__lbl mono" data-astro-cid-gu7yyn7r>payee</span> <span class="agent-id-pill__val mono" data-astro-cid-gu7yyn7r>${block.data.spend.payee_agent_id}</span> </li>`} ${block.data.spend?.signature ? renderTemplate`<li class="agent-id-pill agent-id-pill--signed" data-astro-cid-gu7yyn7r> <span class="agent-id-pill__lbl mono" data-astro-cid-gu7yyn7r>signed</span> <span class="agent-id-pill__val mono" data-astro-cid-gu7yyn7r>${block.data.spend.signing_alg ?? "ed25519"}</span> <a class="agent-id-pill__verify mono"${addAttribute(`/api/verify/spend/${block.data.id}.json`, "href")} aria-label="Verify signature" data-astro-cid-gu7yyn7r>verify ↗</a> </li>` : renderTemplate`<li class="agent-id-pill agent-id-pill--unsigned" data-astro-cid-gu7yyn7r> <span class="agent-id-pill__lbl mono" data-astro-cid-gu7yyn7r>signed</span> <span class="agent-id-pill__val mono" data-astro-cid-gu7yyn7r>no</span> </li>`} </ul> </section>`}  ${block.data.payouts && block.data.payouts.length > 0 && renderTemplate`<section class="payouts" aria-label="Programmable payouts" data-astro-cid-gu7yyn7r> <p class="payouts__kicker mono" data-astro-cid-gu7yyn7r>PAYOUTS · PROGRAMMABLE REVENUE SPLIT</p> <p class="payouts__dek" data-astro-cid-gu7yyn7r>
When this artifact earns — sponsorship, mint sale, ad — these splits fire automatically.
${block.data.payouts.every((p) => p.paid_out === false) && renderTemplate`<span class="payouts__pending" data-astro-cid-gu7yyn7r> Currently a forward-look; nothing has earned yet.</span>`} </p> <ul class="payouts__list" data-astro-cid-gu7yyn7r> ${block.data.payouts.map((p) => renderTemplate`<li class="payouts__row" data-astro-cid-gu7yyn7r> <span${addAttribute(`payouts__chip payouts__chip--${p.to_kind ?? "agent"}`, "class")} data-astro-cid-gu7yyn7r>${p.to_kind ?? "agent"}</span> <span class="payouts__name mono" data-astro-cid-gu7yyn7r>${p.to}</span> <span class="payouts__share mono" data-astro-cid-gu7yyn7r>${(p.share * 100).toFixed(0)}%</span> ${p.rationale && renderTemplate`<span class="payouts__rationale" data-astro-cid-gu7yyn7r>${p.rationale}</span>`} <span${addAttribute(`payouts__state ${p.paid_out ? "payouts__state--paid" : "payouts__state--pending"}`, "class")} data-astro-cid-gu7yyn7r> ${p.paid_out ? `paid ${p.paid_at ? new Date(p.paid_at).toISOString().slice(0, 10) : ""}` : "pending earnings"} </span> </li>`)} </ul> </section>`} ${(prev || next) && renderTemplate`<nav class="block-nav" aria-label="Adjacent blocks" data-astro-cid-gu7yyn7r> ${prev ? renderTemplate`<a class="block-nav__link block-nav__link--prev"${addAttribute(`/b/${prev.data.id}`, "href")} data-astro-cid-gu7yyn7r> <span class="block-nav__dir mono" data-astro-cid-gu7yyn7r>← OLDER</span> <span class="block-nav__meta mono" data-astro-cid-gu7yyn7r>CH.${CHANNELS[prev.data.channel].code} · №${prev.data.id}</span> <span class="block-nav__title" data-astro-cid-gu7yyn7r>${shortTitle(prev.data.title, 52)}</span> </a>` : renderTemplate`<span class="block-nav__link block-nav__link--empty" data-astro-cid-gu7yyn7r></span>`} ${next ? renderTemplate`<a class="block-nav__link block-nav__link--next"${addAttribute(`/b/${next.data.id}`, "href")} data-astro-cid-gu7yyn7r> <span class="block-nav__dir mono" data-astro-cid-gu7yyn7r>NEWER →</span> <span class="block-nav__meta mono" data-astro-cid-gu7yyn7r>CH.${CHANNELS[next.data.channel].code} · №${next.data.id}</span> <span class="block-nav__title" data-astro-cid-gu7yyn7r>${shortTitle(next.data.title, 52)}</span> </a>` : renderTemplate`<span class="block-nav__link block-nav__link--empty" data-astro-cid-gu7yyn7r></span>`} </nav>`}  ${block.data.companions && block.data.companions.length > 0 && renderTemplate`<section class="companions" aria-label="Companion surfaces" data-astro-cid-gu7yyn7r> <p class="companions__kicker mono" data-astro-cid-gu7yyn7r>COMPANIONS · ALSO PLAYABLE / RELATED</p> <ul class="companions__list" data-astro-cid-gu7yyn7r> ${block.data.companions.map((c) => {
    const isDigit = /^\d{4}$/.test(c.id);
    let href;
    if (c.id.startsWith("/") || c.id.startsWith("http")) {
      href = c.id;
    } else if (isDigit && c.surface === "yee") {
      href = `/yee/${c.id}`;
    } else if (isDigit && c.surface === "clock") {
      href = `/clock/${c.id}`;
    } else if (isDigit && c.surface === "poll") {
      href = `/poll/${c.id}`;
    } else if (isDigit) {
      href = `/b/${c.id}`;
    } else if (c.surface === "poll") {
      href = `/poll/${c.id}`;
    } else {
      href = c.id;
    }
    const surfaceLabel = c.surface === "yee" ? "YEE" : c.surface === "clock" ? "CLOCK" : c.surface === "poll" ? "POLL" : c.surface === "external" ? "EXT" : "BLOCK";
    return renderTemplate`<li data-astro-cid-gu7yyn7r> <a${addAttribute(href, "href")}${addAttribute(`companions__item companions__item--${c.surface ?? "block"}`, "class")} data-astro-cid-gu7yyn7r> <span class="companions__surface mono" data-astro-cid-gu7yyn7r>${surfaceLabel}</span> <span class="companions__label" data-astro-cid-gu7yyn7r>${c.label}</span> <span class="companions__arrow mono" aria-hidden="true" data-astro-cid-gu7yyn7r>→</span> </a> </li>`;
  })} </ul> </section>`} ${related.length > 0 && renderTemplate`<section class="related" aria-label="Related blocks" data-astro-cid-gu7yyn7r> <div class="related__head" data-astro-cid-gu7yyn7r> <p class="related__kicker mono"${addAttribute(`color: ${ch.color800}`, "style")} data-astro-cid-gu7yyn7r>MORE FROM CH.${ch.code} · ${ch.name.toUpperCase()}</p> <a class="related__all"${addAttribute(`/c/${ch.slug}`, "href")} data-astro-cid-gu7yyn7r>See channel →</a> </div> <ul class="related__list" data-astro-cid-gu7yyn7r> ${related.map((r) => renderTemplate`<li data-astro-cid-gu7yyn7r> <a${addAttribute(`/b/${r.data.id}`, "href")} class="related__item" data-astro-cid-gu7yyn7r> <span class="related__id mono" data-astro-cid-gu7yyn7r>№${r.data.id}</span> <span class="related__type mono" data-astro-cid-gu7yyn7r>${r.data.type}</span> <span class="related__title" data-astro-cid-gu7yyn7r>${shortTitle(r.data.title, 60)}</span> </a> </li>`)} </ul> </section>`} ${renderComponent($$result2, "FeedbackStrip", $$FeedbackStrip, { "blockId": block.data.id, "data-astro-cid-gu7yyn7r": true })} ${renderComponent($$result2, "ShareThis", $$ShareThis, { "url": `/b/${block.data.id}`, "title": block.data.title, "kind": "block", "data-astro-cid-gu7yyn7r": true })} <aside class="agent-strip" data-astro-cid-gu7yyn7r> <p class="agent-strip__label" data-astro-cid-gu7yyn7r>MACHINE-READABLE</p> <ul data-astro-cid-gu7yyn7r> <li data-astro-cid-gu7yyn7r><a${addAttribute(`/b/${block.data.id}.json`, "href")} data-astro-cid-gu7yyn7r>/b/${block.data.id}.json</a></li> <li data-astro-cid-gu7yyn7r><a${addAttribute(`/c/${ch.slug}.json`, "href")} data-astro-cid-gu7yyn7r>/c/${ch.slug}.json</a></li> <li data-astro-cid-gu7yyn7r><a${addAttribute(`/c/${ch.slug}.rss`, "href")} data-astro-cid-gu7yyn7r>/c/${ch.slug}.rss</a></li> ${block.data.id === "0331" && renderTemplate`<li data-astro-cid-gu7yyn7r><a href="/nature-yield.json" data-astro-cid-gu7yyn7r>/nature-yield.json</a></li>`} <li data-astro-cid-gu7yyn7r><a href="/archive" data-astro-cid-gu7yyn7r>/archive</a></li> <li data-astro-cid-gu7yyn7r><a href="/for-agents" data-astro-cid-gu7yyn7r>/for-agents</a></li> </ul> </aside> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/b/[id].astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/b/[id].astro";
const $$url = "/b/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
