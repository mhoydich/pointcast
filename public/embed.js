/**
 * PointCast Room Embed — `<pointcast-room>` web component.
 *
 * Sprint 5 of the live-artifacts arc · Distribution #1.
 *
 * Drops on any blog or doc:
 *
 *   <script src="https://pointcast.xyz/embed.js" defer></script>
 *   <pointcast-room id="meditate"></pointcast-room>
 *
 * Or from another node:
 *
 *   <pointcast-room id="meditate" host="https://yournode.example"></pointcast-room>
 *
 * What it does:
 *   1. Fetches `${host}/${id}.json` (the room contract)
 *   2. Validates a minimal subset (id, title, programs, controls, verbs)
 *   3. Renders the meditation-artifact layout inside its Shadow DOM —
 *      status chyron, title, breath visualizer, program cards, duration
 *      buttons, verb buttons, receipt feed, foot attribution
 *   4. Wires program/duration toggles and verb buttons. Verbs POST/GET
 *      `${verb.endpoint}` and render the receipt template.
 *
 * Shadow DOM is used for style isolation so embedding sites can't
 * accidentally style the inside of the room (and vice versa).
 *
 * Same contract as RoomRenderer.astro — they produce visually
 * equivalent DOM. When the RoomRenderer template changes, this file
 * tracks it.
 */
(() => {
  const DEFAULT_HOST = 'https://pointcast.xyz';

  /** Minimal client-side validation. Throws with a path on first violation. */
  function validateRoomSpec(v) {
    if (!v || typeof v !== 'object') throw new Error('room: expected object');
    for (const k of ['id', 'title', 'description', 'home']) {
      if (typeof v[k] !== 'string' || !v[k]) throw new Error(`room.${k}: expected non-empty string`);
    }
    if (!Array.isArray(v.programs) || v.programs.length === 0) throw new Error('room.programs: expected non-empty array');
    if (!Array.isArray(v.controls)) throw new Error('room.controls: expected array');
    if (!Array.isArray(v.verbs)) throw new Error('room.verbs: expected array');
    return v;
  }

  function renderReceipt(template, ctx) {
    return template.replace(/\{(\w+)\}/g, (_, k) => (ctx[k] != null ? String(ctx[k]) : '{' + k + '}'));
  }

  const STYLES = `
    :host {
      display: block;
      max-width: 880px;
      margin: 0 auto;
      font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
      color: #1f1b15;
      --paper: #fafaf7;
      --rule: #ddd9cc;
      --ink: #1f1b15;
      --ink-soft: #5a5648;
      --coral: #b85a3e;
    }
    .room { padding: 0 12px; }
    .err {
      padding: 18px 20px;
      border: 1px dashed #d8624a;
      border-radius: 6px;
      background: #fff;
      color: #1f1b15;
      font-family: ui-monospace, monospace;
      font-size: 13px;
      line-height: 1.5;
    }
    .err strong { color: #d8624a; }
    .loading {
      padding: 24px 20px;
      color: var(--ink-soft);
      font-family: ui-monospace, monospace;
      font-size: 12px;
      letter-spacing: 0.14em;
      text-align: center;
      text-transform: uppercase;
    }
    .status {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      list-style: none;
      padding: 0;
      margin: 0 0 28px;
    }
    .badge {
      display: flex; flex-direction: column; gap: 4px;
      padding: 12px 14px;
      background: var(--paper);
      border: 1px solid var(--rule);
      border-radius: 8px;
    }
    .badge-label {
      font-family: ui-monospace, monospace;
      font-size: 10px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--ink-soft);
    }
    .badge-value { font-size: 14px; color: var(--ink); font-weight: 500; }
    .head { margin: 0 0 22px; }
    .title {
      font-family: Georgia, serif;
      font-style: italic;
      font-size: clamp(24px, 3.2vw, 34px);
      font-weight: 500;
      margin: 0 0 6px;
      letter-spacing: -0.005em;
    }
    .dek {
      margin: 0;
      font-size: 13px;
      color: var(--ink-soft);
      font-style: italic;
      max-width: 600px;
      line-height: 1.5;
    }
    .viz {
      display: flex; align-items: center; justify-content: center;
      padding: 22px 0 4px;
      min-height: 200px;
    }
    .breath {
      position: relative;
      width: 220px; height: 220px;
      display: flex; align-items: center; justify-content: center;
    }
    .breath__ring {
      position: absolute;
      border-radius: 50%;
      border: 1px dashed rgba(31, 27, 21, 0.18);
    }
    .breath__r1 { width: 160px; height: 160px; }
    .breath__r2 { width: 190px; height: 190px; }
    .breath__r3 { width: 220px; height: 220px; }
    .breath__sphere {
      width: 120px; height: 120px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 32%, #fff 0%, #d8e3eb 55%, #a8c2d4 100%);
      box-shadow:
        0 12px 30px rgba(168, 194, 212, 0.45),
        inset -10px -14px 24px rgba(50, 80, 100, 0.18);
      animation: breath 13s ease-in-out infinite;
    }
    .breath__cap {
      position: absolute;
      font-family: Georgia, serif;
      font-style: italic;
      font-size: 12px;
      color: rgba(31, 27, 21, 0.62);
    }
    @keyframes breath {
      0%, 100% { transform: scale(0.78); }
      20%      { transform: scale(1); }
      50%      { transform: scale(1); }
      80%      { transform: scale(0.78); }
    }
    .caption {
      text-align: center;
      margin: 0 0 22px;
      font-family: Georgia, serif;
      font-style: italic;
      font-size: 16px;
      line-height: 1.4;
    }
    .progs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
      list-style: none;
      padding: 0;
      margin: 0 0 14px;
    }
    .prog {
      padding: 14px 16px;
      background: var(--paper);
      border: 1px solid var(--rule);
      border-radius: 8px;
      cursor: pointer;
      display: flex; flex-direction: column; gap: 6px;
    }
    .prog--active {
      background: var(--ink);
      color: var(--paper);
      border-color: var(--ink);
    }
    .prog--active .prog-purpose { color: rgba(255,255,255,0.78); }
    .prog-name {
      font-family: Georgia, serif;
      font-style: italic;
      font-size: 15px;
      font-weight: 500;
    }
    .prog-pattern {
      font-family: ui-monospace, monospace;
      font-size: 10px;
      letter-spacing: 0.18em;
      color: var(--ink-soft);
    }
    .prog--active .prog-pattern { color: rgba(255,255,255,0.6); }
    .prog-purpose {
      font-size: 12px;
      line-height: 1.45;
      color: var(--ink-soft);
    }
    .controls {
      display: flex; align-items: center; justify-content: space-between;
      gap: 14px; flex-wrap: wrap;
      margin: 4px 0 18px;
    }
    .duration { display: inline-flex; gap: 6px; }
    .duration button {
      padding: 7px 16px;
      border: 1px solid var(--rule);
      background: var(--paper);
      color: var(--ink);
      border-radius: 999px;
      font-size: 12px;
      cursor: pointer;
      font-family: inherit;
    }
    .duration button[aria-checked="true"] {
      background: var(--ink); color: var(--paper); border-color: var(--ink);
    }
    .end {
      padding: 7px 16px;
      background: var(--coral);
      color: #fff;
      border: 1px solid var(--coral);
      border-radius: 999px;
      font-size: 12px;
      cursor: pointer;
      font-family: inherit;
    }
    .verb {
      display: flex; align-items: center; justify-content: space-between;
      gap: 14px;
      padding: 12px 14px;
      background: var(--paper);
      border: 1px solid var(--rule);
      border-radius: 8px;
      margin: 0 0 8px;
    }
    .verb-label { font-size: 13px; font-weight: 500; margin: 0 0 2px; }
    .verb-desc { margin: 0; font-size: 12px; color: var(--ink-soft); font-style: italic; line-height: 1.4; }
    .verb-btn {
      padding: 7px 16px;
      border: 1px solid var(--ink);
      background: var(--paper);
      color: var(--ink);
      border-radius: 999px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      flex: 0 0 auto;
    }
    .verb-btn:hover { background: var(--ink); color: var(--paper); }
    .receipt {
      margin: 4px 0 14px;
      min-height: 14px;
      font-family: ui-monospace, monospace;
      font-size: 11px;
      letter-spacing: 0.04em;
      color: var(--ink-soft);
    }
    .sources {
      margin: 20px 0 0;
      padding-top: 14px;
      font-family: ui-monospace, monospace;
      font-size: 10px;
      color: var(--ink-soft);
      text-align: center;
      border-top: 1px solid var(--rule);
    }
    .sources a {
      color: var(--ink-soft);
      text-decoration: none;
      border-bottom: 1px solid transparent;
    }
    .sources a:hover { color: var(--ink); border-bottom-color: currentColor; }
    .powered {
      margin: 8px 0 0;
      font-family: ui-monospace, monospace;
      font-size: 9px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: rgba(31,27,21,0.45);
      text-align: center;
    }
    .powered a {
      color: rgba(31,27,21,0.55);
      text-decoration: none;
      border-bottom: 1px solid rgba(31,27,21,0.18);
    }
    .powered a:hover { color: var(--ink); border-bottom-color: currentColor; }
    @media (prefers-reduced-motion: reduce) {
      .breath__sphere { animation: none !important; }
    }
    @media (max-width: 600px) {
      .verb { flex-direction: column; align-items: stretch; }
      .verb-btn { width: 100%; }
    }
  `;

  function makeBreathViz() {
    return `
      <div class="viz" aria-hidden="true">
        <div class="breath">
          <span class="breath__ring breath__r3"></span>
          <span class="breath__ring breath__r2"></span>
          <span class="breath__ring breath__r1"></span>
          <span class="breath__sphere"></span>
          <span class="breath__cap">hold</span>
        </div>
      </div>
    `;
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function renderRoom(root, room, hostUrl) {
    const activeProgId = room.programs[0]?.id ?? '';
    const durationControl = room.controls.find((c) => c.type === 'duration');
    const activeDurId = durationControl?.defaultId ?? durationControl?.options[0]?.id ?? '';
    const activeProg = room.programs.find((p) => p.id === activeProgId) ?? room.programs[0];
    const visibleCaption = activeProg?.prompts?.[0] ?? activeProg?.tone ?? '';

    const statusHtml = (room.status ?? []).map((s) => `
      <li class="badge">
        <span class="badge-label">${escapeHtml(s.label)}</span>
        <span class="badge-value">${escapeHtml(s.value)}</span>
      </li>
    `).join('');

    // Visualizer — only breath today; pour/tap/wave/lantern fall back to breath.
    const vizHtml = makeBreathViz();

    const progHtml = room.programs.map((p) => `
      <li class="prog ${p.id === activeProgId ? 'prog--active' : ''}" data-prog="${escapeHtml(p.id)}" data-purpose="${escapeHtml(p.purpose || '')}" data-first-prompt="${escapeHtml(p.prompts?.[0] ?? p.tone ?? '')}">
        <span class="prog-name">${escapeHtml(p.name)}</span>
        ${p.pattern ? `<span class="prog-pattern">${p.pattern.join(' · ')}</span>` : ''}
        <span class="prog-purpose">${escapeHtml(p.purpose || '')}</span>
      </li>
    `).join('');

    const controlsHtml = durationControl ? `
      <div class="controls">
        <div class="duration" role="radiogroup" aria-label="Session duration">
          ${durationControl.options.map((o) => `
            <button type="button" role="radio" data-dur="${escapeHtml(o.id)}" aria-checked="${o.id === activeDurId}">${escapeHtml(o.label)}</button>
          `).join('')}
        </div>
        <button type="button" class="end" data-end>End early</button>
      </div>
    ` : '';

    const verbsHtml = (room.verbs ?? []).map((v) => `
      <div class="verb"
           data-verb-id="${escapeHtml(v.id)}"
           data-verb-endpoint="${escapeHtml(v.endpoint)}"
           data-verb-method="${escapeHtml(v.method)}"
           data-verb-payload='${escapeHtml(JSON.stringify(v.payload ?? {}))}'
           data-verb-receipt="${escapeHtml(v.receipt?.template ?? 'done')}">
        <div>
          <p class="verb-label">${escapeHtml(v.label)}</p>
          ${v.description ? `<p class="verb-desc">${escapeHtml(v.description)}</p>` : ''}
        </div>
        <button type="button" class="verb-btn">${escapeHtml(v.id === 'sing' ? 'Ring the room' : v.label)}</button>
      </div>
    `).join('');

    const sourcesHtml = (room.sources ?? []).map((s) => `<a href="${escapeHtml(s.url)}">${escapeHtml(s.label)}</a>`).join(' · ');

    root.innerHTML = `
      <style>${STYLES}</style>
      <article class="room">
        ${statusHtml ? `<ul class="status">${statusHtml}</ul>` : ''}
        <header class="head">
          <h2 class="title">${escapeHtml(room.title)}</h2>
          <p class="dek">${escapeHtml(room.description)}</p>
        </header>
        ${vizHtml}
        ${visibleCaption ? `<p class="caption" data-caption>${escapeHtml(visibleCaption)}</p>` : '<p class="caption" data-caption></p>'}
        <ul class="progs" role="tablist" aria-label="Programs">${progHtml}</ul>
        ${controlsHtml}
        ${verbsHtml}
        <p class="receipt" data-receipt></p>
        ${sourcesHtml ? `<p class="sources">${sourcesHtml}</p>` : ''}
        <p class="powered">powered by <a href="${escapeHtml(hostUrl)}/${escapeHtml(room.id)}.json">${escapeHtml(hostUrl.replace(/^https?:\/\//, ''))}/${escapeHtml(room.id)}.json</a></p>
      </article>
    `;

    // Wire interactions.
    const captionEl = root.querySelector('[data-caption]');
    const progs = root.querySelectorAll('[data-prog]');
    progs.forEach((el) => {
      el.addEventListener('click', () => {
        progs.forEach((p) => p.classList.toggle('prog--active', p === el));
        const newCaption = el.getAttribute('data-first-prompt') || el.getAttribute('data-purpose') || '';
        if (captionEl) captionEl.textContent = newCaption;
      });
    });

    const durBtns = root.querySelectorAll('[data-dur]');
    durBtns.forEach((b) => {
      b.addEventListener('click', () => {
        durBtns.forEach((c) => c.setAttribute('aria-checked', c === b ? 'true' : 'false'));
      });
    });

    const receiptEl = root.querySelector('[data-receipt]');
    const verbButtons = root.querySelectorAll('.verb-btn');
    verbButtons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const wrap = btn.closest('[data-verb-id]');
        if (!wrap) return;
        const verbId = wrap.getAttribute('data-verb-id') || 'action';
        const endpoint = wrap.getAttribute('data-verb-endpoint') || '';
        const method = wrap.getAttribute('data-verb-method') || 'POST';
        const payload = JSON.parse(wrap.getAttribute('data-verb-payload') || '{}');
        const template = wrap.getAttribute('data-verb-receipt') || 'done';

        try {
          if (method === 'POST') {
            await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), mode: 'cors' }).catch(() => null);
          } else {
            await fetch(endpoint, { method, mode: 'cors' }).catch(() => null);
          }
        } catch (_) { /* network optional */ }

        const firstArg = Object.values(payload)[0];
        const ctx = {
          actor: 'you',
          action: verbId,
          arg: firstArg !== undefined ? String(firstArg) : '',
          target: endpoint.replace(/^https?:\/\/[^/]+/, ''),
          time: new Date().toLocaleTimeString('en-US', { hour12: true }),
        };
        if (receiptEl) receiptEl.textContent = renderReceipt(template, ctx);
      });
    });
  }

  class PointcastRoom extends HTMLElement {
    static get observedAttributes() { return ['id', 'host']; }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this.render();
    }

    attributeChangedCallback() {
      if (this.isConnected) this.render();
    }

    async render() {
      const root = this.shadowRoot;
      const roomId = this.getAttribute('id');
      const host = this.getAttribute('host') || DEFAULT_HOST;

      if (!roomId) {
        root.innerHTML = `<style>${STYLES}</style><div class="err"><strong>pointcast-room error:</strong> missing required <code>id</code> attribute. Usage: <code>&lt;pointcast-room id="meditate"&gt;&lt;/pointcast-room&gt;</code></div>`;
        return;
      }

      root.innerHTML = `<style>${STYLES}</style><div class="loading">loading ${host}/${roomId}.json…</div>`;

      try {
        const res = await fetch(`${host}/${roomId}.json`, { mode: 'cors' });
        if (!res.ok) throw new Error(`${host}/${roomId}.json → HTTP ${res.status}`);
        const room = validateRoomSpec(await res.json());
        renderRoom(root, room, host);
      } catch (err) {
        root.innerHTML = `<style>${STYLES}</style><div class="err"><strong>pointcast-room error:</strong> ${escapeHtml(err && err.message ? err.message : String(err))}</div>`;
      }
    }
  }

  if (!customElements.get('pointcast-room')) {
    customElements.define('pointcast-room', PointcastRoom);
  }
})();
