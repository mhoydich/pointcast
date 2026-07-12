import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, k as renderTransition, u as unescapeHTML, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$SparrowLayout } from './SparrowLayout_VSvjr4EN.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { a as CHANNEL_LIST } from './channels_C2qW9mSV.mjs';
/* empty css                          */

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const allBlocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const reel = allBlocks.slice(0, 12);
  const recent24 = allBlocks.slice(0, 24);
  const distribution = {};
  for (const b of recent24) {
    distribution[b.data.channel] = (distribution[b.data.channel] ?? 0) + 1;
  }
  const totalRecent = recent24.length || 1;
  const channels = CHANNEL_LIST;
  let runningPct = 0;
  const dialStops = channels.map((ch) => {
    const share = (distribution[ch.code] ?? 0) / totalRecent;
    const from = runningPct;
    const to = runningPct + share * 100;
    runningPct = to;
    return { ch, from, to };
  });
  if (runningPct < 100 && dialStops.length) {
    dialStops[dialStops.length - 1].to = 100;
  }
  const dialGradient = dialStops.filter((s) => s.to > s.from).map((s) => `var(--ch-${s.ch.code.toLowerCase()}) ${s.from.toFixed(2)}% ${s.to.toFixed(2)}%`).join(", ");
  const fmtDate = (d) => d.toISOString().slice(0, 10).replaceAll("-", ".");
  const signalBars = (mood) => mood ? 4 : 3;
  const reelMoods = Array.from(
    new Set(reel.map((b) => b.data.mood).filter((m) => Boolean(m)))
  ).slice(0, 8);
  const friendsLaneLookup = Object.fromEntries(
    allBlocks.map((b) => {
      const ch = CHANNEL_LIST.find((c) => c.code === b.data.channel);
      return [
        b.data.id,
        {
          title: b.data.title,
          channel: b.data.channel,
          channelName: ch?.name ?? b.data.channel
        }
      ];
    })
  );
  return renderTemplate`${renderComponent($$result, "SparrowLayout", $$SparrowLayout, { "title": "Sparrow", "description": "A hosted reader client for PointCast. Tune in at dawn — the broadcast arrives at your perch.", "canonicalPath": "/sparrow", "homeHref": "/" }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<section class="sp-hero"> <figure class="sp-dial"', ' aria-hidden="true"> <div class="sp-dial__ring"></div> <div class="sp-dial__center"> <span class="sp-dial__kicker">now tuning</span> <span class="sp-dial__count">', `</span> <span class="sp-dial__unit">blocks received</span> </div> <div class="sp-dial__needle"></div> </figure> <div class="sp-hero-copy"> <p class="sp-hero-kicker">pointcast.xyz · live broadcast</p> <h1 class="sp-hero-title">
A small bird,<br> <em>at first light,</em><br>
with today's news.
</h1> <p class="sp-hero-dek">
Sparrow reads PointCast so you can skim the signal. The dial shows
        which channels are alive right now; the reel below is the last
        dozen broadcasts, freshest first. Keyboard-first — <kbd>⌘K</kbd>
to jump, <kbd>J</kbd>/<kbd>K</kbd> to glide, <kbd>1</kbd>…<kbd>9</kbd>
for channel jumps, <kbd>S</kbd> to save, <kbd>T</kbd> to flip the theme.
</p> <p class="sp-hero-meta"> <span class="sp-pill sp-pill--on"><span class="sp-pill-dot"></span>receiving</span> <span class="sp-meta-sep">·</span> <span class="sp-meta-k">last</span> <code>`, '</code> <span class="sp-meta-sep">·</span> <a href="/sparrow/about" class="sp-link">about</a> <span class="sp-meta-sep">·</span> <a href="/sparrow/saved" class="sp-link">saved</a> <span class="sp-meta-sep">·</span> <a href="/sparrow/deck" class="sp-link">memo</a> <span class="sp-meta-sep">·</span> <a href="/sparrow/feed.xml" class="sp-link">atom</a> <span class="sp-meta-sep">·</span> <a href="/sparrow.json" class="sp-link">sparrow.json</a> </p> </div> </section> <section class="sp-rosette" aria-label="channels"> <header class="sp-rosette-head"> <span class="sp-kicker">✦ rosette · 9 channels</span> <span class="sp-rosette-hint">\npress <kbd>1</kbd>…<kbd>9</kbd> to jump · or <kbd>G</kbd> then a channel letter — <code>F</code> front door, <code>C</code> court, <code>S</code> spinning…\n</span> </header> <ul class="sp-rosette-grid"> ', ' </ul> </section> <section class="sp-friends-lane" data-sp-friends-lane hidden aria-label="friends reading"> <header class="sp-friends-lane-head"> <span class="sp-kicker">✦ friends · what signers you follow are saving</span> <span class="sp-friends-lane-meta" data-sp-friends-lane-meta></span> <a class="sp-friends-lane-cta" href="/sparrow/friends">manage →</a> <button type="button" class="sp-friends-lane-dismiss" data-sp-friends-lane-dismiss aria-label="hide the friends lane" title="hide · re-enable from /sparrow/friends">×</button> </header> <ol class="sp-friends-lane-rows" data-sp-friends-lane-rows></ol> <p class="sp-friends-lane-empty" data-sp-friends-lane-empty hidden>\nNobody you follow is publishing a public saved list yet.\n<a class="sp-link" href="/sparrow/friends">Add friends →</a> </p> </section> <script id="sp-friends-lane-lookup" type="application/json">', '<\/script> <section class="sp-reel" aria-label="latest broadcasts"> <header class="sp-reel-head"> <span class="sp-kicker">✦ reel · latest broadcasts</span> <input type="search" class="sp-reel-search" placeholder="filter the reel — title, dek, channel" data-sp-search autocomplete="off"> </header> ', ' <ol class="sp-receipts" data-sp-receipts> ', ` </ol> </section> <aside class="sp-beacon" aria-label="beacon"> <span class="sp-beacon-sweep" aria-hidden="true"></span> <span class="sp-beacon-kicker">✦ beacon</span> <span class="sp-beacon-body">
El Segundo · <code>33.9180° N 118.4161° W</code> · listening on all nine channels
</span> <a href="/beacon" class="sp-link sp-beacon-cta">open beacon →</a> </aside> <script>
    // v0.25: friends lane controller.
    //
    // Pulls localStorage["sparrow:friends"] + localStorage["sparrow:profiles"]
    // (populated by /sparrow/friends on a prior visit), opens a short-lived
    // REQ against each configured relay for each friend's latest public
    // saved list (kind 30078 + d-tag sparrow-public-saved-v1), keeps the
    // newest event per author, then renders the top N most-recent saves
    // as receipt rows with profile-picture avatars + resolved titles from
    // the server-shipped sp-friends-lane-lookup blob.
    //
    // Opt-out: localStorage["sparrow:friends-lane-hidden"] === "1" hides
    // the entire section forever (until the user re-enables from
    // /sparrow/friends). Also hidden when the reader hasn't added any
    // friends yet — no point nagging empty.
    (function () {
      const KEY_FRIENDS    = 'sparrow:friends';
      const KEY_PROFILES   = 'sparrow:profiles';
      const KEY_RELAYS     = 'sparrow:nostr-relays';
      const KEY_HIDDEN     = 'sparrow:friends-lane-hidden';
      const D_TAG          = 'sparrow-public-saved-v1';
      const SYNC_KIND      = 30078;
      const MAX_ROWS       = 6;
      const DEFAULT_RELAYS = [
        'wss://relay.damus.io',
        'wss://relay.primal.net',
        'wss://nos.lol',
      ];

      const laneEl    = document.querySelector('[data-sp-friends-lane]');
      const rowsEl    = document.querySelector('[data-sp-friends-lane-rows]');
      const metaEl    = document.querySelector('[data-sp-friends-lane-meta]');
      const emptyEl   = document.querySelector('[data-sp-friends-lane-empty]');
      const dismissEl = document.querySelector('[data-sp-friends-lane-dismiss]');
      if (!laneEl || !rowsEl) return;

      const lookupBlob = document.getElementById('sp-friends-lane-lookup');
      const lookup = lookupBlob ? (() => { try { return JSON.parse(lookupBlob.textContent || '{}'); } catch { return {}; } })() : {};

      const readFriends = () => {
        try {
          const raw = JSON.parse(localStorage.getItem(KEY_FRIENDS) || '[]');
          if (!Array.isArray(raw)) return [];
          return raw
            .map((f) => (typeof f === 'string'
              ? { pubkey: f, alias: '', muted: false }
              : (f && typeof f === 'object' && typeof f.pubkey === 'string')
                ? {
                    pubkey: f.pubkey.toLowerCase(),
                    alias:  (f.alias || '').slice(0, 40),
                    muted:  !!f.muted,
                  }
                : null))
            .filter((f) => f && /^[0-9a-f]{64}$/.test(f.pubkey) && !f.muted);
        } catch { return []; }
      };
      const readProfiles = () => {
        try {
          const raw = JSON.parse(localStorage.getItem(KEY_PROFILES) || '{}');
          return (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
        } catch { return {}; }
      };
      const getRelays = () => {
        try {
          const raw = localStorage.getItem(KEY_RELAYS);
          const list = raw ? JSON.parse(raw) : null;
          if (Array.isArray(list) && list.length) {
            return list.filter((u) => typeof u === 'string' && u.startsWith('ws'));
          }
        } catch {}
        return DEFAULT_RELAYS;
      };

      // Honor explicit opt-out.
      try {
        if (localStorage.getItem(KEY_HIDDEN) === '1') return;
      } catch {}

      const friends = readFriends();
      if (!friends.length) return; // Nothing to render and no point prompting unconditionally.

      // Reveal the section; contents populate as REQ frames land.
      laneEl.hidden = false;
      if (metaEl) metaEl.textContent = \`\${friends.length} following · listening on \${getRelays().length} relays\`;

      dismissEl?.addEventListener('click', () => {
        try { localStorage.setItem(KEY_HIDDEN, '1'); } catch {}
        laneEl.hidden = true;
      });

      // Per-author newest event map; same shape as /sparrow/friends.
      const newestByAuthor = new Map();
      const openSockets = [];
      const subId  = \`sp-ln-\${Math.random().toString(36).slice(2, 10)}\`;
      const filter = {
        kinds: [SYNC_KIND],
        authors: friends.map((f) => f.pubkey),
        '#d': [D_TAG],
        limit: friends.length * 2,
      };
      const relays = getRelays();
      let eoseCount = 0;

      function escapeHTML(s) {
        return (s || '').replace(/[&<>"']/g, (c) => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        }[c]));
      }
      const shortPk = (pk) => (pk ? \`\${pk.slice(0, 8)}…\${pk.slice(-4)}\` : '—');

      function nameFor(pubkey, friend) {
        const prof = readProfiles()[pubkey];
        return friend?.alias
          || (prof && (prof.display_name || prof.name))
          || shortPk(pubkey);
      }
      function pictureFor(pubkey) {
        const prof = readProfiles()[pubkey];
        return prof?.picture || '';
      }

      function ingestEvent(ev) {
        if (!ev || ev.kind !== SYNC_KIND || typeof ev.content !== 'string') return;
        if (typeof ev.pubkey !== 'string' || typeof ev.created_at !== 'number') return;
        const isOurs = Array.isArray(ev.tags) && ev.tags.some(
          (t) => Array.isArray(t) && t[0] === 'd' && t[1] === D_TAG,
        );
        if (!isOurs) return;
        let body;
        try { body = JSON.parse(ev.content); } catch { return; }
        if (!body || typeof body !== 'object') return;
        const savedValue = body?.saved?.value;
        if (!Array.isArray(savedValue)) return;
        const prior = newestByAuthor.get(ev.pubkey);
        if (!prior || ev.created_at > prior.created_at) {
          newestByAuthor.set(ev.pubkey, { created_at: ev.created_at, saved: savedValue });
        }
      }

      // Build + paint the lane. Strategy: take each friend's freshest
      // saved[0] (their most recent save) and render one row per
      // friend — up to MAX_ROWS — sorted by event created_at desc so
      // the most-recently-updated friend is on top. This keeps the
      // lane compact AND honors "show me what my friends just saved."
      function paintLane() {
        const friendsLive = readFriends(); // refetch in case a paint happens after edits
        const rows = [];
        for (const f of friendsLive) {
          const entry = newestByAuthor.get(f.pubkey);
          if (!entry) continue;
          const firstId = entry.saved.find((id) => typeof id === 'string');
          if (!firstId) continue;
          rows.push({
            friend: f,
            created_at: entry.created_at,
            blockId: firstId,
            saved_count: entry.saved.length,
          });
        }
        rows.sort((a, b) => b.created_at - a.created_at);
        const visible = rows.slice(0, MAX_ROWS);

        if (emptyEl) emptyEl.hidden = visible.length > 0;
        rowsEl.innerHTML = '';

        for (const r of visible) {
          const meta = lookup[r.blockId] || null;
          const name = nameFor(r.friend.pubkey, r.friend);
          const pic  = pictureFor(r.friend.pubkey);
          const li = document.createElement('li');
          li.className = 'sp-friends-lane-row';
          if (meta?.channel) li.style.setProperty('--ch', \`var(--ch-\${meta.channel.toLowerCase()})\`);
          li.innerHTML = \`
            <a href="/sparrow/b/\${r.blockId}" class="sp-friends-lane-link" data-sp-block-id="\${r.blockId}">
              \${pic
                ? \`<img class="sp-friends-lane-pic" src="\${escapeHTML(pic)}" alt="" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="this.style.display='none'" />\`
                : \`<span class="sp-friends-lane-pic sp-friends-lane-pic-placeholder" aria-hidden="true">✦</span>\`}
              <span class="sp-friends-lane-name" title="\${escapeHTML(r.friend.pubkey)}">\${escapeHTML(name)}</span>
              <span class="sp-friends-lane-arrow">saved</span>
              <span class="sp-friends-lane-id">№ \${escapeHTML(r.blockId)}</span>
              <span class="sp-friends-lane-title">\${escapeHTML(meta?.title || 'unknown block')}</span>
              \${meta ? \`<span class="sp-friends-lane-chip">\${escapeHTML(meta.channelName)}</span>\` : ''}
              \${r.saved_count > 1 ? \`<span class="sp-friends-lane-more">+ \${r.saved_count - 1}</span>\` : ''}
            </a>
          \`;
          rowsEl.appendChild(li);
        }
      }

      for (const url of relays) {
        try {
          const ws = new WebSocket(url);
          openSockets.push(ws);
          ws.addEventListener('open', () => {
            try { ws.send(JSON.stringify(['REQ', subId, filter])); } catch {}
          });
          ws.addEventListener('message', (msg) => {
            let frame;
            try { frame = JSON.parse(msg.data); } catch { return; }
            if (!Array.isArray(frame)) return;
            if (frame[0] === 'EVENT' && frame[1] === subId && frame[2]) {
              ingestEvent(frame[2]);
            } else if (frame[0] === 'EOSE' && frame[1] === subId) {
              try { ws.send(JSON.stringify(['CLOSE', subId])); } catch {}
              try { ws.close(); } catch {}
              eoseCount++;
              paintLane();
            }
          });
          setTimeout(() => { try { if (ws.readyState <= 1) ws.close(); } catch {} }, 6000);
        } catch {}
      }

      // Safety paint so the lane doesn't sit blank if no EOSE lands.
      setTimeout(() => { if (!eoseCount) paintLane(); }, 2500);

      window.addEventListener('beforeunload', () => {
        for (const ws of openSockets) { try { ws.close(); } catch {} }
      });
    })();
  <\/script> `], [" ", '<section class="sp-hero"> <figure class="sp-dial"', ' aria-hidden="true"> <div class="sp-dial__ring"></div> <div class="sp-dial__center"> <span class="sp-dial__kicker">now tuning</span> <span class="sp-dial__count">', `</span> <span class="sp-dial__unit">blocks received</span> </div> <div class="sp-dial__needle"></div> </figure> <div class="sp-hero-copy"> <p class="sp-hero-kicker">pointcast.xyz · live broadcast</p> <h1 class="sp-hero-title">
A small bird,<br> <em>at first light,</em><br>
with today's news.
</h1> <p class="sp-hero-dek">
Sparrow reads PointCast so you can skim the signal. The dial shows
        which channels are alive right now; the reel below is the last
        dozen broadcasts, freshest first. Keyboard-first — <kbd>⌘K</kbd>
to jump, <kbd>J</kbd>/<kbd>K</kbd> to glide, <kbd>1</kbd>…<kbd>9</kbd>
for channel jumps, <kbd>S</kbd> to save, <kbd>T</kbd> to flip the theme.
</p> <p class="sp-hero-meta"> <span class="sp-pill sp-pill--on"><span class="sp-pill-dot"></span>receiving</span> <span class="sp-meta-sep">·</span> <span class="sp-meta-k">last</span> <code>`, '</code> <span class="sp-meta-sep">·</span> <a href="/sparrow/about" class="sp-link">about</a> <span class="sp-meta-sep">·</span> <a href="/sparrow/saved" class="sp-link">saved</a> <span class="sp-meta-sep">·</span> <a href="/sparrow/deck" class="sp-link">memo</a> <span class="sp-meta-sep">·</span> <a href="/sparrow/feed.xml" class="sp-link">atom</a> <span class="sp-meta-sep">·</span> <a href="/sparrow.json" class="sp-link">sparrow.json</a> </p> </div> </section> <section class="sp-rosette" aria-label="channels"> <header class="sp-rosette-head"> <span class="sp-kicker">✦ rosette · 9 channels</span> <span class="sp-rosette-hint">\npress <kbd>1</kbd>…<kbd>9</kbd> to jump · or <kbd>G</kbd> then a channel letter — <code>F</code> front door, <code>C</code> court, <code>S</code> spinning…\n</span> </header> <ul class="sp-rosette-grid"> ', ' </ul> </section> <section class="sp-friends-lane" data-sp-friends-lane hidden aria-label="friends reading"> <header class="sp-friends-lane-head"> <span class="sp-kicker">✦ friends · what signers you follow are saving</span> <span class="sp-friends-lane-meta" data-sp-friends-lane-meta></span> <a class="sp-friends-lane-cta" href="/sparrow/friends">manage →</a> <button type="button" class="sp-friends-lane-dismiss" data-sp-friends-lane-dismiss aria-label="hide the friends lane" title="hide · re-enable from /sparrow/friends">×</button> </header> <ol class="sp-friends-lane-rows" data-sp-friends-lane-rows></ol> <p class="sp-friends-lane-empty" data-sp-friends-lane-empty hidden>\nNobody you follow is publishing a public saved list yet.\n<a class="sp-link" href="/sparrow/friends">Add friends →</a> </p> </section> <script id="sp-friends-lane-lookup" type="application/json">', '<\/script> <section class="sp-reel" aria-label="latest broadcasts"> <header class="sp-reel-head"> <span class="sp-kicker">✦ reel · latest broadcasts</span> <input type="search" class="sp-reel-search" placeholder="filter the reel — title, dek, channel" data-sp-search autocomplete="off"> </header> ', ' <ol class="sp-receipts" data-sp-receipts> ', ` </ol> </section> <aside class="sp-beacon" aria-label="beacon"> <span class="sp-beacon-sweep" aria-hidden="true"></span> <span class="sp-beacon-kicker">✦ beacon</span> <span class="sp-beacon-body">
El Segundo · <code>33.9180° N 118.4161° W</code> · listening on all nine channels
</span> <a href="/beacon" class="sp-link sp-beacon-cta">open beacon →</a> </aside> <script>
    // v0.25: friends lane controller.
    //
    // Pulls localStorage["sparrow:friends"] + localStorage["sparrow:profiles"]
    // (populated by /sparrow/friends on a prior visit), opens a short-lived
    // REQ against each configured relay for each friend's latest public
    // saved list (kind 30078 + d-tag sparrow-public-saved-v1), keeps the
    // newest event per author, then renders the top N most-recent saves
    // as receipt rows with profile-picture avatars + resolved titles from
    // the server-shipped sp-friends-lane-lookup blob.
    //
    // Opt-out: localStorage["sparrow:friends-lane-hidden"] === "1" hides
    // the entire section forever (until the user re-enables from
    // /sparrow/friends). Also hidden when the reader hasn't added any
    // friends yet — no point nagging empty.
    (function () {
      const KEY_FRIENDS    = 'sparrow:friends';
      const KEY_PROFILES   = 'sparrow:profiles';
      const KEY_RELAYS     = 'sparrow:nostr-relays';
      const KEY_HIDDEN     = 'sparrow:friends-lane-hidden';
      const D_TAG          = 'sparrow-public-saved-v1';
      const SYNC_KIND      = 30078;
      const MAX_ROWS       = 6;
      const DEFAULT_RELAYS = [
        'wss://relay.damus.io',
        'wss://relay.primal.net',
        'wss://nos.lol',
      ];

      const laneEl    = document.querySelector('[data-sp-friends-lane]');
      const rowsEl    = document.querySelector('[data-sp-friends-lane-rows]');
      const metaEl    = document.querySelector('[data-sp-friends-lane-meta]');
      const emptyEl   = document.querySelector('[data-sp-friends-lane-empty]');
      const dismissEl = document.querySelector('[data-sp-friends-lane-dismiss]');
      if (!laneEl || !rowsEl) return;

      const lookupBlob = document.getElementById('sp-friends-lane-lookup');
      const lookup = lookupBlob ? (() => { try { return JSON.parse(lookupBlob.textContent || '{}'); } catch { return {}; } })() : {};

      const readFriends = () => {
        try {
          const raw = JSON.parse(localStorage.getItem(KEY_FRIENDS) || '[]');
          if (!Array.isArray(raw)) return [];
          return raw
            .map((f) => (typeof f === 'string'
              ? { pubkey: f, alias: '', muted: false }
              : (f && typeof f === 'object' && typeof f.pubkey === 'string')
                ? {
                    pubkey: f.pubkey.toLowerCase(),
                    alias:  (f.alias || '').slice(0, 40),
                    muted:  !!f.muted,
                  }
                : null))
            .filter((f) => f && /^[0-9a-f]{64}$/.test(f.pubkey) && !f.muted);
        } catch { return []; }
      };
      const readProfiles = () => {
        try {
          const raw = JSON.parse(localStorage.getItem(KEY_PROFILES) || '{}');
          return (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
        } catch { return {}; }
      };
      const getRelays = () => {
        try {
          const raw = localStorage.getItem(KEY_RELAYS);
          const list = raw ? JSON.parse(raw) : null;
          if (Array.isArray(list) && list.length) {
            return list.filter((u) => typeof u === 'string' && u.startsWith('ws'));
          }
        } catch {}
        return DEFAULT_RELAYS;
      };

      // Honor explicit opt-out.
      try {
        if (localStorage.getItem(KEY_HIDDEN) === '1') return;
      } catch {}

      const friends = readFriends();
      if (!friends.length) return; // Nothing to render and no point prompting unconditionally.

      // Reveal the section; contents populate as REQ frames land.
      laneEl.hidden = false;
      if (metaEl) metaEl.textContent = \\\`\\\${friends.length} following · listening on \\\${getRelays().length} relays\\\`;

      dismissEl?.addEventListener('click', () => {
        try { localStorage.setItem(KEY_HIDDEN, '1'); } catch {}
        laneEl.hidden = true;
      });

      // Per-author newest event map; same shape as /sparrow/friends.
      const newestByAuthor = new Map();
      const openSockets = [];
      const subId  = \\\`sp-ln-\\\${Math.random().toString(36).slice(2, 10)}\\\`;
      const filter = {
        kinds: [SYNC_KIND],
        authors: friends.map((f) => f.pubkey),
        '#d': [D_TAG],
        limit: friends.length * 2,
      };
      const relays = getRelays();
      let eoseCount = 0;

      function escapeHTML(s) {
        return (s || '').replace(/[&<>"']/g, (c) => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        }[c]));
      }
      const shortPk = (pk) => (pk ? \\\`\\\${pk.slice(0, 8)}…\\\${pk.slice(-4)}\\\` : '—');

      function nameFor(pubkey, friend) {
        const prof = readProfiles()[pubkey];
        return friend?.alias
          || (prof && (prof.display_name || prof.name))
          || shortPk(pubkey);
      }
      function pictureFor(pubkey) {
        const prof = readProfiles()[pubkey];
        return prof?.picture || '';
      }

      function ingestEvent(ev) {
        if (!ev || ev.kind !== SYNC_KIND || typeof ev.content !== 'string') return;
        if (typeof ev.pubkey !== 'string' || typeof ev.created_at !== 'number') return;
        const isOurs = Array.isArray(ev.tags) && ev.tags.some(
          (t) => Array.isArray(t) && t[0] === 'd' && t[1] === D_TAG,
        );
        if (!isOurs) return;
        let body;
        try { body = JSON.parse(ev.content); } catch { return; }
        if (!body || typeof body !== 'object') return;
        const savedValue = body?.saved?.value;
        if (!Array.isArray(savedValue)) return;
        const prior = newestByAuthor.get(ev.pubkey);
        if (!prior || ev.created_at > prior.created_at) {
          newestByAuthor.set(ev.pubkey, { created_at: ev.created_at, saved: savedValue });
        }
      }

      // Build + paint the lane. Strategy: take each friend's freshest
      // saved[0] (their most recent save) and render one row per
      // friend — up to MAX_ROWS — sorted by event created_at desc so
      // the most-recently-updated friend is on top. This keeps the
      // lane compact AND honors "show me what my friends just saved."
      function paintLane() {
        const friendsLive = readFriends(); // refetch in case a paint happens after edits
        const rows = [];
        for (const f of friendsLive) {
          const entry = newestByAuthor.get(f.pubkey);
          if (!entry) continue;
          const firstId = entry.saved.find((id) => typeof id === 'string');
          if (!firstId) continue;
          rows.push({
            friend: f,
            created_at: entry.created_at,
            blockId: firstId,
            saved_count: entry.saved.length,
          });
        }
        rows.sort((a, b) => b.created_at - a.created_at);
        const visible = rows.slice(0, MAX_ROWS);

        if (emptyEl) emptyEl.hidden = visible.length > 0;
        rowsEl.innerHTML = '';

        for (const r of visible) {
          const meta = lookup[r.blockId] || null;
          const name = nameFor(r.friend.pubkey, r.friend);
          const pic  = pictureFor(r.friend.pubkey);
          const li = document.createElement('li');
          li.className = 'sp-friends-lane-row';
          if (meta?.channel) li.style.setProperty('--ch', \\\`var(--ch-\\\${meta.channel.toLowerCase()})\\\`);
          li.innerHTML = \\\`
            <a href="/sparrow/b/\\\${r.blockId}" class="sp-friends-lane-link" data-sp-block-id="\\\${r.blockId}">
              \\\${pic
                ? \\\`<img class="sp-friends-lane-pic" src="\\\${escapeHTML(pic)}" alt="" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="this.style.display='none'" />\\\`
                : \\\`<span class="sp-friends-lane-pic sp-friends-lane-pic-placeholder" aria-hidden="true">✦</span>\\\`}
              <span class="sp-friends-lane-name" title="\\\${escapeHTML(r.friend.pubkey)}">\\\${escapeHTML(name)}</span>
              <span class="sp-friends-lane-arrow">saved</span>
              <span class="sp-friends-lane-id">№ \\\${escapeHTML(r.blockId)}</span>
              <span class="sp-friends-lane-title">\\\${escapeHTML(meta?.title || 'unknown block')}</span>
              \\\${meta ? \\\`<span class="sp-friends-lane-chip">\\\${escapeHTML(meta.channelName)}</span>\\\` : ''}
              \\\${r.saved_count > 1 ? \\\`<span class="sp-friends-lane-more">+ \\\${r.saved_count - 1}</span>\\\` : ''}
            </a>
          \\\`;
          rowsEl.appendChild(li);
        }
      }

      for (const url of relays) {
        try {
          const ws = new WebSocket(url);
          openSockets.push(ws);
          ws.addEventListener('open', () => {
            try { ws.send(JSON.stringify(['REQ', subId, filter])); } catch {}
          });
          ws.addEventListener('message', (msg) => {
            let frame;
            try { frame = JSON.parse(msg.data); } catch { return; }
            if (!Array.isArray(frame)) return;
            if (frame[0] === 'EVENT' && frame[1] === subId && frame[2]) {
              ingestEvent(frame[2]);
            } else if (frame[0] === 'EOSE' && frame[1] === subId) {
              try { ws.send(JSON.stringify(['CLOSE', subId])); } catch {}
              try { ws.close(); } catch {}
              eoseCount++;
              paintLane();
            }
          });
          setTimeout(() => { try { if (ws.readyState <= 1) ws.close(); } catch {} }, 6000);
        } catch {}
      }

      // Safety paint so the lane doesn't sit blank if no EOSE lands.
      setTimeout(() => { if (!eoseCount) paintLane(); }, 2500);

      window.addEventListener('beforeunload', () => {
        for (const ws of openSockets) { try { ws.close(); } catch {} }
      });
    })();
  <\/script> `])), maybeRenderHead(), addAttribute(`--dial-gradient: ${dialGradient};`, "style"), allBlocks.length, reel[0] ? fmtDate(reel[0].data.timestamp) : "—", channels.map((ch, i) => renderTemplate`<li class="sp-petal"${addAttribute(`--petal: var(--ch-${ch.code.toLowerCase()});`, "style")}> <a${addAttribute(`/sparrow/ch/${ch.slug}`, "href")}${addAttribute(ch.code, "data-sp-channel")}> <span class="sp-petal-code">${ch.code}</span> <span class="sp-petal-name">${ch.name}</span> <span class="sp-petal-count">${i + 1} · ${distribution[ch.code] ?? 0}</span> <span class="sp-petal-purpose">${ch.purpose}</span> </a> </li>`), unescapeHTML(JSON.stringify(friendsLaneLookup)), reelMoods.length > 0 && renderTemplate`<div class="sp-moods" aria-label="mood filter"> <span class="sp-kicker" style="color: var(--sp-mute); margin-right: 6px;">moods</span> ${reelMoods.map((m) => renderTemplate`<button type="button" class="sp-mood-chip"${addAttribute(m, "data-sp-mood")}>${m}</button>`)} </div>`, reel.map((b, i) => {
    const ch = channels.find((c) => c.code === b.data.channel);
    return renderTemplate`<li class="sp-receipt"${addAttribute(`--ch: var(--ch-${b.data.channel.toLowerCase()});`, "style")}${addAttribute(b.data.channel, "data-sp-ch")}${addAttribute(i, "data-sp-idx")}${addAttribute(b.data.id, "data-sp-block-id")}${addAttribute(b.data.mood ?? "", "data-sp-mood")}> <a${addAttribute(`/sparrow/b/${b.data.id}`, "href")}${addAttribute(renderTransition($$result2, "6j23omou", "", `b-${b.data.id}`), "data-astro-transition-scope")}> <header class="sp-r-head"> <span class="sp-r-stamp" aria-hidden="true"> <span class="sp-r-stamp__ch">${b.data.channel}</span> <span class="sp-r-stamp__type">${b.data.type}</span> </span> <span class="sp-r-meta"> <span class="sp-r-id">№ ${b.data.id}</span> <span class="sp-r-sep">·</span> <time${addAttribute(b.data.timestamp.toISOString(), "datetime")}>${fmtDate(b.data.timestamp)}</time> </span> </header> <h3 class="sp-r-title">${b.data.title}</h3> ${b.data.dek && renderTemplate`<p class="sp-r-dek">${b.data.dek}</p>`} <footer class="sp-r-foot"> <span class="sp-r-bars"${addAttribute(signalBars(b.data.mood), "data-bars")} aria-hidden="true"> <i></i><i></i><i></i><i></i><i></i> </span> <span class="sp-r-channel-name">${ch?.name ?? b.data.channel}</span> ${b.data.mood && renderTemplate`<span class="sp-r-mood">· mood <code>${b.data.mood}</code></span>`} </footer> </a> </li>`;
  })) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sparrow/index.astro", "self");

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sparrow/index.astro";
const $$url = "/sparrow";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Index,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
