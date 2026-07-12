import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, k as renderTransition, u as unescapeHTML, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$SparrowLayout } from './SparrowLayout_VSvjr4EN.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { a as CHANNEL_LIST, g as getChannel } from './channels_C2qW9mSV.mjs';
/* empty css                          */

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
async function getStaticPaths() {
  return CHANNEL_LIST.map((ch) => ({ params: { slug: ch.slug } }));
}
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  const ch = getChannel(slug || "");
  if (!ch) {
    return Astro2.redirect("/sparrow");
  }
  const all = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const blocks = all.filter((b) => b.data.channel === ch.code);
  const firstBlock = blocks[blocks.length - 1];
  const lastBlock = blocks[0];
  const moods = Array.from(
    new Set(blocks.map((b) => b.data.mood).filter((m) => Boolean(m)))
  ).slice(0, 10);
  const fmtDate = (d) => d.toISOString().slice(0, 10).replaceAll("-", ".");
  const signalBars = (mood) => mood ? 4 : 3;
  const channelBlockIds = blocks.map((b) => b.data.id);
  const channelLookup = Object.fromEntries(
    blocks.map((b) => [b.data.id, { title: b.data.title }])
  );
  return renderTemplate`${renderComponent($$result, "SparrowLayout", $$SparrowLayout, { "title": `${ch.name} — ${ch.code}`, "description": `${ch.name} on Sparrow — ${ch.purpose}`, "canonicalPath": `/sparrow/ch/${ch.slug}`, "homeHref": "/sparrow" }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<section class="sp-channel-hero"', '> <span class="sp-channel-code">CH · ', '</span> <h1 class="sp-channel-name">', '</h1> <p class="sp-channel-purpose">', '</p> <div class="sp-channel-meta"> <span><strong>', "</strong> blocks</span> ", " <span> <a", ' class="sp-link">pointcast channel →</a> </span> <span> <a', ' class="sp-link">rss →</a> </span> </div> </section> <section class="sp-ch-friends" data-sp-ch-friends hidden', '> <header class="sp-ch-friends-head"> <span class="sp-kicker">✦ friends on ', '</span> <span class="sp-ch-friends-meta" data-sp-ch-friends-meta></span> <a class="sp-ch-friends-cta" href="/sparrow/signals">full signals →</a> <button type="button" class="sp-ch-friends-dismiss" data-sp-ch-friends-dismiss aria-label="hide friends panel on this channel" title="hide · re-enable from localStorage">×</button> </header> <ol class="sp-ch-friends-rows" data-sp-ch-friends-rows></ol> </section> <script id="sp-ch-friends-data" type="application/json">', '<\/script> <section class="sp-reel"', '> <header class="sp-reel-head"> <span class="sp-kicker">✦ all broadcasts in ', '</span> <input type="search" class="sp-reel-search"', ' data-sp-search autocomplete="off"> </header> ', " ", ` </section> <aside class="sp-beacon" aria-label="back to rosette"> <span class="sp-beacon-sweep" aria-hidden="true"></span> <span class="sp-beacon-kicker">✦ rosette</span> <span class="sp-beacon-body">
jump to another channel — press <kbd>1</kbd>…<kbd>9</kbd> or <kbd>G</kbd> </span> <a href="/sparrow" class="sp-link sp-beacon-cta">back to rosette →</a> </aside> <script>
    // v0.29: per-channel friends panel controller. Pulls followed
    // (non-muted) friends' latest public saved lists, filters saves
    // to this channel's block id set, aggregates count + first-picker,
    // renders the top 6. No new endpoint — same kind-30078 d-tag as
    // /sparrow/signals and /sparrow/friends.
    (function () {
      const KEY_FRIENDS      = 'sparrow:friends';
      const KEY_PROFILES     = 'sparrow:profiles';
      const KEY_RELAYS       = 'sparrow:nostr-relays';
      const KEY_HIDDEN       = 'sparrow:ch-friends-hidden';
      const D_TAG            = 'sparrow-public-saved-v1';
      const SYNC_KIND        = 30078;
      const MAX_ROWS         = 6;
      const DEFAULT_RELAYS = [
        'wss://relay.damus.io',
        'wss://relay.primal.net',
        'wss://nos.lol',
      ];
      try { if (localStorage.getItem(KEY_HIDDEN) === '1') return; } catch {}

      const dataBlob = document.getElementById('sp-ch-friends-data');
      const data = dataBlob ? (() => { try { return JSON.parse(dataBlob.textContent || '{}'); } catch { return {}; } })() : {};
      const channelBlockIds = Array.isArray(data.channelBlockIds) ? data.channelBlockIds : [];
      const channelLookup = data.channelLookup || {};
      const channelCode = data.channelCode || '';
      if (!channelBlockIds.length) return;
      const channelBlockSet = new Set(channelBlockIds);

      const sectionEl = document.querySelector('[data-sp-ch-friends]');
      const rowsEl    = document.querySelector('[data-sp-ch-friends-rows]');
      const metaEl    = document.querySelector('[data-sp-ch-friends-meta]');
      const dismissEl = document.querySelector('[data-sp-ch-friends-dismiss]');
      if (!sectionEl || !rowsEl) return;

      const readFriends = () => {
        try {
          const raw = JSON.parse(localStorage.getItem(KEY_FRIENDS) || '[]');
          if (!Array.isArray(raw)) return [];
          return raw
            .map((f) => (typeof f === 'string'
              ? { pubkey: f, alias: '', muted: false }
              : (f && typeof f === 'object' && typeof f.pubkey === 'string')
                ? { pubkey: f.pubkey.toLowerCase(), alias: (f.alias || '').slice(0, 40), muted: !!f.muted }
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
          if (Array.isArray(list) && list.length) return list.filter((u) => typeof u === 'string' && u.startsWith('ws'));
        } catch {}
        return DEFAULT_RELAYS;
      };
      function escapeHTML(s) {
        return (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
      }
      const shortPk = (pk) => (pk ? \`\${pk.slice(0, 8)}…\${pk.slice(-4)}\` : '—');
      function nameFor(pubkey, friend) {
        const prof = readProfiles()[pubkey];
        return friend?.alias || (prof && (prof.display_name || prof.name)) || shortPk(pubkey);
      }

      const friends = readFriends();
      if (!friends.length) return;

      dismissEl?.addEventListener('click', () => {
        try { localStorage.setItem(KEY_HIDDEN, '1'); } catch {}
        sectionEl.hidden = true;
      });

      const newestByAuthor = new Map();
      const openSockets = [];
      const authors = friends.map((f) => f.pubkey);
      const subId = \`sp-chfr-\${Math.random().toString(36).slice(2, 10)}\`;
      const filter = { kinds: [SYNC_KIND], authors, '#d': [D_TAG], limit: authors.length * 2 };
      const relays = getRelays();

      function ingest(ev) {
        if (!ev || ev.kind !== SYNC_KIND || typeof ev.content !== 'string') return;
        if (typeof ev.pubkey !== 'string' || typeof ev.created_at !== 'number') return;
        const isOurs = Array.isArray(ev.tags) && ev.tags.some((t) => Array.isArray(t) && t[0] === 'd' && t[1] === D_TAG);
        if (!isOurs) return;
        let body;
        try { body = JSON.parse(ev.content); } catch { return; }
        const saved = Array.isArray(body?.saved?.value) ? body.saved.value : [];
        const prior = newestByAuthor.get(ev.pubkey);
        if (!prior || ev.created_at > prior.created_at) {
          newestByAuthor.set(ev.pubkey, { created_at: ev.created_at, saved });
        }
      }

      function paint() {
        const friendsLive = readFriends();
        const counts = new Map(); // blockId → { count, savers:Set, firstPicker, firstAt }
        for (const [pubkey, entry] of newestByAuthor) {
          if (!friendsLive.some((f) => f.pubkey === pubkey)) continue;
          const seen = new Set();
          for (const id of entry.saved) {
            if (typeof id !== 'string' || seen.has(id) || !channelBlockSet.has(id)) continue;
            seen.add(id);
            const slot = counts.get(id) || { count: 0, savers: new Set(), firstPicker: pubkey, firstAt: entry.created_at };
            slot.count += 1;
            slot.savers.add(pubkey);
            if (entry.created_at < slot.firstAt) {
              slot.firstPicker = pubkey;
              slot.firstAt = entry.created_at;
            }
            counts.set(id, slot);
          }
        }
        const rows = Array.from(counts.entries())
          .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
          .slice(0, MAX_ROWS);

        if (!rows.length) {
          sectionEl.hidden = true;
          return;
        }
        sectionEl.hidden = false;
        if (metaEl) metaEl.textContent = \`\${rows.length} in \${channelCode} · \${friendsLive.length} following\`;

        rowsEl.innerHTML = '';
        for (const [id, info] of rows) {
          const meta = channelLookup[id] || {};
          const pickerFriend = friendsLive.find((f) => f.pubkey === info.firstPicker);
          const pickerName = pickerFriend ? nameFor(info.firstPicker, pickerFriend) : shortPk(info.firstPicker);
          const saverCount = info.savers.size;
          const li = document.createElement('li');
          li.className = 'sp-ch-friends-row';
          li.innerHTML = \`
            <a href="/sparrow/b/\${escapeHTML(id)}" class="sp-ch-friends-link">
              <span class="sp-ch-friends-badge">×\${saverCount}</span>
              <span class="sp-ch-friends-id">№ \${escapeHTML(id)}</span>
              <span class="sp-ch-friends-title">\${escapeHTML(meta.title || 'unknown block')}</span>
              <span class="sp-ch-friends-picker">⭐ \${escapeHTML(pickerName)}</span>
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
              ingest(frame[2]);
            } else if (frame[0] === 'EOSE' && frame[1] === subId) {
              try { ws.send(JSON.stringify(['CLOSE', subId])); } catch {}
              try { ws.close(); } catch {}
              paint();
            }
          });
          setTimeout(() => { try { if (ws.readyState <= 1) ws.close(); } catch {} }, 6000);
        } catch {}
      }
      setTimeout(paint, 2500);

      window.addEventListener('beforeunload', () => {
        for (const ws of openSockets) { try { ws.close(); } catch {} }
      });
    })();
  <\/script> `], [" ", '<section class="sp-channel-hero"', '> <span class="sp-channel-code">CH · ', '</span> <h1 class="sp-channel-name">', '</h1> <p class="sp-channel-purpose">', '</p> <div class="sp-channel-meta"> <span><strong>', "</strong> blocks</span> ", " <span> <a", ' class="sp-link">pointcast channel →</a> </span> <span> <a', ' class="sp-link">rss →</a> </span> </div> </section> <section class="sp-ch-friends" data-sp-ch-friends hidden', '> <header class="sp-ch-friends-head"> <span class="sp-kicker">✦ friends on ', '</span> <span class="sp-ch-friends-meta" data-sp-ch-friends-meta></span> <a class="sp-ch-friends-cta" href="/sparrow/signals">full signals →</a> <button type="button" class="sp-ch-friends-dismiss" data-sp-ch-friends-dismiss aria-label="hide friends panel on this channel" title="hide · re-enable from localStorage">×</button> </header> <ol class="sp-ch-friends-rows" data-sp-ch-friends-rows></ol> </section> <script id="sp-ch-friends-data" type="application/json">', '<\/script> <section class="sp-reel"', '> <header class="sp-reel-head"> <span class="sp-kicker">✦ all broadcasts in ', '</span> <input type="search" class="sp-reel-search"', ' data-sp-search autocomplete="off"> </header> ', " ", ` </section> <aside class="sp-beacon" aria-label="back to rosette"> <span class="sp-beacon-sweep" aria-hidden="true"></span> <span class="sp-beacon-kicker">✦ rosette</span> <span class="sp-beacon-body">
jump to another channel — press <kbd>1</kbd>…<kbd>9</kbd> or <kbd>G</kbd> </span> <a href="/sparrow" class="sp-link sp-beacon-cta">back to rosette →</a> </aside> <script>
    // v0.29: per-channel friends panel controller. Pulls followed
    // (non-muted) friends' latest public saved lists, filters saves
    // to this channel's block id set, aggregates count + first-picker,
    // renders the top 6. No new endpoint — same kind-30078 d-tag as
    // /sparrow/signals and /sparrow/friends.
    (function () {
      const KEY_FRIENDS      = 'sparrow:friends';
      const KEY_PROFILES     = 'sparrow:profiles';
      const KEY_RELAYS       = 'sparrow:nostr-relays';
      const KEY_HIDDEN       = 'sparrow:ch-friends-hidden';
      const D_TAG            = 'sparrow-public-saved-v1';
      const SYNC_KIND        = 30078;
      const MAX_ROWS         = 6;
      const DEFAULT_RELAYS = [
        'wss://relay.damus.io',
        'wss://relay.primal.net',
        'wss://nos.lol',
      ];
      try { if (localStorage.getItem(KEY_HIDDEN) === '1') return; } catch {}

      const dataBlob = document.getElementById('sp-ch-friends-data');
      const data = dataBlob ? (() => { try { return JSON.parse(dataBlob.textContent || '{}'); } catch { return {}; } })() : {};
      const channelBlockIds = Array.isArray(data.channelBlockIds) ? data.channelBlockIds : [];
      const channelLookup = data.channelLookup || {};
      const channelCode = data.channelCode || '';
      if (!channelBlockIds.length) return;
      const channelBlockSet = new Set(channelBlockIds);

      const sectionEl = document.querySelector('[data-sp-ch-friends]');
      const rowsEl    = document.querySelector('[data-sp-ch-friends-rows]');
      const metaEl    = document.querySelector('[data-sp-ch-friends-meta]');
      const dismissEl = document.querySelector('[data-sp-ch-friends-dismiss]');
      if (!sectionEl || !rowsEl) return;

      const readFriends = () => {
        try {
          const raw = JSON.parse(localStorage.getItem(KEY_FRIENDS) || '[]');
          if (!Array.isArray(raw)) return [];
          return raw
            .map((f) => (typeof f === 'string'
              ? { pubkey: f, alias: '', muted: false }
              : (f && typeof f === 'object' && typeof f.pubkey === 'string')
                ? { pubkey: f.pubkey.toLowerCase(), alias: (f.alias || '').slice(0, 40), muted: !!f.muted }
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
          if (Array.isArray(list) && list.length) return list.filter((u) => typeof u === 'string' && u.startsWith('ws'));
        } catch {}
        return DEFAULT_RELAYS;
      };
      function escapeHTML(s) {
        return (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
      }
      const shortPk = (pk) => (pk ? \\\`\\\${pk.slice(0, 8)}…\\\${pk.slice(-4)}\\\` : '—');
      function nameFor(pubkey, friend) {
        const prof = readProfiles()[pubkey];
        return friend?.alias || (prof && (prof.display_name || prof.name)) || shortPk(pubkey);
      }

      const friends = readFriends();
      if (!friends.length) return;

      dismissEl?.addEventListener('click', () => {
        try { localStorage.setItem(KEY_HIDDEN, '1'); } catch {}
        sectionEl.hidden = true;
      });

      const newestByAuthor = new Map();
      const openSockets = [];
      const authors = friends.map((f) => f.pubkey);
      const subId = \\\`sp-chfr-\\\${Math.random().toString(36).slice(2, 10)}\\\`;
      const filter = { kinds: [SYNC_KIND], authors, '#d': [D_TAG], limit: authors.length * 2 };
      const relays = getRelays();

      function ingest(ev) {
        if (!ev || ev.kind !== SYNC_KIND || typeof ev.content !== 'string') return;
        if (typeof ev.pubkey !== 'string' || typeof ev.created_at !== 'number') return;
        const isOurs = Array.isArray(ev.tags) && ev.tags.some((t) => Array.isArray(t) && t[0] === 'd' && t[1] === D_TAG);
        if (!isOurs) return;
        let body;
        try { body = JSON.parse(ev.content); } catch { return; }
        const saved = Array.isArray(body?.saved?.value) ? body.saved.value : [];
        const prior = newestByAuthor.get(ev.pubkey);
        if (!prior || ev.created_at > prior.created_at) {
          newestByAuthor.set(ev.pubkey, { created_at: ev.created_at, saved });
        }
      }

      function paint() {
        const friendsLive = readFriends();
        const counts = new Map(); // blockId → { count, savers:Set, firstPicker, firstAt }
        for (const [pubkey, entry] of newestByAuthor) {
          if (!friendsLive.some((f) => f.pubkey === pubkey)) continue;
          const seen = new Set();
          for (const id of entry.saved) {
            if (typeof id !== 'string' || seen.has(id) || !channelBlockSet.has(id)) continue;
            seen.add(id);
            const slot = counts.get(id) || { count: 0, savers: new Set(), firstPicker: pubkey, firstAt: entry.created_at };
            slot.count += 1;
            slot.savers.add(pubkey);
            if (entry.created_at < slot.firstAt) {
              slot.firstPicker = pubkey;
              slot.firstAt = entry.created_at;
            }
            counts.set(id, slot);
          }
        }
        const rows = Array.from(counts.entries())
          .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
          .slice(0, MAX_ROWS);

        if (!rows.length) {
          sectionEl.hidden = true;
          return;
        }
        sectionEl.hidden = false;
        if (metaEl) metaEl.textContent = \\\`\\\${rows.length} in \\\${channelCode} · \\\${friendsLive.length} following\\\`;

        rowsEl.innerHTML = '';
        for (const [id, info] of rows) {
          const meta = channelLookup[id] || {};
          const pickerFriend = friendsLive.find((f) => f.pubkey === info.firstPicker);
          const pickerName = pickerFriend ? nameFor(info.firstPicker, pickerFriend) : shortPk(info.firstPicker);
          const saverCount = info.savers.size;
          const li = document.createElement('li');
          li.className = 'sp-ch-friends-row';
          li.innerHTML = \\\`
            <a href="/sparrow/b/\\\${escapeHTML(id)}" class="sp-ch-friends-link">
              <span class="sp-ch-friends-badge">×\\\${saverCount}</span>
              <span class="sp-ch-friends-id">№ \\\${escapeHTML(id)}</span>
              <span class="sp-ch-friends-title">\\\${escapeHTML(meta.title || 'unknown block')}</span>
              <span class="sp-ch-friends-picker">⭐ \\\${escapeHTML(pickerName)}</span>
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
              ingest(frame[2]);
            } else if (frame[0] === 'EOSE' && frame[1] === subId) {
              try { ws.send(JSON.stringify(['CLOSE', subId])); } catch {}
              try { ws.close(); } catch {}
              paint();
            }
          });
          setTimeout(() => { try { if (ws.readyState <= 1) ws.close(); } catch {} }, 6000);
        } catch {}
      }
      setTimeout(paint, 2500);

      window.addEventListener('beforeunload', () => {
        for (const ws of openSockets) { try { ws.close(); } catch {} }
      });
    })();
  <\/script> `])), maybeRenderHead(), addAttribute(`--ch: var(--ch-${ch.code.toLowerCase()});`, "style"), ch.code, ch.name, ch.purpose, blocks.length, firstBlock && lastBlock && renderTemplate`<span>
window · <code>${fmtDate(firstBlock.data.timestamp)}</code> → <code>${fmtDate(lastBlock.data.timestamp)}</code> </span>`, addAttribute(`/c/${ch.slug}`, "href"), addAttribute(`/c/${ch.slug}.rss`, "href"), addAttribute(`friends on ${ch.code}`, "aria-label"), ch.code, unescapeHTML(JSON.stringify({ channelBlockIds, channelLookup, channelCode: ch.code })), addAttribute(`${ch.name} broadcasts`, "aria-label"), ch.code, addAttribute(`filter ${ch.name.toLowerCase()} — title, dek, mood`, "placeholder"), moods.length > 0 && renderTemplate`<div class="sp-moods" aria-label="mood filter"> <span class="sp-kicker" style="color: var(--sp-mute); margin-right: 6px;">moods</span> ${moods.map((m) => renderTemplate`<button type="button" class="sp-mood-chip"${addAttribute(m, "data-sp-mood")}>${m}</button>`)} </div>`, blocks.length === 0 ? renderTemplate`<div class="sp-saved-empty"> <p class="sp-kicker">∅ silence</p> <h2>No broadcasts in ${ch.name} yet.</h2> <p>Check back — or tune in to <a class="sp-link" href="/sparrow">all channels</a>.</p> </div>` : renderTemplate`<ol class="sp-receipts" data-sp-receipts> ${blocks.map((b, i) => renderTemplate`<li class="sp-receipt"${addAttribute(`--ch: var(--ch-${b.data.channel.toLowerCase()});`, "style")}${addAttribute(b.data.channel, "data-sp-ch")}${addAttribute(i, "data-sp-idx")}${addAttribute(b.data.id, "data-sp-block-id")}${addAttribute(b.data.mood ?? "", "data-sp-mood")}> <a${addAttribute(`/sparrow/b/${b.data.id}`, "href")}${addAttribute(renderTransition($$result2, "suxt7knb", "", `b-${b.data.id}`), "data-astro-transition-scope")}> <header class="sp-r-head"> <span class="sp-r-stamp" aria-hidden="true"> <span class="sp-r-stamp__ch">${b.data.channel}</span> <span class="sp-r-stamp__type">${b.data.type}</span> </span> <span class="sp-r-meta"> <span class="sp-r-id">№ ${b.data.id}</span> <span class="sp-r-sep">·</span> <time${addAttribute(b.data.timestamp.toISOString(), "datetime")}>${fmtDate(b.data.timestamp)}</time> </span> </header> <h3 class="sp-r-title">${b.data.title}</h3> ${b.data.dek && renderTemplate`<p class="sp-r-dek">${b.data.dek}</p>`} <footer class="sp-r-foot"> <span class="sp-r-bars"${addAttribute(signalBars(b.data.mood), "data-bars")} aria-hidden="true"> <i></i><i></i><i></i><i></i><i></i> </span> <span class="sp-r-channel-name">${ch.name}</span> ${b.data.mood && renderTemplate`<span class="sp-r-mood">· mood <code>${b.data.mood}</code></span>`} </footer> </a> </li>`)} </ol>`) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sparrow/ch/[slug].astro", "self");

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sparrow/ch/[slug].astro";
const $$url = "/sparrow/ch/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$slug,
    file: $$file,
    getStaticPaths,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
