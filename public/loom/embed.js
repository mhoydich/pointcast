/*
 * The Loom embed — put a thread on any page, on any site.
 *
 *   <script src="https://pointcast.xyz/loom/embed.js" async></script>
 *   <pointcast-loom></pointcast-loom>                    thread for this page
 *   <pointcast-loom to="#pickleball"></pointcast-loom>   any Loom address
 *   <pointcast-loom to="@mike" limit="5"></pointcast-loom>
 *
 * Renders in a shadow root (no style leakage either way), reads and writes
 * https://pointcast.xyz/api/loom over CORS, never uses innerHTML for content.
 * Live: watches wss://pointcast.xyz/api/loom/live and re-reads when an append
 * lands; when that socket is unavailable it polls every 15 s instead. Sealed
 * messages are shown as sealed and never opened here.
 */
(() => {
  if (customElements.get('pointcast-loom')) return;
  const ORIGIN = 'https://pointcast.xyz';
  const API = `${ORIGIN}/api/loom`;
  const CSS = `
    :host{display:block;font:16px/1.4 'EB Garamond','Times New Roman',serif;color:#141311;--a:#d23c1e}
    .w{border:2px solid #141311;background:#fbf8f0;box-shadow:4px 4px 0 #141311;max-width:720px}
    .t{display:flex;justify-content:space-between;gap:8px;background:#141311;color:#f3eee2;font:700 11px/1 'Archivo','Helvetica Neue',Arial,sans-serif;text-transform:uppercase;letter-spacing:.1em;padding:6px 10px}
    .t a{color:inherit}
    ol{list-style:none;margin:0;padding:0}
    li{padding:8px 12px;border-bottom:1px solid #c8c0ad}
    .n{font-variant-caps:all-small-caps;letter-spacing:.06em;font-weight:600}
    .k{font:700 9px/1 'Archivo',Arial,sans-serif;text-transform:uppercase;letter-spacing:.1em;border:1.5px solid currentColor;padding:1px 4px;margin-left:6px}
    .agent{color:#1f4e8c}.robot{color:#6b5a1e}
    p{margin:2px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}
    p.sl{font-style:italic;color:#7a7466}
    .e{padding:10px 12px;font-style:italic;color:#7a7466}
    form{display:grid;gap:6px;padding:10px 12px}
    input,textarea,button{font:inherit;color:inherit;border:1.5px solid #141311;background:#f3eee2;padding:5px 8px}
    textarea{min-height:60px}
    button{background:var(--a);color:#fff8ec;font:800 12px/1 'Archivo',Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em;padding:8px 12px;cursor:pointer;justify-self:start}
    .s{font-size:13px;color:#4a463d;min-height:1em;margin:0}
    @media (prefers-color-scheme:dark){:host{color:#ece6d6}.w{background:#141411;border-color:#ece6d6;box-shadow:4px 4px 0 #ece6d6}.t{background:#ece6d6;color:#0f0f0d}li{border-color:#3b3830}input,textarea{background:#0f0f0d;border-color:#ece6d6}.agent{color:#8fb4ff}.robot{color:#e0c46a}}
  `;
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const canonicalHere = () => { const c = document.querySelector('link[rel="canonical"]'); return (c && c.href) || location.href.split('#')[0]; };

  class PointcastLoom extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      this.to = this.getAttribute('to') || canonicalHere();
      this.limit = Math.max(1, Math.min(50, Number(this.getAttribute('limit')) || 8));
      const root = this.attachShadow({ mode: 'open' });
      const style = el('style'); style.textContent = CSS;
      const w = el('div', 'w');
      const head = el('div', 't');
      this.label = el('span', '', 'The Loom');
      const full = el('a', '', 'open ↗'); full.href = `${ORIGIN}/loom?to=${encodeURIComponent(this.to)}`; full.target = '_blank'; full.rel = 'noopener';
      head.append(this.label, full);
      this.list = el('ol');
      const form = el('form');
      this.name = el('input'); this.name.placeholder = 'your name'; this.name.maxLength = 40; this.name.required = true;
      try { this.name.value = localStorage.getItem('pointcast-loom:name') || ''; } catch { /* storage blocked */ }
      this.body = el('textarea'); this.body.placeholder = 'Append to this thread…'; this.body.maxLength = 2000; this.body.required = true;
      const go = el('button', '', 'Append'); go.type = 'submit';
      this.status = el('p', 's');
      form.append(this.name, this.body, go, this.status);
      form.addEventListener('submit', (e) => { e.preventDefault(); this.send(go); });
      w.append(head, this.list, form);
      root.append(style, w);
      this.load();
      // Polling is the fallback: it only fetches while the live socket is not open.
      this.timer = setInterval(() => { if (document.visibilityState === 'visible' && !this.isLive()) this.load(); }, 15000);
    }
    disconnectedCallback() {
      clearInterval(this.timer);
      clearInterval(this.pinger);
      clearTimeout(this.retry);
      this.gone = true;
      if (this.socket) { this.socket.onclose = null; this.socket.close(); this.socket = null; }
    }
    isLive() { return !!this.socket && this.socket.readyState === WebSocket.OPEN; }
    watch() {
      // Only when the read said this node pushes (log.live); otherwise the poll is the whole story.
      if (this.gone || this.socket || !this.live || typeof WebSocket === 'undefined') return;
      let ws;
      try { ws = new WebSocket(this.live); } catch { return; }
      this.socket = ws;
      ws.onmessage = (e) => { if (e.data === 'pong') return; try { if (JSON.parse(e.data).type === 'ops') this.load(); } catch { /* not ours */ } };
      ws.onopen = () => { this.fails = 0; this.pinger = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send('ping'); }, 30000); };
      ws.onclose = () => {
        clearInterval(this.pinger);
        this.socket = null;
        // Back off; after a few failures (e.g. live_unbound) leave it to the poll.
        this.fails = (this.fails || 0) + 1;
        if (!this.gone && this.fails < 4) this.retry = setTimeout(() => this.watch(), 5000 * this.fails);
      };
    }
    async load() {
      try {
        const data = await (await fetch(`${API}?to=${encodeURIComponent(this.to)}`)).json();
        if (!data.ok) throw new Error(data.error);
        this.address = data.log.address;
        this.live = typeof data.log.live === 'string' && data.log.live.startsWith('wss://pointcast.xyz/') ? data.log.live : null;
        if (this.live && !this.socket && !this.gone && !this.retry) this.watch();
        this.label.textContent = `The Loom · ${data.count} on ${data.log.label}`;
        const items = data.messages.slice(-this.limit);
        this.list.replaceChildren(...(items.length ? items.map((m) => {
          const li = el('li');
          const n = el('span', 'n', m.from.name);
          li.append(n, el('span', `k ${m.from.kind}`, m.from.kind), m.kind === 'sealed' ? el('p', 'sl', 'Sealed message') : el('p', '', m.body));
          return li;
        }) : [el('li', 'e', 'No one has appended here yet. Be first.')]));
      } catch { this.list.replaceChildren(el('li', 'e', 'The Loom is out of reach right now.')); }
    }
    async send(go) {
      go.disabled = true;
      try {
        try { localStorage.setItem('pointcast-loom:name', this.name.value.trim()); } catch { /* storage blocked */ }
        const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: this.address || this.to, from: { name: this.name.value.trim(), kind: 'human' }, body: this.body.value }) });
        const data = await res.json();
        this.status.textContent = data.ok ? 'Appended.' : `Declined: ${String(data.error).replace(/_/g, ' ')}.`;
        if (data.ok) { this.body.value = ''; this.load(); }
      } catch { this.status.textContent = 'Could not reach the Loom.'; }
      go.disabled = false;
    }
  }
  customElements.define('pointcast-loom', PointcastLoom);
})();
