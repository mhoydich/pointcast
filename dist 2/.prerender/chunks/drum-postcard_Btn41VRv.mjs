import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$DrumPostcard = createComponent(async ($$result, $$props, $$slots) => {
  const title = "/drum-postcard — your drum-hub session, on a postcard";
  const description = "Generate a shareable SVG/PNG receipt of your drum-hub session — top surfaces, sticker count, total taps, streak, and your signature. Print, post, save.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://pointcast.xyz/drum-postcard",
    name: "PointCast Drum · Postcard",
    url: "https://pointcast.xyz/drum-postcard",
    description
  };
  return renderTemplate(_a || (_a = __template(["", ` <script>
  (function () {
    'use strict';
    const PALETTES = {
      paper:    { bg: '#fffaf0', fg: '#12110e', accent: '#ff5c23', soft: '#5f5e5a', card: '#fff', stamp: '#ffd400', vine: '#3b6e3b' },
      dusk:     { bg: '#1a1228', fg: '#fffaf0', accent: '#ff8a4a', soft: '#cfc6df', card: '#0c0820', stamp: '#ffd400', vine: '#5fbafd' },
      midnight: { bg: '#050310', fg: '#fffaf0', accent: '#5fbafd', soft: '#cfc6df', card: '#0c1d3a', stamp: '#ffd400', vine: '#94d4ff' },
    };
    let palette = 'paper';

    // Sources: same keys the existing surfaces write
    const SURFACES = [
      { id: 'classic',  href: '/drum',          name: 'Classic',         key: 'pc:drumLocalCount',           kind: 'count' },
      { id: 'collab',   href: '/drum-v2',       name: 'Collab',          key: 'pc:drum-v2:tapped',           kind: 'count' },
      { id: 'spotify',  href: '/drum-v3',       name: 'Spotify',         key: 'pc:drum-v3:track-count',      kind: 'count' },
      { id: 'orch',     href: '/drum-v4',       name: 'Orchestra',       key: 'pc:drum-v4:collected',        kind: 'set' },
      { id: 'loops',    href: '/drum-v5',       name: 'Loops',           key: 'pc:drum-v5:shared-count',     kind: 'count' },
      { id: 'choir',    href: '/drum-v6',       name: 'Choir',           key: 'pc:drum-v6:sung',             kind: 'set' },
      { id: 'big',      href: '/drum-v7',       name: 'Big Board',       key: 'pc:drum-v7:played',           kind: 'set' },
      { id: 'symph',    href: '/drum-v8',       name: 'Symphony',        key: 'pc:drum-v8:played',           kind: 'set' },
      { id: 'lounge',   href: '/drum-v9',       name: 'Lounge',          key: 'pc:drum-v9:played',           kind: 'count' },
      { id: 'theremin', href: '/drum-v10',      name: 'Theremin',        key: 'pc:drum-v10:notes',           kind: 'count' },
      { id: 'bells',    href: '/drum-v11',      name: 'Bells',           key: 'pc:drum-v11:rung',            kind: 'set' },
      { id: 'organ',    href: '/drum-v12',      name: 'Pipe Organ',      key: 'pc:drum-v12:notes',           kind: 'count' },
      { id: 'strings',  href: '/drum-v13',      name: 'Strings',         key: 'pc:drum-v13:played',          kind: 'set' },
      { id: 'apr26',    href: '/drum-apr26',    name: 'Sequencer',       key: 'pc:drum-apr26:tapped',        kind: 'count' },
      { id: 'potato',   href: '/drum-potato',   name: 'Hot Potato',      key: 'pc:drum-potato:wins',         kind: 'count' },
      { id: 'pulse',    href: '/drum-pulse',    name: 'Pulse',           key: 'pc:drum-pulse:milestones-seen', kind: 'count' },
      { id: 'agents',   href: '/drum-agents',   name: 'Agents',          key: 'pc:drum-agents:visited',      kind: 'flag' },
      { id: 'daily',    href: '/drum-daily',    name: 'Daily',           key: 'pc:drum-daily:days',          kind: 'set' },
      { id: 'jam',      href: '/drum-jam',      name: 'Jam',             key: 'pc:drum-jam:minutes',         kind: 'count' },
      { id: 'kettle',   href: '/kettle',        name: 'Kettle',          key: 'pc:kettle:my-stokes',         kind: 'count' },
    ];

    function readNum(key) {
      try { const v = Number(localStorage.getItem(key) || 0); return isFinite(v) ? v : 0; } catch { return 0; }
    }
    function readSet(key) {
      try { const raw = localStorage.getItem(key); if (!raw) return 0; const v = JSON.parse(raw); return Array.isArray(v) ? v.length : 0; } catch { return 0; }
    }
    function readFlag(key) {
      try { const v = localStorage.getItem(key); return v && v !== '0' && v !== 'false' ? 1 : 0; } catch { return 0; }
    }
    function val(s) {
      if (s.kind === 'count') return readNum(s.key);
      if (s.kind === 'set')   return readSet(s.key);
      return readFlag(s.key);
    }

    // Compute stats
    function gatherStats() {
      const surfaceVals = SURFACES.map((s) => ({ ...s, v: val(s) }));
      const totalTaps = surfaceVals.reduce((acc, s) => acc + (s.kind === 'count' ? s.v : 0), 0);
      const visited = surfaceVals.filter((s) => s.v > 0);
      const top = [...surfaceVals]
        .filter((s) => s.v > 0)
        .sort((a, b) => b.v - a.v)
        .slice(0, 3);
      // Stickers: count surfaces with any progress
      const stickers = visited.length;
      // Streak — read pc:drum-daily:days (JSON array of date strings) to compute consecutive
      let streak = 0;
      try {
        const raw = localStorage.getItem('pc:drum-daily:days');
        const arr = Array.isArray(JSON.parse(raw || '[]')) ? JSON.parse(raw || '[]') : [];
        // Sort descending; count consecutive UTC days back from today
        const set = new Set(arr);
        const d = new Date();
        for (let i = 0; i < 60; i++) {
          const k = \`\${d.getUTCFullYear()}-\${String(d.getUTCMonth() + 1).padStart(2, '0')}-\${String(d.getUTCDate()).padStart(2, '0')}\`;
          if (set.has(k)) streak += 1; else break;
          d.setUTCDate(d.getUTCDate() - 1);
        }
      } catch {}
      return { totalTaps, visited: visited.length, top, stickers, streak, totalSurfaces: SURFACES.length };
    }

    function fmtDate() {
      const d = new Date();
      const m = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.getMonth()];
      return \`\${m} \${d.getDate()}, \${d.getFullYear()}\`;
    }

    function renderSVG() {
      const p = PALETTES[palette];
      const stats = gatherStats();
      const noun = Math.max(0, Math.min(1199, Number(document.getElementById('pc-noun').value || 385)));
      const msg = (document.getElementById('pc-msg').value || '').slice(0, 60);
      const date = fmtDate();
      const top1 = stats.top[0];
      const top2 = stats.top[1];
      const top3 = stats.top[2];
      const fmt = (n) => Number(n).toLocaleString();

      const svg = \`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet">
  <rect width="1200" height="750" fill="\${p.card}" />
  <rect x="20" y="20" width="1160" height="710" fill="none" stroke="\${p.fg}" stroke-width="6" stroke-dasharray="14 10" />
  <rect x="32" y="32" width="1136" height="686" fill="none" stroke="\${p.fg}" stroke-width="2" />

  <!-- Stamp -->
  <g transform="translate(1010, 70)">
    <rect width="120" height="120" fill="\${p.stamp}" stroke="\${p.fg}" stroke-width="3" />
    <text x="60" y="38" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="14" font-weight="700" fill="\${p.fg}">POINTCAST</text>
    <text x="60" y="58" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="\${p.fg}">DRUM HUB</text>
    <image href="https://noun.pics/\${noun}.svg" x="34" y="64" width="52" height="52" />
    <text x="60" y="135" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="\${p.fg}">№ \${noun}</text>
  </g>

  <!-- Title -->
  <text x="60" y="140" font-family="Georgia, serif" font-size="56" fill="\${p.fg}" font-style="italic">your drum hub.</text>
  <text x="60" y="180" font-family="JetBrains Mono, monospace" font-size="14" fill="\${p.accent}" letter-spacing="6">RECEIPT · \${date}</text>

  <!-- Big number -->
  <text x="60" y="290" font-family="Georgia, serif" font-size="22" fill="\${p.soft}">total taps across surfaces</text>
  <text x="60" y="380" font-family="Bungee, Impact, sans-serif" font-size="120" fill="\${p.accent}" letter-spacing="6">\${fmt(stats.totalTaps)}</text>

  <!-- Top 3 surfaces -->
  <text x="60" y="450" font-family="JetBrains Mono, monospace" font-size="14" fill="\${p.accent}" letter-spacing="4">TOP THREE ROOMS</text>
  \${top1 ? \`
    <text x="60" y="490" font-family="Georgia, serif" font-size="28" fill="\${p.fg}">1 · \${top1.name}</text>
    <text x="320" y="490" font-family="JetBrains Mono, monospace" font-size="22" fill="\${p.accent}">\${fmt(top1.v)}</text>
  \` : ''}
  \${top2 ? \`
    <text x="60" y="528" font-family="Georgia, serif" font-size="22" fill="\${p.fg}">2 · \${top2.name}</text>
    <text x="320" y="528" font-family="JetBrains Mono, monospace" font-size="18" fill="\${p.accent}">\${fmt(top2.v)}</text>
  \` : ''}
  \${top3 ? \`
    <text x="60" y="562" font-family="Georgia, serif" font-size="20" fill="\${p.fg}">3 · \${top3.name}</text>
    <text x="320" y="562" font-family="JetBrains Mono, monospace" font-size="16" fill="\${p.accent}">\${fmt(top3.v)}</text>
  \` : ''}
  \${stats.top.length === 0 ? \`
    <text x="60" y="490" font-family="Georgia, serif" font-size="22" fill="\${p.soft}" font-style="italic">play something — your top three will show up here</text>
  \` : ''}

  <!-- Right column stats -->
  <g transform="translate(820, 240)">
    <rect width="220" height="72" fill="none" stroke="\${p.fg}" stroke-width="2" />
    <text x="14" y="22" font-family="JetBrains Mono, monospace" font-size="10" fill="\${p.accent}" letter-spacing="3">STICKERS</text>
    <text x="110" y="56" text-anchor="middle" font-family="Bungee, Impact, sans-serif" font-size="36" fill="\${p.fg}">\${stats.stickers} / \${stats.totalSurfaces}</text>
  </g>
  <g transform="translate(820, 320)">
    <rect width="220" height="72" fill="none" stroke="\${p.fg}" stroke-width="2" />
    <text x="14" y="22" font-family="JetBrains Mono, monospace" font-size="10" fill="\${p.accent}" letter-spacing="3">DAILY STREAK</text>
    <text x="110" y="56" text-anchor="middle" font-family="Bungee, Impact, sans-serif" font-size="36" fill="\${p.fg}">\${stats.streak} day\${stats.streak === 1 ? '' : 's'}</text>
  </g>
  <g transform="translate(820, 400)">
    <rect width="220" height="72" fill="none" stroke="\${p.fg}" stroke-width="2" />
    <text x="14" y="22" font-family="JetBrains Mono, monospace" font-size="10" fill="\${p.accent}" letter-spacing="3">SURFACES VISITED</text>
    <text x="110" y="56" text-anchor="middle" font-family="Bungee, Impact, sans-serif" font-size="36" fill="\${p.fg}">\${stats.visited}</text>
  </g>

  <!-- Signature -->
  <line x1="60" y1="650" x2="700" y2="650" stroke="\${p.fg}" stroke-width="2" />
  <text x="60" y="680" font-family="Georgia, serif" font-size="24" fill="\${p.fg}" font-style="italic">\${escapeXml(msg) || 'signed off · pour something'}</text>
  <text x="60" y="708" font-family="JetBrains Mono, monospace" font-size="11" fill="\${p.soft}" letter-spacing="3">— pointcast.xyz / drum-postcard · el segundo</text>

  <!-- Vine flourish -->
  <g transform="translate(840, 600)">
    <path d="M 0 80 Q 40 10 90 60 Q 140 110 200 50 Q 250 10 300 80" fill="none" stroke="\${p.vine}" stroke-width="3" />
    <circle cx="20" cy="68" r="4" fill="\${p.vine}" />
    <circle cx="100" cy="56" r="4" fill="\${p.vine}" />
    <circle cx="180" cy="60" r="4" fill="\${p.vine}" />
    <circle cx="280" cy="68" r="4" fill="\${p.vine}" />
  </g>
</svg>\`;
      document.getElementById('pc-card').innerHTML = svg;

      // Stats panel
      const stEl = document.getElementById('pc-stats');
      stEl.innerHTML = \`
        <dt>total taps</dt><dd>\${fmt(stats.totalTaps)}</dd>
        <dt>surfaces visited</dt><dd>\${stats.visited} / \${stats.totalSurfaces}</dd>
        <dt>stickers</dt><dd>\${stats.stickers}</dd>
        <dt>daily streak</dt><dd>\${stats.streak}d</dd>
        \${top1 ? \`<dt>top room</dt><dd>\${top1.name}</dd>\` : ''}
      \`;
    }

    function escapeXml(s) {
      return String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
    }

    // Save PNG: render SVG into canvas
    document.getElementById('pc-save').addEventListener('click', () => {
      const host = document.getElementById('pc-card');
      const svgEl = host.querySelector('svg');
      if (!svgEl) return;
      const xml = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200; canvas.height = 750;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 1200, 750);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          const stamp = new Date().toISOString().slice(0, 10);
          a.download = \`pointcast-drum-postcard-\${stamp}.png\`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }, 'image/png');
      };
      img.src = url;
    });

    // Share / copy
    document.getElementById('pc-share').addEventListener('click', async () => {
      const url = 'https://pointcast.xyz/drum-postcard';
      const text = 'my drum hub postcard ·';
      try {
        if (navigator.share) {
          await navigator.share({ title: 'PointCast Drum Postcard', text, url });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          const btn = document.getElementById('pc-share');
          const o = btn.textContent;
          btn.textContent = 'link copied ✓';
          setTimeout(() => { btn.textContent = o; }, 2000);
        }
      } catch {}
    });

    document.getElementById('pc-refresh').addEventListener('click', renderSVG);
    document.getElementById('pc-msg').addEventListener('input', renderSVG);
    document.getElementById('pc-noun').addEventListener('input', renderSVG);
    document.querySelectorAll('.pc__pal').forEach((b) => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.pc__pal').forEach((x) => x.classList.remove('pc__pal--on'));
        b.classList.add('pc__pal--on');
        palette = b.getAttribute('data-pal') || 'paper';
        renderSVG();
      });
    });

    renderSVG();
  })();
<\/script>`], ["", ` <script>
  (function () {
    'use strict';
    const PALETTES = {
      paper:    { bg: '#fffaf0', fg: '#12110e', accent: '#ff5c23', soft: '#5f5e5a', card: '#fff', stamp: '#ffd400', vine: '#3b6e3b' },
      dusk:     { bg: '#1a1228', fg: '#fffaf0', accent: '#ff8a4a', soft: '#cfc6df', card: '#0c0820', stamp: '#ffd400', vine: '#5fbafd' },
      midnight: { bg: '#050310', fg: '#fffaf0', accent: '#5fbafd', soft: '#cfc6df', card: '#0c1d3a', stamp: '#ffd400', vine: '#94d4ff' },
    };
    let palette = 'paper';

    // Sources: same keys the existing surfaces write
    const SURFACES = [
      { id: 'classic',  href: '/drum',          name: 'Classic',         key: 'pc:drumLocalCount',           kind: 'count' },
      { id: 'collab',   href: '/drum-v2',       name: 'Collab',          key: 'pc:drum-v2:tapped',           kind: 'count' },
      { id: 'spotify',  href: '/drum-v3',       name: 'Spotify',         key: 'pc:drum-v3:track-count',      kind: 'count' },
      { id: 'orch',     href: '/drum-v4',       name: 'Orchestra',       key: 'pc:drum-v4:collected',        kind: 'set' },
      { id: 'loops',    href: '/drum-v5',       name: 'Loops',           key: 'pc:drum-v5:shared-count',     kind: 'count' },
      { id: 'choir',    href: '/drum-v6',       name: 'Choir',           key: 'pc:drum-v6:sung',             kind: 'set' },
      { id: 'big',      href: '/drum-v7',       name: 'Big Board',       key: 'pc:drum-v7:played',           kind: 'set' },
      { id: 'symph',    href: '/drum-v8',       name: 'Symphony',        key: 'pc:drum-v8:played',           kind: 'set' },
      { id: 'lounge',   href: '/drum-v9',       name: 'Lounge',          key: 'pc:drum-v9:played',           kind: 'count' },
      { id: 'theremin', href: '/drum-v10',      name: 'Theremin',        key: 'pc:drum-v10:notes',           kind: 'count' },
      { id: 'bells',    href: '/drum-v11',      name: 'Bells',           key: 'pc:drum-v11:rung',            kind: 'set' },
      { id: 'organ',    href: '/drum-v12',      name: 'Pipe Organ',      key: 'pc:drum-v12:notes',           kind: 'count' },
      { id: 'strings',  href: '/drum-v13',      name: 'Strings',         key: 'pc:drum-v13:played',          kind: 'set' },
      { id: 'apr26',    href: '/drum-apr26',    name: 'Sequencer',       key: 'pc:drum-apr26:tapped',        kind: 'count' },
      { id: 'potato',   href: '/drum-potato',   name: 'Hot Potato',      key: 'pc:drum-potato:wins',         kind: 'count' },
      { id: 'pulse',    href: '/drum-pulse',    name: 'Pulse',           key: 'pc:drum-pulse:milestones-seen', kind: 'count' },
      { id: 'agents',   href: '/drum-agents',   name: 'Agents',          key: 'pc:drum-agents:visited',      kind: 'flag' },
      { id: 'daily',    href: '/drum-daily',    name: 'Daily',           key: 'pc:drum-daily:days',          kind: 'set' },
      { id: 'jam',      href: '/drum-jam',      name: 'Jam',             key: 'pc:drum-jam:minutes',         kind: 'count' },
      { id: 'kettle',   href: '/kettle',        name: 'Kettle',          key: 'pc:kettle:my-stokes',         kind: 'count' },
    ];

    function readNum(key) {
      try { const v = Number(localStorage.getItem(key) || 0); return isFinite(v) ? v : 0; } catch { return 0; }
    }
    function readSet(key) {
      try { const raw = localStorage.getItem(key); if (!raw) return 0; const v = JSON.parse(raw); return Array.isArray(v) ? v.length : 0; } catch { return 0; }
    }
    function readFlag(key) {
      try { const v = localStorage.getItem(key); return v && v !== '0' && v !== 'false' ? 1 : 0; } catch { return 0; }
    }
    function val(s) {
      if (s.kind === 'count') return readNum(s.key);
      if (s.kind === 'set')   return readSet(s.key);
      return readFlag(s.key);
    }

    // Compute stats
    function gatherStats() {
      const surfaceVals = SURFACES.map((s) => ({ ...s, v: val(s) }));
      const totalTaps = surfaceVals.reduce((acc, s) => acc + (s.kind === 'count' ? s.v : 0), 0);
      const visited = surfaceVals.filter((s) => s.v > 0);
      const top = [...surfaceVals]
        .filter((s) => s.v > 0)
        .sort((a, b) => b.v - a.v)
        .slice(0, 3);
      // Stickers: count surfaces with any progress
      const stickers = visited.length;
      // Streak — read pc:drum-daily:days (JSON array of date strings) to compute consecutive
      let streak = 0;
      try {
        const raw = localStorage.getItem('pc:drum-daily:days');
        const arr = Array.isArray(JSON.parse(raw || '[]')) ? JSON.parse(raw || '[]') : [];
        // Sort descending; count consecutive UTC days back from today
        const set = new Set(arr);
        const d = new Date();
        for (let i = 0; i < 60; i++) {
          const k = \\\`\\\${d.getUTCFullYear()}-\\\${String(d.getUTCMonth() + 1).padStart(2, '0')}-\\\${String(d.getUTCDate()).padStart(2, '0')}\\\`;
          if (set.has(k)) streak += 1; else break;
          d.setUTCDate(d.getUTCDate() - 1);
        }
      } catch {}
      return { totalTaps, visited: visited.length, top, stickers, streak, totalSurfaces: SURFACES.length };
    }

    function fmtDate() {
      const d = new Date();
      const m = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.getMonth()];
      return \\\`\\\${m} \\\${d.getDate()}, \\\${d.getFullYear()}\\\`;
    }

    function renderSVG() {
      const p = PALETTES[palette];
      const stats = gatherStats();
      const noun = Math.max(0, Math.min(1199, Number(document.getElementById('pc-noun').value || 385)));
      const msg = (document.getElementById('pc-msg').value || '').slice(0, 60);
      const date = fmtDate();
      const top1 = stats.top[0];
      const top2 = stats.top[1];
      const top3 = stats.top[2];
      const fmt = (n) => Number(n).toLocaleString();

      const svg = \\\`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet">
  <rect width="1200" height="750" fill="\\\${p.card}" />
  <rect x="20" y="20" width="1160" height="710" fill="none" stroke="\\\${p.fg}" stroke-width="6" stroke-dasharray="14 10" />
  <rect x="32" y="32" width="1136" height="686" fill="none" stroke="\\\${p.fg}" stroke-width="2" />

  <!-- Stamp -->
  <g transform="translate(1010, 70)">
    <rect width="120" height="120" fill="\\\${p.stamp}" stroke="\\\${p.fg}" stroke-width="3" />
    <text x="60" y="38" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="14" font-weight="700" fill="\\\${p.fg}">POINTCAST</text>
    <text x="60" y="58" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="\\\${p.fg}">DRUM HUB</text>
    <image href="https://noun.pics/\\\${noun}.svg" x="34" y="64" width="52" height="52" />
    <text x="60" y="135" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="\\\${p.fg}">№ \\\${noun}</text>
  </g>

  <!-- Title -->
  <text x="60" y="140" font-family="Georgia, serif" font-size="56" fill="\\\${p.fg}" font-style="italic">your drum hub.</text>
  <text x="60" y="180" font-family="JetBrains Mono, monospace" font-size="14" fill="\\\${p.accent}" letter-spacing="6">RECEIPT · \\\${date}</text>

  <!-- Big number -->
  <text x="60" y="290" font-family="Georgia, serif" font-size="22" fill="\\\${p.soft}">total taps across surfaces</text>
  <text x="60" y="380" font-family="Bungee, Impact, sans-serif" font-size="120" fill="\\\${p.accent}" letter-spacing="6">\\\${fmt(stats.totalTaps)}</text>

  <!-- Top 3 surfaces -->
  <text x="60" y="450" font-family="JetBrains Mono, monospace" font-size="14" fill="\\\${p.accent}" letter-spacing="4">TOP THREE ROOMS</text>
  \\\${top1 ? \\\`
    <text x="60" y="490" font-family="Georgia, serif" font-size="28" fill="\\\${p.fg}">1 · \\\${top1.name}</text>
    <text x="320" y="490" font-family="JetBrains Mono, monospace" font-size="22" fill="\\\${p.accent}">\\\${fmt(top1.v)}</text>
  \\\` : ''}
  \\\${top2 ? \\\`
    <text x="60" y="528" font-family="Georgia, serif" font-size="22" fill="\\\${p.fg}">2 · \\\${top2.name}</text>
    <text x="320" y="528" font-family="JetBrains Mono, monospace" font-size="18" fill="\\\${p.accent}">\\\${fmt(top2.v)}</text>
  \\\` : ''}
  \\\${top3 ? \\\`
    <text x="60" y="562" font-family="Georgia, serif" font-size="20" fill="\\\${p.fg}">3 · \\\${top3.name}</text>
    <text x="320" y="562" font-family="JetBrains Mono, monospace" font-size="16" fill="\\\${p.accent}">\\\${fmt(top3.v)}</text>
  \\\` : ''}
  \\\${stats.top.length === 0 ? \\\`
    <text x="60" y="490" font-family="Georgia, serif" font-size="22" fill="\\\${p.soft}" font-style="italic">play something — your top three will show up here</text>
  \\\` : ''}

  <!-- Right column stats -->
  <g transform="translate(820, 240)">
    <rect width="220" height="72" fill="none" stroke="\\\${p.fg}" stroke-width="2" />
    <text x="14" y="22" font-family="JetBrains Mono, monospace" font-size="10" fill="\\\${p.accent}" letter-spacing="3">STICKERS</text>
    <text x="110" y="56" text-anchor="middle" font-family="Bungee, Impact, sans-serif" font-size="36" fill="\\\${p.fg}">\\\${stats.stickers} / \\\${stats.totalSurfaces}</text>
  </g>
  <g transform="translate(820, 320)">
    <rect width="220" height="72" fill="none" stroke="\\\${p.fg}" stroke-width="2" />
    <text x="14" y="22" font-family="JetBrains Mono, monospace" font-size="10" fill="\\\${p.accent}" letter-spacing="3">DAILY STREAK</text>
    <text x="110" y="56" text-anchor="middle" font-family="Bungee, Impact, sans-serif" font-size="36" fill="\\\${p.fg}">\\\${stats.streak} day\\\${stats.streak === 1 ? '' : 's'}</text>
  </g>
  <g transform="translate(820, 400)">
    <rect width="220" height="72" fill="none" stroke="\\\${p.fg}" stroke-width="2" />
    <text x="14" y="22" font-family="JetBrains Mono, monospace" font-size="10" fill="\\\${p.accent}" letter-spacing="3">SURFACES VISITED</text>
    <text x="110" y="56" text-anchor="middle" font-family="Bungee, Impact, sans-serif" font-size="36" fill="\\\${p.fg}">\\\${stats.visited}</text>
  </g>

  <!-- Signature -->
  <line x1="60" y1="650" x2="700" y2="650" stroke="\\\${p.fg}" stroke-width="2" />
  <text x="60" y="680" font-family="Georgia, serif" font-size="24" fill="\\\${p.fg}" font-style="italic">\\\${escapeXml(msg) || 'signed off · pour something'}</text>
  <text x="60" y="708" font-family="JetBrains Mono, monospace" font-size="11" fill="\\\${p.soft}" letter-spacing="3">— pointcast.xyz / drum-postcard · el segundo</text>

  <!-- Vine flourish -->
  <g transform="translate(840, 600)">
    <path d="M 0 80 Q 40 10 90 60 Q 140 110 200 50 Q 250 10 300 80" fill="none" stroke="\\\${p.vine}" stroke-width="3" />
    <circle cx="20" cy="68" r="4" fill="\\\${p.vine}" />
    <circle cx="100" cy="56" r="4" fill="\\\${p.vine}" />
    <circle cx="180" cy="60" r="4" fill="\\\${p.vine}" />
    <circle cx="280" cy="68" r="4" fill="\\\${p.vine}" />
  </g>
</svg>\\\`;
      document.getElementById('pc-card').innerHTML = svg;

      // Stats panel
      const stEl = document.getElementById('pc-stats');
      stEl.innerHTML = \\\`
        <dt>total taps</dt><dd>\\\${fmt(stats.totalTaps)}</dd>
        <dt>surfaces visited</dt><dd>\\\${stats.visited} / \\\${stats.totalSurfaces}</dd>
        <dt>stickers</dt><dd>\\\${stats.stickers}</dd>
        <dt>daily streak</dt><dd>\\\${stats.streak}d</dd>
        \\\${top1 ? \\\`<dt>top room</dt><dd>\\\${top1.name}</dd>\\\` : ''}
      \\\`;
    }

    function escapeXml(s) {
      return String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
    }

    // Save PNG: render SVG into canvas
    document.getElementById('pc-save').addEventListener('click', () => {
      const host = document.getElementById('pc-card');
      const svgEl = host.querySelector('svg');
      if (!svgEl) return;
      const xml = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200; canvas.height = 750;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 1200, 750);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          const stamp = new Date().toISOString().slice(0, 10);
          a.download = \\\`pointcast-drum-postcard-\\\${stamp}.png\\\`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }, 'image/png');
      };
      img.src = url;
    });

    // Share / copy
    document.getElementById('pc-share').addEventListener('click', async () => {
      const url = 'https://pointcast.xyz/drum-postcard';
      const text = 'my drum hub postcard ·';
      try {
        if (navigator.share) {
          await navigator.share({ title: 'PointCast Drum Postcard', text, url });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          const btn = document.getElementById('pc-share');
          const o = btn.textContent;
          btn.textContent = 'link copied ✓';
          setTimeout(() => { btn.textContent = o; }, 2000);
        }
      } catch {}
    });

    document.getElementById('pc-refresh').addEventListener('click', renderSVG);
    document.getElementById('pc-msg').addEventListener('input', renderSVG);
    document.getElementById('pc-noun').addEventListener('input', renderSVG);
    document.querySelectorAll('.pc__pal').forEach((b) => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.pc__pal').forEach((x) => x.classList.remove('pc__pal--on'));
        b.classList.add('pc__pal--on');
        palette = b.getAttribute('data-pal') || 'paper';
        renderSVG();
      });
    });

    renderSVG();
  })();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-oxfqozzb": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="pc" id="pc-main" data-astro-cid-oxfqozzb> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "postcard", "data-astro-cid-oxfqozzb": true })} <header class="pc__head" data-astro-cid-oxfqozzb> <p class="pc__kicker" data-astro-cid-oxfqozzb>DRUM HUB · POSTCARD · LOCAL · SHAREABLE</p> <h1 class="pc__title" data-astro-cid-oxfqozzb><em data-astro-cid-oxfqozzb>The room sends you a postcard.</em></h1> <p class="pc__dek" data-astro-cid-oxfqozzb>
A souvenir of your drum-hub session. Reads the same localStorage keys the surfaces already write — top three rooms, total taps, sticker count, streak, your signature. Save it as a PNG, send it to a friend, pin it to a wall.
</p> </header> <section class="pc__stage" data-astro-cid-oxfqozzb> <div class="pc__card-frame" data-astro-cid-oxfqozzb> <div id="pc-card" class="pc__card-host" data-astro-cid-oxfqozzb></div> </div> <aside class="pc__panel" data-astro-cid-oxfqozzb> <div class="pc__panel-row" data-astro-cid-oxfqozzb> <span class="pc__panel-label mono" data-astro-cid-oxfqozzb>message</span> <input id="pc-msg" type="text" maxlength="60" placeholder="signed off · pour something" value="signed off · pour something" data-astro-cid-oxfqozzb> </div> <div class="pc__panel-row" data-astro-cid-oxfqozzb> <span class="pc__panel-label mono" data-astro-cid-oxfqozzb>noun id</span> <input id="pc-noun" type="number" min="0" max="1199" value="385" data-astro-cid-oxfqozzb> </div> <div class="pc__panel-row" data-astro-cid-oxfqozzb> <span class="pc__panel-label mono" data-astro-cid-oxfqozzb>palette</span> <div class="pc__palette" role="radiogroup" aria-label="Palette" data-astro-cid-oxfqozzb> <button type="button" class="pc__pal pc__pal--on" data-pal="paper" data-astro-cid-oxfqozzb>paper</button> <button type="button" class="pc__pal" data-pal="dusk" data-astro-cid-oxfqozzb>dusk</button> <button type="button" class="pc__pal" data-pal="midnight" data-astro-cid-oxfqozzb>midnight</button> </div> </div> <div class="pc__panel-divider" data-astro-cid-oxfqozzb></div> <button type="button" class="pc__btn pc__btn--primary" id="pc-save" data-astro-cid-oxfqozzb>Save PNG ↓</button> <button type="button" class="pc__btn" id="pc-share" data-astro-cid-oxfqozzb>Share / copy link</button> <button type="button" class="pc__btn pc__btn--ghost" id="pc-refresh" data-astro-cid-oxfqozzb>↺ refresh stats</button> <div class="pc__panel-divider" data-astro-cid-oxfqozzb></div> <h2 class="pc__panel-h" data-astro-cid-oxfqozzb>your stats</h2> <dl class="pc__stats" id="pc-stats" data-astro-cid-oxfqozzb></dl> </aside> </section> <footer class="pc__foot" data-astro-cid-oxfqozzb> <p data-astro-cid-oxfqozzb>
Postcard reads localStorage keys written by every drum surface
        (<code data-astro-cid-oxfqozzb>pc:drumLocalCount</code>, <code data-astro-cid-oxfqozzb>pc:kettle:my-stokes</code>,
<code data-astro-cid-oxfqozzb>pc:drum-v10:notes</code>, etc.) plus the sticker-binder
        flags from <a href="/drum-stickers" data-astro-cid-oxfqozzb>/drum-stickers</a>. PNG export
        renders the SVG to a canvas at 1200×750. Nothing leaves your
        browser unless you save it.
</p> <p class="pc__credit mono" data-astro-cid-oxfqozzb>v0.1 · 2026-04-28 · Mike Hoydich + Claude Code · El Segundo · sprint 3/4 (batch 2)</p> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-postcard.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-postcard.astro";
const $$url = "/drum-postcard";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumPostcard,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
